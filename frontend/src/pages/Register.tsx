import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Truck, User, Lock, Eye, EyeOff, Phone, Mail, Building2, ChevronDown } from 'lucide-react'

const ROLES = [
  { value: 'shipper', label: '货主' },
  { value: 'driver', label: '司机' },
  { value: 'carrier', label: '承运商' },
]

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirm_password: '',
    real_name: '',
    phone: '',
    email: '',
    role: 'shipper',
    company_name: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { register, loading } = useAuthStore()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm_password) {
      setError('两次输入的密码不一致')
      return
    }
    try {
      const { confirm_password, ...data } = form
      await register(data)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || '注册失败，请稍后重试')
    }
  }

  const inputClass =
    'w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-[#E8722A] focus:ring-1 focus:ring-[#E8722A] transition-colors'
  const labelClass = 'block text-white/80 text-sm mb-2'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B2A4A] to-[#2D4A7A] px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-[#E8722A] flex items-center justify-center mb-4 shadow-lg">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">公路物流信息协同中枢</h1>
            <p className="text-white/60 mt-2 text-sm">创建新账户</p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  className={`${inputClass} !pr-11`}
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>确认密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  name="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={handleChange}
                  className={`${inputClass} !pr-11`}
                  placeholder="请再次输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>真实姓名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  name="real_name"
                  type="text"
                  value={form.real_name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="请输入真实姓名"
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>手机号</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="请输入手机号"
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="请输入邮箱"
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>角色</label>
              <div className="relative">
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full pl-4 pr-11 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#E8722A] focus:ring-1 focus:ring-[#E8722A] transition-colors appearance-none"
                  required
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value} className="bg-[#1B2A4A] text-white">
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>公司名称</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  name="company_name"
                  type="text"
                  value={form.company_name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="请输入公司名称"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#E8722A] hover:bg-[#d0651f] disabled:bg-[#E8722A]/50 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed mt-2"
            >
              {loading ? '注册中...' : '注 册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-white/50 text-sm">已有账户？</span>
            <Link to="/login" className="text-[#E8722A] hover:text-[#f08a44] text-sm font-medium ml-1 transition-colors">
              立即登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
