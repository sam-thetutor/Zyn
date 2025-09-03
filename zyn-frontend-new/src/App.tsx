import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { AppKitProvider } from '@reown/appkit/react'
import { wagmiConfig, appKitConfig } from './config/wallet'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Markets from './pages/Markets'
import CreateMarket from './pages/CreateMarket'
import MarketDetail from './pages/MarketDetail'
import './App.css'

// Create a client
const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppKitProvider config={appKitConfig}>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/markets" element={<Markets />} />
                <Route path="/market/:id" element={<MarketDetail />} />
                <Route path="/leaderboard" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold text-gray-900">🏆 Leaderboard</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
                <Route path="/create-market" element={<CreateMarket />} />
                <Route path="/profile" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold text-gray-900">Profile</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
                <Route path="/admin" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold text-gray-900">Admin</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>} />
              </Routes>
            </Layout>
          </Router>
        </AppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
