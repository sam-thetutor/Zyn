import React from 'react';

const Markets: React.FC = () => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Prediction Markets
        </h1>
        <p className="text-lg text-gray-600">
          Discover and trade on the future
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Markets Coming Soon
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          We're working on bringing you the best prediction markets. Check back soon!
        </p>
        <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Create First Market
        </button>
      </div>
    </div>
  );
};

export default Markets;
