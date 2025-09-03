import React from 'react'
import { useAppKit } from '@reown/appkit/react'
import { useStats } from '../hooks/useStats'
import DebugStats from '../components/DebugStats'

const Home: React.FC = () => {
  const { open } = useAppKit()
  const { stats, loading: statsLoading } = useStats()

  return (
    <div className="min-h-screen">
      {/* Debug Component */}
      {/* <DebugStats /> */}
      
      {/* Hero Section */}
      <div className="relative overflow-hidden h-screen flex items-center justify-center">
        <div className="relative px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center text-center">
            <img src="/logo.png" alt="Zyn" className="w-16 h-16 md:w-32 md:h-32" />
            <h1 className="text-xl md:text-6xl font-bold text-gray-900 mb-6">
              Zyn Protocol
            </h1>
            <p className="text-xs md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Decentralized prediction markets on Base and Celo - where your insights
              become rewards
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => open()}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🚀 Start Trading Now
              </button>
              <button
                className="px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-gray-200"
              >
                📊 Create Market
              </button>
            </div>

            {/* Stats Dashboard in Hero */}
            <div className="grid grid-cols-2 md:grid-cols-4 mt-8 gap-4 mb-8 max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                  {statsLoading ? '...' : stats.totalMarkets}
                </div>
                <p className="text-xs md:text-sm text-gray-700 font-medium">
                  Total Markets
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                  {statsLoading ? '...' : stats.activeTraders}
                </div>
                <p className="text-xs md:text-sm text-gray-700 font-medium">
                  Active Traders
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">
                  {statsLoading ? '...' : `${stats.totalVolume} CELO`}
                </div>
                <p className="text-xs md:text-sm text-gray-700 font-medium">
                  Total Volume
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                <div className="text-2xl md:text-3xl font-bold text-yellow-600 mb-1">
                  {statsLoading ? '...' : stats.resolvedMarkets}
                </div>
                <p className="text-xs md:text-sm text-gray-700 font-medium">
                  Resolved markets
                </p>
              </div>
            </div>
          </div>
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
    </div>
  )
}

export default Home
