import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CourseForm from './pages/CourseForm';
import Enrollments from './pages/Enrollments';
import Attendance from './pages/Attendance';
import Orders from './pages/Orders';
import Schedule from './pages/Schedule';
import { authApi } from './services/api';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authApi.getMe()
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout user={user} setUser={setUser}>
              <Dashboard user={user} />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/courses" element={
          <PrivateRoute>
            <Layout user={user} setUser={setUser}>
              <Courses user={user} />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/courses/:id" element={
          <PrivateRoute>
            <Layout user={user} setUser={setUser}>
              <CourseDetail user={user} />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/courses/new" element={
          <PrivateRoute>
            <Layout user={user} setUser={setUser}>
              <CourseForm user={user} />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/courses/:id/edit" element={
          <PrivateRoute>
            <Layout user={user} setUser={setUser}>
              <CourseForm user={user} />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/enrollments" element={
          <PrivateRoute>
            <Layout user={user} setUser={setUser}>
              <Enrollments user={user} />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/attendance" element={
          <PrivateRoute>
            <Layout user={user} setUser={setUser}>
              <Attendance user={user} />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/orders" element={
          <PrivateRoute>
            <Layout user={user} setUser={setUser}>
              <Orders user={user} />
            </Layout>
          </PrivateRoute>
        } />
        <Route path="/schedule" element={
          <PrivateRoute>
            <Layout user={user} setUser={setUser}>
              <Schedule user={user} />
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
