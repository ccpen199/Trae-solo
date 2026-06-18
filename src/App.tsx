import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import VisitorLayout from '@/components/visitor/VisitorLayout';
import Login from '@/pages/admin/Login';
import Dashboard from '@/pages/admin/Dashboard';
import ScenicList from '@/pages/admin/ScenicList';
import POIEditor from '@/pages/admin/POIEditor';
import AREditor from '@/pages/admin/AREditor';
import ABTest from '@/pages/admin/ABTest';
import Analytics from '@/pages/admin/Analytics';
import Welcome from '@/pages/visitor/Welcome';
import ARView from '@/pages/visitor/ARView';
import POIDetail from '@/pages/visitor/POIDetail';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scenic" element={<ScenicList />} />
          <Route path="scenic/:id/poi" element={<POIEditor />} />
          <Route path="scenic/:id/ar-editor" element={<AREditor />} />
          <Route path="ab-test" element={<ABTest />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        <Route path="/visitor" element={<VisitorLayout />}>
          <Route path="welcome/:scenicId" element={<Welcome />} />
          <Route path="ar/:scenicId" element={<ARView />} />
          <Route path="poi/:poiId" element={<POIDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}
