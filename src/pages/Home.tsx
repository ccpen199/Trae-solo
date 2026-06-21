import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Building2,
  Handshake,
  UserCheck,
  CreditCard,
  Shield,
  HeartPulse,
  Search,
  TrainFront,
  Bus,
  Car,
  ShieldCheck,
  MapPin,
  Search as SearchIcon,
  CalendarCheck,
  FileSignature,
  Headphones,
  ArrowRight,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { mockListings, mockFinancialProducts } from '@/data/mockData'
import type { CommuteMode, ListingType, Listing } from '@/types'

const commuteTabs: { mode: CommuteMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'metro', label: '地铁', icon: <TrainFront size={16} /> },
  { mode: 'bus', label: '公交', icon: <Bus size={16} /> },
  { mode: 'drive', label: '驾车', icon: <Car size={16} /> },
]

const poolCards: {
  type: ListingType
  badge: string
  badgeClass: string
  title: string
  desc: string
  count: string
  icon: React.ReactNode
  border: string
}[] = [
  {
    type: 'ccb_direct',
    badge: '自营',
    badgeClass: 'badge-ccb',
    title: 'CCB自营品牌公寓',
    desc: '建行直营管理，品质保障，拎包入住',
    count: '2,380+',
    icon: <Building2 size={28} className="text-ccb-500" />,
    border: 'border-l-4 border-l-ccb-500',
  },
  {
    type: 'partner',
    badge: '合作',
    badgeClass: 'badge-partner',
    title: '合作运营商房源',
    desc: '白名单运营商，统一服务标准',
    count: '5,620+',
    icon: <Handshake size={28} className="text-emerald-500" />,
    border: 'border-l-4 border-l-emerald-500',
  },
  {
    type: 'personal',
    badge: '个人',
    badgeClass: 'badge-personal',
    title: '经核验个人房源',
    desc: '产权核验+人脸识别，真实可靠',
    count: '8,150+',
    icon: <UserCheck size={28} className="text-amber-500" />,
    border: 'border-l-4 border-l-amber-500',
  },
]

const financialIcons: Record<string, React.ReactNode> = {
  'credit-card': <CreditCard size={28} className="text-gold-500" />,
  shield: <Shield size={28} className="text-gold-500" />,
  'heart-pulse': <HeartPulse size={28} className="text-gold-500" />,
}

const typeBadgeMap: Record<ListingType, { label: string; cls: string }> = {
  ccb_direct: { label: '自营', cls: 'badge-ccb' },
  partner: { label: '合作', cls: 'badge-partner' },
  personal: { label: '个人', cls: 'badge-personal' },
}

const verificationDisplay: Record<ListingType, string[]> = {
  ccb_direct: ['建行直管 ✓'],
  partner: ['白名单准入 ✓', '服务契约 ✓'],
  personal: ['产权核验 ✓', '人脸识别 ✓'],
}

const flowSteps = [
  { icon: <SearchIcon size={28} className="text-ccb-500" />, title: '搜索房源', desc: '智能通勤匹配，精准筛选理想居所', path: '/search' },
  { icon: <CalendarCheck size={28} className="text-ccb-500" />, title: '预约看房', desc: '在线预约看房，专业管家全程陪同', path: '/appointment' },
  { icon: <FileSignature size={28} className="text-ccb-500" />, title: '签署合同', desc: '银行存证上链，电子签约安全便捷', path: '/contract' },
  { icon: <Headphones size={28} className="text-ccb-500" />, title: '租后服务', desc: '维修报备响应，租金托管安心无忧', path: '/service' },
]

const trustItems = [
  { label: '银行存证', desc: '合同上链存证' },
  { label: '住建备案', desc: '官方备案登记' },
  { label: '资金监管', desc: '租金安全托管' },
  { label: '实名认证', desc: '身份真实可溯' },
]

