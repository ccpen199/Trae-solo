import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import HomePage from './pages/HomePage';
import PropertyListPage from './pages/PropertyListPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import EstateListPage from './pages/EstateListPage';
import EstateDetailPage from './pages/EstateDetailPage';
import BrokerListPage from './pages/BrokerListPage';
import BrokerDetailPage from './pages/BrokerDetailPage';
import BrokerWorkbenchPage from './pages/BrokerWorkbenchPage';
import VRViewPage from './pages/VRViewPage';
import PriceEvaluationPage from './pages/PriceEvaluationPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import EstateDictionaryPage from './pages/admin/EstateDictionaryPage';
import FakeDetectionPage from './pages/admin/FakeDetectionPage';
import TrainingManagementPage from './pages/admin/TrainingManagementPage';
import CommissionManagementPage from './pages/admin/CommissionManagementPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="properties" element={<PropertyListPage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />
        <Route path="properties/:id/vr" element={<VRViewPage />} />
        <Route path="estates" element={<EstateListPage />} />
        <Route path="estates/:id" element={<EstateDetailPage />} />
        <Route path="brokers" element={<BrokerListPage />} />
        <Route path="brokers/:id" element={<BrokerDetailPage />} />
        <Route path="brokers/:id/workbench" element={<BrokerWorkbenchPage />} />
        <Route path="price-evaluation" element={<PriceEvaluationPage />} />
        <Route path="admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="admin/estate-dictionary" element={<EstateDictionaryPage />} />
        <Route path="admin/fake-detection" element={<FakeDetectionPage />} />
        <Route path="admin/training" element={<TrainingManagementPage />} />
        <Route path="admin/commissions" element={<CommissionManagementPage />} />
      </Route>
    </Routes>
  );
};

export default App;
