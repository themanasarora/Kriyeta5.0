import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import InteractiveBackground from "./InteractiveBackground";

const SetupScreen = () => {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [qCount, setQCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
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

  const startAnalysis = async (e) => {
    e.preventDefault();
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .setup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          background: transparent;
          position: relative;
          overflow: hidden;
          padding: 20px 20px 20px 200px;
        }

        /* Wrapper */
        .setup-content-wrapper {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 800px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }

        /* User Header */
        .user-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 16px 32px;
          border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          align-self: center;
          flex-wrap: wrap;
        }
        .user-welcome { color: rgba(255,255,255,0.7); font-size: 16px; }
        .user-welcome strong { color: #fff; font-weight: 700; font-size: 17px; }
        
        .score-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.3px;
        }
        .badge-github {
          background: rgba(167, 139, 250, 0.1);
          color: #c4b5fd;
          border: 1px solid rgba(167, 139, 250, 0.3);
        }
        .badge-leetcode {
          background: rgba(251, 146, 60, 0.1);
          color: #fdba74;
          border: 1px solid rgba(251, 146, 60, 0.3);
        }

        .logout-btn {
          padding: 6px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 100px;
          color: #fca5a5;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #fff;
        }

        /* Card */
        .setup-card {
          width: 100%;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 56px;
          box-shadow:
            0 0 0 1px rgba(99,102,241,0.1),
            0 32px 64px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.08);
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Logo / icon */
        .setup-logo {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          box-shadow: 0 8px 24px rgba(14, 165, 233, 0.4);
        }
        .setup-logo svg { width: 28px; height: 28px; }

        .setup-title {
          text-align: center;
          font-size: 32px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }
        .setup-subtitle {
          text-align: center;
          font-size: 16px;
          color: rgba(255,255,255,0.45);
          margin-bottom: 48px;
        }

        /* Form Grid */
        .setup-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px 32px;
        }

        .input-group { position: relative; }

        .input-group.full-width {
          grid-column: 1 / -1;
        }

        .input-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          margin-bottom: 8px;
          letter-spacing: 0.3px;
          transition: color 0.2s;
        }
        .input-label.focused { color: #38bdf8; }

        .setup-input {
          width: 100%;
          padding: 14px 18px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          color: #fff;
          font-size: 15px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }
        .setup-input::placeholder { color: rgba(255,255,255,0.2); }
        .setup-input:focus {
          border-color: rgba(56, 189, 248, 0.6);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
        }
        select.setup-input option {
          background: #1e1e2e;
          color: #fff;
        }

        /* File Input Custom Styling */
        .file-upload-wrapper {
          position: relative;
          width: 100%;
          height: 120px;
          border: 2px dashed rgba(255,255,255,0.15);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background: rgba(255,255,255,0.02);
          cursor: pointer;
          overflow: hidden;
        }
        .file-upload-wrapper:hover {
          border-color: rgba(56, 189, 248, 0.5);
          background: rgba(56, 189, 248, 0.05);
        }
        .file-upload-wrapper.has-file {
          border-color: rgba(52, 211, 153, 0.5);
          background: rgba(52, 211, 153, 0.05);
        }
        .file-upload-input {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        .file-icon {
          color: rgba(255,255,255,0.4);
          margin-bottom: 8px;
          transition: color 0.2s;
        }
        .file-upload-wrapper:hover .file-icon { color: rgba(56, 189, 248, 0.8); }
        .file-upload-wrapper.has-file .file-icon { color: rgba(52, 211, 153, 0.8); }
        .file-text {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          font-weight: 500;
        }
        .file-subtext {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          margin-top: 4px;
        }

        /* Submit button */
        .submit-btn {
          grid-column: 1 / -1;
          width: 100%;
          padding: 16px;
          margin-top: 16px;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.3px;
        }
        .submit-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(14, 165, 233, 0.4);
        }
        .submit-btn:hover:not(:disabled)::after { opacity: 1; }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Loading spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.7s linear infinite;
          margin-right: 10px;
          vertical-align: middle;
        }

        @media (max-width: 768px) {
          .setup-form { grid-template-columns: 1fr; gap: 20px; }
          .setup-card { padding: 40px 24px; border-radius: 20px; }
        }
      `}</style>

      <div className="setup-page">
        <InteractiveBackground />
        
        <div className="setup-content-wrapper">
          {user && (
            <div className="user-header">
              <span className="user-welcome">
                Welcome, <strong>{user.name || user.email}</strong>
              </span>

              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}

          <div className="setup-card">
            <div className="setup-logo">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            
            <h1 className="setup-title">Start Mock Interview</h1>
            <p className="setup-subtitle">Configure your personalized AI interview session</p>

            <form className="setup-form" onSubmit={startAnalysis}>
              
              {/* Target Role */}
              <div className="input-group">
                <label className={`input-label ${focusedField === "role" ? "focused" : ""}`}>
                  Target Role
                </label>
                <input
                  list="roles"
                  name="role"
                  placeholder="Type or select a role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  onFocus={() => setFocusedField("role")}
                  onBlur={() => setFocusedField(null)}
                  className="setup-input"
                />
                <datalist id="roles">
                  <option value="Software Engineer" />
                  <option value="HR Manager" />
                  <option value="Sales Executive" />
                  <option value="Data Analyst" />
                  <option value="Product Designer" />
                  <option value="Marketing Lead" />
                </datalist>
              </div>

              {/* Interview Difficulty */}
              <div className="input-group">
                <label className={`input-label ${focusedField === "difficulty" ? "focused" : ""}`}>
                  Interview Difficulty
                </label>
                <select 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)} 
                  className="setup-input"
                  onFocus={() => setFocusedField("difficulty")}
                  onBlur={() => setFocusedField(null)}
                >
                  <option value="Entry Level">Entry Level</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>

              {/* Number of Questions */}
              <div className="input-group full-width">
                <label className={`input-label ${focusedField === "qCount" ? "focused" : ""}`}>
                  Number of Questions
                </label>
                <input 
                  type="number" 
                  value={qCount} 
                  onChange={(e) => setQCount(e.target.value)} 
                  className="setup-input" 
                  min="1" 
                  max="10"
                  onFocus={() => setFocusedField("qCount")}
                  onBlur={() => setFocusedField(null)} 
                />
              </div>

              {/* Upload Resume */}
              <div className="input-group full-width">
                <label className="input-label">
                  Upload Resume (PDF)
                </label>
                <div className={`file-upload-wrapper ${file ? 'has-file' : ''}`}>
                  <input 
                    type="file" 
                    onChange={(e) => setFile(e.target.files[0])} 
                    accept=".pdf" 
                    className="file-upload-input"
                    required
                  />
                  <div className="file-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <polyline points="9 15 12 12 15 15"></polyline>
                    </svg>
                  </div>
                  <span className="file-text">
                    {file ? file.name : "Click or drag PDF to upload"}
                  </span>
                  {!file && <span className="file-subtext">Maximum file size: 5MB</span>}
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" disabled={loading} className="submit-btn">
                {loading && <span className="spinner" />}
                {loading ? "Analyzing ATS Profile..." : "Start Interview Session"}
              </button>
              
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SetupScreen;