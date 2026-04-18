import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import InteractiveBackground from './InteractiveBackground';

const ATSReport = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { score, feedback, summary, role, difficulty, totalQuestions } = location.state || {};

  const scoreNum = parseInt(score) || 0;
  const scoreColor = scoreNum >= 75 ? '#00ff88' : scoreNum >= 50 ? '#ffd700' : '#ff4b2b';
  const scoreLabel = scoreNum >= 75 ? 'Strong Match' : scoreNum >= 50 ? 'Partial Match' : 'Needs Work';
  const scoreEmoji = scoreNum >= 75 ? '🎯' : scoreNum >= 50 ? '⚡' : '🔧';

  const feedbackLines = (feedback || '').split('\n').filter(l => l.trim());

  // Animated score counter
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const step = scoreNum / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= scoreNum) {
        setDisplayScore(scoreNum);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [scoreNum]);

  // SVG circle animation
  const circumference = 2 * Math.PI * 62;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        .ats-page {
          min-height: 100vh;
          width: 100%;
          padding: 40px 32px;
          font-family: 'Outfit', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          background: transparent;
        }

        /* Header section */
        .ats-header {
          text-align: center;
          margin-bottom: 48px;
          animation: fadeDown 0.6s ease both;
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ats-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 999px;
          background: rgba(0,210,255,0.08);
          border: 1px solid rgba(0,210,255,0.15);
          color: var(--accent-cyan, #00d2ff);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .ats-header h1 {
          font-size: 2.4rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.03em;
          margin: 0 0 8px;
        }

        .ats-header p {
          color: rgba(255,255,255,0.5);
          font-size: 1.05rem;
          font-weight: 400;
          margin: 0;
        }

        .ats-header p strong {
          color: var(--accent-cyan, #00d2ff);
          font-weight: 600;
        }

        /* Main grid */
        .ats-grid {
          max-width: 1100px;
          width: 100%;
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 28px;
          animation: fadeUp 0.7s ease both;
          animation-delay: 0.15s;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Left column */
        .ats-left {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Score card */
        .score-card {
          padding: 40px 32px;
          border-radius: 24px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s ease;
        }

        .score-card::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 24px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(0,210,255,0.15), transparent 50%, rgba(108,99,255,0.1));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .score-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .score-label-top {
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 2px;
          font-weight: 600;
        }

        .score-circle-wrapper {
          position: relative;
          width: 160px;
          height: 160px;
        }

        .score-circle-bg,
        .score-circle-fill {
          position: absolute;
          top: 0; left: 0;
          width: 100%;
          height: 100%;
        }

        .score-circle-fill {
          transform: rotate(-90deg);
          transition: stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .score-inner {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .score-number {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -2px;
        }

        .score-max {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.3);
          font-weight: 500;
        }

        .score-verdict {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          font-weight: 700;
        }

        /* Stats mini cards */
        .stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .stat-card {
          padding: 18px 16px;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          text-align: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          background: rgba(255,255,255,0.06);
          transform: translateY(-2px);
        }

        .stat-value {
          font-size: 1.3rem;
          font-weight: 700;
          color: #fff;
          display: block;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 500;
        }

        /* Right column */
        .ats-right {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Content panels */
        .content-panel {
          padding: 28px 32px;
          border-radius: 24px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(16px);
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }

        .content-panel::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 24px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(255,255,255,0.06), transparent 60%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .content-panel:hover {
          background: rgba(255,255,255,0.04);
          transform: translateY(-2px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.2);
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .panel-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .panel-icon.profile {
          background: rgba(0,210,255,0.1);
          border: 1px solid rgba(0,210,255,0.15);
        }

        .panel-icon.feedback {
          background: rgba(255,215,0,0.1);
          border: 1px solid rgba(255,215,0,0.15);
        }

        .panel-icon.tips {
          background: rgba(108,99,255,0.1);
          border: 1px solid rgba(108,99,255,0.15);
        }

        .panel-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          margin: 0;
        }

        .panel-subtitle {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.35);
          font-weight: 400;
        }

        .panel-body {
          color: rgba(255,255,255,0.6);
          font-size: 0.95rem;
          line-height: 1.75;
        }

        /* Feedback list */
        .feedback-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .feedback-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 16px 18px;
          border-radius: 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          transition: all 0.3s ease;
        }

        .feedback-item:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.08);
          transform: translateX(4px);
        }

        .feedback-bullet {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          background: rgba(255,215,0,0.1);
          border: 1px solid rgba(255,215,0,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 0.7rem;
          color: #ffd700;
          font-weight: 700;
          margin-top: 2px;
        }

        .feedback-text {
          color: rgba(255,255,255,0.6);
          font-size: 0.92rem;
          line-height: 1.7;
        }

        /* CTA section */
        .ats-cta {
          max-width: 1100px;
          width: 100%;
          margin-top: 36px;
          padding: 32px 40px;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(0,210,255,0.06), rgba(108,99,255,0.04));
          border: 1px solid rgba(0,210,255,0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          animation: fadeUp 0.7s ease both;
          animation-delay: 0.3s;
          transition: all 0.4s ease;
        }

        .ats-cta:hover {
          border-color: rgba(0,210,255,0.2);
          box-shadow: 0 16px 48px rgba(0,210,255,0.08);
        }

        .cta-text h3 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 6px;
        }

        .cta-text p {
          color: rgba(255,255,255,0.4);
          font-size: 0.9rem;
          margin: 0;
        }

        .cta-btn {
          appearance: none;
          border: none;
          padding: 16px 36px;
          border-radius: 14px;
          font-family: 'Outfit', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, var(--accent-cyan, #00d2ff), var(--accent-blue, #3a7bd5));
          box-shadow: 0 8px 30px rgba(0,210,255,0.3);
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,210,255,0.45);
        }

        .cta-btn:active {
          transform: translateY(0) scale(0.98);
        }

        @media (max-width: 860px) {
          .ats-grid {
            grid-template-columns: 1fr;
          }
          .ats-cta {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>

      <div className="ats-page" style={{ position: 'relative', zIndex: 1 }}>
        <InteractiveBackground />
        {/* Header */}
        <div className="ats-header">
          <div className="ats-badge">📊 Resume Analysis Complete</div>
          <h1>ATS Match Report</h1>
          <p>Your resume scored against <strong>{role}</strong> · {difficulty} level</p>
        </div>

        {/* Main Grid */}
        <div className="ats-grid">
          {/* Left: Score + Stats */}
          <div className="ats-left">
            <div className="score-card">
              <span className="score-label-top">ATS Match Score</span>

              <div className="score-circle-wrapper">
                <svg className="score-circle-bg" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="62" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                </svg>
                <svg className="score-circle-fill" viewBox="0 0 140 140">
                  <circle
                    cx="70" cy="70" r="62"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ filter: `drop-shadow(0 0 8px ${scoreColor}66)` }}
                  />
                </svg>
                <div className="score-inner">
                  <span className="score-number" style={{ color: scoreColor }}>{displayScore}</span>
                  <span className="score-max">/ 100</span>
                </div>
              </div>

              <div className="score-verdict" style={{ color: scoreColor }}>
                <span>{scoreEmoji}</span>
                <span>{scoreLabel}</span>
              </div>
            </div>

            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-value" style={{ color: 'var(--accent-cyan, #00d2ff)' }}>{difficulty}</span>
                <span className="stat-label">Difficulty</span>
              </div>
              <div className="stat-card">
                <span className="stat-value" style={{ color: '#a78bfa' }}>{totalQuestions || '—'}</span>
                <span className="stat-label">Questions</span>
              </div>
            </div>

            <div className="stat-card" style={{ textAlign: 'center' }}>
              <span className="stat-value" style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>{role}</span>
              <span className="stat-label">Target Role</span>
            </div>
          </div>

          {/* Right: Profile + Feedback */}
          <div className="ats-right">
            {/* Profile Panel */}
            <div className="content-panel">
              <div className="panel-header">
                <div className="panel-icon profile">👤</div>
                <div>
                  <h3 className="panel-title">Candidate Profile</h3>
                  <span className="panel-subtitle">AI-generated summary of your resume</span>
                </div>
              </div>
              <div className="panel-body">
                {summary || 'No summary available.'}
              </div>
            </div>

            {/* Feedback Panel */}
            <div className="content-panel">
              <div className="panel-header">
                <div className="panel-icon feedback">💡</div>
                <div>
                  <h3 className="panel-title">Areas to Strengthen</h3>
                  <span className="panel-subtitle">{feedbackLines.length} improvement suggestions</span>
                </div>
              </div>
              {feedbackLines.length > 0 ? (
                <ul className="feedback-list">
                  {feedbackLines.map((line, i) => (
                    <li key={i} className="feedback-item">
                      <span className="feedback-bullet">{i + 1}</span>
                      <span className="feedback-text">{line.replace(/^[-•*]\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="panel-body">{feedback || 'No feedback available.'}</div>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="ats-cta">
          <div className="cta-text">
            <h3>🎙️ Ready to ace your interview?</h3>
            <p>Start a mock interview session based on your resume analysis and target role.</p>
          </div>
          <button
            className="cta-btn"
            onClick={() => navigate('/interview', { state: { summary, feedback, score, role, difficulty, totalQuestions } })}
          >
            Start Interview Session →
          </button>
        </div>
      </div>
    </>
  );
};

export default ATSReport;
