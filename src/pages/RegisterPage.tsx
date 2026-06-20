import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Phone, Globe, Check, AlertCircle, Crown } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { validateEmail, validatePhone } from '../components/lib/utils';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreeMarketing: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName) newErrors.firstName = '请输入名字';
    if (!formData.lastName) newErrors.lastName = '请输入姓氏';
    
    if (!formData.email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = '请输入有效的手机号码';
    }
    
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 8) {
      newErrors.password = '密码至少需要8个字符';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = '密码需包含大小写字母和数字';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = '请同意服务条款和隐私政策';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) return;

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      navigate('/register/success');
    } catch (err: any) {
      // Error is handled by the store
    }
  };

  const benefits = [
    '注册即享Bronze会员权益',
    '首次预订9折优惠',
    '专属客服支持',
    '生日礼遇',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-cloud-50">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="sticky top-24">
                <div className="bg-gradient-to-br from-deep-blue via-deep-blue-light to-deep-blue rounded-2xl p-8 text-white">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
                    <Crown className="w-8 h-8 text-gold-foil" />
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-4">
                    加入 StayGlobal 会员
                  </h2>
                  <p className="text-cloud-200 mb-6">
                    注册即享Bronze会员权益，累积积分升级Silver、Gold会员，解锁更多专属礼遇
                  </p>
                  
                  <div className="space-y-4">
                    {benefits.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-gold-foil/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-4 h-4 text-gold-foil" />
                        </div>
                        <span className="text-cloud-100">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/20">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-display font-bold text-gold-foil">100万+</div>
                        <p className="text-xs text-cloud-300 mt-1">活跃会员</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-display font-bold text-gold-foil">50万+</div>
                        <p className="text-xs text-cloud-300 mt-1">合作酒店</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-display font-bold text-gold-foil">200+</div>
                        <p className="text-xs text-cloud-300 mt-1">覆盖国家</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="text-center mb-8 lg:hidden">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-deep-blue to-deep-blue-light rounded-2xl mb-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-display font-bold text-graphite-900 mb-2">
                  创建新账号
                </h1>
                <p className="text-graphite-500">
                  加入StayGlobal，开启您的环球之旅
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-elevated p-8">
                <div className="hidden lg:block mb-8">
                  <h1 className="text-3xl font-display font-bold text-graphite-900 mb-2">
                    创建新账号
                  </h1>
                  <p className="text-graphite-500">
                    加入StayGlobal，开启您的环球之旅
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">注册失败</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="名字"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="张"
                      leftIcon={<User className="w-5 h-5" />}
                      error={errors.firstName}
                    />
                    <Input
                      label="姓氏"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="三"
                      error={errors.lastName}
                    />
                  </div>

                  <Input
                    label="邮箱地址"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    leftIcon={<Mail className="w-5 h-5" />}
                    error={errors.email}
                    autoComplete="email"
                  />

                  <Input
                    label="手机号码 (可选)"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+86 138 0013 8000"
                    leftIcon={<Phone className="w-5 h-5" />}
                    error={errors.phone}
                    autoComplete="tel"
                  />

                  <Input
                    label="设置密码"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="至少8个字符，包含大小写字母和数字"
                    leftIcon={<Lock className="w-5 h-5" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-graphite-400 hover:text-graphite-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    }
                    error={errors.password}
                    autoComplete="new-password"
                  />

                  <Input
                    label="确认密码"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="再次输入密码"
                    leftIcon={<Lock className="w-5 h-5" />}
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                  />

                  <div className="space-y-3 pt-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={handleChange}
                        className="w-5 h-5 mt-0.5 rounded border-cloud-300 text-deep-blue focus:ring-deep-blue"
                      />
                      <span className="text-sm text-graphite-600">
                        我已阅读并同意{' '}
                        <Link to="/terms" className="text-deep-blue hover:underline">
                          服务条款
                        </Link>{' '}
                        和{' '}
                        <Link to="/privacy" className="text-deep-blue hover:underline">
                          隐私政策
                        </Link>
                      </span>
                    </label>
                    {errors.agreeTerms && (
                      <p className="text-sm text-red-600">{errors.agreeTerms}</p>
                    )}

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="agreeMarketing"
                        checked={formData.agreeMarketing}
                        onChange={handleChange}
                        className="w-5 h-5 mt-0.5 rounded border-cloud-300 text-deep-blue focus:ring-deep-blue"
                      />
                      <span className="text-sm text-graphite-600">
                        我希望接收促销优惠和最新活动通知（可选）
                      </span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                    className="mt-6"
                  >
                    创建账号
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-cloud-200 text-center">
                  <p className="text-graphite-600">
                    已有账号？{' '}
                    <Link
                      to="/login"
                      className="text-deep-blue hover:text-deep-blue-light font-medium"
                    >
                      立即登录
                    </Link>
                  </p>
                </div>
              </div>

              <div className="mt-6 text-center text-sm text-graphite-500 lg:hidden">
                <Badge variant="gold" size="sm">
                  <Crown className="w-3 h-3 mr-1" />
                  会员专属权益
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterPage;
