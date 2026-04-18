import React, { useState } from 'react';
import axios from 'axios';

const ProfileAnalyzer = () => {
    const [githubUsername, setGithubUsername] = useState('');
    const [leetcodeUsername, setLeetcodeUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [activeTab, setActiveTab] = useState('github'); // 'github' or 'leetcode'

    const analyzeProfile = async (type) => {
        const username = type === 'github' ? githubUsername : leetcodeUsername;
        if (!username) {
            setError(`Please enter a ${type} username`);
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const url = `http://127.0.0.1:5000/api/${type}-profile`;
            const response = await axios.post(url, { username });
            setResult(response.data);
            setActiveTab(type);
        } catch (err) {
            setError(err.response?.data?.error || `Failed to analyze ${type} profile`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 className="glow-text" style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Developer Profile Analysis</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Get AI-powered insights and improvement suggestions for your coding profiles</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                {/* GitHub Input */}
                <div className="glass-panel" style={{ padding: '30px' }}>
                    <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '20px' }}>GitHub Profile</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="GitHub Username"
                            className="input-field"
                            value={githubUsername}
                            onChange={(e) => setGithubUsername(e.target.value)}
                        />
                        <button 
                            className="btn-primary" 
                            onClick={() => analyzeProfile('github')}
                            disabled={loading}
                        >
                            Analyze
                        </button>
                    </div>
                </div>

                {/* LeetCode Input */}
                <div className="glass-panel" style={{ padding: '30px' }}>
                    <h3 style={{ color: '#ffa116', marginBottom: '20px' }}>LeetCode Profile</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="LeetCode Username"
                            className="input-field"
                            value={leetcodeUsername}
                            onChange={(e) => setLeetcodeUsername(e.target.value)}
                        />
                        <button 
                            className="btn-primary" 
                            onClick={() => analyzeProfile('leetcode')}
                            disabled={loading}
                        >
                            Analyze
                        </button>
                    </div>
                </div>
            </div>

            {loading && (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="pulse-dot" style={{ width: '20px', height: '20px', background: 'var(--accent-cyan)', borderRadius: '50%', margin: '0 auto 20px' }}></div>
                    <p style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>AI is analyzing your profile...</p>
                </div>
            )}

            {error && (
                <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(255, 75, 43, 0.3)', marginBottom: '40px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--accent-red)', margin: 0 }}>{error}</p>
                </div>
            )}

            {result && (
                <div className="glass-panel" style={{ padding: '40px' }}>
                    {activeTab === 'github' ? (
                        <GitHubResult data={result} />
                    ) : (
                        <LeetCodeResult data={result} />
                    )}
                </div>
            )}
        </div>
    );
};

const GitHubResult = ({ data }) => {
    const { github, analysis } = data;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>
            <div style={{ textAlign: 'center' }}>
                <img 
                    src={github.avatar_url} 
                    alt={github.username} 
                    style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid var(--accent-cyan)', marginBottom: '20px' }} 
                />
                <h2 style={{ margin: '0 0 5px' }}>{github.name}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>@{github.username}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="glass-panel" style={{ padding: '15px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>{github.repo_count}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Repos</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '15px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>{github.total_stars}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Stars</div>
                    </div>
                </div>
                
                <div className="glass-panel" style={{ padding: '15px', marginTop: '10px' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#00ff88' }}>{github.activeness}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Activity Level</div>
                </div>
            </div>

            <div>
                {analysis ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                            <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--accent-cyan)' }}>{analysis.overall_score}</div>
                            <div>
                                <h3 style={{ margin: 0 }}>Profile Score</h3>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>AI-generated rating</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <h4 style={{ color: 'var(--accent-cyan)', marginBottom: '10px' }}>Expert Summary</h4>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{analysis.summary}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            <div>
                                <h4 style={{ color: '#00ff88', marginBottom: '15px' }}>Strengths</h4>
                                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                    {analysis.strengths.map((s, i) => (
                                        <li key={i} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>{s}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 style={{ color: '#ffd700', marginBottom: '15px' }}>Improvements</h4>
                                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                    {analysis.improvements.map((imp, i) => (
                                        <li key={i} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>{imp}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Analysis data not available. Check backend logs.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const LeetCodeResult = ({ data }) => {
    const { leetcode, analysis } = data;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '100px', height: '100px', background: '#ffa116', borderRadius: '20px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
                        <path d="M13.483 0a1.374 1.374 0 0 0-.961.414l-9.771 9.77a1.375 1.375 0 0 0 0 1.944l1.19 1.19a1.375 1.375 0 0 0 1.944 0l8.986-8.986 3.083 3.083-4.509 4.51a1.375 1.375 0 0 0 0 1.944l1.19 1.19a1.375 1.375 0 0 0 1.944 0l5.699-5.7a1.375 1.375 0 0 0 0-1.944L14.444.414A1.374 1.374 0 0 0 13.483 0zm-8.835 14.444a1.375 1.375 0 0 0-1.944 0l-1.19 1.19a1.375 1.375 0 0 0 0 1.944l9.533 9.533c.535.535 1.397.535 1.954 0s.535-1.42 0-1.954l-8.353-8.353z" />
                    </svg>
                </div>
                <h2 style={{ margin: '0 0 5px' }}>{leetcode.username}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>LeetCode Profile</p>
                
                <div className="glass-panel" style={{ padding: '20px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffa116' }}>{leetcode.total_solved}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Solved Problems</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <div className="glass-panel" style={{ padding: '10px' }}>
                        <div style={{ color: '#00ff88', fontWeight: '700' }}>{leetcode.easy_solved}</div>
                        <div style={{ fontSize: '0.7rem' }}>Easy</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '10px' }}>
                        <div style={{ color: '#ffb800', fontWeight: '700' }}>{leetcode.medium_solved}</div>
                        <div style={{ fontSize: '0.7rem' }}>Med</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '10px' }}>
                        <div style={{ color: '#ff375f', fontWeight: '700' }}>{leetcode.hard_solved}</div>
                        <div style={{ fontSize: '0.7rem' }}>Hard</div>
                    </div>
                </div>
            </div>

            <div>
                {analysis ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                            <div style={{ fontSize: '3rem', fontWeight: '900', color: '#ffa116' }}>{analysis.skill_level_score}</div>
                            <div>
                                <h3 style={{ margin: 0 }}>Problem Solving Score</h3>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>LeetCode proficiency rating</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <h4 style={{ color: '#ffa116', marginBottom: '10px' }}>Strategic Summary</h4>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{analysis.summary}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            <div>
                                <h4 style={{ color: '#00ff88', marginBottom: '15px' }}>Mastered Topics</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {(analysis.key_strengths || []).map((s, i) => (
                                        <span key={i} style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', fontSize: '0.85rem' }}>{s}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 style={{ color: '#ffd700', marginBottom: '15px' }}>Growth Areas</h4>
                                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                    {(analysis.suggested_topics || []).map((t, i) => (
                                        <li key={i} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Focus on {t}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <p style={{ color: 'var(--text-secondary)' }}>Analysis data not available. Check backend logs.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileAnalyzer;
