import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import SetupScreen from './components/SetupScreen';
import ATSReport from './components/ATSReport';
import InterviewRoom from './components/InterviewRoom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SetupScreen />} />
        <Route path="/ats" element={<ATSReport />} />
        <Route path="/interview" element={<InterviewRoom />} />
      </Routes>
    </Router>
  );
}

export default App;