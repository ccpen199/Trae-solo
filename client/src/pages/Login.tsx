import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useUserStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login({ nickname: nickname || '新用户' });
      navigate('/');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWechatLogin = async () => {
    setLoading(true);
    try {
      const openid = 'wx_' + Math.random().toString(36).substr(2, 16);
      await login({
        openid,
        nickname: '微信用户_' + Math.random().toString(36).substr(2, 4),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${openid}`,
      });
      navigate('/');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-orange-50 to-white px-6 pt-24">
      <div className="text-center mb-12">
        <div className="text-7xl mb-4 bounce-in">🪙</div>
        <h1 className="text-4xl font-bold text-gradient mb-2">赚赚</h1>
        <p className="text-gray-500">走路赚钱 · 任务赚钱 · 看视频赚钱</p>
      </div>

      <div className="space-y-4">
        <div className="card p-6">
          <label className="text-sm text-gray-500 mb-2 block">输入昵称(游客登录)</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="请输入昵称"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary mb-4"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary w-full text-center"
          >
            {loading ? '登录中...' : '开始赚钱'}
          </button>
        </div>

        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-gray-400 text-xs">或者</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <button
          onClick={handleWechatLogin}
          disabled={loading}
          className="w-full bg-[#07C160] text-white font-semibold rounded-full py-3.5 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="text-xl">💬</span>
          微信一键登录
        </button>
      </div>

      <div className="mt-16 text-center text-xs text-gray-400">
        <p>登录即代表同意《用户协议》和《隐私政策》</p>
      </div>
    </div>
  );
};

export default Login;
