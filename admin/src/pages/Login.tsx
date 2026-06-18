import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, Building2, Shield, ShieldCheck, ShieldAlert, MapPin, Store } from 'lucide-react';
import { useAppStore } from '@/store';
import type { User as UserType } from '@/types';

const ROLE_META: Record<string, { label: string; icon: typeof Shield; color: string; bg: string }> = {
  super_admin: { label: '超级管理员', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
  admin: { label: '市级运营管理员', icon: ShieldCheck, color: 'text-primary-600', bg: 'bg-primary-50' },
  scenic_admin: { label: '景区运营管理员', icon: MapPin, color: 'text-secondary-600', bg: 'bg-secondary-50' },
  merchant_admin: { label: '商户运营管理员', icon: Store, color: 'text-accent-600', bg: 'bg-accent-50' },
};

const TEST_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: 'super_admin', desc: '全部功能权限' },
  { username: 'platform', password: 'platform123', role: 'admin', desc: '市级运营全权限' },
  { username: 'ops', password: 'ops123', role: 'admin', desc: '运营运维权限' },
  { username: 'scenic_admin', password: 'scenic123', role: 'scenic_admin', desc: '景区运营权限' },
  { username: 'merchant_admin', password: 'merchant123', role: 'merchant_admin', desc: '商户运营权限' },
];

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [loggedInUser, setLoggedInUser] = useState<UserType | null>(null);
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const loading = useAppStore((state) => state.loading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setLoggedInUser(null);

    if (!username.trim()) {
      setError('请输入用户名');
      setErrorCode('EMPTY_USERNAME');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      setErrorCode('EMPTY_PASSWORD');
      return;
    }

    const result = await login(username, password);

    if (result.success && result.user) {
      setLoggedInUser(result.user);
      setTimeout(() => {
        window.location.href = '/';
      }, 600);
    } else {
      setError(result.message || '登录失败，请检查账号密码');
      setErrorCode(result.code || 'UNKNOWN');
    }
  };

  const fillAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
    setErrorCode('');
  };

  const roleMeta = loggedInUser ? ROLE_META[loggedInUser.role] : null;
  const RoleIcon = roleMeta?.icon || Shield;

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(45,157,114,0.3),transparent_50%)]"></div>

        <div className="relative z-10 p-16 flex flex-col justify-between w-full">
          <div>
            <div className="flex items-center">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Building2 size={32} className="text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-white">苏州城市数字服务中台</h1>
                <p className="text-white/70 mt-1">Suzhou Urban Digital Service Platform</p>
              </div>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-white leading-tight">
              数字赋能
              <br />
              <span className="text-accent-400">智慧苏州</span>
            </h2>
            <p className="mt-6 text-white/80 leading-relaxed">
              以市民身份为主干，支撑交通、文旅、企业服务、商业服务四大业务域，
              构建一体化城市数字服务生态。
            </p>

            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                <div className="text-3xl font-bold text-white">125万+</div>
                <div className="text-white/70 text-sm mt-1">实名认证市民</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                <div className="text-3xl font-bold text-white">856万+</div>
                <div className="text-white/70 text-sm mt-1">累计交易笔数</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                <div className="text-3xl font-bold text-white">300+</div>
                <div className="text-white/70 text-sm mt-1">全国一卡通城市</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                <div className="text-3xl font-bold text-white">50+</div>
                <div className="text-white/70 text-sm mt-1">A级景区接入</div>
              </div>
            </div>
          </div>

          <div className="text-white/60 text-sm">
            © 2024 苏州市大数据管理局 · 苏州城市数字服务中台
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto">
              <Building2 size={32} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mt-4">苏州城市数字服务中台</h1>
            <p className="text-gray-500 text-sm mt-1">运营管理平台</p>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">运营管理员登录</h2>
              <p className="text-gray-500 text-sm mt-2">请输入您的账号密码登录系统</p>
            </div>

            {loggedInUser && roleMeta ? (
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full ${roleMeta.bg} flex items-center justify-center mx-auto mb-4`}>
                  <RoleIcon size={40} className={roleMeta.color} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{loggedInUser.name}</h3>
                <p className={`text-sm mt-1 ${roleMeta.color}`}>{roleMeta.label}</p>
                {loggedInUser.district && (
                  <p className="text-sm text-gray-500 mt-1">管辖区域：{loggedInUser.district}</p>
                )}
                <div className="mt-4 bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm">
                  ✓ 身份认证通过，正在进入工作台...
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setError(''); }}
                      placeholder="请输入用户名"
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                        errorCode === 'USER_NOT_FOUND' ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      placeholder="请输入密码"
                      className={`w-full pl-12 pr-12 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                        errorCode === 'WRONG_PASSWORD' ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-primary-400 focus:ring-primary-100'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className={`px-4 py-3 rounded-xl text-sm ${
                    errorCode === 'NETWORK_ERROR' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    errorCode === 'ACCOUNT_LOCKED' ? 'bg-red-50 text-red-700 border border-red-200' :
                    errorCode === 'NO_PERMISSION' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    errorCode === 'REDIRECT_FAILED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                    'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    <div className="flex items-start">
                      <ShieldAlert size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{error}</div>
                        {errorCode === 'USER_NOT_FOUND' && (
                          <div className="mt-1 text-xs text-red-500">请检查用户名是否正确，或点击下方测试账号一键填入</div>
                        )}
                        {errorCode === 'WRONG_PASSWORD' && (
                          <div className="mt-1 text-xs text-red-500">请确认密码输入无误，注意区分大小写；连续错误5次将锁定账号30分钟</div>
                        )}
                        {errorCode === 'NETWORK_ERROR' && (
                          <div className="mt-1 text-xs text-amber-600">无法连接到认证服务（端口59228），请确认后端服务已启动</div>
                        )}
                        {errorCode === 'ACCOUNT_LOCKED' && (
                          <div className="mt-1 text-xs text-red-500">账号因多次登录失败已被临时锁定，请30分钟后重试或联系管理员解锁</div>
                        )}
                        {errorCode === 'NO_PERMISSION' && (
                          <div className="mt-1 text-xs text-orange-600">账号认证通过，但未分配任何工作台权限，请联系系统管理员开通</div>
                        )}
                        {errorCode === 'REDIRECT_FAILED' && (
                          <div className="mt-1 text-xs text-indigo-600">角色首页跳转异常，请手动刷新或点击左上角重新进入</div>
                        )}
                        {errorCode === 'EMPTY_FIELDS' && (
                          <div className="mt-1 text-xs text-red-500">请同时填写用户名与密码</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center text-gray-600">
                    <input type="checkbox" className="mr-2 rounded border-gray-300 text-primary-500 focus:ring-primary-400" />
                    记住登录状态
                  </label>
                  <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">忘记密码?</a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all shadow-float hover:shadow-popup disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                      登录中...
                    </span>
                  ) : (
                    '登 录'
                  )}
                </button>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400 mb-3 text-center">测试账号（点击快速填入）</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TEST_ACCOUNTS.map((acc) => {
                      const meta = ROLE_META[acc.role];
                      const AccIcon = meta.icon;
                      return (
                        <button
                          key={acc.username}
                          type="button"
                          onClick={() => fillAccount(acc.username, acc.password)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left"
                        >
                          <AccIcon size={14} className={meta.color} />
                          <div>
                            <div className="text-xs font-medium text-gray-700">{acc.username}</div>
                            <div className="text-[10px] text-gray-400">{acc.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
