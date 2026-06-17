import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Shield,
  Camera,
  QrCode,
  Building2,
  MapPin,
  Heart,
  GraduationCap,
  Bus,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  X,
  Phone,
  ScanFace,
  Landmark,
} from 'lucide-react';
import { useAuthStore, type LoginErrorCode } from '@/store/useAuthStore';
import { api } from '@/api/client';
import type { UserIdentity } from '../../shared/types';

const errorMessages: Record<string, { title: string; message: string; hint?: string }> = {
  ACCOUNT_NOT_FOUND: {
    title: '账号不存在',
    message: '该手机号未在南宁城市服务平台注册',
    hint: '请检查手机号是否正确，或联系客服完成实名认证',
  },
  PASSWORD_ERROR: {
    title: '密码错误',
    message: '您输入的密码不正确',
    hint: '请检查密码大小写是否正确，或点击"忘记密码"找回',
  },
  VERIFY_CODE_ERROR: {
    title: '验证码错误',
    message: '验证码错误或已过期',
    hint: '请重新获取验证码，注意区分大小写',
  },
  FACE_VERIFY_FAILED: {
    title: '人脸核验失败',
    message: '面部特征与预留信息不匹配',
    hint: '请调整光线和角度，确保面部完整清晰',
  },
  INSUFFICIENT_PERMISSIONS: {
    title: '权限不足',
    message: '您的账号无此系统的访问权限',
    hint: '请联系管理员开通对应角色权限分配',
  },
  NETWORK_ERROR: {
    title: '网络连接异常',
    message: '无法连接到认证服务器',
    hint: '请检查网络连接后重试',
  },
  UNKNOWN_ERROR: {
    title: '认证失败',
    message: '身份认证过程中出现未知错误',
    hint: '请稍后重试，或联系技术支持',
  },
};

const demoAccounts = [
  {
    phone: '13800138001',
    password: '123456',
    role: 'citizen',
    name: '张三（市民）',
    desc: '市民端·全功能体验',
    color: 'from-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    phone: '13900139000',
    password: 'admin123',
    role: 'admin',
    name: '管理员',
    desc: '管理端·城市运营总览',
    color: 'from-blue-500',
    bg: 'bg-blue-50',
  },
  {
    phone: '13800138002',
    password: '123456',
    role: 'clerk',
    name: '办事员',
    desc: '办事员端·工单分拨处理',
    color: 'from-orange-500',
    bg: 'bg-orange-50',
  },
];

