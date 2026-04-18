
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Register from './components/Register'; // Import the new Register component
import LandingPage from './components/LandingPage'; // Import the new LandingPage component
import SetupScreen from './components/SetupScreen';
import ATSReport from './components/ATSReport';
import InterviewRoom from './components/InterviewRoom';
import Chatbot from './components/Chatbot';
import ProfileAnalyzer from './components/ProfileAnalyzer';
import UserHistory from './components/UserHistory';
import InterviewResult from './components/InterviewResult';

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/';

  return (
    <div className="main-layout">
      {!isAuthPage && <Sidebar isSidebarOpen={isSidebarOpen} />}
      <main className="main-content" style={isAuthPage ? { marginLeft: 0 } : {}}>
        {!isAuthPage && (
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Sidebar"
          >
            {isSidebarOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        )}

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/setup" element={<SetupScreen />} />
          <Route path="/ats" element={<ATSReport />} />
          <Route path="/interview" element={<InterviewRoom />} />
          <Route path="/profile" element={<ProfileAnalyzer />} />
          <Route path="/history" element={<UserHistory />} />
          <Route path="/result/:id" element={<InterviewResult />} />
        </Routes>

        {/* Floating Web Assistant */}
        {!isAuthPage && (
          <>
            <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
            {!isChatOpen && (
              <button
                className="floating-help"
                onClick={() => setIsChatOpen(true)}
                title="Web Assistant"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
