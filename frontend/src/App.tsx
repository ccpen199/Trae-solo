import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import DemandList from './pages/demand/List';
import DemandCreate from './pages/demand/Create';
import DemandDetail from './pages/demand/Detail';
import ContractList from './pages/contract/List';
import ContractDetail from './pages/contract/Detail';
import SupervisionList from './pages/supervision/List';
import ShowroomList from './pages/showroom/List';
import ShowroomDetail from './pages/showroom/Detail';
import GISMap from './pages/gis/Map';
import WorkOrderList from './pages/workorder/List';
import AdminDashboard from './pages/admin/Dashboard';
import ContractTracking from './pages/admin/ContractTracking';
import BomAnalysis from './pages/admin/BomAnalysis';
import WarrantyList from './pages/admin/WarrantyList';
import NPSStats from './pages/admin/NPSStats';
import UserList from './pages/admin/UserList';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      checkAuth();
    }
  }, [isAuthenticated, checkAuth]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="demands" element={<DemandList />} />
        <Route path="demands/create" element={<DemandCreate />} />
        <Route path="demands/:id" element={<DemandDetail />} />
        <Route path="contracts" element={<ContractList />} />
        <Route path="contracts/:id" element={<ContractDetail />} />
        <Route path="supervision" element={<SupervisionList />} />
        <Route path="showroom" element={<ShowroomList />} />
        <Route path="showroom/:id" element={<ShowroomDetail />} />
        <Route path="gis" element={<GISMap />} />
        <Route path="workorders" element={<WorkOrderList />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="admin/contracts" element={<ContractTracking />} />
        <Route path="admin/bom" element={<BomAnalysis />} />
        <Route path="admin/warranty" element={<WarrantyList />} />
        <Route path="admin/nps" element={<NPSStats />} />
        <Route path="admin/users" element={<UserList />} />
      </Route>
    </Routes>
  );
};

export default App;
