import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from '@/stores/authStore';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import HouseholdList from '@/pages/HouseholdList';
import HouseholdDetail from '@/pages/HouseholdDetail';
import HouseholdForm from '@/pages/HouseholdForm';
import ParcelList from '@/pages/ParcelList';
import ParcelDetail from '@/pages/ParcelDetail';
import ParcelForm from '@/pages/ParcelForm';
import ApplicationList from '@/pages/ApplicationList';
import ApplicationNew from '@/pages/ApplicationNew';
import ApplicationDetail from '@/pages/ApplicationDetail';
import ApprovalWorkbench from '@/pages/ApprovalWorkbench';
import AnomalyList from '@/pages/AnomalyList';
import AnomalyDetail from '@/pages/AnomalyDetail';
import NoticeList from '@/pages/NoticeList';
import ReportCenter from '@/pages/ReportCenter';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, user, loading, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      fetchMe();
    }
  }, [token, user, fetchMe]);

  if (loading || (token && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-700">
        <div className="text-white text-lg">加载中...</div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/households" element={<HouseholdList />} />
          <Route path="/households/new" element={<HouseholdForm />} />
          <Route path="/households/:id" element={<HouseholdDetail />} />
          <Route path="/households/:id/edit" element={<HouseholdForm />} />
          <Route path="/parcels" element={<ParcelList />} />
          <Route path="/parcels/new" element={<ParcelForm />} />
          <Route path="/parcels/:id" element={<ParcelDetail />} />
          <Route path="/parcels/:id/edit" element={<ParcelForm />} />
          <Route path="/applications" element={<ApplicationList />} />
          <Route path="/applications/new" element={<ApplicationNew />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/approval" element={<ApprovalWorkbench />} />
          <Route path="/anomalies" element={<AnomalyList />} />
          <Route path="/anomalies/:id" element={<AnomalyDetail />} />
          <Route path="/notices" element={<NoticeList />} />
          <Route path="/reports" element={<ReportCenter />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
