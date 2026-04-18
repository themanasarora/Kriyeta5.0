import React, { useState } from "react";
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      alert("All fields are required!");
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://127.0.0.1:5000/api/register-user', formData);
      alert("Registration successful! Please sign in with your credentials.");
      navigate('/login');
    } catch (error) {
      alert(error.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-panel" style={{ padding: '40px', width: '400px' }}>
        <h2 className="glow-text" style={{ textAlign: 'center', marginBottom: '10px' }}>
          Create Account
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '30px' }}>
          Sign up to get started
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary pulse-dot">
            {loading ? "Please wait..." : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
