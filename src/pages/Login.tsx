import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  GraduationCap,
  User,
  Lock,
  Phone,
  UserPlus,
  LogIn,
  AlertCircle,
  MapPin,
  Building2,
  Users,
  FileCheck,
  ShieldAlert,
  Flame,
  Award,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { recommend } from '@/api/client';
import type { GenerateRecommendRequest, StudentProfile, AssessmentResult } from '../../shared/types';

type TabType = 'login' | 'register';
type RoleType = 'student' | 'parent' | 'teacher';
type RelationshipType = 'father' | 'mother' | 'other';

const roles: { value: RoleType; label: string; description: string; icon: typeof User }[] = [
  { value: 'student', label: '考生', description: '我是考生本人', icon: GraduationCap },
  { value: 'parent', label: '家长', description: '我是考生家长', icon: Users },
  { value: 'teacher', label: '教师', description: '我是指导老师', icon: Building2 },
];

const provinces = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东', '河南',
  '湖北', '湖南', '广东', '广西', '海南', '重庆', '四川', '贵州',
  '云南', '西藏', '陕西', '甘肃', '青海', '宁夏', '新疆',
];

const relationships: { value: RelationshipType; label: string }[] = [
  { value: 'father', label: '父亲' },
  { value: 'mother', label: '母亲' },
  { value: 'other', label: '其他' },
];

const footerLinks = [
  { icon: Award, label: '专家认证申请', path: '/expert/apply' },
  { icon: FileCheck, label: '身份审核状态查询', path: '/verify/status' },
  { icon: ShieldAlert, label: '风险复查记录', path: '/risk/review' },
  { icon: Flame, label: '区域热力分析', path: '/heatmap/public' },
];

