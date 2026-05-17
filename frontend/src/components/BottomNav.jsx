import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNav.css';

const navItems = [
  {
    path: '/',
    label: '首页',
    icon: '🏠',
  },
  {
    path: '/search',
    label: '搜索',
    icon: '🔍',
  },
  {
    path: '/create',
    label: '发布',
    icon: '➕',
  },
  {
    path: '/profile',
    label: '我的',
    icon: '👤',
  },
  {
    path: '/admin',
    label: '管理',
    icon: '⚙️',
  },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const shouldShowNav = !['/admin'].includes(location.pathname);

  if (!shouldShowNav) {
    return null;
  }

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
