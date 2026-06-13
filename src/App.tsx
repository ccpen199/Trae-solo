import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Services from '@/pages/Services';
import ServiceDetail from '@/pages/ServiceDetail';
import Dashboard from '@/pages/Dashboard';
import Family from '@/pages/Family';
import Accessibility from '@/pages/Accessibility';
import Heatmap from '@/pages/Heatmap';
import Profile from '@/pages/Profile';
import { useUserStore } from '@/stores/useUserStore';

function SessionRestorer() {
  const restoreSession = useUserStore((s) => s.restoreSession);
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);
  return null;
}

export default function App() {
  return (
    <Router>
      <SessionRestorer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/family" element={<Family />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/heatmap" element={<Heatmap />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}
