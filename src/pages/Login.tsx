import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, Lock, Shield, Smartphone, Eye, EyeOff, Fingerprint, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useAuthStore, LoginErrorCode } from '@/store/useAuthStore';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';

const errorMessages: Record<LoginErrorCode, { title: string; message: string; type: 'error' | 'warning' | 'info' }> = {
  SUCCESS: { title: '登录成功', message: '正在跳转...', type: 'info' },
  ACCOUNT_NOT_FOUND: { title: '账号不存在', message: '该手机号未注册，请检查手机号或联系管理员', type: 'error' },
  PASSWORD_ERROR: { title: '密码错误', message: '您输入的密码不正确，请重试或点击忘记密码', type: 'error' },
  INSUFFICIENT_PERMISSIONS: { title: '权限不足', message: '您的账号没有权限访问该系统', type: 'warning' },
  NETWORK_ERROR: { title: '网络错误', message: '无法连接服务器，请检查网络连接', type: 'error' },
  UNKNOWN_ERROR: { title: '登录失败', message: '发生未知错误，请稍后重试', type: 'error' },
};

const demoAccounts = [
  { phone: '13800138001', password: '123456', role: '市民', desc: '完整市民端功能体验' },
  { phone: '13900139000', password: 'admin123', role: '管理员', desc: '含城市体征、服务编排等后台权限' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, isAuthenticated, user, loginError, clearLoginError } = useAuthStore();
  const [phone, setPhone] = useState('13800138001');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'password' | 'face' | 'sms'>('password');
  const [smsCode, setSmsCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [faceScanning, setFaceScanning] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const from = (location.state as any)?.from?.pathname || null;

  useEffect(() => {
    if (isAuthenticated && user) {
      setLoginSuccess(true);
      const timer = setTimeout(() => {
        if (from) {
          navigate(from, { replace: true });
        } else if (user.role === 'admin' || user.role === 'clerk') {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, navigate, from]);

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
    clearLoginError();
    try {
      const result = await api.auth.faceVerify('mock_face_image_base64') as any;
      if (result.verified) {
        const { success, code } = await login(phone, 'face_login');
        if (!success) {
          setFaceScanning(false);
        }
      } else {
        setFaceScanning(false);
      }
    } catch (e) {
      setFaceScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginError();

    if (!phone || phone.length !== 11) {
      return;
    }

    if (loginType === 'password' && !password) {
      return;
    }

    if (loginType === 'sms' && !smsCode) {
      return;
    }

    const { success } = await login(phone, loginType === 'password' ? password : smsCode);
    if (success) {
    }
  };

  const fillDemoAccount = (account: typeof demoAccounts[0]) => {
    setPhone(account.phone);
    setPassword(account.password);
    setLoginType('password');
    clearLoginError();
    setShowDemoAccounts(false);
  };

  const getErrorDisplay = () => {
    if (loginSuccess) {
      return { ...errorMessages.SUCCESS, Icon: CheckCircle };
    }
    if (!loginError) return null;
    const error = errorMessages[loginError];
    const Icon = error.type === 'error' ? AlertCircle : error.type === 'warning' ? AlertCircle : Info;
    return { ...error, Icon };
  };

  const errorDisplay = getErrorDisplay();

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
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">角色区分</h3>
                <p className="text-white/70">市民端/管理员端自动识别，定向推送工作台</p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white/10 backdrop-blur rounded-2xl">
            <h4 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> 演示账号
            </h4>
            <div className="space-y-2">
              {demoAccounts.map((acc, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-white/70">{acc.role}：</span>
                  <span className="font-mono text-white">{acc.phone} / {acc.password}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/20">
            <p className="text-white/50 text-sm">
              © 2024 南宁市大数据发展局 · 城市级公共服务操作系统
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 shadow-glow">
              邕
            </div>
            <h1 className="text-2xl font-bold text-gray-800">南宁城市服务</h1>
            <p className="text-gray-500">智慧城市·山水南宁</p>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">欢迎回来</h2>
                <p className="text-gray-500">请登录您的账号以使用城市服务</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                title="查看演示账号"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>

            {showDemoAccounts && (
              <div className="mb-6 p-4 bg-primary-50 rounded-2xl border border-primary-100">
                <h4 className="text-sm font-semibold text-primary-800 mb-3">快速选择演示账号：</h4>
                <div className="space-y-2">
                  {demoAccounts.map((acc, i) => (
                    <button
                      key={i}
                      onClick={() => fillDemoAccount(acc)}
                      className="w-full p-3 text-left bg-white rounded-xl hover:bg-primary-50/50 transition-colors border border-primary-100 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-gray-800">{acc.role}</span>
                        <span className="text-xs text-gray-500 ml-2">{acc.desc}</span>
                      </div>
                      <span className="text-xs font-mono text-primary-600">{acc.phone}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mb-8">
              {[
                { key: 'password', label: '密码登录', icon: Lock },
                { key: 'sms', label: '验证码', icon: Smartphone },
                { key: 'face', label: '刷脸', icon: Fingerprint },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setLoginType(tab.key as any); clearLoginError(); }}
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
                    : loginSuccess
                    ? 'bg-gradient-to-br from-eco-400 to-eco-500'
                    : 'bg-gray-100'
                )}>
                  {loginSuccess ? (
                    <CheckCircle className="w-16 h-16 text-white" />
                  ) : faceScanning ? (
                    <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border-4 border-white/50 border-t-white animate-spin"></div>
                    </div>
                  ) : (
                    <Fingerprint className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <p className="text-gray-600 mb-6">
                  {loginSuccess ? '登录成功，正在跳转...' : faceScanning ? '正在识别面部特征...' : '请将面部对准摄像头'}
                </p>
                <button
                  onClick={handleFaceLogin}
                  disabled={faceScanning || isLoading || loginSuccess}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-eco-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-glow transition-all duration-200 disabled:opacity-50"
                >
                  {faceScanning ? '识别中...' : loginSuccess ? '登录成功' : '开始人脸识别'}
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
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); clearLoginError(); }}
                      placeholder="请输入手机号"
                      maxLength={11}
                      className={cn(
                        'w-full pl-12 pr-4 py-3.5 border rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-200',
                        loginError && loginError !== 'SUCCESS'
                          ? 'bg-red-50 border-red-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                          : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                      )}
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
                        onChange={(e) => { setPassword(e.target.value); clearLoginError(); }}
                        placeholder="请输入密码"
                        className={cn(
                          'w-full pl-12 pr-12 py-3.5 border rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-200',
                          loginError && loginError !== 'SUCCESS'
                            ? 'bg-red-50 border-red-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                            : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                        )}
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
                          onChange={(e) => { setSmsCode(e.target.value.replace(/\D/g, '')); clearLoginError(); }}
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

                {errorDisplay && (
                  <div className={cn(
                    'p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300',
                    errorDisplay.type === 'error' && 'bg-red-50 border border-red-100',
                    errorDisplay.type === 'warning' && 'bg-warm-50 border border-warm-100',
                    errorDisplay.type === 'info' && 'bg-eco-50 border border-eco-100'
                  )}>
                    <errorDisplay.Icon className={cn(
                      'w-5 h-5 flex-shrink-0 mt-0.5',
                      errorDisplay.type === 'error' && 'text-red-500',
                      errorDisplay.type === 'warning' && 'text-warm-500',
                      errorDisplay.type === 'info' && 'text-eco-500'
                    )} />
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        errorDisplay.type === 'error' && 'text-red-800',
                        errorDisplay.type === 'warning' && 'text-warm-800',
                        errorDisplay.type === 'info' && 'text-eco-800'
                      )}>
                        {errorDisplay.title}
                      </p>
                      <p className={cn(
                        'text-sm mt-0.5',
                        errorDisplay.type === 'error' && 'text-red-600',
                        errorDisplay.type === 'warning' && 'text-warm-600',
                        errorDisplay.type === 'info' && 'text-eco-600'
                      )}>
                        {errorDisplay.message}
                      </p>
                    </div>
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
                  disabled={isLoading || loginSuccess}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-glow transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loginSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      登录成功，正在跳转...
                    </>
                  ) : isLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      登录中...
                    </>
                  ) : (
                    '登 录'
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
              还没有账号? <button className="text-primary-600 hover:text-primary-700 font-medium ml-1">立即注册</button>
            </div>

            <div className="lg:hidden mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-600 text-center">
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
