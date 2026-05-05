import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      [UserRole.ADMIN]: '系统管理员',
      [UserRole.GM]: '总经理',
      [UserRole.DEPT_MANAGER]: '部门经理',
      [UserRole.SUPERVISOR]: '主管',
      [UserRole.EMPLOYEE]: '员工'
    };
    return labels[role] || role;
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <h1>日志管理系统</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{getRoleLabel(user?.role || UserRole.EMPLOYEE)}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </header>

      <div className="app-container">
        <nav className="app-sidebar">
          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/" className="nav-link">
                <span>📊</span> 工作台
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/daily-logs" className="nav-link">
                <span>📝</span> 我的日志
              </Link>
            </li>

            {(hasRole(UserRole.DEPT_MANAGER, UserRole.GM, UserRole.ADMIN, UserRole.SUPERVISOR)) && (
              <>
                <li className="nav-item">
                  <Link to="/manager/logs" className="nav-link">
                    <span>📋</span> 部门日志
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/manager/missing" className="nav-link">
                    <span>⚠️</span> 缺失提醒
                  </Link>
                </li>
              </>
            )}

            {(hasRole(UserRole.GM, UserRole.ADMIN)) && (
              <li className="nav-item">
                <Link to="/admin/statistics" className="nav-link">
                  <span>📈</span> 统计报表
                </Link>
              </li>
            )}

            {hasRole(UserRole.ADMIN) && (
              <>
                <li className="nav-item">
                  <Link to="/admin/users" className="nav-link">
                    <span>👥</span> 用户管理
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/admin/departments" className="nav-link">
                    <span>🏢</span> 部门管理
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
