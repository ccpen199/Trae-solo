import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Camera, Shield, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';

type AuthMode = 'qrcode' | 'face';

function AuthPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [mode, setMode] = useState<AuthMode>('qrcode');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQrCodeAuth = async () => {
    setError(null);
    setScanning(true);
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const response = await authApi.login({
        credentialType: 'qrcode',
        credentialData: 'mock_qrcode_' + Date.now(),
        deviceId: 'terminal_' + Date.now(),
      });

      if (response.data.success) {
        login(
          response.data.token,
          response.data.userInfo,
          response.data.expiresAt
        );
        navigate('/home', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '认证失败，请重试');
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  const handleFaceAuth = async () => {
    setError(null);
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      
      const response = await authApi.login({
        credentialType: 'face',
        credentialData: 'mock_face_' + Date.now(),
        deviceId: 'terminal_' + Date.now(),
      });

      if (response.data.success) {
        login(
          response.data.token,
          response.data.userInfo,
          response.data.expiresAt
        );
        navigate('/home', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '人脸识别失败，请重试');
    } finally {
      setLoading(false);
    }
  };

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
              <p className="text-slate-500 text-center mb-8">
                请选择认证方式登录
              </p>

              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => setMode('qrcode')}
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
                  onClick={() => setMode('face')}
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

              {mode === 'qrcode' ? (
                <div className="space-y-6">
                  <div className="aspect-square bg-slate-50 rounded-2xl p-8 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 relative overflow-hidden">
                    {scanning ? (
                      <>
                        <div className="w-48 h-48 bg-white rounded-xl p-4 shadow-inner">
                          <div className="w-full h-full bg-gradient-to-br from-insurance-500/20 to-insurance-600/20 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-16 h-16 text-medical-500 animate-pulse" />
                          </div>
                        </div>
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-insurance-500 to-transparent animate-scan-line" />
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
                    disabled={loading}
                    className="w-full btn-primary py-4 text-lg"
                  >
                    {loading ? '认证中...' : '点击开始扫码'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="aspect-square bg-slate-900 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                    {loading ? (
                      <div className="relative">
                        <div className="w-40 h-40 rounded-full border-4 border-medical-500/30" />
                        <div className="absolute inset-0 rounded-full border-4 border-medical-500 animate-ring-expand" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Camera className="w-12 h-12 text-medical-500" />
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
                    disabled={loading}
                    className="w-full btn-primary py-4 text-lg"
                  >
                    {loading ? '识别中...' : '开始人脸识别'}
                  </button>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-danger-50 border border-danger-200 rounded-xl text-danger-600 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-100">
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
