import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Phone } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';

export default function Login() {
  const [phone, setPhone] = useState('13800138000');
  const [role, setRole] = useState('sender');
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const submit = async () => {
    if (!phone) return;
    try {
      await api.auth.login(phone);
      await login(phone);
      if (role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (e) {
      alert('登录失败');
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white gradient-bg flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-700">中通快递统一业务中枢</h1>
          <p className="text-sm text-neutral-500 mt-1">请登录以继续</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="form-label">选择角色</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'sender', label: '寄件用户' },
                { v: 'receiver', label: '收件用户' },
                { v: 'admin', label: '管理员' },
              ].map((r) => (
                <button
                  key={r.v}
                  onClick={() => setRole(r.v)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                    role === r.v
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">手机号码</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field pl-10"
                placeholder="请输入手机号"
              />
            </div>
          </div>
          <button onClick={submit} className="btn-primary w-full py-3 text-base">
            登录 / 注册
          </button>
          <div className="text-center text-xs text-neutral-400">
            测试账号：13800138000（寄件）、13900139000（收件）、13700137000（管理员）
          </div>
        </div>
      </div>
    </div>
  );
}
