import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Camera, Shield, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import type { AuthResponse } from '@shared/types';

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

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const simulateProgress = (duration: number) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setProgressPercent(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  };

  const handleQrCodeAuth = async () => {
    setError(null);
    setAuthResult(null);
    setProgressPercent(0);

    try {
      setAuthStep('scanning');
      const cleanup1 = simulateProgress(1500);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      cleanup1();

      setAuthStep('verifying');
      setProgressPercent(0);
      const cleanup2 = simulateProgress(2000);
      
      const response = await authApi.login({
        credentialType: 'qrcode',
        credentialData: 'mock_qrcode_' + Date.now(),
        deviceId: 'terminal_' + Date.now(),
      });

      cleanup2();
      setProgressPercent(100);

      if (response.code === 0 && response.data) {
        setAuthResult(response.data);
        setAuthStep('success');

        login(
          response.data.token,
          response.data.userInfo,
          response.data.expiresAt
        );

        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 1200);
      } else {
        setAuthStep('failed');
        setError(response.message || '认证失败');
      }
    } catch (err) {
      setAuthStep('failed');
      setError(err instanceof Error ? err.message : '认证失败，请检查网络连接后重试');
    }
  };

  const handleFaceAuth = async () => {
    setError(null);
    setAuthResult(null);
    setProgressPercent(0);

    try {
      setAuthStep('scanning');
      const cleanup1 = simulateProgress(1800);
      await new Promise((resolve) => setTimeout(resolve, 1800));
      cleanup1();

      setAuthStep('verifying');
      setProgressPercent(0);
      const cleanup2 = simulateProgress(2200);
      
      const response = await authApi.login({
        credentialType: 'face',
        credentialData: 'mock_face_' + Date.now(),
        deviceId: 'terminal_' + Date.now(),
      });

      cleanup2();
      setProgressPercent(100);

      if (response.code === 0 && response.data) {
        setAuthResult(response.data);
        setAuthStep('success');

        login(
          response.data.token,
          response.data.userInfo,
          response.data.expiresAt
        );

        setTimeout(() => {
          navigate('/home', { replace: true });
        }, 1200);
      } else {
        setAuthStep('failed');
        setError(response.message || '人脸识别失败');
      }
    } catch (err) {
      setAuthStep('failed');
      setError(err instanceof Error ? err.message : '人脸识别失败，请检查光线和网络后重试');
    }
  };

  const resetAuth = () => {
    setAuthStep('idle');
    setError(null);
    setAuthResult(null);
    setProgressPercent(0);
  };

  const getStatusText = () => {
    switch (authStep) {
      case 'scanning':
        return mode === 'qrcode' ? '正在扫描二维码...' : '正在采集人脸信息...';
      case 'verifying':
        return '正在对接国家医保平台验证身份...';
      case 'success':
        return '认证成功，正在进入服务大厅...';
      case 'failed':
        return '认证失败';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
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
  };

  if (authStep === 'success' || authStep === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-insurance-600 via-insurance-500 to-insurance-700 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-insurance-300/20 rounded-full blur-3xl" />

        <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in-up text-center">
              <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                authStep === 'success' ? 'bg-medical-50' : 'bg-danger-50'
              }`}>
                {getStatusIcon()}
              </div>

              <h2 className={`text-2xl font-bold mb-2 ${
                authStep === 'success' ? 'text-slate-900' : 'text-slate-900'
              }`}>
                {authStep === 'success' ? '身份认证成功' : '身份认证失败'}
              </h2>

              <p className="text-slate-500 mb-6">
                {getStatusText()}
              </p>

              {authStep === 'success' && authResult && (
                <div className="bg-insurance-50 rounded-2xl p-5 mb-6 text-left">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Shield className="w-6 h-6 text-insurance-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{authResult.userInfo.name}</p>
                      <p className="text-sm text-slate-500">参保地：{authResult.userInfo.insuredArea}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-insurance-100">
                    <span className="text-slate-500">认证方式</span>
                    <span className="font-medium text-slate-700">
                      {mode === 'qrcode' ? '电子医保凭证' : '人脸识别'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2">
                    <span className="text-slate-500">认证状态</span>
                    <span className="inline-flex items-center gap-1 text-medical-600 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      已通过
                    </span>
                  </div>
                </div>
              )}

              {authStep === 'failed' && error && (
                <div className="bg-danger-50 rounded-2xl p-5 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-danger-800 mb-1">错误详情</p>
                      <p className="text-sm text-danger-600">{error}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-danger-100">
                    <p className="text-sm text-slate-500 mb-2">建议解决方案：</p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-insurance-500">•</span>
                        {mode === 'qrcode' ? '请检查二维码是否清晰有效' : '请确保面部完整出现在框内'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-insurance-500">•</span>
                        {mode === 'qrcode' ? '请检查网络连接是否正常' : '请确保光线充足，无遮挡'}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-insurance-500">•</span>
                        如问题持续，请联系医保服务热线 12393
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {authStep === 'success' ? (
                  <div className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    正在进入服务大厅...
                  </div>
                ) : (
                  <>
                    <button
                      onClick={mode === 'qrcode' ? handleQrCodeAuth : handleFaceAuth}
                      className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-5 h-5" />
                      重新{mode === 'qrcode' ? '扫码' : '识别'}
                    </button>
                    <button
                      onClick={resetAuth}
                      className="w-full py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                    >
                      选择其他认证方式
                    </button>
                  </>
                )}
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

              <div className="space-y-6 mt-12">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-medical-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-lg">电子医保凭证认证</h3>
                    <p className="text-insurance-100">对接国家医保平台，实现强身份认证</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-medical-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-lg">全省医保服务一网通办</h3>
                    <p className="text-insurance-100">账户查询、挂号预约、支付结算一站式服务</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-medical-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-lg">智能异常处理</h3>
                    <p className="text-insurance-100">自动重试、实时预警、政策精准推送</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
                身份认证
              </h2>
              <p className="text-slate-500 text-center mb-6">
                请选择认证方式登录
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
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon()}
                      <span className="text-sm font-medium text-slate-700">{getStatusText()}</span>
                    </div>
                    <span className="text-sm text-insurance-600 font-medium">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-insurance-500 to-insurance-400 transition-all duration-100 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {mode === 'qrcode' ? (
                <div className="space-y-6">
                  <div className={`aspect-square bg-slate-50 rounded-2xl p-8 flex flex-col items-center justify-center border-2 relative overflow-hidden transition-all duration-300 ${
                    authStep === 'idle' ? 'border-dashed border-slate-200' :
                    authStep === 'scanning' || authStep === 'verifying' ? 'border-solid border-insurance-300 bg-insurance-50/50' :
                    'border-solid border-slate-200'
                  }`}>
                    {authStep === 'scanning' || authStep === 'verifying' ? (
                      <>
                        <div className="w-48 h-48 bg-white rounded-xl p-4 shadow-inner">
                          <div className="w-full h-full bg-gradient-to-br from-insurance-500/10 to-insurance-600/10 rounded-lg flex items-center justify-center">
                            <Loader2 className="w-12 h-12 text-insurance-500 animate-spin" />
                          </div>
                        </div>
                        {authStep === 'scanning' && (
                          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-insurance-500 to-transparent animate-scan-line" />
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-48 h-48 bg-white rounded-xl p-4 shadow-inner">
                          <div className="w-full h-full bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center">
                            <QrCode className="w-32 h-32 text-slate-800" />
                          </div>
                        </div>
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-insurance-500 rounded-tl-lg" />
                          <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-insurance-500 rounded-tr-lg" />
                          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-insurance-500 rounded-bl-lg" />
                          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-insurance-500 rounded-br-lg" />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <p className="text-center text-slate-500 text-sm">
                    请打开国家医保服务平台APP，扫描二维码完成认证
                  </p>

                  <button
                    onClick={handleQrCodeAuth}
                    disabled={authStep === 'scanning' || authStep === 'verifying'}
                    className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {authStep === 'scanning' || authStep === 'verifying' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {authStep === 'scanning' ? '扫描中...' : '身份验证中...'}
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5" />
                        点击开始扫码
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className={`aspect-square bg-slate-900 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
                    authStep === 'scanning' || authStep === 'verifying' ? 'ring-4 ring-insurance-400/50' : ''
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

                  <p className="text-center text-slate-500 text-sm">
                    请将面部对准框内，保持光线充足
                  </p>

                  <button
                    onClick={handleFaceAuth}
                    disabled={authStep === 'scanning' || authStep === 'verifying'}
                    className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {authStep === 'scanning' || authStep === 'verifying' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {authStep === 'scanning' ? '采集中...' : '身份验证中...'}
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        开始人脸识别
                      </>
                    )}
                  </button>
                </div>
              )}

              {error && authStep === 'idle' && (
                <div className="mt-6 p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">
                  本服务由江苏省医疗保障局提供 · 技术支持：国家医保信息平台
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
