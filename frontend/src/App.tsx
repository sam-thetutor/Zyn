import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from './config/wagmi';
import Header from './components/Header';
import Home from './pages/Home';
import Markets from './pages/Markets';

// Initialize Farcaster SDK
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-[1280px] mx-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/markets" element={<Markets />} />
              </Routes>
            </div>
          </div>
        </Router>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default App;
