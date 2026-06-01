import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { authApi } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [loginType, setLoginType] = useState('code')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)

  const sendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      alert('请输入正确的手机号')
      return
    }
    try {
      await authApi.sendCode(phone)
      alert('验证码已发送（测试验证码：123456）')
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      alert('发送失败')
    }
  }

  const handleLogin = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      alert('请输入正确的手机号')
      return
    }

    const data = loginType === 'code' 
      ? { phone, code: code || '123456' }
      : { phone, password: password || '123456' }

    setLoading(true)
    try {
      const res = await authApi.login(data)
      login(res.data.token, res.data.user)
      navigate('/')
    } catch (error) {
      alert(error.response?.data?.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="text-center mt-12 mb-8">
        <h1 className="text-2xl font-bold text-red-500">澳门旅行</h1>
        <p className="text-gray-500 mt-2">登录发现更多精彩</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">手机号</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="请输入手机号"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-500"
          />
        </div>

        {loginType === 'code' ? (
          <div>
            <label className="block text-sm text-gray-600 mb-1">验证码</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入验证码"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-500"
              />
              <button
                onClick={sendCode}
                disabled={countdown > 0}
                className={`px-4 py-3 rounded-lg whitespace-nowrap ${
                  countdown > 0
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-red-500 text-white'
                }`}
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">测试验证码：123456</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm text-gray-600 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-red-500"
            />
            <p className="text-xs text-gray-400 mt-1">测试密码：123456</p>
          </div>
        )}

        <button
          onClick={() => setLoginType(loginType === 'code' ? 'password' : 'code')}
          className="text-sm text-red-500"
        >
          {loginType === 'code' ? '密码登录' : '验证码登录'}
        </button>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-red-500 text-white py-3 rounded-lg font-medium disabled:bg-gray-300"
        >
          {loading ? '登录中...' : '登录'}
        </button>

        <p className="text-center text-xs text-gray-400">
          未注册的手机号验证后将自动创建账号
        </p>
      </div>
    </div>
  )
}
