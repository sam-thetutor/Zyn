import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from './config/wagmi';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Markets from './pages/Markets';
import MarketDetail from './pages/MarketDetail';

// Initialize Farcaster SDK
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <Router>
          <div className="min-h-screen bg-gray-100 flex flex-col">
            <Header />
            <main className="flex-1">
              <div className="max-w-[1280px] mx-auto">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/markets" element={<Markets />} />
                  <Route path="/market/:id" element={<MarketDetail />} />
                </Routes>
              </div>
            </main>
            <Footer />
          </div>
        </Router>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default App;
