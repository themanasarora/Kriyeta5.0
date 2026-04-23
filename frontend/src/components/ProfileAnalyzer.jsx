import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InteractiveBackground from './InteractiveBackground';
import API_BASE_URL from '../api/config';

const ProfileAnalyzer = () => {
  const [activeTab, setActiveTab] = useState('github');
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [githubData, setGithubData] = useState(null);
  const [leetcodeData, setLeetcodeData] = useState(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!username) return;
    setLoading(true);
    setError("");
    try {
      const userStr = sessionStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      const endpoint = activeTab === 'github' ? 'analyze-github' : 'analyze-leetcode';

      const res = await axios.post(`${API_BASE_URL}/api/${endpoint}`, {
        username,
        email: user?.email
      });

      if (activeTab === 'github') {
        setGithubData(res.data);
      } else {
        setLeetcodeData(res.data);
      }

      if (user) {
        const updatedUser = { ...user };
        if (activeTab === 'github') updatedUser.github_score = res.data.score;
        if (activeTab === 'leetcode') updatedUser.leetcode_score = res.data.score;
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      setError(err.response?.data?.error || `Failed to analyze ${activeTab} profile.`);
    } finally {
      setLoading(false);
    }
  };

  const ScoreBadge = ({ score, label, color }) => {
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        let start = 0;
        const duration = 1000;
        const step = score / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= score) {
                setDisplayScore(score);
                clearInterval(timer);
            } else {
                setDisplayScore(Math.round(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [score]);

    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>{label}</div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8" strokeDasharray={`${(displayScore / 100) * 283} 283`} strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 0.3s ease' }} />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>
                {displayScore}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', position: 'relative' }}>
      <InteractiveBackground />
      
      <style>{`
        .matrix-container {
            max-width: 1000px;
            width: 100%;
            z-index: 2;
            animation: fadeIn 0.8s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .tab-group {
            display: flex;
            justify-content: center;
            gap: 12px;
            background: rgba(255,255,255,0.03);
            padding: 6px;
            border-radius: 100px;
            border: 1px solid rgba(255,255,255,0.05);
            margin-bottom: 40px;
            width: fit-content;
            margin-left: auto;
            margin-right: auto;
        }
        .tab-item {
            padding: 10px 24px;
            border-radius: 100px;
            border: none;
            background: transparent;
            color: var(--text-secondary);
            cursor: pointer;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        .tab-item.active.github {
            background: rgba(0, 210, 255, 0.15);
            color: var(--accent-cyan);
            box-shadow: 0 4px 15px rgba(0, 210, 255, 0.1);
        }
        .tab-item.active.leetcode {
            background: rgba(255, 170, 0, 0.15);
            color: #FFAA00;
            box-shadow: 0 4px 15px rgba(255, 170, 0, 0.1);
        }
        .matrix-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }
        .metric-box {
            background: rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            transition: transform 0.3s ease;
        }
        .metric-box:hover {
            transform: translateY(-5px);
            border-color: rgba(255,255,255,0.1);
        }
      `}</style>

      <div className="matrix-container">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="glow-text" style={{ fontSize: '3.2rem', fontWeight: '800', marginBottom: '12px', letterSpacing: '-1.5px' }}>Candidate <span style={{ color: 'white' }}>Matrix Sync</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Synchronize your professional DNA to calibrate your AI Interview experience.</p>
        </div>

        <div className="tab-group">
          <button className={`tab-item ${activeTab === 'github' ? 'active github' : ''}`} onClick={() => { setActiveTab('github'); setUsername(""); setError(""); setGithubData(null); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
            GitHub
          </button>
          <button className={`tab-item ${activeTab === 'leetcode' ? 'active leetcode' : ''}`} onClick={() => { setActiveTab('leetcode'); setUsername(""); setError(""); setLeetcodeData(null); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901l-2.609-2.636a5.055 5.055 0 0 0-2.445-1.337l2.467-2.503c.516-.514.498-1.366-.037-1.901-.535-.535-1.387-.552-1.902-.038l-10.1 10.101c-.981.982-1.494 2.337-1.494 3.835 0 1.498.513 2.895 1.494 3.875l4.347 4.361c.981.979 2.337 1.452 3.834 1.452s2.853-.473 3.833-1.452l2.609-2.638c.514-.514.498-1.365-.037-1.901-.536-.535-1.387-.553-1.902-.038z" /></svg>
            LeetCode
          </button>
        </div>

        {/* Input Phase */}
        {((activeTab === 'github' && !githubData) || (activeTab === 'leetcode' && !leetcodeData)) && (
          <div className="matrix-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>{activeTab === 'github' ? '🐙' : '💡'}</div>
            <h2 style={{ marginBottom: '10px' }}>{activeTab === 'github' ? 'Analyze Open Source Impact' : 'Evaluate Problem Solving Depth'}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '0.95rem' }}>Enter your {activeTab} username to pull live metrics into your interview matrix.</p>
            
            <div style={{ position: 'relative', marginBottom: '24px' }}>
                <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder={`e.g. ${activeTab === 'github' ? 'torvalds' : 'neetcode'}`} 
                    className="input-field" 
                    style={{ padding: '16px 20px', borderRadius: '14px', fontSize: '1.1rem', background: 'rgba(0,0,0,0.3)' }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }} 
                />
            </div>

            {error && (
                <div style={{ color: 'var(--accent-red)', padding: '12px', background: 'rgba(255, 75, 43, 0.1)', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>
                    ⚠️ {error}
                </div>
            )}

            <button 
                className="btn-primary" 
                style={{ width: '100%', padding: '18px', fontSize: '1.1rem', background: activeTab === 'github' ? undefined : 'linear-gradient(90deg, #FFAA00, #FF7700)', boxShadow: activeTab === 'github' ? undefined : '0 8px 24px rgba(255, 170, 0, 0.3)' }}
                onClick={handleAnalyze} 
                disabled={loading || !username}
            >
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <div className="loader" style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                        Crunching Matrix...
                    </div>
                ) : `Sync ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Identity`}
            </button>
          </div>
        )}

        {/* Result Phase - GitHub */}
        {activeTab === 'github' && githubData && (
          <div className="matrix-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative' }}>
                    <img src={githubData.avatar} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '24px', border: '2px solid var(--accent-cyan)', padding: '4px' }} />
                    <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: 'var(--accent-cyan)', color: 'black', padding: '4px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800' }}>OS PRO</div>
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '2rem' }}>@{githubData.username}</h2>
                  <a href={`https://github.com/${githubData.username}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '600' }}>View GitHub Ecosystem ↗</a>
                </div>
              </div>
              <button onClick={() => setGithubData(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}>Analyze Another</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="metric-box" style={{ background: 'linear-gradient(180deg, rgba(0,210,255,0.05) 0%, transparent 100%)', borderColor: 'rgba(0, 210, 255, 0.2)' }}>
                   <ScoreBadge score={githubData.score} label="Impact Score" color="var(--accent-cyan)" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div className="metric-box">
                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>{githubData.repos}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Repositories</div>
                    </div>
                    <div className="metric-box">
                        <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>{githubData.followers}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Followers</div>
                    </div>
                </div>
              </div>

              <div className="metric-box" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', padding: '30px', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(0, 210, 255, 0.1)', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>🤖</div>
                    <h4 style={{ margin: 0, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>AI Engineering Assessment</h4>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.8', fontSize: '1rem', whiteSpace: 'pre-line' }}>
                    {githubData.feedback}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result Phase - LeetCode */}
        {activeTab === 'leetcode' && leetcodeData && (
          <div className="matrix-card" style={{ borderColor: 'rgba(255, 170, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'linear-gradient(135deg, #FFAA00, #FF7700)', display: 'grid', placeItems: 'center', fontSize: '2.5rem' }}>🧠</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '2rem' }}>@{leetcodeData.username}</h2>
                  <a href={`https://leetcode.com/${leetcodeData.username}`} target="_blank" rel="noreferrer" style={{ color: '#FFAA00', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '600' }}>View Algorithm Portfolio ↗</a>
                </div>
              </div>
              <button onClick={() => setLeetcodeData(null)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}>Analyze Another</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="metric-box" style={{ background: 'linear-gradient(180deg, rgba(255,170,0,0.05) 0%, transparent 100%)', borderColor: 'rgba(255, 170, 0, 0.2)' }}>
                   <ScoreBadge score={leetcodeData.score} label="Logic Strength" color="#FFAA00" />
                   <div style={{ color: '#FFAA00', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', marginTop: '-10px' }}>{leetcodeData.persona}</div>
                </div>
                <div className="metric-box" style={{ padding: '20px 15px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ color: '#00b8a3', fontSize: '1.2rem', fontWeight: '800' }}>{leetcodeData.easy}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>EASY</div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1, borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ color: '#ffc01e', fontSize: '1.2rem', fontWeight: '800' }}>{leetcodeData.medium}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>MED</div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ color: '#ff375f', fontSize: '1.2rem', fontWeight: '800' }}>{leetcodeData.hard}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>HARD</div>
                        </div>
                   </div>
                </div>
              </div>

              <div className="metric-box" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', padding: '30px', background: 'rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'rgba(255, 170, 0, 0.1)', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>⚡</div>
                    <h4 style={{ margin: 0, color: '#FFAA00', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Logic & Problem Solving Feed</h4>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.8', fontSize: '1rem', whiteSpace: 'pre-line' }}>
                    {leetcodeData.feedback}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ProfileAnalyzer;
