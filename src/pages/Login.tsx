import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Briefcase,
  GraduationCap,
  Building2,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  BadgeCheck,
  AlertTriangle,
  Info,
  ChevronRight,
  Sparkles,
  Clock,
  Wallet,
  BarChart3,
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
  companyName: string;
  contactName: string;
  contactPhone: string;
}

const roleConfig: Record<TabType, {
  label: string;
  title: string;
  subtitle: string;
  icon: typeof GraduationCap;
  color: string;
  bgGradient: string;
  requirements: { icon: typeof BadgeCheck; label: string; desc: string }[];
  demoAccounts?: { label: string; value: string; password: string }[];
}> = {
  student: {
    label: '学生',
    title: '学生求职通道',
    subtitle: '学籍实名认证，优质岗位精准匹配',
    icon: GraduationCap,
    color: 'text-primary-600',
    bgGradient: 'from-primary-500 to-primary-700',
    requirements: [
      { icon: BadgeCheck, label: '教育部学籍验证', desc: '对接教育部学籍在线验证API' },
      { icon: FileCheck2, label: '真实身份背书', desc: '学生身份真实性有保障' },
      { icon: Clock, label: '课表智能匹配', desc: '根据空闲时段推荐岗位' },
    ],
    demoAccounts: [
      { label: '演示账号（清华·计算机）', value: '2021010001', password: '123456' },
    ],
  },
  company: {
    label: '企业',
    title: '企业用工通道',
    subtitle: '用工备案合规，优质人才高效对接',
    icon: Building2,
    color: 'text-accent-500',
    bgGradient: 'from-accent-500 to-accent-700',
    requirements: [
      { icon: FileCheck2, label: '用工备案制度', desc: '强制填写《大学生兼职用工备案表》' },
      { icon: ShieldCheck, label: '企业资质审核', desc: '营业执照与经营资质核验' },
      { icon: Wallet, label: '工资批量代发', desc: '对接银行批量代发接口' },
    ],
    demoAccounts: [
      { label: '演示账号（星辰科技）', value: 'hr@startech.com', password: '123456' },
    ],
  },
  admin: {
    label: '教育局监管',
    title: '教育局监管后台',
    subtitle: '全量数据监控，合规风险预警',
    icon: ShieldCheck,
    color: 'text-success-500',
    bgGradient: 'from-success-500 to-success-700',
    requirements: [
      { icon: BarChart3, label: '全局数据看板', desc: '岗位/学生/企业/投诉实时监控' },
      { icon: AlertTriangle, label: '异常预警机制', desc: '高投诉率、低薪资达标率预警' },
      { icon: FileCheck2, label: '投诉处理闭环', desc: '从受理到结案全流程留痕' },
    ],
    demoAccounts: [
      { label: '演示账号（教育局管理员）', value: 'admin', password: '123456' },
    ],
  },
};

