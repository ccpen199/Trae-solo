import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard } from 'lucide-react';
import { auth as authApi } from '@/api';
import { useAuthStore } from '@/store/auth';

export default function Realname() {
  const [name, setName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setRealnameDone = useAuthStore((s) => s.setRealnameDone);

  const handleSubmit = async () => {
    if (!name || !idCard) return;
    setLoading(true);
    try {
      await authApi.realname(name, idCard);
      setRealnameDone();
      const state = useAuthStore.getState();
      if (state.needBindUnion) navigate('/auth/bind-union');
      else navigate('/home');
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-union-bg px-6 py-8">
      <div className="flex items-center justify-center gap-3 mb-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</div>
          <span className="text-sm font-semibold text-primary">实名认证</span>
        </div>
        <div className="w-10 h-px bg-gray-300" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-union-muted flex items-center justify-center text-sm font-bold">2</div>
          <span className="text-sm text-union-muted">工会绑定</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">实名认证</h2>

        <div className="mb-5">
          <label className="text-sm text-union-muted mb-1.5 block">姓名</label>
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors">
            <User size={18} className="text-union-muted mr-2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入真实姓名"
              className="flex-1 outline-none text-sm text-union-text"
            />
          </div>
        </div>

        <div className="mb-8">
          <label className="text-sm text-union-muted mb-1.5 block">身份证号</label>
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-primary transition-colors">
            <CreditCard size={18} className="text-union-muted mr-2" />
            <input
              type="text"
              maxLength={18}
              value={idCard}
              onChange={(e) => setIdCard(e.target.value)}
              placeholder="请输入身份证号码"
              className="flex-1 outline-none text-sm text-union-text"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!name || !idCard || loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '提交中...' : '提交认证'}
        </button>
      </div>
    </div>
  );
}
