import React, { useState, useRef, useEffect } from 'react';

const WEBSITE_INFO = {
  greeting: "Welcome to Kriyeta 5.0 — your AI-powered interview preparation platform. I can help you navigate the app and answer your questions.",
  quickReplies: [
    "How do I start an interview?",
    "What is ATS analysis?",
    "How does profile analysis work?",
    "What features are available?",
  ],
  responses: {
    "how do i start an interview?":
      "To start a mock interview:\n1. Go to the Home page from the sidebar.\n2. Select your target role, difficulty level, and number of questions.\n3. Upload your resume (PDF format).\n4. Click 'Start Interview' to begin your ATS analysis, then proceed to the live interview session.",
    "what is ats analysis?":
      "ATS (Applicant Tracking System) Analysis evaluates how well your resume matches a specific job role. After uploading your resume, the system provides:\n- A match score out of 100\n- A candidate profile summary\n- Areas to strengthen in your resume",
    "how does profile analysis work?":
      "Profile Analysis lets you evaluate your GitHub and coding profiles. Navigate to 'Profile Analysis' from the sidebar, enter your GitHub username, and the system will analyze your coding activity and contributions.",
    "what features are available?":
      "Kriyeta 5.0 offers:\n- AI Mock Interviews with real-time speech recognition\n- ATS Resume Analysis with scoring\n- Live eye contact and filler word tracking\n- AI-generated interview feedback\n- Profile Analysis for GitHub accounts\n- Full interview recording and playback",
  },
};

const Chatbot = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: WEBSITE_INFO.greeting },
  ]);
  const [input, setInput] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const endOfMessagesRef = useRef(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage) => {
    const lowerMsg = userMessage.toLowerCase().trim();
    // Check for matching known response
    for (const [key, value] of Object.entries(WEBSITE_INFO.responses)) {
      if (lowerMsg.includes(key) || key.includes(lowerMsg)) {
        return value;
      }
    }
    // Keyword-based fallbacks
    if (lowerMsg.includes('interview')) {
      return WEBSITE_INFO.responses['how do i start an interview?'];
    }
    if (lowerMsg.includes('ats') || lowerMsg.includes('resume') || lowerMsg.includes('score')) {
      return WEBSITE_INFO.responses['what is ats analysis?'];
    }
    if (lowerMsg.includes('profile') || lowerMsg.includes('github')) {
      return WEBSITE_INFO.responses['how does profile analysis work?'];
    }
    if (lowerMsg.includes('feature') || lowerMsg.includes('help') || lowerMsg.includes('what can')) {
      return WEBSITE_INFO.responses['what features are available?'];
    }
    return "I can help you navigate Kriyeta 5.0. Try asking about interviews, ATS analysis, profile analysis, or available features. You can also use the quick reply buttons below.";
  };

  const handleSend = (text) => {
    const message = text || input.trim();
    if (!message) return;

    const newMessages = [...messages, { sender: 'user', text: message }];
    setMessages(newMessages);
    setInput('');
    setShowQuickReplies(false);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: getBotResponse(message) },
      ]);
      setShowQuickReplies(true);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="web-assistant-overlay">
      <div className="web-assistant-panel glass-panel">
        {/* Header */}
        <div className="web-assistant-header">
          <div className="web-assistant-header-info">
            <div className="web-assistant-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </div>
            <div>
              <h3 className="web-assistant-title">Web Assistant</h3>
              <span className="web-assistant-status">Online</span>
            </div>
          </div>
          <button className="web-assistant-close" onClick={onClose} title="Close assistant">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="web-assistant-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`web-assistant-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}
            >
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{msg.text}</p>
            </div>
          ))}

          {/* Quick Replies */}
          {showQuickReplies && (
            <div className="web-assistant-quick-replies">
              {WEBSITE_INFO.quickReplies.map((reply, i) => (
                <button
                  key={i}
                  className="web-assistant-quick-btn"
                  onClick={() => handleSend(reply)}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input */}
        <div className="web-assistant-input-area">
          <input
            type="text"
            className="input-field"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{ flex: 1, borderRadius: '10px', padding: '10px 14px', fontSize: '0.9rem' }}
          />
          <button className="btn-primary web-assistant-send-btn" onClick={() => handleSend()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
