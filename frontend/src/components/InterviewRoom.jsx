import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEyeContact } from '../hooks/useEyeContact';

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

  const fetchQuestion = async (step, prevQ, prevA) => {
    setIsFetchingNext(true);
    try {
      const userStr = sessionStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const res = await axios.post('http://127.0.0.1:5000/api/generate-question', {
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
      const res = await axios.post('http://127.0.0.1:5000/api/transcribe', formData, {
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
    setIsEvaluating(true);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        finalizeVideo();
      };
      mediaRecorderRef.current.stop();
    } else {
      finalizeVideo();
    }

    try {
      const userStr = sessionStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const res = await axios.post('http://127.0.0.1:5000/api/evaluate-interview', {
        role, difficulty, ats_score: score, qna_list: finalQna, email: user?.email
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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
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
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 className="glow-text" style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '40px' }}>Interview Complete</h1>

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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
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
        </div>

        {evalData && (
          <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 20px' }}>Performance Breakdown</h3>
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
          </div>
        )}

        <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 20px' }}>Full Q&A Transcript</h3>
          {qnaList.map((qa, i) => (
            <div key={i} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: i < qnaList.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
              <p style={{ color: 'var(--accent-cyan)', fontWeight: '600', marginBottom: '6px' }}>Q{i + 1}: {qa.question}</p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>{qa.answer}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', display: 'flex', gap: '20px', justifyContent: 'center' }}>
          {evalData && evalData._id && (
            <button className="btn-primary pulse-dot" style={{ background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', padding: '16px 48px', fontSize: '1rem' }} onClick={() => navigate(`/result/${evalData._id}`)}>
              🔗 Save & View Public Result
            </button>
          )}
          <button className="btn-primary" style={{ padding: '16px 48px', fontSize: '1rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }} onClick={() => navigate('/setup')}>
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
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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

          {isIdle && (
            <button id="start-recording-btn" onClick={startRecording} className="btn-primary" disabled={isFetchingNext} style={{ padding: '18px', fontSize: '1rem', width: '100%' }}>
              🎙 Start Recording
            </button>
          )}

          {isRecording && (
            <>
              <button id="stop-recording-btn" onClick={stopAndTranscribe} style={{ padding: '18px', fontSize: '1rem', width: '100%', borderRadius: '12px', background: 'linear-gradient(135deg, #ff4b2b, #ff8870)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer' }}>
                ⏹ Stop &amp; Transcribe
              </button>
            </>
          )}

          {isTranscribing && (
            <div style={{ background: 'rgba(0,210,255,0.06)', border: '1px solid rgba(0,210,255,0.2)', borderRadius: '12px', padding: '28px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--accent-cyan)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <span style={{ fontWeight: '600' }}>Transcribing your answer…</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Groq Whisper is processing your audio
              </p>
            </div>
          )}

          {isReviewing && (
            <>
              {transcribeError && (
                <div style={{ background: 'rgba(255,75,43,0.1)', border: '1px solid rgba(255,75,43,0.3)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem', color: '#ff8870' }}>
                  ⚠️ {transcribeError}
                </div>
              )}
              <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(0,210,255,0.25)', borderRadius: '14px', padding: '20px', minHeight: '120px', maxHeight: '220px', overflowY: 'auto', boxShadow: '0 0 0 1px rgba(0,210,255,0.08) inset' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00d2ff' }} />
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Your Transcript — Review Before Submitting
                  </span>
                </div>
                <p style={{ margin: 0, lineHeight: '1.7', fontSize: '1rem', color: serverTranscript ? 'white' : 'var(--text-secondary)', fontStyle: serverTranscript ? 'normal' : 'italic' }}>
                  {serverTranscript || 'No speech detected. Please retry.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button id="retry-answer-btn" onClick={retryAnswer} style={{ flex: 1, padding: '16px', fontSize: '1rem', borderRadius: '12px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'white'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  🔄 Retry
                </button>
                <button id="submit-answer-btn" onClick={submitAnswer} disabled={!serverTranscript} style={{ flex: 2, padding: '16px', fontSize: '1rem', borderRadius: '12px', background: serverTranscript ? 'linear-gradient(135deg, #00ff88, #00d2ff)' : 'rgba(255,255,255,0.1)', border: 'none', color: serverTranscript ? '#000' : 'var(--text-secondary)', fontWeight: '700', cursor: serverTranscript ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                  ✅ Submit Answer
                </button>
              </div>
            </>
          )}
        </div>
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default InterviewRoom;