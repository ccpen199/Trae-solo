import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store'
import { login, register, getMe } from '@/lib/api'
import { User, Lock, Building2, UserCheck, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('taxpayer')
  const [realName, setRealName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [redirectToDashboard, setRedirectToDashboard] = useState(false)
  const { token, user, setUser, setToken, setTaxpayers, setCurrentTaxpayer } = useAppStore()

  if (redirectToDashboard || (token && user)) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isLogin) {
        const res = await login(username, password)
        
        if (res.success && res.data) {
          const { token: newToken, user: userData } = res.data
          
          if (!newToken || !userData) {
            setError('登录响应数据不完整，请重试')
            setLoading(false)
            return
          }

          setToken(newToken)
          setUser(userData)
          
          setSuccess(`欢迎回来，${userData.real_name}！正在跳转...`)

          try {
            const meRes = await getMe()
            if (meRes.success && meRes.data?.taxpayers?.length > 0) {
              setTaxpayers(meRes.data.taxpayers)
              setCurrentTaxpayer(meRes.data.taxpayers[0])
            }
          } catch {}
          
          setRedirectToDashboard(true)
          return
        } else {
          setError(res.error || '登录失败，请检查用户名和密码')
        }
      } else {
        if (!realName) {
          setError('请填写真实姓名')
          setLoading(false)
          return
        }
        const res = await register({ username, password, role, real_name: realName, id_number: '', phone: '' })
        if (res.success) {
          setSuccess('注册成功，请登录')
          setIsLogin(true)
          setPassword('')
        } else {
          setError(res.error || '注册失败，请稍后重试')
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('系统异常，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const roleLabels: Record<string, string> = { taxpayer: '纳税人', admin: '税务管理员', agent: '第三方代理' }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#1E3A5F] relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-emerald-400 blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-blue-400 blur-3xl"></div>
        </div>
        <div className="relative z-10 text-white text-center px-12">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500 flex items-center justify-center text-3xl font-bold shadow-lg shadow-emerald-500/30">
            税
          </div>
          <h1 className="text-3xl font-bold mb-3">电子税务服务平台</h1>
          <p className="text-white/70 text-lg">一站式全流程电子办税 · 智能风险防控 · 政策精准触达</p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl mb-1">📋</div>
              <div className="text-xs text-white/60">智能申报</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl mb-1">🧾</div>
              <div className="text-xs text-white/60">发票管理</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl mb-1">📑</div>
              <div className="text-xs text-white/60">涉税证明</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-xl font-bold">
              税
            </div>
            <h1 className="text-xl font-bold text-gray-800">电子税务服务平台</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => { setIsLogin(true); setError(''); setSuccess('') }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                账号
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); setSuccess('') }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  !isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                注册
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2.5 mb-4">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2.5 mb-4">
                <CheckCircle size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="请输入用户名"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="请输入密码"
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                    <div className="relative">
                      <UserCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={realName}
                        onChange={(e) => setRealName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="请输入真实姓名"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择角色</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'taxpayer', label: '纳税人', desc: '企业/个人', icon: Building2 },
                        { value: 'admin', label: '管理员', desc: '税务管理', icon: User },
                        { value: 'agent', label: '代理', desc: '第三方代理', icon: UserCheck },
                      ].map(({ value, label, desc, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value)}
                          className={`flex flex-col items-center py-3 rounded-lg border-2 text-sm transition-colors ${
                            role === value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          <Icon size={18} className="mb-1" />
                          <span className="font-medium">{label}</span>
                          <span className="text-xs opacity-60">{desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4f7f] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    处理中...
                  </>
                ) : (
                  <>
                    {isLogin ? '登录' : '注册'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {isLogin && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg text-xs text-amber-700 space-y-1.5">
                <div className="font-medium text-amber-800 mb-1">演示账号（点击自动填充）</div>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-amber-100 rounded px-1 py-0.5" onClick={() => { setUsername('admin'); setPassword('admin123') }}>
                  <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">admin</span>
                  <span className="text-amber-500">/</span>
                  <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">admin123</span>
                  <span className="text-amber-600">税务管理员</span>
                </div>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-amber-100 rounded px-1 py-0.5" onClick={() => { setUsername('taxpayer1'); setPassword('admin123') }}>
                  <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">taxpayer1</span>
                  <span className="text-amber-500">/</span>
                  <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">admin123</span>
                  <span className="text-amber-600">纳税人</span>
                </div>
                <div className="flex items-center gap-2 cursor-pointer hover:bg-amber-100 rounded px-1 py-0.5" onClick={() => { setUsername('agent1'); setPassword('admin123') }}>
                  <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">agent1</span>
                  <span className="text-amber-500">/</span>
                  <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">admin123</span>
                  <span className="text-amber-600">第三方代理</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
