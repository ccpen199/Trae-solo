import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Phone, Lock, Eye, EyeOff, UserCircle2, Building2, ArrowRight } from 'lucide-react';
import { useAuthStore, UserRole } from '@/store/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import request from '@/lib/axios';

type LoginRole = Exclude<UserRole, 'admin' | 'officer'>;

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const { login } = useAuthStore();

  const [role, setRole] = useState<LoginRole>('student');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || phone.length !== 11) {
      setError('请输入正确的11位手机号');
      return;
    }
    if (!password || password.length < 6) {
      setError('密码长度至少6位');
      return;
    }

    setLoading(true);

    try {
      const response = await request.post('/auth/login', { phone, password, role }) as {
        success: boolean;
        data: {
          token: string;
          user: {
            id: number;
            role: UserRole;
            phone?: string;
            username?: string;
            avatar?: string;
            created_at?: string;
          };
        };
      };

      const { token, user } = response.data;
      login(token, {
        id: user.id,
        role: user.role,
        phone: user.phone || phone,
        nickname: user.username,
        avatar: user.avatar,
        createdAt: user.created_at || new Date().toISOString(),
      });

      navigate(redirect || (role === 'student' ? '/' : '/enterprise/dashboard'));
    } catch (err: any) {
      setError(err?.response?.data?.error || '登录失败，请检查手机号和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (nextRole: LoginRole) => {
    const demoPhone = nextRole === 'student' ? '13910000000' : '13800001000';
    const demoPassword = nextRole === 'student' ? 'student123' : 'enterprise123';
    setRole(nextRole);
    setPhone(demoPhone);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    try {
      const response = await request.post('/auth/login', {
        phone: demoPhone,
        password: demoPassword,
        role: nextRole,
      }) as {
        success: boolean;
        data: {
          token: string;
          user: {
            id: number;
            role: UserRole;
            phone?: string;
            username?: string;
            avatar?: string;
            created_at?: string;
          };
        };
      };

      const { token, user } = response.data;
      login(token, {
        id: user.id,
        role: user.role,
        phone: user.phone || demoPhone,
        nickname: user.username,
        avatar: user.avatar,
        createdAt: user.created_at || new Date().toISOString(),
      });
      navigate(redirect || (nextRole === 'student' ? '/' : '/enterprise/dashboard'));
    } catch (err: any) {
      setError(err?.response?.data?.error || '演示登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-float transition-transform group-hover:scale-105">
            <span className="text-white font-bold text-2xl font-num">Z</span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">
          欢迎回到<span className="bg-text-gradient ml-1.5">展翅实习</span>
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          大专生实习就业一站式赋能平台，靠谱岗位一站直达
        </p>
      </div>

      <div className="relative bg-white rounded-3xl shadow-card border border-white/80 p-7 md:p-8 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 w-56 h-56 rounded-full bg-teal-200/30 blur-3xl" />

        <div className="relative">
          <div className="grid grid-cols-2 gap-2 p-1 bg-cream-100 rounded-xl2 mb-7">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-medium transition-all ${
                role === 'student'
                  ? 'bg-white text-brand-600 shadow-soft'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <UserCircle2 size={16} />
              我是学生
            </button>
            <button
              type="button"
              onClick={() => setRole('enterprise')}
              className={`flex items-center justify-center gap-1.5 h-10 rounded-xl text-sm font-medium transition-all ${
                role === 'enterprise'
                  ? 'bg-white text-teal-600 shadow-soft'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <Building2 size={16} />
              我是企业
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            <Input
              label="密码"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="请输入登录密码"
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
              error={error.includes('密码') ? error : undefined}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-ink-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-3.5 h-3.5 rounded border-ink-200 text-brand-500 focus:ring-brand-400"
                />
                7天内自动登录
              </label>
              <a
                href="#"
                className="text-brand-600 hover:text-brand-700 font-medium link-underline"
              >
                忘记密码？
              </a>
            </div>

            {error && !error.includes('手机号') && !error.includes('密码') && (
              <div className="text-xs text-danger-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
              {role === 'student' ? '学生登录' : '企业登录'}
              <ArrowRight size={16} />
            </Button>

            <div className="flex items-center justify-center gap-3 my-2">
              <div className="h-px flex-1 bg-ink-100" />
              <span className="text-xs text-ink-400">其他方式</span>
              <div className="h-px flex-1 bg-ink-100" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('student')}
                className="w-full"
              >
                学生演示账号
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('enterprise')}
                className="w-full"
              >
                企业演示账号
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-ink-500">
              <Badge variant="verified" size="xs" dot>
                学籍对接学信网
              </Badge>
              <Badge variant="senior" size="xs">
                企业资质审核
              </Badge>
            </div>
          </form>

          <div className="mt-7 text-center text-sm text-ink-500">
            还没有账号？
            <Link
              to={`/register${role === 'enterprise' ? '?role=enterprise' : ''}`}
              className="text-brand-600 font-semibold hover:text-brand-700 ml-1 link-underline"
            >
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
