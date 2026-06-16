import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PawPrint,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  Building2,
  Store,
  Settings2,
  BarChart3,
  Cpu,
  UserX,
  Clock,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import type { UserRole } from '@shared/types';

const DEMO_ACCOUNTS: Array<{
  phone: string;
  password: string;
  nickname: string;
  role: UserRole;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge: string;
}> = [
  { phone: 'admin', password: '123456', nickname: '超级管理员', role: 'admin', desc: '全局权限 · 审计复查 · 资质审核', icon: ShieldCheck, color: 'from-purple-500 to-indigo-600', badge: 'ADMIN' },
  { phone: 'platform', password: '123456', nickname: '平台运营主管', role: 'platform', desc: '商家入驻 · 反作弊监控 · 运营报表', icon: BarChart3, color: 'from-sky-500 to-cyan-600', badge: '平台' },
  { phone: 'ops', password: '123456', nickname: '运维工程师', role: 'ops', desc: '系统运维 · 服务监控 · 基础设施', icon: Cpu, color: 'from-slate-500 to-zinc-700', badge: '运维' },
  { phone: '13800000001', password: '123456', nickname: '张小明', role: 'owner', desc: '多宠档案 · 在线问诊 · 商城购物', icon: UserCheck, color: 'from-forest-500 to-emerald-600', badge: '宠主' },
  { phone: '13900000001', password: '123456', nickname: '王建国', role: 'doctor', desc: '图文问诊 · 电子病历 · 处方开具', icon: Stethoscope, color: 'from-blue-500 to-sky-600', badge: '医生' },
  { phone: '13700000001', password: '123456', nickname: '爱宠宠物医院', role: 'hospital', desc: '服务定价 · 医生排班 · 评价管理', icon: Building2, color: 'from-orange-500 to-amber-600', badge: '医院' },
  { phone: '13600000001', password: '123456', nickname: '宠物优选商城', role: 'merchant', desc: 'SKU上架 · 合规备案 · 订单履约', icon: Store, color: 'from-rose-500 to-pink-600', badge: '商家' },
];

const ERROR_SAMPLES: Array<{
  phone: string;
  password: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { phone: '13900000009', password: '123456', label: '资质待审', hint: '医生执业资质审核中', icon: Clock },
  { phone: '13500000001', password: '123456', label: '账号禁用', hint: '账号已被管理员禁用', icon: UserX },
  { phone: '13500000002', password: '123456', label: '资质待审', hint: '商家资质备案审核中', icon: Clock },
];

const ROLE_HOME_MAP: Record<UserRole, string> = {
  owner: '/',
  doctor: '/doctor/dashboard',
  hospital: '/hospital/dashboard',
  merchant: '/merchant/dashboard',
  admin: '/admin/dashboard',
  platform: '/platform/dashboard',
  ops: '/ops/dashboard',
};