interface QuickFillData {
  profile: Partial<StudentProfile>;
  assessment: Partial<AssessmentResult>;
  preferences: {
    universityWeight: number;
    majorWeight: number;
    cityWeight: number;
    employmentWeight: number;
    familyWishes?: string;
  };
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loading, isAuthenticated, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<RoleType>('student');
  const [province, setProvince] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType | ''>('');
  const [schoolName, setSchoolName] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatingRecommend, setGeneratingRecommend] = useState(false);

  const locationState = location.state as {
    from?: Location;
    redirectTo?: string;
    quickFillData?: QuickFillData;
  } | null;

  const from = locationState?.from?.pathname || '/';
  const redirectTo = locationState?.redirectTo;
  const quickFillData = locationState?.quickFillData;

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate(user?.role === 'admin' ? '/admin' : (redirectTo || from), { replace: true });
  }, [isAuthenticated, user?.role, navigate, redirectTo, from]);

  const getRoleHint = () => {
    switch (role) {
      case 'student':
        return '登录后可进行智能志愿填报、查看推荐结果';
      case 'parent':
        return '登录后可协助考生进行志愿规划、查看协作空间';
      case 'teacher':
        return '登录后可指导多位考生、查看教学管理功能';
      default:
        return '';
    }
  };

  const getRoleRedirectPath = () => {
    switch (role) {
      case 'student':
        return '/recommend';
      case 'parent':
        return '/collaboration';
      case 'teacher':
        return '/plans';
      default:
        return '/';
    }
  };

  const validatePhone = (value: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!value) return '请输入手机号';
    if (!phoneRegex.test(value)) return '请输入正确的手机号格式';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) return '请输入密码';
    if (value.length < 6) return '密码长度不能少于6位';
    return '';
  };

  const validateName = (value: string) => {
    if (!value) return '请输入姓名';
    if (value.length < 2) return '姓名长度不能少于2位';
    return '';
  };

  const validateProvince = (value: string) => {
    if (!value) return '请选择所在省份';
    return '';
  };

  const validateRelationship = (value: string) => {
    if (role === 'parent' && !value) return '请选择与考生的关系';
    return '';
  };

  const validateSchoolName = (value: string) => {
    if (role === 'teacher' && !value) return '请输入任教学校名称';
    if (role === 'teacher' && value.length < 2) return '学校名称不能少于2位';
    return '';
  };

  const generateQuickRecommendation = async (userId: number, data: QuickFillData) => {
    try {
      setGeneratingRecommend(true);

      const defaultAssessment: AssessmentResult = {
        id: 0,
        userId,
        holland: { R: 50, I: 50, A: 50, S: 50, E: 50, C: 50 },
        mbti: 'INTJ',
        createdAt: new Date().toISOString(),
        ...data.assessment,
      };

      const requestData: GenerateRecommendRequest = {
        profile: {
          id: 0,
          userId,
          score: data.profile.score || 0,
          rank: data.profile.rank || 0,
          province: data.profile.province || '',
          subjects: data.profile.subjects || [],
          batch: data.profile.batch || '本科批',
          targetCities: data.profile.targetCities || [],
          createdAt: new Date().toISOString(),
        },
        assessment: defaultAssessment,
        preferences: data.preferences,
      };

      const response = await recommend.generate(requestData);
      if (response.success && response.data) {
        navigate('/recommend/result', { state: response.data, replace: true });
      } else {
        navigate(redirectTo || from, { replace: true });
      }
    } catch (err) {
      console.error('生成快速推荐失败:', err);
      navigate(redirectTo || from, { replace: true });
    } finally {
      setGeneratingRecommend(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    const newErrors: Record<string, string> = {};

    const phoneError = validatePhone(phone);
    if (phoneError) newErrors.phone = phoneError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    if (activeTab === 'register') {
      const nameError = validateName(name);
      if (nameError) newErrors.name = nameError;

      const provinceError = validateProvince(province);
      if (provinceError) newErrors.province = provinceError;

      if (role === 'parent') {
        const relationshipError = validateRelationship(relationship);
        if (relationshipError) newErrors.relationship = relationshipError;
      }

      if (role === 'teacher') {
        const schoolNameError = validateSchoolName(schoolName);
        if (schoolNameError) newErrors.schoolName = schoolNameError;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (activeTab === 'login') {
        await login(phone, password);
      } else {
        const registerData: {
          phone: string;
          password: string;
          role: string;
          name: string;
          province?: string;
          relationship?: string;
          schoolName?: string;
        } = {
          phone,
          password,
          role,
          name,
          province,
        };

        if (role === 'parent' && relationship) {
          registerData.relationship = relationships.find(r => r.value === relationship)?.label;
        }

        if (role === 'teacher' && schoolName) {
          registerData.schoolName = schoolName;
        }

        await register(registerData);
      }

      const user = useAuthStore.getState().user;

      if (quickFillData && user) {
        await generateQuickRecommendation(user.id, quickFillData);
        return;
      }

      if (redirectTo) {
        navigate(redirectTo, { replace: true });
        return;
      }

      if (from === '/') {
        navigate(getRoleRedirectPath(), { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            智能志愿填报系统
          </h1>
          <p className="text-gray-600">
            {activeTab === 'login' ? '欢迎回来，请登录您的账户' : '创建新账户，开始智能填报'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                activeTab === 'login'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LogIn className="w-5 h-5 mr-2" />
              登录
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                activeTab === 'register'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              注册
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {activeTab === 'login' ? '选择您的身份' : '您的身份'}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-3 border-2 rounded-xl text-center transition-all hover:scale-105 ${
                    role === r.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <r.icon className={`w-6 h-6 mx-auto mb-2 ${role === r.value ? 'text-blue-500' : 'text-gray-400'}`} />
                  <div className="font-medium text-sm">{r.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{r.description}</div>
                </button>
              ))}
            </div>
            {activeTab === 'login' && (
              <p className="mt-3 text-sm text-gray-500 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {getRoleHint()}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {activeTab === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  姓名
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入您的姓名"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.name
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所在省份
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors appearance-none bg-white ${
                      errors.province
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  >
                    <option value="">请选择您所在的省份</option>
                    {provinces.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                {errors.province && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.province}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'register' && role === 'parent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  与考生的关系
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {relationships.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRelationship(r.value)}
                      className={`p-3 border-2 rounded-xl text-center transition-all ${
                        relationship === r.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{r.label}</div>
                    </button>
                  ))}
                </div>
                {errors.relationship && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.relationship}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'register' && role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  任教学校
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="请输入您任教的学校名称"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                      errors.schoolName
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.schoolName && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.schoolName}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入您的手机号"
                  maxLength={11}
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.phone
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入您的密码"
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {quickFillData && activeTab === 'login' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-amber-800 text-sm flex items-start">
                  <Flame className="w-5 h-5 mr-2 flex-shrink-0 text-amber-500" />
                  <span>检测到您有未完成的快速填报，登录后将自动为您生成推荐结果</span>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || generatingRecommend}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {loading || generatingRecommend ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {generatingRecommend ? '生成推荐中...' : '处理中...'}
                </>
              ) : activeTab === 'login' ? (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  登录
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  注册
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 mt-6 text-sm">
          {activeTab === 'login' ? (
            <>
              还没有账户？{' '}
              <button
                onClick={() => setActiveTab('register')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                立即注册
              </button>
            </>
          ) : (
            <>
              已有账户？{' '}
              <button
                onClick={() => setActiveTab('login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                立即登录
              </button>
            </>
          )}
        </p>

        <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
          <h3 className="text-center text-sm font-medium text-gray-700 mb-4">更多服务入口</h3>
          <div className="grid grid-cols-2 gap-3">
            {footerLinks.map((link, index) => (
              <button
                key={index}
                onClick={() => navigate(link.path)}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:from-blue-500 group-hover:to-indigo-500 transition-all">
                  <link.icon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                  {link.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-gray-400 mt-8 text-xs">
          登录即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
