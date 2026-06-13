import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import AdminLayout from '@/components/AdminLayout';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import OrderPage from '@/pages/OrderPage';
import WaybillPage from '@/pages/WaybillPage';
import TrackPage from '@/pages/TrackPage';
import OutletsPage from '@/pages/OutletsPage';
import AfterSalePage from '@/pages/AfterSalePage';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminHeatmap from '@/pages/admin/Heatmap';
import AdminCLV from '@/pages/admin/CLV';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/order" element={<OrderPage />} />
          <Route path="/order/:id/waybill" element={<WaybillPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/outlets" element={<OutletsPage />} />
          <Route path="/after-sale" element={<AfterSalePage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="heatmap" element={<AdminHeatmap />} />
          <Route path="clv" element={<AdminCLV />} />
        </Route>

        <Route path="*" element={<div className="p-20 text-center text-neutral-400">404 - 页面不存在</div>} />
      </Routes>
    </Router>
  );
}
