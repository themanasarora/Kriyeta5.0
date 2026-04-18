import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const HUD = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm Kriyeta AI, your interview and career coach. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);

        try {
            const response = await axios.post('http://127.0.0.1:5000/api/chat', {
                messages: newMessages.map(m => ({ role: m.role, content: m.content }))
            });

            setMessages(prev => [...prev, { role: 'assistant', content: response.data.content }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later!" }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="hud-container" style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
            {/* Chat Window */}
            {isOpen && (
                <div className="glass-panel" style={{ 
                    position: 'absolute', bottom: '80px', right: '0', 
                    width: '350px', height: '500px', display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', animation: 'slideUp 0.3s ease-out'
                }}>
                    {/* Header */}
                    <div style={{ padding: '20px', background: 'rgba(0, 210, 255, 0.1)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '10px', height: '10px', background: '#00ff88', borderRadius: '50%' }}></div>
                        <h4 style={{ margin: 0, color: 'var(--accent-cyan)' }}>Kriyeta Assistant</h4>
                    </div>

                    {/* Messages Area */}
                    <div ref={scrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{ 
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                                padding: '12px 16px',
                                borderRadius: '15px',
                                borderTopRightRadius: msg.role === 'user' ? '2px' : '15px',
                                borderTopLeftRadius: msg.role === 'user' ? '15px' : '2px',
                                background: msg.role === 'user' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)',
                                color: msg.role === 'user' ? '#000' : '#fff',
                                fontSize: '0.9rem',
                                lineHeight: '1.4',
                                fontWeight: msg.role === 'user' ? '600' : '400'
                            }}>
                                {msg.content}
                            </div>
                        ))}
                        {isTyping && (
                            <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '15px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                Assistant is thinking...
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div style={{ padding: '15px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
                        <input 
                            type="text" 
                            className="input-field" 
                            placeholder="Ask me anything..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            style={{ padding: '10px', fontSize: '0.85rem' }}
                        />
                        <button className="btn-primary" onClick={handleSend} style={{ padding: '8px 15px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="btn-primary pulse-dot"
                style={{ 
                    width: '60px', height: '60px', borderRadius: '50%', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 32px 0 rgba(0, 210, 255, 0.4)',
                    padding: 0
                }}
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                )}
            </button>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default HUD;
