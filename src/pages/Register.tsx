import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Factory, Package, Palette, Upload, CheckCircle2, ChevronRight } from 'lucide-react'
import { useStore, type User } from '@/store'

const roles: { key: User['role']; label: string; icon: typeof ShoppingCart; desc: string }[] = [
  { key: 'buyer', label: '采购商', icon: ShoppingCart, desc: '发布采购需求，匹配优质供应商' },
  { key: 'factory', label: '加工厂', icon: Factory, desc: '展示产能实力，高效接单生产' },
  { key: 'supplier', label: '辅料供应商', icon: Package, desc: '管理辅料库存，快速响应供应' },
  { key: 'designer', label: '设计师', icon: Palette, desc: '展示设计作品，对接品牌方需求' },
]

const qualificationLabels: Record<string, string> = {
  buyer: '营业执照',
  factory: '工厂执照',
  supplier: '营业执照',
  designer: '作品集',
}

export default function Register() {
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState<User['role'] | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const register = useStore((s) => s.register)
  const navigate = useNavigate()

  const handleRoleSelect = (role: User['role']) => {
    setSelectedRole(role)
    setStep(2)
  }

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone || !password || !company) {
      setError('请填写所有信息')
      return
    }
    setError('')
    setStep(3)
  }

  const handleSubmit = () => {
    if (!selectedRole) return
    const ok = register({
      name,
      phone,
      password,
      company,
      role: selectedRole,
      qualificationType: qualificationLabels[selectedRole],
    })
    if (ok) {
      navigate('/')
    }
  }

  const handleFileClick = () => {
    setFileName(qualificationLabels[selectedRole!] + '_已上传.pdf')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-800 via-navy-700 to-navy-900 bg-pattern-textile flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="font-serif text-3xl font-bold text-gradient-gold">织链</h1>
          <p className="text-navy-400 mt-1">产业链撮合平台 · 注册</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? 'bg-amber-500 text-white' : 'bg-navy-100 text-navy-400'
                }`}
              >
                {step > s ? <CheckCircle2 size={18} /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 ${step > s ? 'bg-amber-500' : 'bg-navy-100'}`} />
              )}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-lg font-medium text-navy-700 mb-4">选择您的角色</h2>
            <div className="grid grid-cols-2 gap-3">
              {roles.map(({ key, label, icon: Icon, desc }) => (
                <button
                  key={key}
                  onClick={() => handleRoleSelect(key)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 hover:border-amber-400 hover:shadow-md ${
                    selectedRole === key ? 'border-amber-500 bg-amber-50' : 'border-navy-100'
                  }`}
                >
                  <Icon size={24} className="text-amber-500 mb-2" />
                  <p className="font-medium text-navy-700 text-sm">{label}</p>
                  <p className="text-xs text-navy-400 mt-1">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Next} className="space-y-4">
            <h2 className="text-lg font-medium text-navy-700 mb-4">填写基本信息</h2>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">{error}</div>
            )}
            <div>
              <label className="block text-sm text-navy-500 mb-1">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-navy-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="block text-sm text-navy-500 mb-1">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 border border-navy-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                placeholder="请输入手机号"
              />
            </div>
            <div>
              <label className="block text-sm text-navy-500 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-navy-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                placeholder="请输入密码"
              />
            </div>
            <div>
              <label className="block text-sm text-navy-500 mb-1">公司名称</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-2.5 border border-navy-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm"
                placeholder="请输入公司名称"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              下一步 <ChevronRight size={16} />
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-navy-700 mb-2">行业资质核验</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
              请上传您的{qualificationLabels[selectedRole!]}以完成资质认证
            </div>
            <div>
              <label className="block text-sm text-navy-500 mb-2">
                上传{qualificationLabels[selectedRole!]}
              </label>
              <button
                type="button"
                onClick={handleFileClick}
                className="w-full py-8 border-2 border-dashed border-navy-200 rounded-lg flex flex-col items-center gap-2 hover:border-amber-400 transition-colors"
              >
                <Upload size={24} className="text-navy-300" />
                <span className="text-sm text-navy-400">
                  {fileName || '点击选择文件上传'}
                </span>
              </button>
              {fileName && (
                <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={14} /> {fileName}
                </p>
              )}
            </div>
            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              提交注册
            </button>
            <div className="bg-navy-50 border border-navy-100 rounded-lg p-3 text-xs text-navy-500">
              提交后资质将进入审核流程，审核期间您仍可使用平台基本功能。
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <span className="text-sm text-navy-400">已有账号？</span>
          <Link to="/login" className="text-sm text-amber-500 hover:text-amber-600 ml-1 font-medium">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  )
}
