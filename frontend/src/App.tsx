import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from './config/wagmi';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Markets from './pages/Markets';
import CreateMarket from './pages/CreateMarket';
import MarketDetail from './pages/MarketDetail';
import Profile from './pages/Profile';
import './App.css';

// Initialize Farcaster SDK
import '@farcaster/miniapp-sdk';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/create" element={<CreateMarket />} />
              <Route path="/markets/:id" element={<MarketDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Layout>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
