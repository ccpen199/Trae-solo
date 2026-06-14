import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserLayout from '@/components/UserLayout';
import AdminLayout from '@/components/AdminLayout';
import Home from '@/pages/Home';
import Estimate from '@/pages/Estimate';
import Appointment from '@/pages/Appointment';
import Orders from '@/pages/Orders';
import OrderDetail from '@/pages/OrderDetail';
import Charity from '@/pages/Charity';
import Inspection from '@/pages/Inspection';
import InspectionDetail from '@/pages/InspectionDetail';
import Pricing from '@/pages/Pricing';
import Settlement from '@/pages/Settlement';
import Logistics from '@/pages/Logistics';
import Audit from '@/pages/Audit';
import Dashboard from '@/pages/Dashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/estimate" element={<Estimate />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/charity" element={<Charity />} />
        </Route>
        <Route element={<AdminLayout />}>
          <Route path="/admin/inspection" element={<Inspection />} />
          <Route path="/admin/inspection/:id" element={<InspectionDetail />} />
          <Route path="/admin/pricing" element={<Pricing />} />
          <Route path="/admin/settlement" element={<Settlement />} />
          <Route path="/admin/logistics" element={<Logistics />} />
          <Route path="/admin/audit" element={<Audit />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}
