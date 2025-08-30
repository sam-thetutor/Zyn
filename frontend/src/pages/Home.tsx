import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMarkets } from "../hooks/useMarkets";
// import { usePublicClient } from "wagmi";
import { formatEther } from "viem";
import { useMiniApp } from "../hooks/useMiniApp";
import NotificationContainer from "../components/NotificationContainer";
import ReferralBanner from "../components/ReferralBanner";

const Home: React.FC = () => {
  const { allMarkets, loading: marketsLoading } = useMarkets();
  // const publicClient = usePublicClient();
  const { isMiniApp, composeCast, addToFarcaster, triggerHaptic } = useMiniApp();
  const [stats, setStats] = useState({
    totalMarkets: 0,
    activeTraders: 0,
    totalVolume: 0n,
    marketsResolved: 0,
  });
  // const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Calculate statistics
  useEffect(() => {
    if (allMarkets.length > 0) {
      const totalMarkets = allMarkets.length;
      const marketsResolved = allMarkets.filter((m) => m.status === 1).length;
      const totalVolume = allMarkets.reduce((sum, m) => sum + m.totalPool, 0n);

      // Count unique participants (simplified)
      const uniqueParticipants = new Set();
      allMarkets.forEach((market) => {
        if (market.totalYes > 0n || market.totalNo > 0n) {
          uniqueParticipants.add("participant"); // Simplified for now
        }
      });

      setStats({
        totalMarkets,
        activeTraders: uniqueParticipants.size,
        totalVolume,
        marketsResolved,
      });
    }
  }, [allMarkets]);

  // Get trending markets (most active)
  const getTrendingMarkets = () => {
    return allMarkets
      .filter((m) => m.status === 0 && !m.isEnded) // Only active markets
      .sort((a, b) => Number(b.totalPool) - Number(a.totalPool))
      .slice(0, 3);
  };

  // Recent activity functionality commented out for now

  // Activity helper functions commented out for now

  return (
    <div className="min-h-screen">
      {/* Referral Banner */}
      <ReferralBanner />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden h-screen flex items-center justify-center">
        <div className="relative px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
            <img src="/logo.png" alt="Zyn" className="w-16 h-16 md:w-32 md:h-32" />
            <h1 className="text-xl md:text-6xl font-bold text-gray-900 mb-6">
              Zyn Protocol
              
            </h1>
            <p className="text-xs md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Decentralized prediction markets on Base - where your insights
              become rewards
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/markets"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🚀 Start Trading Now
              </Link>
              <Link
                to="/create-market"
                className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-gray-200"
              >
                📊 Create Market
              </Link>
              {isMiniApp && (
                <button
                  onClick={async () => {
                    await triggerHaptic('medium');
                    try {
                      await addToFarcaster();
                    } catch (error) {
                      console.log('User declined to add app');
                    }
                  }}
                  className="px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  ⭐ Add to Farcaster
                </button>
              )}
            </div>

            {/* Stats Dashboard in Hero */}
            <div className="grid grid-cols-2 md:grid-cols-4 mt-8 gap-4 mb-8 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                  {stats.totalMarkets}
                </div>
                <p className="text-xs md:text-sm text-gray-700 font-medium">
                  Total Markets
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                  {stats.activeTraders}
                </div>
                <p className="text-xs md:text-sm text-gray-700 font-medium">
                  Active Traders
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">
                  {formatEther(stats.totalVolume)} CELO
                </div>
                <p className="text-xs md:text-sm text-gray-700 font-medium">
                  Total Volume
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                <div className="text-2xl md:text-3xl font-bold text-yellow-600 mb-1">
                  {stats.marketsResolved}
                </div>
                <p className="text-xs md:text-sm text-gray-700 font-medium">
                  Resolved markets
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Trending Markets */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Trending Markets
            </h2>
            <Link
              to="/markets"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Markets →
            </Link>
          </div>
          {marketsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {getTrendingMarkets().map((market) => (
                <div
                  key={market.id.toString()}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {market.question}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {market.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">YES:</span>
                      <span className="font-medium text-green-600">
                        {market.totalYes > 0n || market.totalNo > 0n
                          ? `${(
                              (Number(market.totalYes) /
                                (Number(market.totalYes) +
                                  Number(market.totalNo))) *
                              100
                            ).toFixed(1)}%`
                          : "50.0%"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">NO:</span>
                      <span className="font-medium text-red-600">
                        {market.totalYes > 0n || market.totalNo > 0n
                          ? `${(
                              (Number(market.totalNo) /
                                (Number(market.totalYes) +
                                  Number(market.totalNo))) *
                              100
                            ).toFixed(1)}%`
                          : "50.0%"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>Pool: {formatEther(market.totalPool)} CELO</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {market.category}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/market/${market.id}`}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block"
                    >
                      View Market
                    </Link>
                    {isMiniApp && (
                      <button
                        onClick={async () => {
                          await triggerHaptic('light');
                          await composeCast(
                            `Check out this prediction market: "${market.question}" on @zynprotocol! 🚀`,
                            [`https://zynp.vercel.app/market/${market.id}`]
                          );
                        }}
                        className="bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors"
                        title="Share on Farcaster"
                      >
                        📢
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 px-4 mb-8 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Browse Markets
              </h3>
              <p className="text-gray-600">
                Find interesting prediction questions that match your expertise
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Buy Shares
              </h3>
              <p className="text-gray-600">
                Invest in YES or NO outcomes based on your predictions
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-yellow-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Claim Winnings
              </h3>
              <p className="text-gray-600">
                Get rewarded when your predictions turn out to be correct
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {/* <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Market Activity</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{getActivityText(activity)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {activity.transactionHash?.slice(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div> */}

      <NotificationContainer />
    </div>
  );
};

export default Home;
