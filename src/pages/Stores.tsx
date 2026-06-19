import { useState } from 'react'
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  Star,
  User,
  Phone,
  FileCheck,
  MessageSquare,
  Search,
  Plus,
  Filter,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Shield,
  Heart,
  Award,
  ThumbsUp,
  StarHalf,
} from 'lucide-react'

type TabKey = 'appointments' | 'services' | 'reviews' | 'stores'

interface Appointment {
  id: string
  customer: string
  phone: string
  service: string
  store: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  note?: string
  avatar: string
}

interface ServiceRecord {
  id: string
  customer: string
  avatar: string
  service: string
  store: string
  date: string
  duration: string
  consultant: string
  products: string[]
  hash: string
  status: 'chained' | 'pending'
}

interface Review {
  id: string
  customer: string
  avatar: string
  store: string
  rating: number
  date: string
  content: string
  tags: string[]
  images?: string[]
  reply?: string
  helpful: number
}

const appointments: Appointment[] = [
  {
    id: 'AP001',
    customer: '陈雅婷',
    phone: '138****5821',
    service: '松花粉体验+体质检测',
    store: '浦东旗舰店',
    date: '2026-06-18',
    time: '14:00',
    status: 'confirmed',
    avatar: '陈',
  },
  {
    id: 'AP002',
    customer: '刘志强',
    phone: '139****3344',
    service: '心脑血管养护方案咨询',
    store: '浦东旗舰店',
    date: '2026-06-18',
    time: '15:30',
    status: 'pending',
    note: '需准备血压检测报告',
    avatar: '刘',
  },
  {
    id: 'AP003',
    customer: '王俊杰',
    phone: '136****9900',
    service: '新客户首次体验',
    store: '浦东旗舰店',
    date: '2026-06-18',
    time: '10:00',
    status: 'completed',
    avatar: '王',
  },
  {
    id: 'AP004',
    customer: '李美华',
    phone: '135****2211',
    service: '美容养颜方案定制',
    store: '徐汇体验店',
    date: '2026-06-19',
    time: '11:00',
    status: 'confirmed',
    avatar: '李',
  },
  {
    id: 'AP005',
    customer: '张秀兰',
    phone: '137****7788',
    service: '定期复查',
    store: '长宁服务中心',
    date: '2026-06-20',
    time: '09:30',
    status: 'pending',
    avatar: '张',
  },
  {
    id: 'AP006',
    customer: '赵海涛',
    phone: '134****6677',
    service: '产品使用指导',
    store: '浦东旗舰店',
    date: '2026-06-17',
    time: '16:00',
    status: 'cancelled',
    avatar: '赵',
  },
]

const serviceRecords: ServiceRecord[] = [
  {
    id: 'SR001',
    customer: '陈雅婷',
    avatar: '陈',
    service: '松花粉体验+体质检测',
    store: '浦东旗舰店',
    date: '2026-06-15',
    duration: '90 分钟',
    consultant: '王芳（高级健康顾问）',
    products: ['国珍松花粉片 x1', '体质检测报告 x1'],
    hash: '0x8f3a...e291',
    status: 'chained',
  },
  {
    id: 'SR002',
    customer: '刘志强',
    avatar: '刘',
    service: '心脑血管养护方案',
    store: '浦东旗舰店',
    date: '2026-06-10',
    duration: '120 分钟',
    consultant: '李明（资深营养师）',
    products: ['国珍竹康宁片 x2', '国珍鱼油软胶囊 x1'],
    hash: '0x7c2b...91d4',
    status: 'chained',
  },
  {
    id: 'SR003',
    customer: '李美华',
    avatar: '李',
    service: '美容养颜方案咨询',
    store: '徐汇体验店',
    date: '2026-06-12',
    duration: '60 分钟',
    consultant: '孙丽华（美容顾问）',
    products: ['国珍葡萄籽VE x1', '养颜调理方案 x1'],
    hash: '0x5e1f...38a7',
    status: 'chained',
  },
  {
    id: 'SR004',
    customer: '张秀兰',
    avatar: '张',
    service: '季度健康复查',
    store: '长宁服务中心',
    date: '2026-06-16',
    duration: '45 分钟',
    consultant: '周建国（健康管理师）',
    products: ['复查报告 x1'],
    hash: '—',
    status: 'pending',
  },
]

