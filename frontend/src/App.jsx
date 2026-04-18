import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Sidebar from './components/Sidebar';
import HUD from './components/HUD';
import SetupScreen from './components/SetupScreen';
import ATSReport from './components/ATSReport';
import InterviewRoom from './components/InterviewRoom';
import ProfileAnalyzer from './components/ProfileAnalyzer';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<SetupScreen />} />
            <Route path="/ats" element={<ATSReport />} />
            <Route path="/interview" element={<InterviewRoom />} />
            <Route path="/profile-analysis" element={<ProfileAnalyzer />} />
          </Routes>
        </main>
        <HUD />
      </div>
    </Router>
  );
}

export default App;