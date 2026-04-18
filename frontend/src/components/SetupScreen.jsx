import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const SetupScreen = () => {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [qCount, setQCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    const stateUser = location.state?.user;
    
    if (stateUser) {
      setUser(stateUser);
      sessionStorage.setItem('user', JSON.stringify(stateUser));
    } else if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [location, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const startAnalysis = async () => {
    if (!file || !role) {
      alert("Please upload a resume and select a role!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('role', role);
    formData.append('difficulty', difficulty);

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/analyze-resume', formData);

      navigate('/ats', {
        state: {
          summary: response.data.candidate_summary,
          feedback: response.data.resume_feedback,
          score: response.data.match_score,
          role: role,
          difficulty: difficulty,
          totalQuestions: qCount
        }
      });
    } catch (error) {
      alert("Server error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      {user && (
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Welcome, <strong style={{ color: 'var(--primary)' }}>{user.name || user.email}</strong>
          </span>
          {user.github_score && (
            <span style={{ 
              background: 'rgba(0, 210, 255, 0.1)', 
              color: 'var(--accent-cyan)', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '0.8rem',
              border: '1px solid rgba(0, 210, 255, 0.3)'
            }}>
              GitHub: {user.github_score}
            </span>
          )}
          {user.leetcode_score && (
            <span style={{ 
              background: 'rgba(255, 170, 0, 0.1)', 
              color: '#FFAA00', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '0.8rem',
              border: '1px solid rgba(255, 170, 0, 0.3)'
            }}>
              LeetCode: {user.leetcode_score}
            </span>
          )}
          <button 
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--accent-red)',
              borderRadius: '6px',
              color: 'var(--accent-red)',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '40px', width: '450px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 className="glow-text" style={{ textAlign: 'center', marginBottom: '5px' }}>Start Mock Interview</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '0px', marginBottom: '20px' }}>Configure your personalized session</p>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Target Role</label>
          <input
            list="roles"
            placeholder="Type or select a role"
            onChange={(e) => setRole(e.target.value)}
            className="input-field"
            defaultValue="Software Engineer"
          />
          <datalist id="roles">
            <option value="Software Engineer" /><option value="HR Manager" />
            <option value="Sales Executive" /><option value="Data Analyst" />
            <option value="Product Designer" /><option value="Marketing Lead" />
          </datalist>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Interview Difficulty</label>
          <select onChange={(e) => setDifficulty(e.target.value)} className="input-field" defaultValue="Intermediate">
            <option>Entry Level</option><option>Intermediate</option><option>Senior</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Number of Questions</label>
          <input type="number" value={qCount} onChange={(e) => setQCount(e.target.value)} className="input-field" min="1" max="10" />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Upload Resume (PDF)</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".pdf" className="input-field file-input" style={{ padding: '10px' }} />
        </div>

        <button onClick={startAnalysis} disabled={loading} className="btn-primary pulse-dot" style={{ marginTop: '15px' }}>
          {loading ? "Analyzing ATS Profile..." : "Start Interview"}
        </button>
      </div>
    </div>
  );
};

export default SetupScreen;