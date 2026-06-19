import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const accounts = [
    { label: '平台管理员', user: 'admin', pwd: 'admin123', desc: '审核企业资质，查看平台数据' },
    { label: '运营管理员', user: 'platform', pwd: 'platform123', desc: '平台运营管理' },
    { label: '运维管理员', user: 'ops', pwd: 'ops123', desc: '系统运维管理' },
    { label: '监管管理员', user: 'supervisor', pwd: 'supervisor123', desc: '监管数据查看' },
    { label: '回收商', user: 'recycler01', pwd: 'recycler01123', desc: '查看并收购废料' },
    { label: '产废单位', user: 'producer01', pwd: 'producer01123', desc: '发布废料供应信息' },
    { label: '质检机构', user: 'inspector01', pwd: 'inspector01123', desc: '出具CMA质检报告' },
    { label: '承运商', user: 'carrier01', pwd: 'carrier01123', desc: '提供物流运输报价' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch (e: any) {
      setErr(e.error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (u: string, p: string) => {
    setErr('');
    setLoading(true);
    try {
      await login(u, p);
      navigate('/');
    } catch (e: any) {
      setErr(e.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-primary-50 via-white to-blue-50">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-500 to-emerald-500 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-white blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-2xl font-bold">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">♻️</div>
            绿循环
          </div>
          <p className="mt-2 text-primary-100 text-lg">再生资源产业互联网撮合交易平台</p>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-bold leading-tight mb-6">让每一份再生资源<br/>都能找到最优归宿</h1>
          <div className="space-y-4">
            {[
              { t: '三大品类全覆盖', d: '废金属 · 二手设备 · 废塑料' },
              { t: '全流程交易闭环', d: '商机匹配 → 在线议价 → 电子合同 → 资金监管' },
              { t: '合规溯源体系', d: '对接生态环境部固废系统 · CMA质检报告' },
              { t: '智能数据分析', d: '区域供需热力图 · 钢铁产能价格预测模型' },
            ].map((f, i) => (
              <div key={i} className="flex gap-4 items-start p-4 bg-white/10 backdrop-blur rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-xl flex-shrink-0">
                  {['🎯', '🔒', '🏷️', '📊'][i]}
                </div>
                <div>
                  <div className="font-semibold">{f.t}</div>
                  <div className="text-sm text-primary-100">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-sm text-primary-100">
          © 2024 绿循环 GreenCycle · 致力于中国再生资源产业数字化转型
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 lg:px-20">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">欢迎回来</h2>
            <p className="text-slate-500 mt-2">登录账户以继续您的业务</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="label">用户名</label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="input-field"
                placeholder="请输入用户名"
                required
              />
            </div>
            <div>
              <label className="label">密码</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field"
                placeholder="请输入密码"
                required
              />
            </div>
            {err && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{err}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            还没有账户？<Link to="/register" className="text-primary-600 font-medium hover:underline">立即注册</Link>
          </div>

          <div className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs text-slate-400 font-medium">快速体验账户</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5">
              {accounts.map(a => (
                <button
                  key={a.user}
                  onClick={() => quickLogin(a.user, a.pwd)}
                  disabled={loading}
                  className="text-left p-3 rounded-xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-slate-800 group-hover:text-primary-700">{a.label}</span>
                    <span className="text-xs text-slate-400 group-hover:text-primary-500">{a.user}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{a.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
