import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  FileCheck,
  ChevronRight,
  Clock,
  Star,
  TrendingUp,
  Landmark,
  Sparkles,
  Sun,
  Compass,
  CheckCircle2,
  FileText,
  Wrench,
  RefreshCw,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { mockListings, mockFinancialProducts } from '@/data/mockData'
import type { CommuteMode, ListingType, Listing } from '@/types'

const commuteTabs: { mode: CommuteMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'metro', label: '地铁', icon: <TrainFront size={18} /> },
  { mode: 'bus', label: '公交', icon: <Bus size={18} /> },
  { mode: 'drive', label: '驾车', icon: <Car size={18} /> },
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
  features: string[]
  verificationItems: { label: string; value: string; status: 'verified' | 'pending' }[]
}[] = [
  {
    type: 'ccb_direct',
    badge: '建行自营',
    badgeClass: 'badge-ccb',
    title: 'CCB 自营品牌公寓',
    desc: '建行直营管理，品质保障，拎包入住',
    count: '2,380+',
    icon: <Building2 size={32} className="text-ccb-500" />,
    border: 'border-l-4 border-l-ccb-500',
    features: ['直营管理体系 V3.0', '统一服务标准', '品质保障承诺'],
    verificationItems: [
      { label: '直营管理体系', value: '建融家园V3.0', status: 'verified' },
      { label: '服务标准编号', value: 'FWBZ-2026-001', status: 'verified' },
      { label: '定期品质检查', value: '每月2次', status: 'verified' },
    ],
  },
  {
    type: 'partner',
    badge: '白名单合作',
    badgeClass: 'badge-partner',
    title: '合作运营商房源',
    desc: '白名单运营商，统一服务标准',
    count: '5,620+',
    icon: <Handshake size={32} className="text-emerald-500" />,
    border: 'border-l-4 border-l-emerald-500',
    features: ['资质白名单审核', '服务标准契约', '定期考核淘汰'],
    verificationItems: [
      { label: '白名单资质', value: '已准入', status: 'verified' },
      { label: '服务契约编号', value: 'SC-2026-0089', status: 'verified' },
      { label: '契约有效期至', value: '2027-12-31', status: 'verified' },
    ],
  },
  {
    type: 'personal',
    badge: '双重核验',
    badgeClass: 'badge-personal',
    title: '经核验个人房源',
    desc: '产权核验+人脸识别，真实可靠',
    count: '8,150+',
    icon: <UserCheck size={32} className="text-amber-500" />,
    border: 'border-l-4 border-l-amber-500',
    features: ['产权证书核验', '人脸识别复核', '真实房源保障'],
    verificationItems: [
      { label: '产权核验', value: '已通过', status: 'verified' },
      { label: '人脸识别', value: '置信度99.2%', status: 'verified' },
      { label: '最近核验时间', value: '2026-05-20', status: 'verified' },
    ],
  },
]

const businessPreviews = [
  {
    icon: <SearchIcon size={24} />,
    title: '智能房源搜索',
    desc: '通勤地图测算·预算智能推荐·AI户型解析',
    path: '/search',
    color: 'from-ccb-500 to-ccb-600',
    bgColor: 'bg-ccb-50',
    textColor: 'text-ccb-600',
    highlights: ['地铁/公交/驾车三模式通勤', '预算浮动区间智能推荐', 'AI解析户型采光朝向'],
  },
  {
    icon: <CalendarCheck size={24} />,
    title: '在线预约看房',
    desc: '时间锁定·经纪人确认·全程可追溯',
    path: '/appointment',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    highlights: ['30分钟时间锁定保护', '经纪人在线确认', '完整预约时间线'],
  },
  {
    icon: <FileSignature size={24} />,
    title: '电子合同签署',
    desc: '银行存证·住建备案·全程上链',
    path: '/contract',
    color: 'from-gold-500 to-gold-600',
    bgColor: 'bg-gold-50',
    textColor: 'text-gold-600',
    highlights: ['建行电子存证盖章', '住建部备案回执', '四步签约流程'],
  },
  {
    icon: <CreditCard size={24} />,
    title: '租金支付中心',
    desc: '多渠道支付·资金监管·穿透审计',
    path: '/payment',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    highlights: ['建行卡/银联/分期任选', '资金监管账户托管', '穿透式审计追踪'],
  },
  {
    icon: <Wrench size={24} />,
    title: '租后报修服务',
    desc: '智能派单·服务商匹配·评价回流',
    path: '/service',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    highlights: ['在线报修一键提交', '智能匹配优质服务商', '服务评价反哺考核'],
  },
  {
    icon: <Landmark size={24} />,
    title: '监管备案后台',
    desc: '合同备案·资金审计·角色权限',
    path: '/admin',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
    highlights: ['住建部合同备案', '资金流水穿透审计', '多角色权限工作台'],
  },
]

