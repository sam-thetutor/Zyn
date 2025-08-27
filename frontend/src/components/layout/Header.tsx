import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount, useDisconnect, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import ConnectWallet from '../wallet/ConnectWallet';
import { ADMIN_ADDRESS } from '../../utils/constants';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const handleDisconnect = () => {
    disconnect();
    setIsMobileMenuOpen(false);
  };

  const handleSwitchToBase = () => {
    switchChain({ chainId: base.id });
  };

  const isActive = (path: string) => location.pathname === path;
  const isOnBaseNetwork = chainId === base.id;

  return (
    <header className="header">
      <nav>
        {/* Logo on the left */}
        <Link to="/" className="logo">
          <img src="/logo.png" alt="Logo" className="logo-icon" />
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
              <Link to="/create" className={`nav-link ${isActive('/create') ? 'active' : ''}`}>
                Create Market
              </Link>
              <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
                Profile
              </Link>
            </>
          )}
          
          {/* Admin link - only show for admin */}
          {isConnected && address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase() && (
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
              Admin
            </Link>
          )}
          
          {/* Network Indicator */}
          {isConnected && (
            <div className="network-indicator">
              {isOnBaseNetwork ? (
                <span className="network-badge base">Base ✓</span>
              ) : (
                <button 
                  onClick={handleSwitchToBase}
                  className="network-badge wrong-network"
                  title="Click to switch to Base network"
                >
                  {chainId === 1 ? 'ETH' : `Chain ${chainId}`} ⚠️
                </button>
              )}
            </div>
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
                    <Link to="/create" className={`nav-link ${isActive('/create') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                      Create Market
                    </Link>
                    <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                      Profile
                    </Link>
                  </>
                )}
                
                {/* Admin link - only show for admin on mobile too */}
                {isConnected && address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase() && (
                  <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                    Admin
                  </Link>
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
