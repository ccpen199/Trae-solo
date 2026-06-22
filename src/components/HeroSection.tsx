import { Link } from 'react-router-dom'
import { Search, PawPrint, Heart, Baby, MessageCircle, ShoppingBag, Users } from 'lucide-react'

const quickNavItems = [
  { path: '/pets', label: '宠物档案', icon: PawPrint, color: 'bg-primary-100 text-primary' },
  { path: '/adoptions', label: '领养中心', icon: Heart, color: 'bg-red-50 text-red-500' },
  { path: '/breedings', label: '配种广场', icon: Baby, color: 'bg-purple-50 text-purple-500' },
  { path: '/qa', label: '问答社区', icon: MessageCircle, color: 'bg-blue-50 text-blue-500' },
  { path: '/shop', label: '宠物商城', icon: ShoppingBag, color: 'bg-amber-50 text-amber-600' },
  { path: '/community', label: '社区动态', icon: Users, color: 'bg-secondary-50 text-secondary' },
]

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-orange-400 to-amber-300">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full animate-float" />
        <div className="absolute top-1/2 left-10 w-40 h-40 bg-white/5 rounded-full animate-float stagger-2" />
        <div className="absolute bottom-10 right-1/4 w-32 h-32 bg-white/10 rounded-full animate-float stagger-4" />
      </div>

      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="heading-font text-3xl md:text-5xl font-bold text-white mb-4 animate-fadeIn">
            宠物全生命周期
            <br />
            社区服务平台
          </h1>
          <p className="text-white/90 text-lg md:text-xl mb-8 animate-fadeIn stagger-2">
            从档案管理到健康守护，从领养配种到社区互助
          </p>

          <div className="relative max-w-lg mx-auto animate-fadeIn stagger-3">
            <input
              type="text"
              placeholder="搜索宠物品种、服务、社区话题..."
              className="w-full px-5 py-3.5 pl-12 bg-white/95 backdrop-blur rounded-2xl text-text-primary placeholder:text-text-secondary/60 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
          </div>
        </div>
      </div>

      <div className="relative container mx-auto px-4 pb-8 -mb-6">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
          {quickNavItems.map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-sm card-hover animate-slideUp stagger-${index + 1}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-text-primary">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