const quickServices = [
  { icon: Bus, label: 'BRT乘车', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Heart, label: '预约挂号', color: 'text-rose-600', bg: 'bg-rose-50' },
  { icon: GraduationCap, label: '入学报名', color: 'text-purple-600', bg: 'bg-purple-50' },
  { icon: FileText, label: '违章查询', color: 'text-amber-600', bg: 'bg-amber-50' },
  { icon: Building2, label: '智慧停车', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { icon: Shield, label: '证件办理', color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

const NON_DIGIT_REGEX = new RegExp('[^0-9]', 'g');

const getRoleName = (role: string) => {
  if (role === 'admin') return '管理员';
  if (role === 'clerk') return '办事员';
  return '市民';
};

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
  const [submitClicked, setSubmitClicked] = useState(false);

  const from = (location.state as any)?.from?.pathname || null;

  const getTargetPath = (role: string) => {
    if (from) return from;
    if (role === 'admin') return '/admin-workbench';
    if (role === 'clerk') return '/ticket-dispatch';
    return '/';
  };

  const forceRedirectWithRetry = (role: string, attempt = 0) => {
    const target = getTargetPath(role);
    const MAX_ATTEMPTS = 5;

    // eslint-disable-next-line no-console
    console.log(`[LOGIN REDIRECT] attempt=${attempt + 1}/${MAX_ATTEMPTS} role=${role} target=${target}`, {
      token: localStorage.getItem('token') ? 'EXISTS' : 'MISSING',
      isAuthenticated: useAuthStore.getState().isAuthenticated,
      user: useAuthStore.getState().user?.name || null,
      pathname: window.location.pathname,
    });

    if (attempt === 0) {
      // 第1次：优先用硬跳转（最可靠）
      try { window.location.replace(target); } catch (e) { /* noop */ }
    }

    setTimeout(() => {
      const currentPath = window.location.pathname;
      const stillOnLogin = currentPath.startsWith('/login');
      const token = localStorage.getItem('token');

      // eslint-disable-next-line no-console
      console.log(`[LOGIN CHECK] attempt=${attempt + 1} stillOnLogin=${stillOnLogin} token=${token ? 'YES' : 'NO'} path=${currentPath}`);

      if (!stillOnLogin) {
        // eslint-disable-next-line no-console
        console.log('[LOGIN SUCCESS] Redirect completed! Now on:', currentPath);
        return;
      }

      if (!token && attempt < MAX_ATTEMPTS) {
        // eslint-disable-next-line no-console
        console.warn('[LOGIN WARN] Token disappeared! Retrying state sync...');
        const demoFallback: UserIdentity = {
          id: 'citizen-001',
          name: '张三',
          idCard: '450101199001010001',
          phone: '13800138001',
          email: 'zhangsan@example.com',
          realNameVerified: true,
          faceVerified: true,
          role: 'citizen',
        };
        localStorage.setItem('token', 'demo-session');
        useAuthStore.setState({ user: demoFallback, token: 'demo-session', isAuthenticated: true });
      }

      if (attempt >= MAX_ATTEMPTS) {
        // eslint-disable-next-line no-console
        console.error('[LOGIN FATAL] Max redirect attempts reached, forcing hard reload...');
        window.location.href = target + '?autorefresh=1';
        return;
      }

      // 继续尝试不同的跳转方式
      try {
        navigate(target, { replace: true });
      } catch (e) { /* noop */ }

      try {
        if (attempt % 2 === 0) {
          window.location.href = target;
        } else {
          window.location.replace(target);
        }
      } catch (e) { /* noop */ }

      forceRedirectWithRetry(role, attempt + 1);
    }, 200 + attempt * 100);
  };

  useEffect(() => {
    if (isAuthenticated && user && loginSuccess) {
      forceRedirectWithRetry(user.role);
    }
  }, [isAuthenticated, user, loginSuccess]);

  useEffect(() => {
    if (isAuthenticated && user && !loginSuccess) {
      setLoginSuccess(true);
      setLoginAuditInfo({
        label: '已登录',
        status: '通过',
        role: `${getRoleName(user.role)}（${user.name}）`,
        detail: '检测到已有登录状态，正在跳转...',
      });
    }
  }, [isAuthenticated, user]);

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

  const clearLoginErrorWrapper = () => {
    clearLoginError();
    setLoginAuditInfo(null);
    setLoginSuccess(false);
    setSubmitClicked(false);
  };

  const handleFaceLogin = async () => {
    clearLoginErrorWrapper();
    setFaceScanning(true);
    setVerifySteps({ accountValid: 'pending', credentialValid: 'pending', roleMatched: 'pending' });
    setLoginAuditInfo({ label: '身份核验中', status: '处理中', detail: '正在采集面部特征...' });

    try {
      const result = await loginByFace('data:image/jpeg;base64,demo_face_image');

      if (result.success && result.user) {
        setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'pass' });
        const roleName = getRoleName(result.user.role);
        setLoginAuditInfo({
          label: '人脸核验通过',
          status: '通过',
          role: `${roleName}（${result.user.name}）`,
          detail: `面部特征匹配 · 身份确认 · 角色权限已匹配，正在跳转...`,
        });
        setLoginSuccess(true);
        forceRedirectWithRetry(result.user.role);
      } else {
        const code = result.code;
        if (code === 'ACCOUNT_NOT_FOUND') {
          setVerifySteps({ accountValid: 'fail', credentialValid: 'pending', roleMatched: 'pending' });
          setLoginAuditInfo({ label: '账号校验', status: '未通过', detail: '未找到匹配的面部身份档案' });
        } else {
          setVerifySteps({ accountValid: 'pass', credentialValid: 'fail', roleMatched: 'pending' });
          setLoginAuditInfo({ label: '人脸核验', status: '未通过', detail: '面部特征匹配度不足，请调整光线和角度后重试' });
        }
      }
    } catch {
      setVerifySteps({ accountValid: 'pending', credentialValid: 'fail', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '人脸核验', status: '未通过', detail: '人脸识别服务暂不可用，请使用其他方式登录' });
    } finally {
      setFaceScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginErrorWrapper();
    setSubmitClicked(true);
    setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'pending' });
    setLoginAuditInfo({ label: '身份核验中', status: '处理中', detail: '正在验证账号和密码...' });

    if (!phone || phone.length !== 11) {
      setVerifySteps({ accountValid: 'fail', credentialValid: 'pending', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '手机号校验', status: '未通过', detail: '请输入11位手机号' });
      return;
    }

    if (loginType === 'password' && !password) {
      setVerifySteps({ accountValid: 'pass', credentialValid: 'fail', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '密码校验', status: '未通过', detail: '请输入密码' });
      return;
    }

    if (loginType === 'sms' && !smsCode) {
      setVerifySteps({ accountValid: 'pass', credentialValid: 'fail', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '验证码校验', status: '未通过', detail: '请输入验证码' });
      return;
    }

    try {
      let res: any;
      if (loginType === 'password') {
        res = await api.auth.login(phone, password);
      } else if (loginType === 'sms') {
        res = await api.auth.loginBySms(phone, smsCode);
      }

      const userData = res?.user;
      const tokenData = res?.token;

      if (userData && tokenData) {
        localStorage.setItem('token', tokenData);
        useAuthStore.setState({
          user: userData,
          token: tokenData,
          isAuthenticated: true,
          isLoading: false,
          loginError: null,
        });

        setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'pass' });
        const roleName = getRoleName(userData.role);
        setLoginAuditInfo({
          label: '身份核验通过',
          status: '通过',
          role: `${roleName}（${userData.name}）`,
          detail: `账号有效 · 凭据校验通过 · 角色权限已匹配，正在进入${roleName}工作台...`,
        });
        setLoginSuccess(true);
        forceRedirectWithRetry(userData.role);
      } else {
        throw new Error('登录失败');
      }
    } catch (error: any) {
      // ===== 双轨 Fallback：演示账号本地模拟登录 =====
      const matchedDemo = demoAccounts.find(a => a.phone === phone);
      const isDemoPasswordMatch = matchedDemo && loginType === 'password' && password === matchedDemo.password;
      const isDemoSmsMatch = matchedDemo && loginType === 'sms' && smsCode === '123456';

      if (matchedDemo && (isDemoPasswordMatch || isDemoSmsMatch)) {
        // eslint-disable-next-line no-console
        console.warn('[LOGIN FALLBACK] API failed, using local demo auth for:', matchedDemo.name);

        const roleMap: Record<string, any> = {
          citizen: {
            id: 'user-001', name: '张三', idCard: '450101199001010001',
            phone: '13800138001', role: 'citizen', realNameVerified: true, faceVerified: true,
          },
          admin: {
            id: 'admin-001', name: '管理员', idCard: '450101198001010099',
            phone: '13900139000', role: 'admin', realNameVerified: true, faceVerified: true,
          },
          clerk: {
            id: 'clerk-001', name: '办事员', idCard: '450101198501010077',
            phone: '13800138002', role: 'clerk', realNameVerified: true, faceVerified: true,
          },
        };
        const fallbackUser = roleMap[matchedDemo.role];
        const fallbackToken = `demo-${matchedDemo.role}-token`;

        localStorage.setItem('token', fallbackToken);
        useAuthStore.setState({
          user: fallbackUser, token: fallbackToken, isAuthenticated: true,
          isLoading: false, loginError: null,
        });

        setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'pass' });
        const roleName = getRoleName(matchedDemo.role);
        setLoginAuditInfo({
          label: '身份核验通过',
          status: '通过',
          role: `${roleName}（${fallbackUser.name}）`,
          detail: `演示账号本地核验通过 · 正在进入${roleName}工作台...`,
        });
        setLoginSuccess(true);
        forceRedirectWithRetry(matchedDemo.role);
        return;
      }
      // ===== Fallback 结束 =====

      const errorCode = (error?.error || error?.data?.error || 'UNKNOWN_ERROR') as LoginErrorCode;
      const accountFound = demoAccounts.some(a => a.phone === phone);
      const expectedRole = matchedDemo ? getRoleName(matchedDemo.role) : null;

      useAuthStore.setState({ isLoading: false, loginError: errorCode });

      if (errorCode === 'ACCOUNT_NOT_FOUND') {
        setVerifySteps({ accountValid: 'fail', credentialValid: 'pending', roleMatched: 'pending' });
        setLoginAuditInfo({
          label: '账号校验',
          status: '未通过',
          detail: `该手机号未在南宁城市服务平台注册（账号无效）`,
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
          detail: error?.message?.includes('Network') || error?.message?.includes('Failed')
            ? '网络连接异常，请检查网络后重试'
            : '认证服务异常，请稍后重试',
        });
      }
    }
  };

  const fillDemoAccount = (account: typeof demoAccounts[0]) => {
    setPhone(account.phone);
    setPassword(account.password);
    setLoginType('password');
    clearLoginErrorWrapper();
  };

  const handleAiNanningLogin = () => {
    clearLoginErrorWrapper();
    setVerifySteps({ accountValid: 'pending', credentialValid: 'pending', roleMatched: 'pending' });
    setLoginAuditInfo({ label: '爱南宁授权中', status: '处理中', detail: '正在跳转爱南宁获取授权...' });

    setTimeout(() => {
      const demoUser: UserIdentity = {
        id: 'citizen-001',
        name: '张三',
        idCard: '450101199001010001',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        realNameVerified: true,
        faceVerified: true,
        role: 'citizen',
      };
      const demoToken = 'ai-nanning-demo-token';

      localStorage.setItem('token', demoToken);
      useAuthStore.setState({
        user: demoUser,
        token: demoToken,
        isAuthenticated: true,
        isLoading: false,
        loginError: null,
      });

      setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'pass' });
      setLoginAuditInfo({
        label: '授权成功',
        status: '通过',
        role: '市民（张三）',
        detail: '爱南宁授权通过 · 身份已确认 · 正在进入市民工作台...',
      });
      setLoginSuccess(true);
      forceRedirectWithRetry('citizen');
    }, 1200);
  };

  const handleEcertLogin = () => {
    clearLoginErrorWrapper();
    setVerifySteps({ accountValid: 'pending', credentialValid: 'pending', roleMatched: 'pending' });
    setLoginAuditInfo({ label: '电子证照核验中', status: '处理中', detail: '正在读取电子身份证信息...' });

    setTimeout(() => {
      const demoUser: UserIdentity = {
        id: 'citizen-001',
        name: '张三',
        idCard: '450101199001010001',
        phone: '13800138001',
        email: 'zhangsan@example.com',
        realNameVerified: true,
        faceVerified: true,
        role: 'citizen',
      };
      const demoToken = 'ecert-demo-token';

      localStorage.setItem('token', demoToken);
      useAuthStore.setState({
        user: demoUser,
        token: demoToken,
        isAuthenticated: true,
        isLoading: false,
        loginError: null,
      });

      setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'pass' });
      setLoginAuditInfo({
        label: '证照核验通过',
        status: '通过',
        role: '市民（张三）',
        detail: '电子身份证核验通过 · 身份已确认 · 正在进入市民工作台...',
      });
      setLoginSuccess(true);
      forceRedirectWithRetry('citizen');
    }, 1500);
  };

  const getStepIcon = (status: 'pending' | 'pass' | 'fail') => {
    if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'fail') return <X className="w-4 h-4 text-rose-500" />;
    return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
  };

  const errorDisplay = loginError && loginError !== 'SUCCESS' ? errorMessages[loginError] || errorMessages.UNKNOWN_ERROR : null;

  const auditStatus = loginAuditInfo?.status || '';
  const auditCardClass = auditStatus === '通过'
    ? 'mb-5 p-4 rounded-xl border transition-all bg-emerald-50 border-emerald-200'
    : auditStatus === '未通过'
      ? 'mb-5 p-4 rounded-xl border transition-all bg-rose-50 border-rose-200'
      : auditStatus === '处理中'
        ? 'mb-5 p-4 rounded-xl border transition-all bg-blue-50 border-blue-200'
        : 'mb-5 p-4 rounded-xl border transition-all';
  const auditLabelClass = auditStatus === '通过'
    ? 'font-medium text-sm text-emerald-700'
    : auditStatus === '未通过'
      ? 'font-medium text-sm text-rose-700'
      : 'font-medium text-sm text-blue-700';
  const auditRoleClass = auditStatus === '通过'
    ? 'text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700'
    : auditStatus === '未通过'
      ? 'text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700'
      : 'text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700';
  const auditDetailClass = auditStatus === '通过'
    ? 'text-xs mt-1 text-emerald-600'
    : auditStatus === '未通过'
      ? 'text-xs mt-1 text-rose-600'
      : 'text-xs mt-1 text-blue-600';

  const getStepLabelClass = (s: string) => {
    if (s === 'pass') return 'text-xs text-emerald-600';
    if (s === 'fail') return 'text-xs text-rose-600';
    return 'text-xs text-gray-400';
  };
  const getStepLineClass = (s: string) => {
    if (s === 'pass') return 'flex-1 h-0.5 rounded-full bg-emerald-200';
    return 'flex-1 h-0.5 rounded-full bg-gray-200';
  };
  const getTabClass = (key: string) => {
    const base = 'flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5';
    return loginType === key
      ? `${base} bg-white text-blue-600 shadow-sm`
      : `${base} text-gray-500 hover:text-gray-700`;
  };
  const getSmsBtnClass = () => {
    const base = 'px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all';
    return phone.length === 11 && countdown === 0
      ? `${base} bg-blue-50 text-blue-600 hover:bg-blue-100`
      : `${base} bg-gray-100 text-gray-400 cursor-not-allowed`;
  };
  const getDemoCardClass = (bg: string) => {
    return `w-full p-3 ${bg} border border-transparent hover:border-opacity-50 rounded-xl flex items-center gap-3 transition-all hover:shadow-sm`;
  };
  const getDemoIconClass = (color: string) => {
    return `w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="hidden lg:flex flex-col justify-center p-8 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-2xl text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white" />
            <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Landmark className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">南宁城市服务</h1>
                <p className="text-sm text-white/80">智慧城市·山水南宁</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">统一数字身份</h2>
            <p className="text-white/90 mb-8 leading-relaxed">
              一次认证，全城通行。融合电子身份证、社保卡、驾驶证、
              电动车牌照等多证合一，畅享交通、医疗、教育、政务、
              城管五大领域60+便民服务。
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {quickServices.map(item => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <MapPin className="w-4 h-4" />
              <span>南宁市人民政府 · 南宁市大数据发展局</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">南宁城市服务</h1>
              <p className="text-xs text-gray-500">智慧城市·山水南宁</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">欢迎登录</h2>
          <p className="text-gray-500 mb-6 text-sm">请选择以下任意方式完成身份认证</p>

          {loginAuditInfo && (
            <div className={auditCardClass}>
              <div className="flex items-start gap-3">
                {auditStatus === '通过' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                ) : auditStatus === '未通过' ? (
                  <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0 animate-spin" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={auditLabelClass}>
                      {loginAuditInfo.label}
                    </span>
                    {loginAuditInfo.role && (
                      <span className={auditRoleClass}>
                        {loginAuditInfo.role}
                      </span>
                    )}
                  </div>
                  {loginAuditInfo.detail && (
                    <p className={auditDetailClass}>
                      {loginAuditInfo.detail}
                    </p>
                  )}
                </div>
              </div>

              {submitClicked && (
                <div className="mt-4 flex items-center gap-2">
                  {[
                    { key: 'accountValid', label: '账号有效' },
                    { key: 'credentialValid', label: '凭据通过' },
                    { key: 'roleMatched', label: '角色匹配' },
                  ].map((step, idx) => (
                    <React.Fragment key={step.key}>
                      <div className="flex items-center gap-1.5">
                        {getStepIcon(verifySteps[step.key as keyof typeof verifySteps])}
                        <span className={getStepLabelClass(verifySteps[step.key as keyof typeof verifySteps])}>
                          {step.label}
                        </span>
                      </div>
                      {idx < 2 && (
                        <div className={getStepLineClass(verifySteps[step.key as keyof typeof verifySteps])} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )}

          {errorDisplay && loginAuditInfo && loginAuditInfo.status === '未通过' && (
            <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-rose-700 text-sm">
                    {errorDisplay.title}
                  </div>
                  <p className="text-xs text-rose-600 mt-1">{errorDisplay.message}</p>
                  {errorDisplay.hint && (
                    <p className="text-xs text-rose-500 mt-2">
                      <span className="font-medium">温馨提示：</span>
                      {errorDisplay.hint}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl">
            {[
              { key: 'password', label: '密码登录', icon: Lock },
              { key: 'sms', label: '验证码', icon: Smartphone },
              { key: 'face', label: '刷脸', icon: ScanFace },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => {
                  setLoginType(tab.key as any);
                  clearLoginErrorWrapper();
                  setLoginAuditInfo(null);
                }}
                className={getTabClass(tab.key)}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(NON_DIGIT_REGEX, ''))}
                  placeholder="请输入11位手机号"
                  maxLength={11}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {detectedRole && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span
                      className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium"
                    >
                      已识别：{getRoleName(detectedRole)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {loginType === 'password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="请输入登录密码"
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            )}

            {loginType === 'sms' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">验证码</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={smsCode}
                      onChange={e => setSmsCode(e.target.value.replace(NON_DIGIT_REGEX, ''))}
                      placeholder="请输入6位验证码"
                      maxLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendSms}
                    disabled={phone.length !== 11 || countdown > 0}
                    className={getSmsBtnClass()}
                  >
                    {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                  </button>
                </div>
              </div>
            )}

            {loginType !== 'face' ? (
              <button
                type="submit"
                disabled={isLoading || loginSuccess}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-emerald-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    认证中...
                  </>
                ) : loginSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    登录成功，正在跳转...
                  </>
                ) : (
                  '立即登录'
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFaceLogin}
                disabled={faceScanning || loginSuccess}
                className="w-full py-8 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-emerald-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex flex-col items-center gap-2"
              >
                {faceScanning ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                    <span>人脸采集识别中...</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span>点击开始刷脸登录</span>
                  </>
                )}
              </button>
            )}
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">其他登录方式</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={handleAiNanningLogin}
              className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">爱</span>
              </div>
              爱南宁一键登录
            </button>
            <button
              onClick={handleEcertLogin}
              className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <QrCode className="w-5 h-5 text-purple-500" />
              电子证照登录
            </button>
          </div>

          {showDemoAccounts ? (
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400">演示账号（点击快速体验）</span>
                <button
                  onClick={() => setShowDemoAccounts(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  收起
                </button>
              </div>
              <div className="space-y-2">
                {demoAccounts.map(account => (
                  <button
                    key={account.phone}
                    onClick={() => fillDemoAccount(account)}
                    className={getDemoCardClass(account.bg)}
                  >
                    <div className={getDemoIconClass(account.color)}>
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-800">{account.name}</div>
                      <div className="text-xs text-gray-500">{account.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDemoAccounts(true)}
              className="mt-auto text-xs text-gray-400 hover:text-gray-600 text-center"
            >
              展开演示账号
            </button>
          )}

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              登录即表示同意
              <a href="#" className="text-blue-500 hover:underline">《用户服务协议》</a>
              和
              <a href="#" className="text-blue-500 hover:underline">《隐私政策》</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
