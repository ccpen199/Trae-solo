import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, Lock, Shield, Smartphone, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, isAuthenticated } = useAuthStore();
  const [phone, setPhone] = useState('13800138001');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'password' | 'face' | 'sms'>('password');
  const [smsCode, setSmsCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [faceScanning, setFaceScanning] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendSms = () => {
    if (phone.length === 11 && countdown === 0) {
      setCountdown(60);
    }
  };

  const handleFaceLogin = async () => {
    setFaceScanning(true);
    setError('');
    try {
      const result = await api.auth.faceVerify('mock_face_image_base64');
      if (result.verified) {
        const success = await login(phone, 'face_login');
        if (success) {
          navigate(from, { replace: true });
        }
      } else {
        setError('人脸认证失败，请重试');
      }
    } catch (e) {
      setError('人脸认证服务暂不可用');
    } finally {
      setFaceScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || phone.length !== 11) {
      setError('请输入正确的手机号码');
      return;
    }

    if (loginType === 'password' && !password) {
      setError('请输入密码');
      return;
    }

    if (loginType === 'sms' && !smsCode) {
      setError('请输入验证码');
      return;
    }

    const success = await login(phone, loginType === 'password' ? password : smsCode);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setError('登录失败，请检查账号密码');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-eco-400 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-warm-400 blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-12">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-bold mb-6 shadow-2xl">
              邕
            </div>
            <h1 className="text-5xl font-bold mb-4">南宁城市服务</h1>
            <p className="text-xl text-white/80 font-light">智慧城市·山水南宁</p>
          </div>
          
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">统一数字身份</h3>
                <p className="text-white/70">融合电子身份证、社保卡、驾驶证，一码通行全城</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">一网通办</h3>
                <p className="text-white/70">交通、医疗、教育、政务、城管，一站式服务</p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/20">
            <p className="text-white/50 text-sm">
              © 2024 南宁市大数据发展局 · 城市级公共服务操作系统
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 shadow-glow">
              邕
            </div>
            <h1 className="text-2xl font-bold text-gray-800">南宁城市服务</h1>
            <p className="text-gray-500">智慧城市·山水南宁</p>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎回来</h2>
            <p className="text-gray-500 mb-8">请登录您的账号以使用城市服务</p>

            <div className="flex gap-2 mb-8">
              {[
                { key: 'password', label: '密码登录', icon: Lock },
                { key: 'sms', label: '验证码', icon: Smartphone },
                { key: 'face', label: '刷脸', icon: Fingerprint },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setLoginType(tab.key as any)}
                  className={cn(
                    'flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5',
                    loginType === tab.key
                      ? 'bg-primary-500 text-white shadow-glow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {loginType === 'face' ? (
              <div className="text-center py-8">
                <div className={cn(
                  'w-40 h-40 rounded-full mx-auto mb-6 flex items-center justify-center transition-all duration-500',
                  faceScanning
                    ? 'bg-gradient-to-br from-primary-400 to-eco-400 animate-pulse-slow'
                    : 'bg-gray-100'
                )}>
                  {faceScanning ? (
                    <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border-4 border-white/50 border-t-white animate-spin"></div>
                    </div>
                  ) : (
                    <Fingerprint className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <p className="text-gray-600 mb-6">
                  {faceScanning ? '正在识别面部特征...' : '请将面部对准摄像头'}
                </p>
                <button
                  onClick={handleFaceLogin}
                  disabled={faceScanning || isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-eco-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-glow transition-all duration-200 disabled:opacity-50"
                >
                  {faceScanning ? '识别中...' : '开始人脸识别'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">手机号码</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="请输入手机号"
                      maxLength={11}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {loginType === 'password' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">登录密码</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="请输入密码"
                        className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">短信验证码</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="6位验证码"
                          maxLength={6}
                          className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendSms}
                        disabled={countdown > 0 || phone.length !== 11}
                        className={cn(
                          'px-6 py-3.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200',
                          countdown > 0 || phone.length !== 11
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                        )}
                      >
                        {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                    <span className="text-gray-600">记住登录状态</span>
                  </label>
                  <button type="button" className="text-primary-600 hover:text-primary-700 font-medium">
                    忘记密码?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-glow transition-all duration-200 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      登录中...
                    </span>
                  ) : (
                    '登录'
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
              还没有账号? <button className="text-primary-600 hover:text-primary-700 font-medium ml-1">立即注册</button>
            </div>

            <div className="mt-6 p-4 bg-primary-50 rounded-xl">
              <p className="text-xs text-primary-700 text-center">
                <strong>演示账号：</strong>13800138001 / 123456<br />
                <strong>管理员账号：</strong>13900139000 / admin123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
