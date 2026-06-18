import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import WorkerList from './pages/workers/WorkerList';
import WorkerDetail from './pages/workers/WorkerDetail';
import EmployerList from './pages/employers/EmployerList';
import EmployerDetail from './pages/employers/EmployerDetail';
import OrderList from './pages/orders/OrderList';
import OrderDetail from './pages/orders/OrderDetail';
import TrainingList from './pages/training/TrainingList';
import TrainingDetail from './pages/training/TrainingDetail';
import CommunityList from './pages/community/CommunityList';
import CommunityDetail from './pages/community/CommunityDetail';
import InsuranceList from './pages/support/InsuranceList';
import DisputeList from './pages/support/DisputeList';
import SalaryList from './pages/support/SalaryList';
import ServiceGrid from './pages/admin/ServiceGrid';
import ConversionFunnel from './pages/admin/ConversionFunnel';
import WorkerApproval from './pages/admin/WorkerApproval';
import PerformanceReport from './pages/admin/PerformanceReport';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="workers" element={<WorkerList />} />
        <Route path="workers/:id" element={<WorkerDetail />} />
        <Route path="employers" element={<EmployerList />} />
        <Route path="employers/:id" element={<EmployerDetail />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="training" element={<TrainingList />} />
        <Route path="training/:id" element={<TrainingDetail />} />
        <Route path="community" element={<CommunityList />} />
        <Route path="community/:id" element={<CommunityDetail />} />
        <Route path="support/insurance" element={<InsuranceList />} />
        <Route path="support/disputes" element={<DisputeList />} />
        <Route path="support/salaries" element={<SalaryList />} />
        <Route path="admin/service-grids" element={<ServiceGrid />} />
        <Route path="admin/funnel" element={<ConversionFunnel />} />
        <Route path="admin/approval" element={<WorkerApproval />} />
        <Route path="admin/performance" element={<PerformanceReport />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
