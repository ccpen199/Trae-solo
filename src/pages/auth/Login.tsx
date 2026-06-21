import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Phone, Lock, User, Building2, Factory, Settings,
  CheckCircle, ArrowRight, Eye, EyeOff, Shield
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '../../../shared/types';

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

  const roles = [
    { value: 'supplier', label: '货源方', description: '回收站/个体户', icon: Building2, color: 'from-green-500 to-emerald-500' },
    { value: 'buyer', label: '采购方', description: '冶炼厂/贸易商', icon: Factory, color: 'from-blue-500 to-cyan-500' },
    { value: 'operator', label: '运营方', description: '平台管理员', icon: Settings, color: 'from-orange-500 to-amber-500' },
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
      newErrors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '请输入正确的手机号';
    }
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码长度不能少于6位';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await authAPI.login(formData.phone, formData.password, selectedRole);
      if (response.success && response.data) {
        login(response.data.token, response.data.user);
        navigate('/market');
      }
    } catch (error) {
      console.error('登录失败:', error);
      setErrors({ phone: '登录失败，请检查手机号和密码' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-green-500 to-emerald-600">
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 400 400">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 py-20 w-full">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-6">
              <RecycleIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              再生资源产业
              <br />
              协同平台
            </h1>
            <p className="text-green-100 text-lg">
              链接供需 · 赋能产业 · 绿色未来
            </p>
          </div>

          <div className="space-y-6">
            {[
              { title: '实时行情', desc: '掌握12类废料最新价格动态' },
              { title: '智能匹配', desc: '精准对接供需双方需求' },
              { title: '联盟协作', desc: '盟主-分盟-站点三级管理' },
              { title: '数据洞察', desc: '行业趋势与转化分析' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">{item.title}</p>
                  <p className="text-green-100 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center gap-6 text-green-100 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>安全保障</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>实名认证</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>交易担保</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RecycleIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">再生资源产业协同平台</h1>
            <p className="text-slate-500 mt-1">链接供需 · 赋能产业</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">欢迎回来</h2>
            <p className="text-slate-500 mb-6">请登录您的账号继续使用</p>

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
              <Input
                label="手机号"
                type="tel"
                placeholder="请输入手机号"
                icon={<Phone className="w-4 h-4" />}
                maxLength={11}
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                error={errors.phone}
              />

              <div className="relative">
                <Input
                  label="密码"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
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
                    登录
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500">
                还没有账号?{' '}
                <Link to="/register" className="text-green-600 hover:text-green-700 font-semibold">
                  立即注册
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-center gap-6">
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
      </div>
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
