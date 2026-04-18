
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaRobot,
  FaFileAlt,
  FaChartLine,
  FaGithub,
  FaRocket,
} from 'react-icons/fa';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-900 shadow-md">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-teal-400">Kriyeta 5.0</h1>
          <div>
            <Link
              to="/login"
              className="bg-teal-500 text-white font-bold py-2 px-6 rounded-full hover:bg-teal-600 transition duration-300"
            >
              Login
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-20 text-center">
        <FaRocket className="text-7xl text-teal-400 mx-auto mb-6" />
        <h2 className="text-5xl font-extrabold mb-4">
          Ace Your Next Interview with AI-Powered Practice
        </h2>
        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
          Kriyeta 5.0 provides you with the tools to build confidence and excel in
          your technical interviews. Get instant feedback, track your
          progress, and land your dream job.
        </p>
        <Link
          to="/register"
          className="bg-green-500 text-white font-bold py-4 px-8 rounded-full hover:bg-green-600 transition duration-300 text-xl"
        >
          Get Started for Free
        </Link>
      </main>

      {/* Why Choose Section */}
      <section className="bg-gray-800 py-20">
        <div className="container mx-auto px-6">
          <h3 className="text-4xl font-bold text-center text-teal-400 mb-12">
            Why Choose Kriyeta 5.0?
          </h3>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-gray-700 p-8 rounded-lg shadow-lg transform hover:scale-105 transition duration-300">
              <h4 className="text-6xl font-bold text-teal-400 mb-4">75%</h4>
              <p className="text-gray-400">
                increase in interview performance after just 5 practice
                sessions.
              </p>
            </div>
            <div className="bg-gray-700 p-8 rounded-lg shadow-lg transform hover:scale-105 transition duration-300">
              <h4 className="text-6xl font-bold text-teal-400 mb-4">90%</h4>
              <p className="text-gray-400">
                of users reported higher confidence in their interviewing
                skills.
              </p>
            </div>
            <div className="bg-gray-700 p-8 rounded-lg shadow-lg transform hover:scale-105 transition duration-300">
              <h4 className="text-6xl font-bold text-teal-400 mb-4">4.8/5</h4>
              <p className="text-gray-400">
                average user rating for our AI-driven feedback and analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h3 className="text-4xl font-bold text-center text-teal-400 mb-12">
            Features Designed for Your Success
          </h3>
          <div className="grid md:grid-cols-2 gap-12">
            {/* AI Mock Interviews */}
            <div className="flex items-start space-x-6 bg-gray-800 p-8 rounded-lg shadow-lg">
              <FaRobot className="text-5xl text-teal-400" />
              <div>
                <h4 className="text-2xl font-bold mb-2">AI Mock Interviews</h4>
                <p className="text-gray-400">
                  Engage in realistic mock interviews with our AI. We use
                  real-time speech recognition to simulate a live interview
                  experience.
                </p>
              </div>
            </div>

            {/* ATS Resume Analysis */}
            <div className="flex items-start space-x-6 bg-gray-800 p-8 rounded-lg shadow-lg">
              <FaFileAlt className="text-5xl text-teal-400" />
              <div>
                <h4 className="text-2xl font-bold mb-2">ATS Resume Analysis</h4>
                <p className="text-gray-400">
                  Upload your resume and get an instant ATS score. Our analysis
                  helps you optimize your resume for applicant tracking systems.
                </p>
              </div>
            </div>

            {/* Live Performance Tracking */}
            <div className="flex items-start space-x-6 bg-gray-800 p-8 rounded-lg shadow-lg">
              <FaChartLine className="text-5xl text-teal-400" />
              <div>
                <h4 className="text-2xl font-bold mb-2">
                  Live Performance Tracking
                </h4>
                <p className="text-gray-400">
                  Get real-time feedback on your eye contact and use of filler
                  words, helping you to appear more confident and professional.
                </p>
              </div>
            </div>

            {/* In-depth Profile Analysis */}
            <div className="flex items-start space-x-6 bg-gray-800 p-8 rounded-lg shadow-lg">
              <FaGithub className="text-5xl text-teal-400" />
              <div>
                <h4 className="text-2xl font-bold mb-2">
                  In-depth Profile Analysis
                </h4>
                <p className="text-gray-400">
                  Connect your GitHub profile to receive a comprehensive
                  analysis of your coding activity and open-source
                  contributions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 mt-16">
        <div className="container mx-auto px-6 py-8 text-center text-gray-400">
          <p>&copy; 2024 Kriyeta 5.0. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
