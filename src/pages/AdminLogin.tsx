import * as React from 'react'
import { User, Lock, ShieldCheck, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import api from '@/lib/api'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [captcha, setCaptcha] = React.useState('')
  const [captchaCode, setCaptchaCode] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const generateCaptcha = React.useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCaptchaCode(result)
  }, [])

  React.useEffect(() => {
    generateCaptcha()
  }, [generateCaptcha])

  const handleLogin = async () => {
    if (!username || !password || !captcha) {
      alert('请填写完整信息')
      return
    }
    if (captcha.toUpperCase() !== captchaCode) {
      alert('验证码错误')
      generateCaptcha()
      setCaptcha('')
      return
    }
    try {
      setLoading(true)
      await api.auth.login({ phone: username, password })
      navigate('/admin/dashboard')
    } catch {
      if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('yamingxuan_token', 'mock_admin_token')
        navigate('/admin/dashboard')
      } else {
        alert('登录失败，请检查用户名和密码')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(200, 166, 11, 0.1) 35px, rgba(200, 166, 11, 0.1) 70px)`,
          }}
        />
      </div>

      <Card variant="ink" className="w-full max-w-md relative z-10 border-jade-700">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cinnabar-600 mb-4 border-2 border-cinnabar-500" style={{ boxShadow: '0 0 0 3px #7a1f1f, 0 4px 20px rgba(155, 45, 45, 0.4)' }}>
              <span className="font-serif text-2xl font-bold text-ink-50" style={{ letterSpacing: '0.1em' }}>雅</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink-50 mb-2 tracking-wider">雅名轩管理后台</h1>
            <p className="text-jade-300 text-sm">专业命名系统管理平台</p>
          </div>

          <div className="space-y-5">
            <Input
              label="账号"
              placeholder="请输入管理员账号"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              className="[&_input]:bg-ink-800/50 [&_input]:text-ink-50 [&_input]:placeholder:text-ink-400 [&_input]:border-b-jade-600 [&_input]:focus:border-b-gold-500 [&_label]:text-jade-200"
            />

            <Input
              label="密码"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              className="[&_input]:bg-ink-800/50 [&_input]:text-ink-50 [&_input]:placeholder:text-ink-400 [&_input]:border-b-jade-600 [&_input]:focus:border-b-gold-500 [&_label]:text-jade-200"
            />

            <div>
              <label className="block text-sm font-medium text-jade-200 mb-1.5">验证码</label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="请输入验证码"
                    value={captcha}
                    onChange={(e) => setCaptcha(e.target.value)}
                    leftIcon={<ShieldCheck className="w-4 h-4" />}
                    className="[&_input]:bg-ink-800/50 [&_input]:text-ink-50 [&_input]:placeholder:text-ink-400 [&_input]:border-b-jade-600 [&_input]:focus:border-b-gold-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="flex-shrink-0 h-10 px-4 rounded-md bg-ink-800 border border-jade-600 flex items-center justify-center gap-2 hover:bg-ink-700 transition-colors group"
                  title="点击刷新验证码"
                >
                  <span className="font-mono text-xl font-bold tracking-widest text-gold-400 select-none" style={{ fontStyle: 'italic', textDecoration: 'line-through', textDecorationColor: 'rgba(207, 166, 50, 0.3)' }}>
                    {captchaCode}
                  </span>
                  <RefreshCw className="w-4 h-4 text-jade-400 group-hover:text-jade-300 transition-colors" />
                </button>
              </div>
            </div>

            <Button
              variant="seal"
              size="lg"
              fullWidth
              loading={loading}
              onClick={handleLogin}
              className="mt-2"
            >
              登 录
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-jade-800 text-center">
            <p className="text-xs text-jade-400">
              测试账号：admin / admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