const reviews: Review[] = [
  {
    id: 'RV001',
    customer: '陈雅婷',
    avatar: '陈',
    store: '浦东旗舰店',
    rating: 5,
    date: '2026-06-15',
    content: '王芳顾问非常专业，根据我的体质给出了非常详细的调理方案，环境也很舒适，体验感满分！',
    tags: ['服务专业', '环境舒适', '耐心细致'],
    helpful: 28,
    reply: '感谢陈女士的认可，我们会继续为您提供优质服务，祝您身体健康！',
  },
  {
    id: 'RV002',
    customer: '刘志强',
    avatar: '刘',
    store: '浦东旗舰店',
    rating: 5,
    date: '2026-06-11',
    content: '李老师对心脑血管养护非常有经验，详细解答了我所有的疑问，产品效果也很好，服用一个月血压稳定了很多。',
    tags: ['专业度高', '效果明显', '讲解清晰'],
    helpful: 45,
  },
  {
    id: 'RV003',
    customer: '王俊杰',
    avatar: '王',
    store: '浦东旗舰店',
    rating: 4,
    date: '2026-06-16',
    content: '第一次来体验，整体感觉不错，就是等候时间稍微长了一点，希望下次能更准时。',
    tags: ['初次体验', '服务态度好'],
    helpful: 12,
    reply: '感谢您的宝贵建议，我们已优化预约排期，期待您再次光临！',
  },
  {
    id: 'RV004',
    customer: '李美华',
    avatar: '李',
    store: '徐汇体验店',
    rating: 5,
    date: '2026-06-13',
    content: '孙顾问的美容方案非常适合我，配合葡萄籽服用两周，皮肤状态明显改善，强烈推荐！',
    tags: ['效果显著', '方案专业', '推荐'],
    helpful: 67,
  },
]

const stores = [
  {
    id: 'SH001',
    name: '浦东旗舰店',
    address: '上海市浦东新区陆家嘴环路 888 号',
    distance: '1.2km',
    rating: 4.9,
    slots: 6,
    image: '🏬',
    services: 12,
    consultants: 8,
  },
  {
    id: 'SH002',
    name: '徐汇体验店',
    address: '上海市徐汇区衡山路 555 号',
    distance: '2.8km',
    rating: 4.8,
    slots: 3,
    image: '🏪',
    services: 8,
    consultants: 5,
  },
  {
    id: 'SH003',
    name: '长宁服务中心',
    address: '上海市长宁区延安西路 1200 号',
    distance: '3.5km',
    rating: 4.7,
    slots: 8,
    image: '🏢',
    services: 15,
    consultants: 6,
  },
  {
    id: 'SH004',
    name: '闵行生活馆',
    address: '上海市闵行区莘庄地铁站南广场',
    distance: '5.2km',
    rating: 4.6,
    slots: 0,
    image: '🏬',
    services: 10,
    consultants: 4,
  },
]

