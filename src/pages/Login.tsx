import { useState } from 'react'
import { User, Lock, UserPlus, LogIn, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, roleLabels } from '@/store/auth'

export default function Login() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('designer')
  const [showSuccess, setShowSuccess] = useState(false)
  const [localError, setLocalError] = useState('')
  const [debugLog, setDebugLog] = useState<string[]>([])
  const { login, register, isAuthenticated, loading, error } = useAuthStore()

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    setDebugLog(prev => [...prev, `[${time}] ${msg}`])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setDebugLog([])
    
    addLog(`表单提交: tab=${tab}, username=${username}, password=***`)
    
    if (!username.trim()) {
      setLocalError('请输入用户名')
      addLog('校验失败: 用户名为空')
      return
    }
    if (!password) {
      setLocalError('请输入密码')
      addLog('校验失败: 密码为空')
      return
    }
    
    addLog('开始调用 API...')
    let success = false
    try {
      if (tab === 'login') {
        addLog(`调用 login("${username.trim()}", "***")`)
        success = await login(username.trim(), password)
        addLog(`login 返回: ${success}`)
      } else {
        addLog(`调用 register("${username.trim()}", "***", "${role}")`)
        success = await register(username.trim(), password, role)
        addLog(`register 返回: ${success}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addLog(`异常: ${msg}`)
      setLocalError(msg)
      return
    }
    
    addLog(`isAuthenticated=${useAuthStore.getState().isAuthenticated}`)
    addLog(`token=${useAuthStore.getState().token}`)
    addLog(`user=${JSON.stringify(useAuthStore.getState().user)}`)
    
    if (success) {
      addLog('登录成功，准备跳转...')
      setShowSuccess(true)
      setTimeout(() => {
        addLog('执行 window.location.href = "/"')
        window.location.href = '/'
      }, 800)
    } else {
      addLog(`登录失败: error=${useAuthStore.getState().error}`)
    }
  }

  const displayError = localError || error

  const demoAccounts = [
    { username: 'designer1', password: '123456', role: 'designer', label: '交互设计师', color: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]' },
    { username: 'pm1', password: '123456', role: 'pm', label: '产品经理', color: 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]' },
    { username: 'developer1', password: '123456', role: 'developer', label: '研发工程师', color: 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]' },
    { username: 'researcher1', password: '123456', role: 'researcher', label: '用户研究员', color: 'bg-[#f3e8ff] text-[#7e22ce] border-[#e9d5ff]' },
  ]

  const roleColors: Record<string, string> = {
    designer: 'bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]',
    pm: 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
    developer: 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]',
    researcher: 'bg-[#f3e8ff] text-[#7e22ce] border-[#e9d5ff]',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e3a5f] to-[#0f2744] flex items-center justify-center p-4">
      <div className="w-[480px] bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2">交互评审 Platform</h1>
          <p className="text-sm text-gray-500">方案档案 · 流程评审 · 决策记录 · 变更管理 · 复盘看板</p>
        </div>
        
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => { setTab('login'); setLocalError(''); setDebugLog([]); useAuthStore.setState({ error: null }) }}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === 'login' ? 'bg-white text-[#1e3a5f] shadow' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            登录
          </button>
          <button
            onClick={() => { setTab('register'); setLocalError(''); setDebugLog([]); useAuthStore.setState({ error: null }) }}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === 'register' ? 'bg-white text-[#1e3a5f] shadow' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            注册
          </button>
        </div>

        {showSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>登录成功，正在跳转工作台...</span>
          </div>
        )}

        {displayError && !showSuccess && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">登录失败</div>
              <div className="mt-0.5">{displayError}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                placeholder="请输入用户名"
                disabled={loading || showSuccess}
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
                placeholder="请输入密码"
                disabled={loading || showSuccess}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] appearance-none bg-white"
                  disabled={loading || showSuccess}
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || showSuccess}
            className="w-full py-2.5 bg-[#e8723a] text-white rounded-lg font-medium hover:bg-[#d6612a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                验证中...
              </>
            ) : showSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                登录成功，跳转中
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {tab === 'login' ? '登 录' : '注 册'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <div className="font-medium text-gray-700 mb-2">演示账号：</div>
          <div className="space-y-1.5">
            {demoAccounts.map(acc => (
              <div key={acc.username} className="flex items-center justify-between">
                <span className={cn('px-1.5 py-0.5 rounded text-xs border', acc.color)}>{acc.label}</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border cursor-pointer hover:bg-blue-50"
                  onClick={() => { setUsername(acc.username); setPassword(acc.password); setTab('login') }}>
                  {acc.username} / {acc.password}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 p-3 bg-[#dbeafe] rounded-lg text-xs text-[#1e3a5f]">
          <div className="font-medium mb-1.5">支持角色：</div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(roleLabels).map(([value, label]) => (
              <span key={value} className={cn('px-2 py-0.5 rounded-full text-xs border', roleColors[value])}>{label}</span>
            ))}
          </div>
        </div>

        {debugLog.length > 0 && (
          <div className="mt-4 p-3 bg-gray-900 text-green-400 rounded-lg text-xs font-mono max-h-48 overflow-auto">
            <div className="text-gray-400 mb-1">调试日志：</div>
            {debugLog.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
