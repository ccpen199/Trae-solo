import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Competitors from './pages/Competitors';
import Products from './pages/Products';
import Alerts from './pages/Alerts';
import HotProducts from './pages/HotProducts';
import { alertsAPI } from './services/api';
import './App.css';

function App() {
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  useEffect(() => {
    loadUnreadAlerts();
    const interval = setInterval(loadUnreadAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadAlerts = async () => {
    try {
      const response = await alertsAPI.getUnread();
      setUnreadAlertsCount(response.data.length);
    } catch (error) {
      console.error('Failed to load unread alerts:', error);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar unreadAlerts={unreadAlertsCount} />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/hot-products" element={<HotProducts />} />
            <Route path="/competitors" element={<Competitors />} />
            <Route path="/products" element={<Products />} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <span className="text-2xl mr-2">🛒</span>
                <span className="text-lg font-semibold text-gray-800">竞品监控系统</span>
              </div>
              <div className="text-sm text-gray-500">
                © 2026 跨境购物竞品监控系统 | 帮助您实时监控竞品价格变化
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
