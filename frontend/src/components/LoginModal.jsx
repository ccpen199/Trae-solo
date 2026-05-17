import { useState } from 'react';
import { X } from 'lucide-react';
import useUserStore from '../store/userStore';
import useToastStore from '../store/toastStore';

export default function LoginModal({ visible, onClose }) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const { login, sendCode, loading } = useUserStore();
  const { show } = useToastStore();

  const handleSendCode = async () => {
    if (!phone || phone.length !== 11) {
      show('请输入正确的手机号');
      return;
    }
    if (countdown > 0) return;

    const result = await sendCode(phone);
    if (result.success) {
      show('验证码已发送，测试验证码：123456');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      show(result.message || '发送失败');
    }
  };

  const handleLogin = async () => {
    if (!phone || !code) {
      show('请填写完整信息');
      return;
    }
    const result = await login(phone, code);
    if (result.success) {
      show('登录成功');
      onClose?.();
    } else {
      show(result.message || '登录失败');
    }
  };

  if (!visible) return null;

  return (
    <div className="login-modal" onClick={onClose}>
      <div className="login-content" onClick={e => e.stopPropagation()}>
        <div className="login-header">
          <h2 className="login-title">登录</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="phone-input-box">
          <span className="country-code">+86</span>
          <input
            className="phone-input"
            type="tel"
            placeholder="请输入手机号"
            value={phone}
            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
          />
        </div>

        <div className="code-input-box">
          <input
            className="code-input"
            type="text"
            placeholder="请输入验证码"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <button 
            className="send-code-btn" 
            onClick={handleSendCode}
            disabled={countdown > 0}
          >
            {countdown > 0 ? `${countdown}s` : '获取验证码'}
          </button>
        </div>

        <button 
          className="login-submit-btn" 
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </div>
    </div>
  );
}
