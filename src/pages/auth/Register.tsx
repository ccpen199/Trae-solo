import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Phone, Lock, User, Building2, Factory, Settings,
  CheckCircle, ArrowRight, Eye, EyeOff, Shield,
  Upload, MapPin, FileText, Check, X, AlertCircle
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '../../../shared/types';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('supplier');
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    company: '',
    province: '',
    city: '',
    smsCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [smsCountdown, setSmsCountdown] = useState(0);

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

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedRole) {
      newErrors.role = '请选择用户身份';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '请输入正确的手机号';
    }
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 8) {
      newErrors.password = '密码长度不能少于8位';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '密码需包含大小写字母和数字';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    if (!formData.smsCode.trim()) {
      newErrors.smsCode = '请输入验证码';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '请输入姓名';
    }
    if (!formData.company.trim()) {
      newErrors.company = '请输入企业名称';
    }
    if (!formData.province.trim()) {
      newErrors.province = '请选择省份';
    }
    if (!formData.city.trim()) {
      newErrors.city = '请选择城市';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendSms = () => {
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      setErrors({ phone: '请输入正确的手机号' });
      return;
    }
    setSmsCountdown(60);
    const timer = setInterval(() => {
      setSmsCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const response = await authAPI.register(
        formData.phone,
        formData.password,
        selectedRole,
        formData.company,
      );
      if (response.success && response.data) {
        const loginResult = await login(formData.phone, formData.password, selectedRole);
        if (loginResult.success) {
          navigate('/market');
        }
      }
    } catch (error) {
      console.error('注册失败:', error);
      setErrors({ phone: '注册失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const pwd = formData.password;
    if (!pwd) return { level: 0, text: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z\d]/.test(pwd)) score++;
    
    if (score <= 1) return { level: 1, text: '弱', color: 'bg-red-500' };
    if (score === 2) return { level: 2, text: '中', color: 'bg-yellow-500' };
    return { level: 3, text: '强', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RecycleIcon className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">加入再生资源产业协同平台</h1>
          <p className="text-slate-500 mt-2">共创绿色未来，共享产业价值</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 1 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-green-500' : 'bg-slate-200'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 2 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {step > 2 ? <Check className="w-5 h-5" /> : '2'}
            </div>
            <div className={`w-20 h-1 ${step >= 3 ? 'bg-green-500' : 'bg-slate-200'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 3 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              3
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">账号信息</h2>
                <p className="text-slate-500 text-sm">选择您的身份，创建登录账号</p>
              </div>

              <div>
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
                          <Check className="w-3 h-3 text-white" />
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
                {errors.role && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.role}
                  </p>
                )}
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="验证码"
                  placeholder="请输入验证码"
                  value={formData.smsCode}
                  onChange={(e) => handleChange('smsCode', e.target.value)}
                  error={errors.smsCode}
                />
                <div className="flex flex-col justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={sendSms}
                    disabled={smsCountdown > 0}
                  >
                    {smsCountdown > 0 ? `${smsCountdown}s后重发` : '获取验证码'}
                  </Button>
                </div>
              </div>

              <Input
                label="设置密码"
                type={showPassword ? 'text' : 'password'}
                placeholder="请设置密码"
                icon={<Lock className="w-4 h-4" />}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                suffix={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i <= passwordStrength.level ? passwordStrength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className={`text-sm font-medium ${
                      passwordStrength.level === 1 ? 'text-red-500' :
                      passwordStrength.level === 2 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      密码强度: {passwordStrength.text}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-600' : ''}`}>
                      {formData.password.length >= 8 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      至少8个字符
                    </p>
                    <p className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? 'text-green-600' : ''}`}>
                      {/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      包含大小写字母
                    </p>
                    <p className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-green-600' : ''}`}>
                      {/\d/.test(formData.password) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      包含数字
                    </p>
                  </div>
                </div>
              )}

              <Input
                label="确认密码"
                type="password"
                placeholder="请再次输入密码"
                icon={<Lock className="w-4 h-4" />}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
              />

              <Button
                type="button"
                className="w-full text-lg py-3"
                size="lg"
                onClick={handleNext}
              >
                下一步
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">基本信息</h2>
                <p className="text-slate-500 text-sm">完善您的企业和个人信息</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="姓名"
                  placeholder="请输入真实姓名"
                  icon={<User className="w-4 h-4" />}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                />
                <Input
                  label="企业名称"
                  placeholder="请输入企业名称"
                  icon={<Building2 className="w-4 h-4" />}
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  error={errors.company}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="所在省份"
                  placeholder="请选择省份"
                  icon={<MapPin className="w-4 h-4" />}
                  value={formData.province}
                  onChange={(e) => handleChange('province', e.target.value)}
                  error={errors.province}
                />
                <Input
                  label="所在城市"
                  placeholder="请选择城市"
                  icon={<MapPin className="w-4 h-4" />}
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  error={errors.city}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  上传资质证明（选填）
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {['营业执照', '经营许可证', '税务登记证', '法人身份证'].map((doc, idx) => (
                    <div key={idx} className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-green-400 transition-colors cursor-pointer group">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-green-500 transition-colors" />
                      <p className="text-sm text-slate-600">{doc}</p>
                      <p className="text-xs text-slate-400 mt-1">点击上传</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-800">信息安全保障</p>
                    <p className="text-green-700 mt-1">
                      您的企业信息将由平台加密存储，仅用于资质审核，不会向第三方泄露。
                      完成资质认证后可享受更高的信用额度和更多平台权益。
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  上一步
                </Button>
                <Button
                  type="submit"
                  className="flex-1 text-lg py-3"
                  size="lg"
                  isLoading={loading}
                >
                  {loading ? '注册中...' : '完成注册'}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-slate-500">
              已有账号?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
                立即登录
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
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

export default Register;
