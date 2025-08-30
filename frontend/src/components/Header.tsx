import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount, useDisconnect } from 'wagmi';
import { useReferral } from '../contexts/ReferralContext';
import ConnectWallet from './ConnectWallet';

const Header: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const location = useLocation();
  const { referralCode, referralAddress } = useReferral();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if current user is admin
  const isAdmin = address?.toLowerCase() === '0x21D654daaB0fe1be0e584980ca7C1a382850939f'.toLowerCase();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/logo.png" alt="Zyn" className="w-8 h-8" />
              </Link>
            </div>

            {/* Right Side - Navigation Links + Wallet Connection */}
            <div className="flex items-center space-x-8">
              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center space-x-8">
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Home
                </Link>
                <Link 
                  to="/markets" 
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Markets
                </Link>
                <Link 
                  to="/create-market" 
                  className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                >
                  Create Market
                </Link>
                <Link to="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Profile
                </Link>
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
                  >
                    Admin
                  </Link>
                )}
              </nav>

              {/* Desktop Wallet Connection */}
              <div className="hidden md:flex items-center">
                {isConnected ? (
                  <div className="flex items-center space-x-3">
                    {/* Referral Indicator */}
                    {referralCode && (
                      <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        <span>🎉</span>
                        <span>Referred by {referralAddress?.slice(0, 6)}...</span>
                      </div>
                    )}
                    
                    <span className="text-sm text-gray-600">
                      {formatAddress(address!)}
                    </span>
                    <button
                      onClick={() => disconnect()}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <ConnectWallet />
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Modal - Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeMobileMenu}
          ></div>
          
          {/* Modal Content */}
          <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Navigation Links */}
              <nav className="space-y-2">
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActiveLink('/')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/markets"
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActiveLink('/markets')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Markets
                </Link>
                <Link
                  to="/create-market"
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActiveLink('/create-market')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Create Market
                </Link>
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActiveLink('/profile')
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={closeMobileMenu}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActiveLink('/admin')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </nav>
              
              {/* Wallet Connection */}
              <div className="pt-4 border-t border-gray-200">
                {isConnected ? (
                  <div className="space-y-3">
                    <div className="px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-md">
                      Connected: {formatAddress(address!)}
                    </div>
                    <button
                      onClick={() => {
                        disconnect();
                        closeMobileMenu();
                      }}
                      className="w-full px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                ) : (
                  <div className="px-3 py-2">
                    <ConnectWallet />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
