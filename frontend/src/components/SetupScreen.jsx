import React, { useState, useEffect, useRef } from "react";

// ─── Role Data ────────────────────────────────────────────────────────────────
const ROLE_GROUPS = [
  {
    label: "Tech",
    roles: [
      "Software Engineer", "Frontend Developer", "Backend Developer",
      "Full Stack Developer", "Mobile Developer", "DevOps Engineer",
      "Cloud Architect", "Data Engineer", "Machine Learning Engineer",
      "Cybersecurity Analyst", "Site Reliability Engineer", "QA Engineer",
    ],
  },
  {
    label: "Product",
    roles: ["Product Manager", "UX Designer", "UI Designer", "Product Designer", "UX Researcher"],
  },
  {
    label: "Data",
    roles: ["Data Scientist", "Data Analyst", "BI Analyst", "Quantitative Analyst"],
  },
  {
    label: "Business",
    roles: ["Project Manager", "Business Analyst", "Operations Manager", "HR Manager", "Chief of Staff"],
  },
  {
    label: "Marketing",
    roles: ["Sales Executive", "Account Executive", "Marketing Manager", "Growth Hacker", "Content Strategist"],
  },
  {
    label: "Niche",
    roles: ["Prompt Engineer", "Developer Advocate", "Solutions Architect", "Technical Writer", "Blockchain Developer", "AR/VR Developer", "Robotics Engineer"],
  },
];

// ─── Custom Role Dropdown ─────────────────────────────────────────────────────
const RoleDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (r) => { onChange(r); setOpen(false); };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "14px 18px",
          background: open ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? "rgba(56,189,248,0.6)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: "14px", color: "#fff", fontSize: "15px",
          fontFamily: "'Inter', sans-serif", textAlign: "left", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "10px", transition: "all 0.2s ease",
          boxShadow: open ? "0 0 0 3px rgba(56,189,248,0.15)" : "none",
          outline: "none",
        }}
      >
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"
          style={{ flexShrink: 0, transition: "transform 0.25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Panel */}
      <div style={{
        position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
        background: "rgba(14,14,24,0.97)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(56,189,248,0.2)", borderRadius: "16px",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        zIndex: 999, overflow: "hidden", transformOrigin: "top center",
        transition: "opacity 0.2s ease, transform 0.2s cubic-bezier(0.22,1,0.36,1)",
        opacity: open ? 1 : 0,
        transform: open ? "scaleY(1)" : "scaleY(0.92)",
        pointerEvents: open ? "auto" : "none",
      }}>
        {/* Category chips */}
        <div style={{ display: "flex", gap: "6px", padding: "12px 12px 8px", flexWrap: "wrap" }}>
          {ROLE_GROUPS.map((g, i) => (
            <button key={g.label} type="button" onClick={() => setActiveGroup(i)}
              style={{
                padding: "4px 12px", borderRadius: "20px", border: "none",
                background: activeGroup === i
                  ? "linear-gradient(90deg, rgba(14,165,233,0.35), rgba(99,102,241,0.35))"
                  : "rgba(255,255,255,0.06)",
                color: activeGroup === i ? "#38bdf8" : "rgba(255,255,255,0.4)",
                fontSize: "11px", fontWeight: 600, cursor: "pointer",
                whiteSpace: "nowrap", transition: "all 0.15s ease",
                fontFamily: "'Inter', sans-serif", outline: "none",
                letterSpacing: "0.3px",
              }}
            >{g.label}</button>
          ))}
        </div>
        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.05)", margin: "0 12px" }} />
        {/* Role list */}
        <div style={{
          maxHeight: "210px", overflowY: "auto", padding: "8px",
          scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent",
        }}>
          {ROLE_GROUPS[activeGroup].roles.map(r => (
            <button key={r} type="button" onClick={() => select(r)}
              style={{
                width: "100%", padding: "9px 14px",
                background: value === r ? "rgba(56,189,248,0.12)" : "transparent",
                border: "none", borderRadius: "10px",
                color: value === r ? "#38bdf8" : "rgba(255,255,255,0.75)",
                fontSize: "14px", textAlign: "left", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "background 0.12s ease, color 0.12s ease",
                fontFamily: "'Inter', sans-serif", outline: "none",
              }}
              onMouseEnter={e => { if (value !== r) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { if (value !== r) e.currentTarget.style.background = "transparent"; }}
            >
              {r}
              {value === r && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
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
          padding: 20px;
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
            <div style={{ textAlign: 'center', marginBottom: '40px', width: '100%' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
                Welcome Back
              </div>
              <div style={{ color: 'white', fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px' }}>
                Hello, {user.name || user.email.split('@')[0]}
              </div>
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

              {/* Target Role — custom dropdown */}
              <div className="input-group">
                <label className="input-label">Target Role</label>
                <RoleDropdown value={role} onChange={setRole} />
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

              {/* Number of Questions — stepper */}
              <div className="input-group full-width">
                <label className="input-label">Number of Questions</label>
                <div style={{
                  display: "flex", alignItems: "center",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px", overflow: "hidden", height: "54px",
                }}>
                  {/* Decrease */}
                  <button
                    type="button"
                    onClick={() => setQCount(q => Math.max(1, q - 1))}
                    disabled={qCount <= 1}
                    style={{
                      width: "54px", height: "100%", border: "none",
                      borderRight: "1px solid rgba(255,255,255,0.06)",
                      background: "transparent",
                      color: qCount <= 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)",
                      fontSize: "22px", fontWeight: 300, cursor: qCount <= 1 ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.15s ease, color 0.15s ease",
                      flexShrink: 0, outline: "none",
                    }}
                    onMouseEnter={e => { if (qCount > 1) { e.currentTarget.style.background = "rgba(56,189,248,0.1)"; e.currentTarget.style.color = "#38bdf8"; }}}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = qCount <= 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)"; }}
                  >−</button>

                  {/* Count */}
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <span style={{ fontSize: "20px", fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif", display: "block", lineHeight: 1.2 }}>{qCount}</span>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "1px" }}>
                      {qCount === 1 ? "question" : "questions"}
                    </span>
                  </div>

                  {/* Increase */}
                  <button
                    type="button"
                    onClick={() => setQCount(q => Math.min(10, q + 1))}
                    disabled={qCount >= 10}
                    style={{
                      width: "54px", height: "100%", border: "none",
                      borderLeft: "1px solid rgba(255,255,255,0.06)",
                      background: "transparent",
                      color: qCount >= 10 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)",
                      fontSize: "22px", fontWeight: 300, cursor: qCount >= 10 ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.15s ease, color 0.15s ease",
                      flexShrink: 0, outline: "none",
                    }}
                    onMouseEnter={e => { if (qCount < 10) { e.currentTarget.style.background = "rgba(56,189,248,0.1)"; e.currentTarget.style.color = "#38bdf8"; }}}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = qCount >= 10 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)"; }}
                  >+</button>
                </div>
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