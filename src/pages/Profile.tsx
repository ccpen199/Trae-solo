import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Heart, Calendar, FileText, Settings, LogOut, ChevronRight, Home, Briefcase, Lightbulb, Sparkles } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CaseCard from '@/components/CaseCard'
import DesignerCard from '@/components/DesignerCard'
import { useAppStore } from '@/hooks/useAppStore'
import { fetchApi } from '@/lib/api'
import type { CaseItem, DesignerItem } from '@/lib/types'

const MENU_ITEMS = [
  { icon: Heart, label: '我的收藏', to: '/favorites', count: 0 },
  { icon: Calendar, label: '预约记录', to: '/profile/appointments', count: 0 },
  { icon: FileText, label: '报价方案', to: '/profile/quotes', count: 0 },
  { icon: Briefcase, label: '浏览历史', to: '/profile/history', count: 0 },
  { icon: Settings, label: '账号设置', to: '/profile/settings', count: null },
]

export default function Profile() {
  const { currentUserId, favorites } = useAppStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'quotes' | 'history'>('overview')
  const [recCases, setRecCases] = useState<CaseItem[]>([])
  const [recDesigners, setRecDesigners] = useState<DesignerItem[]>([])
  const [recLoading, setRecLoading] = useState(true)

  useEffect(() => {
    setRecLoading(true)
    const favCaseStyles = new Set<string>()
    const favDesignerRegions = new Set<string>()
    favorites.forEach((f) => {
      if (f.type === 'case' && f.style) favCaseStyles.add(f.style)
      if (f.type === 'designer' && f.region) favDesignerRegions.add(f.region)
    })

    const casePromise = fetchApi<{ items: CaseItem[] }>(
      `/api/cases?limit=3${favCaseStyles.size ? `&style=${encodeURIComponent(Array.from(favCaseStyles)[0])}` : ''}`
    ).then(d => d.items).catch(() => [])

    const designerPromise = fetchApi<{ items: DesignerItem[] }>(
      `/api/designers?limit=3${favDesignerRegions.size ? `&region=${encodeURIComponent(Array.from(favDesignerRegions)[0])}` : ''}`
    ).then(d => d.items).catch(() => [])

    Promise.all([casePromise, designerPromise]).then(([c, d]) => {
      setRecCases(c)
      setRecDesigners(d)
      setRecLoading(false)
    })
  }, [favorites])

  const userInfo = {
    id: currentUserId,
    name: '业主用户',
    phone: '138****8888',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional+portrait+asian+person&image_size=square_hd',
    memberLevel: '黄金会员',
    registerDate: '2024-01-15',
  }

  const stats = [
    { label: '收藏案例', value: favorites.filter(f => f.type === 'case').length },
    { label: '收藏设计师', value: favorites.filter(f => f.type === 'designer').length },
    { label: '预约次数', value: 0 },
    { label: '报价方案', value: 0 },
  ]

  return (
    <div className="min-h-screen bg-sand-100">
      <Navbar />

      <header className="border-b border-sand-200 bg-white/60">
        <div className="mx-auto max-w-8xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-sand-900">个人中心</h1>
          <p className="mt-2 text-sm text-sand-900/60">管理您的收藏、预约和报价方案</p>
        </div>
      </header>

      <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-sand-200 bg-white p-6">
              <div className="flex items-center gap-4">
                <img src={userInfo.avatar} alt={userInfo.name} className="h-20 w-20 rounded-full object-cover" />
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold text-sand-900">{userInfo.name}</h2>
                  <p className="text-sm text-sand-900/60">{userInfo.phone}</p>
                  <span className="mt-1 inline-block rounded-full bg-sand-400/10 px-2.5 py-0.5 text-xs font-medium text-sand-600">
                    {userInfo.memberLevel}
                  </span>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-sand-100 pt-4">
                {stats.map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="font-display text-2xl font-bold text-sand-900">{s.value}</p>
                    <p className="mt-0.5 text-xs text-sand-900/60">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-2">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-sand-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sand-50">
                      <item.icon size={18} className="text-sand-600" />
                    </div>
                    <span className="text-sm font-medium text-sand-900">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.count !== null && item.count > 0 && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{item.count}</span>
                    )}
                    <ChevronRight size={16} className="text-sand-300" />
                  </div>
                </Link>
              ))}
            </div>

            <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50">
              <LogOut size={16} /> 退出登录
            </button>
          </div>

          <div className="lg:col-span-2">
            <div className="flex gap-1 rounded-xl bg-white p-1 border border-sand-200">
              {(['overview', 'appointments', 'quotes', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-sand-400 text-white'
                      : 'text-sand-900/60 hover:bg-sand-50'
                  }`}
                >
                  {tab === 'overview' && '概览'}
                  {tab === 'appointments' && '预约记录'}
                  {tab === 'quotes' && '报价方案'}
                  {tab === 'history' && '浏览历史'}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-sand-200 bg-white p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="font-display text-lg font-semibold text-sand-900">常用功能</h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Link to="/calculator" className="flex flex-col items-center gap-2 rounded-xl border border-sand-200 p-4 transition-colors hover:bg-sand-50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sage-400/10">
                        <Home size={20} className="text-sage-600" />
                      </div>
                      <span className="text-sm font-medium text-sand-900">装修报价</span>
                    </Link>
                    <Link to="/cases" className="flex flex-col items-center gap-2 rounded-xl border border-sand-200 p-4 transition-colors hover:bg-sand-50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sand-400/10">
                        <Heart size={20} className="text-sand-600" />
                      </div>
                      <span className="text-sm font-medium text-sand-900">找灵感</span>
                    </Link>
                    <Link to="/designers" className="flex flex-col items-center gap-2 rounded-xl border border-sand-200 p-4 transition-colors hover:bg-sand-50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sage-400/10">
                        <User size={20} className="text-sage-600" />
                      </div>
                      <span className="text-sm font-medium text-sand-900">找设计师</span>
                    </Link>
                    <Link to="/favorites" className="flex flex-col items-center gap-2 rounded-xl border border-sand-200 p-4 transition-colors hover:bg-sand-50">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
                        <Heart size={20} className="text-red-500" />
                      </div>
                      <span className="text-sm font-medium text-sand-900">我的收藏</span>
                    </Link>
                  </div>

                  <div className="mt-8 rounded-xl bg-sand-50 p-6">
                    <h4 className="flex items-center gap-2 font-display text-base font-semibold text-sand-900">
                      <Lightbulb size={18} className="text-sage-600" /> 装修小贴士
                    </h4>
                    <p className="mt-2 text-sm text-sand-900/70 leading-relaxed">
                      装修前建议先浏览30+个同户型案例，确定自己喜欢的风格。可以使用收藏功能保存喜欢的案例，
                      预约3位以上设计师进行量房对比，这样能更准确地把握装修预算和效果。
                    </p>
                  </div>

                  <div className="mt-8">
                    <div className="mb-4 flex items-end justify-between">
                      <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-sand-900">
                        <Sparkles size={18} className="text-sand-500" />
                        为您推荐
                      </h3>
                      <span className="text-xs text-sand-900/40">
                        {favorites.length > 0 ? '基于您的收藏偏好推荐' : '热门精选'}
                      </span>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-medium text-sand-900/70">推荐案例</h4>
                          <Link to="/cases" className="text-xs text-sand-400 hover:underline">查看更多</Link>
                        </div>
                        {recLoading ? (
                          <div className="grid gap-4 sm:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-sand-200" />
                            ))}
                          </div>
                        ) : recCases.length > 0 ? (
                          <div className="grid gap-4 sm:grid-cols-3">
                            {recCases.map((c) => <CaseCard key={c.id} item={c} />)}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-sand-900/40 text-sm">暂无推荐案例</div>
                        )}
                      </div>
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-medium text-sand-900/70">推荐设计师</h4>
                          <Link to="/designers" className="text-xs text-sand-400 hover:underline">查看更多</Link>
                        </div>
                        {recLoading ? (
                          <div className="grid gap-4 sm:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="h-32 animate-pulse rounded-xl bg-sand-200" />
                            ))}
                          </div>
                        ) : recDesigners.length > 0 ? (
                          <div className="grid gap-4 sm:grid-cols-3">
                            {recDesigners.map((d) => <DesignerCard key={d.id} designer={d} showActions={false} />)}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-sand-900/40 text-sm">暂无推荐设计师</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sand-100">
                    <Calendar size={28} className="text-sand-300" />
                  </div>
                  <p className="font-display text-lg text-sand-900/40">暂无预约记录</p>
                  <Link to="/designers" className="mt-4 inline-block text-sm text-sand-400 hover:underline">
                    去预约设计师 →
                  </Link>
                </div>
              )}

              {activeTab === 'quotes' && (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sand-100">
                    <FileText size={28} className="text-sand-300" />
                  </div>
                  <p className="font-display text-lg text-sand-900/40">暂无报价方案</p>
                  <Link to="/calculator" className="mt-4 inline-block text-sm text-sand-400 hover:underline">
                    去计算装修报价 →
                  </Link>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sand-100">
                    <Briefcase size={28} className="text-sand-300" />
                  </div>
                  <p className="font-display text-lg text-sand-900/40">暂无浏览记录</p>
                  <Link to="/cases" className="mt-4 inline-block text-sm text-sand-400 hover:underline">
                    去浏览案例 →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
