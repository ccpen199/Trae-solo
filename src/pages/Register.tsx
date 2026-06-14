import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus, ArrowLeft, User, Phone, Gift } from 'lucide-react';
import { useUserStore } from '../stores/userStore';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loading } = useUserStore();
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    const code = searchParams.get('inviteCode') || localStorage.getItem('inviteCode');
    if (code) {
      setInviteCode(code);
    }
  }, [searchParams]);

  const handleRegister = async () => {
    if (!phone || phone.length !== 11) {
      alert('请输入正确的手机号');
      return;
    }
    if (!nickname) {
      alert('请输入昵称');
      return;
    }
    
    const result = await register(phone, nickname, inviteCode || undefined);
    if (result.success) {
      localStorage.removeItem('inviteCode');
      const from = searchParams.get('from');
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      alert(result.message || '注册失败');
    }
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
            <UserPlus size={40} />
          </div>
          <h1 className="text-2xl font-bold">注册新账号</h1>
          <p className="text-white/80 mt-2">开启你的赚金币之旅</p>
        </div>
      </div>

      <div className="px-6 -mt-10 relative z-10">
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-dark-600 mb-2 block">手机号</label>
            <div className="relative">
              <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入手机号"
                className="w-full pl-12 pr-4 py-3.5 bg-dark-50 border border-dark-100 rounded-xl text-dark-800 placeholder-dark-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-dark-600 mb-2 block">昵称</label>
            <div className="relative">
              <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称"
                maxLength={12}
                className="w-full pl-12 pr-4 py-3.5 bg-dark-50 border border-dark-100 rounded-xl text-dark-800 placeholder-dark-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-dark-600 mb-2 block flex items-center gap-1">
              <Gift size={16} className="text-primary-500" />
              邀请码（选填）
            </label>
            <div className="relative">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="输入邀请码可获得额外奖励"
                maxLength={8}
                className="w-full px-4 py-3.5 bg-dark-50 border border-dark-100 rounded-xl text-dark-800 placeholder-dark-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-4 bg-gradient-primary text-white font-bold rounded-xl shadow-button hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '注册中...' : '立即注册'}
          </button>

          <p className="text-center text-xs text-dark-400">
            注册即送 100 金币新人礼包
          </p>
        </div>

        <div className="mt-6 text-center">
          <span className="text-dark-500 text-sm">已有账号？</span>
          <button 
            onClick={() => navigate('/login' + (searchParams.get('from') ? `?from=${encodeURIComponent(searchParams.get('from')!)}` : ''))}
            className="text-primary-500 font-medium text-sm ml-1"
          >
            立即登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
