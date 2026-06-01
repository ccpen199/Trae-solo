import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content container">
        <Link to="/" className="logo">自由行</Link>
        
        <nav className="nav-links">
          <Link to="/" className={isActive('/') ? 'active' : ''}>首页</Link>
          <Link to="/guides" className={isActive('/guides') ? 'active' : ''}>攻略</Link>
          <Link to="/hotels" className={isActive('/hotels') ? 'active' : ''}>酒店</Link>
        </nav>

        <div className="user-actions">
          {user ? (
            <>
              <div className="avatar" onClick={() => navigate('/profile')}>
                {user.nickname?.charAt(0) || user.username?.charAt(0)}
              </div>
              <button className="btn btn-outline" onClick={handleLogout}>退出</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => navigate('/login')}>登录</button>
              <button className="btn btn-primary" onClick={() => navigate('/login')}>注册</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
