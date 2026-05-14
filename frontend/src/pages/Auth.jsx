import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { Card, Input, Button, LoadingSpinner } from '../components/Common'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      return
    }
    setLoading(true)
    try {
      const success = await login(username, password)
      if (success) {
        navigate('/')
      }
    } catch (err) {}
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ padding: '32px', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>PMCAFF</h1>
          <p style={{ color: '#6b7280' }}>产品人成长社区</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '6px' }}>用户名/邮箱</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名或邮箱"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '6px' }}>密码</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
          <Button type="submit" disabled={loading || !username || !password}>
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          还没有账号？<Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none' }}>立即注册</Link>
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
          <p style={{ fontWeight: '600', marginBottom: '8px' }}>测试账号：</p>
          <p>管理员: admin / admin123</p>
          <p>编辑: editor / editor123</p>
          <p>审核: moderator / moderator123</p>
          <p>普通用户: user1 / user123</p>
        </div>
      </Card>
    </div>
  )
}

export function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', nickname: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) return
    setLoading(true)
    try {
      const success = await register(form)
      if (success) {
        navigate('/login')
      }
    } catch (err) {}
    setLoading(false)
  }

  const updateField = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ padding: '32px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '24px' }}>注册账号</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '6px' }}>用户名 *</label>
            <Input value={form.username} onChange={updateField('username')} placeholder="请输入用户名" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '6px' }}>邮箱 *</label>
            <Input type="email" value={form.email} onChange={updateField('email')} placeholder="请输入邮箱" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '6px' }}>昵称</label>
            <Input value={form.nickname} onChange={updateField('nickname')} placeholder="请输入昵称（选填）" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: '#374151', marginBottom: '6px' }}>密码 *</label>
            <Input type="password" value={form.password} onChange={updateField('password')} placeholder="请输入密码" />
          </div>
          <Button type="submit" disabled={loading || !form.username || !form.email || !form.password}>
            {loading ? '注册中...' : '注册'}
          </Button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          已有账号？<Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>立即登录</Link>
        </div>
      </Card>
    </div>
  )
}
