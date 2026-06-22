import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Shield, Smartphone, ArrowRight, Zap, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const getHomeRoute = (r: UserRole) => {
    if (r === 'enterprise') return '/enterprise/jobs';
    if (r === 'applicant') return '/applicant/home';
    if (r === 'admin') return '/admin/dashboard';
    return '/login';
  };

  const handleQuickLogin = (selectedRole: UserRole) => {
    const names = {
      enterprise: '云南云智科技HR',
      applicant: '求职者小李',
      admin: '系统管理员',
    };
    login(selectedRole, '13800001111', names[selectedRole]);
    navigate(getHomeRoute(selectedRole), { replace: true });
  };

  const handleSendCode = () => {
    if (!phone || phone.length !== 11) return;
    setCountdown(60);
    setCode('888888');
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) clearInterval(timer);
        return c - 1;
      });
    }, 1000);
  };

  const handleLogin = () => {
    if (!phone || !code || !selectedRole) return;
    const names = {
      enterprise: '云南云智科技HR',
      applicant: '求职者小李',
      admin: '系统管理员',
    };
    login(selectedRole, phone, names[selectedRole]);
    navigate(getHomeRoute(selectedRole), { replace: true });
  };

  const roles: { value: UserRole; icon: typeof Building2; label: string; desc: string; accent: string }[] = [
    { value: 'enterprise', icon: Building2, label: '企业HR', desc: '发布职位、管理招聘、查看简历匹配', accent: 'spruce' },
    { value: 'applicant', icon: User, label: '求职者', desc: '查找职位、投递简历、查看面试安排', accent: 'terracotta' },
    { value: 'admin', icon: Shield, label: '管理员', desc: '平台管理、风控审核、数据看板', accent: 'sand' },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-terracotta-50 via-white to-spruce-50">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-terracotta-500/90 to-spruce-600/90">
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
            <path d="M0 400 Q200 300 400 350 T800 300 L800 600 L0 600 Z" fill="white" />
            <path d="M0 450 Q150 380 300 420 T600 400 T800 380 L800 600 L0 600 Z" fill="white" opacity="0.6" />
            <path d="M0 500 Q200 440 400 480 T800 460 L800 600 L0 600 Z" fill="white" opacity="0.3" />
            <circle cx="650" cy="150" r="80" fill="white" opacity="0.1" />
            <circle cx="120" cy="200" r="40" fill="white" opacity="0.15" />
          </svg>
        </div>
        <div className="relative z-10 p-16 flex flex-col justify-center text-white">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-3xl font-serif font-bold">云</span>
            </div>
            <div>
              <h1 className="font-serif text-4xl font-bold">云聘·云南</h1>
              <p className="text-white/80 mt-1">区域化B2B智慧招聘平台</p>
            </div>
          </div>
          <h2 className="font-serif text-5xl font-bold leading-tight mb-6">
            连接云南企业<br />
            与优质人才
          </h2>
          <p className="text-white/70 text-lg max-w-md leading-relaxed">
            专为云南区域打造的招聘管理系统，从企业认证、智能匹配到面试闭环，
            构建安全、高效、可信赖的区域人才生态。
          </p>
          <div className="mt-16 grid grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold">12,800+</div>
              <div className="text-white/60 text-sm mt-1">入驻企业</div>
            </div>
            <div>
              <div className="text-3xl font-bold">56,200+</div>
              <div className="text-white/60 text-sm mt-1">求职人才</div>
            </div>
            <div>
              <div className="text-3xl font-bold">98.5%</div>
              <div className="text-white/60 text-sm mt-1">认证通过率</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md animate-slide-up">
          <h2 className="font-serif text-3xl font-bold text-ash-700 mb-2">欢迎登录</h2>
          <p className="text-ash-400 mb-8">选择身份，一键进入工作台（演示模式）</p>

          <div className="space-y-3 mb-6">
            {roles.map((r) => {
              const Icon = r.icon;
              const accentClasses = {
                spruce: 'border-spruce-200 bg-spruce-50/50 hover:bg-spruce-50 hover:border-spruce-300 group-hover:border-spruce-400',
                terracotta: 'border-terracotta-200 bg-terracotta-50/50 hover:bg-terracotta-50 hover:border-terracotta-300 group-hover:border-terracotta-400',
                sand: 'border-sand-200 bg-sand-50/50 hover:bg-sand-50 hover:border-sand-300 group-hover:border-sand-400',
              }[r.accent];
              const iconClasses = {
                spruce: 'text-spruce-600 group-hover:text-spruce-700',
                terracotta: 'text-terracotta-600 group-hover:text-terracotta-700',
                sand: 'text-sand-600 group-hover:text-sand-700',
              }[r.accent];
              const labelClasses = {
                spruce: 'text-spruce-700',
                terracotta: 'text-terracotta-700',
                sand: 'text-sand-700',
              }[r.accent];

              return (
                <button
                  key={r.value}
                  onClick={() => handleQuickLogin(r.value)}
                  className={`group w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${accentClasses}`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm ${iconClasses}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${labelClasses}`}>{r.label}</p>
                    <p className="text-xs text-ash-500 mt-0.5">{r.desc}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-white shadow-sm ${labelClasses}`}>
                      <Zap size={10} />
                      一键进入
                    </span>
                    <ArrowRight size={16} className={`opacity-0 group-hover:opacity-100 -mr-2 transition-all ${labelClasses}`} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ash-100"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gradient-to-br from-terracotta-50 via-white to-spruce-50 px-4 text-xs text-ash-400">
                或使用手机号验证码登录
              </span>
            </div>
          </div>

          {showManual ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ash-600 mb-3">选择身份</label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const active = selectedRole === r.value;
                    return (
                      <button
                        key={r.value}
                        onClick={() => setSelectedRole(r.value)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          active
                            ? 'border-terracotta-500 bg-terracotta-50'
                            : 'border-ash-100 hover:border-ash-200'
                        }`}
                      >
                        <Icon
                          size={20}
                          className={`mx-auto ${active ? 'text-terracotta-500' : 'text-ash-400'}`}
                        />
                        <div className={`text-xs font-medium mt-1.5 ${active ? 'text-terracotta-600' : 'text-ash-600'}`}>
                          {r.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ash-600 mb-2">手机号</label>
                <div className="relative">
                  <Smartphone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ash-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="请输入11位手机号"
                    className="input-field pl-11"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ash-600 mb-2">验证码</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="请输入6位验证码"
                    className="input-field flex-1"
                  />
                  <button
                    onClick={handleSendCode}
                    disabled={countdown > 0 || phone.length !== 11}
                    className="btn-secondary whitespace-nowrap disabled:opacity-50"
                  >
                    {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                  </button>
                </div>
                {countdown > 0 && (
                  <p className="text-xs text-spruce-600 mt-1.5 flex items-center gap-1">
                    <Check size={12} />
                    验证码已发送（演示验证码：888888，已自动填入）
                  </p>
                )}
              </div>

              <button
                onClick={handleLogin}
                disabled={!selectedRole || phone.length !== 11 || code.length !== 6}
                className="w-full btn-primary mt-2 py-3 text-base flex items-center justify-center gap-2 disabled:opacity-50"
              >
                登录
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => setShowManual(false)}
                className="w-full text-center text-sm text-ash-400 hover:text-ash-600 py-2"
              >
                返回快捷登录
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowManual(true)}
              className="w-full text-center text-sm text-ash-400 hover:text-ash-600 py-2"
            >
              使用手机号验证码登录 →
            </button>
          )}

          <p className="text-center text-xs text-ash-400 mt-6">
            登录即表示您同意《用户服务协议》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  );
}
