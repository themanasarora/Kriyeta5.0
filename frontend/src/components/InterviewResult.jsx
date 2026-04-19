import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import InteractiveBackground from './InteractiveBackground';

const InterviewResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch result publicly
    axios.get(`http://127.0.0.1:5000/api/interview/${id}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard failed:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Loading Shareable Dashboard...</div>;
  if (!data) return <div style={{ color: 'var(--accent-red)', textAlign: 'center', marginTop: '100px' }}>Result Not Found</div>;

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <InteractiveBackground />
      <div style={{ width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="glow-text" style={{ fontSize: '2.5rem', marginBottom: '8px', margin: 0 }}>Interview Result</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{data.role} ({data.difficulty}) - {new Date(data.date).toLocaleDateString()}</p>
        </div>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Shareable link copied to clipboard!");
          }}
          style={{ background: 'var(--primary)', color: 'black', fontWeight: 'bold', padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}
        >
          📋 Copy Public Link
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', width: '100%', maxWidth: '900px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Final Score</h3>
          <div style={{ fontSize: '4rem', fontWeight: '800', color: data.final_score > 70 ? 'var(--accent-cyan)' : 'var(--accent-red)', margin: '15px 0' }}>
            {data.final_score}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>AI Interview Performance</p>
        </div>

        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ color: 'var(--accent-cyan)', margin: '0 0 15px 0' }}>Overview</h3>
          <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{data.feedback_summary}</p>
        </div>
      </div>

      {/* ── Confidence Score Banner ── */}
      {data.confidence_score != null && (
        <div className="glass-panel" style={{
          width: '100%', maxWidth: '900px', padding: '24px 30px', marginBottom: '30px',
          display: 'flex', alignItems: 'center', gap: '32px',
          borderLeft: `4px solid ${
            data.confidence_score >= 70 ? '#00ff88'
              : data.confidence_score >= 40 ? '#ffd700' : '#ff4b2b'
          }`,
          background: `linear-gradient(90deg, ${
            data.confidence_score >= 70 ? 'rgba(0,255,136,0.06)'
              : data.confidence_score >= 40 ? 'rgba(255,215,0,0.06)' : 'rgba(255,75,43,0.06)'
          }, transparent)`,
        }}>
          <div style={{ textAlign: 'center', minWidth: '80px' }}>
            <div style={{
              fontSize: '3rem', fontWeight: '800',
              color: data.confidence_score >= 70 ? '#00ff88'
                : data.confidence_score >= 40 ? '#ffd700' : '#ff4b2b',
            }}>
              {data.confidence_score}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
              / 100
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Confidence Score</h3>
              <span style={{
                background: data.confidence_score >= 70 ? 'rgba(0,255,136,0.15)'
                  : data.confidence_score >= 40 ? 'rgba(255,215,0,0.15)' : 'rgba(255,75,43,0.15)',
                color: data.confidence_score >= 70 ? '#00ff88'
                  : data.confidence_score >= 40 ? '#ffd700' : '#ff4b2b',
                border: `1px solid ${
                  data.confidence_score >= 70 ? 'rgba(0,255,136,0.4)'
                    : data.confidence_score >= 40 ? 'rgba(255,215,0,0.4)' : 'rgba(255,75,43,0.4)'
                }`,
                borderRadius: '20px', padding: '3px 12px', fontSize: '0.8rem', fontWeight: '700',
              }}>
                {data.confidence_label || (data.confidence_score >= 70 ? 'High' : data.confidence_score >= 40 ? 'Moderate' : 'Low')}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
              Measured by ML classifier using hedging language, filler word rate, vocabulary richness, and answer structure.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%', maxWidth: '900px', marginBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ color: '#00ff88', margin: '0 0 20px 0' }}>✅ Strengths</h3>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            {data.strengths.map((str, idx) => <li key={idx}>{str}</li>)}
          </ul>
        </div>

        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ color: 'var(--accent-red)', margin: '0 0 20px 0' }}>🎯 Areas for Improvement</h3>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
            {data.weaknesses.map((wk, idx) => <li key={idx}>{wk}</li>)}
          </ul>
        </div>
      </div>
      
      {/* ── Communication & Culture Report ── */}
      {(data.communication_score != null || data.culture_fit_score != null) && (
        <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', padding: '30px', marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--accent-cyan)', margin: '0 0 25px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
            🤝 Communication & Culture Report
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: 'rgba(56,189,248,0.05)', padding: '15px', borderRadius: '14px', border: '1px solid rgba(56,189,248,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(56,189,248,0.8)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>Communication</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#38bdf8' }}>{data.communication_score}%</div>
              </div>
              <div style={{ background: 'rgba(167,139,250,0.05)', padding: '15px', borderRadius: '14px', border: '1px solid rgba(167,139,250,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'rgba(167,139,250,0.8)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>Culture Fit</div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#a78bfa' }}>{data.culture_fit_score}%</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'white' }}>Soft Skills Guidance</h4>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.95rem', fontStyle: 'italic' }}>
                "{data.soft_skills_feedback}"
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', padding: '30px' }}>
        <h3 style={{ color: 'var(--accent-cyan)', margin: '0 0 20px 0' }}>Session Transcript</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {data.qna_list.map((qna, idx) => (
            <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'white', fontWeight: '500', marginBottom: '10px' }}>Q{idx + 1}: {qna.question}</div>
              <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.6' }}>"{qna.answer}"</div>
            </div>
          ))}
        </div>
      </div>
      
      <button 
        className="btn-primary pulse-dot" 
        style={{ marginTop: '30px' }} 
        onClick={() => navigate('/history')}
      >
        View My Interview Hub
      </button>
    </div>
  );
};

export default InterviewResult;
