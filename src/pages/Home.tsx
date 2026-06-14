import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  ShieldCheck,
  FileText,
  Wallet,
  CreditCard,
  Layers,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Clock,
  Users,
  ChevronRight,
} from 'lucide-react'
import { serviceItems, hotKeywords } from '@/data'
import { cn } from '@/lib/utils'

const quickEntries = [
  { label: '免证办', icon: ShieldCheck, href: '/certificates', gradient: 'from-gov-blue to-gov-mid' },
  { label: '我要办事', icon: FileText, href: '/services', gradient: 'from-gov-navy to-gov-mid' },
  { label: '生活缴费', icon: Wallet, href: '/life', gradient: 'from-emerald-500 to-teal-500' },
  { label: '电子证照', icon: CreditCard, href: '/certificates', gradient: 'from-amber-500 to-orange-500' },
  { label: '授权管理', icon: ShieldCheck, href: '/certificates', gradient: 'from-sky-500 to-blue-600' },
  { label: '联办套餐', icon: Layers, href: '/services/joint', gradient: 'from-violet-500 to-purple-500' },
]

const announcements = [
  { title: '深圳市政务服务"免证办"清单新增53项，覆盖高频民生领域', date: '2026-06-08' },
  { title: '关于优化营商环境推进"一窗通办"改革实施方案的通知', date: '2026-06-05' },
  { title: '2026年度深圳市人才引进补贴申报指南正式发布', date: '2026-06-02' },
  { title: '政务服务跨城通办再扩容，新增粤港澳大湾区6城互认', date: '2026-05-28' },
]

const dashboardStats = [
  { label: '累计办件量', value: '2,856,432', trend: '+12.5%', up: true, icon: TrendingUp },
  { label: '在线办理率', value: '94.8%', trend: '+3.2%', up: true, icon: Clock },
  { label: '平均办理时长', value: '2.3天', trend: '-15.6%', up: false, icon: ArrowDown },
  { label: '证照调用量', value: '1,523,678', trend: '+28.3%', up: true, icon: Users },
]

const topKeywords = hotKeywords.slice(0, 6)

const topServices = serviceItems.slice(0, 8)

const categoryIcons: Record<string, string> = {
  sc_1_1: '🏠',
  sc_1_2: '📋',
  sc_1_3: '🪪',
  sc_2_2: '🔄',
  sc_2_3: '🏥',
  sc_3_1: '🏦',
  sc_3_2: '🏠',
  sc_3_3: '🏘️',
  sc_4_1: '🏢',
  sc_4_2: '⚕️',
  sc_4_3: '📄',
  sc_5_1: '🚗',
  sc_5_2: '🚙',
  sc_5_3: '⚠️',
}

export default function Home() {
  const navigate = useNavigate()
  const [heroSearch, setHeroSearch] = useState('')

  const submitHeroSearch = () => {
    const q = heroSearch.trim()
    navigate(q ? `/services?q=${encodeURIComponent(q)}` : '/services')
  }

  return (
    <div className="min-h-screen bg-gov-slate pb-12">
      <section className="relative bg-gradient-to-br from-gov-navy via-gov-dark to-gov-navy overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gov-blue/5 blur-3xl" />
        <div className="relative container mx-auto px-4 pt-16 pb-20">
          <h1 className="text-center text-white/90 text-lg mb-1 tracking-wider font-serif">
            深圳市政务服务平台
          </h1>
          <p className="text-center text-white/50 text-sm mb-8">
            让群众少跑腿，让数据多跑路
          </p>
          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={heroSearch}
                onChange={(event) => setHeroSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') submitHeroSearch()
                }}
                placeholder="搜索政务服务事项、政策法规..."
                className="w-full h-14 pl-14 pr-24 rounded-xl shadow-lg bg-white/95 text-gov-dark placeholder:text-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-gov-gold/60 transition-all"
              />
              <button
                type="button"
                onClick={submitHeroSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-gov-blue px-4 py-2 text-sm font-medium text-white hover:bg-gov-mid transition-colors"
              >
                搜索
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {topKeywords.map((kw) => (
                <Link
                  key={kw.id}
                  to={`/services?q=${encodeURIComponent(kw.keyword)}`}
                  className="px-3.5 py-1.5 rounded-full text-sm text-white/80 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                >
                  {kw.keyword}
                </Link>
              ))}
            </div>
          </div>
          <p className="text-center text-white/40 text-xs mt-8 tracking-wide">
            已接入8000+事项 &nbsp;|&nbsp; 407类电子证照 &nbsp;|&nbsp; 19家生活服务
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-10 relative z-10">
        <div className="flex justify-center gap-6 md:gap-10">
          {quickEntries.map((entry) => (
            <Link
              key={entry.label}
              to={entry.href}
              className="group flex flex-col items-center gap-2"
            >
              <div className={cn(
                'w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center shadow-md',
                'group-hover:scale-105 group-hover:shadow-lg transition-all duration-200',
                entry.gradient
              )}>
                <entry.icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm text-gov-navy font-medium">{entry.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="gov-section-title">热门服务</h2>
          <Link to="/services" className="flex items-center text-sm text-gov-blue hover:text-gov-mid transition-colors">
            查看全部 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1 snap-x">
          {topServices.map((item) => (
            <Link
              key={item.id}
              to={`/services/${item.id}`}
              className="gov-card flex-shrink-0 w-52 p-4 snap-start hover:border-gov-blue/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{categoryIcons[item.category] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gov-navy truncate group-hover:text-gov-blue transition-colors">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{item.department}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn(
                  'gov-badge text-[11px]',
                  item.onlineRate >= 95 ? 'gov-badge-green' : item.onlineRate >= 80 ? 'gov-badge-blue' : 'gov-badge-yellow'
                )}>
                  {item.onlineRate}%可网办
                </span>
                <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                  <Users className="w-3 h-3" />
                  {String(Math.floor(Math.random() * 5000 + 1000))}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="gov-section-title">通知公告</h2>
          <Link to="/announcements" className="flex items-center text-sm text-gov-blue hover:text-gov-mid transition-colors">
            更多 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="gov-card p-5">
          <ul className="space-y-3.5">
            {announcements.map((a, i) => (
              <li key={i} className="flex items-start gap-3 group">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gov-gold flex-shrink-0" />
                <Link
                  to="/announcements"
                  className="flex-1 text-sm text-gray-700 group-hover:text-gov-blue transition-colors leading-relaxed"
                >
                  {a.title}
                </Link>
                <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{a.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container mx-auto px-4 mt-10">
        <h2 className="gov-section-title mb-5">数据概览</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dashboardStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-gradient-to-br from-gov-navy to-gov-mid rounded-lg p-5 text-white"
            >
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className="w-4 h-4 text-gov-gold" />
                <span className="text-xs text-white/70">{stat.label}</span>
              </div>
              <p className="gov-stat-number text-white">{stat.value}</p>
              <div className={cn(
                'flex items-center gap-1 mt-2 text-xs',
                stat.up ? 'text-emerald-300' : 'text-amber-300'
              )}>
                {stat.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                <span>{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
