import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import InteractiveBackground from "./InteractiveBackground";

// Client ID is read from .env  →  REACT_APP_GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error("Critical: REACT_APP_GOOGLE_CLIENT_ID is missing from .env file or npm start needs a restart.");
}

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const googleBtnRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (sessionStorage.getItem("user")) {
      navigate("/setup", { replace: true });
    }
  }, [navigate]);

  // ── Google One-Tap handler ───────────────────────────────────────
  const handleGoogleResponse = async (response) => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/google-login", {
        token: response.credential,
      });
      sessionStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/setup", { replace: true });
    } catch (err) {
      console.error(err);
      alert("Google login failed. Please try again.");
    }
  };

  // ── Load & render Google SDK button ─────────────────────────────
  useEffect(() => {
    const initGoogle = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: googleBtnRef.current.offsetWidth || 340,
          text: "continue_with",
          shape: "rectangular",
        });
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    }
  }, []);

  // ── OAuth callback (redirect-based flows) ───────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oauth = params.get("oauth");
    const userData = params.get("user");
    if (oauth && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        sessionStorage.setItem("user", JSON.stringify(user));
        navigate("/setup", { replace: true });
      } catch (e) {
        console.error("Failed to parse OAuth user data", e);
      }
    }
  }, [location, navigate]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      alert("Email and password are required!");
      return;
    }
    setLoading(true);
    try {
      const endpoint = isRegister ? "/api/register-user" : "/api/login";
      const payload = isRegister
        ? { name: formData.name, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };

      const response = await axios.post(`http://127.0.0.1:5000${endpoint}`, payload);

      if (isRegister) {
        alert("Account created! Please sign in.");
        setIsRegister(false);
        setFormData({ email: formData.email, password: "", name: "" });
      } else {
        sessionStorage.setItem("user", JSON.stringify(response.data.user));
        navigate("/setup", { replace: true });
      }
    } catch (error) {
      alert(error.response?.data?.error || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
          background: transparent;
          position: relative;
          overflow: hidden;
        }

        /* Card */
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 600px;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 64px 56px;
          box-shadow:
            0 0 0 1px rgba(99,102,241,0.1),
            0 32px 64px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.08);
          animation: cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Logo / icon */
        .login-logo {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 8px 24px rgba(99,102,241,0.4);
        }
        .login-logo svg { width: 26px; height: 26px; }

        .login-title {
          text-align: center;
          font-size: 30px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }
        .login-subtitle {
          text-align: center;
          font-size: 15px;
          color: rgba(255,255,255,0.45);
          margin-bottom: 40px;
        }

        /* Google button wrapper */
        .google-btn-wrapper {
          width: 100%;
          margin-bottom: 24px;
          border-radius: 12px;
          overflow: hidden;
          /* Google SDK renders an iframe — we force it to fill */
          display: flex;
          justify-content: center;
        }
        .google-btn-wrapper > div {
          width: 100% !important;
        }

        /* Divider */
        .divider {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 24px;
          color: rgba(255,255,255,0.25);
          font-size: 12px; font-weight: 500; letter-spacing: 0.5px;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.08);
        }

        /* Form */
        .login-form { display: flex; flex-direction: column; gap: 16px; }

        .input-group { position: relative; }

        .input-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          margin-bottom: 6px;
          letter-spacing: 0.3px;
          transition: color 0.2s;
        }
        .input-label.focused { color: #a78bfa; }

        .login-input {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }
        .login-input::placeholder { color: rgba(255,255,255,0.2); }
        .login-input:focus {
          border-color: rgba(167,139,250,0.6);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }

        /* Submit button */
        .submit-btn {
          width: 100%;
          padding: 14px;
          margin-top: 4px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.2px;
        }
        .submit-btn::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(99,102,241,0.45);
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
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.7s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        /* Toggle link */
        .login-toggle {
          text-align: center;
          margin-top: 22px;
          font-size: 13px;
          color: rgba(255,255,255,0.4);
        }
        .login-toggle span {
          color: #a78bfa;
          cursor: pointer;
          font-weight: 600;
          transition: color 0.2s;
        }
        .login-toggle span:hover { color: #c4b5fd; text-decoration: underline; }
      `}</style>

      <div className="login-page">
        <InteractiveBackground />
        <div className="login-card">

          {/* Logo */}
          <div className="login-logo">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 className="login-title">
            {isRegister ? "Create account" : "Welcome back"}
          </h1>
          <p className="login-subtitle">
            {isRegister
              ? "Sign up to start your journey"
              : "Sign in to continue to Kriyeta"}
          </p>

          {/* Google Sign-In Button */}
          <div className="google-btn-wrapper" ref={googleBtnRef} />

          {/* Divider */}
          <div className="divider">OR</div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="input-group">
                <label
                  className={`input-label ${focusedField === "name" ? "focused" : ""}`}
                >
                  Full Name
                </label>
                <input
                  className="login-input"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
            )}

            <div className="input-group">
              <label
                className={`input-label ${focusedField === "email" ? "focused" : ""}`}
              >
                Email address
              </label>
              <input
                className="login-input"
                type="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>

            <div className="input-group">
              <label
                className={`input-label ${focusedField === "password" ? "focused" : ""}`}
              >
                Password
              </label>
              <input
                className="login-input"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? "Please wait…" : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="login-toggle">
            {isRegister ? "Already have an account? " : "Don't have an account? "}
            <span onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? "Sign In" : "Register"}
            </span>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;