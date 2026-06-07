import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import JobList from './pages/JobList';
import JobDetail from './pages/JobDetail';
import CompanyDashboard from './pages/CompanyDashboard';
import JobseekerDashboard from './pages/JobseekerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UniversityDashboard from './pages/UniversityDashboard';
import Messages from './pages/Messages';
import VideoRecorder from './pages/VideoRecorder';

function App() {
  const { fetchCurrentUser, isLoading, user } = useAuthStore();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/messages" element={user ? <Messages /> : <Navigate to="/login" />} />
          <Route path="/record" element={user ? <VideoRecorder /> : <Navigate to="/login" />} />
          <Route 
            path="/company/dashboard" 
            element={user?.role === 'company' ? <CompanyDashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/jobseeker/dashboard" 
            element={user?.role === 'jobseeker' ? <JobseekerDashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/admin/dashboard" 
            element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/university/dashboard" 
            element={<UniversityDashboard />} 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
