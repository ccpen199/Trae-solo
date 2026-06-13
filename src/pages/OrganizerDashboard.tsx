import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Building,
  Calendar,
  Ticket,
  TrendingUp,
  Shield,
  FileText,
  Plus,
  Users,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowRight,
  Layers,
  BarChart2,
  FileCheck,
} from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import useOrganizerStore from '@/stores/organizerStore'
import useEventStore from '@/stores/eventStore'

const auditFlowSteps = [
  { key: 'submit', label: '提交申请', desc: '填写公司、营业执照、联系人信息', icon: FileText },
  { key: 'review', label: '资质审核', desc: '平台 1-3 个工作日完成资质核验', icon: FileCheck },
  { key: 'approved', label: '入驻成功', desc: '获得主办方资格，可发布演出', icon: CheckCircle },
]

const demoStats = {
  totalEvents: 3,
  totalShowtimes: 9,
  totalTickets: 1800,
  totalSold: 1188,
  totalRevenue: 856320,
  avgOccupancy: 66,
  pendingVerify: 860,
  refundCount: 23,
}

const demoEvents = [
  {
    id: 1,
    title: '李诞脱口秀「笑场」2026特别专场',
    category: 'talkshow',
    venue: '北展剧场',
    showtimes: 3,
    totalSeats: 600 * 3,
    soldSeats: 1188,
    revenue: 563200,
    status: 'published',
    occupancy: 66,
  },
  {
    id: 2,
    title: '孟京辉话剧「恋爱的犀牛」纪念版',
    category: 'drama',
    venue: '国家大剧院戏剧场',
    showtimes: 3,
    totalSeats: 1200,
    soldSeats: 840,
    revenue: 293120,
    status: 'published',
    occupancy: 70,
  },
  {
    id: 3,
    title: '2026周杰伦「嘉年华」北京站',
    category: 'concert',
    venue: '国家体育场（鸟巢）',
    showtimes: 3,
    totalSeats: 80000,
    soldSeats: 62400,
    revenue: 0,
    status: 'draft',
    occupancy: 78,
  },
]

const categoryLabels: Record<string, string> = {
  concert: '演唱会',
  drama: '话剧',
  talkshow: '脱口秀',
  other: '其他',
}

