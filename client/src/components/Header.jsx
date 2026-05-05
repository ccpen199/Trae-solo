import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            团购网
          </Link>
          
          <nav className="nav">
            <Link to="/">首页</Link>
            
            {user ? (
              <>
                <Link to="/orders">我的订单</Link>
                <Link to="/profile">个人中心</Link>
                {isAdmin() && <Link to="/admin">管理后台</Link>}
                <div className="nav-user">
                  <span className="user-info">
                    欢迎, {user.username}
                  </span>
                  <button className="logout-btn" onClick={handleLogout}>
                    退出
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">登录</Link>
                <Link to="/register">注册</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
