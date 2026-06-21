import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Phone, Lock, Building2, Factory, Settings,
  CheckCircle, ArrowRight, Eye, EyeOff, Shield,
  TrendingUp, Package, Users, BarChart3, ChevronRight,
  Search, Bell, MapPin, Sparkles, ArrowLeft,
  AlertCircle, User
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '../../../shared/types';

const roleHomeRoutes: Record<UserRole, string> = {
  supplier: '/workspace/supplier',
  buyer: '/workspace/buyer',
  operator: '/workspace/operator',
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('supplier');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState<string>('');

  const roles = [
    { value: 'supplier', label: '货源方', description: '回收站/个体户', icon: Building2, color: 'from-green-500 to-emerald-500' },
    { value: 'buyer', label: '采购方', description: '冶炼厂/贸易商', icon: Factory, color: 'from-blue-500 to-cyan-500' },
    { value: 'operator', label: '运营方', description: '平台管理员/盟主', icon: Settings, color: 'from-orange-500 to-amber-500' },
  ];

  const quickEntries = [
    { icon: TrendingUp, label: '行情看板', path: '/market', color: 'text-green-600', bg: 'bg-green-50', desc: '12类废料实时价格' },
    { icon: Search, label: '货源检索', path: '/supplies', color: 'text-blue-600', bg: 'bg-blue-50', desc: '按品类/吨位/纯度筛选' },
    { icon: MapPin, label: '回收站地图', path: '/stations', color: 'text-orange-600', bg: 'bg-orange-50', desc: '找周边回收站' },
    { icon: Bell, label: '价格预警', path: '/market/alert', color: 'text-red-600', bg: 'bg-red-50', desc: '自定义阈值提醒' },
    { icon: Package, label: '区域价差', path: '/market/heatmap', color: 'text-purple-600', bg: 'bg-purple-50', desc: '省份价格热力图' },
    { icon: BarChart3, label: '数据看板', path: '/dashboard', color: 'text-indigo-600', bg: 'bg-indigo-50', desc: '供需漏斗分析' },
  ];

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.phone.trim()) {
      newErrors.phone = '请输入账号';
    }
    if (!formData.password) {
      newErrors.password = '请输入密码';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await login(formData.phone, formData.password, selectedRole);
      if (result.success) {
        navigate(roleHomeRoutes[selectedRole], { replace: true });
      } else {
        setLoginError(result.message || '账号或密码错误，请重新输入');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    const demoPhones: Record<UserRole, string> = {
      supplier: 'supplier',
      buyer: 'buyer',
      operator: 'admin',
    };
    setSelectedRole(role);
    setFormData({ phone: demoPhones[role], password: '123456' });
    setLoading(true);
    setLoginError('');
    setTimeout(async () => {
      try {
        const result = await login(demoPhones[role], '123456', role);
        if (result.success) {
          navigate(roleHomeRoutes[role], { replace: true });
        } else {
          setLoginError(result.message || '登录失败');
        }
      } finally {
          setLoading(false);
        }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <RecycleIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800">再生资源产业协同平台</h1>
              <p className="text-xs text-slate-500">链接供需 · 赋能产业 · 绿色未来</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/market')}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-green-600 transition-colors flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              查看实时行情
            </button>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-green-600 transition-colors"
            >
              企业注册
            </Link>
            <Button variant="primary" onClick={() => navigate('/supplies')}>
              立即找货
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">无需登录，立即体验核心功能</h2>
              <p className="text-green-100">浏览12类废料行情、5000+货源、2000+回收站，随时查看</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
            {quickEntries.map((entry, idx) => (
              <button
                key={idx}
                onClick={() => navigate(entry.path)}
                className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 text-left transition-all hover:scale-105 border border-white/20"
              >
                <div className={`w-10 h-10 rounded-lg ${entry.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <entry.icon className={`w-5 h-5 ${entry.color}`} />
                </div>
                <p className="font-semibold text-white">{entry.label}</p>
                <p className="text-xs text-green-100 mt-1">{entry.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-white p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                身份登录
              </h2>
              <p className="text-slate-500 text-sm mt-1">登录后进入专属工作台，管理您的业务</p>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-700 mb-3">选择您的身份</p>
                <div className="grid grid-cols-3 gap-3">
                  {roles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value as UserRole)}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        selectedRole === role.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {selectedRole === role.value && (
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center mx-auto mb-2`}>
                        <role.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-medium text-slate-800">{role.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {loginError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{loginError}</p>
                  </div>
                )}

                <Input
                  label="账号"
                  type="text"
                  placeholder="请输入账号（如：admin、platform、ops、supplier、buyer）"
                  icon={<User className="w-4 h-4" />}
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  error={errors.phone}
                />

                <div className="relative">
                  <Input
                    label="密码"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码（体验账号密码与账号名相同，或输入123456）"
                    icon={<Lock className="w-4 h-4" />}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    error={errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 bottom-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500"
                    />
                    <span className="text-slate-600">记住我</span>
                  </label>
                  <a href="#" className="text-green-600 hover:text-green-700 font-medium">
                    忘记密码?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full text-lg py-3"
                  size="lg"
                  isLoading={loading}
                >
                  {loading ? '登录中...' : (
                    <>
                      登录工作台
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-center text-sm text-slate-500 mb-3">
                  没有账号?{' '}
                  <Link to="/register" className="text-green-600 hover:text-green-700 font-semibold">
                    立即注册
                  </Link>
                </p>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-xs font-medium text-amber-800 mb-2">💡 体验账号（点击一键登录）</p>
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickDemo('supplier')}
                        className="text-xs bg-white border border-amber-300 rounded-md py-1.5 px-2 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        货源方
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemo('buyer')}
                        className="text-xs bg-white border border-amber-300 rounded-md py-1.5 px-2 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        采购方
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemo('operator')}
                        className="text-xs bg-white border border-amber-300 rounded-md py-1.5 px-2 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        运营方
                      </button>
                    </div>
                    <p className="text-xs text-amber-600">
                      账号：admin / platform / ops / supplier / buyer（密码与账号名相同，也可输入123456）
                    </p>
                  </div>
                </div>
              </div>
            </div>
              <div className="px-6 pb-6 pt-2">
                <div className="flex items-center justify-center gap-4">
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    已认证
                  </Badge>
                  <Badge variant="info" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    安全保障
                  </Badge>
                  <Badge variant="warning" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    放心交易
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                今日核心业务流程
              </h3>
              <div className="space-y-4">
                {[
                  { step: '01', title: '实时行情看板', desc: '实时查看12类废料全国均价、区域价差热力图、历史走势对比', action: '去查看行情', path: '/market' },
                  { step: '02', title: '结构化货源检索', desc: '按品类/吨位/纯度/地理位置/认证状态多维筛选', action: '去搜索货源', path: '/supplies' },
                  { step: '03', title: '回收站数字名片', desc: '查看回收站资质、服务半径、在线询价对接', action: '去找回收站', path: '/stations' },
                  { step: '04', title: '价格预警订阅', desc: '设置品类价格阈值，实时推送预警通知', action: '去设置预警', path: '/market/alert' },
                  { step: '05', title: '数据看板复盘', desc: '行业供需波动分析、货源转化漏斗全链路追踪', action: '去查看报表', path: '/dashboard' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 group-hover:text-green-700 transition-colors">{item.title}</p>
                      <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => navigate(item.path)}
                      className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 flex-shrink-0"
                    >
                      {item.action}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Factory className="w-6 h-6" />
                  <h4 className="font-bold text-lg">采购方工作台</h4>
                </div>
                <p className="text-blue-100 text-sm mb-4">
                  聚合全国货源、一键询价、订单管理、采购分析
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>货源精准匹配</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>批量询价对比</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>采购订单跟踪</span>
                  </div>
                </div>
                <button
                  onClick={() => handleQuickDemo('buyer')}
                  className="mt-4 w-full bg-white/20 hover:bg-white/30 rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  立即体验
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-6 h-6" />
                  <h4 className="font-bold text-lg">货源方工作台</h4>
                </div>
                <p className="text-green-100 text-sm mb-4">
                  发布货源、回收站管理、询价处理、结算管理
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>货源发布管理</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>回收站数字名片</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>询价消息处理</span>
                  </div>
                </div>
                <button
                  onClick={() => handleQuickDemo('supplier')}
                  className="mt-4 w-full bg-white/20 hover:bg-white/30 rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  立即体验
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg p-6 text-white md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-6 h-6" />
                  <h4 className="font-bold text-lg">盟主/运营方工作台</h4>
                </div>
                <p className="text-orange-100 text-sm mb-4">
                  盟主-分盟-站点三级组织架构管理、跨区域协作任务派发、结算分账全流程
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-2xl font-bold">3级</div>
                    <p className="text-xs text-orange-100">权限层级</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-2xl font-bold">5类</div>
                    <p className="text-xs text-orange-100">任务状态</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-2xl font-bold">4方</div>
                    <p className="text-xs text-orange-100">分账角色</p>
                  </div>
                </div>
                <button
                  onClick={() => handleQuickDemo('operator')}
                  className="mt-4 w-full bg-white/20 hover:bg-white/30 rounded-lg py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  进入盟主工作台
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-8 mt-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <RecycleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">再生资源产业协同平台</p>
                <p className="text-xs">© 2025 All rights reserved.</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">关于我们</a>
              <a href="#" className="hover:text-white transition-colors">服务协议</a>
              <a href="#" className="hover:text-white transition-colors">隐私政策</a>
              <a href="#" className="hover:text-white transition-colors">联系客服</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const RecycleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 20H4a2 2 0 0 1-2-2v-3.5a2 2 0 0 1 1-1.73l3-1.5a2 2 0 0 1 2 0l3 1.5A2 2 0 0 1 12 14.5V18a2 2 0 0 1-2 2H7z" />
    <path d="M12 4.5V8a2 2 0 0 0 1 1.73l3 1.5a2 2 0 0 0 2 0l3-1.5A2 2 0 0 0 22 8V4.5a2 2 0 0 0-3-1.73L17 4.27a2 2 0 0 0-2 0L12 2.77A2 2 0 0 0 9 4.5" />
    <path d="M17 20h-3a2 2 0 0 1-2-2v-3.5a2 2 0 0 1 1-1.73l3-1.5a2 2 0 0 1 2 0l3 1.5A2 2 0 0 1 22 14.5V18a2 2 0 0 1-2 2h-3z" />
  </svg>
);

export default Login;
