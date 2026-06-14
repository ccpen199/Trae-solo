import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Navbar from './components/Navbar';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import Settlements from './pages/Settlements';
import CreateTask from './pages/CreateTask';
import AdminDashboard from './pages/admin/Dashboard';
import AdminTaskReview from './pages/admin/TaskReview';
import AdminEmployers from './pages/admin/Employers';
import AdminVerifications from './pages/admin/Verifications';
import AdminAppeals from './pages/admin/Appeals';
import AdminStats from './pages/admin/Stats';
import AdminTasks from './pages/admin/Tasks';
import AdminUsers from './pages/admin/Users';
import Toast from './components/Toast';

function App() {
  const { initAuth, user } = useAuthStore();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    initAuth();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const ProtectedRoute = ({ children, roles }) => {
    if (!user) {
      return <Navigate to="/login" />;
    }
    if (roles && !roles.includes(user.user_type)) {
      return <Navigate to="/" />;
    }
    return children;
  };

  return (
    <div className="app">
      <Navbar showToast={showToast} />
      <Routes>
        <Route path="/" element={<Home showToast={showToast} />} />
        <Route path="/login" element={<Login showToast={showToast} />} />
        <Route path="/register" element={<Register showToast={showToast} />} />
        <Route path="/tasks" element={<Tasks showToast={showToast} />} />
        <Route path="/tasks/:id" element={<TaskDetail showToast={showToast} />} />
        <Route path="/my-orders" element={
          <ProtectedRoute roles={['student', 'homemaker', 'parttime']}>
            <MyOrders showToast={showToast} />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile showToast={showToast} />
          </ProtectedRoute>
        } />
        <Route path="/settlements" element={
          <ProtectedRoute roles={['student', 'homemaker', 'parttime']}>
            <Settlements showToast={showToast} />
          </ProtectedRoute>
        } />
        <Route path="/create-task" element={
          <ProtectedRoute roles={['employer']}>
            <CreateTask showToast={showToast} />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard showToast={showToast} />} />
          <Route path="task-review" element={<AdminTaskReview showToast={showToast} />} />
          <Route path="employers" element={<AdminEmployers showToast={showToast} />} />
          <Route path="verifications" element={<AdminVerifications showToast={showToast} />} />
          <Route path="appeals" element={<AdminAppeals showToast={showToast} />} />
          <Route path="stats" element={<AdminStats showToast={showToast} />} />
          <Route path="tasks" element={<AdminTasks showToast={showToast} />} />
          <Route path="users" element={<AdminUsers showToast={showToast} />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;
