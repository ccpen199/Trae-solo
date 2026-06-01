import { useState } from 'react';
import { Zap, Phone, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const TEST_ACCOUNTS = [
  { label: '车主 · 张三', phone: '13800000003', password: 'user1234', role: 'owner', dotColor: 'bg-green-500' },
  { label: '运营商 · 运营专员', phone: '13800000002', password: 'op123456', role: 'operator', dotColor: 'bg-blue-500' },
  { label: '管理员 · 系统管理员', phone: '13800000001', password: 'admin123', role: 'admin', dotColor: 'bg-orange-500' },
];

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('登录表单提交');
    
    setError('');
    setSuccess('');
    
    if (!phone.trim()) {
      setError('请输入手机号');
      return;
    }
    
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    
    if (!/^1\d{10}$/.test(phone.trim())) {
      setError('手机号格式不正确，请输入11位手机号');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      if (!data.token || !data.user) {
        throw new Error('服务器返回数据不完整');
      }

      const targetPage = (data.user.role === 'admin' || data.user.role === 'operator') 
        ? 'admin-dashboard' 
        : 'home';

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('currentPage', targetPage);

      setSuccess('登录成功！正在跳转...');
      setTimeout(() => {
        window.location.href = '/';
      }, 300);
    } catch (err) {
      console.error('登录错误:', err);
      setError(err.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const fillAccount = (phoneNum, pwd) => {
    setPhone(phoneNum);
    setPassword(pwd);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">新能源充电桩平台</h1>
          <p className="text-gray-500 mt-2">便捷充电，绿色出行</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (error) setError(''); }}
                placeholder="请输入11位手机号"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                maxLength={11}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                placeholder="请输入密码"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">登录失败</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">登录成功</p>
                <p className="mt-0.5">{success}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>登录中...</span>
              </>
            ) : (
              <span>登 录</span>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium text-gray-600 mb-3 text-center">快捷测试账号</p>
          <div className="space-y-2">
            {TEST_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => fillAccount(acc.phone, acc.password)}
                disabled={loading}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${acc.dotColor}`} />
                  <span className="text-sm font-medium text-gray-700">{acc.label}</span>
                </span>
                <span className="text-xs text-gray-400">{acc.phone}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
