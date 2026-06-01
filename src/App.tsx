import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Onboarding from '@/pages/Onboarding';
import Demands from '@/pages/Demands';
import DemandCreate from '@/pages/DemandCreate';
import DemandDetail from '@/pages/DemandDetail';
import Enterprises from '@/pages/Enterprises';
import Quotes from '@/pages/Quotes';
import Orders from '@/pages/Orders';
import Account from '@/pages/Account';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store';

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function PublicRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/demands" element={<Demands />} />
            <Route path="/demands/create" element={<DemandCreate />} />
            <Route path="/demands/:id" element={<DemandDetail />} />
            <Route path="/enterprises" element={<Enterprises />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/account" element={<Account />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
