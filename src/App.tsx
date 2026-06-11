import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout';
import Home from './pages/Home';
import CardManagement from './pages/CardManagement';
import CardProgress from './pages/CardProgress';
import BenefitStatement from './pages/BenefitStatement';
import UnemploymentPrecheck from './pages/UnemploymentPrecheck';
import AdminLayout from './components/AdminLayout';
import CityServiceConfig from './pages/admin/CityServiceConfig';
import KnowledgeGraph from './pages/admin/KnowledgeGraph';
import FundMonitor from './pages/admin/FundMonitor';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="card" element={<CardManagement />} />
        <Route path="card/progress" element={<CardProgress />} />
        <Route path="benefit" element={<BenefitStatement />} />
        <Route path="unemployment" element={<UnemploymentPrecheck />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="city-service" replace />} />
        <Route path="city-service" element={<CityServiceConfig />} />
        <Route path="knowledge" element={<KnowledgeGraph />} />
        <Route path="fund-monitor" element={<FundMonitor />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
