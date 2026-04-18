import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserHistory = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = sessionStorage.getItem("user");
    if (!userStr) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(userStr);

    axios.post(`http://127.0.0.1:5000/api/user-history`, { email: user.email })
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("History failed:", err);
        setLoading(false);
      });
  }, [navigate]);

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Syncing Historical Data...</div>;

  return (
    <div style={{ minHeight: '100vh', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 className="glow-text" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Performance Hub</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track your interview consistency and historical scores.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px', width: '100%', maxWidth: '1000px' }}>
        
        {/* Left Side: Streak Dashboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', border: '1px solid rgba(255, 75, 43, 0.4)' }}>
            <div style={{ fontSize: '3.5rem', animation: 'pulse 2s infinite' }}>🔥</div>
            <h3 style={{ margin: '15px 0 5px 0', color: 'white' }}>{data.streak_count || 0} Day Streak</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {data.streak_count > 0 ? "You're on fire! Keep practicing daily to grow your AI matrix." : "Take a mock interview today to start your streak!"}
            </p>
            </div>

            <button className="btn-primary" onClick={() => navigate('/setup')} style={{ width: '100%' }}>
              Start New Interview
            </button>
        </div>

        {/* Right Side: Timeline */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ color: 'var(--accent-cyan)', margin: '0 0 20px 0', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Interview History</h2>
          
          {data.interviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No interviews recorded yet. Start grinding!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {data.interviews.map((intv) => (
                <div 
                  key={intv.id} 
                  onClick={() => navigate(`/result/${intv.id}`)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '1.1rem' }}>{intv.role}</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(intv.date).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '1px', marginBottom: '3px' }}>SCORE</div>
                        <div style={{ fontWeight: '800', color: intv.score > 70 ? 'var(--accent-cyan)' : 'var(--accent-red)' }}>{intv.score}</div>
                    </div>
                    <div style={{ color: 'var(--accent-cyan)' }}>→</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserHistory;
