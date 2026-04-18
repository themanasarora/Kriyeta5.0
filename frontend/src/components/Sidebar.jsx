import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: 'Home',
      path: '/setup',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      label: 'Profile Analysis',
      path: '/profile',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
    },
    {
      label: 'Performance Hub',
      path: '/history',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20v-6M6 20V10M18 20V4" />
        </svg>
      ),
    },
  ];

  return (
    <aside className={`sidebar glass-panel ${isSidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2 className="glow-text text-center">Kriyeta 5.0</h2>
        <p className="sidebar-subtitle">AI Interview Coach</p>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
