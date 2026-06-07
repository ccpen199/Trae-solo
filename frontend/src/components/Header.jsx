import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, userType, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">🚚 快货运</Link>
        
        <nav className="nav">
          <Link to="/">首页</Link>
          {!user && (
            <>
              <Link to="/create-order">立即下单</Link>
              <Link to="/orders">我的订单</Link>
              <Link to="/admin">后台管理</Link>
            </>
          )}
          {userType === 'shipper' && (
            <>
              <Link to="/create-order">立即下单</Link>
              <Link to="/orders">我的订单</Link>
            </>
          )}
          {userType === 'driver' && (
            <>
              <Link to="/driver">司机工作台</Link>
              <Link to="/orders">订单列表</Link>
            </>
          )}
          {userType === 'admin' && (
            <>
              <Link to="/admin">数据看板</Link>
              <Link to="/admin/quality">质量监控</Link>
              <Link to="/admin/capacity">运力调度</Link>
              <Link to="/admin/audit">运费审计</Link>
            </>
          )}
        </nav>
        
        <div className="user-actions">
          {user ? (
            <>
              <span style={{ fontSize: '14px', color: '#666' }}>
                {userType === 'shipper' ? '货主' : userType === 'driver' ? '司机' : '管理员'}: {user.name || user.username}
              </span>
              <button className="btn btn-outline" onClick={handleLogout}>退出</button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">登录/注册</Link>
          )}
        </div>
      </div>
    </header>
  );
}
