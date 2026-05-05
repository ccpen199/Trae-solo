import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import DormitoryList from './pages/dormitory/DormitoryList';
import RoomList from './pages/dormitory/RoomList';
import BedList from './pages/dormitory/BedList';
import StudentList from './pages/student/StudentList';
import CheckInList from './pages/student/CheckInList';
import RoomChangeList from './pages/student/RoomChangeList';
import MaintenanceList from './pages/maintenance/MaintenanceList';
import ReportPage from './pages/report/ReportPage';

const App: React.FC = () => {
  const { isAuthenticated, loading, getCurrentUser } = useAuthStore();

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        <Route path="/dormitories" element={<DormitoryList />} />
        <Route path="/rooms" element={<RoomList />} />
        <Route path="/beds" element={<BedList />} />
        
        <Route path="/students" element={<StudentList />} />
        <Route path="/check-ins" element={<CheckInList />} />
        <Route path="/room-changes" element={<RoomChangeList />} />
        
        <Route path="/maintenance" element={<MaintenanceList />} />
        
        <Route path="/reports" element={<ReportPage />} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
  );
};

export default App;