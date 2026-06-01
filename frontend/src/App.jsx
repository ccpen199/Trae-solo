import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ChangeRequests from './pages/ChangeRequests';
import ChangeRequestDetail from './pages/ChangeRequestDetail';
import VisaForms from './pages/VisaForms';
import VisaFormDetail from './pages/VisaFormDetail';
import CostReview from './pages/CostReview';
import Approvals from './pages/Approvals';
import SettlementBasis from './pages/SettlementBasis';
import SettlementDetail from './pages/SettlementDetail';
import Login from './pages/Login';

export const UserContext = React.createContext(null);

function AppContent({ user, onLogout }) {
  const navigate = useNavigate();

  const roleMap = {
    admin: '系统管理员',
    construction: '施工单位',
    supervision: '监理单位',
    owner: '业主方',
    cost: '成本部门'
  };

  const navItems = [
    { path: '/dashboard', label: '首页', roles: ['admin', 'construction', 'supervision', 'owner', 'cost'] },
    { path: '/change-requests', label: '变更申请', roles: ['admin', 'construction', 'supervision', 'owner', 'cost'] },
    { path: '/visa-forms', label: '签证单', roles: ['admin', 'construction', 'supervision', 'owner', 'cost'] },
    { path: '/cost-review', label: '造价复核', roles: ['admin', 'cost'] },
    { path: '/approvals', label: '待我审批', roles: ['admin', 'construction', 'supervision', 'owner', 'cost'] },
    { path: '/settlement', label: '结算依据', roles: ['admin', 'cost', 'owner'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <UserContext.Provider value={user}>
      <div>
        <header className="header">
          <div className="header-content">
            <h1>建设工程变更签证系统</h1>
            <div className="user-badge">
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{roleMap[user.role] || user.role}</div>
              </div>
              <div className="user-avatar">{user.name.charAt(0)}</div>
              <button className="logout-btn" onClick={onLogout}>退出</button>
            </div>
          </div>
        </header>
        <nav className="nav">
          {visibleNavItems.map(item => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="container">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/change-requests" element={<ChangeRequests />} />
            <Route path="/change-requests/:id" element={<ChangeRequestDetail />} />
            <Route path="/visa-forms" element={<VisaForms />} />
            <Route path="/visa-forms/:id" element={<VisaFormDetail />} />
            <Route path="/cost-review" element={<CostReview />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/settlement" element={<SettlementBasis />} />
            <Route path="/settlement/:id" element={<SettlementDetail />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </UserContext.Provider>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) {
    return <div className="login-container"><div style={{ color: 'white' }}>加载中...</div></div>;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <AppContent user={user} onLogout={handleLogout} />
    </Router>
  );
}

export default App;
