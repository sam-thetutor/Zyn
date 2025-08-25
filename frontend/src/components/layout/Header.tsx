import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import ConnectWallet from '../wallet/ConnectWallet';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const handleDisconnect = () => {
    disconnect();
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="header">
      <nav>
        {/* Logo on the left */}
        <Link to="/" className="logo">
          <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px' }} />
        </Link>

        {/* Desktop Navigation */}
        <div className="desktop-navigation">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/markets" className={`nav-link ${isActive('/markets') ? 'active' : ''}`}>
            Markets
          </Link>
          
          {/* Only show Create Market and Profile when logged in */}
          {isConnected && (
            <>
              <Link to="/create-market" className={`nav-link ${isActive('/create-market') ? 'active' : ''}`}>
                Create Market
              </Link>
              <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
                Profile
              </Link>
            </>
          )}
          
          {/* Wallet section - Connect or Disconnect */}
          <div className="wallet-section">
            {isConnected ? (
              <div className="desktop-disconnect">
                <span className="wallet-address">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <button onClick={handleDisconnect} className="disconnect-btn">
                  Disconnect
                </button>
              </div>
            ) : (
              <ConnectWallet />
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <div className="mobile-menu-header">
              {isConnected ? (
                <div className="mobile-disconnect">
                  <span className="wallet-address">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  <button onClick={handleDisconnect} className="disconnect-btn">
                    Disconnect
                  </button>
                </div>
              ) : (
                <ConnectWallet />
              )}
            </div>
            
            <div className="mobile-menu-content">
              <div className="mobile-navigation">
                <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  Home
                </Link>
                <Link to="/markets" className={`nav-link ${isActive('/markets') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  Markets
                </Link>
                
                {/* Only show Create Market and Profile when logged in on mobile too */}
                {isConnected && (
                  <>
                    <Link to="/create-market" className={`nav-link ${isActive('/create-market') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                      Create Market
                    </Link>
                    <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                      Profile
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
