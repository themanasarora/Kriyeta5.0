import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useEyeContact } from '../hooks/useEyeContact';

// ─── Filler word pattern ──────────────────────────────────────────────────────
const FILLER_REGEX = /\b(um+|uh+|uhh+|hmm+|err+|like|you know|basically|literally|sort of|kind of|right\?|okay so)\b/gi;

const InterviewRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { summary, feedback, score, role, difficulty, totalQuestions } = location.state || {};

  // ─── Refs ──────────────────────────────────────────────────────────────────
  const videoRef         = useRef(null);
  const playbackRef      = useRef(null); // for final review playback
  const mediaRecorderRef = useRef(null);
  const recognitionRef   = useRef(null);
  const chunksRef        = useRef([]);    // use ref instead of state to avoid stale closure
  const recordingStartRef = useRef(null);
  const fullTranscriptRef = useRef('');  // accumulates ALL spoken text

  // ─── Interview state ───────────────────────────────────────────────────────
  const [question, setQuestion]         = useState('');
  const [currentStep, setCurrentStep]   = useState(0); // 0 = greeting phase
  const [isListening, setIsListening]   = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  // ─── Phase states ──────────────────────────────────────────────────────────
  const [phase, setPhase] = useState('interview'); // 'interview' | 'feedback' | 'finished'
  const [answerFeedback, setAnswerFeedback] = useState('');
  const [isFetchingNext, setIsFetchingNext] = useState(false);

  // ─── Analytics ────────────────────────────────────────────────────────────
  const [fillerEvents, setFillerEvents] = useState([]); // [{word, timestamp, questionIdx}]
  const [qnaList, setQnaList]           = useState([]);
  const [evalData, setEvalData]         = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const [recordingUrl, setRecordingUrl]   = useState('');

  // ─── Eye contact hook ─────────────────────────────────────────────────────
  const { eyeContactPercent, getStats } = useEyeContact(videoRef);

  // ─── TTS ──────────────────────────────────────────────────────────────────
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

  // ─── Filler detection helper ──────────────────────────────────────────────
  const detectFillers = useCallback((newWords, questionIdx) => {
    const elapsed = recordingStartRef.current ? (Date.now() - recordingStartRef.current) / 1000 : 0;
    const matches = [...newWords.matchAll(FILLER_REGEX)];
    if (matches.length > 0) {
      const events = matches.map(m => ({ word: m[0].toLowerCase(), timestamp: Math.round(elapsed * 10) / 10, questionIdx }));
      setFillerEvents(prev => [...prev, ...events]);
    }
  }, []);

  // ─── Init: Camera + Mic + MediaRecorder + SpeechRecognition ──────────────
  useEffect(() => {
    let localStream = null;

    // Setup SpeechRecognition with proper accumulation
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR && !recognitionRef.current) {
      const recog = new SR();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';
      recog.maxAlternatives = 1;

      recog.onresult = (event) => {
        // Walk ALL results to build the full transcript for this session
        let finalChunk = '';
        let interimChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += t + ' ';
            fullTranscriptRef.current += t + ' ';
          } else {
            interimChunk += t;
          }
        }
        // Show interim + already-spoken final text for this answer
        setLiveTranscript(finalChunk + interimChunk);

        // Filler detection on final chunks
        if (finalChunk) {
          detectFillers(finalChunk, currentStep);
        }
      };

      recog.onerror = (e) => {
        if (e.error !== 'no-speech') console.warn('STT error:', e.error);
      };

      recognitionRef.current = recog;
    }

    const initSession = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = localStream;

        // Use timeslice to get data every 1s for reliable blob
        const recorder = new MediaRecorder(localStream, { mimeType: 'video/webm;codecs=vp9,opus' });
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.start(1000); // chunk every 1 second
        mediaRecorderRef.current = recorder;
        recordingStartRef.current = Date.now();

        // Speak greeting
        setTimeout(() => {
          speak("Hello! Welcome to your mock interview for the " + role + " role. When you're ready, click Start Answering to respond to each question.");
        }, 500);

      } catch (err) {
        console.error('Hardware init error:', err);
        alert('Camera/microphone access denied. Please allow permissions and refresh.');
      }
    };

    initSession();

    return () => {
      window.speechSynthesis.cancel();
      try { if (recognitionRef.current) recognitionRef.current.stop(); } catch (e) {}
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (localStream) localStream.getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load first question on mount
  useEffect(() => {
    fetchQuestion(1, '', '');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Fetch question (with optional prev Q+A for feedback) ─────────────────
  const fetchQuestion = async (step, prevQ, prevA) => {
    setIsFetchingNext(true);
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/generate-question', {
        summary, role, difficulty,
        currentStep: step,
        prev_question: prevQ,
        prev_answer: prevA,
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

  // ─── Toggle mic ───────────────────────────────────────────────────────────
  const toggleListening = () => {
    if (!recognitionRef.current) { alert('Speech recognition not supported. Use Chrome.'); return; }

    if (isListening) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsListening(false);
    } else {
      setLiveTranscript('');
      fullTranscriptRef.current = fullTranscriptRef.current; // keep full history
      try { recognitionRef.current.start(); } catch (e) { console.log('Mic start error:', e); }
      setIsListening(true);
    }
  };

  // ─── Submit answer → go to feedback phase ────────────────────────────────
  const submitAnswer = () => {
    try { recognitionRef.current.stop(); } catch (e) {}
    setIsListening(false);

    const answerText = liveTranscript.trim() || 'No answer provided.';
    const qa = { question, answer: answerText };
    setQnaList(prev => [...prev, qa]);

    if (currentStep < Number(totalQuestions)) {
      // Show feedback, then allow user to proceed
      setPhase('feedback');
      fetchQuestion(currentStep + 1, question, answerText);
    } else {
      // Last question — finish
      finishInterview([...qnaList, qa]);
    }
  };

  // ─── Proceed after feedback ───────────────────────────────────────────────
  const proceedToNext = () => {
    setAnswerFeedback('');
    setLiveTranscript('');
    setPhase('interview');
  };

  // ─── Finish interview ─────────────────────────────────────────────────────
  const finishInterview = async (finalQna = qnaList) => {
    window.speechSynthesis.cancel();
    try { recognitionRef.current.stop(); } catch (e) {}

    // Stop recorder and collect blob
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Give recorder time to flush final chunk
    await new Promise(resolve => setTimeout(resolve, 1200));

    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
    const url  = URL.createObjectURL(blob);
    setRecordingBlob(blob);
    setRecordingUrl(url);

    // Download recording
    const a = document.createElement('a');
    a.href = url; a.download = `Interview_${role}_${Date.now()}.webm`; a.click();

    setPhase('finished');
    setIsEvaluating(true);

    try {
      const res = await axios.post('http://127.0.0.1:5000/api/evaluate-interview', {
        role, difficulty, ats_score: score, qna_list: finalQna,
      });
      setEvalData(res.data);
    } catch (err) {
      console.error('Eval error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // ─── Seek video to timestamp ──────────────────────────────────────────────
  const seekTo = (timestamp) => {
    if (playbackRef.current) {
      playbackRef.current.currentTime = timestamp;
      playbackRef.current.play();
    }
  };

  // ─── RENDER: Feedback Phase ───────────────────────────────────────────────
  if (phase === 'feedback') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div className="glass-panel" style={{ maxWidth: '700px', width: '100%', padding: '50px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
          <h2 style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }}>Answer Received!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Question {currentStep - 1} of {totalQuestions}</p>

          {answerFeedback ? (
            <div style={{ background: 'rgba(0,210,255,0.08)', border: '1px solid rgba(0,210,255,0.2)', borderRadius: '12px', padding: '20px 24px', marginBottom: '36px', textAlign: 'left' }}>
              <p style={{ color: '#00d2ff', fontWeight: '600', marginBottom: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Feedback</p>
              <p style={{ margin: 0, lineHeight: '1.7', fontSize: '1.05rem' }}>{answerFeedback}</p>
            </div>
          ) : (
            <div style={{ padding: '30px', color: 'var(--text-secondary)', marginBottom: '36px' }}>
              {isFetchingNext ? '⏳ Preparing next question...' : 'Moving to next question...'}
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={proceedToNext}
              disabled={isFetchingNext}
              style={{ padding: '16px 40px', fontSize: '1rem' }}
            >
              {isFetchingNext ? '⏳ Loading next question...' : `▶ Next Question (${currentStep} of ${totalQuestions})`}
            </button>
            <button
              onClick={() => finishInterview()}
              style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', borderRadius: '12px', padding: '16px 24px', cursor: 'pointer' }}
            >
              End Early
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: Finished / Results Phase ─────────────────────────────────────
  if (phase === 'finished') {
    const eyeStats = getStats();
    const totalFillers = fillerEvents.length;
    const fillersByWord = fillerEvents.reduce((acc, e) => { acc[e.word] = (acc[e.word] || 0) + 1; return acc; }, {});

    return (
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <h1 className="glow-text" style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '40px' }}>Interview Complete</h1>

        {isEvaluating && (
          <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', marginBottom: '30px' }}>
            <p style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>⏳ AI is scoring your performance...</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          {/* Video Playback */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>📹 Interview Recording</h3>
            {recordingUrl ? (
              <video ref={playbackRef} src={recordingUrl} controls style={{ width: '100%', borderRadius: '12px', background: '#000' }} />
            ) : (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No recording available</div>
            )}
          </div>

          {/* Timestamped Analytics */}
          <div className="glass-panel" style={{ padding: '24px', overflowY: 'auto', maxHeight: '420px' }}>
            <h3 style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>⏱ Analytics Timeline</h3>

            {fillerEvents.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>✅ No filler words detected!</p>
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
                      onMouseEnter={e => e.target.style.background = 'rgba(255,75,43,0.2)'}
                      onMouseLeave={e => e.target.style.background = 'rgba(255,75,43,0.08)'}
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

        {/* Score Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          {/* Eye Contact */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👁️</div>
            <h4 style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Eye Contact</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: eyeStats.eyeContactPercent >= 60 ? '#00ff88' : '#ffd700' }}>
              {eyeStats.eyeContactPercent}%
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              {eyeStats.eyeContactPercent >= 70 ? 'Excellent contact' : eyeStats.eyeContactPercent >= 50 ? 'Moderate contact' : 'Needs improvement'}
            </p>
          </div>

          {/* Filler Words */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎙️</div>
            <h4 style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Filler Words</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: totalFillers <= 3 ? '#00ff88' : totalFillers <= 8 ? '#ffd700' : '#ff4b2b' }}>
              {totalFillers}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>
              {totalFillers <= 3 ? 'Very fluent' : totalFillers <= 8 ? 'Slightly hesitant' : 'Work on fluency'}
            </p>
          </div>

          {/* Interview Score */}
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏆</div>
            <h4 style={{ margin: '0 0 4px', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Interview Score</h4>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
              {isEvaluating ? '...' : `${evalData?.final_score ?? '--'}%`}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0' }}>AI Evaluation</p>
          </div>
        </div>

        {/* Strengths + Weaknesses */}
        {evalData && (
          <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 20px' }}>📝 Performance Breakdown</h3>
            <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: '24px' }}>{evalData.feedback_summary}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h4 style={{ color: '#00ff88', marginBottom: '12px' }}>✅ Strengths</h4>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {evalData.strengths?.map((s, i) => <li key={i} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 style={{ color: 'var(--accent-red)', marginBottom: '12px' }}>📈 Improve</h4>
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {evalData.weaknesses?.map((w, i) => <li key={i} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{w}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Q&A Transcript */}
        <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 20px' }}>📋 Full Q&A Transcript</h3>
          {qnaList.map((qa, i) => (
            <div key={i} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: i < qnaList.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
              <p style={{ color: 'var(--accent-cyan)', fontWeight: '600', marginBottom: '6px' }}>Q{i + 1}: {qa.question}</p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>{qa.answer}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button className="btn-primary" style={{ padding: '16px 48px', fontSize: '1rem' }} onClick={() => navigate('/')}>
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  // ─── RENDER: Interview Phase ───────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
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
              👁 {eyeContactPercent}% eye contact
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isListening && (
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

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Left: Camera */}
        <div style={{ position: 'relative' }}>
          <div className="glass-panel" style={{ padding: '10px', overflow: 'hidden' }}>
            <video
              ref={videoRef}
              autoPlay playsInline muted
              style={{ width: '100%', borderRadius: '12px', transform: 'scaleX(-1)', background: '#000', minHeight: '380px', display: 'block' }}
            />
          </div>
          {isListening && (
            <div className="pulse-dot" style={{
              position: 'absolute', bottom: '26px', left: '26px',
              background: 'rgba(255,75,43,0.92)', padding: '8px 18px',
              borderRadius: '20px', fontWeight: '600', fontSize: '0.9rem'
            }}>
              🎤 Recording...
            </div>
          )}
          {/* Live filler counter */}
          <div style={{
            position: 'absolute', top: '26px', right: '26px',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            borderRadius: '12px', padding: '8px 14px', fontSize: '0.8rem'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>Fillers: </span>
            <span style={{ color: fillerEvents.length <= 3 ? '#00ff88' : '#ff4b2b', fontWeight: '700' }}>{fillerEvents.length}</span>
          </div>
        </div>

        {/* Right: AI + Transcript */}
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

          {/* Live Transcript Box */}
          <div style={{
            background: 'rgba(0,0,0,0.35)', border: '1px solid var(--glass-border)',
            borderRadius: '12px', padding: '16px', minHeight: '130px', maxHeight: '200px', overflowY: 'auto'
          }}>
            <div style={{ color: 'var(--accent-cyan)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              Live Transcript
            </div>
            <p style={{ margin: 0, lineHeight: '1.6', fontSize: '1rem' }}>
              {liveTranscript || (
                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  {isListening ? 'Listening... speak clearly' : 'Click "Start Answering" and speak your answer'}
                </span>
              )}
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={toggleListening}
              className={isListening ? 'btn-danger' : 'btn-primary'}
              style={{ flex: 1, padding: '18px', fontSize: '1rem' }}
              disabled={isFetchingNext}
            >
              {isListening ? '⏹ Stop Recording' : '🎙 Start Answering'}
            </button>
            {isListening && (
              <button
                onClick={submitAnswer}
                style={{
                  flex: 1, padding: '18px', fontSize: '1rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #00ff88, #00d2ff)', border: 'none',
                  color: '#000', fontWeight: '700', cursor: 'pointer'
                }}
              >
                ✅ Submit Answer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filler progress bar */}
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