import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Briefcase } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败，请检查邮箱和密码')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (email: string, pwd: string) => {
    setEmail(email)
    setPassword(pwd)
    setLoading(true)
    try {
      await login(email, pwd)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">创</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-2">欢迎回来</h1>
          <p className="text-gray-500">登录您的账号，开启创意之旅</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="input-field pl-10"
                  required
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-primary-600 rounded" />
                <span className="ml-2 text-gray-600">记住我</span>
              </label>
              <a href="#" className="text-primary-600 hover:text-primary-700">忘记密码？</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary !py-3 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center mb-3">快速登录测试账号</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('employer1@example.com', '123456')}
                className="p-2 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <User className="w-4 h-4 mx-auto mb-1" />
                雇主账号
              </button>
              <button
                onClick={() => quickLogin('provider1@example.com', '123456')}
                className="p-2 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Briefcase className="w-4 h-4 mx-auto mb-1" />
                服务商账号
              </button>
              <button
                onClick={() => quickLogin('provider2@example.com', '123456')}
                className="p-2 text-xs bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Briefcase className="w-4 h-4 mx-auto mb-1" />
                服务商账号2
              </button>
              <button
                onClick={() => quickLogin('admin@example.com', '123456')}
                className="p-2 text-xs bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <User className="w-4 h-4 mx-auto mb-1" />
                管理员账号
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            还没有账号？
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium ml-1">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
