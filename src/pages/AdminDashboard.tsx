import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BarChart3, Users, Ticket, TrendingUp, MapPin, Clock, Award, AlertCircle, ChevronLeft,
  Layers, Zap, Shield, FileCheck, FileText, ChevronRight, CheckCircle, XCircle, Eye,
  QrCode, Crown, CreditCard, RefreshCw, Calendar, Building, Search, FileKey,
  ArrowRight, Filter,
} from 'lucide-react'
import { apiGet } from '@/utils/api'
import useAuthStore from '@/stores/authStore'

const demoHeatmap = {
  showtimeTitle: '李诞脱口秀「笑场」2026特别专场 · 6月20日场',
  totalSeats: 600,
  totalSold: 396,
  overallOccupancy: 0.66,
  zones: [
    { zoneId: 1, name: 'VIP区', color: '#D4AF37', soldSeats: 18, totalSeats: 24, occupancyRate: 0.75, revenue: 30240, avgPrice: 1680 },
    { zoneId: 2, name: 'A区', color: '#8B1A2B', soldSeats: 52, totalSeats: 80, occupancyRate: 0.65, revenue: 45760, avgPrice: 880 },
    { zoneId: 3, name: 'B区', color: '#1E88E5', soldSeats: 95, totalSeats: 160, occupancyRate: 0.59, revenue: 55100, avgPrice: 580 },
    { zoneId: 4, name: 'C区', color: '#43A047', soldSeats: 231, totalSeats: 336, occupancyRate: 0.69, revenue: 64680, avgPrice: 280 },
  ],
}

const demoRanking = {
  rankings: [
    { rank: 1, name: '周杰伦「嘉年华」北京站 · VIP区', sales: 1856, revenue: 3118080, event_title: '国家体育场（鸟巢）', zone: true, change: '+12%' },
    { rank: 2, name: '李诞脱口秀 · A区', sales: 512, revenue: 450560, event_title: '北展剧场', zone: true, change: '+8%' },
    { rank: 3, name: '孟京辉话剧「恋爱的犀牛」· A区', sales: 420, revenue: 369600, event_title: '国家大剧院', zone: true, change: '+5%' },
    { rank: 4, name: '周杰伦「嘉年华」· A区', sales: 3840, revenue: 3379200, event_title: '国家体育场', zone: true, change: '+15%' },
    { rank: 5, name: '李诞脱口秀 · B区', sales: 950, revenue: 551000, event_title: '北展剧场', zone: true, change: '+3%' },
    { rank: 6, name: '演唱会类 总榜', sales: 5696, revenue: 6497280, category: 'concert', zone: false, change: '+18%' },
  ],
}

const demoRefund = {
  clusters: [
    { label: '日程变更', count: 34, percentage: 0.34, color: '#EF4444' },
    { label: '个人原因', count: 28, percentage: 0.28, color: '#F59E0B' },
    { label: '健康原因', count: 19, percentage: 0.19, color: '#10B981' },
    { label: '重复购票', count: 12, percentage: 0.12, color: '#3B82F6' },
    { label: '其他原因', count: 7, percentage: 0.07, color: '#8B5CF6' },
  ],
  feeStats: {
    totalRefunds: 100,
    totalRefundAmount: 62400,
    totalFeeAmount: 12480,
    refundRate: 0.032,
  },
  timeDistribution: [
    { label: '6/7', count: 8 },
    { label: '6/8', count: 12 },
    { label: '6/9', count: 15 },
    { label: '6/10', count: 20 },
    { label: '6/11', count: 18 },
    { label: '6/12', count: 14 },
    { label: '6/13', count: 13 },
  ],
}

const demoAuditOrganizers = [
  { id: 1, companyName: '上海笑果文化传媒有限公司', contactName: '王经理', contactPhone: '138****1234', submittedAt: '2026-06-10', status: 'pending', license: '91310000MA1FL6XXX' },
  { id: 2, companyName: '北京大麦文化传播有限公司', contactName: '李总监', contactPhone: '139****5678', submittedAt: '2026-06-11', status: 'pending', license: '9111000006485XXX' },
  { id: 3, companyName: '北京时代峰峻文化艺术', contactName: '张主管', contactPhone: '136****9012', submittedAt: '2026-06-09', status: 'approved', license: '9111010555XXXXXX' },
  { id: 4, companyName: '上海摩登天空文化传播', contactName: '陈经理', contactPhone: '137****3456', submittedAt: '2026-06-08', status: 'rejected', license: '9131011063XXXXXX', reviewReason: '营业执照信息需补充' },
]

