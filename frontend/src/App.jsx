import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MainLayout from './components/Layout/MainLayout';
import AdminLayout from './components/Layout/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EventDetail from './pages/EventDetail';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';
import TicketList from './pages/TicketList';
import Discover from './pages/Discover';
import ArticleDetail from './pages/ArticleDetail';
import AdminDashboard from './pages/admin/Dashboard';
import AdminEvents from './pages/admin/Events';
import AdminSales from './pages/admin/Sales';
import AdminAgents from './pages/admin/Agents';
import AdminSettlements from './pages/admin/Settlements';
import AdminContent from './pages/admin/Content';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const ProtectedRoute = ({ children, requireAdmin = false }) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    if (requireAdmin && user?.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/register" element={<Register setUser={setUser} />} />
      
      <Route path="/" element={<MainLayout user={user} setUser={setUser} />}>
        <Route index element={<Home />} />
        <Route path="event/:id" element={<EventDetail />} />
        <Route path="event/:id/select-seats" element={<ProtectedRoute><SeatSelection /></ProtectedRoute>} />
        <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute><OrderList /></ProtectedRoute>} />
        <Route path="orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="tickets" element={<ProtectedRoute><TicketList /></ProtectedRoute>} />
        <Route path="discover" element={<Discover />} />
        <Route path="discover/:id" element={<ArticleDetail />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminLayout user={user} /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="sales" element={<AdminSales />} />
        <Route path="agents" element={<AdminAgents />} />
        <Route path="settlements" element={<AdminSettlements />} />
        <Route path="content" element={<AdminContent />} />
      </Route>
    </Routes>
  );
}

export default App;
