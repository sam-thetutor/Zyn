import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from './config/wallet';
import { NotificationProvider } from './contexts/NotificationContext';
import { ReferralProvider } from './contexts/ReferralContext';
// import { FarcasterProvider } from './components/FarcasterProvider';
import MiniAppWrapper from './components/MiniAppWrapper';
import AppKitProvider from './components/AppKitProvider';
import AccountModalProvider from './components/AccountModalProvider';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Markets from './pages/Markets';
import MarketDetail from './pages/MarketDetail';
import CreateMarket from './pages/CreateMarket';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import Leaderboard from './pages/Leaderboard';


// Initialize Farcaster SDK
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <MiniAppWrapper>
          <AppKitProvider>
            <NotificationProvider>
              <ReferralProvider>
                <AccountModalProvider>
                  <Router>
                    <div className="min-h-screen bg-gray-100 flex flex-col">
                      <Header />
                      <main className="flex-1">
                        <div className="max-w-[1280px] mx-auto">
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/markets" element={<Markets />} />
                            <Route path="/market/:id" element={<MarketDetail />} />
                            <Route path="/create-market" element={<CreateMarket />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/admin" element={<Admin />} />
                            <Route path="/leaderboard" element={<Leaderboard />} />
                          </Routes>
                        </div>
                      </main>
                      <Footer />
                    </div>
                  </Router>
                </AccountModalProvider>
              </ReferralProvider>
            </NotificationProvider>
          </AppKitProvider>
        </MiniAppWrapper>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default App;
