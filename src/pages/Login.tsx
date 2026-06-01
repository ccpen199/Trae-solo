import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { LogIn, User, Building2, Users, Shield } from 'lucide-react'

const demoAccounts = [
  { username: 'admin', role: 'canteen_admin', label: '食堂管理员', desc: '采购验收、入库领用', icon: User },
  { username: 'logistics', role: 'logistics', label: '学校后勤', desc: '每日菜单、留样管理', icon: Building2 },
  { username: 'parent', role: 'parent', label: '学生家长', desc: '溯源查询', icon: Users },
  { username: 'regulator', role: 'regulator', label: '监管人员', desc: '检查报告导出', icon: Shield },
]

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const selectAccount = (account: typeof demoAccounts[0]) => {
    setUsername(account.username)
    setPassword('123456')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-lg">
        <div className="rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600">
              <LogIn className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">智慧校园食安溯源系统</h1>
            <p className="mt-1 text-sm text-gray-500">请登录以继续</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="请输入用户名"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="请输入密码"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6">
            <p className="mb-3 text-center text-xs font-medium text-gray-500">
              演示账号（点击快捷登录，密码均为 123456）
            </p>
            <div className="grid grid-cols-2 gap-3">
              {demoAccounts.map((account) => {
                const Icon = account.icon
                return (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => selectAccount(account)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50"
                  >
                    <Icon size={16} className="shrink-0 text-blue-600" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">{account.label}</p>
                      <p className="text-[10px] text-gray-400">{account.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
