import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginType, setLoginType] = useState('sms');
  const [form, setForm] = useState({ phone: '', code: '', password: '', email: '', username: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ ...form, type: loginType });
      navigate('/home');
    } catch (err) {
      alert(err.response?.data?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async () => {
    if (!form.phone) {
      alert('请输入手机号');
      return;
    }
    alert('验证码已发送：123456');
    setForm({ ...form, code: '123456' });
  };

  const thirdPartyLogin = async (provider) => {
    setLoading(true);
    try {
      await login({ 
        type: 'thirdparty', 
        provider, 
        openid: `${provider}_${Date.now()}` 
      });
      navigate('/home');
    } catch (err) {
      alert('第三方登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      background: '#fff', 
      minHeight: '100vh', 
      padding: '0 20px',
      position: 'relative'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '15px 0',
        position: 'sticky',
        top: 0,
        background: '#fff',
        zIndex: 10
      }}>
        <span style={{ 
          fontSize: '24px', 
          cursor: 'pointer',
          padding: '5px'
        }} onClick={() => navigate('/home')}>←</span>
        <span style={{ 
          flex: 1, 
          textAlign: 'center', 
          fontSize: '17px', 
          fontWeight: '600' 
        }}>登录</span>
        <span style={{ width: '30px' }}></span>
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)',
          margin: '0 auto 15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px'
        }}>🛍️</div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>网易严选</h2>
        <p style={{ color: '#999', fontSize: '14px', marginTop: '8px' }}>好的生活，没那么贵</p>
      </div>

      <div style={{ 
        display: 'flex', 
        marginBottom: '30px', 
        borderBottom: '1px solid #f0f0f0',
        position: 'relative'
      }}>
        {['sms', 'password', 'email'].map(type => (
          <div 
            key={type}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '15px 0',
              cursor: 'pointer',
              color: loginType === type ? '#ff6b35' : '#666',
              fontSize: '15px',
              fontWeight: loginType === type ? '600' : 'normal'
            }}
            onClick={() => setLoginType(type)}
          >
            {type === 'sms' ? '验证码登录' : type === 'password' ? '密码登录' : '邮箱登录'}
            {loginType === type && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                width: '33%',
                height: '2px',
                background: '#ff6b35',
                transform: `translateX(${['sms', 'password', 'email'].indexOf(type) * 100}%)`,
                left: 0
              }}></div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '40px' }}>
        {loginType === 'sms' && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #eee',
              borderRadius: '8px',
              padding: '5px 15px',
              marginBottom: '15px'
            }}>
              <span style={{ color: '#999', marginRight: '10px' }}>🇨🇳 +86</span>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                style={{ 
                  flex: 1,
                  padding: '12px 0',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px'
                }}
                required
              />
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginBottom: '20px' 
            }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '5px 15px'
              }}>
                <input
                  type="text"
                  placeholder="请输入验证码"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  style={{ 
                    flex: 1,
                    padding: '12px 0',
                    border: 'none',
                    outline: 'none',
                    fontSize: '15px'
                  }}
                  required
                />
              </div>
              <button 
                type="button" 
                onClick={sendCode} 
                style={{ 
                  padding: '0 15px',
                  background: '#ff6b35',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                获取验证码
              </button>
            </div>
          </>
        )}

        {loginType === 'password' && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #eee',
              borderRadius: '8px',
              padding: '5px 15px',
              marginBottom: '15px'
            }}>
              <input
                type="text"
                placeholder="手机号/用户名"
                value={form.phone || form.username}
                onChange={e => setForm({ ...form, phone: e.target.value, username: e.target.value })}
                style={{ 
                  flex: 1,
                  padding: '12px 0',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px'
                }}
                required
              />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #eee',
              borderRadius: '8px',
              padding: '5px 15px',
              marginBottom: '20px'
            }}>
              <input
                type="password"
                placeholder="请输入密码"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ 
                  flex: 1,
                  padding: '12px 0',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px'
                }}
                required
              />
            </div>
          </>
        )}

        {loginType === 'email' && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #eee',
              borderRadius: '8px',
              padding: '5px 15px',
              marginBottom: '15px'
            }}>
              <input
                type="email"
                placeholder="请输入邮箱"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ 
                  flex: 1,
                  padding: '12px 0',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px'
                }}
                required
              />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #eee',
              borderRadius: '8px',
              padding: '5px 15px',
              marginBottom: '20px'
            }}>
              <input
                type="password"
                placeholder="请输入密码"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ 
                  flex: 1,
                  padding: '12px 0',
                  border: 'none',
                  outline: 'none',
                  fontSize: '15px'
                }}
                required
              />
            </div>
          </>
        )}

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%',
            padding: '15px',
            background: '#ff6b35',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {loading ? '登录中...' : '登 录'}
        </button>
      </form>

      <div style={{ 
        textAlign: 'center', 
        marginBottom: '50px' 
      }}>
        <Link 
          to="/register" 
          style={{ 
            color: '#ff6b35', 
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          注册账号
        </Link>
        <span style={{ margin: '0 15px', color: '#e0e0e0' }}>|</span>
        <Link 
          to="#" 
          style={{ 
            color: '#666', 
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          忘记密码？
        </Link>
      </div>

      <div style={{ 
        position: 'relative',
        textAlign: 'center', 
        marginBottom: '30px'
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '1px',
          background: '#eee',
          zIndex: 1
        }}></div>
        <span style={{
          display: 'inline-block',
          background: '#fff',
          padding: '0 15px',
          color: '#999',
          fontSize: '13px',
          position: 'relative',
          zIndex: 2
        }}>其他登录方式</span>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '40px',
        marginBottom: '50px'
      }}>
        {[
          { name: '微信', icon: '💬', color: '#07c160' },
          { name: 'QQ', icon: '🐧', color: '#12b7f5' },
          { name: '微博', icon: '📱', color: '#ff6b35' },
          { name: '支付宝', icon: '💰', color: '#1677ff' }
        ].map(item => (
          <div 
            key={item.name}
            style={{ 
              textAlign: 'center',
              cursor: 'pointer'
            }}
            onClick={() => thirdPartyLogin(item.name)}
          >
            <div style={{
              width: '55px',
              height: '55px',
              borderRadius: '50%',
              background: item.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              <span style={{ fontSize: '28px' }}>{item.icon}</span>
            </div>
            <span style={{ fontSize: '12px', color: '#666' }}>{item.name}</span>
          </div>
        ))}
      </div>

      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: 0,
        right: 0,
        textAlign: 'center'
      }}>
        <p style={{ 
          fontSize: '12px', 
          color: '#bbb',
          lineHeight: '1.6'
        }}>
          登录即代表同意
          <span style={{ color: '#ff6b35' }}>《用户协议》</span>
          和
          <span style={{ color: '#ff6b35' }}>《隐私政策》</span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
