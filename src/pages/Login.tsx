import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Phone, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useUserStore } from '../stores/userStore';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loading } = useUserStore();
  const [phone, setPhone] = useState('');
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    const savedInviteCode = localStorage.getItem('inviteCode');
    if (savedInviteCode && searchParams.get('from') === '/invite') {
      navigate('/register?from=' + encodeURIComponent(searchParams.get('from') || '/invite'));
    }
  }, []);

  const handleLogin = async () => {
    if (!phone || phone.length !== 11) {
      setShowTip(true);
      return;
    }
    
    const result = await login(phone);
    if (result.success) {
      const from = searchParams.get('from');
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      alert(result.message || '登录失败');
    }
  };

  const quickLogin = (p: string) => {
    setPhone(p);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-primary px-4 pt-12 pb-20 text-white relative overflow-hidden">
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <Phone size={40} />
          </div>
          <h1 className="text-2xl font-bold">欢迎回来</h1>
          <p className="text-white/80 mt-2">手机号快捷登录</p>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="mb-6">
            <label className="text-sm font-medium text-dark-600 mb-2 block">手机号</label>
            <div className="relative">
              <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                  setShowTip(false);
                }}
                placeholder="请输入手机号"
                className="w-full pl-12 pr-4 py-3.5 bg-dark-50 border border-dark-100 rounded-xl text-dark-800 placeholder-dark-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
            {showTip && phone.length !== 11 && (
              <p className="text-red-500 text-xs mt-2">请输入正确的手机号</p>
            )}
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-4 bg-gradient-primary text-white font-bold rounded-xl shadow-button hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录 / 注册'}
          </button>

          <p className="text-center text-xs text-dark-400 mt-4">
            登录即表示同意《用户协议》和《隐私政策》
          </p>
        </div>

        <div className="mt-6">
          <p className="text-sm text-dark-500 mb-3 text-center">快捷登录（演示）</p>
          <div className="grid grid-cols-2 gap-3">
            {['13800138000', '13900139000'].map((p) => (
              <button
                key={p}
                onClick={() => quickLogin(p)}
                className="py-3 bg-dark-50 text-dark-600 rounded-xl text-sm hover:bg-dark-100 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <span className="text-dark-500 text-sm">还没有账号？</span>
          <button 
            onClick={() => navigate('/register' + (searchParams.get('from') ? `?from=${encodeURIComponent(searchParams.get('from')!)}` : ''))}
            className="text-primary-500 font-medium text-sm ml-1"
          >
            立即注册
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
