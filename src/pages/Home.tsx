import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  BarChart3,
  Building,
  Calendar,
  CheckCircle,
  ChevronRight,
  CreditCard,
  LayoutGrid,
  LogOut,
  MapPin,
  Mic,
  Music,
  QrCode,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Theater,
  Ticket,
  TrendingUp,
  Users,
  Zap,
  Clock,
  Crown,
  FileCheck,
  Award,
  Flame,
} from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import useEventStore from '@/stores/eventStore'

const categoryConfig: Record<string, { label: string; icon: any; gradient: string }> = {
  concert: { label: '演唱会', icon: Music, gradient: 'from-wine-700 to-wine-950' },
  drama: { label: '话剧', icon: Theater, gradient: 'from-purple-700 to-wine-950' },
  talkshow: { label: '脱口秀', icon: Mic, gradient: 'from-amber-700 to-wine-950' },
  other: { label: '更多', icon: LayoutGrid, gradient: 'from-teal-700 to-wine-950' },
}

const fallbackEvents = [
  {
    id: 1,
    title: '李诞脱口秀「笑场」2026特别专场',
    category: 'talkshow',
    venue: '北展剧场',
    description: '高并发抢票、实名核验、电子票履约的完整演示场景。',
  },
  {
    id: 2,
    title: '孟京辉话剧「恋爱的犀牛」纪念版',
    category: 'drama',
    venue: '国家大剧院戏剧场',
    description: '支持选座、队列、订单、退票与运营看板。',
  },
  {
    id: 3,
    title: '2026周杰伦「嘉年华」北京站',
    category: 'concert',
    venue: '国家体育场（鸟巢）',
    description: '票源保真、区块链存证、信用购票一站式覆盖。',
  },
]

const featureCards = [
  { icon: Shield, title: '票源保真', desc: '每张票绑定唯一防伪码 + 区块链存证', color: 'text-gold-500' },
  { icon: Zap, title: '抢票队列', desc: '排队ID + 优先级权重 + 加速通道 2.0x', color: 'text-green-400' },
  { icon: RefreshCw, title: '智能退票', desc: '梯度手续费风控 + 时间窗口规则', color: 'text-purple-400' },
  { icon: QrCode, title: '电子核验', desc: '闸机SDK对接 / 扫码秒级核销', color: 'text-amber-400' },
  { icon: TrendingUp, title: '运营大屏', desc: '热力图 + 销量TOP + 退票聚类', color: 'text-blue-400' },
  { icon: Users, title: '实名购票', desc: '身份证实名绑定 + 先看后付授信', color: 'text-rose-400' },
]

const demoShowtimes = [
  { id: 's1', date: '6月20日', weekday: '周五', time: '19:30', status: 'on_sale', statusText: '在售', statusClass: 'bg-green-500/20 text-green-400', left: 286, total: 600 },
  { id: 's2', date: '6月21日', weekday: '周六', time: '19:30', status: 'presale', statusText: '预售', statusClass: 'bg-blue-500/20 text-blue-400', left: 412, total: 600, saleStart: '预售中' },
  { id: 's3', date: '6月22日', weekday: '周日', time: '14:00', status: 'upcoming', statusText: '即将开售', statusClass: 'bg-carbon-700 text-carbon-400', left: 600, total: 600, saleStart: '6月15日 10:00' },
]

const demoZones = [
  { name: 'VIP区', color: '#D4AF37', price: 1680, quota: 24, sold: 18 },
  { name: 'A区', color: '#8B1A2B', price: 880, quota: 80, sold: 52 },
  { name: 'B区', color: '#1E88E5', price: 580, quota: 160, sold: 95 },
  { name: 'C区', color: '#43A047', price: 280, quota: 336, sold: 228 },
]

const demoTiers = [
  { name: '早鸟票', price: 280, type: 'early_bird', badge: 'bg-green-500/20 text-green-400' },
  { name: '预售票', price: 580, type: 'presale', badge: 'bg-blue-500/20 text-blue-400' },
  { name: '全价票', price: 880, type: 'full', badge: 'bg-wine-500/20 text-wine-400' },
  { name: 'VIP票', price: 1680, type: 'vip', badge: 'bg-gold-500/20 text-gold-400' },
]