const flowSteps = [
  { step: 1, title: '搜索房源', desc: '智能通勤匹配，预算筛选', path: '/search' },
  { step: 2, title: '预约看房', desc: '在线选时，经纪人确认', path: '/appointment' },
  { step: 3, title: '签署合同', desc: '电子签约，银行存证', path: '/contract' },
  { step: 4, title: '支付租金', desc: '多渠道支付，资金监管', path: '/payment' },
  { step: 5, title: '租后服务', desc: '在线报修，评价反馈', path: '/service' },
  { step: 6, title: '监管备案', desc: '住建备案，审计追踪', path: '/admin' },
]

const trustItems = [
  { label: '银行存证', desc: '合同上链存证', icon: <ShieldCheck size={20} /> },
  { label: '住建备案', desc: '官方备案登记', icon: <FileCheck size={20} /> },
  { label: '资金监管', desc: '租金安全托管', icon: <CreditCard size={20} /> },
  { label: '实名认证', desc: '身份真实可溯', icon: <UserCheck size={20} /> },
]

const typeBadgeMap: Record<ListingType, { label: string; cls: string }> = {
  ccb_direct: { label: '自营', cls: 'badge-ccb' },
  partner: { label: '合作', cls: 'badge-partner' },
  personal: { label: '个人', cls: 'badge-personal' },
}

