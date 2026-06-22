import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Home from '@/pages/Home';
import PublishPage from '@/pages/PublishPage';
import ProvidersPage from '@/pages/ProvidersPage';
import ProviderDetailPage from '@/pages/ProviderDetailPage';
import OrdersPage from '@/pages/OrdersPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import MonitorPage from '@/pages/MonitorPage';
import DisputePage from '@/pages/DisputePage';
import GameAccountsPage from '@/pages/GameAccountsPage';
import WalletPage from '@/pages/WalletPage';
import RiskCenterPage from '@/pages/RiskCenterPage';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-night-950 via-esports-950 to-night-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,70,200,0.25),transparent)] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="noise-overlay absolute inset-0 pointer-events-none z-0" />
        <div className="relative z-10">
          <Navbar />
          <main className="pt-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/publish" element={<PublishPage />} />
              <Route path="/providers" element={<ProvidersPage />} />
              <Route path="/provider/:id" element={<ProviderDetailPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/order/:id" element={<OrderDetailPage />} />
              <Route path="/order/:id/monitor" element={<MonitorPage />} />
              <Route path="/arbitration" element={<DisputePage />} />
              <Route path="/dispute/:id" element={<DisputePage />} />
              <Route path="/account/games" element={<GameAccountsPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/risk" element={<RiskCenterPage />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
