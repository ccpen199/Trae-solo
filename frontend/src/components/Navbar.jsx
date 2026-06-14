import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

function Navbar({ showToast }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    showToast('已退出登录', 'success');
    navigate('/');
    setShowDropdown(false);
  };

  const getInitial = () => {
    if (user?.real_name) return user.real_name.charAt(0);
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">灵活就业平台</Link>
        
        <ul className="nav-menu">
          <li><NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>首页</NavLink></li>
          <li><NavLink to="/tasks" className={({isActive}) => isActive ? 'active' : ''}>任务大厅</NavLink></li>
          {user && ['student', 'homemaker', 'parttime'].includes(user.user_type) && (
            <>
              <li><NavLink to="/my-orders" className={({isActive}) => isActive ? 'active' : ''}>我的任务</NavLink></li>
              <li><NavLink to="/settlements" className={({isActive}) => isActive ? 'active' : ''}>我的收入</NavLink></li>
            </>
          )}
          {user?.user_type === 'admin' && (
            <li><NavLink to="/admin" className={({isActive}) => isActive ? 'active' : ''}>管理后台</NavLink></li>
          )}
        </ul>

        <div className="nav-user">
          {user ? (
            <div style={{ position: 'relative' }}>
              <div 
                className="user-avatar" 
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {getInitial()}
              </div>
              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  right: 0,
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  minWidth: '160px',
                  zIndex: 101
                }}>
                  <Link 
                    to="/profile" 
                    style={{ display: 'block', padding: '12px 16px', color: '#333', fontSize: '14px' }}
                    onClick={() => setShowDropdown(false)}
                  >
                    个人中心
                  </Link>
                  {user.user_type === 'admin' && (
                    <Link 
                      to="/admin" 
                      style={{ display: 'block', padding: '12px 16px', color: '#333', fontSize: '14px', borderTop: '1px solid #f1f5f9' }}
                      onClick={() => setShowDropdown(false)}
                    >
                      管理后台
                    </Link>
                  )}
                  <div 
                    onClick={handleLogout}
                    style={{ padding: '12px 16px', color: '#ff4757', fontSize: '14px', cursor: 'pointer', borderTop: '1px solid #f1f5f9' }}
                  >
                    退出登录
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 20px' }}>登录</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 20px' }}>注册</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
