import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Camera, Shield, CheckCircle, XCircle, Loader2, 
  ArrowRight, AlertTriangle, Info 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import type { AuthResponse, ApiResponse } from '@shared/types';

type AuthMode = 'qrcode' | 'face';
type AuthStep = 'idle' | 'scanning' | 'verifying' | 'success' | 'failed';

function AuthPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [mode, setMode] = useState<AuthMode>('qrcode');
  const [authStep, setAuthStep] = useState<AuthStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [authResult, setAuthResult] = useState<AuthResponse | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const log = useCallback((msg: string) => {
    console.log('[AuthPage]', msg);
    setDebugLog((prev) => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  useEffect(() => {
    log(`页面初始化, isAuthenticated=${isAuthenticated}, authStep=${authStep}`);
    if (isAuthenticated) {
      log('已登录状态，直接跳转到 /home');
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate, log]);

  const simulateProgress = useCallback((duration: number, label: string) => {
    const startTime = Date.now();
    log(`开始进度模拟: ${label}, 时长=${duration}ms`);
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setProgressPercent(progress);
      if (progress >= 100) {
        clearInterval(interval);
        log(`进度完成: ${label}`);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [log]);

  const performAuth = useCallback(async (authMode: AuthMode) => {
    log(`开始认证流程: mode=${authMode}`);
    setError(null);
    setAuthResult(null);
    setProgressPercent(0);

    try {
      setAuthStep('scanning');
      log('步骤1: 扫描/采集阶段');
      const cleanup1 = simulateProgress(authMode === 'qrcode' ? 1500 : 1800, '扫描/采集');
      await new Promise((resolve) => setTimeout(resolve, authMode === 'qrcode' ? 1500 : 1800));
      cleanup1();

      setAuthStep('verifying');
      setProgressPercent(0);
      log('步骤2: 身份验证阶段 - 调用后端API');
      const cleanup2 = simulateProgress(authMode === 'qrcode' ? 2000 : 2200, '身份验证');
      
      let response: ApiResponse<AuthResponse>;
      try {
        log('调用 authApi.login ...');
        response = await authApi.login({
          credentialType: authMode,
          credentialData: `mock_${authMode}_${Date.now()}`,
          deviceId: `terminal_${Date.now()}`,
        });
        log(`API返回: code=${response.code}, message=${response.message}, hasData=${!!response.data}`);
      } catch (apiErr) {
        log(`API调用异常: ${apiErr instanceof Error ? apiErr.message : String(apiErr)}`);
        throw apiErr;
      }

      cleanup2();
      setProgressPercent(100);

      if (response.code === 0 && response.data) {
        log('认证成功！保存登录状态...');
        setAuthResult(response.data);
        setAuthStep('success');

        try {
          login(
            response.data.token,
            response.data.userInfo,
            response.data.expiresAt
          );
          log('login() 调用完成, 等待状态同步...');
        } catch (storeErr) {
          log(`store.login 异常: ${storeErr instanceof Error ? storeErr.message : String(storeErr)}`);
        }

        log(`1.2秒后跳转到 /home ...`);
        setTimeout(() => {
          log('执行跳转 navigate("/home")');
          navigate('/home', { replace: true });
        }, 1200);
      } else {
        log(`认证失败: code=${response.code}, message=${response.message}`);
        setAuthStep('failed');
        setError(response.message || '认证失败，请重试');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      log(`流程异常: ${errMsg}`);
      setAuthStep('failed');
      setError(errMsg || '认证失败，请检查网络连接后重试');
    }
  }, [login, navigate, simulateProgress, log]);

  const resetAuth = useCallback(() => {
    log('重置认证状态');
    setAuthStep('idle');
    setError(null);
    setAuthResult(null);
    setProgressPercent(0);
  }, [log]);

  const getStatusText = useCallback(() => {
    switch (authStep) {
      case 'scanning':
        return mode === 'qrcode' ? '正在扫描电子医保凭证二维码...' : '正在采集人脸信息...';
      case 'verifying':
        return '正在对接国家医保平台验证身份...';
      case 'success':
        return '认证成功，正在进入江苏省医保服务大厅...';
      case 'failed':
        return '身份认证失败';
      default:
        return '';
    }
  }, [authStep, mode]);

  const getStatusIcon = useCallback(() => {
    switch (authStep) {
      case 'scanning':
      case 'verifying':
        return <Loader2 className="w-8 h-8 animate-spin text-insurance-500" />;
      case 'success':
        return <CheckCircle className="w-16 h-16 text-medical-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-danger-500" />;
      default:
        return null;
    }
  }, [authStep]);

  if (authStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-insurance-600 via-insurance-500 to-insurance-700 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-insurance-300/20 rounded-full blur-3xl animate-pulse-slow" />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in-up text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-medical-50 flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-medical-500 animate-pulse" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">身份认证成功</h2>
              <p className="text-slate-500 mb-6">{getStatusText()}</p>

              {authResult && (
                <div className="bg-insurance-50 rounded-2xl p-5 mb-6 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Shield className="w-6 h-6 text-insurance-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-lg">{authResult.userInfo.name}</p>
                      <p className="text-sm text-slate-500">参保地：{authResult.userInfo.insuredArea}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-insurance-100">
                    <span className="text-slate-500">认证方式</span>
                    <span className="font-medium text-slate-700">
                      {mode === 'qrcode' ? '电子医保凭证扫码' : '人脸识别'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2">
                    <span className="text-slate-500">认证状态</span>
                    <span className="inline-flex items-center gap-1 text-medical-600 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      已通过国家医保平台验证
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2">
                    <span className="text-slate-500">社保卡号</span>
                    <span className="font-mono text-slate-700">
                      {authResult.userInfo.socialSecurityNo.replace(/(\d{4})\d+(\d{4})/, '$1********$2')}
                    </span>
                  </div>
                </div>
              )}

              <div className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 opacity-80">
                <Loader2 className="w-5 h-5 animate-spin" />
                正在进入江苏省医保服务大厅...
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">
                  本服务由江苏省医疗保障局提供 · 技术支持：国家医保信息平台
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authStep === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-insurance-600 via-insurance-500 to-insurance-700 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-insurance-300/20 rounded-full blur-3xl" />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in-up text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-danger-50 flex items-center justify-center">
                <XCircle className="w-16 h-16 text-danger-500" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">身份认证失败</h2>
              <p className="text-slate-500 mb-6">{getStatusText()}</p>

              {error && (
                <div className="bg-danger-50 rounded-2xl p-5 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-danger-800 mb-1">认证失败原因</p>
                      <p className="text-sm text-danger-600">{error}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-danger-100">
                    <p className="text-sm text-slate-500 mb-2 flex items-center gap-1">
                      <Info className="w-4 h-4" />
                      建议解决方案：
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-insurance-500 font-bold">1.</span>
                        {mode === 'qrcode' 
                          ? '请确认使用国家医保服务平台APP扫描二维码' 
                          : '请确保面部完整出现在识别框内，无遮挡'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-insurance-500 font-bold">2.</span>
                        {mode === 'qrcode' 
                          ? '请检查网络连接是否正常，二维码是否清晰有效' 
                          : '请确保光线充足，面部无口罩、帽子等遮挡'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-insurance-500 font-bold">3.</span>
                        请确认您的电子医保凭证已激活且状态正常
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-insurance-500 font-bold">4.</span>
                        如问题持续，请联系医保服务热线 <span className="font-semibold text-danger-600">12393</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {debugLog.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                  <p className="text-xs text-slate-400 mb-2">诊断日志（调试用）:</p>
                  <div className="text-xs text-slate-500 font-mono space-y-1 max-h-24 overflow-y-auto">
                    {debugLog.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => performAuth(mode)}
                  className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  重新{mode === 'qrcode' ? '扫码认证' : '人脸识别'}
                </button>
                <button
                  onClick={resetAuth}
                  className="w-full py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                >
                  ← 返回选择其他认证方式
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">
                  本服务由江苏省医疗保障局提供 · 技术支持：国家医保信息平台
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-insurance-600 via-insurance-500 to-insurance-700 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-insurance-300/20 rounded-full blur-3xl" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-white animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Shield className="w-10 h-10 text-insurance-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">江苏省医保服务</h1>
                  <p className="text-insurance-100 text-lg">一体化数字终端</p>
                </div>
              </div>

              <p className="text-insurance-100 text-lg leading-relaxed mb-8">
                请通过电子医保凭证完成强身份认证，安全访问您的个人医保账户、就诊记录、挂号预约等服务。
              </p>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-medical-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">电子医保凭证认证</h3>
                    <p className="text-insurance-100/80 text-sm">对接国家医保平台，实现强身份认证</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-medical-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">全省医保服务一网通办</h3>
                    <p className="text-insurance-100/80 text-sm">账户查询、挂号预约、支付结算一站式服务</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-medical-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">智能异常处理</h3>
                    <p className="text-insurance-100/80 text-sm">自动重试、实时预警、政策精准推送</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
                身份认证
              </h2>
              <p className="text-slate-500 text-center mb-6">
                请选择认证方式完成登录
              </p>

              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => { resetAuth(); setMode('qrcode'); }}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                    mode === 'qrcode'
                      ? 'bg-insurance-500 text-white shadow-lg shadow-insurance-500/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <QrCode className="w-5 h-5 mx-auto mb-1" />
                  扫码登录
                </button>
                <button
                  onClick={() => { resetAuth(); setMode('face'); }}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                    mode === 'face'
                      ? 'bg-insurance-500 text-white shadow-lg shadow-insurance-500/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Camera className="w-5 h-5 mx-auto mb-1" />
                  人脸识别
                </button>
              </div>

              {(authStep === 'scanning' || authStep === 'verifying') && (
                <div className="mb-6 p-4 bg-insurance-50 rounded-xl border border-insurance-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-insurance-500" />
                      <span className="text-sm font-medium text-slate-700">{getStatusText()}</span>
                    </div>
                    <span className="text-sm text-insurance-600 font-bold">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2.5 bg-insurance-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-insurance-500 via-insurance-400 to-insurance-500 transition-all duration-100 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {mode === 'qrcode' ? (
                <div className="space-y-6">
                  <div className={`aspect-square rounded-2xl p-6 flex flex-col items-center justify-center border-2 relative overflow-hidden transition-all duration-300 ${
                    authStep === 'idle' 
                      ? 'bg-slate-50 border-dashed border-slate-300' 
                      : authStep === 'scanning' || authStep === 'verifying' 
                        ? 'bg-insurance-50/70 border-solid border-insurance-300' 
                        : 'bg-slate-50 border-solid border-slate-200'
                  }`}>
                    {authStep === 'scanning' || authStep === 'verifying' ? (
                      <>
                        <div className="w-48 h-48 bg-white rounded-xl p-4 shadow-inner">
                          <div className="w-full h-full bg-gradient-to-br from-insurance-500/10 via-white to-insurance-600/10 rounded-lg flex items-center justify-center">
                            <Loader2 className="w-12 h-12 text-insurance-500 animate-spin" />
                          </div>
                        </div>
                        {authStep === 'scanning' && (
                          <div className="absolute inset-x-8 h-1.5 bg-gradient-to-r from-transparent via-insurance-500 to-transparent animate-scan-line rounded-full" />
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-48 h-48 bg-white rounded-xl p-4 shadow-inner border border-slate-200">
                          <div className="w-full h-full rounded-lg flex items-center justify-center relative">
                            <QrCode className="w-32 h-32 text-slate-800" />
                            <div className="absolute -top-2 -left-2 w-5 h-5 border-t-4 border-l-4 border-insurance-500 rounded-tl-lg" />
                            <div className="absolute -top-2 -right-2 w-5 h-5 border-t-4 border-r-4 border-insurance-500 rounded-tr-lg" />
                            <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b-4 border-l-4 border-insurance-500 rounded-bl-lg" />
                            <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b-4 border-r-4 border-insurance-500 rounded-br-lg" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <p className="text-center text-slate-500 text-sm leading-relaxed">
                    请打开<span className="font-medium text-insurance-600">国家医保服务平台APP</span>，
                    点击"医保码"，扫描上方二维码完成认证
                  </p>

                  <button
                    onClick={() => performAuth('qrcode')}
                    disabled={authStep === 'scanning' || authStep === 'verifying'}
                    className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {authStep === 'scanning' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        正在扫描中...
                      </>
                    ) : authStep === 'verifying' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        身份验证中...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5" />
                        点击开始扫码认证
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className={`aspect-square bg-slate-900 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
                    authStep === 'scanning' || authStep === 'verifying' ? 'ring-4 ring-insurance-400/60' : ''
                  }`}>
                    {authStep === 'scanning' || authStep === 'verifying' ? (
                      <div className="relative">
                        <div className="w-40 h-40 rounded-full border-4 border-medical-500/30" />
                        <div className="absolute inset-0 rounded-full border-4 border-medical-500 animate-ring-expand" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-12 h-12 text-medical-500 animate-spin" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-40 h-40 rounded-full border-4 border-insurance-500/50 bg-slate-800 flex items-center justify-center">
                          <Camera className="w-16 h-16 text-slate-400" />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-900 to-transparent" />
                      </>
                    )}
                    
                    <div className="absolute inset-4 rounded-2xl pointer-events-none">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-insurance-500 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-insurance-500 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-insurance-500 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-insurance-500 rounded-br-lg" />
                    </div>
                  </div>

                  <p className="text-center text-slate-500 text-sm leading-relaxed">
                    请将<span className="font-medium text-insurance-600">面部完整对准框内</span>，
                    保持光线充足，无口罩、帽子等遮挡
                  </p>

                  <button
                    onClick={() => performAuth('face')}
                    disabled={authStep === 'scanning' || authStep === 'verifying'}
                    className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {authStep === 'scanning' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        人脸信息采集中...
                      </>
                    ) : authStep === 'verifying' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        身份验证中...
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        开始人脸识别认证
                      </>
                    )}
                  </button>
                </div>
              )}

              {error && authStep === 'idle' && (
                <div className="mt-6 p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm text-center flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  本服务由<span className="font-medium">江苏省医疗保障局</span>提供 · 
                  技术支持：国家医保信息平台<br />
                  服务热线：<span className="font-medium text-slate-600">12393</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