export default function Stores() {
  const [activeTab, setActiveTab] = useState<TabKey>('appointments')
  const [keyword, setKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState('全部')

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: '待确认', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    confirmed: { label: '已确认', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: CheckCircle },
    completed: { label: '已完成', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
    cancelled: { label: '已取消', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: AlertCircle },
  }

  const filteredAppointments = appointments.filter((a) => {
    const matchKw = !keyword || a.customer.includes(keyword) || a.service.includes(keyword)
    const matchStatus = filterStatus === '全部' || statusConfig[a.status].label === filterStatus
    return matchKw && matchStatus
  })

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-amber-600" />
            生活馆服务
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            预约到店 · 服务记录上链 · 客户评价聚合
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition flex items-center gap-2">
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建预约
          </button>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 inline-flex">
        {[
          { key: 'appointments', label: '预约管理', icon: Calendar, badge: appointments.filter((a) => a.status === 'pending').length },
          { key: 'services', label: '服务记录', icon: FileCheck },
          { key: 'reviews', label: '客户评价', icon: MessageSquare, badge: reviews.length },
          { key: 'stores', label: '生活馆网络', icon: MapPin },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 预约管理 */}
      {activeTab === 'appointments' && (
        <>
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索客户姓名、服务项目..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent focus:bg-white transition"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                {['全部', '待确认', '已确认', '已完成', '已取消'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                      filterStatus === s
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAppointments.map((a) => {
              const cfg = statusConfig[a.status]
              const StatusIcon = cfg.icon
              return (
                <div
                  key={a.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-lg hover:border-amber-200 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                        {a.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{a.customer}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {a.phone}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border ${cfg.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span className="truncate">{a.service}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building2 className="w-4 h-4 text-amber-500" />
                      <span>{a.store}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-sky-500" />
                      <span>{a.date}</span>
                      <Clock className="w-4 h-4 text-violet-500 ml-1" />
                      <span>{a.time}</span>
                    </div>
                    {a.note && (
                      <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100 text-amber-800 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{a.note}</span>
                      </div>
                    )}
                  </div>

                  {a.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <button className="flex-1 py-2 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-md transition">
                        确认预约
                      </button>
                      <button className="flex-1 py-2 text-sm font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition">
                        取消
                      </button>
                    </div>
                  )}
                  {a.status === 'confirmed' && (
                    <button className="mt-4 w-full py-2 text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:shadow-md transition">
                      标记完成
                    </button>
                  )}
                  {a.status === 'completed' && (
                    <button className="mt-4 w-full py-2 text-sm font-medium bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1">
                      <FileCheck className="w-4 h-4" />
                      查看服务记录
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* 服务记录 */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              服务记录（区块链存证）
            </h3>
            <div className="text-xs text-slate-500">
              共 {serviceRecords.length} 条记录 · {serviceRecords.filter((s) => s.status === 'chained').length} 条已上链
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {serviceRecords.map((s) => (
              <div
                key={s.id}
                className="p-6 hover:bg-slate-50 transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                      {s.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-800 text-lg">{s.customer}</span>
                        <span className="text-xs text-slate-400">#{s.id}</span>
                        {s.status === 'chained' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                            <Shield className="w-3 h-3" />
                            已上链
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3" />
                            待上链
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-rose-500" />
                          {s.service}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4 text-amber-500" />
                          {s.store}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-sky-500" />
                          {s.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-violet-500" />
                          {s.duration}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        <span className="text-slate-500">顾问：</span>
                        {s.consultant}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.products.map((p) => (
                          <span
                            key={p}
                            className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-md"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">存证哈希</div>
                    <div className="font-mono text-sm text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg mt-1">
                      {s.hash}
                    </div>
                    {s.status === 'chained' && (
                      <button className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 ml-auto">
                        查看链上凭证
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 客户评价 */}
      {activeTab === 'reviews' && (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { label: '综合评分', value: '4.8', icon: Star, color: 'from-amber-500 to-orange-500' },
              { label: '评价总数', value: '1,286', icon: MessageSquare, color: 'from-sky-500 to-blue-600' },
              { label: '好评率', value: '96.2%', icon: ThumbsUp, color: 'from-emerald-500 to-teal-600' },
              { label: '待回复', value: reviews.filter((r) => !r.reply).length, icon: AlertCircle, color: 'from-rose-500 to-pink-600' },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center gap-4"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                    <div className="text-sm text-slate-500">{s.label}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {r.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="font-semibold text-slate-800">{r.customer}</span>
                        <span className="text-sm text-slate-500 ml-3">{r.store}</span>
                        <span className="text-sm text-slate-400 ml-3">{r.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => {
                          const filled = i < Math.floor(r.rating)
                          const half = !filled && i < r.rating
                          return filled ? (
                            <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                          ) : half ? (
                            <StarHalf key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                          ) : (
                            <Star key={i} className="w-4 h-4 text-slate-200" />
                          )
                        })}
                      </div>
                    </div>

                    <p className="mt-3 text-slate-700 leading-relaxed">{r.content}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {r.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {r.reply && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-sky-50 to-violet-50 rounded-xl border border-sky-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-sky-600" />
                          <span className="text-sm font-semibold text-slate-800">商家回复</span>
                        </div>
                        <p className="text-sm text-slate-700">{r.reply}</p>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        {r.helpful} 人觉得有用
                      </span>
                      <div className="flex items-center gap-2">
                        {!r.reply && (
                          <button className="px-4 py-1.5 text-sm font-medium bg-gradient-to-r from-sky-500 to-violet-600 text-white rounded-lg hover:shadow-md transition">
                            回复评价
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 生活馆网络 */}
      {activeTab === 'stores' && (
        <div className="grid gap-4 md:grid-cols-2">
          {stores.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl hover:border-amber-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                  {s.image}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 group-hover:text-amber-600 transition">
                        {s.name}
                      </h3>
                      <div className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {s.address}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {s.distance}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-slate-50 rounded-xl">
                      <div className="font-bold text-slate-800">{s.services}</div>
                      <div className="text-xs text-slate-500">服务项目</div>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-xl">
                      <div className="font-bold text-slate-800">{s.consultants}</div>
                      <div className="text-xs text-slate-500">健康顾问</div>
                    </div>
                    <div className="text-center p-2 bg-slate-50 rounded-xl">
                      <div className="font-bold text-amber-600 flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {s.rating}
                      </div>
                      <div className="text-xs text-slate-500">客户评分</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${
                        s.slots > 0 ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      {s.slots > 0 ? `今日可约 · 剩余 ${s.slots} 位` : '今日已约满'}
                    </span>
                    <button className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:shadow-md transition flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      立即预约
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
