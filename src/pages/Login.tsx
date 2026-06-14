import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Truck, Phone, Shield, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

type Role = 'driver' | 'shipper'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [isRegister, setIsRegister] = useState(false)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('driver')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendCode = () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的手机号')
      return
    }
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!phone || !code) {
      setError('请填写完整信息')
      return
    }
    setLoading(true)
    try {
      if (isRegister) {
        if (!name) {
          setError('请输入姓名')
          setLoading(false)
          return
        }
        await login(phone, code, role)
      } else {
        await login(phone, code, role)
      }
      navigate('/')
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-500 via-navy-600 to-navy-700 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-amber-500 flex items-center justify-center mb-4">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-navy-500">运税通</h1>
            <p className="text-sm text-gray-500 mt-1">货运司机税务合规平台</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-coral-50 border border-coral-200 rounded-lg text-coral-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  maxLength={11}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入真实姓名"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入验证码"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={countdown > 0}
                  className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-lg border border-amber-500 text-amber-500 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    role === 'driver'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-amber-300'
                  }`}
                >
                  司机
                </button>
                <button
                  type="button"
                  onClick={() => setRole('shipper')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    role === 'shipper'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-amber-300'
                  }`}
                >
                  货主
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '处理中...' : isRegister ? '注册' : '登录'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {isRegister ? '已有账号？' : '没有账号？'}
            <button
              onClick={() => {
                setIsRegister(!isRegister)
                setError('')
              }}
              className="text-amber-500 font-medium hover:text-amber-600 ml-1"
            >
              {isRegister ? '去登录' : '立即注册'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
