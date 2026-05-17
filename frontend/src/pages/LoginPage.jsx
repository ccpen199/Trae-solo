import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useUserStore from '../store/userStore';
import { authAPI } from '../services/api';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [useCodeLogin, setUseCodeLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
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
        setCodeSent(true);
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

  const handleLogin = async () => {
    if (!phone || phone.length !== 11) {
      alert('请输入正确的手机号');
      return;
    }

    if (useCodeLogin && !code) {
      alert('请输入验证码');
      return;
    }

    if (!useCodeLogin && !password) {
      alert('请输入密码');
      return;
    }

    try {
      setLoading(true);
      const data = useCodeLogin ? { phone, code } : { phone, password };
      const response = await authAPI.login(data);

      if (response.data.success) {
        login(response.data.data.user, response.data.data.token);
        navigate('/');
      } else {
        alert(response.data.message || '登录失败');
      }
    } catch (error) {
      console.error('登录错误:', error);
      const errorMsg = error.response?.data?.message || error.message || '登录失败，请重试';
      alert(`登录失败: ${errorMsg}`);
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
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        />
      </div>

      <h1 style={{ color: '#fff', fontSize: '28px', marginBottom: '40px' }}>
        登录
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

      {useCodeLogin ? (
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
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <input
            type="password"
            placeholder="密码"
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
      )}

      <button
        onClick={handleLogin}
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
        {loading ? '登录中...' : '登录'}
      </button>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '30px'
      }}>
        <span
          onClick={() => setUseCodeLogin(!useCodeLogin)}
          style={{ color: '#fe2c55', cursor: 'pointer', fontSize: '14px' }}
        >
          {useCodeLogin ? '密码登录' : '验证码登录'}
        </span>
        <Link to="/reset-password" style={{ color: '#999', fontSize: '14px', textDecoration: 'none' }}>
          忘记密码？
        </Link>
      </div>

      <div style={{ textAlign: 'center', color: '#999', fontSize: '14px' }}>
        没有账号？
        <Link to="/register" style={{ color: '#fe2c55', textDecoration: 'none' }}>
          立即注册
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