export default function Home() {
  const navigate = useNavigate()
  const { events, fetchEvents, loading } = useEventStore()
  const { user, isLoggedIn, logout } = useAuthStore()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [showQueueDemo, setShowQueueDemo] = useState(false)
  const [boostState, setBoostState] = useState({
    member: false,
    credit: false,
    invite: false,
  })

  const basePriority = useMemo(() => {
    let p = 0
    if (isLoggedIn && user?.realName) p += 1.0
    if (isLoggedIn && (user?.creditScore ?? 0) >= 600) p += 0.20
    return +p.toFixed(2)
  }, [isLoggedIn, user])

  const creditBoostEligible = isLoggedIn && (user?.creditScore ?? 0) >= 600 && !boostState.credit
  const realNameVerified = isLoggedIn && !!user?.realName

  const localBoost = useMemo(() => {
    const queueId = isLoggedIn
      ? `Q${Date.now().toString().slice(-6)}-${(user?.id ?? 0).toString().padStart(4, '0')}`
      : 'Q20260615-' + Math.floor(Math.random() * 90000 + 10000)
    let priority = basePriority
    let position = isLoggedIn ? 820 : 1286
    let estimatedWait = isLoggedIn ? 5 : 8
    if (boostState.credit) { priority += 0.20; position = Math.floor(position * 0.94); estimatedWait = Math.floor(estimatedWait * 0.94) }
    if (boostState.member) { priority += 0.30; position = Math.floor(position * 0.91); estimatedWait = Math.floor(estimatedWait * 0.91) }
    if (boostState.invite) { priority += 0.15; position = Math.floor(position * 0.955); estimatedWait = Math.floor(estimatedWait * 0.955) }
    return {
      queueId,
      priority: Math.min(2.0, +priority.toFixed(2)),
      position: Math.max(1, position),
      estimatedWait: Math.max(1, estimatedWait),
    }
  }, [isLoggedIn, user, boostState, basePriority])

  useEffect(() => {
    fetchEvents({ category: activeCategory || undefined, keyword: keyword || undefined })
  }, [activeCategory, fetchEvents])

  const displayEvents = useMemo(() => (events.length > 0 ? events : fallbackEvents), [events])
  const heroEvent = displayEvents[0]
  const heroCfg = categoryConfig[heroEvent?.category] || categoryConfig.other
  const HeroIcon = heroCfg.icon

  const handleSearch = () => {
    fetchEvents({ category: activeCategory || undefined, keyword: keyword || undefined })
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const applyBoost = (type: 'member' | 'credit' | 'invite') => {
    if (boostState[type]) return
    setBoostState((prev) => ({ ...prev, [type]: true }))
  }

  return (
    <div className="min-h-screen bg-gradient-dark">
      <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link to="/" className="font-display text-2xl text-gold-500 tracking-wider">
            TICKET VAULT
          </Link>
          <div className="hidden lg:flex flex-1 max-w-xl">
            <div className="flex w-full rounded-xl overflow-hidden border border-carbon-700 bg-carbon-900/60">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索演出、场馆、主办方"
                className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-carbon-500 outline-none"
              />
              <button onClick={handleSearch} className="px-4 text-gold-400 hover:text-gold-300">
                <Search size={18} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/" className="text-gold-400 font-medium">首页</Link>
            <Link to="/orders" className="text-carbon-300 hover:text-white transition">订单中心</Link>
            <Link to="/organizer" className="text-carbon-300 hover:text-white transition">主办方</Link>
            <Link to="/admin" className="text-carbon-300 hover:text-white transition">运营后台</Link>
            {isLoggedIn ? (
              <button onClick={handleLogout} className="text-carbon-300 hover:text-white transition flex items-center gap-2">
                <LogOut size={16} />
                {user?.realName || '退出'}
              </button>
            ) : (
              <Link to="/login" className="wine-gradient-btn text-sm">登录 / 注册</Link>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        {isLoggedIn && (
          <section className="glass-card p-5 mb-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center">
                <Ticket className="text-carbon-950" size={22} />
              </div>
              <div>
                <div className="text-white font-medium flex items-center gap-2">
                  欢迎回来，{user?.realName}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400">
                    {user?.role === 'admin' ? '管理员' : user?.role === 'organizer' ? '主办方' : '实名用户'}
                  </span>
                </div>
                <div className="text-sm text-carbon-400">
                  信用分 {user?.creditScore}
                  {(user?.creditScore ?? 0) >= 600 ? (
                    <span className="ml-2 text-green-400">✓ 可使用先看后付</span>
                  ) : (
                    <span className="ml-2 text-carbon-500">完成实名认证解锁先看后付</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link to="/orders" className="wine-gradient-btn text-sm flex items-center gap-2">
                <Ticket size={16} />
                我的订单
              </Link>
              <Link to="/organizer" className="px-4 py-2 rounded-lg border border-gold-500/40 text-gold-400 text-sm hover:bg-gold-500/10 transition">
                主办方入驻
              </Link>
              <button
                onClick={() => setShowQueueDemo((v) => !v)}
                className="px-4 py-2 rounded-lg border border-green-500/40 text-green-400 text-sm hover:bg-green-500/10 transition flex items-center gap-2"
              >
                <Zap size={16} />
                {showQueueDemo ? '隐藏抢票状态' : '查看抢票排队状态'}
              </button>
            </div>
          </section>
        )}

        {showQueueDemo && (
          <section className="glass-card p-6 mb-8 border border-gold-500/20 shadow-glow-gold">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Zap size={20} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">抢票加速队列 · 实时状态</h3>
                <p className="text-xs text-carbon-500">排队ID + 优先级权重计算 + 多种加速通道叠加</p>
              </div>
            </div>

            <div className="bg-carbon-800/40 rounded-xl p-4 mb-5 border border-carbon-700/50">
              <div className="text-xs text-carbon-500 mb-2 flex items-center gap-1">
                <Shield size={13} />
                实名/授信联动状态（权重计算依据）
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  {realNameVerified ? (
                    <CheckCircle size={15} className="text-green-400" />
                  ) : (
                    <AlertCircle size={15} className="text-yellow-400" />
                  )}
                  <span className={realNameVerified ? 'text-green-400' : 'text-yellow-400'}>
                    {realNameVerified ? `✓ 已实名 (${user?.realName})` : '未实名'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {creditBoostEligible || boostState.credit ? (
                    <CheckCircle size={15} className="text-blue-400" />
                  ) : (
                    <AlertCircle size={15} className="text-carbon-500" />
                  )}
                  <span className={creditBoostEligible || boostState.credit ? 'text-blue-400' : 'text-carbon-500'}>
                    {isLoggedIn ? `信用 ${user?.creditScore ?? 0} ${(user?.creditScore ?? 0) >= 600 ? '✓ 达标' : '<600 未达标'}` : '登录后查信用分'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(user?.creditScore ?? 0) >= 600 ? (
                    <CheckCircle size={15} className="text-gold-400" />
                  ) : (
                    <AlertCircle size={15} className="text-carbon-500" />
                  )}
                  <span className={(user?.creditScore ?? 0) >= 600 ? 'text-gold-400' : 'text-carbon-500'}>
                    {(user?.creditScore ?? 0) >= 600 ? '✓ 先看后付已开通' : '先看后付未开通'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={15} className="text-purple-400" />
                  <span className="text-purple-400">
                    权重 = 实名 {realNameVerified ? '1.00x' : '0'} + 信用 {(user?.creditScore ?? 0) >= 600 ? '0.20x' : '0'} + 加速
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
              <div className="bg-carbon-800/40 rounded-xl p-4">
                <div className="text-xs text-carbon-500 mb-1">排队ID</div>
                <div className="font-mono text-gold-500 font-bold text-lg">{localBoost.queueId}</div>
              </div>
              <div className="bg-carbon-800/40 rounded-xl p-4">
                <div className="text-xs text-carbon-500 mb-1">当前位置</div>
                <div className="font-display text-3xl text-white">{localBoost.position}</div>
              </div>
              <div className="bg-carbon-800/40 rounded-xl p-4">
                <div className="text-xs text-carbon-500 mb-1">优先级权重</div>
                <div className="font-display text-3xl text-green-400">
                  {localBoost.priority.toFixed(2)}<span className="text-sm">x</span>
                </div>
              </div>
              <div className="bg-carbon-800/40 rounded-xl p-4">
                <div className="text-xs text-carbon-500 mb-1">预计等待</div>
                <div className="font-display text-3xl text-blue-400">
                  {localBoost.estimatedWait}<span className="text-sm">分钟</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-carbon-400">使用加速通道（上限 2.0x）</span>
              <span className="text-xs text-carbon-500">点击即可叠加加速</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'member' as const, icon: Crown, name: '会员加速', desc: 'VIP会员专享', value: 0.30, eligible: isLoggedIn },
                { key: 'credit' as const, icon: Shield, name: '信用加速', desc: isLoggedIn ? `芝麻信用 ${user?.creditScore ?? 0} ${(user?.creditScore ?? 0) >= 600 ? '✓ 达标' : '未达标'}` : '登录后查看信用分', value: 0.20, eligible: creditBoostEligible },
                { key: 'invite' as const, icon: Users, name: '邀请加速', desc: '好友助力完成', value: 0.15, eligible: true },
              ].map((opt) => {
                const Icon = opt.icon
                const used = boostState[opt.key]
                return (
                  <button
                    key={opt.key}
                    onClick={() => applyBoost(opt.key)}
                    disabled={used || !opt.eligible}
                    className={`glass-card p-4 text-left transition-all disabled:opacity-50 ${
                      used ? 'border-gold-500/50 shadow-glow-gold' : opt.eligible ? 'hover:-translate-y-1 hover:shadow-glow-gold' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon size={22} className={used ? 'text-gold-400' : 'text-gold-500'} />
                      <div className="flex-1">
                        <div className="text-white font-medium">{opt.name}</div>
                        <div className="text-xs text-carbon-400 mb-2">{opt.desc}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-gold-500 text-sm font-bold">+{opt.value.toFixed(2)}x</span>
                          {used ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-400">已使用</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">立即使用</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <Link to="/queue/1" className="gold-gradient-btn mt-6 inline-flex items-center gap-2">
              <Zap size={18} />
              进入完整抢票流程
            </Link>

            <div className="mt-8 pt-6 border-t border-carbon-700/60">
              <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                <Shield size={18} className="text-gold-400" />
                优先级权重计算依据 · 与实名 / 信用 / 先看后付闭环
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-carbon-800/40 rounded-xl p-4 border border-rose-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-rose-400" />
                    <span className="text-white text-sm font-medium">实名购票 (基础)</span>
                  </div>
                  <p className="text-xs text-carbon-400 mb-2">
                    完成实名认证后获得基础排队权重 1.0x，一人一票，票证人合一。
                  </p>
                  <div className="text-xs text-rose-300">
                    当前状态: <span className="font-medium">{isLoggedIn && user?.realName ? '✓ 已实名' : '未实名'}</span>
                  </div>
                </div>
                <div className="bg-carbon-800/40 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={16} className="text-blue-400" />
                    <span className="text-white text-sm font-medium">芝麻信用授信 (+0.20x)</span>
                  </div>
                  <p className="text-xs text-carbon-400 mb-2">
                    芝麻信用分 ≥ 600 分自动获得信用加速，同时解锁先看后付能力。
                  </p>
                  <div className="text-xs text-blue-300">
                    当前信用分: <span className="font-medium">{isLoggedIn ? user?.creditScore : '登录后可查'}</span>
                    {isLoggedIn && (user?.creditScore ?? 0) >= 600 && ' ✓ 达标'}
                  </div>
                </div>
                <div className="bg-carbon-800/40 rounded-xl p-4 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown size={16} className="text-purple-400" />
                    <span className="text-white text-sm font-medium">会员 / 邀请 (+0.45x)</span>
                  </div>
                  <p className="text-xs text-carbon-400 mb-2">
                    VIP会员 +0.30x，好友邀请助力 +0.15x，可叠加使用。
                  </p>
                  <div className="text-xs text-purple-300">
                    上限: <span className="font-medium">2.00x</span> · 当前 {localBoost.priority.toFixed(2)}x
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gold-500/5 border border-gold-500/20 rounded-xl">
                <div className="text-xs text-gold-300 flex items-start gap-2">
                  <Sparkles size={14} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">计算逻辑：</span>
                    基础 1.0x + 信用 0.20x + 会员 0.30x + 邀请 0.15x = 最高 1.65x（会员+信用+邀请三通道），
                    与先看后付、票源保真、阶梯退票等履约能力完全打通。
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {heroEvent && (
          <section className="relative rounded-2xl overflow-hidden mb-12 shadow-glass">
            <div className={`absolute inset-0 bg-gradient-to-br ${heroCfg.gradient}`} />
            <div className="absolute right-10 top-1/2 -translate-y-1/2 opacity-20">
              <HeroIcon size={260} />
            </div>
            <div className="relative min-h-[420px] flex flex-col justify-center max-w-3xl px-10 py-12">
              <span className="inline-flex w-fit px-3 py-1 rounded-full bg-white/10 text-gold-300 text-sm mb-4">
                {heroCfg.label} · 高并发票务交易
              </span>
              <h1 className="font-display text-5xl font-bold text-white mb-4 leading-tight">{heroEvent.title}</h1>
              <div className="flex flex-wrap items-center gap-5 text-white/80 mb-4">
                <span className="flex items-center gap-2">
                  <MapPin size={18} />
                  {heroEvent.venue}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar size={18} />
                  3 场可选
                </span>
                <span className="flex items-center gap-2 text-green-300">
                  <Ticket size={18} />
                  ¥280 起 / 最高 ¥1680
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-5">
                {demoShowtimes.map((st) => (
                  <div key={st.id} className="px-3 py-2 rounded-lg bg-black/30 backdrop-blur-sm">
                    <div className="text-xs text-white/70">{st.date} {st.weekday}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{st.time}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${st.statusClass}`}>{st.statusText}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {demoTiers.map((t) => (
                  <span key={t.type} className={`px-2.5 py-1 rounded-full text-xs ${t.badge} flex items-center gap-1.5`}>
                    <Flame size={12} />
                    {t.name} · ¥{t.price}
                  </span>
                ))}
              </div>
              <p className="text-carbon-200 mb-7 leading-relaxed max-w-2xl">{heroEvent.description}</p>
              <div className="flex flex-wrap gap-3">
                <Link to={`/event/${heroEvent.id}`} className="gold-gradient-btn inline-flex items-center gap-2">
                  <Zap size={17} />
                  立即抢票 · 查看场次/座位/票价
                </Link>
                <Link to="/orders" className="px-6 py-3 rounded-lg border border-white/30 text-white hover:bg-white/10 transition inline-flex items-center gap-2">
                  <FileCheck size={18} />
                  订单履约
                </Link>
                <Link to="/admin" className="px-6 py-3 rounded-lg border border-white/30 text-white hover:bg-white/10 transition inline-flex items-center gap-2">
                  <Award size={18} />
                  运营分析
                </Link>
              </div>
            </div>
          </section>
        )}

        <section className="mb-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="section-title mb-0">演出分类</h2>
            <span className="text-sm text-carbon-500">点击筛选 · 搜索框可直接查询</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {Object.entries(categoryConfig).map(([key, cfg]) => {
              const Icon = cfg.icon
              const active = activeCategory === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveCategory(active ? null : key)}
                  className={`glass-card p-5 text-left card-hover transition-all ${active ? 'border-2 border-gold-500 shadow-glow-wine' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-carbon-800/60 flex items-center justify-center">
                      <Icon size={26} className="text-gold-400" />
                    </div>
                    <div>
                      <div className="text-lg font-medium text-white">{cfg.label}</div>
                      <div className="text-xs text-carbon-500">{active ? '取消筛选' : '查看全部'}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mb-14">
          <div className="flex items-end justify-between mb-6">
            <h2 className="section-title mb-0">热门演出 · 含场次/分区/票价/开售时间</h2>
            <Link to="/admin" className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1">
              运营数据 <ChevronRight size={16} />
            </Link>
          </div>
          {loading ? (
            <div className="text-center text-carbon-400 py-12">加载中...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayEvents.map((event: any, index) => {
                const cfg = categoryConfig[event.category] || categoryConfig.other
                const Icon = cfg.icon
                return (
                  <article
                    key={event.id}
                    className="glass-card overflow-hidden card-hover animate-slide-up flex flex-col"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <div className={`h-40 bg-gradient-to-br ${cfg.gradient} relative`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon size={72} className="text-white/25" />
                      </div>
                      <span className="absolute left-4 top-4 px-2.5 py-1 rounded-full bg-black/40 text-gold-300 text-xs">
                        {cfg.label}
                      </span>
                      <div className="absolute right-4 top-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs">
                        <Flame size={12} className="text-wine-400" />
                        热销
                      </div>
                      <div className="absolute right-4 bottom-3 font-display text-2xl text-white drop-shadow-lg">
                        ¥280<span className="text-xs font-normal text-white/70"> 起</span>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <Link to={`/event/${event.id}`} className="block mb-3">
                        <h3 className="text-lg font-bold text-white min-h-[56px] hover:text-gold-400 transition">
                          {event.title}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 text-sm text-carbon-400 mb-4">
                        <MapPin size={14} />
                        <span className="truncate">{event.venue}</span>
                      </div>

                      <div className="mb-4">
                        <div className="text-xs text-carbon-500 mb-2 flex items-center gap-1">
                          <Calendar size={12} />
                          场次 · 开售时间
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {demoShowtimes.slice(0, 3).map((st) => (
                            <div
                              key={st.id}
                              className="rounded-lg p-2 border border-carbon-700/60 bg-carbon-800/30"
                            >
                              <div className="text-[10px] text-carbon-500">{st.date}</div>
                              <div className="text-xs text-white font-medium">{st.time}</div>
                              <div className={`text-[10px] mt-1 px-1 rounded w-fit ${st.statusClass}`}>
                                {st.saleStart || st.statusText}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-xs text-carbon-500 mb-2">座位分区</div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {demoZones.map((z) => (
                            <div
                              key={z.name}
                              className="rounded-lg p-1.5 text-center border"
                              style={{ borderColor: `${z.color}40`, backgroundColor: `${z.color}10` }}
                            >
                              <div className="w-2 h-2 mx-auto rounded-full mb-0.5" style={{ backgroundColor: z.color }} />
                              <div className="text-[10px] text-white/80">{z.name}</div>
                              <div className="text-[10px]" style={{ color: z.color }}>¥{z.price}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-xs text-carbon-500 mb-2">阶梯票价</div>
                        <div className="flex flex-wrap gap-1.5">
                          {demoTiers.map((t) => (
                            <span key={t.type} className={`px-2 py-0.5 rounded text-[10px] ${t.badge}`}>
                              {t.name} ¥{t.price}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs mb-3">
                        <span className="flex items-center gap-1 text-carbon-500">
                          <Clock size={12} />
                          即将开演
                        </span>
                        <span className="text-carbon-500">实名 · 电子票</span>
                      </div>

                      <div className="h-1.5 bg-carbon-700 rounded-full mb-2 overflow-hidden">
                        <div className="h-full bg-gradient-gold rounded-full" style={{ width: '66%' }} />
                      </div>
                      <div className="flex justify-between text-[11px] mb-3">
                        <span className="text-carbon-400">已售 66%</span>
                        <span className="text-gold-400 font-medium">剩余席位紧张</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 mb-3">
                        <Link
                          to="/admin"
                          state={{ defaultTab: 'tickets' }}
                          className="text-[10px] px-2 py-1.5 rounded-lg bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition inline-flex items-center justify-center gap-1 border border-gold-500/20"
                        >
                          <Shield size={11} />
                          票源保真
                        </Link>
                        <Link
                          to="/orders"
                          className="text-[10px] px-2 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition inline-flex items-center justify-center gap-1 border border-blue-500/20"
                        >
                          <QrCode size={11} />
                          防伪码存证
                        </Link>
                        <Link
                          to="/orders"
                          className="text-[10px] px-2 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition inline-flex items-center justify-center gap-1 border border-green-500/20"
                        >
                          <FileCheck size={11} />
                          闸机核销
                        </Link>
                        <Link
                          to="/orders"
                          state={{ defaultTab: 'refund' }}
                          className="text-[10px] px-2 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition inline-flex items-center justify-center gap-1 border border-purple-500/20"
                        >
                          <RefreshCw size={11} />
                          退票风控
                        </Link>
                      </div>

                      <div className="mt-auto flex gap-2">
                        <Link
                          to={`/event/${event.id}`}
                          className="flex-1 wine-gradient-btn text-center text-sm py-2.5 inline-flex items-center justify-center gap-1"
                        >
                          <Zap size={14} />
                          选座购票
                        </Link>
                        <button
                          onClick={() => setShowQueueDemo(true)}
                          className="px-3 py-2.5 rounded-lg border border-gold-500/40 text-gold-400 text-sm hover:bg-gold-500/10 transition"
                          title="查看抢票队列状态"
                        >
                          <Zap size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          <Link to="/organizer" className="glass-card p-8 card-hover group">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-500/20 to-wine-500/20 flex items-center justify-center flex-shrink-0">
                <Building size={28} className="text-gold-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-gold-400 transition">
                  主办方入驻审核
                </h3>
                <p className="text-sm text-carbon-400 mb-3">
                  提交资质 → 平台审核 → 审核通过发布演出 → 配置场次（座位分区、阶梯票价、预售时间）→ 销售数据统计。
                </p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 rounded-lg bg-carbon-800/40">
                    <div className="text-gold-400 font-bold">8</div>
                    <div className="text-[10px] text-carbon-500">待审核</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-carbon-800/40">
                    <div className="text-green-400 font-bold">126</div>
                    <div className="text-[10px] text-carbon-500">已入驻</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-carbon-800/40">
                    <div className="text-blue-400 font-bold">342</div>
                    <div className="text-[10px] text-carbon-500">总场次</div>
                  </div>
                </div>
                <span className="text-gold-400 text-sm flex items-center gap-1">
                  立即申请 / 进入主办方工作台 <ChevronRight size={16} />
                </span>
              </div>
            </div>
          </Link>

          <Link to="/admin" className="glass-card p-8 card-hover group">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                <BarChart3 size={28} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-gold-400 transition">
                  运营数据中心
                </h3>
                <p className="text-sm text-carbon-400 mb-3">
                  上座率热力图 · 区域销量TOP榜 · 退票原因聚类分析 · 主办方审核队列 · 全维度实时洞察。
                </p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 rounded-lg bg-carbon-800/40">
                    <div className="text-gold-400 font-bold">78.5%</div>
                    <div className="text-[10px] text-carbon-500">总上座率</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-carbon-800/40">
                    <div className="text-green-400 font-bold">¥218万</div>
                    <div className="text-[10px] text-carbon-500">本月营收</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-carbon-800/40">
                    <div className="text-blue-400 font-bold">3.2%</div>
                    <div className="text-[10px] text-carbon-500">退票率</div>
                  </div>
                </div>
                <span className="text-gold-400 text-sm flex items-center gap-1">
                  查看完整运营大屏 <ChevronRight size={16} />
                </span>
              </div>
            </div>
          </Link>
        </section>

        <section className="mb-16">
          <h2 className="section-title">核心能力</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {featureCards.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="glass-card p-6 card-hover">
                  <div className="w-12 h-12 rounded-xl bg-carbon-800/50 flex items-center justify-center mb-4">
                    <Icon size={24} className={feature.color} />
                  </div>
                  <h3 className="text-white font-medium mb-2">{feature.title}</h3>
                  <p className="text-sm text-carbon-400">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {!isLoggedIn && (
          <section className="glass-card p-8 text-center mb-16 bg-gradient-to-br from-wine-900/30 to-transparent">
            <Sparkles className="mx-auto text-gold-400 mb-4" size={38} />
            <h3 className="font-display text-2xl text-white mb-3">
              登录即可体验完整链路：实名购票 → 电子票核验 → 先看后付 → 退换票风控
            </h3>
            <p className="text-carbon-400 mb-6 max-w-2xl mx-auto">
              普通用户 <span className="text-gold-400 font-mono">user1 / 123456</span> ，
              管理员 <span className="text-gold-400 font-mono">admin / 123456</span> ，
              主办方 <span className="text-gold-400 font-mono">organizer / 123456</span>
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link to="/login" className="gold-gradient-btn inline-flex items-center gap-2">
                <Ticket size={18} />
                立即登录抢票
              </Link>
              <Link to="/orders" className="px-6 py-3 rounded-lg border border-white/30 text-white hover:bg-white/10 transition inline-flex items-center gap-2">
                <FileCheck size={18} />
                查看订单履约
              </Link>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-carbon-700/50 py-10">
        <div className="container mx-auto px-6 text-center text-carbon-500 text-sm">
          <p className="font-display text-gold-500/70 text-lg mb-2">TICKET VAULT</p>
          <p>© 2026 Ticket Vault · 高并发演出票务交易与履约保障平台</p>
          <p className="mt-1 text-xs">
            防伪码 + 区块链存证 · 先看后付 · 抢票加速队列 · 退换票智能风控 · 上座率热力图
          </p>
        </div>
      </footer>
    </div>
  )
}
