import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ATSReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { score, feedback, summary, role, difficulty, totalQuestions } = location.state || {};

  const scoreNum = parseInt(score) || 0;
  const scoreColor = scoreNum >= 75 ? '#00ff88' : scoreNum >= 50 ? '#ffd700' : '#ff4b2b';

  const feedbackLines = (feedback || '').split('\n').filter(l => l.trim());

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="glow-text" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>ATS Resume Analysis</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Your resume match against <strong style={{ color: 'var(--accent-cyan)' }}>{role}</strong> · {difficulty} level</p>
      </div>

      <div style={{ maxWidth: '900px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        {/* Score Circle */}
        <div className="glass-panel" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', margin: 0 }}>ATS Match Score</p>
          <div style={{
            width: '150px', height: '150px', borderRadius: '50%',
            background: `conic-gradient(${scoreColor} ${scoreNum * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 40px ${scoreColor}44`,
          }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--bg-gradient-end)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: '800', color: scoreColor }}>{scoreNum}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>/ 100</span>
            </div>
          </div>
          <p style={{ margin: 0, fontWeight: '600', color: scoreColor, fontSize: '1rem' }}>
            {scoreNum >= 75 ? '🎯 Strong Match' : scoreNum >= 50 ? '⚡ Partial Match' : '⚠️ Weak Match'}
          </p>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Summary */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <h3 style={{ color: 'var(--accent-cyan)', margin: '0 0 12px' }}>📋 Candidate Profile</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>{summary || 'No summary available.'}</p>
          </div>

          {/* Feedback */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            <h3 style={{ color: '#ffd700', margin: '0 0 12px' }}>📈 Areas to Strengthen</h3>
            {feedbackLines.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {feedbackLines.map((line, i) => (
                  <li key={i} style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '6px' }}>
                    {line.replace(/^[-•*]\s*/, '')}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{feedback || 'No feedback available.'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Ready to start your mock interview?</p>
        <button
          className="btn-primary"
          style={{ padding: '16px 48px', fontSize: '1.1rem' }}
          onClick={() => navigate('/interview', { state: { summary, feedback, score, role, difficulty, totalQuestions } })}
        >
          ▶ Start Interview Session
        </button>
      </div>
    </div>
  );
};

export default ATSReport;
