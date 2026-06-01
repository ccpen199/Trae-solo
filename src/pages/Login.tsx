import { useState } from 'react';
import { useAuthStore, checkAuth } from '../store/authStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const login = useAuthStore((state) => state.login);

  const addDebug = (msg: string) => {
    console.log('[Login Debug]', msg);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    addDebug(`开始登录: username=${username}`);

    try {
      addDebug('发送请求到 /api/auth/login');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      addDebug(`响应状态: ${response.status}`);
      
      const data = await response.json();
      addDebug(`响应数据: code=${data.code}, message=${data.message}`);

      if (response.ok && data.code === 200 && data.data) {
        const { token, admin } = data.data;
        addDebug(`登录成功: token=${token?.substring(0, 20)}..., role=${admin?.role}`);

        if (!token || !admin) {
          setError('登录失败：响应数据不完整');
          addDebug('ERROR: 数据不完整');
          setLoading(false);
          return;
        }

        addDebug('调用 authStore.login() 保存状态');
        login(token, admin);
        
        addDebug('检查 localStorage 同步状态');
        const authState = checkAuth();
        addDebug(`localStorage 验证: isAuthenticated=${authState.isAuthenticated}, role=${authState.admin?.role}`);
        
        addDebug('硬跳转 / 仪表盘');
        window.location.href = '/';
        return;
      }

      const msg = data.message || `登录失败（错误码: ${data.code}）`;
      setError(msg);
      addDebug(`登录失败: ${msg}`);
    } catch (err: any) {
      const msg = `登录异常：${err.message || '未知错误'}`;
      setError(msg);
      addDebug(`ERROR: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError('');
    addDebug(`填充账号: ${user}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">抽奖运营平台</h1>
          <p className="text-gray-500 mt-2">请登录您的管理账户</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="请输入用户名"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="请输入密码"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                登录中...
              </span>
            ) : '登 录'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-3 font-medium">快捷测试账户（点击填充）：</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials('admin', 'admin123')}
              className="text-left px-3 py-2 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <span className="font-medium text-gray-700">admin</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-gray-500">超级管理员</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('operator', 'admin123')}
              className="text-left px-3 py-2 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <span className="font-medium text-gray-700">operator</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-gray-500">运营</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('risk', 'admin123')}
              className="text-left px-3 py-2 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <span className="font-medium text-gray-700">risk</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-gray-500">风控</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('finance', 'admin123')}
              className="text-left px-3 py-2 bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <span className="font-medium text-gray-700">finance</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-gray-500">财务</span>
            </button>
          </div>
        </div>

        {debugInfo.length > 0 && (
          <div className="mt-4 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono max-h-48 overflow-y-auto">
            <p className="text-gray-400 mb-2 font-semibold">调试信息：</p>
            {debugInfo.map((info, i) => (
              <p key={i} className="py-0.5">{info}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