export default function OrganizerDashboard() {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const { organizer, application, fetchOrganizer } = useOrganizerStore()
  const { events, fetchEvents } = useEventStore()
  const [applyOpen, setApplyOpen] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    license: '',
    contactName: '',
    contactPhone: '',
  })
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrganizer()
      fetchEvents()
    }
  }, [isLoggedIn, fetchOrganizer, fetchEvents])

  useEffect(() => {
    if (organizer) {
      if (organizer.status === 'pending' || organizer.status === 'rejected') setActiveStep(1)
      if (organizer.status === 'approved') setActiveStep(2)
    }
  }, [organizer])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setApplyOpen(false)
    setActiveStep(1)
    alert('申请已提交，等待平台资质审核')
  }

  const displayEvents = events.length > 0 ? events : demoEvents

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-dark pb-16">
        <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
          <div className="container mx-auto px-6 py-4 flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="text-white hover:text-gold-400 transition">
              <ChevronLeft size={24} />
            </button>
            <Link to="/" className="font-display text-xl text-gold-500 tracking-wider">
              TICKET VAULT
            </Link>
            <div className="flex-1" />
            <Link to="/login" className="wine-gradient-btn text-sm">登录入驻</Link>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-10 max-w-4xl">
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-gold-500 to-wine-700 flex items-center justify-center mb-6">
              <Building size={40} className="text-white" />
            </div>
            <h1 className="font-display text-4xl text-gold-400 mb-3">主办方入驻工作台</h1>
            <p className="text-carbon-400 text-lg">
              提交资质 → 平台审核 → 发布演出 → 配置场次/座位/票价 → 销售数据洞察
            </p>
          </div>

          <div className="glass-card p-8 mb-10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <FileCheck size={22} className="text-gold-400" />
              入驻审核流程
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {auditFlowSteps.map((step, i) => {
                const Icon = step.icon
                const active = i === activeStep
                const done = i < activeStep
                return (
                  <button
                    key={step.key}
                    onClick={() => setActiveStep(i)}
                    className={`glass-card p-5 text-left transition-all ${
                      active ? 'border-gold-500/50 shadow-glow-gold -translate-y-0.5' : ''
                    } ${done ? 'border-green-500/30' : ''}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          done
                            ? 'bg-green-500/20 text-green-400'
                            : active
                            ? 'bg-gold-500/20 text-gold-400'
                            : 'bg-carbon-800/60 text-carbon-500'
                        }`}
                      >
                        <Icon size={20} />
                      </div>
                      <span className={`text-sm ${done ? 'text-green-400' : active ? 'text-gold-400' : 'text-carbon-500'}`}>
                        STEP {i + 1}
                      </span>
                    </div>
                    <div className="text-white font-medium mb-1">{step.label}</div>
                    <div className="text-xs text-carbon-400 leading-snug">{step.desc}</div>
                  </button>
                )
              })}
            </div>
            <div className="text-center">
              <Link to="/login" className="gold-gradient-btn inline-flex items-center gap-2 text-lg">
                <Plus size={18} />
                立即登录申请入驻
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="glass-card p-6">
              <h3 className="text-white font-bold mb-5 flex items-center gap-2">
                <Calendar size={20} className="text-gold-400" />
                演出场次管理
              </h3>
              <ul className="space-y-3 mb-4">
                <li className="flex items-center gap-2 text-sm text-carbon-300">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  座位图分区配置（VIP/A/B/C 区，独立颜色、价格、座位数）
                </li>
                <li className="flex items-center gap-2 text-sm text-carbon-300">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  阶梯票价策略（早鸟票/预售票/全价票/VIP票）
                </li>
                <li className="flex items-center gap-2 text-sm text-carbon-300">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  预售/开售时间精准控制
                </li>
                <li className="flex items-center gap-2 text-sm text-carbon-300">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  实名购票 + 闸机扫码核验对接
                </li>
              </ul>
              <Link to="/login" className="text-gold-400 hover:text-gold-300 text-sm inline-flex items-center gap-1">
                登录后创建演出 <ChevronRight size={14} />
              </Link>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-white font-bold mb-5 flex items-center gap-2">
                <BarChart2 size={20} className="text-blue-400" />
                运营销售数据
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: '演出数', value: demoStats.totalEvents, color: 'text-gold-400' },
                  { label: '场次数', value: demoStats.totalShowtimes, color: 'text-blue-400' },
                  { label: '累计票房', value: `¥${(demoStats.totalRevenue).toLocaleString()}`, color: 'text-green-400' },
                  { label: '平均上座率', value: `${demoStats.avgOccupancy}%`, color: 'text-purple-400' },
                ].map((s, i) => (
                  <div key={i} className="bg-carbon-800/40 rounded-lg p-3">
                    <div className={`font-display text-2xl ${s.color}`}>{s.value}</div>
                    <div className="text-[11px] text-carbon-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              <Link to="/login" className="text-gold-400 hover:text-gold-300 text-sm inline-flex items-center gap-1">
                登录后查看完整销售数据 <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-white font-bold mb-5 flex items-center gap-2">
              <Layers size={20} className="text-purple-400" />
              已入驻主办方演出案例（登录后即可管理）
            </h3>
            <div className="space-y-3">
              {demoEvents.slice(0, 2).map((ev) => (
                <div key={ev.id} className="bg-carbon-800/30 rounded-xl p-4 flex items-center gap-4 flex-wrap">
                  <div className="w-16 h-16 bg-gradient-to-br from-wine-700 to-carbon-900 rounded-lg flex items-center justify-center">
                    <Calendar size={28} className="text-gold-500/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="text-white font-medium">{ev.title}</h4>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-wine-800/30 text-wine-300">
                        {categoryLabels[ev.category]}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          ev.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {ev.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </div>
                    <div className="text-xs text-carbon-400 flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1"><MapPin size={12} /> {ev.venue}</span>
                      <span className="inline-flex items-center gap-1"><Calendar size={12} /> {ev.showtimes} 场</span>
                      <span className="inline-flex items-center gap-1"><Ticket size={12} /> 上座率 {ev.occupancy}%</span>
                      <span className="inline-flex items-center gap-1 text-gold-400">
                        <TrendingUp size={12} /> ¥{ev.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to="/login"
                      className="text-xs px-3 py-2 rounded-lg bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 transition inline-flex items-center gap-1"
                    >
                      <Calendar size={12} />
                      场次配置
                    </Link>
                    <Link
                      to="/login"
                      className="text-xs px-3 py-2 rounded-lg border border-carbon-600 text-carbon-400 hover:text-white transition"
                    >
                      销售数据
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark pb-16">
      <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-6 flex-wrap">
          <button onClick={() => navigate(-1)} className="text-white hover:text-gold-400 transition">
            <ChevronLeft size={24} />
          </button>
          <Link to="/" className="font-display text-xl text-gold-500 tracking-wider">
            TICKET VAULT
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-gold-400 text-sm">{user?.realName}</span>
            <button
              onClick={() => setApplyOpen(true)}
              className="gold-gradient-btn text-sm flex items-center gap-1.5"
            >
              <Plus size={16} />
              新建演出
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <h1 className="font-display text-3xl text-gold-400">主办方工作台</h1>
          <div className="flex items-center gap-2 text-sm text-carbon-400 flex-wrap">
            <Users size={16} className="text-gold-400" />
            <span>{user?.realName}</span>
            <span className="text-carbon-600">|</span>
            <span>角色: {user?.role === 'organizer' ? '主办方' : user?.role === 'admin' ? '管理员' : '普通用户'}</span>
          </div>
        </div>

        {!organizer && (
          <div className="glass-card p-8 mb-8">
            <div className="text-center mb-8">
              <Building size={48} className="mx-auto text-gold-500 mb-4" />
              <h2 className="text-2xl text-white mb-2">成为主办方</h2>
              <p className="text-carbon-400">提交资质审核，入驻平台发布演出</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {auditFlowSteps.map((step, i) => {
                const Icon = step.icon
                const active = i === 0
                return (
                  <div
                    key={step.key}
                    className={`glass-card p-5 transition-all ${active ? 'border-gold-500/50 shadow-glow-gold' : 'opacity-60'}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        active ? 'bg-gold-500/20 text-gold-400' : 'bg-carbon-800/60 text-carbon-500'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <span className={`text-sm ${active ? 'text-gold-400' : 'text-carbon-500'}`}>STEP {i + 1}</span>
                    </div>
                    <div className="text-white font-medium mb-1">{step.label}</div>
                    <div className="text-xs text-carbon-400">{step.desc}</div>
                  </div>
                )
              })}
            </div>

            <div className="text-center">
              <button onClick={() => setApplyOpen(true)} className="wine-gradient-btn inline-flex items-center gap-2 text-lg">
                <FileText size={20} />
                立即申请入驻
              </button>
            </div>
          </div>
        )}

        {organizer && organizer.status !== 'approved' && (
          <div className="glass-card p-8 mb-8">
            <div className="text-center mb-8">
              {organizer.status === 'pending' ? (
                <>
                  <AlertCircle size={48} className="mx-auto text-yellow-500 mb-4" />
                  <h2 className="text-2xl text-white mb-2">审核中</h2>
                  <p className="text-carbon-400">
                    您的主办方申请已提交，工作人员将在 1-3 个工作日内完成资质核验
                  </p>
                </>
              ) : (
                <>
                  <XCircle size={48} className="mx-auto text-wine-500 mb-4" />
                  <h2 className="text-2xl text-white mb-2">审核未通过</h2>
                  <p className="text-carbon-400 mb-3">
                    您的主办方申请未通过审核，请修改后重新提交
                  </p>
                  {application?.reviewReason && (
                    <div className="inline-block p-4 bg-wine-800/20 rounded-lg text-wine-400 text-sm text-left">
                      拒绝原因: {application.reviewReason}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {auditFlowSteps.map((step, i) => {
                const Icon = step.icon
                const idx = organizer.status === 'pending' ? 1 : 1
                const active = i === idx
                const done = i < idx
                return (
                  <div
                    key={step.key}
                    className={`glass-card p-5 transition-all ${
                      active ? 'border-gold-500/50 shadow-glow-gold' : done ? 'border-green-500/30 opacity-80' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        done ? 'bg-green-500/20 text-green-400' :
                        active ? 'bg-gold-500/20 text-gold-400' :
                        'bg-carbon-800/60 text-carbon-500'
                      }`}>
                        <Icon size={20} />
                      </div>
                      <span className={`text-sm ${done ? 'text-green-400' : active ? 'text-gold-400' : 'text-carbon-500'}`}>STEP {i + 1}</span>
                    </div>
                    <div className="text-white font-medium mb-1">{step.label}</div>
                    <div className="text-xs text-carbon-400">{step.desc}</div>
                  </div>
                )
              })}
            </div>

            <div className="bg-carbon-800/30 rounded-lg p-4 text-sm max-w-md mx-auto">
              <div className="text-carbon-400 mb-1">申请主体</div>
              <div className="text-white font-medium">{organizer.companyName}</div>
              <div className="text-xs text-carbon-500 mt-1">联系人: {organizer.contactName} · {organizer.contactPhone}</div>
            </div>
          </div>
        )}

        {organizer && organizer.status === 'approved' && (
          <>
            <div className="glass-card p-6 mb-8">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-wine-700 rounded-xl flex items-center justify-center">
                  <Building size={32} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl font-bold text-white">{organizer.companyName}</div>
                  <div className="text-sm text-carbon-400">{organizer.contactName} · {organizer.contactPhone}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm inline-flex items-center gap-1">
                    <CheckCircle size={14} />
                    已认证主办方
                  </span>
                  <span className="px-3 py-1 rounded-full bg-gold-500/20 text-gold-400 text-sm inline-flex items-center gap-1">
                    <Calendar size={14} />
                    入驻 {demoStats.totalEvents} 场演出
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: '演出场次', value: demoStats.totalEvents, icon: Calendar, color: 'text-gold-500', sub: `共 ${demoStats.totalShowtimes} 场` },
                { label: '累计售票', value: demoStats.totalSold, icon: Ticket, color: 'text-blue-400', sub: `总座 ${demoStats.totalTickets}` },
                { label: '销售总额', value: `¥${(demoStats.totalRevenue).toLocaleString()}`, icon: TrendingUp, color: 'text-green-400', sub: `平均 ¥721/张` },
                { label: '待核验', value: demoStats.pendingVerify, icon: Shield, color: 'text-purple-400', sub: `退票 ${demoStats.refundCount} 张` },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="glass-card p-5 card-hover">
                    <div className="flex items-start justify-between mb-3">
                      <Icon size={22} className={item.color} />
                      <span className="text-[10px] text-carbon-500">{item.sub}</span>
                    </div>
                    <div className="font-display text-3xl text-white mb-1">{item.value}</div>
                    <div className="text-xs text-carbon-400">{item.label}</div>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Calendar, label: '演出管理', path: '/organizer/events', color: 'text-gold-500', desc: '创建/编辑演出' },
                { icon: Layers, label: '场次配置', path: '/organizer/events', color: 'text-blue-400', desc: '座位/票价/开售时间' },
                { icon: BarChart2, label: '销售数据', path: '/admin', color: 'text-green-400', desc: '票房/上座率/趋势' },
                { icon: Shield, label: '核验记录', path: '/admin', color: 'text-purple-400', desc: '扫码/闸机核销' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <Link key={i} to={item.path} className="glass-card p-6 text-center card-hover">
                    <Icon size={32} className={`mx-auto ${item.color} mb-3`} />
                    <div className="text-white font-medium mb-1">{item.label}</div>
                    <div className="text-[11px] text-carbon-500">{item.desc}</div>
                    <ChevronRight size={14} className="mx-auto mt-3 text-gold-400" />
                  </Link>
                )
              })}
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar size={22} className="text-gold-400" />
                  演出管理 · 场次配置入口
                </h3>
                <Link to="/organizer/events" className="gold-gradient-btn text-sm inline-flex items-center gap-1.5">
                  <Plus size={16} />
                  新建演出
                </Link>
              </div>
              <div className="space-y-3">
                {displayEvents.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="bg-carbon-800/30 rounded-xl p-5 flex items-center gap-5 flex-wrap"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-wine-700 to-carbon-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar size={26} className="text-gold-500/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h4 className="text-white font-medium">{ev.title}</h4>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-wine-800/30 text-wine-300">
                          {categoryLabels[ev.category] || ev.category}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            ev.status === 'published' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {ev.status === 'published' ? '已发布' : ev.status === 'draft' ? '草稿' : ev.status}
                        </span>
                      </div>
                      <div className="text-xs text-carbon-400 flex items-center gap-4 flex-wrap">
                        <span className="inline-flex items-center gap-1"><MapPin size={12} /> {ev.venue}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          {demoEvents.find((d) => d.id === ev.id)?.showtimes || 3} 场场次
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} />
                          上座率 {(demoEvents.find((d) => d.id === ev.id)?.occupancy || 66)}%
                        </span>
                        <span className="inline-flex items-center gap-1 text-gold-400">
                          <TrendingUp size={12} />
                          票房 ¥{(demoEvents.find((d) => d.id === ev.id)?.revenue || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        to={`/organizer/showtimes/${ev.id}`}
                        className="text-xs px-4 py-2.5 rounded-lg bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 transition inline-flex items-center gap-1.5 font-medium"
                      >
                        <Layers size={14} />
                        场次配置
                      </Link>
                      <Link
                        to={`/event/${ev.id}`}
                        className="text-xs px-4 py-2.5 rounded-lg border border-carbon-600 text-carbon-300 hover:text-white transition inline-flex items-center gap-1.5"
                      >
                        <ArrowRight size={14} />
                        预览
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {applyOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-2xl text-gold-400 mb-6">主办方入驻申请</h3>
            <form onSubmit={handleApply}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-carbon-300 mb-2">公司/机构名称 *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none"
                    placeholder="请输入完整工商注册名称"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-carbon-300 mb-2">统一社会信用代码 / 营业执照号 *</label>
                  <input
                    type="text"
                    value={formData.license}
                    onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                    className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none"
                    placeholder="18位统一社会信用代码"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-carbon-300 mb-2">联系人 *</label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-carbon-300 mb-2">联系电话 *</label>
                    <input
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none"
                      placeholder="手机号"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-carbon-300 mb-2">资质文件上传</label>
                  <div className="border-2 border-dashed border-carbon-600 rounded-lg p-8 text-center text-carbon-500 hover:border-gold-500/50 transition cursor-pointer">
                    <FileText size={28} className="mx-auto mb-2 text-carbon-500" />
                    <div className="text-sm">点击上传营业执照、演出经营许可证等资质</div>
                    <div className="text-xs text-carbon-600 mt-1">支持 PDF、JPG、PNG，单个 ≤ 10MB</div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setApplyOpen(false)}
                  className="flex-1 py-3 rounded-lg border border-carbon-600 text-carbon-400 hover:text-white transition"
                >
                  取消
                </button>
                <button type="submit" className="flex-1 wine-gradient-btn">
                  提交申请
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
