import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Header() {
  const { currentUser, logout, isEditorOrAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getRoleText = (role) => {
    const roleMap = {
      campus: '校园用户',
      social: '社会用户',
      guest: '游客',
      admin: '管理员',
      editor: '编辑',
    };
    return roleMap[role] || role;
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">校园新闻</Link>
        
        <nav className="nav-links">
          <Link to="/" className="nav-link">首页</Link>
          
          <form onSubmit={handleSearch} className="search-bar">
            <input
              type="text"
              placeholder="搜索新闻..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">搜索</button>
          </form>

          {currentUser ? (
            <div className="user-menu">
              <span className="user-name">
                {currentUser.full_name || currentUser.username}
                <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.8 }}>
                  ({getRoleText(currentUser.role)})
                </span>
              </span>
              <Link to="/profile" className="nav-link">个人中心</Link>
              <Link to="/favorites" className="nav-link">收藏夹</Link>
              {isEditorOrAdmin() && (
                <Link to="/admin" className="nav-link">后台管理</Link>
              )}
              <button onClick={logout} className="btn btn-outline">退出</button>
            </div>
          ) : (
            <div className="user-menu">
              <Link to="/login" className="btn btn-outline">登录</Link>
              <Link to="/register" className="btn btn-outline">注册</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
