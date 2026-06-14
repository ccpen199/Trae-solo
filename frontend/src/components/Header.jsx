import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [showServicesMenu, setShowServicesMenu] = useState(false);
  const [showGuaranteeMenu, setShowGuaranteeMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'landlord') return '/dashboard/landlord';
    return '/dashboard/tenant';
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">🏠 直连家园</Link>
          <nav className="nav" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link to="/">首页</Link>
            <Link to="/search">搜索结果</Link>
            <Link to="/properties">搜索筛选房源</Link>
            <Link to="/rent-index">租金指数</Link>
            <Link to="/admin" style={{ fontWeight: 700 }}>管理后台</Link>

            {isAuthenticated && (
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowPublishMenu(true)}
                onMouseLeave={() => setShowPublishMenu(false)}
              >
                <Link 
                  to="#" 
                  onClick={(e) => e.preventDefault()}
                  style={{ cursor: 'pointer' }}
                >
                  发布房源 ▼
                </Link>
                {showPublishMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    background: 'white',
                    border: '1px solid #eee',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: '140px',
                    zIndex: 1000,
                    padding: '0.5rem 0'
                  }}>
                    <Link 
                      to="/publish?mode=whole" 
                      style={{ 
                        display: 'block', 
                        padding: '0.5rem 1rem', 
                        textDecoration: 'none', 
                        color: '#333' 
                      }}
                    >
                      🏠 发布整租
                    </Link>
                    <Link 
                      to="/publish?mode=share" 
                      style={{ 
                        display: 'block', 
                        padding: '0.5rem 1rem', 
                        textDecoration: 'none', 
                        color: '#333' 
                      }}
                    >
                      👥 发布合租
                    </Link>
                    <Link 
                      to="/publish?mode=sublet" 
                      style={{ 
                        display: 'block', 
                        padding: '0.5rem 1rem', 
                        textDecoration: 'none', 
                        color: '#333' 
                      }}
                    >
                      🔄 发布转租
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div 
              style={{ position: 'relative' }}
              onMouseEnter={() => setShowServicesMenu(true)}
              onMouseLeave={() => setShowServicesMenu(false)}
            >
              <Link 
                to="/services"
                style={{ cursor: 'pointer' }}
              >
                服务选购 ▼
              </Link>
              {showServicesMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  background: 'white',
                  border: '1px solid #eee',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: '140px',
                  zIndex: 1000,
                  padding: '0.5rem 0'
                }}>
                  <Link 
                    to="/services" 
                    style={{ 
                      display: 'block', 
                      padding: '0.5rem 1rem', 
                      textDecoration: 'none', 
                      color: '#333' 
                    }}
                  >
                    📋 验房服务
                  </Link>
                  <Link 
                    to="/services" 
                    style={{ 
                      display: 'block', 
                      padding: '0.5rem 1rem', 
                      textDecoration: 'none', 
                      color: '#333' 
                    }}
                  >
                    ⚖️ 法务服务
                  </Link>
                  <Link 
                    to="/services" 
                    style={{ 
                      display: 'block', 
                      padding: '0.5rem 1rem', 
                      textDecoration: 'none', 
                      color: '#333' 
                    }}
                  >
                    💰 贷款服务
                  </Link>
                </div>
              )}
            </div>

            <div 
              style={{ position: 'relative' }}
              onMouseEnter={() => setShowGuaranteeMenu(true)}
              onMouseLeave={() => setShowGuaranteeMenu(false)}
            >
              <Link 
                to="/escrow"
                style={{ cursor: 'pointer' }}
              >
                交易保障 ▼
              </Link>
              {showGuaranteeMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  background: 'white',
                  border: '1px solid #eee',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: '140px',
                  zIndex: 1000,
                  padding: '0.5rem 0'
                }}>
                  <Link 
                    to="/escrow" 
                    style={{ 
                      display: 'block', 
                      padding: '0.5rem 1rem', 
                      textDecoration: 'none', 
                      color: '#333' 
                    }}
                  >
                    💼 资金托管
                  </Link>
                  <Link 
                    to="/contracts" 
                    style={{ 
                      display: 'block', 
                      padding: '0.5rem 1rem', 
                      textDecoration: 'none', 
                      color: '#333' 
                    }}
                  >
                    📝 电子合同
                  </Link>
                  <Link 
                    to="/insurance" 
                    style={{ 
                      display: 'block', 
                      padding: '0.5rem 1rem', 
                      textDecoration: 'none', 
                      color: '#333' 
                    }}
                  >
                    🛡️ 履约保险
                  </Link>
                  <Link 
                    to="/disputes" 
                    style={{ 
                      display: 'block', 
                      padding: '0.5rem 1rem', 
                      textDecoration: 'none', 
                      color: '#333' 
                    }}
                  >
                    ⚖️ 纠纷调解
                  </Link>
                </div>
              )}
            </div>

            {isAuthenticated && user?.role === 'admin' && (
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowAdminMenu(true)}
                onMouseLeave={() => setShowAdminMenu(false)}
              >
                <Link 
                  to="#" 
                  onClick={(e) => e.preventDefault()}
                  style={{ cursor: 'pointer', color: '#eb2f96', fontWeight: 'bold' }}
                >
                  管理后台 ▼
                </Link>
                {showAdminMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    background: 'white',
                    border: '1px solid #eee',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: '160px',
                    zIndex: 1000,
                    padding: '0.5rem 0'
                  }}>
                    <Link 
                      to="/admin" 
                      style={{ 
                        display: 'block', 
                        padding: '0.5rem 1rem', 
                        textDecoration: 'none', 
                        color: '#333' 
                      }}
                    >
                      📊 数据概览
                    </Link>
                    <Link 
                      to="/workorders" 
                      style={{ 
                        display: 'block', 
                        padding: '0.5rem 1rem', 
                        textDecoration: 'none', 
                        color: '#333' 
                      }}
                    >
                      📋 质检工单
                    </Link>
                    <Link 
                      to="/disputes" 
                      style={{ 
                        display: 'block', 
                        padding: '0.5rem 1rem', 
                        textDecoration: 'none', 
                        color: '#333' 
                      }}
                    >
                      ⚖️ 纠纷调解
                    </Link>
                    <Link 
                      to="/rent-index" 
                      style={{ 
                        display: 'block', 
                        padding: '0.5rem 1rem', 
                        textDecoration: 'none', 
                        color: '#333' 
                      }}
                    >
                      📈 租金指数
                    </Link>
                    <Link 
                      to="/credit" 
                      style={{ 
                        display: 'block', 
                        padding: '0.5rem 1rem', 
                        textDecoration: 'none', 
                        color: '#333' 
                      }}
                    >
                      ⭐ 信用分管理
                    </Link>
                  </div>
                )}
              </div>
            )}

            {!isAuthenticated ? (
              <>
                <Link to="/login">登录</Link>
                <Link to="/register" className="btn btn-outline">注册</Link>
              </>
            ) : (
              <div 
                style={{ position: 'relative' }}
                onMouseEnter={() => setShowUserMenu(true)}
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <Link 
                  to="#" 
                  onClick={(e) => e.preventDefault()}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    cursor: 'pointer' 
                  }}
                >
                  <span style={{ 
                    width: '28px', 
                    height: '28px', 
                    borderRadius: '50%', 
                    background: '#1890ff', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {(user?.real_name || user?.username || 'U')[0]}
                  </span>
                  <span>{user?.real_name || user?.username} ▼</span>
                </Link>
                {showUserMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    background: 'white',
                    border: '1px solid #eee',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: '160px',
                    zIndex: 1000,
                    padding: '0.5rem 0'
                  }}>
                    <Link 
                      to={getDashboardRoute()}
                      style={{ 
                        display: 'block', 
                        padding: '0.5rem 1rem', 
                        textDecoration: 'none', 
                        color: '#333' 
                      }}
                    >
                      📊 我的工作台
                    </Link>
                    <Link 
                      to="/profile" 
                      style={{ 
                        display: 'block', 
                        padding: '0.5rem 1rem', 
                        textDecoration: 'none', 
                        color: '#333' 
                      }}
                    >
                      👤 个人资料
                    </Link>
                    <Link 
                      to="/credit" 
                      style={{ 
                        display: 'block', 
                        padding: '0.5rem 1rem', 
                        textDecoration: 'none', 
                        color: '#333' 
                      }}
                    >
                      ⭐ 我的信用分
                    </Link>
                    <div style={{ borderTop: '1px solid #eee', margin: '0.5rem 0' }} />
                    <button 
                      onClick={handleLogout}
                      style={{ 
                        display: 'block', 
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.5rem 1rem', 
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: '#ff4d4f'
                      }}
                    >
                      🚪 退出登录
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
