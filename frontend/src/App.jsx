import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { api, DEFAULT_USER } from './api';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Products from './pages/Products';
import Tryon from './pages/Tryon';
import Approval from './pages/Approval';
import AuditLogs from './pages/AuditLogs';

function App() {
  const [currentUser, setCurrentUser] = useState(DEFAULT_USER);
  const [users, setUsers] = useState([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [todoCount, setTodoCount] = useState(0);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadCounts();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      const response = await api.getUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

  const loadCounts = async () => {
    try {
      const [notifResponse, todoResponse] = await Promise.all([
        api.getNotificationCount(currentUser.id),
        api.getTodoCount(currentUser.id)
      ]);
      
      if (notifResponse.success) {
        setNotificationCount(notifResponse.data.unreadCount);
      }
      if (todoResponse.success) {
        setTodoCount(todoResponse.data.pendingCount);
      }
    } catch (error) {
      console.error('加载计数失败:', error);
    }
  };

  const roleLabels = {
    consumer: '消费者',
    guide: '导购',
    operator: '运营',
    brand: '品牌管理员'
  };

  return (
    <Router>
      <div style={{ minHeight: '100vh' }}>
        <Header 
          currentUser={currentUser}
          roleLabels={roleLabels}
          showUserSelector={showUserSelector}
          setShowUserSelector={setShowUserSelector}
          users={users}
          setCurrentUser={setCurrentUser}
          notificationCount={notificationCount}
          todoCount={todoCount}
        />
        
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard currentUser={currentUser} />} />
            <Route path="/orders" element={<Orders currentUser={currentUser} />} />
            <Route path="/orders/:id" element={<OrderDetail currentUser={currentUser} onRefresh={loadCounts} />} />
            <Route path="/products" element={<Products />} />
            <Route path="/tryon/:orderId?" element={<Tryon currentUser={currentUser} />} />
            <Route path="/approval" element={<Approval currentUser={currentUser} />} />
            <Route path="/audit" element={<AuditLogs />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function Header({ currentUser, roleLabels, showUserSelector, setShowUserSelector, users, setCurrentUser, notificationCount, todoCount }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: '仪表盘' },
    { path: '/orders', label: '订单管理' },
    { path: '/products', label: '商品库' },
    { path: '/tryon', label: 'AR试穿' },
    { path: '/approval', label: '审批中心' },
    { path: '/audit', label: '审计日志' }
  ];

  return (
    <header className="header">
      <div className="container">
        <h1>📷 AR试穿试戴系统</h1>
        
        <nav className="header-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'active' : ''}
            >
              {item.label}
              {item.path === '/orders' && todoCount > 0 && (
                <span className="badge-count" style={{ marginLeft: 4 }}>{todoCount}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="user-info">
          <div className="badge">
            <span>🔔</span>
            {notificationCount > 0 && <span className="badge-count">{notificationCount}</span>}
          </div>
          <div 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => setShowUserSelector(!showUserSelector)}
          >
            <div className="user-avatar">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{currentUser.name}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{roleLabels[currentUser.role] || currentUser.role}</div>
            </div>
          </div>
        </div>

        {showUserSelector && (
          <div 
            style={{
              position: 'absolute',
              top: 70,
              right: 20,
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              padding: 8,
              zIndex: 1000,
              minWidth: 200
            }}
          >
            <div style={{ padding: '8px 12px', fontSize: 12, color: '#999', borderBottom: '1px solid #f0f0f0', marginBottom: 4 }}>
              切换用户
            </div>
            {users.map(user => (
              <div
                key={user.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  background: user.id === currentUser.id ? '#e6f7ff' : 'transparent'
                }}
                onClick={() => {
                  setCurrentUser(user);
                  setShowUserSelector(false);
                }}
              >
                <div style={{ fontWeight: 500 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{roleLabels[user.role] || user.role}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

export default App;
