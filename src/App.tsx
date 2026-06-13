import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Monitor from '@/pages/Monitor';
import Events from '@/pages/Events';
import OtaManagement from '@/pages/OtaManagement';
import Geofence from '@/pages/Geofence';
import Privacy from '@/pages/Privacy';
import Logs from '@/pages/Logs';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/events" element={<Events />} />
          <Route path="/ota" element={<OtaManagement />} />
          <Route path="/geofence" element={<Geofence />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/logs" element={<Logs />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
