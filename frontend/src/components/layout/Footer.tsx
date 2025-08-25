import React from 'react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../utils/constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link to="/" className="logo">
              <span className="logo-text">{APP_CONFIG.name}</span>
            </Link>
            <p className="text-sm text-gray-600 mt-2">
              Decentralized prediction markets on Base
            </p>
          </div>
          
          <div className="flex space-x-6">
            <Link to="/markets" className="text-sm text-gray-600 hover:text-gray-900">
              Markets
            </Link>
            <Link to="/create" className="text-sm text-gray-600 hover:text-gray-900">
              Create Market
            </Link>
            <Link to="/profile" className="text-sm text-gray-600 hover:text-gray-900">
              Profile
            </Link>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-6 pt-6 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
