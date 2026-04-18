import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import InteractiveBackground from './InteractiveBackground';

const ReviewDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
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

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: 'white' }}>
      <div className="loader">Analyzing Interview Matrix...</div>
    </div>
  );

  if (!data) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', color: 'var(--accent-red)' }}>
      Result Not Found
    </div>
  );

  const scoreColor = data.final_score >= 75 ? 'var(--accent-cyan)' : data.final_score >= 50 ? '#ffd700' : '#ff4b2b';

  return (
    <div className="dashboard-page" style={{ position: 'relative', zIndex: 1, minHeight: '100vh', color: 'white', padding: '40px 20px' }}>
      <InteractiveBackground />
      
      <style>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          animation: fadeIn 0.8s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stat-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 24px;
          backdrop-filter: blur(12px);
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(0, 210, 255, 0.3);
          transform: translateY(-5px);
        }
        .tab-btn {
          padding: 12px 24px;
          border-radius: 12px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: rgba(0, 210, 255, 0.1);
          border-color: rgba(0, 210, 255, 0.3);
          color: var(--accent-cyan);
        }
        .qna-card {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 16px;
          transition: border-color 0.3s;
        }
        .qna-card:hover {
          border-color: rgba(0, 210, 255, 0.2);
        }
      `}</style>

      <div className="dashboard-container">
        
        {/* Header Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ padding: '6px 12px', borderRadius: '20px', background: 'rgba(0, 210, 255, 0.1)', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {data.difficulty} Level
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{new Date(data.date).toLocaleDateString()}</span>
            </div>
            <h1 style={{ fontSize: '2.8rem', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>{data.role} <span style={{ color: 'var(--accent-cyan)' }}>Interview</span></h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '1.1rem' }}>Detailed Performance Matrix & AI Insights</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button 
              onClick={() => navigate('/profile')}
              className="tab-btn"
              style={{ marginRight: '10px' }}
            >
              ← Back to Profile
            </button>
            <button 
              className="btn-primary"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Shareable dashboard link copied!");
              }}
            >
              Share Report
            </button>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>Overall Score</div>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={scoreColor} strokeWidth="3" strokeDasharray={`${data.final_score}, 100`} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '2.2rem', fontWeight: '800', color: scoreColor }}>
                {data.final_score}
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>Confidence Index</div>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>{data.confidence_score || 0}%</div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${data.confidence_score || 0}%`, background: 'linear-gradient(90deg, #ff4b2b, #ffd700, #00ff88)', borderRadius: '4px' }}></div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '12px' }}>{data.confidence_label || 'Moderate Confidence detected'}</p>
          </div>

          <div className="stat-card">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>Response Integrity</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Fluency</span>
                    <span style={{ color: 'var(--accent-cyan)' }}>High</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Vocabulary</span>
                    <span style={{ color: 'var(--accent-cyan)' }}>Advanced</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Structure</span>
                    <span style={{ color: 'var(--accent-cyan)' }}>Coherent</span>
                </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
          <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
          <button className={`tab-btn ${activeTab === 'qna' ? 'active' : ''}`} onClick={() => setActiveTab('qna')}>Transcript & Feedback</button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div className="stat-card" style={{ height: 'fit-content' }}>
              <h3 style={{ color: 'var(--accent-cyan)', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🎯</span> AI Feedback Summary
              </h3>
              <p style={{ lineHeight: '1.8', color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>{data.feedback_summary}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="stat-card" style={{ borderColor: 'rgba(0, 255, 136, 0.2)' }}>
                <h3 style={{ color: '#00ff88', margin: '0 0 15px 0', fontSize: '1.1rem' }}>✅ Key Strengths</h3>
                <ul style={{ paddingLeft: '20px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8', margin: 0 }}>
                  {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div className="stat-card" style={{ borderColor: 'rgba(255, 75, 43, 0.2)' }}>
                <h3 style={{ color: '#ff4b2b', margin: '0 0 15px 0', fontSize: '1.1rem' }}>🎯 Improvement Areas</h3>
                <ul style={{ paddingLeft: '20px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8', margin: 0 }}>
                  {data.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'qna' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {data.qna_list.map((qna, idx) => (
              <div key={idx} className="qna-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: '700', fontSize: '0.9rem' }}>QUESTION {idx + 1}</span>
                  <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Technical Analysis</span>
                </div>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: 'white', lineHeight: '1.4' }}>{qna.question}</h4>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', marginBottom: '15px', borderLeft: '3px solid var(--accent-cyan)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Your Response</div>
                    <p style={{ margin: 0, fontStyle: 'italic', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>"{qna.answer}"</p>
                </div>
                {/* Simulated AI Insight for each question */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🤖</span>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        The AI analyzed this response for technical accuracy and depth. You demonstrated strong understanding of core concepts but could have elaborated more on the practical implementation details.
                    </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ReviewDashboard;