function resolveErrorCodeToSuggestion(code: string): { icon: string; tip: string } {
  switch (code) {
    case 'ACCOUNT_NOT_FOUND':
      return { icon: '❓', tip: '可通过"立即注册"开通新账号，或使用下方演示账号快速体验。' };
    case 'WRONG_PASSWORD':
      return { icon: '🔐', tip: '请确认密码是否正确（演示账号密码均为 123456），或联系客服找回密码。' };
    case 'ACCOUNT_DISABLED':
      return { icon: '🚫', tip: '您的账号当前状态异常，请通过 admin 管理员账号进入后台申诉恢复。' };
    case 'LICENSE_PENDING':
      return { icon: '⏳', tip: '平台将在 1-2 个工作日完成审核，请耐心等待。可用正常演示账号继续操作。' };
    case 'EMPTY_FIELDS':
      return { icon: '📝', tip: '请完整填写手机号和密码后再提交。' };
    default:
      return { icon: 'ℹ️', tip: '请稍后重试，如持续出现请联系技术支持。' };
  }
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'demo' | 'error'>('demo');

  const quickFill = (p: string, pw: string) => {
    setPhone(p);
    setPassword(pw);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { user, token } = await api.auth.login(phone, password);
      login(user, token);
      navigate(ROLE_HOME_MAP[user.role] || '/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败';
      const code = (err as any)?.errorCode as string | undefined;
      setError({ message, code });
    } finally {
      setLoading(false);
    }
  };

  const errorMeta = error?.code ? resolveErrorCodeToSuggestion(error.code) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8 bg-gradient-to-br from-cream-50 via-white to-forest-50">
      <div className="w-full max-w-4xl">
        <div className="grid md:grid-cols-5 gap-8 items-start">
          {/* 左侧：品牌介绍 */}
          <div className="md:col-span-2 space-y-6 md:sticky md:top-8">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center shadow-soft">
                <PawPrint className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl text-gray-900">宠生园 PetLife</h1>
                <p className="text-sm text-gray-500">宠物全生命周期 SaaS 平台</p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="font-display font-bold text-xl text-gray-800">全角色业务验收门户</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-forest-600">✓</span>宠主档案 / 在线问诊 / 处方流转闭环</li>
                <li className="flex gap-2"><span className="text-forest-600">✓</span>医院服务定价 / 评价反作弊 / 医生排班</li>
                <li className="flex gap-2"><span className="text-forest-600">✓</span>商城处方药双签 / 专属类目搜索</li>
                <li className="flex gap-2"><span className="text-forest-600">✓</span>社区寻宠公益 / LBS扩散 / 领养分级</li>
                <li className="flex gap-2"><span className="text-forest-600">✓</span>健康日历引擎 / 疫苗驱虫体检提醒</li>
              </ul>
            </div>

            <div className="card !p-4 bg-gradient-to-br from-forest-50 to-cream-50">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="w-4 h-4 text-forest-600" />
                <span className="text-sm font-semibold text-gray-700">演示账号密码统一为 <code className="px-1.5 py-0.5 rounded bg-white text-forest-700 font-mono">123456</code></span>
              </div>
              <p className="text-xs text-gray-500">点击右侧账号卡片可自动填充登录表单。</p>
            </div>
          </div>

          {/* 右侧：登录表单 + 演示账号 */}
          <div className="md:col-span-3 space-y-5">
            {/* 登录表单卡片 */}
            <div className="card">
              <div className="mb-5">
                <h2 className="font-display font-bold text-2xl text-gray-900">欢迎回来</h2>
                <p className="text-gray-500 mt-1 text-sm">登录你的萌宠健康账户，承接对应角色工作台</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label-text">手机号 / 账号标识</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="手机号 或 admin / platform / ops"
                      className="input-field pl-12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label-text">密码</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="input-field pl-12 pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-100 space-y-2 animate-in">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-red-700 font-semibold text-sm flex items-center gap-2">
                          {errorMeta?.icon} <span>{error.message}</span>
                          {error.code && (
                            <span className="ml-auto text-[10px] font-mono bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">
                              {error.code}
                            </span>
                          )}
                        </div>
                        {errorMeta && (
                          <p className="text-red-600/80 text-xs mt-1 leading-relaxed">{errorMeta.tip}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full !py-3 text-base gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      正在验证身份并承接工作台...
                    </>
                  ) : (
                    <>登录并进入工作台</>
                  )}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-gray-100 text-center text-sm">
                <span className="text-gray-500">还没有账户？</span>
                <Link to="/register" className="text-forest-600 font-medium hover:text-forest-700 ml-1">
                  立即注册
                </Link>
              </div>
            </div>

            {/* Tab切换：演示账号 / 错误用例 */}
            <div className="flex gap-2 px-1">
              <button
                onClick={() => setActiveTab('demo')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'demo'
                    ? 'bg-forest-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                ✨ 正常演示账号 (7类)
              </button>
              <button
                onClick={() => setActiveTab('error')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'error'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                🧪 异常错误用例 (3类)
              </button>
            </div>

            {/* 演示账号卡片 */}
            {activeTab === 'demo' && (
              <div className="grid sm:grid-cols-2 gap-3">
                {DEMO_ACCOUNTS.map((acc) => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.phone}
                      type="button"
                      onClick={() => quickFill(acc.phone, acc.password)}
                      className={`group relative text-left p-4 rounded-2xl bg-gradient-to-br ${acc.color} text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden`}
                    >
                      <span className="absolute top-2 right-3 text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {acc.badge}
                      </span>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{acc.nickname}</div>
                          <div className="text-[11px] text-white/80 font-mono">{acc.phone}</div>
                        </div>
                      </div>
                      <p className="text-xs text-white/90 leading-relaxed">{acc.desc}</p>
                      <div className="mt-3 text-[11px] text-white/70 group-hover:text-white transition-colors flex items-center gap-1">
                        <span>👉</span> 点击快速填充表单
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 错误用例卡片 */}
            {activeTab === 'error' && (
              <div className="grid sm:grid-cols-3 gap-3">
                {ERROR_SAMPLES.map((sample) => {
                  const Icon = sample.icon;
                  return (
                    <button
                      key={sample.phone}
                      type="button"
                      onClick={() => quickFill(sample.phone, sample.password)}
                      className="text-left p-4 rounded-2xl bg-white border-2 border-dashed border-rose-200 hover:border-rose-400 hover:bg-rose-50/50 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-rose-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-rose-700">{sample.label}</div>
                          <div className="text-[10px] text-rose-500 font-mono">{sample.phone}</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-rose-600 leading-relaxed">{sample.hint}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 角色跳转路径说明 */}
            <div className="card !p-4 bg-gray-50/60">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">🔀 身份承接路径</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                {Object.entries(ROLE_HOME_MAP).map(([role, path]) => (
                  <div key={role} className="px-2 py-1.5 rounded-lg bg-white border border-gray-100">
                    <span className="font-mono text-gray-800">{role}</span>
                    <span className="text-gray-400 mx-1">→</span>
                    <span className="text-forest-600 font-mono truncate">{path}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
