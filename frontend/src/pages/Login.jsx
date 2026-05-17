import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';
import api from '../utils/api';
import useStore from '../store';

function Login() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useStore((state) => state.login);

  const handleLogin = async () => {
    if (!phone || phone.length < 11) {
      setError('请输入正确的手机号');
      return;
    }
    if (!code) {
      setError('请输入验证码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/login', { phone, code });
      if (response.data.success) {
        login(response.data.data.user, response.data.data.token);
        navigate('/');
      } else {
        setError(response.data.message || '登录失败');
      }
    } catch (err) {
      setError(err.response?.data?.message || '网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleThirdPartyLogin = async (type) => {
    setLoading(true);
    try {
      const response = await api.post('/login', {
        third_party_id: `${type}_${Date.now()}`,
        third_party_type: type,
        nickname: type === 'wechat' ? '微信用户' : 'QQ用户',
        avatar: `https://picsum.photos/seed/${Date.now()}/100/100`
      });
      if (response.data.success) {
        login(response.data.data.user, response.data.data.token);
        navigate('/');
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px 30px',
        width: '100%',
        maxWidth: '360px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{
          textAlign: 'center',
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#ff4757',
          marginBottom: '10px'
        }}>
          映客
        </h1>
        <p style={{ textAlign: 'center', color: '#999', marginBottom: '30px' }}>
          直播社交平台
        </p>

        {error && (
          <div style={{
            background: '#fff2f0',
            color: '#ff4757',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #eee',
            borderRadius: '10px',
            padding: '12px 16px'
          }}>
            <Phone size={18} color="#999" style={{ marginRight: '10px' }} />
            <input
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '14px'
              }}
              maxLength={11}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #eee',
            borderRadius: '10px',
            padding: '12px 16px'
          }}>
            <input
              type="text"
              placeholder="请输入验证码（测试：123456）"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '14px'
              }}
              maxLength={6}
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #ff4757, #ff6b81)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '登录中...' : '登录'}
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '30px 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#eee' }} />
          <span style={{ padding: '0 15px', color: '#999', fontSize: '12px' }}>其他登录方式</span>
          <div style={{ flex: 1, height: '1px', background: '#eee' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px' }}>
          <button
            onClick={() => handleThirdPartyLogin('wechat')}
            disabled={loading}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '1px solid #eee',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}
          >
            💚
          </button>
          <button
            onClick={() => handleThirdPartyLogin('qq')}
            disabled={loading}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '1px solid #eee',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}
          >
            🐧
          </button>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#999',
          marginTop: '30px'
        }}>
          登录即表示同意《用户协议》和《隐私政策》
        </p>
      </div>
    </div>
  );
}

export default Login;
