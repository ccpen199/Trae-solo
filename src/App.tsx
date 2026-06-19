import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ToastContainer } from '@/components/ui/Toast';
import Dashboard from '@/pages/Dashboard';
import Orders from '@/pages/Orders';
import AbnormalOrders from '@/pages/AbnormalOrders';
import Riders from '@/pages/Riders';
import HeatMap from '@/pages/HeatMap';
import RiderCredit from '@/pages/RiderCredit';
import Waybills from '@/pages/Waybills';
import Compensation from '@/pages/Compensation';
import Pricing from '@/pages/Pricing';
import ApiIntegration from '@/pages/ApiIntegration';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="abnormal-orders" element={<AbnormalOrders />} />
          <Route path="riders" element={<Riders />} />
          <Route path="rider-credit" element={<RiderCredit />} />
          <Route path="heatmap" element={<HeatMap />} />
          <Route path="waybills" element={<Waybills />} />
          <Route path="compensation" element={<Compensation />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="api-integration" element={<ApiIntegration />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={
          <div className="min-h-screen bg-space-blue-700 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-amber-accent-500 mb-4">404</h1>
              <p className="text-gray-400">页面不存在</p>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}
