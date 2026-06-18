import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import MainLayout from './components/layout/MainLayout';
import PeopleRoutes from './routes/people';
import GoodsRoutes from './routes/goods';
import FieldRoutes from './routes/field';
import ComplianceRoutes from './routes/compliance';
import TrainingRoutes from './routes/training';
import AnalyticsRoutes from './routes/analytics';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/*" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {PeopleRoutes}
          {GoodsRoutes}
          {FieldRoutes}
          {ComplianceRoutes}
          {TrainingRoutes}
          {AnalyticsRoutes}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
