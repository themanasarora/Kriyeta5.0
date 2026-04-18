import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(null);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .landing-page {
          min-height: 100vh;
          width: 100%;
          background: #060612;
          color: #f0eeff;
          font-family: 'Outfit', sans-serif;
          overflow-x: hidden;
          position: relative;
          cursor: none;
        }

        /* Custom cursor */
        .cursor-glow {
          position: fixed;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 1;
          transition: opacity 0.3s ease;
          background: radial-gradient(circle, rgba(108,99,255,0.15) 0%, rgba(99,102,241,0.08) 30%, transparent 70%);
          transform: translate(-50%, -50%);
        }

        .cursor-dot {
          position: fixed;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #a78bfa;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 20px rgba(167,139,250,0.6), 0 0 60px rgba(167,139,250,0.2);
          transition: width 0.2s, height 0.2s, background 0.2s;
        }

        .cursor-dot.hovering {
          width: 16px;
          height: 16px;
          background: #c4b5fd;
        }

        /* Ambient animated gradients */
        .ambient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }

        .orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(108,99,255,0.2) 0%, transparent 70%);
          top: -200px; left: -100px;
          animation: orbFloat1 12s ease-in-out infinite;
        }
        .orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%);
          bottom: -150px; right: -100px;
          animation: orbFloat2 10s ease-in-out infinite;
        }
        .orb-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%);
          top: 40%; left: 50%;
          animation: orbFloat3 14s ease-in-out infinite;
        }

        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(60px, 40px); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-40px, -30px); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 50px) scale(1.1); }
        }

        /* Grid overlay */
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 0;
        }

        .landing-shell {
          position: relative;
          max-width: 1280px;
          margin: 0 auto;
          padding: 28px 48px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          z-index: 2;
        }

        /* Nav */
        .landing-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 8px 0 32px;
          animation: fadeInDown 0.6s ease both;
        }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
          font-family: 'Outfit', sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          cursor: none;
        }

        .brand-mark {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #6c63ff, #a855f7);
          box-shadow: 0 8px 30px rgba(108,99,255,0.4);
          font-weight: 800;
          font-size: 1.1rem;
          color: #fff;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .brand:hover .brand-mark {
          transform: rotate(-8deg) scale(1.1);
          box-shadow: 0 12px 40px rgba(108,99,255,0.6);
        }

        .nav-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .landing-btn {
          appearance: none;
          border: 0;
          border-radius: 14px;
          padding: 13px 22px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: none;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
        }

        .landing-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .landing-btn:hover::before { opacity: 1; }

        .landing-btn:hover {
          transform: translateY(-2px);
        }

        .landing-btn:active {
          transform: translateY(0) scale(0.98);
        }

        .landing-btn.primary {
          color: #fff;
          background: linear-gradient(135deg, #6c63ff, #a855f7);
          box-shadow: 0 8px 30px rgba(108,99,255,0.3);
        }

        .landing-btn.primary:hover {
          box-shadow: 0 16px 40px rgba(108,99,255,0.5);
        }

        .landing-btn.ghost {
          color: #f0eeff;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .landing-btn.ghost:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          box-shadow: 0 8px 30px rgba(255,255,255,0.05);
        }

        /* Hero */
        .hero {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 64px;
          align-items: center;
          flex: 1;
          padding: 32px 0 48px;
        }

        .hero-text {
          animation: fadeInUp 0.8s ease both;
          animation-delay: 0.2s;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(108,99,255,0.1);
          border: 1px solid rgba(108,99,255,0.2);
          color: #a78bfa;
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 600;
          margin-bottom: 28px;
          animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%, 100% { border-color: rgba(108,99,255,0.2); }
          50% { border-color: rgba(168,85,247,0.4); }
        }

        .hero h1 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(3.2rem, 6.5vw, 5.5rem);
          line-height: 1.0;
          letter-spacing: -0.04em;
          margin: 0;
          max-width: 11ch;
          font-weight: 900;
        }

        .hero h1 .highlight {
          display: block;
          background: linear-gradient(135deg, #a78bfa 0%, #6c63ff 40%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 4s ease-in-out infinite;
          background-size: 200% auto;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .hero p {
          max-width: 520px;
          margin: 24px 0 0;
          font-size: 1.12rem;
          line-height: 1.8;
          color: rgba(240,238,255,0.6);
          font-weight: 400;
        }

        .hero-actions {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          margin-top: 36px;
        }

        .hero-actions .landing-btn {
          padding: 15px 28px;
          font-size: 1rem;
        }

        /* Feature stack */
        .feature-stack {
          display: grid;
          gap: 18px;
          animation: fadeInUp 0.8s ease both;
          animation-delay: 0.5s;
        }

        .feature-card {
          padding: 22px 24px;
          border-radius: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
          cursor: none;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(108,99,255,0.08), transparent 60%);
          opacity: 0;
          transition: opacity 0.4s;
        }

        .feature-card:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: rgba(108,99,255,0.25);
          box-shadow: 0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(108,99,255,0.15);
        }

        .feature-card:hover::before { opacity: 1; }

        .feature-card strong {
          display: block;
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 6px;
          position: relative;
        }

        .feature-card p {
          margin: 0;
          color: rgba(240,238,255,0.55);
          font-size: 0.92rem;
          line-height: 1.6;
          position: relative;
        }

        .flow-pill {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
        }

        .step-badge {
          color: #38bdf8;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(56,189,248,0.08);
          border: 1px solid rgba(56,189,248,0.15);
          white-space: nowrap;
          position: relative;
          transition: all 0.3s;
        }

        .feature-card:hover .step-badge {
          background: rgba(56,189,248,0.12);
          border-color: rgba(56,189,248,0.3);
          box-shadow: 0 0 20px rgba(56,189,248,0.15);
        }

        /* Bottom accent line */
        .divider-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(108,99,255,0.3), rgba(56,189,248,0.2), transparent);
          margin: 14px 0 0;
        }

        /* Floating particles */
        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(167,139,250,0.3);
          pointer-events: none;
          z-index: 0;
        }

        @media (max-width: 900px) {
          .landing-page { cursor: auto; }
          .cursor-glow, .cursor-dot { display: none; }
          .hero {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .hero h1 { max-width: none; }
          .landing-shell { padding: 20px 24px; }
          .landing-btn, .brand, .feature-card { cursor: pointer; }
        }
      `}</style>

      <div className="landing-page">
        {/* Custom cursor */}
        <div
          className="cursor-glow"
          style={{ left: mousePos.x, top: mousePos.y }}
        />
        <div
          className={`cursor-dot ${isHovering ? 'hovering' : ''}`}
          style={{ left: mousePos.x, top: mousePos.y }}
        />

        {/* Ambient orbs */}
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
        <div className="ambient-orb orb-3" />

        {/* Subtle grid */}
        <div className="grid-overlay" />

        <div className="landing-shell">
          <header className="landing-nav">
            <Link
              className="brand"
              to="/"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <span className="brand-mark">K</span>
              Kriyeta
            </Link>
            <div className="nav-actions">
              <button
                className="landing-btn ghost"
                onClick={() => navigate('/login')}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                Sign in
              </button>
              <button
                className="landing-btn primary"
                onClick={() => navigate('/login')}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                Get Started
              </button>
            </div>
          </header>

          <main className="hero" ref={heroRef}>
            <section className="hero-text">
              <div className="eyebrow">✦ AI-Powered Interview Coaching</div>
              <h1>
                Practice smarter.
                <span className="highlight">Interview better.</span>
              </h1>
              <p>
                Step into realistic mock interviews powered by AI. Get instant feedback,
                improve your confidence, and land the job you deserve — all from your browser.
              </p>
              <div className="hero-actions">
                <button
                  className="landing-btn primary"
                  onClick={() => navigate('/login')}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  Start Practicing Free
                </button>
                <button
                  className="landing-btn ghost"
                  onClick={() => navigate('/login')}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  Create Account
                </button>
              </div>
            </section>

            <aside className="feature-stack">
              {[
                { num: '1', title: 'Choose your role', desc: 'Pick your target job title and we tailor questions to match.', step: 'Step 1' },
                { num: '2', title: 'Enter the interview room', desc: 'Face a realistic AI interviewer in a live video session.', step: 'Step 2' },
                { num: '3', title: 'Get instant feedback', desc: 'Receive detailed scoring and tips to level up your answers.', step: 'Step 3' },
              ].map((item, i) => (
                <div
                  className="feature-card flow-pill"
                  key={i}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  <div>
                    <strong>{item.num}. {item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                  <span className="step-badge">{item.step}</span>
                </div>
              ))}
              <div className="divider-line" />
            </aside>
          </main>
        </div>
      </div>
    </>
  );
};

export default LandingPage;