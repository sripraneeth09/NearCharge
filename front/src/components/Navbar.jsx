import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onLogin, onRegister, onShowLanding, onShowProfile }) {
  const { currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLinkClick = (action) => {
    action();
    closeMenu();
  };

  return (
    <nav className={`navbar ${isMenuOpen ? 'mobile-nav-active' : ''}`}>
      <div className="nav-container">
        <a className="logo" onClick={() => handleLinkClick(onShowLanding)}>
          <i className="fas fa-bolt" />
          <span className="logo-text">Near Charge</span>
        </a>

        {/* Desktop Nav */}
        {!currentUser && (
          <div className="nav-links">
            <a onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</a>
            <a onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>How It Works</a>
            <a onClick={() => document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' })}>Stories</a>
            <button className="btn btn-outline" onClick={onLogin}>Log In</button>
            <button className="btn btn-primary" onClick={onRegister}>Get Started</button>
          </div>
        )}

        {currentUser && (
          <div className="nav-links">
            <span style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
              Welcome, <span>{currentUser.name}</span>
            </span>
            <button className="btn btn-outline" onClick={onShowProfile}>Profile</button>
          </div>
        )}

        <button className="mobile-menu-btn" onClick={toggleMenu}>
          <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`} />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay show">
          <div className="mobile-menu-content">
            {!currentUser ? (
              <>
                <a onClick={() => { document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); closeMenu(); }}>Features</a>
                <a onClick={() => { document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); closeMenu(); }}>How It Works</a>
                <a onClick={() => { document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }); closeMenu(); }}>Stories</a>
                <div className="mobile-menu-btns">
                  <button className="btn btn-outline btn-lg" onClick={() => handleLinkClick(onLogin)}>Log In</button>
                  <button className="btn btn-primary btn-lg" onClick={() => handleLinkClick(onRegister)}>Get Started</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Logged in as</p>
                  <h3 style={{ color: 'var(--gray-900)' }}>{currentUser.name}</h3>
                </div>
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => handleLinkClick(onShowProfile)}>
                  Go to Profile
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
