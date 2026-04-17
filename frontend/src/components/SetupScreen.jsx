import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SetupScreen = () => {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [qCount, setQCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const startAnalysis = async () => {
    if (!file || !role) {
      alert("Please upload a resume and select a role!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('role', role); // Sent to Backend
    formData.append('difficulty', difficulty); // Sent to Backend

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
      <div className="glass-panel" style={{ padding: '40px', width: '400px', display: 'flex', flexDirection: 'column', gap: '20px', margin: '10vh auto' }}>
        <h2 className="glow-text" style={{ textAlign: 'center', marginBottom: '10px' }}>Kriyeta 5.0</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '-15px', marginBottom: '20px' }}>Setup your Mock Interview</p>

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
          <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".pdf" className="input-field" style={{ padding: '8px' }} />
        </div>

        <button onClick={startAnalysis} disabled={loading} className="btn-primary pulse-dot" style={{ marginTop: '10px' }}>
          {loading ? "Analyzing ATS Profile..." : "Start Interview"}
        </button>
      </div>
    </div>
  );
};

export default SetupScreen;