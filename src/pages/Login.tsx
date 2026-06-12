import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { apiFetch } from '@/lib/api'
import { Stethoscope, Phone, Lock, ChevronDown } from 'lucide-react'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'talent' | 'institution'>('talent')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password, role }),
      })
      login(data.user, data.token)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Stethoscope className="w-12 h-12 text-teal-700 mx-auto mb-3" />
          <h1 className="font-heading text-2xl font-bold">登录医聘通</h1>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-sm border border-stone-200">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">角色</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'talent' | 'institution')}
                className="w-full h-11 pl-4 pr-10 border border-stone-300 rounded-lg appearance-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="talent">医疗人才</option>
                <option value="institution">医疗机构</option>
              </select>
              <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-1">手机号</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full h-11 pl-10 pr-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-1">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full h-11 pl-10 pr-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 disabled:opacity-50 transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="text-center text-sm text-stone-500 mt-4">
            还没有账号？<Link to="/register" className="text-teal-700 hover:text-teal-800 font-medium">立即注册</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
