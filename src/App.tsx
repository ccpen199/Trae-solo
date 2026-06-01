import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ActivityList from './pages/ActivityList';
import ActivityForm from './pages/ActivityForm';
import PrizeList from './pages/PrizeList';
import WinnerList from './pages/WinnerList';
import RiskList from './pages/RiskList';
import ReportPage from './pages/ReportPage';
import LotteryPage from './pages/LotteryPage';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/lottery/:id" element={<LotteryPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/activities" element={
            <ProtectedRoute allowedRoles={['admin', 'operator']}>
              <ActivityList />
            </ProtectedRoute>
          } />
          
          <Route path="/activities/new" element={
            <ProtectedRoute allowedRoles={['admin', 'operator']}>
              <ActivityForm />
            </ProtectedRoute>
          } />
          
          <Route path="/activities/:id/edit" element={
            <ProtectedRoute allowedRoles={['admin', 'operator']}>
              <ActivityForm />
            </ProtectedRoute>
          } />
          
          <Route path="/prizes" element={
            <ProtectedRoute allowedRoles={['admin', 'operator', 'finance']}>
              <PrizeList />
            </ProtectedRoute>
          } />
          
          <Route path="/winners" element={
            <ProtectedRoute allowedRoles={['admin', 'operator', 'finance']}>
              <WinnerList />
            </ProtectedRoute>
          } />
          
          <Route path="/risk" element={
            <ProtectedRoute allowedRoles={['admin', 'risk']}>
              <RiskList />
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'operator', 'finance']}>
              <ReportPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Layout>
    </Router>
  );
}
