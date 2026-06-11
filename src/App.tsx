import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CitizenLayout from '@/components/Layout/CitizenLayout';
import AdminLayout from '@/components/Layout/AdminLayout';
import Home from '@/pages/Home';
import Services from '@/pages/Services';
import ServiceDetail from '@/pages/ServiceDetail';
import Login from '@/pages/Login';
import Apply from '@/pages/Apply';
import Certificates from '@/pages/Certificates';
import Profile from '@/pages/Profile';
import Dashboard from '@/pages/admin/Dashboard';
import ServiceManagement from '@/pages/admin/ServiceManagement';
import Approvals from '@/pages/admin/Approvals';
import Monitor from '@/pages/admin/Monitor';
import Audit from '@/pages/admin/Audit';
import Heatmap from '@/pages/admin/Heatmap';
import PoliceBureau from '@/pages/admin/PoliceBureau';
import DataBureau from '@/pages/admin/DataBureau';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<CitizenLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:serviceId" element={<ServiceDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/apply/:serviceId" element={<Apply />} />
          <Route path="/certificates" element={<Certificates />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="services" element={<ServiceManagement />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="monitor" element={<Monitor />} />
          <Route path="audit" element={<Audit />} />
          <Route path="heatmap" element={<Heatmap />} />
          <Route path="police" element={<PoliceBureau />} />
          <Route path="data-bureau" element={<DataBureau />} />
        </Route>
      </Routes>
    </Router>
  );
}
