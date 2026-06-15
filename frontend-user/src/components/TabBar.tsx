import { NavLink, useLocation } from 'react-router-dom';

export default function TabBar() {
  const location = useLocation();
  const tabs = [
    { path: '/', icon: '🏠', label: '首页' },
    { path: '/category', icon: '📂', label: '分类' },
    { path: '/orders', icon: '📋', label: '订单' },
    { path: '/profile', icon: '👤', label: '我的' }
  ];
  return (
    <div className="tab-bar">
      {tabs.map(tab => (
        <NavLink key={tab.path} to={tab.path} className={`tab-item ${location.pathname === tab.path ? 'active' : ''}`}>
          <div className="icon">{tab.icon}</div>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
