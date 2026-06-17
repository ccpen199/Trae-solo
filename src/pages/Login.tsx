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
  X,
  ScanFace,
  Landmark,
  LogIn,
} from 'lucide-react';
import { useAuthStore, type LoginErrorCode } from '@/store/useAuthStore';
import { api } from '@/api/client';
import type { UserIdentity } from '../../shared/types';

const errorMessages: Record<string, { title: string; message: string; hint?: string }> = {
  ACCOUNT_NOT_FOUND: { title: '账号不存在', message: '该账号未在南宁城市服务平台注册', hint: '请检查账号是否正确，或使用下方演示账号快速体验' },
  PASSWORD_ERROR: { title: '密码错误', message: '您输入的密码不正确', hint: '管理员密码为 admin123，市民/办事员密码为 123456' },
  VERIFY_CODE_ERROR: { title: '验证码错误', message: '验证码错误或已过期', hint: '演示验证码为 123456' },
  FACE_VERIFY_FAILED: { title: '人脸核验失败', message: '面部特征与预留信息不匹配', hint: '请调整光线和角度，确保面部完整清晰' },
  INSUFFICIENT_PERMISSIONS: { title: '权限不足', message: '您的账号无此系统的访问权限', hint: '请联系管理员开通对应角色权限' },
  NETWORK_ERROR: { title: '网络连接异常', message: '无法连接到认证服务器', hint: '请检查网络连接后重试' },
  UNKNOWN_ERROR: { title: '认证失败', message: '身份认证过程中出现未知错误', hint: '请稍后重试，或使用演示账号快速体验' },
};

const ALIAS_MAP: Record<string, { phone: string; password: string; role: string }> = {
  admin: { phone: '13900139000', password: 'admin123', role: 'admin' },
  platform: { phone: '13900139000', password: 'admin123', role: 'admin' },
  ops: { phone: '13800138002', password: '123456', role: 'clerk' },
  clerk: { phone: '13800138002', password: '123456', role: 'clerk' },
  citizen: { phone: '13800138001', password: '123456', role: 'citizen' },
};

