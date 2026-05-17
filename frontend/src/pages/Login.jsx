import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithPlatform, showToast } = useApp();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || phone.length !== 11) {
      showToast('请输入正确的手机号', 'error');
      return;
    }
    if (!code) {
      showToast('请输入验证码', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(phone, code);
      showToast('登录成功', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (platform) => {
    if (loading) return;
    setLoading(true);
    try {
      const platformNames = { wechat: '微信', qq: 'QQ', apple: 'Apple' };
      await loginWithPlatform(platform, `${platform}_${Date.now()}`, `${platformNames[platform]}用户`);
      showToast('登录成功', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message || '登录失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px 30px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>有道云笔记</h1>
          <p style={{ color: '#999', marginTop: '8px', fontSize: '14px' }}>记录生活，留住美好</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>手机号</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="请输入手机号"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #e8e8e8',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontSize: '14px' }}>验证码</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="请输入验证码"
              style={{
                flex: 1,
                padding: '14px 16px',
                border: '1px solid #e8e8e8',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
            />
            <button
              onClick={() => showToast('测试验证码：123456', 'info')}
              style={{
                padding: '0 16px',
                background: '#f0f5ff',
                color: '#1890ff',
                borderRadius: '8px',
                fontSize: '14px',
                whiteSpace: 'nowrap'
              }}
            >
              获取验证码
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: '#1890ff',
            color: 'white',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '登录中...' : '登 录'}
        </button>

        <div style={{ margin: '30px 0', textAlign: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#999',
            fontSize: '14px'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#eee' }} />
            <span>其他登录方式</span>
            <div style={{ flex: 1, height: '1px', background: '#eee' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
          {[
            { id: 'wechat', icon: '💬', label: '微信' },
            { id: 'qq', icon: '🐧', label: 'QQ' },
            { id: 'apple', icon: '🍎', label: 'Apple' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => handleQuickLogin(item.id)}
              disabled={loading}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#fafafa',
                border: '1px solid #e8e8e8',
                borderRadius: '12px',
                padding: '12px 20px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.2s ease',
                minWidth: '70px',
                pointerEvents: loading ? 'none' : 'auto'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#f0f5ff';
                  e.currentTarget.style.borderColor = '#1890ff';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fafafa';
                e.currentTarget.style.borderColor = '#e8e8e8';
              }}
            >
              <span style={{ fontSize: '28px' }}>{item.icon}</span>
              <span style={{ fontSize: '12px', color: '#666' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
