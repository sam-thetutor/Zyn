import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Zyn
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your decentralized prediction market platform
        </p>
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Get Started
          </h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to start trading on prediction markets or create your own.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Browse Markets
            </button>
            <button className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
              Create Market
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
