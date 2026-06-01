import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { List, FileText, Clock, AlertTriangle, Users, Settings } from 'lucide-react';
import { setCurrentUser } from './api';
import InterviewList from './pages/InterviewList';
import InterviewDetail from './pages/InterviewDetail';
import Workflow from './pages/Workflow';
import Timeline from './pages/Timeline';

function App() {
  const [currentUser, setCurrentUserState] = useState('user_biz');
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentUser(currentUser);
  }, [currentUser]);

  const users = [
    { id: 'user_biz', name: '业务负责人', role: 'business_owner' },
    { id: 'user_ops', name: '模型运营', role: 'model_ops' },
    { id: 'user_auditor', name: '审核人员', role: 'auditor' },
    { id: 'user_front', name: '一线使用者', role: 'user' },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>AI 客户访谈总结 Agent</h1>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end>
            <List size={18} />
            访谈列表
          </NavLink>
          <NavLink to="/workflow">
            <AlertTriangle size={18} />
            工作台
          </NavLink>
          <NavLink to="/timeline">
            <Clock size={18} />
            时间线
          </NavLink>
        </nav>
        <div style={{ padding: '24px', marginTop: 'auto', borderTop: '1px solid #4a5568' }}>
          <div className="user-selector">
            <Users size={16} style={{ color: '#a0aec0' }} />
            <select 
              value={currentUser} 
              onChange={(e) => setCurrentUserState(e.target.value)}
              style={{ background: 'transparent', color: 'white', border: '1px solid #4a5568' }}
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<InterviewList />} />
          <Route path="/interviews/:id" element={<InterviewDetail />} />
          <Route path="/workflow" element={<Workflow />} />
          <Route path="/timeline" element={<Timeline />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
