import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Camera, Shield, CheckCircle, XCircle, Loader2, AlertTriangle, Info } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import type { AuthResponse } from '@shared/types';

type AuthMode = 'qrcode' | 'face';
type AuthStep = 'idle' | 'authenticating' | 'success' | 'failed';

function AuthPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const storeLogin = useAuthStore((s) => s.login);
  const [mode, setMode] = useState<AuthMode>('qrcode');
  const [step, setStep] = useState<AuthStep>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<AuthResponse | null>(null);
  const [pct, setPct] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isAuthenticated && step !== 'authenticating') {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate, step]);

  const doLogin = async (authMode: AuthMode) => {
    if (step === 'authenticating') return;
    setStep('authenticating');
    setPct(0);
    setErrorMsg('');
    setResult(null);

    const start = Date.now();
    const dur = 2000;
    const timer = setInterval(() => {
      if (!mountedRef.current) { clearInterval(timer); return; }
      const p = Math.min(95, ((Date.now() - start) / dur) * 100);
      setPct(p);
    }, 60);

    try {
      const resp = await authApi.login({
        credentialType: authMode,
        credentialData: `mock_${authMode}_${Date.now()}`,
        deviceId: `terminal_${Date.now()}`,
      });
      clearInterval(timer);
      if (!mountedRef.current) return;

      setPct(100);

      if (resp.code === 0 && resp.data) {
        setResult(resp.data);
        storeLogin(resp.data.token, resp.data.userInfo, resp.data.expiresAt);
        setStep('success');
        setTimeout(() => {
          if (mountedRef.current) navigate('/home', { replace: true });
        }, 1000);
      } else {
        setErrorMsg(resp.message || '认证失败');
        setStep('failed');
      }
    } catch (err: unknown) {
      clearInterval(timer);
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : '网络连接失败，请检查网络后重试';
      setErrorMsg(msg);
      setStep('failed');
    }
  };

  const retry = () => {
    setStep('idle');
    setErrorMsg('');
    setResult(null);
    setPct(0);
  };

  if (step === 'success' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-insurance-600 via-insurance-500 to-insurance-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-medical-50 flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-medical-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">认证成功</h2>
          <p className="text-slate-500 mb-6">正在进入江苏省医保服务大厅...</p>
          <div className="bg-insurance-50 rounded-2xl p-5 mb-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-insurance-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">{result.userInfo.name}</p>
                <p className="text-sm text-slate-500">{result.userInfo.insuredArea}</p>
              </div>
            </div>
            <div className="space-y-2 pt-3 border-t border-insurance-100 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">认证方式</span>
                <span className="font-medium text-slate-700">{mode === 'qrcode' ? '电子医保凭证扫码' : '人脸识别'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">认证结果</span>
                <span className="text-medical-600 font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />已通过</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">社保卡号</span>
                <span className="font-mono text-slate-700">{result.userInfo.socialSecurityNo.replace(/(\d{4})\d+(\d{4})/, '$1****$2')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-insurance-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">正在跳转...</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-insurance-600 via-insurance-500 to-insurance-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-danger-50 flex items-center justify-center">
            <XCircle className="w-14 h-14 text-danger-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">认证失败</h2>
          <p className="text-slate-500 mb-5">身份认证未通过</p>
          <div className="bg-danger-50 rounded-2xl p-5 mb-6 text-left">
            <div className="flex items-start gap-2.5 mb-3">
              <AlertTriangle className="w-5 h-5 text-danger-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-danger-800 text-sm">失败原因</p>
                <p className="text-danger-600 text-sm mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-danger-100">
              <p className="text-sm text-slate-500 mb-2 flex items-center gap-1"><Info className="w-3.5 h-3.5" />解决方案</p>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>1. {mode === 'qrcode' ? '请确认使用国家医保服务平台APP扫码' : '请确保面部完整出现在框内'}</li>
                <li>2. {mode === 'qrcode' ? '检查网络连接和二维码是否有效' : '确保光线充足，无遮挡物'}</li>
                <li>3. 确认电子医保凭证已激活且状态正常</li>
                <li>4. 如问题持续，请拨打医保服务热线 <strong className="text-danger-600">12393</strong></li>
              </ul>
            </div>
          </div>
          <div className="space-y-2.5">
            <button onClick={() => doLogin(mode)} className="w-full btn-primary py-3.5 text-lg">重新{mode === 'qrcode' ? '扫码' : '识别'}</button>
            <button onClick={retry} className="w-full py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">选择其他认证方式</button>
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
              <p className="text-insurance-100/80 mb-8 leading-relaxed">
                请通过电子医保凭证完成强身份认证，安全访问您的个人医保账户、就诊记录、挂号预约等服务。
              </p>
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5 text-medical-300" /></div>
                  <div><h3 className="font-semibold">电子医保凭证认证</h3><p className="text-insurance-100/70 text-sm">对接国家医保平台，实现强身份认证</p></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5 text-medical-300" /></div>
                  <div><h3 className="font-semibold">全省医保服务一网通办</h3><p className="text-insurance-100/70 text-sm">账户查询、挂号预约、支付结算一站式</p></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0"><CheckCircle className="w-5 h-5 text-medical-300" /></div>
                  <div><h3 className="font-semibold">智能异常处理</h3><p className="text-insurance-100/70 text-sm">自动重试、实时预警、政策精准推送</p></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">身份认证</h2>
              <p className="text-slate-500 text-center mb-6">请选择认证方式完成登录</p>

              <div className="flex gap-3 mb-6">
                <button onClick={() => { if (step !== 'authenticating') setMode('qrcode'); }} className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${mode === 'qrcode' ? 'bg-insurance-500 text-white shadow-lg shadow-insurance-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  <QrCode className="w-5 h-5 mx-auto mb-1" />扫码登录
                </button>
                <button onClick={() => { if (step !== 'authenticating') setMode('face'); }} className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${mode === 'face' ? 'bg-insurance-500 text-white shadow-lg shadow-insurance-500/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  <Camera className="w-5 h-5 mx-auto mb-1" />人脸识别
                </button>
              </div>

              {step === 'authenticating' && (
                <div className="mb-6 p-4 bg-insurance-50 rounded-xl border border-insurance-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-insurance-500" />
                      <span className="text-sm font-medium text-slate-700">
                        {mode === 'qrcode' ? '正在扫描电子医保凭证...' : '正在采集人脸信息...'}
                      </span>
                    </div>
                    <span className="text-sm text-insurance-600 font-bold">{Math.round(pct)}%</span>
                  </div>
                  <div className="h-2.5 bg-insurance-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-insurance-500 to-insurance-400 transition-all duration-100 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              {mode === 'qrcode' ? (
                <div className="space-y-5">
                  <div className={`aspect-square rounded-2xl p-6 flex flex-col items-center justify-center border-2 relative overflow-hidden transition-colors ${step === 'authenticating' ? 'bg-insurance-50/70 border-insurance-300' : 'bg-slate-50 border-dashed border-slate-300'}`}>
                    {step === 'authenticating' ? (
                      <div className="w-48 h-48 bg-white rounded-xl p-4 shadow-inner">
                        <div className="w-full h-full bg-gradient-to-br from-insurance-500/10 to-insurance-600/10 rounded-lg flex items-center justify-center">
                          <Loader2 className="w-14 h-14 text-insurance-500 animate-spin" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-48 h-48 bg-white rounded-xl p-4 shadow-inner border border-slate-200">
                        <div className="w-full h-full rounded-lg flex items-center justify-center relative">
                          <QrCode className="w-32 h-32 text-slate-800" />
                          <div className="absolute -top-2 -left-2 w-5 h-5 border-t-4 border-l-4 border-insurance-500 rounded-tl-lg" />
                          <div className="absolute -top-2 -right-2 w-5 h-5 border-t-4 border-r-4 border-insurance-500 rounded-tr-lg" />
                          <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b-4 border-l-4 border-insurance-500 rounded-bl-lg" />
                          <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b-4 border-r-4 border-insurance-500 rounded-br-lg" />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-center text-slate-500 text-sm">请打开<span className="font-medium text-insurance-600">国家医保服务平台APP</span>，点击"医保码"扫描上方二维码</p>
                  <button onClick={() => doLogin('qrcode')} disabled={step === 'authenticating'} className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {step === 'authenticating' ? <><Loader2 className="w-5 h-5 animate-spin" />认证中...</> : <><QrCode className="w-5 h-5" />点击开始扫码认证</>}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className={`aspect-square bg-slate-900 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all ${step === 'authenticating' ? 'ring-4 ring-insurance-400/60' : ''}`}>
                    {step === 'authenticating' ? (
                      <div className="relative">
                        <div className="w-40 h-40 rounded-full border-4 border-medical-500/30" />
                        <div className="absolute inset-0 rounded-full border-4 border-medical-500 animate-ring-expand" />
                        <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-10 h-10 text-medical-500 animate-spin" /></div>
                      </div>
                    ) : (
                      <div className="w-40 h-40 rounded-full border-4 border-insurance-500/50 bg-slate-800 flex items-center justify-center">
                        <Camera className="w-16 h-16 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute inset-4 rounded-2xl pointer-events-none">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-insurance-500 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-insurance-500 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-insurance-500 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-insurance-500 rounded-br-lg" />
                    </div>
                  </div>
                  <p className="text-center text-slate-500 text-sm">请将<span className="font-medium text-insurance-600">面部完整对准框内</span>，保持光线充足</p>
                  <button onClick={() => doLogin('face')} disabled={step === 'authenticating'} className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {step === 'authenticating' ? <><Loader2 className="w-5 h-5 animate-spin" />认证中...</> : <><Camera className="w-5 h-5" />开始人脸识别认证</>}
                  </button>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs text-slate-400 text-center">本服务由江苏省医疗保障局提供 · 技术支持：国家医保信息平台 · 热线 <span className="font-medium text-slate-600">12393</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
