import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import OpportunityList from './pages/opportunity/List';
import OpportunityDetail from './pages/opportunity/Detail';
import OpportunityPublish from './pages/opportunity/Publish';
import Subscription from './pages/opportunity/Subscription';
import NegotiationList from './pages/negotiation/List';
import NegotiationDetail from './pages/negotiation/Detail';
import ContractList from './pages/contract/List';
import ContractDetail from './pages/contract/Detail';
import OrderList from './pages/order/List';
import OrderDetail from './pages/order/Detail';
import TraceList from './pages/trace/List';
import TraceVerify from './pages/trace/Verify';
import CreditRating from './pages/credit/Rating';
import Heatmap from './pages/analysis/Heatmap';
import PriceForecast from './pages/analysis/PriceForecast';
import LogisticsQuotations from './pages/logistics/Quotations';
import CarrierOrders from './pages/logistics/CarrierOrders';
import Tracking from './pages/logistics/Tracking';
import Notifications from './pages/Notifications';
import AdminEnterprises from './pages/admin/Enterprises';
import EnterpriseCert from './pages/EnterpriseCert';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated, token, fetchMe } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (token && !isAuthenticated) {
      fetchMe();
    }
  }, [token, isAuthenticated, fetchMe]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function RequireRole({ roles, children }: { roles: string[]; children: JSX.Element }) {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const { fetchMe, token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (token && !isAuthenticated) {
      fetchMe();
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <RequireAuth>
          <MainLayout />
        </RequireAuth>
      }>
        <Route index element={<Dashboard />} />
        <Route path="enterprise-cert" element={<EnterpriseCert />} />
        <Route path="opportunities" element={<OpportunityList />} />
        <Route path="opportunities/publish" element={<OpportunityPublish />} />
        <Route path="opportunities/:id" element={<OpportunityDetail />} />
        <Route path="subscriptions" element={<Subscription />} />
        <Route path="negotiations" element={<NegotiationList />} />
        <Route path="negotiations/:id" element={<NegotiationDetail />} />
        <Route path="contracts" element={<ContractList />} />
        <Route path="contracts/:id" element={<ContractDetail />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="trace-codes" element={<TraceList />} />
        <Route path="trace-verify" element={<TraceVerify />} />
        <Route path="credit-ratings" element={<CreditRating />} />
        <Route path="heatmap" element={<Heatmap />} />
        <Route path="price-forecast" element={<PriceForecast />} />
        <Route path="logistics/quotations/:orderId" element={<LogisticsQuotations />} />
        <Route path="carrier/orders" element={<RequireRole roles={['carrier','admin','recycler','producer']}><CarrierOrders /></RequireRole>} />
        <Route path="tracking/:no" element={<Tracking />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="admin/enterprises" element={<RequireRole roles={['admin']}><AdminEnterprises /></RequireRole>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
