import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import Login from './pages/Login.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import Camps from './pages/Camps.jsx';
import CampDetail from './pages/CampDetail.jsx';
import Checkins from './pages/Checkins.jsx';
import Operations from './pages/Operations.jsx';
import Reports from './pages/Reports.jsx';
import Users from './pages/Users.jsx';

const roleNames = {
  admin: '管理员',
  platform: '平台运营',
  ops: '运营专员',
  teacher: '班主任',
  coach: '教练',
  student: '学员'
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        const parsedUser = JSON.parse(saved);
        setUser(parsedUser);
        if (location.pathname === '/login' || location.pathname === '/') {
          if (parsedUser.role === 'student') {
            navigate('/student', { replace: true });
          } else {
            navigate('/camps', { replace: true });
          }
        }
      } catch (e) {
        localStorage.removeItem('user');
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    } else if (location.pathname !== '/login') {
      navigate('/login', { replace: true });
    }
    setLoading(false);
  }, [navigate]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    const targetPath = userData.role === 'student' ? '/student' : '/camps';
    navigate(targetPath, { replace: true });
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center' }}>加载中...</div>;
  }

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (user && location.pathname === '/login') {
    const targetPath = user.role === 'student' ? '/student' : '/camps';
    return <Navigate to={targetPath} replace />;
  }

  if (location.pathname === '/login') {
    return <Login onLogin={handleLogin} />;
  }

  const navItems = user.role === 'student' ? [
    { path: '/student', label: '我的训练营' }
  ] : [
    { path: '/camps', label: '训练营管理' },
    { path: '/checkins', label: '打卡审核' },
    { path: '/operations', label: '运营管理' },
    { path: '/reports', label: '数据报表' },
    { path: '/users', label: '用户管理' }
  ];

  return (
    <div>
      <header className="header">
        <div className="header-content">
          <h1>社群训练营打卡系统</h1>
          <nav className="nav">
            {navItems.map(item => (
              <Link 
                key={item.path} 
                to={item.path}
                className={location.pathname.startsWith(item.path) ? 'active' : ''}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="user-info">
            <div className="avatar">{user.name[0]}</div>
            <div className="details">
              <div className="name">{user.name}</div>
              <div className="role">{roleNames[user.role]}</div>
            </div>
            <button 
              className="btn btn-outline" 
              style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', background: 'transparent' }}
              onClick={handleLogout}
            >
              退出
            </button>
          </div>
        </div>
      </header>
      
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/student" element={<StudentDashboard user={user} />} />
          <Route path="/camps" element={<Camps user={user} />} />
          <Route path="/camps/:id" element={<CampDetail user={user} />} />
          <Route path="/checkins" element={<Checkins user={user} />} />
          <Route path="/operations" element={<Operations user={user} />} />
          <Route path="/reports" element={<Reports user={user} />} />
          <Route path="/users" element={<Users user={user} />} />
          <Route path="*" element={<Navigate to={user?.role === 'student' ? '/student' : '/camps'} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
