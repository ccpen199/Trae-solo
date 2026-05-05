import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useEffect } from 'react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { totalQuantity, fetchCart } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="header">
        <div className="container header-content">
          <NavLink to="/" className="logo">
            📚 网上书店
          </NavLink>
          
          <nav className="nav">
            <NavLink to="/" end>首页</NavLink>
            <NavLink to="/books">图书</NavLink>
            <NavLink to="/news">新闻公告</NavLink>
            
            {isAuthenticated ? (
              <>
                <NavLink to="/cart" className="cart-badge">
                  购物车
                  {totalQuantity > 0 && (
                    <span className="cart-count">{totalQuantity}</span>
                  )}
                </NavLink>
                
                <div className="dropdown">
                  <button 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'white', 
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 500
                    }}
                  >
                    {user?.username} ▼
                  </button>
                  <div className="dropdown-menu">
                    <NavLink to="/profile" className="dropdown-item">个人中心</NavLink>
                    <NavLink to="/orders" className="dropdown-item">我的订单</NavLink>
                    {user?.role === 'admin' && (
                      <NavLink to="/admin" className="dropdown-item">管理后台</NavLink>
                    )}
                    <div className="dropdown-divider"></div>
                    <button 
                      onClick={handleLogout} 
                      className="dropdown-item"
                      style={{ width: '100%', textAlign: 'left' }}
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login">登录</NavLink>
                <NavLink to="/register" className="btn btn-primary btn-sm">注册</NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      
      <main style={{ flex: 1 }}>
        {children}
      </main>
      
      <footer style={{ 
        background: '#1e293b', 
        color: 'white', 
        padding: '2rem 0',
        marginTop: '3rem'
      }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            <div>
              <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>关于我们</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                网上书店是专业的在线购书平台，提供海量正版图书，支持在线支付，全国配送。
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>帮助中心</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem' }}>购物指南</a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem' }}>支付方式</a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem' }}>配送说明</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>联系我们</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                客服电话：400-123-4567
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                工作时间：9:00-21:00
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                邮箱：support@bookstore.com
              </p>
            </div>
          </div>
          <div style={{ 
            borderTop: '1px solid #334155', 
            marginTop: '2rem', 
            paddingTop: '1rem',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '0.875rem'
          }}>
            © 2026 网上书店. 保留所有权利. 端口 22191
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
