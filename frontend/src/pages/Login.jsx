import { useState } from 'react'

export default function Login({ onLogin, onRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanUsername = username.trim()

    if (!cleanUsername) {
      setError('请输入用户名')
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }
    if (password.length < 6) {
      setError('密码长度至少6位')
      return
    }

    setLoading(true)

    let result
    if (mode === 'login') {
      result = await onLogin(cleanUsername, password)
    } else {
      result = await onRegister(cleanUsername, password)
    }

    if (result.success) {
      // 保持loading状态，导航由LoginPage的useEffect处理
    } else {
      setLoading(false)
      setError(result.error || '操作失败，请稍后重试')
    }
  }

  const handleQuickLogin = async (role) => {
    if (loading) return
    setError('')
    setMode('login')

    const credentials = role === 'admin'
      ? { username: 'admin', password: 'admin123' }
      : { username: 'zhangsan', password: 'user123' }

    setUsername(credentials.username)
    setPassword(credentials.password)
    setLoading(true)

    const result = await onLogin(credentials.username, credentials.password)

    if (result.success) {
      // 保持loading状态，导航由LoginPage的useEffect处理
    } else {
      setLoading(false)
      setError(result.error || '快速登录失败，请手动输入账号密码')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛴</div>
          <h1 className="text-2xl font-bold text-gray-800">智行管家</h1>
          <p className="text-gray-500 mt-1">智能短交通设备全生命周期管理平台</p>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-white text-primary-600 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'register' ? 'bg-white text-primary-600 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            注册
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-medium mb-0.5">登录失败</div>
              <div className="text-red-500">{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all ${
                error ? 'border-red-300 bg-red-50/30' : 'border-gray-300'
              }`}
              placeholder={mode === 'login' ? '请输入用户名或管理员账号' : '请输入新用户名'}
              autoComplete="username"
              autoFocus
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                邮箱地址
              </label>
              <input
                type="email"
                value={username ? `${username}@example.com` : ''}
                readOnly
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                placeholder="注册后自动生成邮箱"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                系统将基于用户名自动生成邮箱地址
              </p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all ${
                error ? 'border-red-300 bg-red-50/30' : 'border-gray-300'
              }`}
              placeholder="请输入密码（至少6位）"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {password && password.length < 6 && (
              <p className="text-xs text-amber-500 mt-1.5">
                密码长度不足6位
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 6.709V12H6z"></path>
                </svg>
                {mode === 'login' ? '正在登录...' : '正在注册...'}
              </span>
            ) : (
              mode === 'login' ? '登 录' : '注 册'
            )}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center mb-3 font-medium">
              快速体验（点击一键登录）
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={loading}
                className="p-3.5 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border border-red-100 rounded-xl text-left transition-all disabled:opacity-50 group"
              >
                <div className="font-semibold text-red-700 text-sm flex items-center mb-1.5">
                  <span className="mr-1.5 text-base">⚙️</span>
                  管理员后台
                </div>
                <div className="text-xs text-red-500 font-mono bg-white/60 rounded px-2 py-1 group-hover:bg-white transition-colors">
                  admin / admin123
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('user')}
                disabled={loading}
                className="p-3.5 bg-gradient-to-br from-blue-50 to-sky-50 hover:from-blue-100 hover:to-sky-100 border border-blue-100 rounded-xl text-left transition-all disabled:opacity-50 group"
              >
                <div className="font-semibold text-blue-700 text-sm flex items-center mb-1.5">
                  <span className="mr-1.5 text-base">👤</span>
                  用户工作台
                </div>
                <div className="text-xs text-blue-500 font-mono bg-white/60 rounded px-2 py-1 group-hover:bg-white transition-colors">
                  zhangsan / user123
                </div>
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-50 text-center">
          <p className="text-xs text-gray-400">
            登录即表示您同意
            <a href="#" className="text-primary-500 hover:text-primary-600 mx-1">服务条款</a>
            和
            <a href="#" className="text-primary-500 hover:text-primary-600 mx-1">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  )
}
