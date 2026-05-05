import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import Leaves from './pages/Leaves';
import Evaluations from './pages/Evaluations';
import ClassFees from './pages/ClassFees';
import Feedbacks from './pages/Feedbacks';
import Reports from './pages/Reports';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isAdmin, isTeacher, isMonitor, isStudent } = useUserStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    let hasPermission = false;
    switch (requiredRole) {
      case 'ADMIN':
        hasPermission = isAdmin();
        break;
      case 'TEACHER':
        hasPermission = isTeacher();
        break;
      case 'MONITOR':
        hasPermission = isMonitor();
        break;
      case 'STUDENT':
        hasPermission = isStudent();
        break;
      default:
        hasPermission = true;
    }
    
    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

const App = () => {
  const { isAuthenticated } = useUserStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="leaves" element={<Leaves />} />
          <Route path="evaluations" element={<Evaluations />} />
          <Route path="class-fees" element={<ClassFees />} />
          <Route path="feedbacks" element={<Feedbacks />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
