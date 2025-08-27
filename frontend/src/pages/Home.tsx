import React from 'react';
import { Link } from 'react-router-dom';
import { useMarkets } from '../hooks/useMarkets';
import MarketStats from '../components/markets/MarketStats';

const Home: React.FC = () => {
  const { allMarkets } = useMarkets();

  // Market statistics based on smart contract data
  const marketStats = {
    total: allMarkets.length,
    active: allMarkets.filter(market => market.status === 0 && !market.isEnded).length, // 0 = ACTIVE status
    resolved: allMarkets.filter(market => market.status === 1).length, // 1 = RESOLVED status
    ended: allMarkets.filter(market => market.isEnded && market.status === 0).length, // Ended but not resolved
    totalVolume: allMarkets.reduce((sum, market) => sum + market.totalYes + market.totalNo, 0n)
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section" style={{ marginTop: '2rem' }}>
        <div className="container">
          <h1 className="gradient-text text-5xl font-bold mb-6">Decentralized Prediction Markets</h1>
          <p className="text-secondary text-xl mb-8">Trade on the future with Zyn. Create markets, buy shares, and earn rewards on Base.</p>
          <div className="hero-buttons flex gap-4">
            <Link to="/markets" className="btn-primary text-lg px-8 py-3">
              Browse Markets
            </Link>
            <Link to="/create" className="btn-secondary text-lg px-8 py-3">
              Create Market
            </Link>
          </div>
        </div>
      </section>

      {/* Market Overview Section */}
      <section className="market-overview-section">
        <div className="container">
          <MarketStats stats={marketStats} />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card card text-center">
              <div className="feature-icon mb-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--color-primary)' }}>
                  <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.7 8l-5.1 5.1-2.8-2.7L7 14.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Trade Predictions</h3>
              <p className="text-secondary">Buy and sell shares in prediction markets. Profit from accurate predictions.</p>
            </div>
            
            <div className="feature-card card text-center">
              <div className="feature-icon mb-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--color-accent)' }}>
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Create Markets</h3>
              <p className="text-secondary">Start your own prediction markets on any topic you're passionate about.</p>
            </div>
            
            <div className="feature-card card text-center">
              <div className="feature-icon mb-4">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--color-secondary)' }}>
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 12c1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Earn Rewards</h3>
              <p className="text-secondary">Get rewarded for accurate predictions and market creation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section" style={{ marginTop: '10rem', marginBottom: '10rem' }}>
        <div className="container">
          <h2 className="section-title text-3xl font-bold text-center mb-12" style={{ color: 'var(--color-text-primary)' }}>How It Works</h2>
          <div className="steps-grid grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="step-item card text-center">
              <div className="step-number mb-4 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>1</div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Create a Market</h3>
              <p className="text-secondary">Set up a prediction market on any topic with clear outcomes and deadlines.</p>
            </div>
            
            <div className="step-item card text-center">
              <div className="step-number mb-4 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>2</div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Trade Shares</h3>
              <p className="text-secondary">Buy and sell shares based on your predictions. Prices reflect market sentiment.</p>
            </div>
            
            <div className="step-item card text-center">
              <div className="step-number mb-4 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto" style={{ backgroundColor: 'var(--color-secondary)', color: 'white' }}>3</div>
              <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Resolve & Earn</h3>
              <p className="text-secondary">When the market resolves, accurate predictions earn rewards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      {/* <section className="cta-section">
        <div className="container">
          <h2 className="cta-title text-3xl font-bold text-center mb-4" style={{ color: 'var(--color-text-primary)' }}>Ready to Start Trading?</h2>
          <p className="cta-subtitle text-xl text-center mb-8 text-secondary">Join the future of decentralized prediction markets on Base.</p>
          <div className="cta-buttons flex justify-center gap-4">
            <Link to="/markets" className="btn-primary text-lg px-8 py-3">
              Explore Markets
            </Link>
            <Link to="/create-market" className="btn-secondary text-lg px-8 py-3">
              Create Your First Market
            </Link>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default Home;
