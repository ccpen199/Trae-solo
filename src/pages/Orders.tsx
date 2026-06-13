import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Check,
  ChevronLeft,
  CreditCard,
  Clock,
  MapPin,
  QrCode,
  RefreshCw,
  Shield,
  Zap,
  FileCheck,
  ShieldCheck,
  Ticket,
  Users,
  ChevronRight,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import useOrderStore from '@/stores/orderStore'
import useAuthStore from '@/stores/authStore'
import { apiPost } from '@/utils/api'

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'paid', label: '已支付' },
  { key: 'credit_held', label: '先看后付' },
  { key: 'refunded', label: '已退款' },
]

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待支付', color: 'text-yellow-400' },
  paid: { label: '已支付', color: 'text-green-400' },
  credit_held: { label: '先看后付', color: 'text-blue-400' },
  refunded: { label: '已退款', color: 'text-carbon-400' },
  failed: { label: '支付失败', color: 'text-wine-500' },
}

const refundCategories = [
  { key: 'schedule_change', label: '日程变更' },
  { key: 'personal', label: '个人原因' },
  { key: 'health', label: '健康原因' },
  { key: 'duplicate', label: '重复购票' },
  { key: 'other', label: '其他' },
]

const demoPreviewOrder = {
  id: 1001,
  orderNo: 'TV20260615001',
  totalAmount: 1760,
  paymentStatus: 'paid',
  paymentMethod: 'credit',
  createdAt: '2026-06-13T10:30:00',
  showtime: {
    title: '李诞脱口秀「笑场」2026特别专场',
    venue: '北展剧场',
    startTime: '2026-06-20T19:30:00',
  },
  realName: '张三',
  idCardTail: '1234',
  tickets: [
    { id: 1, zone_name: 'A区', seat_label: '3排12号', price: 880, antiFakeCode: 'FAKE-8D969EEF6ECAD3C29A3A629280E686CF', status: 'valid', blockchainTx: '0x7a2f...e3b8' },
    { id: 2, zone_name: 'A区', seat_label: '3排13号', price: 880, antiFakeCode: 'FAKE-5D8771B38B503A58DC9867ABCC359600', status: 'valid', blockchainTx: '0x9c1e...a2d4' },
  ],
}

const fulfillmentSteps = [
  { icon: Users, title: '实名认证', desc: '身份证 + 真实姓名绑定，一人一票', color: 'text-rose-400' },
  { icon: CreditCard, title: '先看后付', desc: '芝麻信用 650 分 → 观演后自动扣款', color: 'text-blue-400' },
  { icon: Shield, title: '防伪存证', desc: '每张票唯一防伪码 + 区块链存证', color: 'text-gold-500' },
  { icon: QrCode, title: '电子核验', desc: '闸机 SDK 扫码核销，秒级入场', color: 'text-amber-400' },
  { icon: RefreshCw, title: '智能退票', desc: '梯度手续费风控 + 时间窗口限制', color: 'text-purple-400' },
]