export default function Home() {
  const navigate = useNavigate()
  const { setSearchParams } = useStore()
  const [commuteMode, setCommuteMode] = useState<CommuteMode>('metro')
  const [destination, setDestination] = useState('')
  const [activePool, setActivePool] = useState<ListingType | null>(null)

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
    <div className="min-h-screen animate-fade-in">
      <section className="relative overflow-hidden bg-gradient-to-br from-ccb-700 via-ccb-600 to-space-800 pb-24">
        <div className="absolute top-16 left-[8%] h-24 w-24 rotate-45 rounded-lg bg-white/5 animate-float" />
        <div className="absolute top-32 right-[12%] h-16 w-16 rounded-full bg-gold-500/15 animate-float [animation-delay:1s]" />
        <div className="absolute bottom-20 left-[55%] h-28 w-28 rotate-12 rounded-xl bg-ccb-400/10 animate-float [animation-delay:2s]" />

        <div className="relative mx-auto max-w-6xl px-6 pt-12 pb-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 mb-6">
              <ShieldCheck size={14} className="text-gold-400" />
              <span className="text-sm text-ccb-100">建设银行旗下 · 住建部监管备案平台</span>
            </div>
            <h1 className="font-serif text-5xl font-bold text-white md:text-6xl leading-tight">
              建融家园
            </h1>
            <p className="mt-3 text-xl text-ccb-100 font-medium">
              安居乐业 · 金融赋能 · 合规保障
            </p>
            <p className="mt-2 text-sm text-ccb-200/70">
              专业住房租赁服务平台，从找房到入住全流程线上办理
            </p>
          </div>

          <div className="mt-10 glass-panel rounded-3xl p-6 bg-white/95 backdrop-blur-xl shadow-2xl">
            <div className="flex gap-2 mb-4">
              {commuteTabs.map((tab) => (
                <button
                  key={tab.mode}
                  onClick={() => setCommuteMode(tab.mode)}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    commuteMode === tab.mode
                      ? 'bg-ccb-500 text-white shadow-lg shadow-ccb-500/30'
                      : 'bg-space-100 text-space-600 hover:bg-space-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}通勤
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-ccb-500" />
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="请输入通勤目的地，如：陆家嘴、人民广场..."
                  className="w-full rounded-xl border-2 border-space-200 bg-white py-3.5 pl-12 pr-4 text-base text-space-800 placeholder:text-space-400 focus:border-ccb-500 focus:outline-none focus:ring-2 focus:ring-ccb-500/20 transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                className="ccb-btn-primary flex items-center gap-2 px-8 text-base font-semibold cursor-pointer"
              >
                <Search size={20} />
                开始找房
              </button>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-space-100">
              <span className="text-xs text-space-400">热门目的地：</span>
              {['陆家嘴', '人民广场', '张江高科', '静安寺'].map((d) => (
                <button
                  key={d}
                  onClick={() => { setDestination(d); handleSearch() }}
                  className="text-xs px-3 py-1 rounded-full bg-ccb-50 text-ccb-600 hover:bg-ccb-100 transition-colors cursor-pointer"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-space-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="section-title text-xl mb-1">六大业务办理中心</h2>
              <p className="text-sm text-space-400">点击进入对应业务中心，体验完整线上办理流程</p>
            </div>
            <span className="text-xs text-ccb-500 font-medium flex items-center gap-1 cursor-pointer hover:gap-2 transition-all" onClick={() => navigate('/search')}>
              立即体验 <ChevronRight size={14} />
            </span>
          </div>
          <div className="grid grid-cols-3 gap-5">
            {businessPreviews.map((entry) => (
              <div
                key={entry.path}
                onClick={() => navigate(entry.path)}
                className="group cursor-pointer rounded-2xl border-2 border-space-100 hover:border-ccb-300 bg-white transition-all duration-300 overflow-hidden card-hover"
              >
                <div className={`h-2 ${entry.bgColor.replace('bg-', 'bg-gradient-to-r ') + ' ' + entry.color}`} />
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl ${entry.bgColor} flex items-center justify-center ${entry.textColor} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      {entry.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-space-800 text-base">{entry.title}</h3>
                      <p className="text-xs text-space-400 mt-0.5">{entry.desc}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {entry.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-space-600">
                        <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                        {h}
                      </div>
                    ))}
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${entry.textColor} group-hover:gap-2 transition-all`}>
                    进入办理 <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="section-title mb-1">三层房源池 · 差异化认证</h2>
            <p className="text-sm text-space-400">每套房源均经过严格审核，点击查看房源池核验标准</p>
          </div>
          <button onClick={() => navigate('/search')} className="text-sm text-ccb-500 font-medium flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
            查看全部房源 <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {poolCards.map((card) => (
            <div
              key={card.type}
              onClick={() => handlePoolClick(card.type)}
              onMouseEnter={() => setActivePool(card.type)}
              onMouseLeave={() => setActivePool(null)}
              className={`card-hover cursor-pointer rounded-2xl bg-white p-6 shadow-lg ${card.border} relative overflow-hidden group`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-space-50 to-transparent rounded-bl-full -translate-y-8 translate-x-8" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="rounded-xl bg-space-50 p-3 group-hover:scale-110 transition-transform duration-300">{card.icon}</div>
                  <span className={card.badgeClass}>{card.badge}</span>
                </div>
                <h3 className="mt-4 font-serif text-xl font-semibold text-space-800">{card.title}</h3>
                <p className="mt-1 text-sm text-space-500">{card.desc}</p>
                <p className="mt-3 text-3xl font-bold text-ccb-500">
                  {card.count}<span className="ml-1 text-sm font-normal text-space-400">套房源</span>
                </p>

                <div className="mt-4 pt-4 border-t border-space-100">
                  <p className="text-xs font-medium text-space-500 mb-2">核验项展示</p>
                  <div className="space-y-2">
                    {card.verificationItems.map((v) => (
                      <div key={v.label} className="flex items-center justify-between">
                        <span className="text-xs text-space-400">{v.label}</span>
                        <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={10} />{v.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-1 text-sm text-ccb-500 font-medium group-hover:gap-2 transition-all">
                  进入房源池 <ArrowRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-ccb-50 via-white to-gold-50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-8">
            <h2 className="section-title mb-2">全流程线上办理</h2>
            <p className="text-sm text-space-500">从找房到入住，六步走完租赁全流程，每一步都有银行级保障</p>
          </div>
          <div className="flex items-stretch justify-between gap-2 mb-8">
            {flowSteps.map((step, i) => (
              <div key={step.step} className="flex-1 flex flex-col items-center">
                <button
                  onClick={() => navigate(step.path)}
                  className="w-full group cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-ccb-500 to-ccb-600 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-ccb-500/30 group-hover:scale-110 transition-transform duration-300">
                      {step.step}
                    </div>
                    {i < flowSteps.length - 1 && (
                      <div className="absolute top-7 left-[60%] right-[-20%] h-0.5 bg-gradient-to-r from-ccb-400 to-ccb-200" />
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <p className="font-semibold text-space-800 text-sm">{step.title}</p>
                    <p className="text-xs text-space-400 mt-1">{step.desc}</p>
                  </div>
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/search')}
              className="ccb-btn-primary px-8 py-3 flex items-center gap-2 text-base font-semibold cursor-pointer shadow-lg shadow-ccb-500/30"
            >
              开始租房之旅 <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="section-title mb-1">精选核验房源</h2>
            <p className="text-sm text-space-400">经过多重验证的优质房源，点击查看完整核验详情</p>
          </div>
          <button onClick={() => navigate('/search')} className="text-sm text-ccb-500 font-medium flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
            更多房源 <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mockListings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => handleListingClick(listing)}
              className="card-hover cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg group"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={typeBadgeMap[listing.type].cls}>{typeBadgeMap[listing.type].label}</span>
                </div>
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-medium text-ccb-600 group-hover:bg-ccb-500 group-hover:text-white transition-all cursor-pointer">
                  查看详情 →
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-space-800 text-lg line-clamp-1 group-hover:text-ccb-600 transition-colors">{listing.title}</h3>
                <div className="flex flex-wrap gap-x-2 mt-2">
                  {listing.type === 'ccb_direct' && (
                    <span className="text-xs text-ccb-600 font-medium flex items-center gap-1">
                      <ShieldCheck size={10} />建行直管认证
                    </span>
                  )}
                  {listing.type === 'partner' && (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <ShieldCheck size={10} />白名单+契约双认证
                    </span>
                  )}
                  {listing.type === 'personal' && (
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <ShieldCheck size={10} />产权+人脸双核验
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-3 mt-3">
                  <span className="text-2xl font-bold text-red-500">¥{listing.price.toLocaleString()}<span className="text-sm font-normal text-space-400">/月</span></span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-sm text-space-500">
                  <span>{listing.area}㎡</span>
                  <span className="text-space-300">·</span>
                  <span>{listing.rooms}室{listing.halls}厅</span>
                  <span className="text-space-300">·</span>
                  <span>{listing.district}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-space-100 flex items-center justify-between">
                  <span className="text-xs text-space-400 flex items-center gap-1">
                    <Clock size={11} />
                    {listing.commuteInfo.metro[0]?.minutes || 15}分钟通勤
                  </span>
                  <span className="text-xs text-gold-600 font-medium flex items-center gap-1">
                    <Sparkles size={11} />
                    AI可解析户型
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="section-title mb-6">金融产品服务</h2>
        <div className="grid grid-cols-3 gap-5">
          {mockFinancialProducts.map((fp) => (
            <div
              key={fp.id}
              className="card-hover rounded-2xl border border-gold-300/40 bg-gradient-to-br from-gold-50 to-white p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-xl bg-gold-100/60 p-3">
                  {fp.id === 'rent-loan' ? <CreditCard size={28} className="text-gold-500" /> :
                   fp.id === 'deposit-insurance' ? <Shield size={28} className="text-gold-500" /> :
                   <HeartPulse size={28} className="text-gold-500" />}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-space-800">{fp.name}</h3>
                </div>
              </div>
              <p className="text-sm text-space-500 leading-relaxed">{fp.description}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gold-600">{fp.rate}</span>
                <span className="text-sm text-space-400">{fp.term}</span>
              </div>
              <button className="ccb-btn-gold mt-5 w-full text-center text-sm font-medium cursor-pointer">立即申请</button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-space-800 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-4 gap-6">
            {trustItems.map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold-500/20 flex items-center justify-center text-gold-400 flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{item.label}</p>
                  <p className="text-sm text-space-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
