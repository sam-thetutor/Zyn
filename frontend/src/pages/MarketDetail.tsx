import React from 'react';
import { useParams } from 'react-router-dom';

const MarketDetail: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Market Details</h1>
      <p className="text-gray-600 mb-8">
        View details and trade on prediction market #{id}.
      </p>
      
      <div className="card">
        <p className="text-center text-gray-500">
          Market detail functionality coming soon...
        </p>
      </div>
    </div>
  );
};

export default MarketDetail;
