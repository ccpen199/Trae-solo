import React, { useState } from 'react'

export default function Login({ onLoginSuccess, onLogin, onRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login')
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')

    const cleanUsername = username.trim()

    if (!cleanUsername) {
      setError('请输入用户名')
      setLoading(false)
      return
    }
    if (!password) {
      setError('请输入密码')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('密码长度至少6位')
      setLoading(false)
      return
    }

    let result
    if (mode === 'login') {
      result = await onLogin(cleanUsername, password)
    } else {
      result = await onRegister(cleanUsername, password)
    }

    setLoading(false)

    if (result.success) {
      if (mode === 'register') {
        setSuccessMsg('注册成功，正在进入...')
        setTimeout(() => onLoginSuccess(result.user), 400)
      } else {
        onLoginSuccess(result.user)
      }
    } else {
      setError(result.error || '操作失败，请稍后重试')
    }
  }

  const handleQuickLogin = async (role) => {
    if (loading) return
    setError('')
    setSuccessMsg('')
    setLoading(true)
    setMode('login')

    const credentials = role === 'admin'
      ? { username: 'admin', password: 'admin123' }
      : { username: 'zhangsan', password: 'user123' }

    setUsername(credentials.username)
    setPassword(credentials.password)

    const result = await onLogin(credentials.username, credentials.password)
    setLoading(false)

    if (result.success) {
      onLoginSuccess(result.user)
    } else {
      setError(result.error || '快速登录失败，请手动输入账号密码')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform transition-all">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛴</div>
          <h1 className="text-2xl font-bold text-gray-800">智行管家</h1>
          <p className="text-gray-500 mt-1">智能短交通设备全生命周期管理平台</p>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccessMsg('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-white text-primary-600 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setSuccessMsg('') }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'register' ? 'bg-white text-primary-600 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            注册
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start animate-fadeIn">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="font-medium mb-0.5">登录失败</div>
              <div className="text-red-500">{error}</div>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm flex items-start animate-fadeIn">
            <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMsg}</span>
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
              <p className="text-xs text-gray-400 mt-1.5 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
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
              <p className="text-xs text-amber-500 mt-1.5 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                密码长度不足6位
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
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
              🎯 快速体验（点击一键登录）
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
                  admin：admin123
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
                  zhangsan：user123
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
