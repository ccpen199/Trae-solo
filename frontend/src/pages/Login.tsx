import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { handleApiError } from '../services/api';
import useStore from '../store/useStore';
import Loading from '../components/Loading';
import { showToast } from '../components/Toast';

const Login: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();
  const setToken = useStore((state) => state.setToken);
  const setUser = useStore((state) => state.setUser);

  const handleSendCode = async () => {
    if (!phone) {
      showToast('请输入手机号', 'error');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      showToast('手机号格式不正确', 'error');
      return;
    }

    setSendingCode(true);
    try {
      const res = await api.post('/auth/send-code', { phone });
      if (res.data.success) {
        showToast('验证码已发送', 'success');
        const mockCode = res.data.data?.code;
        if (mockCode) {
          showToast(`测试验证码: ${mockCode}`, 'info');
        }
        setCountdown(60);
      }
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setSendingCode(false);
    }
  };

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleLogin = async () => {
    if (!phone) {
      showToast('请输入手机号', 'error');
      return;
    }

    if (!code) {
      showToast('请输入验证码', 'error');
      return;
    }

    if (!agreedToTerms) {
      showToast('请先同意用户协议和隐私政策', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { phone, code, agreedToTerms });
      if (res.data.success) {
        setToken(res.data.data.token);
        setUser(res.data.data.user);
        showToast('登录成功', 'success');
        setTimeout(() => navigate('/'), 500);
      }
    } catch (error) {
      showToast(handleApiError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col">
      {loading && <Loading fullScreen />}
      
      <div className="flex-1 flex flex-col justify-center px-8">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-3xl">💖</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Soul</h1>
          <p className="text-gray-500 mt-1">跟随灵魂找到你</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
              placeholder="请输入手机号"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">验证码</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="请输入验证码"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
              <button
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                  sendingCode || countdown > 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                }`}
              >
                {countdown > 0 ? `${countdown}s` : sendingCode ? '发送中' : '获取'}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-pink-500 rounded border-gray-300 focus:ring-pink-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              我已阅读并同意<span className="text-pink-500">《用户协议》</span>和<span className="text-pink-500">《隐私政策》</span>
            </label>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl font-medium hover:from-pink-600 hover:to-pink-700 transition-all disabled:opacity-50 shadow-lg shadow-pink-200"
          >
            登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
