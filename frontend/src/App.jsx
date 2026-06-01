import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import MainLayout from './components/MainLayout.jsx';
import Dashboard from './pages/manager/Dashboard.jsx';
import BuildingList from './pages/manager/BuildingList.jsx';
import CheckpointList from './pages/manager/CheckpointList.jsx';
import PlanList from './pages/manager/PlanList.jsx';
import PatrolExecute from './pages/patrol/PatrolExecute.jsx';
import PatrolRecords from './pages/patrol/PatrolRecords.jsx';
import WorkOrderList from './pages/workorder/WorkOrderList.jsx';
import WorkOrderDetail from './pages/workorder/WorkOrderDetail.jsx';
import UserList from './pages/manager/UserList.jsx';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <MainLayout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard user={user} />} />
        <Route path="/buildings" element={<BuildingList />} />
        <Route path="/checkpoints" element={<CheckpointList />} />
        <Route path="/plans" element={<PlanList />} />
        <Route path="/patrol" element={<PatrolExecute user={user} />} />
        <Route path="/patrol/records" element={<PatrolRecords />} />
        <Route path="/workorders" element={<WorkOrderList user={user} />} />
        <Route path="/workorders/:id" element={<WorkOrderDetail user={user} />} />
        <Route path="/users" element={<UserList />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
