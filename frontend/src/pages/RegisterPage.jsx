import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useUserStore from '../store/userStore';
import { authAPI } from '../services/api';

const RegisterPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();
  const login = useUserStore((state) => state.login);

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      alert('请输入正确的手机号');
      return;
    }

    try {
      const response = await authAPI.sendCode(phone);
      if (response.data.success) {
        // 测试环境下显示验证码，方便测试
        const testCode = response.data.data.code;
        alert(`验证码发送成功！测试验证码：${testCode}`);
        setCountdown(60);

        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        alert(response.data.message || '发送验证码失败');
      }
    } catch (error) {
      console.error('发送验证码错误:', error);
      const errorMsg = error.response?.data?.message || error.message || '发送验证码失败';
      alert(`发送验证码失败: ${errorMsg}`);
    }
  };

  const handleRegister = async () => {
    if (!phone || phone.length !== 11) {
      alert('请输入正确的手机号');
      return;
    }
    if (!password || password.length < 6) {
      alert('密码至少6位');
      return;
    }
    if (!code) {
      alert('请输入验证码');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.register({ phone, password, code, nickname });

      if (response.data.success) {
        login(response.data.data.user, response.data.data.token);
        navigate('/');
      } else {
        alert(response.data.message || '注册失败');
      }
    } catch (error) {
      alert('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100%',
      background: '#000',
      padding: '20px'
    }}>
      <div style={{ marginBottom: '40px' }}>
        <ArrowLeft
          size={24}
          color="#fff"
          onClick={() => navigate('/login')}
          style={{ cursor: 'pointer' }}
        />
      </div>

      <h1 style={{ color: '#fff', fontSize: '28px', marginBottom: '40px' }}>
        注册
      </h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="tel"
          placeholder="手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={11}
          style={{
            width: '100%',
            padding: '15px',
            background: '#1a1a1a',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '16px',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="昵称（可选）"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={{
            width: '100%',
            padding: '15px',
            background: '#1a1a1a',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '16px',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="password"
          placeholder="密码（至少6位）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '15px',
            background: '#1a1a1a',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '16px',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="验证码"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          style={{
            flex: 1,
            padding: '15px',
            background: '#1a1a1a',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '16px',
            outline: 'none'
          }}
        />
        <button
          onClick={handleSendCode}
          disabled={countdown > 0}
          style={{
            padding: '15px 20px',
            background: countdown > 0 ? '#333' : '#fe2c55',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            cursor: countdown > 0 ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          {countdown > 0 ? `${countdown}s` : '获取验证码'}
        </button>
      </div>

      <button
        onClick={handleRegister}
        disabled={loading}
        style={{
          width: '100%',
          padding: '15px',
          background: '#fe2c55',
          border: 'none',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? '注册中...' : '注册'}
      </button>

      <div style={{ textAlign: 'center', color: '#999', fontSize: '14px' }}>
        已有账号？
        <span
          onClick={() => navigate('/login')}
          style={{ color: '#fe2c55', cursor: 'pointer' }}
        >
          立即登录
        </span>
      </div>
    </div>
  );
};

export default RegisterPage;
