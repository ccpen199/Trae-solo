import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserCircle2,
  Building2,
  ArrowRight,
  ChevronLeft,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore, UserRole } from '@/store/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

type RegisterRole = Exclude<UserRole, 'admin' | 'officer'>;
type Step = 1 | 2 | 3;

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') as RegisterRole) || 'student';
  const { login } = useAuthStore();

  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<RegisterRole>(initialRole);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的11位手机号');
      return;
    }
    setError('');
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const validateStep1 = () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的11位手机号');
      return false;
    }
    if (!code || code.length !== 6) {
      setError('请输入6位验证码');
      return false;
    }
    setError('');
    setStep(2);
    return true;
  };

  const validateStep2 = () => {
    if (!password || password.length < 8) {
      setError('密码至少8位，建议包含字母和数字');
      return false;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }
    setError('');
    setStep(3);
    return true;
  };

  const completeRegister = async () => {
    if (!nickname.trim()) {
      setError(role === 'student' ? '请输入昵称' : '请输入企业简称');
      return;
    }
    setError('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1000));

    login('mock-jwt-token-' + Date.now(), {
      id: role === 'student' ? 2 : 3,
      role,
      phone,
      nickname: nickname.trim(),
      createdAt: new Date().toISOString(),
    });

    setLoading(false);
    navigate(role === 'student' ? '/student/profile' : '/enterprise/qualification');
  };

  const stepLabels = ['身份选择', '手机验证', '设置密码', '完善信息'];
  const displayStep = step === 1 ? 0 : step === 2 ? 1 : 2;

  return (
    <div className="w-full max-w-md mx-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-float transition-transform group-hover:scale-105">
            <span className="text-white font-bold text-2xl font-num">Z</span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">
          创建你的<span className="bg-text-gradient ml-1.5">展翅账号</span>
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          仅需 4 步，开启你的实习赋能之旅
        </p>
      </div>

      <div className="relative bg-white rounded-3xl shadow-card border border-white/80 p-7 md:p-8 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 w-56 h-56 rounded-full bg-brand-200/30 blur-3xl" />

        <div className="relative">
          <div className="flex items-center justify-between mb-7">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      i < displayStep + 1
                        ? 'bg-brand-gradient text-white shadow-float'
                        : 'bg-cream-100 text-ink-400'
                    }`}
                  >
                    {i < displayStep ? <Check size={14} /> : i + 1}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 whitespace-nowrap ${
                      i < displayStep + 1 ? 'text-brand-600 font-medium' : 'text-ink-400'
                    }`}
                  >
                    {stepLabels[i]}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    className={`h-0.5 flex-1 mx-1.5 mt-[-20px] transition-all ${
                      i < displayStep ? 'bg-brand-400' : 'bg-ink-100'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="flex flex-col gap-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                    role === 'student'
                      ? 'border-brand-400 bg-brand-50/60 shadow-soft'
                      : 'border-ink-100 hover:border-ink-200 bg-white'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      role === 'student' ? 'bg-brand-gradient text-white' : 'bg-ink-50 text-ink-500'
                    }`}
                  >
                    <UserCircle2 size={26} />
                  </div>
                  <div className="text-sm font-semibold text-ink-800">我是学生</div>
                  <div className="text-[11px] text-ink-400 text-center leading-relaxed">
                    找岗位 · 建档案 · 用工具
                  </div>
                  {role === 'student' && (
                    <Badge variant="brand" size="xs" className="absolute top-2 right-2">
                      推荐
                    </Badge>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRole('enterprise')}
                  className={`relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all ${
                    role === 'enterprise'
                      ? 'border-teal-400 bg-teal-50/60 shadow-soft'
                      : 'border-ink-100 hover:border-ink-200 bg-white'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      role === 'enterprise'
                        ? 'bg-teal-gradient text-white'
                        : 'bg-ink-50 text-ink-500'
                    }`}
                  >
                    <Building2 size={26} />
                  </div>
                  <div className="text-sm font-semibold text-ink-800">我是企业</div>
                  <div className="text-[11px] text-ink-400 text-center leading-relaxed">
                    发岗位 · 收简历 · 招人才
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-cream-100/70 border border-ink-100 text-xs text-ink-500">
                <ShieldCheck size={15} className="text-teal-500 shrink-0" />
                <span>
                  平台已对接<span className="text-ink-700 font-medium mx-1">学信网学籍核验</span>
                  与<span className="text-ink-700 font-medium mx-1">企业工商信息</span>，保障数据真实
                </span>
              </div>

              {error && (
                <div className="text-xs text-danger-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <Button size="lg" onClick={validateStep1} className="w-full mt-1">
                下一步
                <ArrowRight size={16} />
              </Button>
            </div>
          )}

          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                validateStep1();
              }}
              className="flex flex-col gap-4 animate-fade-in"
            >
              <div className="flex items-center gap-2 text-sm text-ink-600 mb-1">
                <Badge variant={role === 'student' ? 'brand' : 'verified'} size="xs">
                  {role === 'student' ? '学生注册' : '企业注册'}
                </Badge>
                <span className="text-ink-400 text-xs">第 2 步：手机验证</span>
              </div>

              <Input
                label="手机号"
                type="tel"
                name="phone"
                placeholder="请输入11位手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                leftIcon={<Phone size={17} strokeWidth={1.8} />}
                maxLength={11}
                error={error.includes('手机号') ? error : undefined}
              />

              <div>
                <Input
                  label="验证码"
                  type="text"
                  name="code"
                  placeholder="请输入6位验证码"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  maxLength={6}
                  error={error.includes('验证码') ? error : undefined}
                  rightIcon={
                    <button
                      type="button"
                      onClick={sendCode}
                      disabled={countdown > 0}
                      className={`text-sm font-medium whitespace-nowrap pr-1 ${
                        countdown > 0
                          ? 'text-ink-300 cursor-not-allowed'
                          : 'text-brand-600 hover:text-brand-700'
                      }`}
                    >
                      {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                    </button>
                  }
                />
              </div>

              {error && !error.includes('手机号') && !error.includes('验证码') && (
                <div className="text-xs text-danger-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ChevronLeft size={16} />
                  上一步
                </Button>
                <Button type="submit" size="lg" className="flex-1">
                  下一步
                  <ArrowRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (validateStep2()) {
                  const nextStep = 3;
                  if (nextStep) setStep(3 as Step);
                }
              }}
              className="flex flex-col gap-4 animate-fade-in"
            >
              <div className="text-xs text-ink-400 mb-1">第 3 步：设置密码</div>

              <Input
                label="设置密码"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="至少8位，建议字母+数字"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={17} strokeWidth={1.8} />}
                rightIcon={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-ink-400 hover:text-ink-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff size={17} strokeWidth={1.8} />
                    ) : (
                      <Eye size={17} strokeWidth={1.8} />
                    )}
                  </button>
                }
                error={error.includes('密码') && !error.includes('一致') ? error : undefined}
              />

              <Input
                label="确认密码"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock size={17} strokeWidth={1.8} />}
                error={error.includes('一致') ? error : undefined}
              />

              {error && !error.includes('密码') && !error.includes('一致') && !error.includes('昵称') && !error.includes('简称') && (
                <div className="text-xs text-danger-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(2)}
                  className="flex-1"
                >
                  <ChevronLeft size={16} />
                  上一步
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="flex-1"
                  onClick={validateStep2}
                >
                  下一步
                  <ArrowRight size={16} />
                </Button>
              </div>
            </form>
          )}

          {step === 3 && error && (error.includes('昵称') || error.includes('简称')) && null}

          {step === 3 && !error.includes('密码') && !error.includes('一致') && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                completeRegister();
              }}
              className="flex flex-col gap-4 animate-fade-in mt-6 pt-6 border-t border-dashed border-ink-100"
            >
              <div className="text-xs text-ink-400 mb-1">第 4 步：完善信息</div>

              <Input
                label={role === 'student' ? '昵称（选填）' : '企业简称'}
                type="text"
                name="nickname"
                placeholder={role === 'student' ? '给你自己起个昵称吧' : '请输入企业对外展示简称'}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                leftIcon={<UserCircle2 size={17} strokeWidth={1.8} />}
              />

              <label className="flex items-start gap-2 text-xs text-ink-500 cursor-pointer select-none leading-relaxed">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 w-3.5 h-3.5 rounded border-ink-200 text-brand-500 focus:ring-brand-400 shrink-0"
                />
                <span>
                  我已阅读并同意
                  <Link to="/legal/terms" className="text-brand-600 mx-1 hover:underline">
                    《服务协议》
                  </Link>
                  和
                  <Link to="/legal/privacy" className="text-brand-600 mx-1 hover:underline">
                    《隐私政策》
                  </Link>
                </span>
              </label>

              <div className="text-xs text-danger-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 hidden" id="final-error">
                {(error.includes('昵称') || error.includes('简称')) && error}
              </div>

              <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
                {role === 'student' ? '创建学生账号' : '创建企业账号'}
                <Check size={16} />
              </Button>
            </form>
          )}

          <div className="mt-7 text-center text-sm text-ink-500">
            已有账号？
            <Link
              to={`/login${role === 'enterprise' ? '?role=enterprise' : ''}`}
              className="text-brand-600 font-semibold hover:text-brand-700 ml-1 link-underline"
            >
              去登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
