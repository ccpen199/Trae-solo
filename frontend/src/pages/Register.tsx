import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Bike, Store, Phone, Lock, Smile } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import type { UserRole } from '../types'

interface RegisterForm {
  role: UserRole
  phone: string
  password: string
  confirmPassword: string
  nickname: string
}

const roleOptions: { key: UserRole; label: string; icon: typeof User; color: string }[] = [
  { key: 'user', label: '用户', icon: User, color: 'bg-blue-500' },
  { key: 'rider', label: '骑手', icon: Bike, color: 'bg-green-500' },
  { key: 'merchant', label: '商户', icon: Store, color: 'bg-amber-500' },
]

export default function Register() {
  const [form, setForm] = useState<RegisterForm>({
    role: 'user',
    phone: '',
    password: '',
    confirmPassword: '',
    nickname: '',
  })

  const updateField = <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    if (!form.phone || !form.password || !form.confirmPassword || !form.nickname) return
    if (form.password !== form.confirmPassword) return
  }

  const passwordMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">创建账号</h1>
          <p className="text-gray-500 mt-1">选择角色并填写注册信息</p>
        </div>

        <Card>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择角色</label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => updateField('role', r.key)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      form.role === r.key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${r.color} flex items-center justify-center`}>
                      <r.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="手机号"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="请输入手机号"
              prefix={<Phone className="w-4 h-4" />}
            />

            <Input
              label="密码"
              type="password"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="请输入密码"
              prefix={<Lock className="w-4 h-4" />}
            />

            <Input
              label="确认密码"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              placeholder="请再次输入密码"
              prefix={<Lock className="w-4 h-4" />}
              error={passwordMismatch ? '两次密码输入不一致' : undefined}
            />

            <Input
              label="昵称"
              value={form.nickname}
              onChange={(e) => updateField('nickname', e.target.value)}
              placeholder="请输入昵称"
              prefix={<Smile className="w-4 h-4" />}
            />

            <Button fullWidth size="lg" onClick={handleSubmit}>
              注册
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                已有账号？去登录
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
