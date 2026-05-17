import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { authAPI } from '../services/api';

const ResetPasswordPage = () => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      alert('请输入正确的手机号');
      return;
    }

    try {
      await authAPI.sendCode(phone);
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
    } catch (error) {
      alert('发送验证码失败');
    }
  };

  const handleResetPassword = async () => {
    if (!phone || phone.length !== 11) {
      alert('请输入正确的手机号');
      return;
    }
    if (!code) {
      alert('请输入验证码');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      alert('密码至少6位');
      return;
    }

    try {
      setLoading(true);
      await authAPI.resetPassword({ phone, code, newPassword });
      alert('密码重置成功，请重新登录');
      navigate('/login');
    } catch (error) {
      alert('密码重置失败，请重试');
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
        重置密码
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

      <div style={{ marginBottom: '30px' }}>
        <input
          type="password"
          placeholder="新密码（至少6位）"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
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

      <button
        onClick={handleResetPassword}
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
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '重置中...' : '重置密码'}
      </button>
    </div>
  );
};

export default ResetPasswordPage;
