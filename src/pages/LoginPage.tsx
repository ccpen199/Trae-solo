import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, Loader2, User, Lock, ChevronRight } from "lucide-react";
import { useStore } from "@/store";

const demoAccounts = [
  { username: "province_admin", password: "admin123", label: "省级管理员", desc: "全省数据总览与审批" },
  { username: "city_admin_xx", password: "admin123", label: "市级管理员", desc: "本市运营与管理" },
  { username: "base_admin", password: "admin123", label: "基层管理员", desc: "本单位会员管理" },
  { username: "member", password: "member123", label: "普通会员", desc: "福利领取与查询" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("请输入用户名和密码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login({ username: username.trim(), password });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "登录失败，请检查用户名和密码");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account: (typeof demoAccounts)[number]) => {
    setUsername(account.username);
    setPassword(account.password);
    setLoading(true);
    setError("");
    try {
      await login({ username: account.username, password: account.password });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-union-red to-union-red-dark flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.1) 40px, rgba(255,255,255,0.1) 80px)`,
          }}
        />
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/5 rounded-full" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute top-1/3 right-10 w-40 h-40 bg-white/5 rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-white px-12">
          <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 shadow-lg">
            <Shield size={42} className="text-white" />
          </div>
          <h1 className="text-4xl font-serif font-bold mb-4 tracking-wide">职工普惠服务平台</h1>
          <p className="text-lg text-white/70 mb-12 tracking-widest">服务工会 · 惠及职工</p>
          <div className="flex gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
              <p className="text-2xl font-bold font-serif">12万+</p>
              <p className="text-sm text-white/60 mt-1">服务职工</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
              <p className="text-2xl font-bold font-serif">98%</p>
              <p className="text-sm text-white/60 mt-1">满意度</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4">
              <p className="text-2xl font-bold font-serif">50+</p>
              <p className="text-sm text-white/60 mt-1">服务项目</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-union-red rounded-xl flex items-center justify-center">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 font-serif">职工普惠</h1>
              <p className="text-xs text-gray-500">服务平台</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">欢迎登录</h2>
            <p className="text-sm text-gray-500 mb-6">请输入您的账号信息</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="input-field pl-9"
                    autoComplete="username"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="input-field pl-9 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 h-11 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    登录中...
                  </>
                ) : (
                  "登录"
                )}
              </button>
            </form>
          </div>

          <div className="mt-6">
            <p className="text-xs text-gray-400 mb-3 text-center">演示账号 · 点击快速登录</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.username}
                  onClick={() => handleDemoLogin(account)}
                  disabled={loading}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:border-union-red/20 hover:bg-union-red/5 transition-all duration-200 text-left group disabled:opacity-50"
                >
                  <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-union-red/10 transition-colors">
                    <Shield size={13} className="text-gray-400 group-hover:text-union-red transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700 group-hover:text-union-red transition-colors truncate">
                      {account.label}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{account.desc}</p>
                  </div>
                  <ChevronRight size={12} className="text-gray-300 shrink-0 ml-auto group-hover:text-union-red transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