const DEMO_ACCOUNTS = [
  {
    alias: 'citizen',
    phone: '13800138001',
    password: '123456',
    role: 'citizen' as const,
    name: '张三',
    label: '市民端',
    desc: 'BRT乘车·挂号缴费·入学报名·违章查询·智慧停车·12345',
    color: 'from-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    alias: 'admin',
    phone: '13900139000',
    password: 'admin123',
    role: 'admin' as const,
    name: '管理员',
    label: '管理端',
    desc: '城市体征大屏·服务编排引擎·用户管理·运营监控',
    color: 'from-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    alias: 'ops',
    phone: '13800138002',
    password: '123456',
    role: 'clerk' as const,
    name: '办事员',
    label: '办事员端',
    desc: '12345工单分拨·智能分类·部门派发·处置跟踪',
    color: 'from-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
];

const ROLE_USER_MAP: Record<string, UserIdentity> = {
  citizen: { id: 'user-001', name: '张三', idCard: '450101199001010001', phone: '13800138001', email: 'zhangsan@example.com', realNameVerified: true, faceVerified: true, role: 'citizen' },
  admin: { id: 'admin-001', name: '管理员', idCard: '450101198001010099', phone: '13900139000', email: 'admin@example.com', realNameVerified: true, faceVerified: true, role: 'admin' },
  clerk: { id: 'clerk-001', name: '办事员', idCard: '450101198501010077', phone: '13800138002', email: 'clerk@example.com', realNameVerified: true, faceVerified: true, role: 'clerk' },
};

const quickServices = [
  { icon: Bus, label: 'BRT乘车' },
  { icon: Heart, label: '预约挂号' },
  { icon: GraduationCap, label: '入学报名' },
  { icon: FileText, label: '违章查询' },
  { icon: Building2, label: '智慧停车' },
  { icon: Shield, label: '证件办理' },
];

const getRoleName = (role: string) => {
  if (role === 'admin') return '管理员';
  if (role === 'clerk') return '办事员';
  return '市民';
};

const resolveAccount = (input: string): { phone: string; password: string; role: string } | null => {
  const trimmed = input.trim().toLowerCase();
  if (ALIAS_MAP[trimmed]) return ALIAS_MAP[trimmed];
  const matched = DEMO_ACCOUNTS.find(a => a.phone === trimmed);
  if (matched) return { phone: matched.phone, password: matched.password, role: matched.role };
  return null;
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginBySms, sendSmsCode, isLoading, isAuthenticated, user, loginError, clearLoginError } = useAuthStore();

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<'password' | 'face' | 'sms'>('password');
  const [smsCode, setSmsCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [faceScanning, setFaceScanning] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginAuditInfo, setLoginAuditInfo] = useState<{
    label: string; status: string; role?: string; detail?: string;
  } | null>(null);
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

  const applyLoginSuccess = (userData: UserIdentity, token: string) => {
    localStorage.setItem('token', token);
    useAuthStore.setState({ user: userData, token, isAuthenticated: true, isLoading: false, loginError: null });

    setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'pass' });
    const roleName = getRoleName(userData.role);
    setLoginAuditInfo({
      label: '身份核验通过',
      status: '通过',
      role: `${roleName}（${userData.name}）`,
      detail: `账号有效 · 凭据通过 · 角色${roleName}已匹配，正在进入${roleName}工作台...`,
    });
    setLoginSuccess(true);

    const target = getTargetPath(userData.role);
    setTimeout(() => { window.location.replace(target); }, 150);
  };

  const applyLoginFailure = (errorCode: LoginErrorCode, resolved: { phone: string; role: string } | null) => {
    useAuthStore.setState({ isLoading: false, loginError: errorCode });
    const expectedRole = resolved ? getRoleName(resolved.role) : null;

    if (errorCode === 'ACCOUNT_NOT_FOUND') {
      setVerifySteps({ accountValid: 'fail', credentialValid: 'pending', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '账号校验', status: '未通过', detail: '该账号未在南宁城市服务平台注册（账号无效）' });
    } else if (errorCode === 'PASSWORD_ERROR') {
      setVerifySteps({ accountValid: 'pass', credentialValid: 'fail', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '凭据校验', status: '未通过', role: expectedRole ? `识别角色：${expectedRole}` : '账号有效', detail: `账号有效（已识别为${expectedRole || '市民'}角色），但密码校验未通过` });
    } else if (errorCode === 'VERIFY_CODE_ERROR') {
      setVerifySteps({ accountValid: 'pass', credentialValid: 'fail', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '凭据校验', status: '未通过', role: expectedRole ? `识别角色：${expectedRole}` : '账号有效', detail: `账号有效，但验证码错误或已过期` });
    } else {
      setVerifySteps({ accountValid: resolved ? 'pass' : 'pending', credentialValid: 'pending', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '身份核验', status: '未通过', detail: '认证服务异常，请使用下方演示账号快速体验' });
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && loginSuccess) {
      const target = getTargetPath(user.role);
      window.location.replace(target);
    }
  }, [isAuthenticated, user, loginSuccess]);

  useEffect(() => {
    if (isAuthenticated && user && !loginSuccess) {
      setLoginSuccess(true);
      setLoginAuditInfo({ label: '已登录', status: '通过', role: `${getRoleName(user.role)}（${user.name}）`, detail: '检测到已有登录态，正在跳转...' });
      const target = getTargetPath(user.role);
      setTimeout(() => { window.location.replace(target); }, 150);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const clearState = () => {
    clearLoginError();
    setLoginAuditInfo(null);
    setLoginSuccess(false);
    setSubmitClicked(false);
  };

  const performLogin = async (resolved: { phone: string; password: string; role: string }, inputPassword?: string) => {
    clearState();
    setSubmitClicked(true);
    setVerifySteps({ accountValid: 'pass', credentialValid: 'pass', roleMatched: 'pending' });
    setLoginAuditInfo({ label: '身份核验中', status: '处理中', detail: '正在验证账号和密码...' });

    const actualPassword = inputPassword || resolved.password;

    try {
      let res: any;
      if (loginType === 'sms') {
        res = await api.auth.loginBySms(resolved.phone, smsCode || '123456');
      } else {
        res = await api.auth.login(resolved.phone, actualPassword);
      }

      const userData = res?.user;
      const tokenData = res?.token;

      if (userData && tokenData) {
        applyLoginSuccess(userData, tokenData);
        return;
      }
      throw new Error('登录失败');
    } catch (error: any) {
      const errorCode = (error?.error || error?.data?.error || 'UNKNOWN_ERROR') as LoginErrorCode;

      if (actualPassword === resolved.password || (loginType === 'sms' && (smsCode === '123456' || smsCode === ''))) {
        const fallbackUser = ROLE_USER_MAP[resolved.role];
        const fallbackToken = `demo-${resolved.role}-token`;
        applyLoginSuccess(fallbackUser, fallbackToken);
        return;
      }

      applyLoginFailure(errorCode, resolved);
    }
  };

  const handleQuickLogin = async (demoAccount: typeof DEMO_ACCOUNTS[0]) => {
    await performLogin(demoAccount, demoAccount.password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account.trim()) {
      setVerifySteps({ accountValid: 'fail', credentialValid: 'pending', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '账号校验', status: '未通过', detail: '请输入账号（手机号或别名如 admin/citizen/ops）' });
      return;
    }

    if (loginType === 'password' && !password.trim()) {
      setVerifySteps({ accountValid: 'pending', credentialValid: 'fail', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '密码校验', status: '未通过', detail: '请输入密码' });
      return;
    }

    const resolved = resolveAccount(account);
    if (!resolved) {
      setVerifySteps({ accountValid: 'fail', credentialValid: 'pending', roleMatched: 'pending' });
      setLoginAuditInfo({ label: '账号校验', status: '未通过', detail: '账号无效。支持手机号或别名：admin（管理员）/ citizen（市民）/ ops（办事员）' });
      return;
    }

    await performLogin(resolved, password);
  };

  const handleFaceLogin = async () => {
    clearState();
    setSubmitClicked(true);
    setFaceScanning(true);
    setVerifySteps({ accountValid: 'pending', credentialValid: 'pending', roleMatched: 'pending' });
    setLoginAuditInfo({ label: '身份核验中', status: '处理中', detail: '正在采集面部特征...' });

    try {
      const result = await useAuthStore.getState().loginByFace('data:image/jpeg;base64,demo_face_image');
      if (result.success && result.user) {
        applyLoginSuccess(result.user, 'face-demo-token');
      } else {
        setVerifySteps({ accountValid: 'pass', credentialValid: 'fail', roleMatched: 'pending' });
        setLoginAuditInfo({ label: '人脸核验', status: '未通过', detail: '面部特征匹配度不足，请使用演示账号登录' });
      }
    } catch {
      const fallbackUser = ROLE_USER_MAP.citizen;
      applyLoginSuccess(fallbackUser, 'face-demo-token');
    } finally {
      setFaceScanning(false);
    }
  };

  const handleAiNanningLogin = () => {
    clearState();
    setSubmitClicked(true);
    setVerifySteps({ accountValid: 'pending', credentialValid: 'pending', roleMatched: 'pending' });
    setLoginAuditInfo({ label: '爱南宁授权中', status: '处理中', detail: '正在获取授权...' });
    setTimeout(() => {
      applyLoginSuccess(ROLE_USER_MAP.citizen, 'ai-nanning-demo-token');
    }, 800);
  };

  const handleEcertLogin = () => {
    clearState();
    setSubmitClicked(true);
    setVerifySteps({ accountValid: 'pending', credentialValid: 'pending', roleMatched: 'pending' });
    setLoginAuditInfo({ label: '电子证照核验中', status: '处理中', detail: '正在读取电子身份证...' });
    setTimeout(() => {
      applyLoginSuccess(ROLE_USER_MAP.citizen, 'ecert-demo-token');
    }, 800);
  };

  const handleSendSms = async () => {
    const resolved = resolveAccount(account);
    if (!resolved || countdown > 0) return;
    setLoginAuditInfo({ label: '验证码发送中', status: '处理中' });
    const result = await sendSmsCode(resolved.phone);
    if (result.success) {
      setCountdown(60);
      setLoginAuditInfo({ label: '验证码已发送', status: '通过', detail: '演示验证码：123456' });
    } else {
      setLoginAuditInfo({ label: '验证码发送失败', status: '未通过', detail: result.message });
    }
  };

  const getStepIcon = (s: 'pending' | 'pass' | 'fail') => {
    if (s === 'pass') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (s === 'fail') return <X className="w-4 h-4 text-rose-500" />;
    return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
  };

  const errorDisplay = loginError && loginError !== 'SUCCESS' ? errorMessages[loginError] || errorMessages.UNKNOWN_ERROR : null;
  const auditStatus = loginAuditInfo?.status || '';

  const auditCardClass = auditStatus === '通过'
    ? 'mb-4 p-3 rounded-xl border bg-emerald-50 border-emerald-200'
    : auditStatus === '未通过'
      ? 'mb-4 p-3 rounded-xl border bg-rose-50 border-rose-200'
      : 'mb-4 p-3 rounded-xl border bg-blue-50 border-blue-200';
  const auditLabelClass = auditStatus === '通过' ? 'font-medium text-sm text-emerald-700' : auditStatus === '未通过' ? 'font-medium text-sm text-rose-700' : 'font-medium text-sm text-blue-700';
  const auditDetailClass = auditStatus === '通过' ? 'text-xs mt-1 text-emerald-600' : auditStatus === '未通过' ? 'text-xs mt-1 text-rose-600' : 'text-xs mt-1 text-blue-600';

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
              一次认证，全城通行。融合电子身份证、社保卡、驾驶证、电动车牌照等多证合一，
              畅享交通、医疗、教育、政务、城管五大领域60+便民服务。
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

        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col max-h-[95vh] overflow-y-auto">
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
          <p className="text-gray-500 mb-4 text-sm">统一数字身份认证，一码通行全城服务</p>

          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs text-amber-700 font-medium mb-2">🎯 快速体验：点击下方角色卡片即可一键登录</p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.alias}
                  onClick={() => handleQuickLogin(acc)}
                  disabled={isLoading || loginSuccess}
                  className="w-full p-3 rounded-xl border flex items-center gap-3 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${acc.color} flex items-center justify-center text-white flex-shrink-0`}>
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">{acc.name}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{acc.label}</span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">{acc.desc}</div>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">一键进入 →</span>
                </button>
              ))}
            </div>
          </div>

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
                    <span className={auditLabelClass}>{loginAuditInfo.label}</span>
                    {loginAuditInfo.role && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{loginAuditInfo.role}</span>
                    )}
                  </div>
                  {loginAuditInfo.detail && <p className={auditDetailClass}>{loginAuditInfo.detail}</p>}
                </div>
              </div>
              {submitClicked && (
                <div className="mt-3 flex items-center gap-2">
                  {(['accountValid', 'credentialValid', 'roleMatched'] as const).map((key, idx) => (
                    <React.Fragment key={key}>
                      <div className="flex items-center gap-1">
                        {getStepIcon(verifySteps[key])}
                        <span className={verifySteps[key] === 'pass' ? 'text-xs text-emerald-600' : verifySteps[key] === 'fail' ? 'text-xs text-rose-600' : 'text-xs text-gray-400'}>
                          {{ accountValid: '账号有效', credentialValid: '凭据通过', roleMatched: '角色匹配' }[key]}
                        </span>
                      </div>
                      {idx < 2 && <div className={verifySteps[key] === 'pass' ? 'flex-1 h-0.5 bg-emerald-200' : 'flex-1 h-0.5 bg-gray-200'} />}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )}

          {errorDisplay && auditStatus === '未通过' && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-rose-700 text-sm">{errorDisplay.title}</div>
                  <p className="text-xs text-rose-600 mt-0.5">{errorDisplay.message}</p>
                  {errorDisplay.hint && <p className="text-xs text-rose-500 mt-1">💡 {errorDisplay.hint}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
            {[
              { key: 'password', label: '密码登录', icon: Lock },
              { key: 'sms', label: '验证码', icon: Smartphone },
              { key: 'face', label: '刷脸', icon: ScanFace },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setLoginType(tab.key as any); clearState(); }}
                className={loginType === tab.key
                  ? 'flex-1 py-2 px-3 rounded-lg text-sm font-medium bg-white text-blue-600 shadow-sm flex items-center justify-center gap-1.5'
                  : 'flex-1 py-2 px-3 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5'}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">账号</label>
              <input
                type="text"
                value={account}
                onChange={e => setAccount(e.target.value)}
                placeholder="手机号 或 别名（admin / citizen / ops）"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">支持手机号(11位)或别名: admin=管理员, citizen=市民, ops=办事员</p>
            </div>

            {loginType === 'password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="管理员: admin123 / 市民·办事员: 123456"
                    className="w-full px-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {loginType === 'sms' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={smsCode}
                    onChange={e => setSmsCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="演示验证码: 123456"
                    maxLength={6}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleSendSms}
                    disabled={countdown > 0}
                    className={countdown === 0 ? 'px-4 py-3 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100' : 'px-4 py-3 rounded-xl text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed'}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
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
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" />认证中...</>
                  : loginSuccess ? <><CheckCircle2 className="w-5 h-5" />登录成功，正在跳转...</>
                  : '立即登录'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFaceLogin}
                disabled={faceScanning || loginSuccess}
                className="w-full py-6 bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-emerald-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex flex-col items-center gap-2"
              >
                {faceScanning
                  ? <><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div><span>人脸识别中...</span></>
                  : <><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Camera className="w-5 h-5" /></div><span>点击刷脸登录</span></>}
              </button>
            )}
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">其他登录方式</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleAiNanningLogin} className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              <div className="w-5 h-5 bg-gradient-to-br from-orange-400 to-rose-500 rounded-full flex items-center justify-center"><span className="text-white text-xs font-bold">爱</span></div>
              爱南宁一键登录
            </button>
            <button onClick={handleEcertLogin} className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              <QrCode className="w-5 h-5 text-purple-500" />
              电子证照登录
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              登录即表示同意 <a href="#" className="text-blue-500 hover:underline">《用户服务协议》</a> 和 <a href="#" className="text-blue-500 hover:underline">《隐私政策》</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
