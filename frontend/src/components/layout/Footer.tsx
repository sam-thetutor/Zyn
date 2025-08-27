import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Brand Section */}
          <div className="footer-brand">
            <Link to="/" >
              <img src="/logo.png" alt="Logo" className="logo-icon" />
              <div className="brand-text">
                <h3 className="brand-name">Zyn</h3>
                <p className="brand-tagline">Decentralized prediction markets on Base</p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="footer-nav">
            <div className="nav-section">
              <h4 className="nav-title">Platform</h4>
              <div className="nav-links">
                <Link to="/markets" className="nav-link">Browse Markets</Link>
                <Link to="/create" className="nav-link">Create Market</Link>
                <Link to="/profile" className="nav-link">Profile</Link>
              </div>
            </div>
            
            <div className="nav-section">
              <h4 className="nav-title">Resources</h4>
              <div className="nav-links">
                <a href="#" className="nav-link">Documentation</a>
                <a href="#" className="nav-link">API</a>
                <a href="#" className="nav-link">Support</a>
              </div>
            </div>
            
            <div className="nav-section">
              <h4 className="nav-title">Community</h4>
              <div className="nav-links">
                <a href="#" className="nav-link">Discord</a>
                <a href="#" className="nav-link">Twitter</a>
                <a href="#" className="nav-link">Blog</a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>© {new Date().getFullYear()} Zyn. All rights reserved.</p>
            </div>
            
            <div className="footer-actions">
              <a href="#" className="action-link">Privacy Policy</a>
              <a href="#" className="action-link">Terms of Service</a>
              <a href="#" className="action-link">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