export default function Orders() {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const { orders, fetchOrders, requestRefund, loading } = useOrderStore()
  const [activeTab, setActiveTab] = useState('all')
  const [refundTicketId, setRefundTicketId] = useState<number | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundCategory, setRefundCategory] = useState('personal')
  const [previewStep, setPreviewStep] = useState(0)

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders(activeTab === 'all' ? undefined : activeTab)
    }
  }, [isLoggedIn, activeTab, fetchOrders])

  const handleRefund = async () => {
    if (!refundTicketId || !refundReason.trim()) return
    const order = orders.find((o) => o.tickets?.some((t: any) => t.id === refundTicketId))
    if (!order) return
    try {
      await requestRefund(order.id, refundTicketId, refundReason, refundCategory)
      setRefundTicketId(null)
      setRefundReason('')
      fetchOrders(activeTab === 'all' ? undefined : activeTab)
    } catch (e: any) {
      alert(e.message)
    }
  }

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
            <Link to="/login" className="wine-gradient-btn text-sm">登录查看订单</Link>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-8 max-w-5xl">
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl text-gold-400 mb-2">订单履约闭环预览</h1>
            <p className="text-carbon-400">
              登录后即可查看真实订单，先看后付 · 电子票核验 · 防伪码存证 · 智能退票一站式体验
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <Link to="/login" className="gold-gradient-btn inline-flex items-center gap-2">
                <Ticket size={18} />
                立即登录查看真实订单
              </Link>
              <Link to="/" className="px-6 py-3 rounded-lg border border-carbon-600 text-carbon-300 hover:text-white transition inline-flex items-center gap-2">
                回到首页
              </Link>
            </div>
          </div>

          <div className="glass-card p-6 mb-8">
            <h3 className="text-white font-bold mb-5 flex items-center gap-2">
              <FileCheck size={20} className="text-gold-400" />
              履约全链路流程
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {fulfillmentSteps.map((step, i) => {
                const Icon = step.icon
                const active = previewStep === i
                return (
                  <button
                    key={i}
                    onClick={() => setPreviewStep(i)}
                    className={`glass-card p-4 text-left transition-all ${
                      active ? 'border-gold-500/50 shadow-glow-gold -translate-y-1' : ''
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-carbon-800/60 flex items-center justify-center mb-3">
                      <Icon size={20} className={step.color} />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-carbon-500">STEP {i + 1}</span>
                    </div>
                    <div className="text-white font-medium text-sm mb-1">{step.title}</div>
                    <div className="text-xs text-carbon-400 leading-snug">{step.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {previewStep === 0 && (
            <div className="glass-card overflow-hidden mb-8">
              <div className="px-6 py-4 bg-carbon-800/30 flex items-center justify-between border-b border-carbon-700/50">
                <div className="flex items-center gap-3">
                  <Users size={22} className="text-rose-400" />
                  <h3 className="text-white font-bold">STEP 1 · 实名制购票 · 身份校验</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-400">已通过</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-carbon-800/30 rounded-2xl p-5 border border-carbon-700/40">
                    <div className="text-xs text-carbon-500 mb-3 flex items-center gap-1.5">
                      <FileCheck size={13} className="text-green-400" />
                      实名信息（脱敏展示）
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-carbon-400">真实姓名</span>
                        <span className="text-white text-sm">张{demoPreviewOrder.realName.charAt(1)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-carbon-400">身份证号</span>
                        <span className="text-white text-sm font-mono">110101********{demoPreviewOrder.idCardTail}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-carbon-400">手机号</span>
                        <span className="text-white text-sm">138****1234</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-carbon-400">人脸核验</span>
                        <span className="text-green-400 text-xs inline-flex items-center gap-1">
                          <ShieldCheck size={12} /> 已通过
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-carbon-800/30 rounded-2xl p-5 border border-rose-500/20">
                    <div className="text-xs text-carbon-500 mb-3 flex items-center gap-1.5">
                      <Shield size={13} className="text-rose-400" />
                      实名绑定规则
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Check size={13} className="text-green-400 mt-0.5 shrink-0" />
                        <span className="text-carbon-300 text-xs">每张票绑定唯一持票人，不可私下转让</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check size={13} className="text-green-400 mt-0.5 shrink-0" />
                        <span className="text-carbon-300 text-xs">入场时需身份证 + 人脸 + 电子票三证合一</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check size={13} className="text-green-400 mt-0.5 shrink-0" />
                        <span className="text-carbon-300 text-xs">公安身份系统联网核验，秒级完成认证</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check size={13} className="text-green-400 mt-0.5 shrink-0" />
                        <span className="text-carbon-300 text-xs">实名信息加密存储，符合《个人信息保护法》</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gold-500/5 border border-gold-500/20 rounded-xl">
                  <p className="text-xs text-gold-300 flex items-start gap-2">
                    <Sparkles size={14} className="shrink-0 mt-0.5" />
                    <span>
                      <strong>与抢票队列闭环：</strong>
                      实名验证通过后获得 1.0x 基础排队权重，
                      同时解锁芝麻信用评估和先看后付申请通道。
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {previewStep === 1 && (
            <div className="glass-card overflow-hidden mb-8">
              <div className="px-6 py-4 bg-carbon-800/30 flex items-center justify-between border-b border-carbon-700/50">
                <div className="flex items-center gap-3">
                  <CreditCard size={22} className="text-blue-400" />
                  <h3 className="text-white font-bold">STEP 2 · 先看后付 · 芝麻信用授信</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400">授信成功</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-500/10 rounded-2xl p-5 border border-blue-500/30 text-center">
                    <div className="text-xs text-blue-300 mb-2">芝麻信用分</div>
                    <div className="font-display text-4xl text-blue-400 mb-1">650</div>
                    <div className="text-[10px] text-blue-300/70">≥ 600 即可开通</div>
                  </div>
                  <div className="bg-gold-500/10 rounded-2xl p-5 border border-gold-500/30 text-center">
                    <div className="text-xs text-gold-300 mb-2">授信额度</div>
                    <div className="font-display text-4xl text-gold-500 mb-1">¥5,000</div>
                    <div className="text-[10px] text-gold-300/70">单场最高 ¥2,000</div>
                  </div>
                  <div className="bg-green-500/10 rounded-2xl p-5 border border-green-500/30 text-center">
                    <div className="text-xs text-green-300 mb-2">累计守约</div>
                    <div className="font-display text-4xl text-green-400 mb-1">12</div>
                    <div className="text-[10px] text-green-300/70">次观演自动扣款</div>
                  </div>
                </div>

                <div className="bg-carbon-800/30 rounded-2xl p-5 border border-carbon-700/40 mb-6">
                  <h4 className="text-white text-sm font-medium mb-4">先看后付扣款流程 · 状态流转</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-7 h-7 rounded-full bg-green-500/30 text-green-400 flex items-center justify-center shrink-0">
                        <Check size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">① 下单时：信用预授权</div>
                        <div className="text-xs text-carbon-400">冻结授信额度 ¥1,760，无实际扣款</div>
                      </div>
                      <span className="text-[10px] text-green-400 shrink-0">已完成</span>
                    </div>
                    <div className="ml-3.5 h-6 border-l border-dashed border-carbon-600" />
                    <div className="flex items-center gap-4">
                      <div className="w-7 h-7 rounded-full bg-green-500/30 text-green-400 flex items-center justify-center shrink-0">
                        <Check size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">② 演出当天：入场核验</div>
                        <div className="text-xs text-carbon-400">闸机扫码核销，标记已观演</div>
                      </div>
                      <span className="text-[10px] text-yellow-400 shrink-0">待观演</span>
                    </div>
                    <div className="ml-3.5 h-6 border-l border-dashed border-carbon-600" />
                    <div className="flex items-center gap-4">
                      <div className="w-7 h-7 rounded-full bg-carbon-700 text-carbon-400 flex items-center justify-center shrink-0">
                        <Clock size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">③ 演出结束后 T+1：自动扣款</div>
                        <div className="text-xs text-carbon-400">
                          预计 6月21日 10:00 从支付宝自动扣款 ¥{demoPreviewOrder.totalAmount}
                        </div>
                      </div>
                      <span className="text-[10px] text-carbon-500 shrink-0">待执行</span>
                    </div>
                    <div className="ml-3.5 h-6 border-l border-dashed border-carbon-600" />
                    <div className="flex items-center gap-4">
                      <div className="w-7 h-7 rounded-full bg-carbon-700 text-carbon-400 flex items-center justify-center shrink-0">
                        <Zap size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">④ 扣款成功：累计守约 +1</div>
                        <div className="text-xs text-carbon-400">信用分 +2，授信额度提升</div>
                      </div>
                      <span className="text-[10px] text-carbon-500 shrink-0">待完成</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gold-500/5 border border-gold-500/20 rounded-xl">
                  <p className="text-xs text-gold-300 flex items-start gap-2">
                    <Sparkles size={14} className="shrink-0 mt-0.5" />
                    <span>
                      <strong>与抢票队列闭环：</strong>
                      芝麻信用分 ≥ 600 自动获得排队优先级 +0.20x 权重加速，
                      信用分越高，排队越靠前，同时解锁先看后付支付方式。
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {previewStep === 2 && (
            <div className="glass-card overflow-hidden mb-8">
              <div className="px-6 py-4 bg-carbon-800/30 flex items-center justify-between border-b border-carbon-700/50">
                <div className="flex items-center gap-3">
                  <Shield size={22} className="text-gold-400" />
                  <h3 className="text-white font-bold">STEP 3 · 票源保真 · 防伪码 + 区块链存证</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-gold-500/20 text-gold-400">已上链</span>
              </div>
              <div className="p-6">
                <div className="text-xs text-carbon-500 mb-3">电子票 · 防伪码 + 区块链存证</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {demoPreviewOrder.tickets.map((ticket) => (
                    <div key={ticket.id} className="relative bg-gradient-to-br from-wine-900/40 to-carbon-800/60 rounded-xl p-5 border border-gold-500/20 overflow-hidden">
                      <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-carbon-950" />
                      <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-carbon-950" />
                      <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-carbon-600" />
                      <div className="flex gap-4 relative">
                        <div className="w-20 h-24 bg-white rounded flex-shrink-0 flex flex-col items-center justify-center p-2">
                          <QrCode size={48} className="text-carbon-900" />
                          <span className="text-[8px] text-carbon-600 mt-1">电子票</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-bold text-lg">{ticket.zone_name} {ticket.seat_label}</div>
                          <div className="font-display text-gold-500 text-xl mb-2">¥{ticket.price}</div>
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-1.5">
                              <ShieldCheck size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
                              <div className="text-[11px] text-carbon-300 truncate font-mono">{ticket.antiFakeCode}</div>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <Shield size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
                              <div className="text-[11px] text-blue-300 font-mono">区块链: {ticket.blockchainTx}</div>
                            </div>
                            <div className="flex items-start gap-1.5">
                              <Zap size={12} className="text-gold-400 mt-0.5 flex-shrink-0" />
                              <div className="text-[11px] text-gold-300">核验: 闸机SDK / 扫码核销</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 text-[10px] text-green-400 px-1.5 py-0.5 rounded bg-green-500/20">
                        链上有效
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-carbon-800/30 rounded-2xl p-5 border border-gold-500/20">
                    <div className="text-xs text-carbon-500 mb-3 flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-green-400" />
                      防伪码生成机制
                    </div>
                    <div className="space-y-2 text-xs text-carbon-300">
                      <p>每张票使用 <code className="text-gold-400">crypto.randomUUID()</code> 生成唯一ID，</p>
                      <p>通过 <code className="text-gold-400">SHA-256</code> 哈希运算生成 32位防伪码，</p>
                      <p>防止伪造、重复使用，与实名信息绑定。</p>
                    </div>
                  </div>
                  <div className="bg-carbon-800/30 rounded-2xl p-5 border border-blue-500/20">
                    <div className="text-xs text-carbon-500 mb-3 flex items-center gap-1.5">
                      <Shield size={13} className="text-blue-400" />
                      区块链存证证明
                    </div>
                    <div className="space-y-2 text-xs text-carbon-300">
                      <p>出票时即时写入区块链，生成存证哈希</p>
                      <p>包含：票号、座位、价格、持票人摘要</p>
                      <p>不可篡改，运营审计可随时溯源验证</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewStep === 3 && (
            <div className="glass-card overflow-hidden mb-8">
              <div className="px-6 py-4 bg-carbon-800/30 flex items-center justify-between border-b border-carbon-700/50">
                <div className="flex items-center gap-3">
                  <QrCode size={22} className="text-amber-400" />
                  <h3 className="text-white font-bold">STEP 4 · 电子票核验 · 闸机 SDK 扫码核销</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400">待入场</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                  <div className="md:col-span-1 bg-gradient-to-br from-wine-800/40 to-carbon-800/60 rounded-2xl p-6 border border-gold-500/30 text-center">
                    <div className="mx-auto w-40 h-40 bg-white rounded-xl flex items-center justify-center mb-4">
                      <QrCode size={120} className="text-carbon-900" />
                    </div>
                    <div className="text-white font-bold mb-1">请出示二维码</div>
                    <div className="text-xs text-carbon-400 mb-4">入场时向闸机扫码区出示</div>
                    <div className="text-[10px] text-carbon-500 font-mono break-all">
                      {demoPreviewOrder.tickets[0].antiFakeCode}
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-carbon-800/30 rounded-xl p-5 border border-carbon-700/40">
                      <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                        <Zap size={16} className="text-gold-400" />
                        核验方式
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-gold-500/10 border border-gold-500/20">
                          <div className="text-white text-sm mb-1">闸机 SDK 对接</div>
                          <div className="text-[11px] text-carbon-400">
                            场馆闸机预装 SDK，扫码即核验，秒级入场
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <div className="text-white text-sm mb-1">人工扫码核销</div>
                          <div className="text-[11px] text-carbon-400">
                            工作人员 APP 扫码，适用于小型剧场
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-carbon-800/30 rounded-xl p-5 border border-carbon-700/40">
                      <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-green-400" />
                        核验内容 · 三重校验
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Check size={13} className="text-green-400" />
                          <span className="text-carbon-300">① 防伪码合法性校验（与数据库/区块链匹配）</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check size={13} className="text-green-400" />
                          <span className="text-carbon-300">② 票状态校验（未使用、未退票、有效）</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check size={13} className="text-green-400" />
                          <span className="text-carbon-300">③ 场次与时间校验（仅当日当场次有效）</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewStep === 4 && (
            <div className="glass-card overflow-hidden mb-8">
              <div className="px-6 py-4 bg-carbon-800/30 flex items-center justify-between border-b border-carbon-700/50">
                <div className="flex items-center gap-3">
                  <RefreshCw size={22} className="text-purple-400" />
                  <h3 className="text-white font-bold">STEP 5 · 退换票智能风控 · 梯度手续费</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400">可申请</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-5 rounded-xl bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-green-400" />
                      <span className="text-white font-medium">演出前 ≥ 48 小时</span>
                    </div>
                    <div className="text-green-400 font-display text-2xl mb-1">全额退款</div>
                    <div className="text-xs text-carbon-400">手续费 0%，原路返回</div>
                    <div className="mt-3 text-[10px] text-green-300/70">
                      例如：6月18日 19:30 前申请，退 ¥1,760
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-gold-500/10 border border-gold-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-gold-400" />
                      <span className="text-white font-medium">演出前 24-48 小时</span>
                    </div>
                    <div className="text-gold-400 font-display text-2xl mb-1">扣除 20%</div>
                    <div className="text-xs text-carbon-400">阶梯手续费风控</div>
                    <div className="mt-3 text-[10px] text-gold-300/70">
                      例如：退款 ¥1,408，手续费 ¥352
                    </div>
                  </div>
                  <div className="p-5 rounded-xl bg-wine-500/10 border border-wine-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-wine-400" />
                      <span className="text-white font-medium">演出前 &lt; 24 小时</span>
                    </div>
                    <div className="text-wine-400 font-display text-2xl mb-1">不可退票</div>
                    <div className="text-xs text-carbon-400">时间窗口限制</div>
                    <div className="mt-3 text-[10px] text-wine-300/70">
                      已过窗口期，仅支持特殊情况审核
                    </div>
                  </div>
                </div>

                <div className="bg-carbon-800/30 rounded-2xl p-5 border border-carbon-700/40 mb-6">
                  <h4 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-wine-400" />
                    风控规则 · 防黄牛策略
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-gold-400 mt-0.5 shrink-0" />
                      <span className="text-carbon-300">单账号单场次限购 4 张</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-gold-400 mt-0.5 shrink-0" />
                      <span className="text-carbon-300">退票后 7 天内不可购买同场次</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-gold-400 mt-0.5 shrink-0" />
                      <span className="text-carbon-300">频繁退票账号进入风控名单</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check size={13} className="text-gold-400 mt-0.5 shrink-0" />
                      <span className="text-carbon-300">实名绑定，杜绝炒票倒票</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gold-500/5 border border-gold-500/20 rounded-xl">
                  <p className="text-xs text-gold-300 flex items-start gap-2">
                    <Sparkles size={14} className="shrink-0 mt-0.5" />
                    <span>
                      <strong>与运营分析闭环：</strong>
                      所有退票自动聚类为 5 大原因（日程变更/个人原因/健康原因/重复购票/其他），
                      上报运营大屏进行趋势分析，优化上座率预测。
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <Link to="/login" className="gold-gradient-btn inline-flex items-center gap-2 text-lg">
              <Ticket size={20} />
              登录后查看真实订单与完整履约体验
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
          <span className="text-gold-400 text-sm">{user?.realName}</span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="font-display text-3xl text-gold-400">我的订单</h1>
          <div className="flex items-center gap-2 text-sm text-carbon-400">
            <Users size={16} className="text-rose-400" />
            <span>实名用户 · {user?.realName}</span>
            {(user?.creditScore ?? 0) >= 600 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs inline-flex items-center gap-1">
                <Zap size={12} />
                先看后付已开通（信用分 {user?.creditScore}）
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                activeTab === tab.key
                  ? 'bg-wine-700 text-white font-medium'
                  : 'bg-carbon-800/50 text-carbon-400 hover:text-white hover:bg-carbon-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-carbon-400 py-12">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Ticket size={48} className="mx-auto text-carbon-600 mb-4" />
            <p className="text-carbon-500 mb-6">暂无订单记录</p>
            <Link to="/" className="wine-gradient-btn">去看看演出</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <div key={order.id} className="glass-card overflow-hidden">
                <div className="px-6 py-4 bg-carbon-800/30 flex items-center justify-between border-b border-carbon-700/50 flex-wrap gap-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-carbon-400 text-sm">订单号: {order.orderNo}</span>
                    <span className={`text-sm font-medium ${statusLabels[order.paymentStatus]?.color || 'text-white'}`}>
                      {statusLabels[order.paymentStatus]?.label || order.paymentStatus}
                    </span>
                    {order.paymentMethod === 'credit' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 inline-flex items-center gap-1">
                        <CreditCard size={12} />
                        先看后付 · 观演后自动扣款
                      </span>
                    )}
                  </div>
                  <div className="font-display text-2xl text-gold-500">¥{order.totalAmount}</div>
                </div>

                {order.showtime && (
                  <div className="px-6 py-3 border-b border-carbon-700/30 flex flex-wrap items-center gap-4 text-sm">
                    <div className="text-white font-medium">{order.showtime.title}</div>
                    <div className="flex items-center gap-1 text-carbon-400">
                      <MapPin size={14} />
                      {order.showtime.venue}
                    </div>
                    <div className="flex items-center gap-1 text-carbon-400">
                      <Clock size={14} />
                      {new Date(order.showtime.startTime).toLocaleString('zh-CN')}
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className="text-xs text-carbon-500 mb-3">电子票 · 防伪码 + 区块链存证</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.tickets?.map((ticket: any) => {
                      const statusInfo =
                        ticket.status === 'valid' ? (
                          <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">有效</span>
                        ) : ticket.status === 'used' ? (
                          <span className="text-xs px-2 py-1 rounded bg-carbon-600 text-carbon-300">已使用</span>
                        ) : ticket.status === 'refunded' ? (
                          <span className="text-xs px-2 py-1 rounded bg-wine-500/20 text-wine-400">已退票</span>
                        ) : null
                      const zoneName = ticket.zone_name || ticket.zoneName || 'A区'
                      const seatLabel = ticket.seat_label || ticket.seatLabel || '3排12号'
                      const antiFake = ticket.anti_fake_code || ticket.antiFakeCode || 'FAKE-' + ticket.id
                      return (
                        <div
                          key={ticket.id}
                          className="relative bg-gradient-to-br from-wine-900/40 to-carbon-800/60 rounded-xl p-5 border border-gold-500/20 overflow-hidden"
                        >
                          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-carbon-950" />
                          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-carbon-950" />
                          <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-carbon-600" />
                          <div className="flex gap-4 relative">
                            <div className="w-20 h-24 bg-white rounded flex-shrink-0 flex flex-col items-center justify-center p-2">
                              <QrCode size={48} className="text-carbon-900" />
                              <span className="text-[8px] text-carbon-600 mt-1">电子票</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-bold text-lg">{zoneName} {seatLabel}</div>
                              <div className="font-display text-gold-500 text-xl mb-2">¥{ticket.price}</div>
                              <div className="space-y-1.5">
                                <div className="flex items-start gap-1.5">
                                  <ShieldCheck size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
                                  <div className="text-[11px] text-carbon-300 truncate">防伪码: {antiFake}</div>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <Shield size={12} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                  <div className="text-[11px] text-blue-300">区块链存证: 0x...8a3f</div>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <Zap size={12} className="text-gold-400 mt-0.5 flex-shrink-0" />
                                  <div className="text-[11px] text-gold-300">核验: 闸机SDK / 扫码核销</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between absolute bottom-2 right-2 left-2">
                            {statusInfo}
                            {ticket.status === 'valid' && order.paymentStatus !== 'refunded' && (
                              <div className="flex gap-2">
                                <Link
                                  to={`/ticket/${ticket.id}`}
                                  className="text-xs px-3 py-1.5 rounded-lg bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 transition inline-flex items-center gap-1"
                                >
                                  <QrCode size={12} />
                                  电子票
                                </Link>
                                <button
                                  onClick={() => setRefundTicketId(ticket.id)}
                                  className="text-xs px-3 py-1.5 rounded-lg border border-wine-700/50 text-wine-400 hover:bg-wine-800/30 transition inline-flex items-center gap-1"
                                >
                                  <RefreshCw size={12} />
                                  退票
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="px-6 py-3 bg-carbon-800/20 border-t border-carbon-700/30 text-xs text-carbon-500 flex flex-wrap items-center gap-4">
                  <RefreshCw size={14} />
                  <span>下单时间: {new Date(order.createdAt).toLocaleString('zh-CN')}</span>
                  {order.paymentMethod === 'credit' && (
                    <span className="text-blue-400 inline-flex items-center gap-1">
                      <CreditCard size={12} />
                      先看后付 · 观演完成自动扣款
                    </span>
                  )}
                  <Link to="/" className="ml-auto text-gold-400 hover:text-gold-300 inline-flex items-center gap-0.5">
                    继续购票 <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {refundTicketId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-md">
            <h3 className="font-display text-2xl text-gold-400 mb-6">申请退票</h3>
            <div className="mb-6">
              <label className="block text-sm text-carbon-300 mb-2">退票原因</label>
              <select
                value={refundCategory}
                onChange={(e) => setRefundCategory(e.target.value)}
                className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none"
              >
                {refundCategories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm text-carbon-300 mb-2">详细说明</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="请详细说明退票原因..."
                rows={4}
                className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white placeholder-carbon-500 focus:border-gold-500 outline-none resize-none"
              />
            </div>
            <div className="bg-carbon-800/30 rounded-lg p-4 mb-6 text-sm">
              <div className="text-carbon-400 mb-2">退款规则（智能风控）</div>
              <div className="flex justify-between text-white mb-1">
                <span>演出前 48 小时以上</span>
                <span className="text-green-400">全额退款</span>
              </div>
              <div className="flex justify-between text-white mb-1">
                <span>演出前 24-48 小时</span>
                <span className="text-gold-400">收取 20% 手续费</span>
              </div>
              <div className="flex justify-between text-wine-400">
                <span>演出前 24 小时内</span>
                <span>不可退票</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setRefundTicketId(null)}
                className="flex-1 py-3 rounded-lg border border-carbon-600 text-carbon-400 hover:text-white transition"
              >
                取消
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundReason.trim()}
                className="flex-1 wine-gradient-btn disabled:opacity-50"
              >
                确认退票
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
