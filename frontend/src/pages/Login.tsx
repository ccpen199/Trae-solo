import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { getDemoAccounts } from '@/api/auth';
import type { DemoAccount } from '@/types';

const roleColorMap: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-300 border-red-500/30',
  platform: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  ops: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  worker: 'bg-green-500/20 text-green-300 border-green-500/30',
  employer: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  university: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const roleLabelMap: Record<string, string> = {
  admin: '超级管理员',
  platform: '平台运营',
  ops: '运营管理',
  worker: '兼职者',
  employer: '雇主',
  university: '高校就业办',
};

export default function Login() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    getDemoAccounts().then(setDemoAccounts).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await login(account, password);
      navigate('/home');
    } catch (err: any) {
      const msg = err.response?.data?.message || '登录失败，请重试';
      setErrorMsg(msg);
    }
  };

  const fillAccount = (acc: DemoAccount) => {
    setAccount(acc.username);
    setPassword(acc.password);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-brand-800/10" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl" />
        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-8">
            兼
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">兼职通</h1>
          <p className="text-white/50 text-lg leading-relaxed">
            安全、高效的垂直兼职招聘平台
            <br />
            连接优质雇主与灵活就业者
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
              兼
            </div>
            <h1 className="text-2xl font-bold text-white">兼职通</h1>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">欢迎回来</h2>
          <p className="text-white/40 mb-8">输入账号和密码登录</p>

          {errorMsg && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">账号</label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                placeholder="用户名或手机号"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                placeholder="请输入密码"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 active:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <p className="mt-6 text-center text-white/40 text-sm">
            还没有账号？
            <Link to="/register" className="text-brand-400 hover:text-brand-300 ml-1 font-medium">
              立即注册
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-white/50 text-xs mb-3 font-medium">演示账号 — 点击快速填充：</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => fillAccount(acc)}
                  className={`flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${roleColorMap[acc.role] || 'bg-white/5 text-white/60 border-white/10'}`}
                >
                  <span className="text-xs font-semibold">{acc.username} / {acc.password}</span>
                  <span className="text-[10px] opacity-70 mt-0.5">{roleLabelMap[acc.role] || acc.nickname}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