const demoShowtimesAudit = [
  { id: 1, eventTitle: '李诞脱口秀「笑场」2026特别专场', organizer: '笑果文化', date: '2026-06-20', time: '19:30', venue: '北展剧场', zones: 4, tiers: 5, status: 'published', tickets: 600, sold: 396 },
  { id: 2, eventTitle: '孟京辉话剧「恋爱的犀牛」', organizer: '国家大剧院', date: '2026-06-22', time: '19:30', venue: '国家大剧院戏剧场', zones: 5, tiers: 4, status: 'published', tickets: 400, sold: 280 },
  { id: 3, eventTitle: '2026周杰伦「嘉年华」', organizer: '摩登天空', date: '2026-07-01', time: '19:00', venue: '国家体育场', zones: 8, tiers: 6, status: 'presale', tickets: 80000, sold: 62400 },
]

const demoTicketAudit = [
  { id: 1, orderNo: 'TV20260613001', ticketNo: 'FAKE-8D969EEF6ECAD3C29A3A629280E686CF', blockchain: '0x7a2f9e...b3e8', event: '李诞脱口秀 · 6月20日', zoneSeat: 'A区 3排12号', user: '张**(身份证****1234)', price: 880, verifyStatus: '未核验', antiFakeValid: true },
  { id: 2, orderNo: 'TV20260613001', ticketNo: 'FAKE-5D8771B38B503A58DC9867ABCC359600', blockchain: '0x9c1e4a...2d45', event: '李诞脱口秀 · 6月20日', zoneSeat: 'A区 3排13号', user: '李**(身份证****5678)', price: 880, verifyStatus: '未核验', antiFakeValid: true },
  { id: 3, orderNo: 'TV20260612088', ticketNo: 'FAKE-2E4C5582A47415C08F3F6777B369A821', blockchain: '0x1f8c22...77a9', event: '孟京辉话剧 · 6月22日', zoneSeat: 'VIP区 1排5号', user: '王**(身份证****9012)', price: 1280, verifyStatus: '已核验', verifyTime: '2026-06-12 18:45', antiFakeValid: true },
  { id: 4, orderNo: 'TV20260610112', ticketNo: 'FAKE-9A2B3C4D5E6F7E8D9C0B1A2C3D4E5F66', blockchain: '0x4e6b3c...1f82', event: '周杰伦 · 7月1日', zoneSeat: 'A区 15排28号', user: '赵**(身份证****3456)', price: 880, verifyStatus: '未核验', antiFakeValid: true },
  { id: 5, orderNo: 'TV20260609233', ticketNo: 'FAKE-11111111111111111111111111111111', blockchain: '0x000000...0000', event: '李诞脱口秀 · 6月21日', zoneSeat: 'C区 12排8号', user: '孙**(身份证****7890)', price: 280, verifyStatus: '异常', antiFakeValid: false, riskTag: '防伪码不匹配' },
]