export default function Home() {
  const navigate = useNavigate()
  const { setSearchParams } = useStore()
  const [commuteMode, setCommuteMode] = useState<CommuteMode>('metro')
  const [destination, setDestination] = useState('')

  const handleSearch = () => {
    setSearchParams({ commuteMode, commuteDestination: destination })
    navigate('/search')
  }

  const handlePoolClick = (type: ListingType) => {
    setSearchParams({ listingType: [type] })
    navigate('/search')
  }

  const handleListingClick = (listing: Listing) => {
    navigate(`/listing/${listing.id}`)
  }

  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden bg-gradient-to-br from-ccb-700 to-space-800 py-16 px-4">
        <div className="absolute top-10 left-[10%] h-20 w-20 rotate-45 rounded-lg bg-white/5 animate-float" />
        <div className="absolute top-20 right-[15%] h-14 w-14 rounded-full bg-gold-500/10 animate-float [animation-delay:1s]" />
        <div className="absolute bottom-10 left-[60%] h-24 w-24 rotate-12 rounded-xl bg-ccb-400/10 animate-float [animation-delay:2s]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="font-serif text-4xl font-bold text-white md:text-5xl">
            安居乐业 <span className="text-gold-400">金融赋能</span>
          </h1>
          <p className="mt-3 text-lg text-ccb-100/80">
            建融家园 — 建设银行旗下住房租赁服务平台，让租住更安心
          </p>

          <div className="mt-8 glass-panel rounded-2xl p-4">
            <div className="flex gap-1 rounded-lg bg-space-100/80 p-1">
              {commuteTabs.map((tab) => (
                <button
                  key={tab.mode}
                  onClick={() => setCommuteMode(tab.mode)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                    commuteMode === tab.mode
                      ? 'bg-ccb-500 text-white shadow'
                      : 'text-space-600 hover:text-space-800'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <div className="relative flex-1">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-space-400" />
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="输入通勤目的地，智能推荐房源"
                  className="w-full rounded-lg border border-space-200 bg-white py-2.5 pl-10 pr-3 text-sm text-space-800 placeholder:text-space-400 focus:border-ccb-500 focus:outline-none focus:ring-1 focus:ring-ccb-500"
                />
              </div>
              <button onClick={handleSearch} className="ccb-btn-primary flex items-center gap-1.5">
                <Search size={18} />
                搜索
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="section-title mb-6">三层房源池</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {poolCards.map((card) => (
            <div
              key={card.type}
              onClick={() => handlePoolClick(card.type)}
              className={`card-hover cursor-pointer rounded-xl bg-white p-5 shadow-md ${card.border}`}
            >
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-space-50 p-2.5">{card.icon}</div>
                <span className={card.badgeClass}>{card.badge}</span>
              </div>
              <h3 className="mt-3 font-serif text-lg font-semibold text-space-800">{card.title}</h3>
              <p className="mt-1 text-sm text-space-500">{card.desc}</p>
              <p className="mt-3 text-xl font-bold text-ccb-500">{card.count}<span className="ml-1 text-xs font-normal text-space-400">套房源</span></p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-ccb-50 to-gold-50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="section-title mb-2">开始您的租房之旅</h2>
          <p className="mb-8 text-sm text-space-500">一站式住房租赁服务，从找房到入住全程护航</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {flowSteps.map((step, i) => (
              <div key={step.title} className="glass-panel card-hover rounded-xl bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ccb-50">
                    {step.icon}
                  </div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ccb-500 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-space-800">{step.title}</h3>
                <p className="mt-1 text-sm text-space-500">{step.desc}</p>
                <button
                  onClick={() => navigate(step.path)}
                  className="ccb-btn-primary mt-4 flex w-full items-center justify-center gap-1 text-sm"
                >
                  开始 <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="section-title mb-6">金融产品</h2>
        <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
          {mockFinancialProducts.map((fp) => (
            <div
              key={fp.id}
              className="card-hover min-w-[260px] flex-shrink-0 rounded-xl border border-gold-300/40 bg-gradient-to-br from-gold-50 to-white p-5 shadow-md"
            >
              <div className="rounded-lg bg-gold-100/60 p-2.5">{financialIcons[fp.icon]}</div>
              <h3 className="mt-3 font-serif text-lg font-semibold text-space-800">{fp.name}</h3>
              <p className="mt-1 text-sm text-space-500">{fp.description}</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-lg font-bold text-gold-600">{fp.rate}</span>
                <span className="text-xs text-space-400">{fp.term}</span>
              </div>
              <button className="ccb-btn-gold mt-3 w-full text-center text-sm">立即申请</button>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="section-title mb-6">精选房源</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mockListings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => handleListingClick(listing)}
              className="card-hover cursor-pointer overflow-hidden rounded-xl bg-white shadow-md"
            >
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="h-44 w-full object-cover"
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-space-800 line-clamp-1">{listing.title}</h3>
                  <span className={typeBadgeMap[listing.type].cls}>{typeBadgeMap[listing.type].label}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-x-2">
                  {verificationDisplay[listing.type].map((v) => (
                    <span key={v} className="text-xs text-emerald-600 font-medium">{v}</span>
                  ))}
                </div>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-lg font-bold text-red-500">¥{listing.price.toLocaleString()}<span className="text-xs font-normal text-space-400">/月</span></span>
                  <span className="text-sm text-space-400">{listing.area}㎡</span>
                  <span className="text-sm text-space-400">{listing.district}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-space-800 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-4">
          {trustItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-center">
              <ShieldCheck size={22} className="text-gold-400" />
              <div>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-xs text-space-300">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
