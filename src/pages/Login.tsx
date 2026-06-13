import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthMethod } from '@/types';
import { useUserStore } from '@/stores/useUserStore';
import {
  CreditCard,
  IdCard,
  ShieldPlus,
  Camera,
  CircleUser,
  CheckCircle2,
  MapPin,
  Mountain,
  Trees,
  Waves,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormData {
  idNumber: string;
  password: string;
  authMethod: AuthMethod;
  agreed: boolean;
}

const TABS: { key: AuthMethod; label: string; icon: typeof CreditCard; placeholder: string; fieldLabel: string }[] = [
  { key: 'idcard', label: '身份证', icon: CreditCard, placeholder: '请输入18位身份证号码', fieldLabel: '居民身份证号' },
  { key: 'socialcard', label: '社保卡', icon: IdCard, placeholder: '请输入社保卡号', fieldLabel: '社会保障卡号' },
  { key: 'medicalcard', label: '电子医保凭证', icon: ShieldPlus, placeholder: '请输入电子医保凭证号', fieldLabel: '电子医保凭证号' },
];

const CITIES = [
  { name: '成都', icon: MapPin, color: 'from-blue-500/30 to-blue-600/20', delay: '0s' },
  { name: '德阳', icon: Mountain, color: 'from-cyan-500/30 to-cyan-600/20', delay: '0.15s' },
  { name: '眉山', icon: Trees, color: 'from-emerald-500/30 to-emerald-600/20', delay: '0.3s' },
  { name: '资阳', icon: Waves, color: 'from-indigo-500/30 to-indigo-600/20', delay: '0.45s' },
];

const FEATURE_TAGS = [
  '统一身份认证',
  '原子化微服务',
  '20+委办局接入',
  '实时看板',
  '家庭代办',
  '无障碍模式',
];

export default function Login() {
  const navigate = useNavigate();
  const login = useUserStore((s) => s.login);
  const loading = useUserStore((s) => s.loading);

  const [formData, setFormData] = useState<FormData>({
    idNumber: '',
    password: '',
    authMethod: 'idcard',
    agreed: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [faceScanning, setFaceScanning] = useState(false);
  const [faceScanProgress, setFaceScanProgress] = useState(0);
  const [error, setError] = useState('');

  const currentTab = TABS.find((t) => t.key === formData.authMethod) || TABS[0];

  const handleTabChange = (key: AuthMethod) => {
    setFormData((prev) => ({ ...prev, authMethod: key, idNumber: '' }));
    setError('');
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.idNumber.trim()) {
      setError(`请输入${currentTab.fieldLabel}`);
      return;
    }
    if (!formData.password.trim()) {
      setError('请输入密码');
      return;
    }
    if (!formData.agreed) {
      setError('请先阅读并同意服务条款');
      return;
    }

    const success = await login(formData.authMethod, {
      idCard: formData.idNumber,
      password: formData.password,
    });

    if (success) {
      navigate('/');
    } else {
      setError('登录失败，请检查账号或密码（默认密码：123456）');
    }
  };

  const startFaceScan = () => {
    setFaceScanning(true);
    setFaceScanProgress(0);
    setError('');
  };

  useEffect(() => {
    if (!faceScanning) return;

    const interval = setInterval(() => {
      setFaceScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [faceScanning]);

  useEffect(() => {
    if (faceScanProgress >= 100 && faceScanning) {
      const doFaceLogin = async () => {
        const success = await login('face', { password: '123456' });
        if (success) {
          navigate('/');
        } else {
          setError('人脸识别登录失败');
          setFaceScanning(false);
        }
      };
      doFaceLogin();
    }
  }, [faceScanProgress, faceScanning, login, navigate]);

  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (faceScanProgress / 100) * circumference;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gov-gradient">
        <div className="absolute inset-0 bg-grid-texture bg-grid opacity-60" />
        <div className="absolute inset-0 bg-hero-pattern" />

        <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <ShieldPlus className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">成德眉资</h1>
                <p className="text-sm text-white/70 mt-0.5">政务服务一体化平台</p>
              </div>
            </div>

            <div className="mt-16">
              <h2 className="text-4xl font-bold leading-tight">
                四城协同
                <br />
                <span className="text-gov-200">政务服务一体化</span>
              </h2>
              <p className="mt-4 text-lg text-white/80 max-w-md leading-relaxed">
                打破地域壁垒，实现成都、德阳、眉山、资阳四城政务服务通办，
                让数据多跑路，群众少跑腿。
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4">
              {CITIES.map((city) => {
                const Icon = city.icon;
                return (
                  <div
                    key={city.name}
                    className={cn(
                      'group relative overflow-hidden rounded-xl p-5 bg-gradient-to-br backdrop-blur-sm border border-white/10',
                      city.color
                    )}
                    style={{ animationDelay: city.delay }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{city.name}</p>
                        <p className="text-xs text-white/60">政务服务中心</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-white/70 mb-3">平台特色能力</p>
            <div className="flex flex-wrap gap-2">
              {FEATURE_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm border border-white/15"
                >
                  <Sparkles className="w-3.5 h-3.5 text-warm-400" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gov-gradient flex items-center justify-center">
              <ShieldPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gov-700">成德眉资政务服务</h1>
              <p className="text-sm text-slate-500 mt-0.5">一体化平台</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card-hover p-8 border border-slate-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">欢迎登录</h2>
              <p className="mt-1.5 text-slate-500 text-sm">请选择登录方式并填写信息</p>
            </div>

            {faceScanning ? (
              <div className="flex flex-col items-center py-8">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="4"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="url(#faceGradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-75 ease-linear"
                    />
                    <defs>
                      <linearGradient id="faceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#1E5AA8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {faceScanProgress < 100 ? (
                      <Camera className="w-12 h-12 text-gov-600" />
                    ) : (
                      <CheckCircle2 className="w-12 h-12 text-success-600 animate-pulse" />
                    )}
                  </div>
                </div>
                <p className="mt-6 text-lg font-medium text-slate-800">
                  {faceScanProgress < 100 ? '正在识别中...' : '识别成功'}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {faceScanProgress < 100
                    ? `请将面部对准摄像头 ${faceScanProgress}%`
                    : '正在完成登录...'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFaceScanning(false);
                    setFaceScanProgress(0);
                  }}
                  className="mt-6 px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
                >
                  取消
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex bg-slate-50 rounded-xl p-1 grid grid-cols-3 gap-1">
                  {TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = formData.authMethod === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => handleTabChange(tab.key)}
                        className={cn(
                          'relative flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200',
                          isActive
                            ? 'bg-white text-gov-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        )}
                      >
                        <TabIcon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {currentTab.fieldLabel}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CircleUser className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.idNumber}
                      onChange={(e) => handleInputChange('idNumber', e.target.value)}
                      placeholder={currentTab.placeholder}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gov-500/30 focus:border-gov-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">登录密码</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="请输入登录密码（默认：123456）"
                      className="w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gov-500/30 focus:border-gov-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-danger-50 border border-danger-500/20 rounded-lg text-sm text-danger-600">
                    {error}
                  </div>
                )}

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreed}
                    onChange={(e) => handleInputChange('agreed', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-gov-600 focus:ring-gov-500"
                  />
                  <span className="text-sm text-slate-600 leading-relaxed">
                    我已阅读并同意
                    <a href="#" className="text-gov-600 hover:text-gov-700 mx-0.5">《服务条款》</a>
                    和
                    <a href="#" className="text-gov-600 hover:text-gov-700 mx-0.5">《隐私政策》</a>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gov-gradient text-white font-medium rounded-xl hover:opacity-90 hover:shadow-gov disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    '登录'
                  )}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white text-slate-400">其他登录方式</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={startFaceScan}
                  className="w-full py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5 text-gov-600" />
                  人脸识别登录
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © 2024 成德眉资政务服务一体化平台 · 技术支持
          </p>
        </div>
      </div>
    </div>
  );
}
