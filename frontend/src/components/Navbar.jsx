import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.js';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const riderLinks = [
    { to: '/rider/dashboard', label: '工作台' },
    { to: '/rider/orders', label: '订单大厅' },
    { to: '/rider/wallet', label: '个人中心/我的钱包' },
    { to: '/rider/verification', label: '实人认证' },
    { to: '/rider/vehicle', label: '车辆绑定' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: '数据总览' },
    { to: '/admin/orders', label: '订单管理' },
    { to: '/admin/riders', label: '骑手管理' },
    { to: '/admin/heatmap', label: '运力热力图' },
    { to: '/admin/incentives', label: '激励配置' },
    { to: '/admin/appeals', label: '申诉工单' },
    { to: '/admin/dispatch', label: '派单规则' },
    { to: '/admin/finance', label: '财务报表' },
  ];

  const links = user?.role === 'admin' ? adminLinks : riderLinks;

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">🚴 配送协同平台</div>
        <ul className="navbar-nav">
          {links.map(link => (
            <li key={link.to}>
              <NavLink to={link.to} className={({ isActive }) => isActive ? 'active' : ''}>
                {link.label}
              </NavLink>
            </li>
          ))}
          <li>
            <span style={{ marginLeft: '16px', color: 'var(--text-secondary)' }}>
              {user?.real_name || user?.username} ({user?.role === 'admin' ? '管理员' : '骑手'})
            </span>
          </li>
          <li>
            <button className="btn" onClick={handleLogout}>退出登录</button>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
