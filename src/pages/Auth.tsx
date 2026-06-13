import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, UserPlus } from 'lucide-react'

type AuthProps = {
  mode: 'login' | 'register'
}

export default function Auth({ mode }: AuthProps) {
  const [phone, setPhone] = useState('13800138000')
  const [name, setName] = useState('张伟')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async () => {
    setLoading(true)
    setMessage('')
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name, role: 'user' }),
    })
    const json = await res.json()
    setLoading(false)
    if (json.success) {
      setMessage(mode === 'login' ? '登录成功，已进入演示账号' : '注册成功，已创建演示账号')
    } else {
      setMessage(json.error || '请求失败，请稍后重试')
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="gradient-navy rounded-2xl p-5 text-white">
        <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center mb-4">
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold">{mode === 'login' ? '登录账号' : '注册账号'}</h1>
        <p className="text-white/70 text-sm mt-1">演示账号可直接登录，登录后可查件、下单和查看个人中心。</p>
      </div>

      <div className="card p-4 space-y-3">
        <input
          className="input-field"
          placeholder="手机号"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <input
          className="input-field"
          placeholder="姓名"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button onClick={submit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {mode === 'login' ? '登录' : '注册'}
        </button>
        {message && <p className="text-sm text-accent font-medium">{message}</p>}
      </div>

      <div className="text-center text-sm text-text-light">
        {mode === 'login' ? (
          <Link to="/register" className="text-accent font-semibold">没有账号？立即注册</Link>
        ) : (
          <Link to="/login" className="text-accent font-semibold">已有账号？去登录</Link>
        )}
      </div>
    </div>
  )
}
