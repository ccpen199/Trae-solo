import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ExamManagement from './pages/ExamManagement';
import MyExams from './pages/MyExams';
import Proctor from './pages/Proctor';
import Users from './pages/Users';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'invigilator']} />}>
            <Route path="/" element={<Layout />}>
              <Route path="exams" element={<ExamManagement />} />
              <Route path="proctor" element={<Proctor />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/" element={<Layout />}>
              <Route path="users" element={<Users />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/" element={<Layout />}>
              <Route path="my-exams" element={<MyExams />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
