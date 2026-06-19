import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { useToast } from '../components/ToastProvider';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useUserStore((s) => s.login);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const name = nickname.trim();
    if (!name) {
      setError('请输入昵称');
      return;
    }
    if (name.length < 1 || name.length > 20) {
      setError('昵称长度需在1-20个字符之间');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login({ nickname: name });
      toast.show(`欢迎回来，${name}！`, 2000);
      navigate('/', { replace: true });
    } catch (e: any) {
      const msg = e?.message || '登录失败，请重试';
      setError(msg);
      toast.show(msg, 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleWechatLogin = async () => {
    setLoading(true);
    setError('');

    try {
      toast.show('正在拉起微信授权...', 2000);

      await new Promise((resolve) => setTimeout(resolve, 1200));

      const openid = 'wx_' + Math.random().toString(36).substr(2, 16);
      const wxNickname = '微信用户_' + Math.random().toString(36).substr(2, 4);

      await login({
        openid,
        nickname: wxNickname,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${openid}`,
      });

      toast.show(`微信授权成功，欢迎 ${wxNickname}`, 2000);
      navigate('/', { replace: true });
    } catch (e: any) {
      const msg = e?.message || '微信登录失败，请重试';
      setError(msg);
      toast.show(msg, 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-100 via-orange-50 to-white px-6 pt-20">
      <div className="text-center mb-10">
        <div className="text-7xl mb-4 bounce-in">🪙</div>
        <h1 className="text-4xl font-bold text-gradient mb-2">赚赚</h1>
        <p className="text-gray-500">走路赚钱 · 任务赚钱 · 看视频赚钱</p>
      </div>

      <div className="space-y-4">
        <div className="card p-6">
          <label className="text-sm text-gray-500 mb-2 block">输入昵称(游客登录)</label>
          <input
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="请输入昵称"
            disabled={loading}
            className={`w-full px-4 py-3 rounded-xl bg-gray-50 border ${
              error ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-primary'
            } focus:outline-none mb-2 transition-colors`}
          />
          {error && (
            <div className="text-red-500 text-xs mb-3 flex items-center gap-1">
              <span>⚠️</span> {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`btn-primary w-full text-center ${loading ? 'opacity-60' : ''}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                登录中...
              </span>
            ) : (
              '开始赚钱'
            )}
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
          className={`w-full bg-[#07C160] text-white font-semibold rounded-full py-3.5 flex items-center justify-center gap-2 active:scale-95 transition-transform ${
            loading ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              授权中...
            </span>
          ) : (
            <>
              <span className="text-xl">💬</span>
              微信一键登录
            </>
          )}
        </button>
      </div>

      <div className="mt-12 text-center text-xs text-gray-400 space-y-1">
        <p>登录即代表同意《用户协议》和《隐私政策》</p>
        <p className="text-gray-300">游客账号仅限本设备使用</p>
      </div>
    </div>
  );
};

export default Login;
