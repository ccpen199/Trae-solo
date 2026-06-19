import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AccessDevice from './pages/access/AccessDevice';
import AccessLog from './pages/access/AccessLog';
import TicketList from './pages/ticket/TicketList';
import TicketDetail from './pages/ticket/TicketDetail';
import ServiceProvider from './pages/service/ServiceProvider';
import ServiceItem from './pages/service/ServiceItem';
import ServiceOrder from './pages/service/ServiceOrder';
import Commission from './pages/service/Commission';
import CommunityList from './pages/community/CommunityList';
import BuildingList from './pages/community/BuildingList';
import UserList from './pages/user/UserList';
import KpiDashboard from './pages/kpi/KpiDashboard';
import Monitor from './pages/monitor/Monitor';
import AlertList from './pages/monitor/AlertList';
import { useUserStore } from './store/user';

function App() {
  const token = useUserStore((state) => state.token);

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/access/devices" element={<AccessDevice />} />
        <Route path="/access/logs" element={<AccessLog />} />
        <Route path="/tickets" element={<TicketList />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/service/providers" element={<ServiceProvider />} />
        <Route path="/service/items" element={<ServiceItem />} />
        <Route path="/service/orders" element={<ServiceOrder />} />
        <Route path="/service/commissions" element={<Commission />} />
        <Route path="/community/list" element={<CommunityList />} />
        <Route path="/community/buildings" element={<BuildingList />} />
        <Route path="/users" element={<UserList />} />
        <Route path="/kpi" element={<KpiDashboard />} />
        <Route path="/monitor/status" element={<Monitor />} />
        <Route path="/monitor/alerts" element={<AlertList />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
