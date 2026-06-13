import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/authStore'

export default function Login() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [phone, setPhone] = useState('user1')
  const [password, setPassword] = useState('123456')
  const [realName, setRealName] = useState('')
  const [idCard, setIdCard] = useState('')
  const { login, register, loading, error, setError } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      if (tab === 'login') {
        await login(phone, password)
      } else {
        await register({ phone, password, realName, idCard })
      }
      navigate('/')
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center px-4">
      <div className="glass-card p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-gold-500 mb-2">TICKET VAULT</h1>
          <p className="text-carbon-400 text-sm">高并发演出票务交易平台</p>
        </div>

        <div className="flex mb-6">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-3 text-center transition-all ${
              tab === 'login'
                ? 'border-b-2 border-gold-500 text-gold-400 font-bold'
                : 'text-carbon-400 hover:text-white'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-3 text-center transition-all ${
              tab === 'register'
                ? 'border-b-2 border-gold-500 text-gold-400 font-bold'
                : 'text-carbon-400 hover:text-white'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-wine-800/30 border border-wine-700 text-wine-300 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <input
              type="text"
              placeholder="手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white placeholder-carbon-400 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition"
            />
          </div>

          {tab === 'register' && (
            <>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="真实姓名"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white placeholder-carbon-400 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition"
                />
              </div>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="身份证号"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white placeholder-carbon-400 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition"
                />
              </div>
            </>
          )}

          <div className="mb-6">
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white placeholder-carbon-400 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="wine-gradient-btn w-full py-3 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : tab === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-carbon-700/50 text-center text-xs text-carbon-500">
          <p>测试账号:</p>
          <p className="mt-1">admin/123456 (管理员)</p>
          <p>organizer/123456 (主办方)</p>
          <p>user1/123456 (普通用户)</p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ['user1', '普通用户'],
            ['admin', '管理员'],
            ['organizer', '主办方'],
          ].map(([account, label]) => (
            <button
              key={account}
              type="button"
              onClick={() => {
                setPhone(account)
                setPassword('123456')
              }}
              className="rounded-lg border border-carbon-700 px-2 py-2 text-xs text-carbon-300 hover:border-gold-500 hover:text-gold-400"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
