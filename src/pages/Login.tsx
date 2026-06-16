import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Phone, Lock, Shield, Smartphone, Eye, EyeOff, Fingerprint, AlertCircle, CheckCircle, Info, UserCog, LogIn, Check, ArrowRight
} from 'lucide-react';
import { useAuthStore, LoginErrorCode } from '@/store/useAuthStore';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';

const errorMessages: Record<LoginErrorCode, {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  statusCode?: string;
  suggestion?: string;
}> = {
  SUCCESS: { title: '登录成功', message: '身份核验通过，正在跳转至对应工作台...', type: 'info' },
  ACCOUNT_NOT_FOUND: { 
    title: '账号未注册', 
    message: '该手机号尚未在南宁城市服务平台注册，请先完成实名认证注册', 
    type: 'error',
    statusCode: 'ACCOUNT_NOT_FOUND',
    suggestion: '您可以使用身份证号前往市民中心完成线下注册'
  },
  PASSWORD_ERROR: { 
    title: '密码校验未通过', 
    message: '您输入的密码不正确，请检查后重试', 
    type: 'error',
    statusCode: 'PASSWORD_ERROR',
    suggestion: '连续输错5次将锁定账号30分钟，可通过验证码登录或找回密码'
  },
  VERIFY_CODE_ERROR: {
    title: '验证码校验失败',
    message: '验证码错误或已过期，请重新获取',
    type: 'error',
    statusCode: 'VERIFY_CODE_ERROR',
    suggestion: '演示模式下可使用固定验证码 123456'
  },
  FACE_VERIFY_FAILED: {
    title: '人脸验证未通过',
    message: '未能识别到匹配的身份信息，请调整光线和角度后重试',
    type: 'error',
    statusCode: 'FACE_VERIFY_FAILED',
    suggestion: '请确保面部完整出现在取景框内，光线充足，无帽子口罩遮挡'
  },
  INSUFFICIENT_PERMISSIONS: { 
    title: '权限不足', 
    message: '该账号角色无系统访问权限', 
    type: 'warning',
    statusCode: 'INSUFFICIENT_PERMISSIONS',
    suggestion: '请联系管理员开通对应角色权限'
  },
  NETWORK_ERROR: { 
    title: '网络连接异常', 
    message: '无法连接城市服务网关，请检查网络设置', 
    type: 'error',
    statusCode: 'NETWORK_ERROR',
    suggestion: '请检查网络连接，或稍后重试'
  },
  UNKNOWN_ERROR: { 
    title: '身份校验失败', 
    message: '认证服务暂不可用，请稍后重试', 
    type: 'error',
    statusCode: 'UNKNOWN_ERROR',
    suggestion: '请稍后重试，如持续出现此问题请联系客服'
  },
};

const demoAccounts: Array<{
  phone: string;
  password: string;
  role: string;
  roleLabel: string;
  desc: string;
  color: string;
}> = [
  { 
    phone: '13800138001', 
    password: '123456', 
    role: 'citizen', 
    roleLabel: '市民端',
    desc: '完整民生服务：BRT乘车、挂号缴费、入学报名、违章查询、智慧停车、12345诉求、政策查阅',
    color: 'eco'
  },
  { 
    phone: '13900139000', 
    password: 'admin123', 
    role: 'admin', 
    roleLabel: '管理端',
    desc: '城市体征监测、服务编排引擎、工单分拨调度、政策AI解读、数据大屏',
    color: 'warm'
  },
  { 
    phone: '13800138002', 
    password: '123456', 
    role: 'clerk', 
    roleLabel: '办事员端',
    desc: '12345工单接收处置、诉求分拨处理、服务事项办理、政策解读推送',
    color: 'primary'
  },
];

