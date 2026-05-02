import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, menus, logout, hasPermission } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({});

  const getPageTitle = () => {
    const pathMap = {
      '/dashboard': '仪表盘',
      '/organization': '组织架构',
      '/users': '用户管理',
      '/roles': '权限管理',
      '/applications': '应用管理',
      '/audit': '审计中心',
      '/monitor': '实时监控',
      '/profile': '个人中心'
    };
    return pathMap[location.pathname] || '仪表盘';
  };

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getIcon = (iconName) => {
    const icons = {
      dashboard: '📊',
      organization: '🏢',
      users: '👥',
      roles: '🔐',
      apps: '📱',
      audit: '📋',
      monitor: '📡',
      profile: '👤'
    };
    return icons[iconName] || '📄';
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const getUserDisplayRole = () => {
    const roleMap = {
      'organization_admin': '组织管理员',
      'employee': '普通员工',
      'security_auditor': '安全审计员',
      'external_app_manager': '应用管理员'
    };
    return roleMap[user?.roles?.[0]?.name] || '用户';
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>企业安全中台</h2>
          <p>IAM 身份认证系统</p>
        </div>
        <nav className="sidebar-nav">
          {menus?.map((menu) => (
            <div key={menu.id}>
              <div
                className={`nav-item ${isActive(menu.path) && !menu.children ? 'active' : ''}`}
                onClick={() => {
                  if (menu.children && menu.children.length > 0) {
                    toggleMenu(menu.id);
                  } else {
                    handleNavigation(menu.path);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <span className="nav-item-icon">{getIcon(menu.icon)}</span>
                <span>{menu.name}</span>
                {menu.children && menu.children.length > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
                    {expandedMenus[menu.id] ? '▼' : '▶'}
                  </span>
                )}
              </div>
              {menu.children && menu.children.length > 0 && expandedMenus[menu.id] && (
                <div className="nav-children">
                  {menu.children.map((child) => (
                    <div
                      key={child.id}
                      className={`nav-item ${isActive(child.path) ? 'active' : ''}`}
                      onClick={() => handleNavigation(child.path)}
                      style={{ cursor: 'pointer' }}
                    >
                      <span>{child.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-title">{getPageTitle()}</div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.realName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.realName || user?.username}</span>
                <span className="user-role">{getUserDisplayRole()}</span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
