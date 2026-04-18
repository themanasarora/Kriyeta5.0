import React, { useState } from 'react';
import axios from 'axios';

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
      
      const res = await axios.post(`http://127.0.0.1:5000/api/${endpoint}`, {
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

  const renderTabs = () => (
    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', justifyContent: 'center' }}>
      <button 
        onClick={() => { setActiveTab('github'); setUsername(""); setError(""); }} 
        style={{ padding: '10px 20px', borderRadius: '20px', border: '1px solid var(--glass-border)', cursor: 'pointer', background: activeTab === 'github' ? 'rgba(0, 210, 255, 0.2)' : 'rgba(0,0,0,0.3)', color: activeTab === 'github' ? 'white' : 'var(--text-secondary)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px', verticalAlign: 'middle' }}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
        GitHub Link
      </button>
      <button 
        onClick={() => { setActiveTab('leetcode'); setUsername(""); setError(""); }} 
        style={{ padding: '10px 20px', borderRadius: '20px', border: '1px solid var(--glass-border)', cursor: 'pointer', background: activeTab === 'leetcode' ? 'rgba(255, 170, 0, 0.2)' : 'rgba(0,0,0,0.3)', color: activeTab === 'leetcode' ? 'white' : 'var(--text-secondary)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px', verticalAlign: 'middle', color: '#FFAA00' }}><path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901l-2.609-2.636a5.055 5.055 0 0 0-2.445-1.337l2.467-2.503c.516-.514.498-1.366-.037-1.901-.535-.535-1.387-.552-1.902-.038l-10.1 10.101c-.981.982-1.494 2.337-1.494 3.835 0 1.498.513 2.895 1.494 3.875l4.347 4.361c.981.979 2.337 1.452 3.834 1.452s2.853-.473 3.833-1.452l2.609-2.638c.514-.514.498-1.365-.037-1.901-.536-.535-1.387-.553-1.902-.038z"/></svg>
        LeetCode Link
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 className="glow-text" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Candidate Matrix Sync</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Connect your developer identities to dynamically alter your AI Interview.</p>
      </div>

      {renderTabs()}

      {/* GitHub Flow */}
      {activeTab === 'github' && !githubData && (
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>GitHub Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. torvalds" className="input-field" onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }} />
          </div>
          {error && <div style={{ color: 'var(--accent-red)', fontSize: '0.9rem', padding: '10px', background: 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>⚠️ {error}</div>}
          <button className="btn-primary pulse-dot" onClick={handleAnalyze} disabled={loading || !username}>
            {loading ? "Analyzing repositories..." : "Sync GitHub Impact"}
          </button>
        </div>
      )}

      {activeTab === 'github' && githubData && (
        <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {githubData.avatar && <img src={githubData.avatar} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--accent-cyan)' }} />}
              <div>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>@{githubData.username}</h2>
                <a href={`https://github.com/${githubData.username}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '0.9rem' }}>View on GitHub ↗</a>
              </div>
            </div>
            <button onClick={() => { setGithubData(null); setUsername(""); }} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Analyze Another</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>OS Score</div>
              <div style={{ fontSize: '3rem', fontWeight: '800', color: githubData.score >= 50 ? 'var(--accent-cyan)' : 'var(--accent-red)' }}>{githubData.score}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
               <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Metrics</div>
               <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '60%' }}>
                 <div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{githubData.repos}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>REPOS</div></div>
                 <div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{githubData.followers}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>FOLLOWS</div></div>
               </div>
            </div>
            <div style={{ background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.2)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>🤖</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase' }}>Groq AI Feedback</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.90rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>{githubData.feedback}</p>
            </div>
          </div>
        </div>
      )}

      {/* LeetCode Flow */}
      {activeTab === 'leetcode' && !leetcodeData && (
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '4px solid #FFAA00' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>LeetCode Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. neetcode" className="input-field" onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyze(); }} />
          </div>
          {error && <div style={{ color: '#FFAA00', fontSize: '0.9rem', padding: '10px', background: 'rgba(255,170,0,0.1)', borderRadius: '8px' }}>⚠️ {error}</div>}
          <button className="btn-primary pulse-dot" style={{ background: 'linear-gradient(135deg, #FFAA00, #FF7700)' }} onClick={handleAnalyze} disabled={loading || !username}>
            {loading ? "Crunching algorithms..." : "Sync LeetCode Stats"}
          </button>
        </div>
      )}

      {activeTab === 'leetcode' && leetcodeData && (
        <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '40px', borderTop: '4px solid #FFAA00' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>@{leetcodeData.username}</h2>
                <a href={`https://leetcode.com/${leetcodeData.username}`} target="_blank" rel="noreferrer" style={{ color: '#FFAA00', textDecoration: 'none', fontSize: '0.9rem' }}>View on LeetCode ↗</a>
              </div>
            </div>
            <button onClick={() => { setLeetcodeData(null); setUsername(""); }} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Analyze Another</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>DSA Score</div>
              <div style={{ fontSize: '3rem', fontWeight: '800', color: leetcodeData.score >= 50 ? '#FFAA00' : 'var(--accent-red)' }}>{leetcodeData.score}</div>
              <div style={{ fontSize: '0.75rem', marginTop: '5px', color: '#FFAA00' }}>{leetcodeData.persona}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
               <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Solved</div>
               <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '60%' }}>
                 <div><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff375f' }}>{leetcodeData.hard}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>HARD</div></div>
                 <div><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffc01e' }}>{leetcodeData.medium}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>MED</div></div>
                 <div><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00b8a3' }}>{leetcodeData.easy}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>EASY</div></div>
               </div>
            </div>
            <div style={{ background: 'rgba(255, 170, 0, 0.05)', border: '1px solid rgba(255, 170, 0, 0.2)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.2rem' }}>🧠</span>
                <span style={{ color: '#FFAA00', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase' }}>Groq Analytical Eval</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.90rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>{leetcodeData.feedback}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileAnalyzer;
