import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1>Decentralized Prediction Markets</h1>
          <p>Trade on the future with Zyn. Create markets, buy shares, and earn rewards on Base.</p>
          <div className="hero-buttons">
            <Link to="/markets" className="btn btn-primary">
              Browse Markets
            </Link>
            <Link to="/create-market" className="btn btn-secondary">
              Create Market
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.7 8l-5.1 5.1-2.8-2.7L7 14.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Trade Predictions</h3>
              <p>Buy and sell shares in prediction markets. Profit from accurate predictions.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Create Markets</h3>
              <p>Start your own prediction markets on any topic you're passionate about.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Earn Rewards</h3>
              <p>Get rewarded for accurate predictions and market creation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3>Create a Market</h3>
              <p>Set up a prediction market on any topic with clear outcomes and deadlines.</p>
            </div>
            
            <div className="step-item">
              <div className="step-number">2</div>
              <h3>Trade Shares</h3>
              <p>Buy and sell shares based on your predictions. Prices reflect market sentiment.</p>
            </div>
            
            <div className="step-item">
              <div className="step-number">3</div>
              <h3>Resolve & Earn</h3>
              <p>When the market resolves, accurate predictions earn rewards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Ready to Start Trading?</h2>
          <p className="cta-subtitle">Join the future of decentralized prediction markets on Base.</p>
          <div className="cta-buttons">
            <Link to="/markets" className="btn btn-primary">
              Explore Markets
            </Link>
            <Link to="/create-market" className="btn btn-secondary">
              Create Your First Market
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
