
import React from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Kriyeta 5.0</h1>
          <div>
            <Link
              to="/login"
              className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
            >
              Login
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Ace Your Next Interview with AI-Powered Practice
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Kriyeta 5.0 provides you with the tools to build confidence and excel in
            your technical interviews. Get instant feedback, track your
            progress, and land your dream job.
          </p>
          <Link
            to="/register"
            className="bg-green-500 text-white font-bold py-3 px-6 rounded-full hover:bg-green-700 text-lg"
          >
            Get Started for Free
          </Link>
        </div>

        <section className="mt-16">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Why Choose Kriyeta 5.0?
          </h3>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="bg-white p-8 rounded-lg shadow">
              <h4 className="text-5xl font-bold text-blue-500 mb-4">75%</h4>
              <p className="text-gray-600">
                increase in interview performance after just 5 practice
                sessions.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h4 className="text-5xl font-bold text-blue-500 mb-4">90%</h4>
              <p className="text-gray-600">
                of users reported higher confidence in their interviewing
                skills.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h4 className="text-5xl font-bold text-blue-500 mb-4">4.8/5</h4>
              <p className="text-gray-600">
                average user rating for our AI-driven feedback and analysis.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Features Designed for Your Success
          </h3>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-lg shadow">
              <h4 className="text-xl font-bold text-gray-800 mb-4">
                AI Mock Interviews
              </h4>
              <p className="text-gray-600">
                Engage in realistic mock interviews with our AI. We use
                real-time speech recognition to simulate a live interview
                experience.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h4 className="text-xl font-bold text-gray-800 mb-4">
                ATS Resume Analysis
              </h4>
              <p className="text-gray-600">
                Upload your resume and get an instant ATS score. Our analysis
                helps you optimize your resume for applicant tracking systems.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h4 className="text-xl font-bold text-gray-800 mb-4">
                Live Performance Tracking
              </h4>
              <p className="text-gray-600">
                Get real-time feedback on your eye contact and use of filler
                words, helping you to appear more confident and professional.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow">
              <h4 className="text-xl font-bold text-gray-800 mb-4">
                In-depth Profile Analysis
              </h4>
              <p className="text-gray-600">
                Connect your GitHub profile to receive a comprehensive analysis
                of your coding activity and open-source contributions.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white mt-16">
        <div className="container mx-auto px-6 py-4 text-center text-gray-600">
          <p>&copy; 2024 Kriyeta 5.0. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
