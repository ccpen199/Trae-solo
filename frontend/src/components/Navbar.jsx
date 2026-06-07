import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{ 
      background: 'white', 
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        height: '64px'
      }}>
        <Link to="/" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          fontSize: '20px',
          fontWeight: '700',
          color: '#4f46e5'
        }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '18px'
          }}>
            ▶
          </div>
          视聘
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/jobs" style={{ 
            color: '#4b5563', 
            fontSize: '14px',
            fontWeight: '500'
          }}>
            找工作
          </Link>

          {user ? (
            <>
              {user.role === 'company' && (
                <Link to="/company/dashboard" style={{ 
                  color: '#4b5563', 
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  企业中心
                </Link>
              )}
              {user.role === 'jobseeker' && (
                <Link to="/jobseeker/dashboard" style={{ 
                  color: '#4b5563', 
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  我的简历
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin/dashboard" style={{ 
                  color: '#4b5563', 
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  管理后台
                </Link>
              )}
              <Link to="/messages" style={{ 
                color: '#4b5563', 
                fontSize: '14px',
                fontWeight: '500'
              }}>
                消息
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  {user.username}
                </span>
                <button 
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                >
                  退出
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                登录
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
