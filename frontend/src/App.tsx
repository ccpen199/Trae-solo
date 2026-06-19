import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './pages/admin/AdminLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import Topics from './pages/Topics';
import TopicDetail from './pages/TopicDetail';
import TopicCreate from './pages/TopicCreate';
import AggregatedTopics from './pages/AggregatedTopics';
import Shop from './pages/Shop';
import Orders from './pages/Orders';
import Tasks from './pages/Tasks';
import Wallet from './pages/Wallet';
import Partners from './pages/Partners';
import Property from './pages/Property';
import AdminDashboard from './pages/admin/Dashboard';
import FraudLogs from './pages/admin/FraudLogs';
import RiskControl from './pages/admin/RiskControl';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route path="/" element={<Home />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/topics/aggregated" element={<AggregatedTopics />} />
        <Route path="/topics/create" element={<TopicCreate />} />
        <Route path="/topics/:id" element={<TopicDetail />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/property" element={<Property />} />
      </Route>
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="fraud" element={<FraudLogs />} />
        <Route path="risk" element={<RiskControl />} />
      </Route>
    </Routes>
  );
};

export default App;