const platformFeatures = [
  { icon: BadgeCheck, title: '学籍真实性验证', desc: '对接教育部学籍在线验证API，确保学生身份真实可信' },
  { icon: FileCheck2, title: '用工备案合规', desc: '企业发布岗位前强制填写用工备案表，工时薪资保险全公示' },
  { icon: Sparkles, title: '智能匹配引擎', desc: '专业匹配度+课程表空闲时段+历史评价三维加权排序' },
  { icon: ShieldCheck, title: '沟通强制留痕', desc: '所有对话记录永久保存，一键生成实习实践证明' },
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
    companyName: '',
    contactName: '',
    contactPhone: '',
  });

  const from = (location.state as { from?: Location })?.from?.pathname || getDefaultRedirect(activeTab);

  function getDefaultRedirect(role: TabType): string {
    switch (role) {
      case 'student': return '/match';
      case 'company': return '/company/jobs';
      case 'admin': return '/admin/dashboard';
    }
  }

  const config = roleConfig[activeTab];
  const Icon = config.icon;

  const handleInputChange = (field: keyof FormData, value: string) => {
    setError('');
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const fillDemoAccount = (demo: { value: string; password: string }) => {
    setError('');
    if (activeTab === 'student') {
      setFormData(prev => ({ ...prev, studentId: demo.value, password: demo.password }));
    } else if (activeTab === 'company') {
      setFormData(prev => ({ ...prev, email: demo.value, password: demo.password }));
    } else {
      setFormData(prev => ({ ...prev, username: demo.value, password: demo.password }));
    }
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
        if (!formData.studentId) throw new Error('请输入学号');
        if (!formData.password) throw new Error('请输入密码');
        endpoint = '/auth/student/login';
        body = { studentId: formData.studentId, password: formData.password };
        break;
      case 'company':
        if (!formData.email) throw new Error('请输入邮箱');
        if (!formData.password) throw new Error('请输入密码');
        endpoint = '/auth/company/login';
        body = { email: formData.email, password: formData.password };
        break;
      case 'admin':
        if (!formData.username) throw new Error('请输入用户名');
        if (!formData.password) throw new Error('请输入密码');
        endpoint = '/auth/admin/login';
        body = { username: formData.username, password: formData.password };
        break;
    }

    const res = await api.post<{ token: string; user: object }>(endpoint, body);
    login(res.token, res.user, activeTab as UserRole);

    const target = (location.state as { from?: Location })?.from?.pathname || getDefaultRedirect(activeTab);
    navigate(target, { replace: true });
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
        if (!formData.studentId) throw new Error('请输入学号');
        if (!formData.name) throw new Error('请输入真实姓名');
        if (!formData.school) throw new Error('请输入学校名称');
        endpoint = '/auth/student/register';
        body = {
          studentId: formData.studentId,
          name: formData.name,
          school: formData.school,
          password: formData.password,
        };
        break;
      case 'company':
        if (!formData.companyName) throw new Error('请输入企业名称');
        if (!formData.email) throw new Error('请输入邮箱');
        if (!formData.contactName) throw new Error('请输入联系人姓名');
        if (!formData.contactPhone) throw new Error('请输入联系电话');
        endpoint = '/auth/company/register';
        body = {
          name: formData.companyName,
          email: formData.email,
          password: formData.password,
          contactName: formData.contactName,
          contactPhone: formData.contactPhone,
        };
        break;
      case 'admin':
        throw new Error('管理员账号需由教育局统一分配，不支持自助注册');
    }

    const res = await api.post<{ token: string; user: object }>(endpoint, body);
    login(res.token, res.user, activeTab as UserRole);
    navigate(getDefaultRedirect(activeTab), { replace: true });
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setError('');
    setFormData({
      studentId: '', name: '', school: '', email: '',
      password: '', confirmPassword: '', username: '',
      companyName: '', contactName: '', contactPhone: '',
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-[55%] flex-col bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-20 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-primary-400 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-success-400 rounded-full blur-3xl opacity-40" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-between p-12">
          <div>
            <div className="flex items-center space-x-3 mb-16">
              <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <Briefcase className="w-8 h-8" />
              </div>
              <div>
                <div className="text-2xl font-bold">校职通</div>
                <div className="text-sm text-primary-200/70">高校兼职用工撮合平台</div>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4 leading-tight">
              让大学生兼职
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-accent-300">
                更安全、更合规、更高效
              </span>
            </h1>
            <p className="text-lg text-primary-100/70 mb-10 max-w-lg">
              教育部学籍验证 · 用工备案公示 · 智能匹配推荐 · 沟通全程留痕 · 工资银行代发 · 教育局实时监管
            </p>

            <div className="grid grid-cols-2 gap-5 max-w-lg">
              {platformFeatures.map((feature, i) => {
                const FIcon = feature.icon;
                return (
                  <div
                    key={i}
                    className="bg-white/8 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/12 transition-colors"
                  >
                    <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center mb-3">
                      <FIcon className="w-5 h-5 text-accent-400" />
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                    <p className="text-xs text-primary-200/60 leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex -space-x-2">
                {['#60a5fa', '#36b37e', '#ff7a45', '#a78bfa'].map((c, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-primary-800 flex items-center justify-center text-xs font-medium"
                    style={{ backgroundColor: c }}
                  >
                    {['张', '李', '王', '陈'][i]}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="font-semibold">10,000+</span>
                <span className="text-primary-200/60 ml-1">学生与企业已入驻</span>
              </div>
            </div>
            <div className="text-xs text-primary-200/50">
              教育部学籍验证 · 教育局数据接入
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-lg">
          <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">校职通</div>
              <div className="text-xs text-gray-500">高校兼职用工撮合平台</div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden">
            <div className={`bg-gradient-to-r ${config.bgGradient} px-8 pt-8 pb-6`}>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-white">
                  <div className="text-xl font-bold">{config.title}</div>
                  <div className="text-sm text-white/70">{config.subtitle}</div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
                {(Object.keys(roleConfig) as TabType[]).map((tab) => {
                  const tabCfg = roleConfig[tab];
                  const TabIcon = tabCfg.icon;
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => switchTab(tab)}
                      className={cn(
                        'flex-1 flex items-center justify-center space-x-2 py-2.5 px-2 rounded-xl text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-white text-gray-900 shadow-md'
                          : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      <TabIcon className="w-4 h-4" />
                      <span>{tabCfg.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {mode === 'login' ? '欢迎登录' : '注册账号'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {mode === 'login'
                      ? `使用您的${config.label}账号登录系统`
                      : `注册${config.label}账号，开启服务`}
                  </p>
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <Info className="w-3.5 h-3.5" />
                  <span>安全加密传输</span>
                </div>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        学号 <span className="text-red-500">*</span>
                        <span className="text-gray-400 font-normal ml-2">（学籍认证用）</span>
                      </label>
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => handleInputChange('studentId', e.target.value)}
                        placeholder="请输入您的学号"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                      />
                    </div>
                    {mode === 'register' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            真实姓名 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="请输入真实姓名（与学籍一致）"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            所在学校 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.school}
                            onChange={(e) => handleInputChange('school', e.target.value)}
                            placeholder="请输入学校全称"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                          />
                        </div>
                        <div className="p-3 bg-primary-50 border border-primary-100 rounded-xl flex items-start space-x-2.5">
                          <BadgeCheck className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-primary-700 leading-relaxed">
                            <p className="font-medium mb-0.5">学籍验证说明</p>
                            <p className="text-primary-600/80">
                              注册后系统将对接教育部学籍在线验证API核验您的学生身份，
                              验证通过后方可投递岗位和使用全部功能。
                            </p>
                          </div>
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
                          企业名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.companyName}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                          placeholder="请输入企业全称（与营业执照一致）"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-all text-sm"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        企业邮箱 <span className="text-red-500">*</span>
                        <span className="text-gray-400 font-normal ml-2">（用工备案用）</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="请输入企业邮箱"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-all text-sm"
                      />
                    </div>
                    {mode === 'register' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              联系人 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.contactName}
                              onChange={(e) => handleInputChange('contactName', e.target.value)}
                              placeholder="联系人姓名"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-all text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              联系电话 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={formData.contactPhone}
                              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                              placeholder="联系电话"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 outline-none transition-all text-sm"
                            />
                          </div>
                        </div>
                        <div className="p-3 bg-accent-50 border border-accent-100 rounded-xl flex items-start space-x-2.5">
                          <FileCheck2 className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-accent-700 leading-relaxed">
                            <p className="font-medium mb-0.5">企业备案说明</p>
                            <p className="text-accent-600/80">
                              注册后需提交营业执照完成企业认证，发布岗位前必须填写《大学生兼职用工备案表》，
                              包括工时上限、薪酬标准、保险购买承诺等信息。
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {activeTab === 'admin' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        管理员账号 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="请输入管理员账号"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-success-500/20 focus:border-success-500 outline-none transition-all text-sm"
                      />
                    </div>
                    {mode === 'login' && (
                      <div className="p-3 bg-success-50 border border-success-100 rounded-xl flex items-start space-x-2.5">
                        <ShieldCheck className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-success-700 leading-relaxed">
                          <p className="font-medium mb-0.5">监管后台说明</p>
                          <p className="text-success-600/80">
                            仅教育局授权管理员可登录，可查看各院校岗位发布量、投诉率、薪资达标率等
                            监管KPI，并处理学生投诉。
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    密码 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="请输入密码"
                      className={cn(
                        'w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white outline-none transition-all text-sm',
                        activeTab === 'student' && 'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                        activeTab === 'company' && 'focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500',
                        activeTab === 'admin' && 'focus:ring-2 focus:ring-success-500/20 focus:border-success-500',
                      )}
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
                      确认密码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="请再次输入密码"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-sm"
                    />
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" className="text-sm text-gray-500 hover:text-gray-700">
                      忘记密码？
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    'w-full py-3.5 px-4 text-white rounded-xl font-medium text-base',
                    'hover:shadow-lg hover:-translate-y-0.5',
                    'transition-all flex items-center justify-center space-x-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
                    activeTab === 'student' && 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800',
                    activeTab === 'company' && 'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700',
                    activeTab === 'admin' && 'bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700',
                  )}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'login' ? '登 录' : '注 册'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {mode === 'login' && config.demoAccounts && config.demoAccounts.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="text-xs text-gray-400">快速体验</span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>
                  {config.demoAccounts.map((demo, i) => (
                    <button
                      key={i}
                      onClick={() => fillDemoAccount(demo)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          activeTab === 'student' && 'bg-primary-100 text-primary-600',
                          activeTab === 'company' && 'bg-accent-100 text-accent-600',
                          activeTab === 'admin' && 'bg-success-100 text-success-600',
                        )}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">{demo.label}</div>
                          <div className="text-xs text-gray-400">账号：{demo.value}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {activeTab !== 'admin' && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    {mode === 'login' ? '还没有账号？' : '已有账号？'}
                    <button
                      onClick={switchMode}
                      className={cn(
                        'font-medium ml-1',
                        activeTab === 'student' && 'text-primary-600 hover:text-primary-700',
                        activeTab === 'company' && 'text-accent-500 hover:text-accent-600',
                        activeTab === 'admin' && 'text-success-500 hover:text-success-600',
                      )}
                    >
                      {mode === 'login' ? '立即注册' : '立即登录'}
                    </button>
                  </p>
                </div>
              )}

              {activeTab === 'admin' && mode === 'login' && (
                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-400">
                    管理员账号由教育局统一分配，不支持自助注册
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <CheckCircle2 className={cn('w-5 h-5', config.color)} />
                <span>{config.label}端功能概览</span>
              </h3>
              <div className="space-y-3">
                {config.requirements.map((req, i) => {
                  const ReqIcon = req.icon;
                  return (
                    <div key={i} className="flex items-start space-x-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        activeTab === 'student' && 'bg-primary-50 text-primary-500',
                        activeTab === 'company' && 'bg-accent-50 text-accent-500',
                        activeTab === 'admin' && 'bg-success-50 text-success-500',
                      )}>
                        <ReqIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{req.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{req.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            登录即表示同意《服务条款》《隐私政策》和《大学生兼职用工合规公约》
          </p>
        </div>
      </div>
    </div>
  );
}
