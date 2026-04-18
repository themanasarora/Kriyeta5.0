import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import InteractiveBackground from './InteractiveBackground';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchHistory(parsedUser.email);
  }, [navigate]);

  const fetchHistory = (email) => {
    setHistoryLoading(true);
    axios.post(`http://127.0.0.1:5000/api/user-history`, { email })
      .then(res => {
        setHistoryData(res.data);
      })
      .catch(err => console.error("History fetch failed:", err))
      .finally(() => setHistoryLoading(false));
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  const ActivitySparkline = ({ data = [2, 5, 3, 8, 4, 6, 9], color = "var(--accent-red)" }) => {
    const width = 200;
    const height = 40;
    const padding = 5;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
        const y = height - ((val - min) / range) * (height - 2 * padding) - padding;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} style={{ overflow: 'visible', filter: `drop-shadow(0 0 5px ${color}44)` }}>
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
            {/* Dots for each point */}
            {data.map((val, i) => {
                const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
                const y = height - ((val - min) / range) * (height - 2 * padding) - padding;
                return <circle key={i} cx={x} cy={y} r="2" fill={color} />;
            })}
        </svg>
    );
  };

  if (!user) return null;

  return (
    <div className="profile-page-container" style={{ padding: '60px 20px', position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      <InteractiveBackground />
      
      <style>{`
        .profile-container {
            max-width: 1200px;
            margin: 0 auto;
            position: relative;
            z-index: 2;
            animation: fadeIn 0.8s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 30px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .stat-card:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: translateY(-5px);
            border-color: rgba(255, 255, 255, 0.15);
        }
        .stat-card::after {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, transparent 60%, rgba(255,255,255,0.02) 100%);
            pointer-events: none;
        }
        .profile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(255, 255, 255, 0.04);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 30px;
            padding: 40px;
            margin-bottom: 40px;
        }
        .history-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 18px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .history-item:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(0, 210, 255, 0.3);
            transform: translateX(8px);
        }
      `}</style>

      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <div style={{ position: 'relative' }}>
                <div style={{ 
                    width: '120px', 
                    height: '120px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                    fontWeight: '800',
                    color: 'white',
                    boxShadow: '0 0 30px rgba(0, 210, 255, 0.4)',
                    textTransform: 'uppercase',
                    border: '4px solid rgba(255,255,255,0.1)'
                }}>
                    {(user.name || user.email).charAt(0)}
                </div>
                <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '24px', height: '24px', borderRadius: '50%', background: '#00ff88', border: '3px solid #1a1a2e', boxShadow: '0 0 10px #00ff88' }}></div>
            </div>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '3rem', fontWeight: '800', letterSpacing: '-1px' }}>{user.name || "Developer"}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>{user.email}</span>
                <span style={{ padding: '4px 12px', borderRadius: '100px', background: 'rgba(0, 210, 255, 0.1)', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>Verified Candidate</span>
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} style={{ padding: '12px 30px', background: 'rgba(255, 75, 43, 0.1)', border: '1px solid rgba(255, 75, 43, 0.3)', borderRadius: '12px', color: 'var(--accent-red)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 75, 43, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 75, 43, 0.1)'}>
            Logout Account
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
          
          {/* Streak Card */}
          <div className="stat-card" style={{ borderColor: 'rgba(255, 75, 43, 0.3)', minWidth: '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem' }}>🔥</div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>Daily Streak</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>{historyData?.streak_count || 0} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Days</span></div>
                </div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Trend</div>
                <ActivitySparkline data={historyData?.activity_trend || [1, 3, 2, 5, 4, 8, 10]} color="var(--accent-red)" />
            </div>
          </div>

          {/* GitHub Card */}
          <div className="stat-card" style={{ borderColor: 'rgba(0, 210, 255, 0.3)', minWidth: '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem', color: 'white' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>OS Impact</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>{user.github_score || 'N/A'}</div>
                </div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Momentum</div>
                <ActivitySparkline data={[5, 8, 6, 9, 7, 12, 15]} color="var(--accent-cyan)" />
            </div>
          </div>

          {/* LeetCode Card */}
          <div className="stat-card" style={{ borderColor: 'rgba(255, 170, 0, 0.3)', minWidth: '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ fontSize: '2.5rem', color: '#FFAA00' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901l-2.609-2.636a5.055 5.055 0 0 0-2.445-1.337l2.467-2.503c.516-.514.498-1.366-.037-1.901-.535-.535-1.387-.552-1.902-.038l-10.1 10.101c-.981.982-1.494 2.337-1.494 3.835 0 1.498.513 2.895 1.494 3.875l4.347 4.361c.981.979 2.337 1.452 3.834 1.452s2.853-.473 3.833-1.452l2.609-2.638c.514-.514.498-1.365-.037-1.901-.536-.535-1.387-.553-1.902-.038z" /></svg>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>DSA Score</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#FFAA00' }}>{user.leetcode_score || 'N/A'}</div>
                </div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Velocity</div>
                <ActivitySparkline data={[10, 12, 11, 15, 14, 18, 22]} color="#FFAA00" />
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="stat-card" style={{ padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Interview Ecosystem</h2>
            <div style={{ padding: '6px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', fontSize: '0.8rem', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {historyData?.interviews?.length || 0} Total Sessions
            </div>
          </div>
          
          {historyLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '60px 0' }}>
                <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid var(--accent-cyan)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Calibrating your historical data...</span>
            </div>
          ) : !historyData?.interviews || historyData.interviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(0,0,0,0.1)', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🚀</div>
                <h3 style={{ color: 'white', marginBottom: '10px' }}>No Sessions Recorded</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 24px' }}>You haven't completed any interviews yet. Complete your first mock session to start your performance journey.</p>
                <button onClick={() => navigate('/setup')} className="btn-primary" style={{ padding: '12px 30px', borderRadius: '12px' }}>Start First Interview</button>
            </div>
          ) : (
            <div>
              {historyData.interviews.map((intv) => (
                <div 
                  key={intv.id} 
                  onClick={() => navigate(`/result/${intv.id}`)}
                  className="history-item"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '50px', height: '50px', background: 'rgba(0, 210, 255, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)', fontSize: '1.2rem' }}>
                        👔
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: 'white', fontSize: '1.15rem', fontWeight: '600' }}>{intv.role}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(intv.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span style={{ width: '4px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}></span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{intv.totalQuestions || 5} Questions</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '1.5px', marginBottom: '4px', textTransform: 'uppercase' }}>Performance</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: intv.score > 70 ? '#00ff88' : intv.score > 40 ? '#ffd700' : '#ff4b2b' }}>{intv.score}%</div>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '1.5rem' }}>→</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ProfilePage;