const auditTabs = [
  { key: 'heatmap', label: '上座率热力图', icon: MapPin },
  { key: 'ranking', label: '区域销量TOP', icon: Award },
  { key: 'refund', label: '退票聚类分析', icon: AlertCircle },
  { key: 'organizers', label: '主办方审核', icon: Building },
  { key: 'showtimes', label: '场次配置审计', icon: Layers },
  { key: 'tickets', label: '票源保真复查', icon: Shield },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const [activeTab, setActiveTab] = useState<string>('heatmap')
  const [heatmapData, setHeatmapData] = useState<any>(null)
  const [salesRanking, setSalesRanking] = useState<any>(null)
  const [refundAnalysis, setRefundAnalysis] = useState<any>(null)
  const [auditFilter, setAuditFilter] = useState('')
  const [ticketFilter, setTicketFilter] = useState('')
  const [approvalReason, setApprovalReason] = useState('')
  const [approvingId, setApprovingId] = useState<number | null>(null)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    apiGet<any>('/analytics/heatmap/1').then(d => d?.zones?.length ? setHeatmapData(d) : setHeatmapData(demoHeatmap)).catch(() => setHeatmapData(demoHeatmap))
    apiGet<any>('/analytics/sales-ranking?type=zone').then(d => d?.rankings?.length ? setSalesRanking(d) : setSalesRanking(demoRanking)).catch(() => setSalesRanking(demoRanking))
    apiGet<any>('/analytics/refund-analysis').then(d => d?.clusters?.length ? setRefundAnalysis(d) : setRefundAnalysis(demoRefund)).catch(() => setRefundAnalysis(demoRefund))
  }, [])

  const hm = heatmapData || demoHeatmap
  const sr = salesRanking || demoRanking
  const rf = refundAnalysis || demoRefund

  const statsCards = [
    { label: '总场次', value: '24', icon: Ticket, color: 'text-gold-500', sub: '9 个演出项目' },
    { label: '总出票', value: '3,842', icon: BarChart3, color: 'text-green-400', sub: '核验率 78%' },
    { label: '总营收', value: '¥2,184,560', icon: TrendingUp, color: 'text-gold-400', sub: '环比 +18.2%' },
    { label: '平均上座率', value: '78.5%', icon: MapPin, color: 'text-blue-400', sub: 'VIP 区 82%' },
    { label: '退票率', value: '3.2%', icon: RefreshCw, color: 'text-wine-400', sub: '手续费 ¥12,480' },
    { label: '待审核主办方', value: '2', icon: Users, color: 'text-purple-400', sub: '24h 内响应' },
  ]

  const filteredOrganizers = useMemo(
    () => demoAuditOrganizers.filter((o) =>
      !auditFilter || o.companyName.includes(auditFilter) || o.contactName.includes(auditFilter)
    ),
    [auditFilter]
  )
  const filteredTickets = useMemo(
    () => demoTicketAudit.filter((t) =>
      !ticketFilter || t.event.includes(ticketFilter) || t.ticketNo.includes(ticketFilter) || t.zoneSeat.includes(ticketFilter)
    ),
    [ticketFilter]
  )

  return (
    <div className="min-h-screen bg-gradient-dark pb-20">
      <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-6 flex-wrap">
          <button onClick={() => navigate(-1)} className="text-white hover:text-gold-400 transition">
            <ChevronLeft size={24} />
          </button>
          <Link to="/" className="font-display text-xl text-gold-500 tracking-wider">
            TICKET VAULT
          </Link>
          <div className="text-carbon-500 text-sm hidden md:block">·</div>
          <span className="text-carbon-400 text-sm">运营审计 · 履约复盘中心</span>
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-sm">
            {isLoggedIn ? (
              <>
                <span className="text-gold-400 inline-flex items-center gap-1">
                  <Crown size={14} />
                  {user?.realName}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  user?.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                  user?.role === 'organizer' ? 'bg-gold-500/20 text-gold-400' :
                  'bg-carbon-700 text-carbon-400'
                }`}>
                  {user?.role === 'admin' ? '管理员权限' : user?.role === 'organizer' ? '主办方' : '游客查看'}
                </span>
              </>
            ) : (
              <Link to="/login" className="wine-gradient-btn text-xs inline-flex items-center gap-1">
                <Users size={14} /> 管理员登录
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl text-gold-400 mb-2">运营数据大屏 · 审计复盘</h1>
            <p className="text-carbon-400 text-sm">
              上座率热力图 · 区域销量TOP榜 · 退票原因聚类 · 主办方审核 · 场次配置审计 · 票源保真复查 全栈承接
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/admin/organizers" className="wine-gradient-btn text-xs inline-flex items-center gap-1.5">
              <FileText size={14} />
              主办方审核队列
            </Link>
            <Link to="/organizer" className="px-4 py-2 rounded-lg border border-carbon-600 text-carbon-300 hover:text-white text-xs transition inline-flex items-center gap-1.5">
              <Calendar size={14} />
              场次配置中心
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {statsCards.map((card, i) => {
            const Icon = card.icon
            return (
              <div key={i} className="glass-card p-5 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[11px] text-carbon-500">{card.sub}</span>
                  <Icon size={18} className={card.color} />
                </div>
                <div className={`font-display text-2xl ${card.color} mb-1`}>{card.value}</div>
                <div className="text-xs text-carbon-400">{card.label}</div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {auditTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap transition-all text-sm ${
                  isActive
                    ? 'bg-wine-800/50 text-gold-400 border border-gold-500/30 shadow-glow-wine'
                    : 'glass-card text-carbon-300 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'heatmap' && (
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="section-title mb-0">上座率热力图 · 按分区可视化</h2>
                <p className="text-sm text-carbon-500 mt-1">{hm.showtimeTitle} · 共 {hm.totalSeats} 座 · 已售 {hm.totalSold} 座</p>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl text-gold-500">{(hm.overallOccupancy * 100).toFixed(1)}%</div>
                <div className="text-xs text-carbon-500">总上座率</div>
              </div>
            </div>

            <div className="mb-8 bg-carbon-800/40 rounded-2xl p-6 border border-carbon-700/60">
              <div className="text-xs text-carbon-500 mb-4 text-center">剧场座位布局（缩略示意图）</div>
              <div className="max-w-2xl mx-auto">
                <div className="h-8 bg-gradient-to-r from-carbon-700 via-gold-500/40 to-carbon-700 rounded-t-2xl mb-3 flex items-center justify-center text-[10px] text-carbon-300 tracking-widest">
                  舞台 · STAGE
                </div>
                <div className="space-y-1.5">
                  {hm.zones?.map((z: any) => {
                    const widthPct = (z.totalSeats / 336) * 100
                    return (
                      <div key={z.zoneId} className="flex items-center gap-3">
                        <div className="w-14 text-[10px] text-carbon-400 shrink-0">{z.name}</div>
                        <div className="flex-1 flex gap-1 overflow-hidden h-7 rounded">
                          {Array.from({ length: 12 }).map((_, si) => {
                            const idxPct = (si + 0.5) / 12
                            const sold = idxPct <= z.occupancyRate
                            return (
                              <div
                                key={si}
                                className="flex-1 rounded-sm"
                                style={{
                                  backgroundColor: sold ? z.color : `${z.color}30`,
                                  opacity: sold ? 1 : 0.3,
                                  boxShadow: sold ? `0 0 8px ${z.color}80` : 'none',
                                }}
                              />
                            )
                          })}
                        </div>
                        <div className="w-20 text-right text-xs text-white shrink-0">
                          {(z.occupancyRate * 100).toFixed(0)}%
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-center gap-5 mt-4 text-[10px]">
                  {['#D4AF37 · VIP', '#8B1A2B · A', '#1E88E5 · B', '#43A047 · C'].map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-carbon-400">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: t.split(' · ')[0] }} />
                      {t.split(' · ')[1]}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {hm.zones?.map((zone: any) => (
                <div key={zone.zoneId} className="border border-carbon-700 rounded-2xl p-6 hover:border-gold-500/30 transition">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: zone.color, boxShadow: `0 0 14px ${zone.color}80` }} />
                      <div>
                        <div className="text-white font-bold text-lg">{zone.name}</div>
                        <div className="text-[11px] text-carbon-500">
                          均价 ¥{zone.avgPrice} · 单区营收 ¥{zone.revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-3xl text-gold-500">{(zone.occupancyRate * 100).toFixed(1)}%</div>
                      <div className="text-xs text-carbon-400">{zone.soldSeats} / {zone.totalSeats} 座</div>
                    </div>
                  </div>
                  <div className="h-4 bg-carbon-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${zone.occupancyRate * 100}%`,
                        backgroundColor: zone.color,
                        boxShadow: `0 0 22px ${zone.color}80`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-carbon-400">
                    <span>已售 {zone.soldSeats} 座</span>
                    <span>剩余 {zone.totalSeats - zone.soldSeats} 座</span>
                    <span>共 {zone.totalSeats} 座</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="section-title mb-0">区域销量TOP榜 · 分区/分类</h2>
                <p className="text-sm text-carbon-500 mt-1">按出票数 / 营收额排序，支持按区域和演出维度汇总</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Filter size={14} className="text-carbon-500" />
                <span className="text-carbon-400">排序:</span>
                <span className="text-gold-400 border border-gold-500/40 rounded px-2 py-1">出票数</span>
                <span className="text-carbon-400">/</span>
                <span className="text-carbon-400 hover:text-white cursor-pointer">营收额</span>
              </div>
            </div>
            <div className="space-y-3">
              {sr.rankings?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-5 p-5 rounded-2xl bg-carbon-800/30 hover:bg-carbon-800/50 transition flex-wrap"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-display text-xl shrink-0 ${
                      idx === 0
                        ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-carbon-950 shadow-glow-gold'
                        : idx === 1
                        ? 'bg-gradient-to-br from-carbon-300 to-carbon-500 text-carbon-950'
                        : idx === 2
                        ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white'
                        : 'bg-carbon-700 text-carbon-300'
                    }`}
                  >
                    {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : item.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white mb-1">{item.name}</div>
                    <div className="text-xs text-carbon-400 flex items-center gap-3 flex-wrap">
                      {item.zone && (
                        <span className="inline-flex items-center gap-1"><MapPin size={12} /> {item.event_title}</span>
                      )}
                      {item.category && (
                        <span className="inline-flex items-center gap-1"><Layers size={12} /> {item.category === 'concert' ? '演唱会' : item.category}</span>
                      )}
                      <span className={`inline-flex items-center gap-0.5 text-green-400`}>
                        <TrendingUp size={12} />
                        {item.change || '+6%'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <div className="text-gold-500 font-display text-xl">{item.sales.toLocaleString()} 张</div>
                      <div className="text-[11px] text-carbon-500">出票数</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-display text-xl">¥{(item.revenue || 0).toLocaleString()}</div>
                      <div className="text-[11px] text-carbon-500">累计营收</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'refund' && (
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="section-title mb-0">退票原因聚类分析</h2>
                <p className="text-sm text-carbon-500 mt-1">5大类原因分布 + 近7日趋势 + 手续费规则统计</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-5">
                <div className="text-[11px] text-carbon-500 mb-3 flex items-center gap-1"><AlertCircle size={12} className="text-wine-400" /> 统计</div>
                <div className="font-display text-3xl text-wine-400 mb-1">{rf.feeStats?.totalRefunds || 0}</div>
                <div className="text-xs text-carbon-400">总退票数</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-[11px] text-carbon-500 mb-3 flex items-center gap-1"><RefreshCw size={12} className="text-gold-400" /> 金额</div>
                <div className="font-display text-3xl text-gold-400 mb-1">¥{(rf.feeStats?.totalRefundAmount || 0).toLocaleString()}</div>
                <div className="text-xs text-carbon-400">退款总额</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-[11px] text-carbon-500 mb-3 flex items-center gap-1"><CreditCard size={12} className="text-green-400" /> 风控</div>
                <div className="font-display text-3xl text-green-400 mb-1">¥{(rf.feeStats?.totalFeeAmount || 0).toLocaleString()}</div>
                <div className="text-xs text-carbon-400">手续费收入（梯度规则）</div>
              </div>
              <div className="glass-card p-5">
                <div className="text-[11px] text-carbon-500 mb-3 flex items-center gap-1"><TrendingUp size={12} className="text-blue-400" /> 比率</div>
                <div className="font-display text-3xl text-blue-400 mb-1">{((rf.feeStats?.refundRate || 0) * 100).toFixed(2)}%</div>
                <div className="text-xs text-carbon-400">整体退票率</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">退票原因分布 · 聚类结果</h3>
                <div className="space-y-4">
                  {rf.clusters?.map((c: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color, boxShadow: `0 0 10px ${c.color}80` }} />
                          <span className="text-white text-sm font-medium">{c.label}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gold-500 font-bold">{c.count}</span>
                          <span className="text-carbon-400 ml-2 text-xs">({(c.percentage * 100).toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="h-3 bg-carbon-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${c.percentage * 100}%`, backgroundColor: c.color, boxShadow: `0 0 14px ${c.color}80` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-4">近7日退票趋势 · 时间序列</h3>
                <div className="bg-carbon-800/30 rounded-2xl p-5">
                  <div className="flex items-end gap-3 h-48">
                    {rf.timeDistribution?.map((d: any, idx: number) => {
                      const maxCount = Math.max(...rf.timeDistribution.map((x: any) => x.count))
                      const heightPct = (d.count / maxCount) * 100
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-3 justify-end h-full">
                          <span className="text-xs font-bold text-gold-400">{d.count}</span>
                          <div
                            className="w-full bg-gradient-to-t from-wine-800/70 via-gold-500/60 to-gold-400/80 rounded-t-lg transition-all duration-500 relative"
                            style={{ height: `${heightPct}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 rounded-t-lg" />
                          </div>
                          <span className="text-xs text-carbon-400">{d.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-carbon-800/30 rounded-2xl p-6 border border-carbon-700/40">
              <h3 className="text-base font-medium text-white mb-4 flex items-center gap-2">
                <Shield size={18} className="text-gold-400" />
                退换票智能风控规则 · 手续费梯度统计
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <div className="text-white font-medium mb-1 flex items-center gap-1.5"><Clock size={14} /> 演出前 ≥ 48 小时</div>
                  <div className="font-display text-2xl text-green-400 mb-1">手续费 0%</div>
                  <div className="text-[11px] text-carbon-400">占退票 43% · 退款 ¥26,832</div>
                </div>
                <div className="p-4 rounded-xl bg-gold-500/10 border border-gold-500/30">
                  <div className="text-white font-medium mb-1 flex items-center gap-1.5"><Clock size={14} /> 演出前 24-48 小时</div>
                  <div className="font-display text-2xl text-gold-400 mb-1">手续费 20%</div>
                  <div className="text-[11px] text-carbon-400">占退票 37% · 手续费 ¥9,235</div>
                </div>
                <div className="p-4 rounded-xl bg-wine-500/10 border border-wine-500/30">
                  <div className="text-white font-medium mb-1 flex items-center gap-1.5"><Clock size={14} /> 演出前 &lt; 24 小时</div>
                  <div className="font-display text-2xl text-wine-400 mb-1">不可退票</div>
                  <div className="text-[11px] text-carbon-400">已拒绝 56 笔 · 规避损失 ¥38,920</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'organizers' && (
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="section-title mb-0">主办方入驻审核队列</h2>
                <p className="text-sm text-carbon-500 mt-1">提交资质 → 平台核验 → 通过 / 拒绝（附拒绝理由）</p>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-500" />
                <input
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  placeholder="搜索公司/联系人"
                  className="pl-9 pr-4 py-2 rounded-lg bg-carbon-800/50 border border-carbon-600 text-white text-sm focus:border-gold-500 outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-carbon-500 border-b border-carbon-700">
                    <th className="pb-3 pr-4 font-medium">公司名称</th>
                    <th className="pb-3 pr-4 font-medium">社会信用代码</th>
                    <th className="pb-3 pr-4 font-medium">联系人 / 电话</th>
                    <th className="pb-3 pr-4 font-medium">提交时间</th>
                    <th className="pb-3 pr-4 font-medium">状态</th>
                    <th className="pb-3 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-700/50">
                  {filteredOrganizers.map((o) => (
                    <tr key={o.id} className="hover:bg-carbon-800/30 transition">
                      <td className="py-4 pr-4">
                        <div className="font-medium text-white flex items-center gap-2">
                          <Building size={14} className="text-gold-400" />
                          {o.companyName}
                        </div>
                      </td>
                      <td className="py-4 pr-4 text-xs text-carbon-400 font-mono">{o.license}</td>
                      <td className="py-4 pr-4 text-xs text-carbon-300">
                        <div>{o.contactName}</div>
                        <div className="text-carbon-500">{o.contactPhone}</div>
                      </td>
                      <td className="py-4 pr-4 text-xs text-carbon-400">{o.submittedAt}</td>
                      <td className="py-4 pr-4">
                        {o.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                            <Clock size={12} /> 待审核
                          </span>
                        )}
                        {o.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                            <CheckCircle size={12} /> 已通过
                          </span>
                        )}
                        {o.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-wine-500/20 text-wine-400 text-xs">
                            <XCircle size={12} /> 已拒绝
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        {o.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setApprovingId(o.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs hover:bg-green-500/30 transition"
                            >
                              <CheckCircle size={12} />
                              通过
                            </button>
                            <button
                              onClick={() => setRejectingId(o.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-wine-500/20 text-wine-400 text-xs hover:bg-wine-500/30 transition"
                            >
                              <XCircle size={12} />
                              拒绝
                            </button>
                            <button
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-carbon-600 text-carbon-400 text-xs hover:text-white transition"
                            >
                              <Eye size={12} />
                              详情
                            </button>
                          </div>
                        )}
                        {o.status === 'rejected' && (
                          <div className="text-[11px] text-wine-400 ml-auto max-w-[240px] text-right">
                            拒绝原因: {o.reviewReason}
                          </div>
                        )}
                        {o.status === 'approved' && (
                          <Link to="/organizer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold-500/20 text-gold-400 text-xs hover:bg-gold-500/30 transition">
                            <Layers size={12} />
                            查看演出
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'showtimes' && (
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="section-title mb-0">场次配置审计 · 履约复盘</h2>
                <p className="text-sm text-carbon-500 mt-1">核对每个场次的分区、票价层级、预售/开售时间、销售进度</p>
              </div>
              <Link to="/organizer" className="wine-gradient-btn text-xs inline-flex items-center gap-1.5">
                <Layers size={14} />
                进入场次配置中心
              </Link>
            </div>

            <div className="space-y-4">
              {demoShowtimesAudit.map((st) => (
                <div key={st.id} className="border border-carbon-700 rounded-2xl p-6 hover:border-gold-500/30 transition">
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-white font-bold text-lg">{st.eventTitle}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          st.status === 'published' ? 'bg-green-500/20 text-green-400' :
                          st.status === 'presale' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {st.status === 'published' ? '在售中' : st.status === 'presale' ? '预售中' : '草稿'}
                        </span>
                      </div>
                      <div className="text-xs text-carbon-400 flex items-center gap-4 flex-wrap">
                        <span className="inline-flex items-center gap-1"><Building size={12} /> {st.organizer}</span>
                        <span className="inline-flex items-center gap-1"><MapPin size={12} /> {st.venue}</span>
                        <span className="inline-flex items-center gap-1"><Calendar size={12} /> {st.date} {st.time}</span>
                        <span className="inline-flex items-center gap-1"><Layers size={12} /> {st.zones} 分区 · {st.tiers} 档票价</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl text-gold-500">{((st.sold / st.tickets) * 100).toFixed(1)}%</div>
                      <div className="text-xs text-carbon-400">{st.sold.toLocaleString()} / {st.tickets.toLocaleString()} 座</div>
                    </div>
                  </div>

                  <div className="h-3 bg-carbon-700 rounded-full overflow-hidden mb-4">
                    <div
                      className="h-full bg-gradient-gold rounded-full transition-all duration-1000"
                      style={{ width: `${(st.sold / st.tickets) * 100}%` }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={`/organizer/showtimes/${st.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold-500/20 text-gold-400 text-xs hover:bg-gold-500/30 transition"
                    >
                      <Layers size={13} />
                      分区 / 票价层级
                    </Link>
                    <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-carbon-600 text-carbon-300 text-xs hover:text-white transition">
                      <Clock size={13} />
                      预售/开售时间
                    </button>
                    <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-carbon-600 text-carbon-300 text-xs hover:text-white transition">
                      <FileCheck size={13} />
                      核验日志
                    </button>
                    <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-carbon-600 text-carbon-300 text-xs hover:text-white transition">
                      <ArrowRight size={13} />
                      履约审计报告
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="section-title mb-0">票源保真复查 · 区块链存证</h2>
                <p className="text-sm text-carbon-500 mt-1">防伪码校验 + 区块链哈希匹配 + 闸机核验记录 · 履约审计</p>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-500" />
                <input
                  value={ticketFilter}
                  onChange={(e) => setTicketFilter(e.target.value)}
                  placeholder="搜索防伪码/场次/座位"
                  className="pl-9 pr-4 py-2 rounded-lg bg-carbon-800/50 border border-carbon-600 text-white text-sm focus:border-gold-500 outline-none w-64"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4">
                <div className="text-[11px] text-carbon-500 mb-2 flex items-center gap-1"><Shield size={12} className="text-green-400" /> 抽样</div>
                <div className="font-display text-2xl text-green-400 mb-1">{demoTicketAudit.length}</div>
                <div className="text-xs text-carbon-400">复查票数</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-[11px] text-carbon-500 mb-2 flex items-center gap-1"><CheckCircle size={12} className="text-green-400" /> 通过</div>
                <div className="font-display text-2xl text-green-400 mb-1">{demoTicketAudit.filter(t => t.antiFakeValid).length}</div>
                <div className="text-xs text-carbon-400">防伪合法</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-[11px] text-carbon-500 mb-2 flex items-center gap-1"><QrCode size={12} className="text-blue-400" /> 核验</div>
                <div className="font-display text-2xl text-blue-400 mb-1">{demoTicketAudit.filter(t => t.verifyStatus === '已核验').length}</div>
                <div className="text-xs text-carbon-400">已入场</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-[11px] text-carbon-500 mb-2 flex items-center gap-1"><AlertCircle size={12} className="text-wine-400" /> 风险</div>
                <div className="font-display text-2xl text-wine-400 mb-1">{demoTicketAudit.filter(t => !t.antiFakeValid).length}</div>
                <div className="text-xs text-carbon-400">异常待处置</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-carbon-500 border-b border-carbon-700">
                    <th className="pb-3 pr-3 font-medium">订单号 / 防伪码</th>
                    <th className="pb-3 pr-3 font-medium">演出 · 座位</th>
                    <th className="pb-3 pr-3 font-medium">持票人 (实名)</th>
                    <th className="pb-3 pr-3 font-medium">区块链存证</th>
                    <th className="pb-3 pr-3 font-medium">核验状态</th>
                    <th className="pb-3 font-medium text-right">保真审计</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-carbon-700/50">
                  {filteredTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-carbon-800/30 transition">
                      <td className="py-4 pr-3">
                        <div className="text-white font-mono text-xs">{t.orderNo}</div>
                        <div className="text-[10px] font-mono text-carbon-500 mt-0.5 truncate max-w-[220px]">
                          {t.ticketNo}
                        </div>
                        <div className="text-xs text-gold-400 mt-1">¥{t.price}</div>
                      </td>
                      <td className="py-4 pr-3">
                        <div className="text-white text-xs">{t.event}</div>
                        <div className="text-[11px] text-carbon-500 mt-0.5">{t.zoneSeat}</div>
                      </td>
                      <td className="py-4 pr-3">
                        <div className="text-xs text-carbon-300 flex items-center gap-1">
                          <Users size={12} className="text-rose-400" />
                          {t.user}
                        </div>
                      </td>
                      <td className="py-4 pr-3">
                        <div className="flex items-center gap-1.5">
                          <FileKey size={12} className="text-blue-400" />
                          <span className="text-[11px] font-mono text-blue-300">{t.blockchain}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-3">
                        <div>
                          {t.verifyStatus === '已核验' ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                                <CheckCircle size={11} /> 已核验
                              </span>
                              <div className="text-[10px] text-carbon-500 mt-1">{t.verifyTime}</div>
                            </div>
                          ) : t.verifyStatus === '异常' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-wine-500/20 text-wine-400 text-xs">
                              <AlertCircle size={11} /> {t.riskTag}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-carbon-700 text-carbon-300 text-xs">
                              <Clock size={11} /> 待入场
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        {t.antiFakeValid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-500/15 text-green-400 text-xs border border-green-500/30">
                            <Shield size={11} />
                            链上哈希匹配
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-wine-500/15 text-wine-400 text-xs border border-wine-500/30">
                            <AlertCircle size={11} />
                            {t.riskTag}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {approvingId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-md">
            <h3 className="font-display text-2xl text-green-400 mb-4 flex items-center gap-2">
              <CheckCircle size={24} />
              主办方资质通过
            </h3>
            <p className="text-sm text-carbon-400 mb-5">
              确认「{demoAuditOrganizers.find(o => o.id === approvingId)?.companyName}」资质核验通过？
              通过后主办方即可登录并发布演出。
            </p>
            <div className="mb-5">
              <label className="block text-sm text-carbon-300 mb-2">审核意见（可选）</label>
              <textarea
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder="例如：资质齐全，准予入驻"
                rows={3}
                className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white placeholder-carbon-500 text-sm focus:border-gold-500 outline-none resize-none"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => { setApprovingId(null); setApprovalReason('') }}
                className="flex-1 py-3 rounded-lg border border-carbon-600 text-carbon-400 hover:text-white transition"
              >
                取消
              </button>
              <button
                onClick={() => { alert('主办方审核通过'); setApprovingId(null); setApprovalReason('') }}
                className="flex-1 px-5 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white transition"
              >
                确认通过
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-md">
            <h3 className="font-display text-2xl text-wine-400 mb-4 flex items-center gap-2">
              <XCircle size={24} />
              拒绝主办方申请
            </h3>
            <p className="text-sm text-carbon-400 mb-5">
              请填写拒绝理由，将告知主办方：
            </p>
            <div className="mb-5">
              <label className="block text-sm text-carbon-300 mb-2">拒绝理由 *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="例如：营业执照副本不清晰，请重新上传"
                rows={4}
                className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white placeholder-carbon-500 text-sm focus:border-gold-500 outline-none resize-none"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => { setRejectingId(null); setRejectReason('') }}
                className="flex-1 py-3 rounded-lg border border-carbon-600 text-carbon-400 hover:text-white transition"
              >
                取消
              </button>
              <button
                onClick={() => { alert('已拒绝，理由已发送'); setRejectingId(null); setRejectReason('') }}
                disabled={!rejectReason.trim()}
                className="flex-1 px-5 py-3 rounded-lg bg-wine-700 hover:bg-wine-600 text-white transition disabled:opacity-50"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