const NON_DIGIT_REGEX = new RegExp('[^0-9]', 'g');

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginBySms, loginByFace, sendSmsCode, isLoading, isAuthenticated, user, loginError, clearLoginError } = useAuthStore();

  const [phone, setPhone] = useState('13800138001');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'password' | 'face' | 'sms'>('password');
  const [smsCode, setSmsCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [faceScanning, setFaceScanning] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginAuditInfo, setLoginAuditInfo] = useState<{
    label: string;
    status: string;
    role?: string;
    detail?: string;
  } | null>(null);
  const [detectedRole, setDetectedRole] = useState<string | null>(null);
  const [verifySteps, setVerifySteps] = useState<{
    accountValid: 'pending' | 'pass' | 'fail';
    credentialValid: 'pending' | 'pass' | 'fail';
    roleMatched: 'pending' | 'pass' | 'fail';
  }>({ accountValid: 'pending', credentialValid: 'pending', roleMatched: 'pending' });

  const from = (location.state as any)?.from?.pathname || null;

  const navigateByRole = useCallback((role: string) => {
    const target = from
      ? from
      : role === 'admin'
        ? '/admin-workbench'
        : role === 'clerk'
          ? '/ticket-dispatch'
          : '/';
    const token = localStorage.getItem('token');
    const hasAuth = useAuthStore.getState().isAuthenticated;
    if (hasAuth || token) {
      try {
        window.location.replace(target);
      } catch {
        navigate(target, { replace: true });
      }
    } else {
      setTimeout(() => navigateByRole(role), 100);
    }
  }, [from, navigate]);

  useEffect(() => {
    if (isAuthenticated && user && loginSuccess) {
      const timer = setTimeout(() => {
        navigateByRole(user.role);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, loginSuccess, navigateByRole]);

  useEffect(() => {
    if (loginError && loginError !== 'SUCCESS') {
      const errMsg = errorMessages[loginError];
      setLoginAuditInfo(prev => ({
        ...prev,
        label: prev?.label || '身份核验',
        status: '未通过',
        detail: errMsg?.message || '未知错误',
      }));
    }
  }, [loginError]);

  useEffect(() => {
    if (phone.length === 11) {
      const matched = demoAccounts.find(acc => acc.phone === phone);
      if (matched) {
        setDetectedRole(matched.role);
      } else {
        setDetectedRole(null);
      }
    } else {
      setDetectedRole(null);
    }
  }, [phone]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendSms = async () => {
    if (phone.length !== 11 || countdown > 0) return;
    
    setLoginAuditInfo({ label: '验证码发送中', status: '处理中' });
    const result = await sendSmsCode(phone);
    
    if (result.success) {
      setCountdown(60);
      setLoginAuditInfo({ label: '验证码已发送', status: '通过' });
    } else {
      setLoginAuditInfo({ label: '验证码发送失败', status: '未通过', role: result.message });
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val.replace(NON_DIGIT_REGEX, ''));
    clearLoginError();
    setLoginAuditInfo(null);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    clearLoginError();
    setLoginAuditInfo(null);
  };

  const handleSmsCodeChange = (val: string) => {
    setSmsCode(val.replace(NON_DIGIT_REGEX, ''));
    clearLoginError();
    setLoginAuditInfo(null);
  };

  const handleFaceLogin = async () => {
    setFaceScanning(true);
    clearLoginError();
    setVerifySteps({ accountValid: 'pending', credentialValid: 'pending', roleMatched: 'pending' });
    setLoginAuditInfo({ label: '身份核验中', status: '处理中', detail: '正在采集面部特征...' });

    try {
      const result = await loginByFace('mock_face_image_base64');
      if (result.success && result.user) {
        setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'pass' });
        const roleName = result.user.role === 'admin' ? '管理员' : result.user.role === 'clerk' ? '办事员' : '市民';
        setLoginAuditInfo({
          label: '人脸核验通过',
          status: '通过',
          role: `${roleName}（${result.user.name}）`,
          detail: `面部特征匹配成功，正在跳转至${roleName}工作台...`,
        });
        setLoginSuccess(true);
        setTimeout(() => navigateByRole(result.user.role), 300);
      } else {
        setFaceScanning(false);
        setVerifySteps({ accountValid: 'pass', credentialValid: 'fail', roleMatched: 'pending' });
        setLoginAuditInfo({ label: '人脸核验', status: '未通过', detail: '面部特征匹配度不足，请调整光线和角度后重试' });
      }
    } catch (e: any) {
      setFaceScanning(false);
      setVerifySteps({ accountValid: 'fail', credentialValid: 'fail', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '人脸核验异常', status: '未通过', detail: e?.message || '识别服务异常' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginError();
    setVerifySteps({ accountValid: 'pending', credentialValid: 'pending', roleMatched: 'pending' });
    setLoginAuditInfo({ label: '账号校验中', status: '处理中', detail: '正在检测账号状态...' });

    if (!phone || phone.length !== 11) {
      setVerifySteps({ accountValid: 'fail', credentialValid: 'pending', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '手机号校验', status: '未通过', detail: '请输入11位手机号' });
      return;
    }

    if (loginType === 'password' && !password) {
      setVerifySteps({ accountValid: 'pending', credentialValid: 'fail', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '密码校验', status: '未通过', detail: '请输入密码' });
      return;
    }

    if (loginType === 'sms' && !smsCode) {
      setVerifySteps({ accountValid: 'pending', credentialValid: 'fail', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '验证码校验', status: '未通过', detail: '请输入验证码' });
      return;
    }

    setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'pending' });
    setLoginAuditInfo({ label: '身份核验中', status: '处理中', detail: '正在验证凭据并识别角色...' });

    let result: { success: boolean; code: LoginErrorCode; user?: any };
    if (loginType === 'password') {
      result = await login(phone, password);
    } else if (loginType === 'sms') {
      result = await loginBySms(phone, smsCode);
    } else {
      return;
    }

    if (result.success && result.user) {
      setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'pass' });
      const roleName = result.user.role === 'admin' ? '管理员' : result.user.role === 'clerk' ? '办事员' : '市民';
      setLoginAuditInfo({
        label: '身份核验通过',
        status: '通过',
        role: `${roleName}（${result.user.name}）`,
        detail: `账号有效 · 凭据校验通过 · 角色权限已匹配，正在跳转至${roleName}工作台...`,
      });
      setLoginSuccess(true);
      setTimeout(() => navigateByRole(result.user.role), 300);
    } else {
      const errorCode = result.code;
      const accountFound = demoAccounts.some(a => a.phone === phone);
      const matchedAcc = demoAccounts.find(a => a.phone === phone);
      const expectedRole = matchedAcc ? (matchedAcc.role === 'admin' ? '管理员' : matchedAcc.role === 'clerk' ? '办事员' : '市民') : null;

      if (errorCode === 'ACCOUNT_NOT_FOUND') {
        setVerifySteps({ accountValid: 'fail', credentialValid: 'pending', roleMatched: 'pending' });
        setLoginAuditInfo({
          label: '账号校验',
          status: '未通过',
          detail: `该手机号未在南宁城市服务平台注册（账号无效），无法进行角色匹配`,
        });
      } else if (errorCode === 'PASSWORD_ERROR') {
        setVerifySteps({ accountValid: 'pass', credentialValid: 'fail', roleMatched: 'pending' });
        setLoginAuditInfo({
          label: '凭据校验',
          status: '未通过',
          role: expectedRole ? `识别角色：${expectedRole}` : '识别账号：已注册',
          detail: `账号有效（已识别为${expectedRole || '市民'}角色），但密码校验未通过`,
        });
      } else if (errorCode === 'VERIFY_CODE_ERROR') {
        setVerifySteps({ accountValid: 'pass', credentialValid: 'fail', roleMatched: 'pending' });
        setLoginAuditInfo({
          label: '凭据校验',
          status: '未通过',
          role: expectedRole ? `识别角色：${expectedRole}` : '识别账号：已注册',
          detail: `账号有效（已识别为${expectedRole || '市民'}角色），但验证码错误或已过期`,
        });
      } else if (errorCode === 'FACE_VERIFY_FAILED') {
        setVerifySteps({ accountValid: accountFound ? 'pass' : 'pending', credentialValid: 'fail', roleMatched: 'pending' });
        setLoginAuditInfo({
          label: '人脸核验',
          status: '未通过',
          role: expectedRole ? `检测角色：${expectedRole}` : undefined,
          detail: `面部特征匹配度不足（<92%），身份核验未通过`,
        });
      } else if (errorCode === 'INSUFFICIENT_PERMISSIONS') {
        setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'fail' });
        setLoginAuditInfo({
          label: '角色匹配',
          status: '未通过',
          detail: `账号和凭据均有效，但该账号无系统访问权限（角色不匹配）`,
        });
      } else {
        setVerifySteps({ accountValid: accountFound ? 'pass' : 'pending', credentialValid: 'pending', roleMatched: 'pending' });
        setLoginAuditInfo({
          label: '身份核验',
          status: '未通过',
          detail: errorCode === 'NETWORK_ERROR' ? '网络连接异常，请检查网络后重试' : '认证服务异常，请稍后重试',
        });
      }
    }
  };

  const fillDemoAccount = (account: typeof demoAccounts[0]) => {
    setPhone(account.phone);
    setPassword(account.password);
    setLoginType('password');
    setDetectedRole(account.role);
    setVerifySteps({ accountValid: 'pending', credentialValid: 'pending', roleMatched: 'pending' });
    clearLoginError();
    setLoginAuditInfo(null);
    setLoginSuccess(false);
  };

  const getErrorDisplay = () => {
    if (loginSuccess) {
      const info = errorMessages.SUCCESS;
      return { ...info, Icon: CheckCircle };
    }
    if (!loginError) return null;
    const error = errorMessages[loginError];
    if (!error) return null;
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
            <p className="text-xl text-white/80 font-light">智慧城市 · 山水南宁</p>
          </div>
          
          <div className="space-y-6">
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
                <h3 className="text-lg font-semibold mb-1">一网通办 · 一码通行</h3>
                <p className="text-white/70">交通、医疗、教育、政务、城管，一站式服务</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">角色智能识别</h3>
                <p className="text-white/70">市民端 / 管理员端 / 办事员端，系统自动识别角色权限定向工作台</p>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-3">
            <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> 角色权限说明
            </h4>
            <div className="space-y-3">
              {demoAccounts.map((acc, i) => (
                <div
                  key={i}
                  className={cn(
                    'p-4 rounded-2xl backdrop-blur border transition-all',
                    acc.color === 'eco' ? 'bg-eco-400/20 border-eco-300/30' : 
                    acc.color === 'primary' ? 'bg-primary-400/20 border-primary-300/30' :
                    'bg-warm-400/20 border-warm-300/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{acc.roleLabel}</span>
                    <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-full">
                      {acc.phone} / {acc.password}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">{acc.desc}</p>
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

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4 shadow-glow">
              邕
            </div>
            <h1 className="text-2xl font-bold text-gray-800">南宁城市服务</h1>
            <p className="text-gray-500">智慧城市 · 山水南宁</p>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">统一身份认证</h2>
                <p className="text-gray-500 text-sm mt-1">南宁城市服务 · 一网通办入口</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  showDemoAccounts ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:bg-gray-100'
                )}
                title="快速选择演示账号"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>

            {showDemoAccounts && (
              <div className="mb-6 space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 mb-2">快速登录（点击自动填充）：</h4>
                {demoAccounts.map((acc, i) => (
                  <button
                    key={i}
                    onClick={() => fillDemoAccount(acc)}
                    className={cn(
                      'w-full p-3 text-left rounded-xl transition-all border hover:shadow-md flex items-center gap-3',
                      phone === acc.phone 
                        ? 'border-primary-300 bg-primary-50 shadow-sm'
                        : 'border-gray-100 bg-gray-50 hover:border-primary-200 hover:bg-white'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      acc.color === 'eco' && 'bg-eco-100 text-eco-600',
                      acc.color === 'warm' && 'bg-warm-100 text-warm-600',
                      acc.color === 'primary' && 'bg-primary-100 text-primary-600'
                    )}>
                      {acc.role === 'citizen' ? <UserCog className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 text-sm">{acc.roleLabel}</span>
                        {phone === acc.phone && <Check className="w-4 h-4 text-primary-500" />}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{acc.phone}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-6 bg-gray-50 p-1 rounded-xl">
              {[
                { key: 'password', label: '密码登录', icon: Lock },
                { key: 'sms', label: '验证码', icon: Smartphone },
                { key: 'face', label: '刷脸', icon: Fingerprint },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setLoginType(tab.key as any); clearLoginError(); setLoginAuditInfo(null); }}
                  className={cn(
                    'flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1.5',
                    loginType === tab.key
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {loginType === 'face' ? (
              <div className="text-center py-6">
                <div className={cn(
                  'w-36 h-36 rounded-full mx-auto mb-5 flex items-center justify-center transition-all duration-500 relative',
                  faceScanning
                    ? 'bg-gradient-to-br from-primary-400 to-eco-400 animate-pulse-slow'
                    : loginSuccess
                    ? 'bg-gradient-to-br from-eco-400 to-eco-500'
                    : 'bg-gray-100'
                )}>
                  {loginSuccess ? (
                    <CheckCircle className="w-14 h-14 text-white" />
                  ) : faceScanning ? (
                    <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full border-4 border-white/60 border-t-white animate-spin"></div>
                    </div>
                  ) : (
                    <Fingerprint className="w-14 h-14 text-gray-400" />
                  )}
                  {faceScanning && (
                    <div className="absolute inset-0 rounded-full border-2 border-primary-300 animate-ping opacity-50"></div>
                  )}
                </div>
                <p className="text-gray-700 mb-5 font-medium">
                  {loginSuccess ? '登录成功，正在跳转...' : faceScanning ? '正在识别面部特征，请保持面部在取景框内...' : '请将面部对准摄像头'}
                </p>
                <button
                  onClick={handleFaceLogin}
                  disabled={faceScanning || isLoading || loginSuccess}
                  className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-eco-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-glow transition-all duration-200 disabled:opacity-50"
                >
                  {faceScanning ? '识别中...' : loginSuccess ? '登录成功' : '开始人脸识别'}
                </button>
                <p className="text-xs text-gray-400 mt-4">人脸识别成功后将自动完成身份核验</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">手机号 <span className="text-gray-400 text-xs">（已实名认证手机号）</span></label>
                    {detectedRole && (
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        detectedRole === 'admin' 
                          ? 'bg-warm-100 text-warm-600' 
                          : detectedRole === 'clerk'
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-eco-100 text-eco-600'
                      )}>
                        已识别：{detectedRole === 'admin' ? '管理员' : detectedRole === 'clerk' ? '办事员' : '市民'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="请输入11位手机号"
                      maxLength={24}
                      className={cn(
                        'w-full pl-12 pr-4 py-3 border rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-200 text-sm',
                        loginError && loginError !== 'SUCCESS' && loginError === 'ACCOUNT_NOT_FOUND'
                          ? 'bg-red-50 border-red-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                          : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500'
                      )}
                    />
                  </div>
                </div>

                {loginType === 'password' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">登录密码</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        placeholder="请输入登录密码"
                        className={cn(
                          'w-full pl-12 pr-12 py-3 border rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none transition-all duration-200 text-sm',
                          loginError && loginError !== 'SUCCESS' && loginError === 'PASSWORD_ERROR'
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">短信验证码</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={smsCode}
                          onChange={(e) => handleSmsCodeChange(e.target.value)}
                          placeholder="6位数字验证码"
                          maxLength={6}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendSms}
                        disabled={countdown > 0 || phone.length !== 11}
                        className={cn(
                          'px-5 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-all duration-200',
                          countdown > 0 || phone.length !== 11
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                        )}
                      >
                        {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
                      </button>
                    </div>
                    <p className="text-xs text-eco-600 mt-2 bg-eco-50 px-2 py-1 rounded">💡 演示模式：使用固定验证码 <span className="font-mono font-semibold">123456</span> 即可登录</p>
                  </div>
                )}

                {loginAuditInfo && (
                  <div className={cn(
                    'p-3 rounded-xl',
                    loginAuditInfo.status === '通过' ? 'bg-eco-50 border border-eco-100' :
                    loginAuditInfo.status === '处理中' ? 'bg-primary-50 border border-primary-100' :
                    'bg-warm-50 border border-warm-100'
                  )}>
                    <div className="flex items-start gap-2.5">
                      {loginAuditInfo.status === '通过' ? (
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-eco-500" />
                      ) : loginAuditInfo.status === '处理中' ? (
                        <div className="w-5 h-5 mt-0.5 flex-shrink-0 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-warm-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800">{loginAuditInfo.label}</span>
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded font-medium',
                            loginAuditInfo.status === '通过' ? 'bg-eco-100 text-eco-700' :
                            loginAuditInfo.status === '处理中' ? 'bg-primary-100 text-primary-700' :
                            'bg-warm-100 text-warm-700'
                          )}>
                            {loginAuditInfo.status}
                          </span>
                          {loginAuditInfo.role && (
                            <span className={cn(
                              'text-xs px-1.5 py-0.5 rounded font-medium',
                              loginAuditInfo.status === '通过' ? 'bg-eco-100 text-eco-700' : 'bg-gray-100 text-gray-600'
                            )}>
                              {loginAuditInfo.role}
                            </span>
                          )}
                        </div>
                        {loginAuditInfo.detail && (
                          <p className={cn(
                            'text-xs mt-1',
                            loginAuditInfo.status === '通过' ? 'text-eco-600' :
                            loginAuditInfo.status === '处理中' ? 'text-primary-600' :
                            'text-warm-600'
                          )}>
                            {loginAuditInfo.detail}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-200/50">
                      <p className="text-xs font-medium text-gray-500 mb-1.5">身份核验进度</p>
                      <div className="space-y-1">
                        {[
                          { key: 'accountValid' as const, label: '账号有效性', passLabel: '账号有效' },
                          { key: 'credentialValid' as const, label: loginType === 'password' ? '密码校验' : loginType === 'sms' ? '验证码校验' : '人脸核验', passLabel: '凭据通过' },
                          { key: 'roleMatched' as const, label: '角色权限识别', passLabel: '角色已匹配' },
                        ].map(step => {
                          const status = verifySteps[step.key];
                          return (
                            <div key={step.key} className="flex items-center gap-2">
                              <div className={cn(
                                'w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0',
                                status === 'pass' && 'bg-eco-100',
                                status === 'fail' && 'bg-red-100',
                                status === 'pending' && 'bg-gray-100'
                              )}>
                                {status === 'pass' && <Check className="w-2.5 h-2.5 text-eco-500" />}
                                {status === 'fail' && <AlertCircle className="w-2.5 h-2.5 text-red-500" />}
                                {status === 'pending' && <span className="w-2 h-2 rounded-full bg-gray-300"></span>}
                              </div>
                              <span className={cn(
                                'text-xs',
                                status === 'pass' && 'text-eco-700 font-medium',
                                status === 'fail' && 'text-red-600',
                                status === 'pending' && 'text-gray-400'
                              )}>
                                {status === 'pass' ? step.passLabel : status === 'fail' ? `${step.label}未通过` : step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {errorDisplay && loginAuditInfo && loginAuditInfo.status === '未通过' && (
                  <div className={cn(
                    'rounded-xl overflow-hidden',
                    errorDisplay.type === 'error' && 'border border-red-100',
                    errorDisplay.type === 'warning' && 'border border-warm-100',
                    errorDisplay.type === 'info' && 'border border-eco-100'
                  )}>
                    <div className={cn(
                      'p-3 flex items-start gap-3',
                      errorDisplay.type === 'error' && 'bg-red-50',
                      errorDisplay.type === 'warning' && 'bg-warm-50',
                      errorDisplay.type === 'info' && 'bg-eco-50'
                    )}>
                      <errorDisplay.Icon className={cn(
                        'w-4 h-4 flex-shrink-0 mt-0.5',
                        errorDisplay.type === 'error' && 'text-red-500',
                        errorDisplay.type === 'warning' && 'text-warm-500',
                        errorDisplay.type === 'info' && 'text-eco-500'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            'text-xs font-semibold',
                            errorDisplay.type === 'error' && 'text-red-800',
                            errorDisplay.type === 'warning' && 'text-warm-800',
                            errorDisplay.type === 'info' && 'text-eco-800'
                          )}>
                            {errorDisplay.title}
                          </p>
                          {errorDisplay.statusCode && (
                            <span className="text-[10px] font-mono bg-white/60 px-1 py-0.5 rounded text-gray-500">
                              #{errorDisplay.statusCode}
                            </span>
                          )}
                        </div>
                        <p className={cn(
                          'text-xs mt-0.5',
                          errorDisplay.type === 'error' && 'text-red-600',
                          errorDisplay.type === 'warning' && 'text-warm-600',
                          errorDisplay.type === 'info' && 'text-eco-600'
                        )}>
                          {errorDisplay.message}
                        </p>
                      </div>
                    </div>
                    {errorDisplay.suggestion && (
                      <div className="px-3 py-2 bg-white border-t border-gray-100">
                        <div className="flex items-start gap-1.5">
                          <Info className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-gray-500">{errorDisplay.suggestion}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                    <span className="text-gray-600">保持登录状态 24 小时</span>
                  </label>
                  <button type="button" className="text-primary-600 hover:text-primary-700 font-medium">
                    忘记密码?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || loginSuccess}
                  className={cn(
                    'w-full py-3.5 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2',
                    loginSuccess
                      ? 'bg-gradient-to-r from-eco-500 to-eco-600'
                      : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:shadow-lg hover:shadow-glow'
                  )}
                >
                  {loginSuccess ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      认证通过 · 进入工作台
                    </>
                  ) : isLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      身份核验中...
                    </>
                  ) : loginType === 'sms' ? '验证码登录' : '密码登录'}
                </button>
              </form>
            )}

            <div className="mt-5 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex-1 h-px bg-gray-100"></div>
                <span className="px-3 text-xs text-gray-400">其他登录方式</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>
              <div className="mt-4 flex justify-center gap-6">
                <button type="button" onClick={() => setLoginType('face')} className={cn(
                  'flex flex-col items-center gap-1.5 text-xs',
                  loginType === 'face' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'
                )}>
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    loginType === 'face' ? 'bg-primary-100' : 'bg-gray-100'
                  )}>
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  刷脸
                </button>
                <button
                  type="button"
                  disabled={isLoading || loginSuccess}
                  onClick={() => {
                    const acc = demoAccounts[0];
                    fillDemoAccount(acc);
                    setTimeout(() => {
                      useAuthStore.getState().login(acc.phone, acc.password).then(res => {
                        if (res.success && res.user) {
                          const roleName = res.user.role === 'admin' ? '管理员' : res.user.role === 'clerk' ? '办事员' : '市民';
                          setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'pass' });
                          setLoginAuditInfo({
                            label: '爱南宁快捷登录',
                            status: '通过',
                            role: `${roleName}（${res.user.name}）`,
                            detail: `通过爱南宁APP一键授权完成身份核验，正在跳转至${roleName}工作台...`,
                          });
                          setLoginSuccess(true);
                          setTimeout(() => navigateByRole(res.user.role), 300);
                        }
                      });
                    }, 100);
                  }}
                  className="flex flex-col items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  爱南宁
                </button>
                <button
                  type="button"
                  disabled={isLoading || loginSuccess}
                  onClick={() => {
                    const acc = demoAccounts[0];
                    setLoginType('sms');
                    fillDemoAccount(acc);
                    setSmsCode('123456');
                    setTimeout(() => {
                      useAuthStore.getState().loginBySms(acc.phone, '123456').then(res => {
                        if (res.success && res.user) {
                          const roleName = res.user.role === 'admin' ? '管理员' : res.user.role === 'clerk' ? '办事员' : '市民';
                          setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'pass' });
                          setLoginAuditInfo({
                            label: '电子证照核验',
                            status: '通过',
                            role: `${roleName}（${res.user.name}）`,
                            detail: `通过电子证照完成身份核验（身份证已验证），正在跳转至${roleName}工作台...`,
                          });
                          setLoginSuccess(true);
                          setTimeout(() => navigateByRole(res.user.role), 300);
                        }
                      });
                    }, 100);
                  }}
                  className="flex flex-col items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  电子证照
                </button>
              </div>
            </div>

            <div className="mt-5 text-center text-xs text-gray-500">
              登录即表示同意 <button className="text-primary-600 hover:underline">《用户服务协议》</button>
              <span className="mx-1">和</span>
              <button className="text-primary-600 hover:underline">《隐私政策》</button>
            </div>

            <div className="lg:hidden mt-4 p-3 bg-gray-50 rounded-xl text-xs">
              <p className="text-gray-600 text-center leading-relaxed">
                <strong>市民端：</strong>13800138001 / 123456<br />
                <strong>管理端：</strong>13900139000 / admin123<br />
                <strong>办事员：</strong>13800138002 / 123456
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
