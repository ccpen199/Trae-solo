import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import useStore from './store';
import { userAPI } from './api/client';
import HomePage from './pages/HomePage';
import EventDetail from './pages/EventDetail';
import SeatSelection from './pages/SeatSelection';
import OrderConfirm from './pages/OrderConfirm';
import OrderDetail from './pages/OrderDetail';
import TicketDetail from './pages/TicketDetail';
import MyTickets from './pages/MyTickets';
import AdminDashboard from './pages/admin/Dashboard';
import AdminBoxOffice from './pages/admin/BoxOffice';
import AdminAudience from './pages/admin/Audience';
import AdminRisk from './pages/admin/Risk';
import AdminInventory from './pages/admin/Inventory';
import VenueManage from './pages/admin/VenueManage';
import SessionManage from './pages/admin/SessionManage';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  const storeUser = useStore((state) => state.currentUser);

  useEffect(() => {
    const initUser = async () => {
      try {
        const result = await userAPI.list({ limit: 1 });
        if (result.data && result.data.length > 0) {
          setCurrentUser(result.data[0]);
          useStore.getState().setCurrentUser(result.data[0]);
        }
      } catch (e) {
        console.log('No user found');
      }
    };
    initUser();
  }, []);

  const isAdmin = location.pathname.startsWith('/admin');
  if (isAdmin) {
    return (
      <div className="app">
        <nav className="navbar">
          <div className="navbar-content">
            <Link to="/admin" className="logo">票务平台管理后台</Link>
            <div className="nav-links">
              <Link to="/">前台</Link>
              <Link to="/admin" className="admin-entry-link">管理后台</Link>
            </div>
          </div>
        </nav>
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <Link to="/admin">管理后台概览</Link>
            <Link to="/admin/box-office">订单管理</Link>
            <Link to="/admin/audience">用户管理</Link>
            <Link to="/admin/inventory">商品管理</Link>
            <Link to="/admin/risk">运营数据</Link>
            <Link to="/admin/venues">场馆管理</Link>
            <Link to="/admin/sessions">场次管理</Link>
          </aside>
          <main className="admin-content">
            <Routes>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/box-office" element={<AdminBoxOffice />} />
              <Route path="/admin/audience" element={<AdminAudience />} />
              <Route path="/admin/risk" element={<AdminRisk />} />
              <Route path="/admin/inventory" element={<AdminInventory />} />
              <Route path="/admin/venues" element={<VenueManage />} />
              <Route path="/admin/sessions" element={<SessionManage />} />
            </Routes>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="logo">🎫 泛文娱票务</Link>
          <div className="nav-links">
            <Link to="/">首页</Link>
            <Link to="/tickets">我的票券</Link>
            <Link to="/admin" className="admin-entry-link nav-button-link">
              管理后台
            </Link>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/session/:id/select-seat" element={<SeatSelection />} />
          <Route path="/order/:id/confirm" element={<OrderConfirm />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/ticket/:id" element={<TicketDetail />} />
          <Route path="/tickets" element={<MyTickets />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
