import React from 'react';
import '../../styles/mobile.css';

const MobileNav = ({ viewMode, setViewMode, isOpen, setIsOpen }) => {
  return (
    <>
      <div className={`mobile-nav-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)} />
      <nav className={`mobile-nav ${isOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <h2>Navigation</h2>
          <button 
            className="mobile-nav-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <div className="mobile-nav-links">
          <button
            className={`mobile-nav-link ${viewMode === 'live' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('live');
              setIsOpen(false);
            }}
          >
            Live Data
          </button>
          <button
            className={`mobile-nav-link ${viewMode === 'history' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('history');
              setIsOpen(false);
            }}
          >
            Temporal Memory
          </button>
          <button
            className={`mobile-nav-link ${viewMode === 'about' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('about');
              setIsOpen(false);
            }}
          >
            About
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileNav;

