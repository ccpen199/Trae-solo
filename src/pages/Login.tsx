import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Phone, Lock, ShoppingCart, Factory, Package } from 'lucide-react'
import { useStore } from '@/store'

const features = [
  { icon: ShoppingCart, title: '采购找货', desc: '一键发布采购需求，精准匹配优质供应商' },
  { icon: Factory, title: '加工接单', desc: '工厂产能实时展示，在线接单高效协同' },
  { icon: Package, title: '辅料供应', desc: '辅料库存透明共享，快速响应供应需求' },
]

export default function Login() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const login = useStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !password) {
      setError('请输入手机号和密码')
      return
    }
    const ok = login(phone, password)
    if (ok) {
      navigate('/')
    } else {
      setError('登录失败，请检查账号密码')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-800 via-navy-700 to-navy-900 bg-pattern-textile flex items-center justify-center p-6">
      <div className="flex flex-col lg:flex-row items-center gap-10 max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl font-bold text-gradient-gold">织链</h1>
            <p className="text-navy-400 mt-2">产业链撮合平台</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                <input
                  type="tel"
                  placeholder="手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-navy-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition text-sm"
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
                <input
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-navy-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              登录
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-navy-400">没有账号？</span>
            <Link to="/register" className="text-sm text-amber-500 hover:text-amber-600 ml-1 font-medium">
              立即注册
            </Link>
          </div>
        </div>

        <div className="space-y-6 max-w-xs">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-navy-600 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">{title}</h3>
                <p className="text-navy-300 text-xs mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
