import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Prescriptions from './pages/Prescriptions';
import TrainingRecords from './pages/TrainingRecords';
import EfficacyAnalysis from './pages/EfficacyAnalysis';
import Login from './pages/Login';

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
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h1>康复训练管理系统</h1>
        <nav>
          <NavLink to="/" end>
            仪表盘
          </NavLink>
          <NavLink to="/patients">患者管理</NavLink>
          <NavLink to="/prescriptions">处方管理</NavLink>
          <NavLink to="/training">训练记录</NavLink>
          <NavLink to="/efficacy">疗效分析</NavLink>
        </nav>
        <div style={{ padding: '20px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>{user.name}</div>
          <div style={{ fontSize: '12px', color: '#bdc3c7', marginBottom: '12px' }}>
            {user.role === 'admin' ? '管理员' : user.role === 'doctor' ? '医生' : user.role === 'therapist' ? '治疗师' : '患者'}
          </div>
          <button onClick={handleLogout} className="btn btn-sm btn-danger" style={{ width: '100%' }}>
            退出登录
          </button>
        </div>
      </div>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/prescriptions" element={<Prescriptions user={user} />} />
          <Route path="/training" element={<TrainingRecords user={user} />} />
          <Route path="/efficacy" element={<EfficacyAnalysis user={user} />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
