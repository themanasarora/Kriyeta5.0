import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEyeContact } from '../hooks/useEyeContact';
import InteractiveBackground from './InteractiveBackground';
import API_BASE_URL from '../api/config';

const FILLER_REGEX = /\b(um+|uh+|uhh+|hmm+|err+|like|you know|basically|literally|sort of|kind of|right\?|okay so)\b/gi;

const InterviewRoom = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { summary, score, role, difficulty, totalQuestions } = location.state || {};

  const videoRef          = useRef(null);
  const playbackRef       = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const audioRecorderRef  = useRef(null);
  const recognitionRef    = useRef(null);
  const videoChunksRef    = useRef([]);
  const audioChunksRef    = useRef([]);
  const recordingStartRef = useRef(null);
  const localStreamRef    = useRef(null);

  const [question, setQuestion]       = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const [recordingState, setRecordingState]     = useState('idle');
  const [liveTranscript, setLiveTranscript]     = useState('');
  const [serverTranscript, setServerTranscript] = useState('');
  const [transcribeError, setTranscribeError]   = useState('');

  const [phase, setPhase]               = useState('interview');
  const [answerFeedback, setAnswerFeedback] = useState('');
  const [isFetchingNext, setIsFetchingNext] = useState(false);

  const [fillerEvents, setFillerEvents] = useState([]);
  const [qnaList, setQnaList]           = useState([]);
  const [evalData, setEvalData]         = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [finalConfidence, setFinalConfidence] = useState(null);

  // ── Anti-cheat strike system ──────────────────────────────────────────────
  const [strikes, setStrikes]                   = useState(0);
  const [showStrikeWarning, setShowStrikeWarning] = useState(false);
  const [strikeReason, setStrikeReason]           = useState('');
  const [terminatedByStrikes, setTerminatedByStrikes] = useState(false);
  const strikesRef = useRef(0);   // mirror for use inside event callbacks
  const phaseRef   = useRef('interview'); // mirror so event handler always has fresh phase

  const { eyeContactPercent, getStats } = useEyeContact(videoRef);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92; u.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const eng = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || voices.find(v => v.lang === 'en-US') || voices[0];
    if (eng) u.voice = eng;
    window.speechSynthesis.speak(u);
  }, []);

  const detectFillers = useCallback((newWords, questionIdx) => {
    const elapsed = recordingStartRef.current ? (Date.now() - recordingStartRef.current) / 1000 : 0;
    const matches = [...newWords.matchAll(FILLER_REGEX)];
    if (matches.length > 0) {
      const events = matches.map(m => ({
        word: m[0].toLowerCase(),
        timestamp: Math.round(elapsed * 10) / 10,
        questionIdx,
      }));
      setFillerEvents(prev => [...prev, ...events]);
    }
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR && !recognitionRef.current) {
      const recog = new SR();
      recog.continuous     = true;
      recog.interimResults = true;
      recog.lang           = 'en-US';
      recog.maxAlternatives = 1;

      recog.onresult = (event) => {
        let finalChunk = '';
        let interimChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalChunk += t + ' ';
          else interimChunk += t;
        }
        setLiveTranscript(prev => (finalChunk ? prev + finalChunk : prev + interimChunk));
        if (finalChunk) detectFillers(finalChunk, currentStep);
      };

      recognitionRef.current = recog;
    }

    const initSession = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Try standard fallback codecs if vp9 fails
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
          ? 'video/webm;codecs=vp9,opus' 
          : 'video/webm';
        
        const videoRecorder = new MediaRecorder(stream, { mimeType });
        videoRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) videoChunksRef.current.push(e.data);
        };
        videoRecorder.start(1000);
        mediaRecorderRef.current = videoRecorder;
        recordingStartRef.current = Date.now();

        setTimeout(() => {
          speak(`Hello! Welcome to your mock interview for the ${role} role. When you're ready, click Start Recording to answer each question.`);
        }, 500);
      } catch (err) {
        console.error('Hardware init error:', err);
        alert('Camera/microphone access denied.');
      }
    };

    initSession();

    return () => {
      window.speechSynthesis.cancel();
      try { recognitionRef.current?.stop(); } catch (e) {}
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchQuestion(1, '', '');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // CRITICAL FIX: Rebind the webcam to the video element if it unmounted during a different phase
  useEffect(() => {
    if (phase === 'interview' && videoRef.current && localStreamRef.current) {
      if (videoRef.current.srcObject !== localStreamRef.current) {
        videoRef.current.srcObject = localStreamRef.current;
      }
    }
  });

  // Keep refs in sync with state so event listeners always see fresh values
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { strikesRef.current = strikes; }, [strikes]);

  // ── Tab-switch detection (with cooldown to avoid false positives) ──────────
  useEffect(() => {
    const COOLDOWN_MS = 5000; // minimum gap between consecutive strikes
    let lastStrikeAt = 0;

    const issueStrike = (reason) => {
      // Only penalise during the active interview phase
      if (phaseRef.current === 'finished' || phaseRef.current === 'feedback') return;

      const now = Date.now();
      if (now - lastStrikeAt < COOLDOWN_MS) return; // ignore rapid-fire events
      lastStrikeAt = now;

      const next = strikesRef.current + 1;
      strikesRef.current = next;
      setStrikes(next);
      setStrikeReason(reason);
      setShowStrikeWarning(true);

      if (next >= 3) {
        setTerminatedByStrikes(true);
        setTimeout(() => {
          setShowStrikeWarning(false);
          finishInterview();
        }, 2800);
      } else {
        setTimeout(() => setShowStrikeWarning(false), 3000);
      }
    };

    // visibilitychange fires when the tab is hidden (most reliable signal)
    const onVisibilityChange = () => {
      if (document.hidden) issueStrike('Tab switch detected');
    };

    // blur fires on Alt+Tab / app switch — but NOT on in-page interactions
    // We skip very-short blurs (< 200 ms) to ignore accidental focus losses
    let blurTimer = null;
    const onBlur = () => {
      blurTimer = setTimeout(() => issueStrike('Window focus lost — possible tab switch'), 200);
    };
    const onFocus = () => {
      clearTimeout(blurTimer);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      clearTimeout(blurTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchQuestion = async (step, prevQ, prevA) => {
    setIsFetchingNext(true);
    try {
      const userStr = sessionStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const res = await axios.post(`${API_BASE_URL}/api/generate-question`, {
        summary, role, difficulty,
        currentStep: step,
        prev_question: prevQ,
        prev_answer: prevA,
        email: user?.email
      });
      const nextQ = res.data.next_question;
      const fb    = res.data.answer_feedback || '';
      setQuestion(nextQ);
      if (fb) setAnswerFeedback(fb);
      setCurrentStep(step);
      speak(nextQ);
    } catch (err) {
      console.error('Fetch question error:', err);
      setQuestion('Tell me about a challenging project you worked on.');
    } finally {
      setIsFetchingNext(false);
    }
  };

  const startRecording = () => {
    if (!localStreamRef.current) return;
    
    // Stop the AI's speaking voice so it isn't picked up by the mic
    window.speechSynthesis.cancel();

    setLiveTranscript('');
    setServerTranscript('');
    setTranscribeError('');
    audioChunksRef.current = [];

    const audioStream = new MediaStream(localStreamRef.current.getAudioTracks());
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    const audioRec = new MediaRecorder(audioStream, { mimeType });
    audioRec.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    audioRec.start(500);
    audioRecorderRef.current = audioRec;

    try { recognitionRef.current?.start(); } catch (e) {}
    setRecordingState('recording');
  };

  const stopAndTranscribe = async () => {
    try { recognitionRef.current?.stop(); } catch (e) {}
    setRecordingState('transcribing');

    await new Promise((resolve) => {
      const rec = audioRecorderRef.current;
      if (!rec || rec.state === 'inactive') { resolve(); return; }
      rec.onstop = resolve;
      rec.stop();
    });

    const mimeType = audioRecorderRef.current?.mimeType || 'audio/webm';
    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'answer.webm');
      const res = await axios.post(`${API_BASE_URL}/api/transcribe`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      const text = res.data.transcript || '';
      setServerTranscript(text || liveTranscript.trim() || 'No speech detected.');
    } catch (err) {
      console.error('Transcription error:', err);
      const fallback = liveTranscript.trim();
      if (fallback) {
        setServerTranscript(fallback);
        setTranscribeError('Server transcription failed — showing browser transcript as fallback.');
      } else {
        setTranscribeError('Transcription failed. Please retry.');
        setServerTranscript('');
      }
    }
    setRecordingState('reviewing');
  };

  const retryAnswer = () => {
    setServerTranscript('');
    setLiveTranscript('');
    setTranscribeError('');
    audioChunksRef.current = [];
    setRecordingState('idle');
  };

  const submitAnswer = () => {
    const answerText = serverTranscript.trim() || liveTranscript.trim() || 'No answer provided.';
    const qa = { question, answer: answerText };
    setQnaList(prev => [...prev, qa]);
    setRecordingState('idle');
    setServerTranscript('');
    setLiveTranscript('');

    if (currentStep < Number(totalQuestions)) {
      setPhase('feedback');
      fetchQuestion(currentStep + 1, question, answerText);
    } else {
      finishInterview([...qnaList, qa]);
    }
  };

  const proceedToNext = () => {
    setAnswerFeedback('');
    setPhase('interview');
  };

  const finishInterview = async (finalQna = qnaList) => {
    window.speechSynthesis.cancel();
    try { recognitionRef.current?.stop(); } catch (e) {}

    setPhase('finished');
    phaseRef.current = 'finished'; // prevent further strikes
    setIsEvaluating(true);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        finalizeVideo();
      };
      mediaRecorderRef.current.stop();
    } else {
      finalizeVideo();
    }

    // ── Guaranteed camera & mic teardown ──────────────────────────────────
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    try {
      const userStr = sessionStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      // ── Confidence scoring on the full transcript ──────────────────────────
      let confidenceScore = null;
      let confidenceLabel = null;
      try {
        const fullTranscript = finalQna.map(q => q.answer).join(' ');
        const totalFillers   = fillerEvents.length;
        const confRes = await axios.post(`${API_BASE_URL}/api/score-confidence`, {
          transcript:   fullTranscript,
          filler_count: totalFillers,
        });
        confidenceScore = confRes.data.confidence_score;
        confidenceLabel = confRes.data.label;
        setFinalConfidence(confRes.data);
      } catch (confErr) {
        console.warn('Confidence scoring failed:', confErr);
      }
      // ── Evaluate interview ─────────────────────────────────────────────────
      const res = await axios.post(`${API_BASE_URL}/api/evaluate-interview`, {
        role, difficulty, ats_score: score, qna_list: finalQna, email: user?.email,
        confidence_score: confidenceScore,
        confidence_label: confidenceLabel,
      });
      
      if (user && res.data.streak_count) {
          user.streak_count = res.data.streak_count;
          sessionStorage.setItem('user', JSON.stringify(user));
      }
      
      setEvalData(res.data);
      
    } catch (err) {
      console.error('Eval error:', err);
      setIsEvaluating(false);
    }
  };

  const finalizeVideo = () => {
    if (videoChunksRef.current.length === 0) return;
    const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    setRecordingUrl(url);
  };

  // Hack for Chrome's WebM duration bug so timeline seeking works
  const handleVideoLoadedMetadata = () => {
    const v = playbackRef.current;
    if (!v) return;
    if (v.duration === Infinity || isNaN(v.duration)) {
      v.currentTime = 1e99;
      v.onseeked = () => {
        v.onseeked = null;
        v.currentTime = 0;
      };
    }
  };

  const seekTo = (timestamp) => {
    if (playbackRef.current) {
      playbackRef.current.currentTime = timestamp;
      playbackRef.current.play();
    }
  };

  // ─── RENDER: Feedback Phase ──────────────────────────────────────────────────
  if (phase === 'feedback') {
    return (
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <InteractiveBackground />
        <div className="glass-panel" style={{ maxWidth: '700px', width: '100%', padding: '50px', textAlign: 'center' }}>

          <h2 style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }}>Answer Received!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Question {currentStep - 1} of {totalQuestions}</p>

          {answerFeedback ? (
            <div style={{ background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.2)', borderRadius: '12px', padding: '20px 24px', marginBottom: '36px', textAlign: 'left' }}>
              <p style={{ color: '#00d2ff', fontWeight: '600', marginBottom: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Feedback</p>
              <p style={{ margin: 0, lineHeight: '1.7', fontSize: '1.05rem' }}>{answerFeedback}</p>
            </div>
          ) : (
            <div style={{ padding: '30px', color: 'var(--text-secondary)', marginBottom: '36px' }}>
              {isFetchingNext ? 'Preparing next question...' : 'Moving to next question...'}
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={proceedToNext} disabled={isFetchingNext} style={{ padding: '16px 40px', fontSize: '1rem' }}>
              {isFetchingNext ? '⏳ Loading next question...' : `▶ Next Question (${currentStep} of ${totalQuestions})`}
            </button>
            <button onClick={() => finishInterview()} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: '12px', padding: '16px 24px', cursor: 'pointer' }}>
              End Early
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: Finished / Results Phase ───────────────────────────────────────
  if (phase === 'finished') {
    const eyeStats = getStats();
    const totalFillers = fillerEvents.length;
    const fillersByWord = fillerEvents.reduce((acc, e) => { acc[e.word] = (acc[e.word] || 0) + 1; return acc; }, {});

    return (
      <div style={{ position: 'relative', zIndex: 1, padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%', alignSelf: 'flex-start', boxSizing: 'border-box' }}>
        <InteractiveBackground />
        <h1 className="glow-text" style={{ position: 'relative', zIndex: 2, textAlign: 'center', fontSize: '2.2rem', marginBottom: '24px' }}>Interview Complete</h1>

        {/* ── Terminated-by-strikes alert ── */}
        {terminatedByStrikes && (
          <div style={{
            background: 'rgba(255,75,43,0.12)',
            border: '1px solid rgba(255,75,43,0.45)',
            borderRadius: '14px', padding: '16px 24px',
            display: 'flex', alignItems: 'center', gap: '16px',
            marginBottom: '24px',
          }}>
            <span style={{ fontSize: '1.8rem' }}>🚫</span>
            <div>
              <p style={{ margin: 0, fontWeight: '700', color: '#ff4b2b', fontSize: '1rem' }}>
                Interview auto-terminated — 3 strikes reached
              </p>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>
                Repeated tab-switching or window focus violations were detected. The session has been scored based on completed answers.
              </p>
            </div>
          </div>
        )}

        {isEvaluating && (
          <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', marginBottom: '30px' }}>
            <p style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>AI is scoring your performance...</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          <div className="glass-panel" style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Interview Recording</h3>
            {recordingUrl ? (
              <video 
                ref={playbackRef} 
                src={recordingUrl} 
                onLoadedMetadata={handleVideoLoadedMetadata}
                controls 
                style={{ width: '100%', borderRadius: '12px', background: '#000' }} 
              />
            ) : (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Processing recording...</div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px', overflowY: 'auto', maxHeight: '420px' }}>
            <h3 style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>⏱ Analytics Timeline</h3>
            {fillerEvents.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No filler words detected.</p>
            ) : (
              <>
                <p style={{ color: 'var(--accent-red)', fontSize: '0.9rem', marginBottom: '12px' }}>
                  {totalFillers} filler word{totalFillers !== 1 ? 's' : ''} detected. Click any to jump in recording:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {Object.entries(fillersByWord).map(([word, count]) => (
                    <span key={word} style={{ background: 'rgba(255,75,43,0.15)', border: '1px solid rgba(255,75,43,0.4)', borderRadius: '20px', padding: '4px 12px', fontSize: '0.85rem' }}>
                      "{word}" × {count}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {fillerEvents.map((ev, i) => (
                    <button key={i} onClick={() => seekTo(ev.timestamp)} style={{
                      background: 'rgba(255,75,43,0.08)', border: '1px solid rgba(255,75,43,0.2)',
                      borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', color: 'white',
                      display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', transition: 'all 0.2s'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,75,43,0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,75,43,0.08)'}
                    >
                      <span style={{ color: 'var(--accent-red)', fontWeight: '700', fontSize: '0.8rem', minWidth: '45px' }}>
                        {String(Math.floor(ev.timestamp / 60)).padStart(2, '0')}:{String(Math.floor(ev.timestamp % 60)).padStart(2, '0')}
                      </span>
                      <span style={{ fontSize: '0.85rem' }}>Said "<strong style={{ color: '#ff8870' }}>{ev.word}</strong>" (Q{ev.questionIdx})</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>

            <h4 style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Eye Contact</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: eyeStats.eyeContactPercent >= 60 ? '#00ff88' : '#ffd700' }}>
              {eyeStats.eyeContactPercent}%
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              {eyeStats.eyeContactPercent >= 70 ? 'Excellent contact' : eyeStats.eyeContactPercent >= 50 ? 'Moderate contact' : 'Needs improvement'}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>

            <h4 style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Filler Words</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: totalFillers <= 3 ? '#00ff88' : totalFillers <= 8 ? '#ffd700' : '#ff4b2b' }}>
              {totalFillers}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              {totalFillers <= 3 ? 'Very fluent' : totalFillers <= 8 ? 'Slightly hesitant' : 'Work on fluency'}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>

            <h4 style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Interview Score</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
              {isEvaluating ? '...' : `${evalData?.final_score ?? '--'}%`}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>AI Evaluation</p>
          </div>

          {/* ── Confidence Score Card ── */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Ambient glow based on label */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
              background: finalConfidence
                ? (finalConfidence.confidence_score >= 70 ? 'radial-gradient(circle, #00ff88, transparent)'
                  : finalConfidence.confidence_score >= 40 ? 'radial-gradient(circle, #ffd700, transparent)'
                  : 'radial-gradient(circle, #ff4b2b, transparent)')
                : 'none',
            }} />
            <h4 style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Confidence Score
            </h4>
            <div style={{
              fontSize: '2.5rem', fontWeight: '800',
              color: finalConfidence
                ? (finalConfidence.confidence_score >= 70 ? '#00ff88'
                  : finalConfidence.confidence_score >= 40 ? '#ffd700'
                  : '#ff4b2b')
                : 'var(--text-secondary)',
            }}>
              {isEvaluating && !finalConfidence ? '...' : (finalConfidence?.confidence_score ?? '--')}
            </div>
            {finalConfidence ? (
              <>
                <p style={{
                  fontSize: '0.85rem', margin: '4px 0 6px', fontWeight: '600',
                  color: finalConfidence.confidence_score >= 70 ? '#00ff88'
                    : finalConfidence.confidence_score >= 40 ? '#ffd700' : '#ff4b2b',
                }}>
                  {finalConfidence.label} Confidence
                </p>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Hedging: <strong>{finalConfidence.breakdown?.hedging}</strong>
                  &nbsp;·&nbsp;
                  Fluency: <strong>{finalConfidence.breakdown?.fluency}</strong>
                  &nbsp;·&nbsp;
                  Vocab: <strong>{finalConfidence.breakdown?.vocabulary}</strong>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>ML Classifier</p>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 20px' }}>Performance Breakdown</h3>
          {evalData ? (
            <>
              <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: '24px' }}>{evalData.feedback_summary}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <h4 style={{ color: '#00ff88', marginBottom: '12px' }}>Strengths</h4>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {evalData.strengths?.map((s, i) => <li key={i} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 style={{ color: 'var(--accent-red)', marginBottom: '12px' }}>Areas to Improve</h4>
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {evalData.weaknesses?.map((w, i) => <li key={i} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{w}</li>)}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
              No performance data available. This usually happens if the interview was ended before any questions were answered.
            </p>
          )}
        </div>

        <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 20px' }}>Full Q&A Transcript</h3>
          {qnaList.length > 0 ? qnaList.map((qa, i) => (
            <div key={i} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: i < qnaList.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
              <p style={{ color: 'var(--accent-cyan)', fontWeight: '600', marginBottom: '6px' }}>Q{i + 1}: {qa.question}</p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>{qa.answer}</p>
            </div>
          )) : (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
              No questions were answered during this session.
            </p>
          )}
        </div>

        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <button 
            className={`btn-primary ${evalData && evalData._id ? 'pulse-dot' : ''}`} 
            style={{ 
              background: evalData && evalData._id ? 'linear-gradient(135deg, #00d2ff, #3a7bd5)' : 'rgba(255,255,255,0.1)', 
              padding: '16px 48px', 
              fontSize: '1rem',
              opacity: evalData && evalData._id ? 1 : 0.5,
              cursor: evalData && evalData._id ? 'pointer' : 'not-allowed',
              border: evalData && evalData._id ? 'none' : '1px solid rgba(255,255,255,0.2)'
            }} 
            disabled={!evalData || !evalData._id}
            onClick={() => evalData && evalData._id && navigate(`/result/${evalData._id}`)}
          >
            🔗 Save & View Public Result
          </button>
          <button className="btn-primary" style={{ padding: '16px 48px', fontSize: '1rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/setup')}>
            Return to Setup
          </button>
        </div>
      </div>
    );
  }

  // ─── RENDER: Interview Phase ──────────────────────────────────────────────────
  const isRecording    = recordingState === 'recording';
  const isTranscribing = recordingState === 'transcribing';
  const isReviewing    = recordingState === 'reviewing';
  const isIdle         = recordingState === 'idle';

  return (
    <div style={{ position: 'relative', zIndex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', alignSelf: 'flex-start', boxSizing: 'border-box' }}>
      <InteractiveBackground />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0 }}>
            {role} <span style={{ color: 'var(--accent-cyan)' }}>Mock Interview</span>
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
            Question {currentStep} of {totalQuestions}
            &nbsp;·&nbsp;
            <span style={{ color: fillerEvents.length <= 3 ? '#00ff88' : '#ffd700' }}>
              {fillerEvents.length} filler{fillerEvents.length !== 1 ? 's' : ''} so far
            </span>
            &nbsp;·&nbsp;
            <span style={{ color: eyeContactPercent >= 60 ? '#00ff88' : '#ffd700' }}>
              {eyeContactPercent}% eye contact
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isRecording && (
            <div className="pulse-dot" style={{ background: 'var(--accent-red)', width: '12px', height: '12px', borderRadius: '50%' }} />
          )}

          {/* ── Strike indicator ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: strikes === 0 ? 'rgba(255,255,255,0.05)'
              : strikes === 1 ? 'rgba(255,170,0,0.12)'
              : 'rgba(255,75,43,0.18)',
            border: `1px solid ${
              strikes === 0 ? 'rgba(255,255,255,0.1)'
              : strikes === 1 ? 'rgba(255,170,0,0.45)'
              : 'rgba(255,75,43,0.6)'}`,
            borderRadius: '10px', padding: '8px 14px',
            transition: 'all 0.4s ease',
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Strikes</span>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: i < strikes
                  ? (strikes >= 3 ? '#ff4b2b' : strikes === 2 ? '#ff8c00' : '#ffd700')
                  : 'rgba(255,255,255,0.12)',
                border: `1px solid ${
                  i < strikes
                    ? (strikes >= 3 ? 'rgba(255,75,43,0.8)' : 'rgba(255,170,0,0.6)')
                    : 'rgba(255,255,255,0.1)'}`,
                transition: 'all 0.3s ease',
                boxShadow: i < strikes && strikes >= 2 ? '0 0 6px rgba(255,75,43,0.6)' : 'none',
              }} />
            ))}
          </div>

          <button
            onClick={() => finishInterview()}
            style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            End Early
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div style={{ position: 'relative' }}>
          <div className="glass-panel" style={{ padding: '10px', overflow: 'hidden' }}>
            <video
              ref={videoRef}
              autoPlay playsInline muted
              style={{ width: '100%', borderRadius: '12px', transform: 'scaleX(-1)', background: '#000', minHeight: '380px', display: 'block' }}
            />
          </div>
          {isRecording && (
            <div className="pulse-dot" style={{
              position: 'absolute', bottom: '26px', left: '26px',
              background: 'rgba(255,75,43,0.92)', padding: '8px 18px',
              borderRadius: '20px', fontWeight: '600', fontSize: '0.9rem'
            }}>
              Recording...
            </div>
          )}
          {isTranscribing && (
            <div style={{
              position: 'absolute', bottom: '26px', left: '26px',
              background: 'rgba(0,210,255,0.15)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(0,210,255,0.3)',
              padding: '8px 18px', borderRadius: '20px', fontWeight: '600', fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--accent-cyan)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              Transcribing...
            </div>
          )}
          <div style={{
            position: 'absolute', top: '26px', right: '26px',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            borderRadius: '12px', padding: '8px 14px', fontSize: '0.8rem'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Fillers: </span>
            <span style={{ color: fillerEvents.length <= 3 ? '#00ff88' : '#ff4b2b', fontWeight: '700' }}>{fillerEvents.length}</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1.5px' }}>
            AI Interviewer
          </div>

          <div style={{ flex: 1 }}>
            {isFetchingNext ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--accent-cyan)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                Generating question...
              </div>
            ) : (
              <h3 style={{ fontSize: '1.7rem', lineHeight: '1.45', fontWeight: '500', margin: 0 }}>
                {question || 'Preparing your interview...'}
              </h3>
            )}
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => speak(question)} 
              disabled={isFetchingNext || !question}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🔊 Replay Question
            </button>
          </div>
        </div>
      </div>

      {/* ── Live Transcript Panel ── */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px', minHeight: '120px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isRecording ? '#ff4b2b' : '#00d2ff', boxShadow: isRecording ? '0 0 8px #ff4b2b' : '0 0 8px #00d2ff' }} />
          <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Live Transcript
          </span>
        </div>
        
        {isIdle && (
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '1rem' }}>
            Click Start Recording to answer the question. Your speech will be transcribed here.
          </p>
        )}

        {isRecording && (
          <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.6', color: liveTranscript ? 'white' : 'var(--text-secondary)' }}>
            {liveTranscript || 'Listening...'}
          </p>
        )}

        {isTranscribing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-cyan)' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--accent-cyan)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            <span style={{ fontWeight: '500', fontSize: '1rem' }}>Processing final transcript via Groq Whisper...</span>
          </div>
        )}

        {isReviewing && (
          <>
            {transcribeError && (
              <div style={{ marginBottom: '8px', padding: '10px 14px', background: 'rgba(255,75,43,0.1)', border: '1px solid rgba(255,75,43,0.3)', borderRadius: '10px', fontSize: '0.85rem', color: '#ff8870' }}>
                ⚠️ {transcribeError}
              </div>
            )}
            <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.6', color: serverTranscript ? 'white' : 'var(--text-secondary)' }}>
              {serverTranscript || 'No speech detected. Please retry.'}
            </p>
          </>
        )}
      </div>

      {/* ── Bottom Control Dock (Sticky) ── */}
      <div style={{ 
        position: 'sticky', 
        bottom: '0', 
        background: 'rgba(10, 10, 15, 0.8)', 
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        margin: '20px -24px -24px',
        padding: '20px 24px',
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px',
        zIndex: 100
      }}>
        {isIdle && (
          <button id="start-recording-btn" onClick={startRecording} className="btn-primary" disabled={isFetchingNext} style={{ padding: '16px 48px', fontSize: '1.1rem', borderRadius: '100px', minWidth: '280px', boxShadow: '0 8px 24px rgba(0, 210, 255, 0.3)' }}>
            🎙 Start Recording
          </button>
        )}

        {isRecording && (
          <button id="stop-recording-btn" onClick={stopAndTranscribe} style={{ padding: '16px 48px', fontSize: '1.1rem', borderRadius: '100px', minWidth: '280px', background: 'linear-gradient(135deg, #ff4b2b, #ff8870)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 8px 24px rgba(255, 75, 43, 0.4)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            ⏹ Stop &amp; Transcribe
          </button>
        )}

        {isReviewing && (
          <>
            <button id="retry-answer-btn" onClick={retryAnswer} style={{ padding: '16px 40px', fontSize: '1.05rem', borderRadius: '100px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              🔄 Retry
            </button>
            <button id="submit-answer-btn" onClick={submitAnswer} disabled={!serverTranscript} style={{ padding: '16px 48px', fontSize: '1.05rem', borderRadius: '100px', background: serverTranscript ? 'linear-gradient(135deg, #00ff88, #00d2ff)' : 'rgba(255,255,255,0.1)', border: 'none', color: serverTranscript ? '#000' : 'var(--text-secondary)', fontWeight: '700', cursor: serverTranscript ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: serverTranscript ? '0 8px 24px rgba(0,255,136,0.3)' : 'none' }} onMouseEnter={e => { if(serverTranscript) e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { if(serverTranscript) e.currentTarget.style.transform = 'translateY(0)' }}>
              ✅ Submit Answer
            </button>
          </>
        )}
      </div>

      {fillerEvents.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px 24px', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>Filler Word Frequency</span>
            <span>{fillerEvents.length} detected</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(fillerEvents.reduce((a, e) => { a[e.word] = (a[e.word] || 0) + 1; return a; }, {})).map(([w, c]) => (
              <span key={w} style={{ background: 'rgba(255,75,43,0.15)', border: '1px solid rgba(255,75,43,0.3)', borderRadius: '20px', padding: '3px 10px', fontSize: '0.8rem' }}>
                "{w}" ×{c}
              </span>
            ))}
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes strikeSlideIn {
          0%   { opacity: 0; transform: scale(0.85); }
          15%  { opacity: 1; transform: scale(1.04); }
          25%  { transform: scale(1); }
          80%  { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.95); }
        }
        @keyframes shakeX {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-14px); }
          40%     { transform: translateX(14px); }
          60%     { transform: translateX(-10px); }
          80%     { transform: translateX(10px); }
        }
      `}</style>

      {/* ── Strike Warning Overlay ── */}
      {showStrikeWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: strikes >= 3
            ? 'rgba(255,0,0,0.18)'
            : 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'strikeSlideIn 3s ease forwards',
        }}>
          <div style={{
            textAlign: 'center', maxWidth: '480px', padding: '20px',
            animation: 'shakeX 0.5s ease 0.1s',
          }}>
            {/* Strike count pips */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: i < strikes ? '#ff4b2b' : 'rgba(255,255,255,0.12)',
                  boxShadow: i < strikes ? '0 0 16px rgba(255,75,43,0.8)' : 'none',
                  border: `2px solid ${i < strikes ? '#ff4b2b' : 'rgba(255,255,255,0.2)'}`,
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </div>

            <div style={{
              fontSize: strikes >= 3 ? '5rem' : '4rem',
              lineHeight: 1, marginBottom: '12px',
              filter: 'drop-shadow(0 0 20px rgba(255,75,43,0.7))',
            }}>
              {strikes >= 3 ? '🚫' : '⚠️'}
            </div>

            <h2 style={{
              fontSize: strikes >= 3 ? '2rem' : '1.7rem',
              fontFamily: 'Outfit, sans-serif',
              color: strikes >= 3 ? '#ff4b2b' : '#ffd700',
              margin: '0 0 10px',
              textShadow: `0 0 20px ${strikes >= 3 ? 'rgba(255,75,43,0.6)' : 'rgba(255,215,0,0.5)'}`,
            }}>
              {strikes >= 3 ? 'INTERVIEW TERMINATED' : `STRIKE ${strikes} of 3`}
            </h2>

            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', margin: '0 0 8px', lineHeight: '1.5' }}>
              {strikeReason}
            </p>

            {strikes < 3 ? (
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', margin: 0 }}>
                {3 - strikes} more violation{3 - strikes !== 1 ? 's' : ''} will end the interview automatically.
              </p>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', margin: 0 }}>
                3 strikes reached. Generating your final report...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewRoom;