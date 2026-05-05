import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { roleLabels } from '../utils/validation';

const Layout = ({ children }) => {
  const { user, isAdmin, logout, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(`确定要注销账号 "${user.username}" 吗？此操作不可恢复！`)) {
      return;
    }
    
    try {
      await deleteAccount();
      navigate('/login');
    } catch (error) {
      alert(error.message || '注销账号失败');
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav className="navbar">
        <div className="navbar-content">
          <Link to={isAdmin ? '/admin' : '/user'} className="navbar-brand">
            用户<span>管理系统</span>
          </Link>
          
          {user && (
            <div className="navbar-nav">
              {isAdmin ? (
                <>
                  <Link to="/admin" className={isActive('/admin')}>用户管理</Link>
                </>
              ) : (
                <>
                  <Link to="/user" className={isActive('/user')}>个人主页</Link>
                  <Link to="/user/edit" className={isActive('/user/edit')}>修改资料</Link>
                </>
              )}
              
              <div className="navbar-user">
                <div className="user-info">
                  欢迎，<span>{user.username}</span>
                  <span className={`role-badge ${user.role}`}>
                    {roleLabels[user.role]}
                  </span>
                </div>
                <button 
                  className="btn btn-danger btn-sm" 
                  onClick={handleDeleteAccount}
                  style={{ backgroundColor: '#dc3545' }}
                >
                  注销账号
                </button>
                <button 
                  className="btn btn-default btn-sm" 
                  onClick={handleLogout}
                >
                  退出登录
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      <main>{children}</main>
    </div>
  );
};

export default Layout;
