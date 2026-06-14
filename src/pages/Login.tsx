import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase,
  User,
  Building2,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';
import type { UserRole } from '../../../shared/types';

type TabType = 'student' | 'company' | 'admin';
type ModeType = 'login' | 'register';

interface FormData {
  studentId: string;
  name: string;
  school: string;
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  contactName: string;
  contactPhone: string;
}

const tabs: { key: TabType; label: string; icon: typeof User }[] = [
  { key: 'student', label: '学生', icon: User },
  { key: 'company', label: '企业', icon: Building2 },
  { key: 'admin', label: '管理员', icon: Shield },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('student');
  const [mode, setMode] = useState<ModeType>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    studentId: '',
    name: '',
    school: '',
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    contactName: '',
    contactPhone: '',
  });

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  const handleInputChange = (field: keyof FormData, value: string) => {
    setError('');
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    let endpoint = '';
    let body: Record<string, string> = {};

    switch (activeTab) {
      case 'student':
        endpoint = '/auth/student/login';
        body = { studentId: formData.studentId, password: formData.password };
        break;
      case 'company':
        endpoint = '/auth/company/login';
        body = { email: formData.email, password: formData.password };
        break;
      case 'admin':
        endpoint = '/auth/admin/login';
        body = { username: formData.username, password: formData.password };
        break;
    }

    const res = await api.post<{ token: string; user: object }>(endpoint, body);
    login(res.token, res.user, activeTab as UserRole);
    navigate(from, { replace: true });
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      throw new Error('两次输入的密码不一致');
    }
    if (formData.password.length < 6) {
      throw new Error('密码长度不能少于6位');
    }

    let endpoint = '';
    let body: Record<string, string> = {};

    switch (activeTab) {
      case 'student':
        if (!formData.studentId || !formData.name || !formData.school) {
          throw new Error('请填写完整信息');
        }
        endpoint = '/auth/student/register';
        body = {
          studentId: formData.studentId,
          name: formData.name,
          school: formData.school,
          password: formData.password,
        };
        break;
      case 'company':
        if (!formData.email || !formData.name || !formData.contactName || !formData.contactPhone) {
          throw new Error('请填写完整信息');
        }
        endpoint = '/auth/company/register';
        body = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          contactName: formData.contactName,
          contactPhone: formData.contactPhone,
        };
        break;
      case 'admin':
        throw new Error('管理员账号需由系统分配');
    }

    const res = await api.post<{ token: string; user: object }>(endpoint, body);
    login(res.token, res.user, activeTab as UserRole);
    navigate(from, { replace: true });
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accent-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-400 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Briefcase className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold">实习兼职平台</span>
          </div>

          <h1 className="text-4xl font-bold mb-4 leading-tight">
            安全可靠的
            <br />
            校园实习兼职平台
          </h1>
          <p className="text-lg text-primary-100/80 mb-12 max-w-md">
            连接优质企业与优秀学生，提供合规备案的兼职岗位，让实习更安全、更有价值
          </p>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">用工备案</h3>
                <p className="text-sm text-primary-100/70">所有岗位均经过备案，保障学生权益</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">灵活时间</h3>
                <p className="text-sm text-primary-100/70">智能匹配课表，工作学习两不误</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">薪资透明</h3>
                <p className="text-sm text-primary-100/70">按时结算，薪资有保障</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center space-x-2 text-sm text-primary-100/60">
          <Sparkles className="w-4 h-4" />
          <span>已服务 10,000+ 学生与 500+ 企业</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-card p-8 animate-fade-in-up">
            <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">实习兼职平台</span>
            </div>

            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setError('');
                    }}
                    className={cn(
                      'flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'login' ? '欢迎回来' : '创建账号'}
              </h2>
              <p className="text-gray-500 mt-1">
                {mode === 'login'
                  ? `请使用${tabs.find((t) => t.key === activeTab)?.label}账号登录`
                  : `注册${tabs.find((t) => t.key === activeTab)?.label}账号`}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'student' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      学号
                    </label>
                    <input
                      type="text"
                      value={formData.studentId}
                      onChange={(e) => handleInputChange('studentId', e.target.value)}
                      placeholder="请输入学号"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                  {mode === 'register' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          姓名
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="请输入真实姓名"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          学校
                        </label>
                        <input
                          type="text"
                          value={formData.school}
                          onChange={(e) => handleInputChange('school', e.target.value)}
                          placeholder="请输入学校名称"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === 'company' && (
                <>
                  {mode === 'register' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        企业名称
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="请输入企业名称"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      邮箱
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="请输入邮箱地址"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                  {mode === 'register' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          联系人
                        </label>
                        <input
                          type="text"
                          value={formData.contactName}
                          onChange={(e) => handleInputChange('contactName', e.target.value)}
                          placeholder="请输入联系人姓名"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          联系电话
                        </label>
                        <input
                          type="tel"
                          value={formData.contactPhone}
                          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                          placeholder="请输入联系电话"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="请输入管理员用户名"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="请输入密码"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    确认密码
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="请再次输入密码"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button type="button" className="text-sm text-primary-600 hover:text-primary-700">
                    忘记密码？
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-medium',
                  'hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  'transition-all flex items-center justify-center space-x-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'login' ? '登录' : '注册'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                {mode === 'login' ? '还没有账号？' : '已有账号？'}
                <button
                  onClick={switchMode}
                  className="text-primary-600 hover:text-primary-700 font-medium ml-1"
                >
                  {mode === 'login' ? '立即注册' : '立即登录'}
                </button>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            登录即表示同意《服务条款》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  );
}
