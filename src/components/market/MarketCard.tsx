import { useState, useCallback } from 'react'
import {
  MapPin, Calendar, Tag, Package, ChevronDown, ChevronUp,
  Shield, Award, BarChart3, Truck, Lock, Star, TrendingUp,
  ChevronRight, Building2, CheckCircle, Eye,
  Factory, Users, Play, FileText, AlertTriangle,
} from 'lucide-react'
import { useStore } from '@/store'
import type { ProcurementRequest, ProcessingOrder, AccessorySupply, Supplier, SampleLogisticsNode } from '@/store'
import InquiryWizard from '@/components/supplier/InquiryWizard'

const statusLabels: Record<string, string> = {
  open: '进行中',
  matched: '已匹配',
  closed: '已关闭',
  in_progress: '生产中',
  completed: '已完成',
}

const statusColors: Record<string, string> = {
  open: 'bg-blue-50 text-blue-600',
  matched: 'bg-amber-50 text-amber-600',
  closed: 'bg-navy-100 text-navy-400',
  in_progress: 'bg-amber-50 text-amber-600',
  completed: 'bg-teal-50 text-teal-600',
}

const sampleStatusLabels: Record<string, string> = {
  none: '未寄送',
  requested: '已申请',
  shipped: '已寄送',
  received: '已收样',
}

const sampleStatusColors: Record<string, string> = {
  none: 'bg-gray-100 text-gray-500',
  requested: 'bg-blue-50 text-blue-600',
  shipped: 'bg-amber-50 text-amber-600',
  received: 'bg-teal-50 text-teal-600',
}

const depositStatusLabels: Record<string, string> = {
  none: '未支付',
  pending: '待确认',
  paid: '已担保',
}

const depositStatusColors: Record<string, string> = {
  none: 'bg-gray-100 text-gray-500',
  pending: 'bg-amber-50 text-amber-600',
  paid: 'bg-teal-50 text-teal-600',
}

const inspectionTypeLabels: Record<string, string> = {
  video: '视频直播',
  vr: 'VR实景',
  onsite: '实地',
}

const processingStages = ['接单', '排产', '生产', '质检', '发货', '交付']
const accessoryStages = ['发货', '运输', '收货', '结款']

function CertTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-teal-50 text-teal-700 text-[10px] rounded font-medium">
      <Award size={10} />
      {label}
    </span>
  )
}

function CapacityBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-[10px] text-navy-500">
      <BarChart3 size={10} className="shrink-0" />
      <div className="flex-1 h-1.5 bg-navy-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0">{current.toLocaleString()}/{max.toLocaleString()}</span>
    </div>
  )
}

function StarRating({ score }: { score: number }) {
  const full = Math.round(score / 20)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={10}
          className={i < full ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
        />
      ))}
      <span className="text-[10px] text-navy-400 ml-1">{score}</span>
    </div>
  )
}

function StockBar({ stock, minOrder }: { stock: number; minOrder: number }) {
  const pct = minOrder > 0 ? Math.min(Math.round((stock / minOrder) * 100), 100) : 100
  const level = stock >= minOrder * 3 ? '充足' : stock >= minOrder ? '紧张' : '缺货'
  const color = stock >= minOrder * 3 ? 'bg-teal-400' : stock >= minOrder ? 'bg-amber-400' : 'bg-red-400'
  const labelColor = stock >= minOrder * 3 ? 'text-teal-600' : stock >= minOrder ? 'text-amber-600' : 'text-red-600'
  return (
    <div className="flex items-center gap-2 text-[10px] text-navy-500">
      <Package size={10} className="shrink-0" />
      <div className="flex-1 h-1.5 bg-navy-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`shrink-0 font-medium ${labelColor}`}>{level}</span>
      <span className="shrink-0">{stock.toLocaleString()}/{minOrder.toLocaleString()}</span>
    </div>
  )
}

function LogisticsTimeline({ nodes }: { nodes: SampleLogisticsNode[] }) {
  if (nodes.length === 0) return null
  return (
    <div className="mt-2 pl-1">
      <p className="text-[10px] font-medium text-navy-500 mb-1.5">物流追踪</p>
      <div className="space-y-0">
        {nodes.map((n, i) => (
          <div key={i} className="flex gap-2.5">
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full shrink-0 ${i === nodes.length - 1 ? 'bg-amber-500' : 'bg-teal-500'}`} />
              {i < nodes.length - 1 && <div className="w-px h-5 bg-gray-200" />}
            </div>
            <div className="pb-2 min-w-0">
              <p className={`text-[10px] font-medium ${i === nodes.length - 1 ? 'text-amber-600' : 'text-navy-600'}`}>{n.status}</p>
              <p className="text-[9px] text-navy-400">{n.location}</p>
              <p className="text-[9px] text-navy-300">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StageProgress({ stages, currentIdx }: { stages: string[]; currentIdx: number }) {
  return (
    <div className="flex items-center gap-0 w-full">
      {stages.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full shrink-0 flex items-center justify-center ${
                i < currentIdx ? 'bg-teal-500' : i === currentIdx ? 'bg-amber-500' : 'bg-gray-200'
              }`}
            >
              {i < currentIdx && <CheckCircle size={8} className="text-white" />}
            </div>
            <span className={`text-[8px] mt-0.5 whitespace-nowrap ${
              i < currentIdx ? 'text-teal-600' : i === currentIdx ? 'text-amber-600 font-medium' : 'text-gray-400'
            }`}>{s}</span>
          </div>
          {i < stages.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-3 ${i < currentIdx ? 'bg-teal-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function useToast() {
  const [toastMsg, setToastMsg] = useState('')
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }, [])
  return { toastMsg, showToast }
}

function ToastDisplay({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 bg-navy-800 text-white text-sm rounded-lg shadow-lg animate-fade-in">
      {msg}
    </div>
  )
}

interface DetailPanelProps {
  supplier: Supplier
  budgetMax?: number
  onInquiry: (id: string, name: string) => void
  showToast: (msg: string) => void
}

function DetailPanel({ supplier, budgetMax = 0, onInquiry, showToast }: DetailPanelProps) {
  const { updateSupplierSampleStatus, updateSupplierDepositStatus, addInquiry } = useStore()
  const [logistics, setLogistics] = useState<SampleLogisticsNode[]>([])
  const [inspectionOpen, setInspectionOpen] = useState(false)
  const [inspectionType, setInspectionType] = useState<'video' | 'vr' | 'onsite'>('video')
  const [inspectionDate, setInspectionDate] = useState('')
  const [inspectionScheduled, setInspectionScheduled] = useState(false)
  const [inspectionDone, setInspectionDone] = useState(false)
  const [depositGuaranteeNo, setDepositGuaranteeNo] = useState('')
  const [depositPaidTime, setDepositPaidTime] = useState('')

  const now = () => new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  const nextDay = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const sampleStatus = supplier.sampleShippingStatus ?? 'none'

  const handleSampleClick = () => {
    const flow: Supplier['sampleShippingStatus'][] = ['none', 'requested', 'shipped', 'received']
    const idx = flow.indexOf(sampleStatus)
    const next = flow[Math.min(idx + 1, flow.length - 1)]
    updateSupplierSampleStatus(supplier.id, next)

    if (next === 'requested') {
      const node: SampleLogisticsNode = { status: '样品已申请寄送', location: '当前位置', time: now() }
      setLogistics([node])
      addInquiry({
        fromUserId: 'u1',
        toSupplierId: supplier.id,
        toSupplierName: supplier.name,
        type: 'procurement',
        title: `样品寄送申请 - ${supplier.name}`,
        content: '申请寄送样品',
        quantity: 1,
        budget: { min: 0, max: 0 },
        deliveryDate: '',
      })
      showToast('样品寄送已申请，询价单已创建')
    } else if (next === 'shipped') {
      setLogistics((prev) => [
        ...prev,
        { status: '样品已寄出', location: `${supplier.location}供应商仓库`, time: now() },
        { status: '运输中', location: '中转站', time: nextDay() },
      ])
      showToast('样品已寄出')
    } else if (next === 'received') {
      setLogistics((prev) => [
        ...prev,
        { status: '已签收', location: '买家仓库', time: now() },
      ])
      showToast('样品已签收，样品流程完成')
    }
  }

  const depositStatus = supplier.depositStatus ?? 'none'
  const depositAmount = budgetMax > 0 ? Math.round(budgetMax * 0.2) : 0

  const handleDepositClick = () => {
    const flow: Supplier['depositStatus'][] = ['none', 'pending', 'paid']
    const idx = flow.indexOf(depositStatus)
    const next = flow[Math.min(idx + 1, flow.length - 1)]
    updateSupplierDepositStatus(supplier.id, next)

    if (next === 'pending') {
      showToast(`定金待确认，金额 ¥${depositAmount.toLocaleString()}，平台担保`)
    } else if (next === 'paid') {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const gNo = `GUA-${dateStr}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`
      setDepositGuaranteeNo(gNo)
      setDepositPaidTime(now())
      showToast(`定金已支付 ¥${depositAmount.toLocaleString()}，担保编号 ${gNo}`)
    }
  }

  const handleInspectionConfirm = () => {
    if (!inspectionDate) return
    setInspectionScheduled(true)
    showToast(`验厂已预约：${inspectionTypeLabels[inspectionType]} - ${inspectionDate}`)
  }

  const handleInspectionReport = () => {
    setInspectionDone(true)
    showToast('验厂报告已生成')
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      <div>
        <p className="text-[11px] font-medium text-navy-600 mb-1.5">资质认证</p>
        <div className="flex flex-wrap gap-1">
          {supplier.certifications.length > 0 ? (
            supplier.certifications.map((c) => <CertTag key={c} label={c} />)
          ) : (
            <span className="text-[10px] text-navy-300">暂无认证</span>
          )}
        </div>
      </div>

      {supplier.type === 'factory' && supplier.capacity.max > 0 && (
        <div>
          <p className="text-[11px] font-medium text-navy-600 mb-1.5">产能档期</p>
          <CapacityBar current={supplier.capacity.current} max={supplier.capacity.max} />
          <p className="text-[10px] text-navy-400 mt-0.5">可用产能 {supplier.capacity.available.toLocaleString()}</p>
        </div>
      )}

      {supplier.historicalPrices && supplier.historicalPrices.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-navy-600 mb-1.5">历史成交价</p>
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-navy-400">
                <th className="text-left font-medium pb-1">品类</th>
                <th className="text-right font-medium pb-1">均价</th>
                <th className="text-right font-medium pb-1">最近成交</th>
              </tr>
            </thead>
            <tbody>
              {supplier.historicalPrices.map((h, i) => (
                <tr key={i} className="text-navy-600">
                  <td className="py-0.5">{h.category}</td>
                  <td className="py-0.5 text-right">¥{h.avgPrice}</td>
                  <td className="py-0.5 text-right">{h.lastDealDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <p className="text-[11px] font-medium text-navy-600 mb-1.5">样品寄送</p>
        <button
          onClick={handleSampleClick}
          disabled={sampleStatus === 'received'}
          className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Truck size={11} />
          {sampleStatusLabels[sampleStatus]}
          {sampleStatus !== 'received' && <ChevronRight size={10} className="ml-0.5" />}
        </button>
        <LogisticsTimeline nodes={logistics} />
      </div>

      <div>
        <p className="text-[11px] font-medium text-navy-600 mb-1.5">定金担保</p>
        <button
          onClick={handleDepositClick}
          disabled={depositStatus === 'paid'}
          className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Lock size={11} />
          {depositStatusLabels[depositStatus]}
          {depositStatus !== 'paid' && <ChevronRight size={10} className="ml-0.5" />}
        </button>
        {depositStatus !== 'none' && (
          <div className="mt-1.5 p-2 bg-gray-50 rounded text-[10px] space-y-1">
            <div className="flex justify-between text-navy-500">
              <span>定金金额</span>
              <span className="font-medium text-navy-700">¥{depositAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-navy-500">
              <span>担保方式</span>
              <span className="text-navy-700">平台担保</span>
            </div>
            {depositStatus === 'pending' && (
              <div className="flex justify-between text-navy-500">
                <span>状态</span>
                <span className="text-amber-600 font-medium">定金待确认</span>
              </div>
            )}
            {depositStatus === 'paid' && depositGuaranteeNo && (
              <>
                <div className="flex justify-between text-navy-500">
                  <span>支付时间</span>
                  <span className="text-navy-700">{depositPaidTime}</span>
                </div>
                <div className="flex justify-between text-navy-500">
                  <span>担保编号</span>
                  <span className="text-teal-600 font-medium">{depositGuaranteeNo}</span>
                </div>
                <div className="flex justify-between text-navy-500">
                  <span>订单关联</span>
                  <span className="text-teal-600">已关联</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div>
        <p className="text-[11px] font-medium text-navy-600 mb-1.5">在线验厂</p>
        {!inspectionOpen && !inspectionScheduled ? (
          <button
            onClick={() => setInspectionOpen(true)}
            className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Building2 size={11} />
            预约验厂
          </button>
        ) : inspectionOpen && !inspectionScheduled ? (
          <div className="p-2 bg-blue-50 rounded space-y-2">
            <div>
              <label className="block text-[10px] text-navy-500 mb-1">验厂类型</label>
              <div className="flex gap-1">
                {(['video', 'vr', 'onsite'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setInspectionType(t)}
                    className={`flex-1 py-1 text-[10px] rounded border transition-colors ${
                      inspectionType === t
                        ? 'bg-blue-100 border-blue-400 text-blue-700 font-medium'
                        : 'bg-white border-gray-200 text-navy-500'
                    }`}
                  >
                    {inspectionTypeLabels[t]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-navy-500 mb-1">预约时间</label>
              <input
                type="datetime-local"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full px-2 py-1 border border-gray-200 rounded text-[10px] focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleInspectionConfirm}
                disabled={!inspectionDate}
                className="flex-1 py-1 text-[10px] font-medium rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                确认预约
              </button>
              <button
                onClick={() => setInspectionOpen(false)}
                className="flex-1 py-1 text-[10px] rounded border border-gray-200 text-navy-500"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="p-2 bg-teal-50 rounded text-[10px] space-y-1">
            <div className="flex justify-between text-navy-500">
              <span>预约时间</span>
              <span className="text-navy-700">{inspectionDate}</span>
            </div>
            <div className="flex justify-between text-navy-500">
              <span>验厂类型</span>
              <span className="text-navy-700">{inspectionTypeLabels[inspectionType]}</span>
            </div>
            <div className="flex justify-between text-navy-500">
              <span>状态</span>
              <span className={inspectionDone ? 'text-teal-600 font-medium' : 'text-amber-600 font-medium'}>
                {inspectionDone ? '已完成' : '待进行'}
              </span>
            </div>
            {!inspectionDone ? (
              <button
                onClick={handleInspectionReport}
                className="w-full mt-1 py-1 text-[10px] font-medium rounded bg-teal-500 text-white hover:bg-teal-600"
              >
                查验收厂报告
              </button>
            ) : (
              <button className="w-full mt-1 py-1 text-[10px] rounded bg-teal-100 text-teal-700 font-medium">
                <Eye size={10} className="inline mr-1" />
                验厂报告已生成
              </button>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => onInquiry(supplier.id, supplier.name)}
        className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded border border-navy-200 text-navy-600 bg-navy-50 hover:bg-navy-100 transition-colors"
      >
        <FileText size={11} />
        发起询价
      </button>
    </div>
  )
}

interface MarketCardProps {
  item: ProcurementRequest | ProcessingOrder | AccessorySupply
  borderColor: string
}

function ProcurementCard({ item, borderColor }: MarketCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string }>({ id: '', name: '' })
  const { suppliers } = useStore()
  const { toastMsg, showToast } = useToast()
  const p = item as ProcurementRequest
  const matchedSuppliers = suppliers.filter(
    (s) => s.type === 'factory' && p.craftType.some((c) => s.crafts.includes(c))
  )

  const handleInquiry = (id: string, name: string) => {
    setSelectedSupplier({ id, name })
    setInquiryOpen(true)
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${borderColor} p-4 card-hover cursor-pointer`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-navy-700">{p.title}</h3>
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ml-2 ${statusColors[p.status]}`}>
          {statusLabels[p.status]}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-navy-400 mb-2">
        <span className="flex items-center gap-1"><Tag size={12} />{p.category}</span>
        <span className="flex items-center gap-1"><MapPin size={12} />{p.location}</span>
        <span className="flex items-center gap-1"><Calendar size={12} />{p.deliveryDate}</span>
      </div>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="flex items-center gap-1 text-navy-500"><Package size={12} />{p.quantity.toLocaleString()}{p.unit}</span>
        <span className="text-amber-600 font-medium">¥{p.budget.min}-{p.budget.max}/{p.unit}</span>
      </div>

      {matchedSuppliers.length > 0 && (
        <div className="space-y-1.5">
          {matchedSuppliers.slice(0, 2).map((s) => (
            <div key={s.id} className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-navy-400 font-medium">{s.name}</span>
              {s.certifications.map((c) => <CertTag key={c} label={c} />)}
              {s.capacity.max > 0 && (
                <CapacityBar current={s.capacity.current} max={s.capacity.max} />
              )}
              {s.historicalPrices && s.historicalPrices.length > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600">
                  <TrendingUp size={9} />
                  均价¥{s.historicalPrices[0].avgPrice}
                </span>
              )}
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${sampleStatusColors[s.sampleShippingStatus ?? 'none']}`}>
                <Truck size={8} className="inline mr-0.5" />
                {sampleStatusLabels[s.sampleShippingStatus ?? 'none']}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${depositStatusColors[s.depositStatus ?? 'none']}`}>
                <Shield size={8} className="inline mr-0.5" />
                {depositStatusLabels[s.depositStatus ?? 'none']}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 flex items-center gap-1 text-[10px] text-navy-400 hover:text-navy-600 transition-colors"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? '收起详情' : '展开详情'}
      </button>

      {expanded && matchedSuppliers.length > 0 && matchedSuppliers.map((s) => (
        <DetailPanel key={s.id} supplier={s} budgetMax={p.budget.max} onInquiry={handleInquiry} showToast={showToast} />
      ))}
      {expanded && matchedSuppliers.length === 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-navy-300">暂无匹配供应商</p>
        </div>
      )}

      <InquiryWizard
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        supplierId={selectedSupplier.id}
        supplierName={selectedSupplier.name}
      />
      <ToastDisplay msg={toastMsg} />
    </div>
  )
}

function ProcessingCard({ item, borderColor }: MarketCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [capacityExpanded, setCapacityExpanded] = useState(false)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string }>({ id: '', name: '' })
  const [orderStage, setOrderStage] = useState(0)
  const { suppliers, addInquiry } = useStore()
  const { toastMsg, showToast } = useToast()
  const p = item as ProcessingOrder
  const matchedSuppliers = suppliers.filter(
    (s) => s.type === 'factory' && p.craftType.some((c) => s.crafts.includes(c))
  )

  const getQuote = (s: Supplier) => {
    if (s.historicalPrices && s.historicalPrices.length > 0) {
      return Math.round(s.historicalPrices[0].avgPrice * p.quantity * 0.01)
    }
    return Math.round(((p.budget.min + p.budget.max) / 2) * p.quantity)
  }

  const getAvailableDays = (s: Supplier) => {
    if (s.capacity.available >= p.quantity) return 3
    if (s.capacity.available >= p.quantity * 0.5) return 7
    return 14
  }

  const handleAcceptQuote = (s: Supplier) => {
    addInquiry({
      fromUserId: 'u1',
      toSupplierId: s.id,
      toSupplierName: s.name,
      type: 'processing',
      title: `接受报价 - ${s.name} - ${p.title}`,
      content: `接受${s.name}的加工报价`,
      quantity: p.quantity,
      budget: p.budget,
      deliveryDate: p.deadline,
    })
    setOrderStage(1)
    showToast(`已接受报价，询价单已创建 - ${s.name}`)
  }

  const handleInquiry = (id: string, name: string) => {
    setSelectedSupplier({ id, name })
    setInquiryOpen(true)
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${borderColor} p-4 card-hover cursor-pointer`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-navy-700">{p.title}</h3>
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium shrink-0 ml-2 ${statusColors[p.status]}`}>
          {statusLabels[p.status]}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-navy-400 mb-2">
        <span className="flex items-center gap-1"><Tag size={12} />{p.factoryType}</span>
        <span className="flex items-center gap-1"><MapPin size={12} />{p.location}</span>
        <span className="flex items-center gap-1"><Calendar size={12} />{p.deadline}</span>
      </div>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="flex items-center gap-1 text-navy-500"><Package size={12} />{p.quantity.toLocaleString()}件</span>
        <span className="text-amber-600 font-medium">¥{p.budget.min}-{p.budget.max}/件</span>
      </div>

      <div>
        <p className="text-[11px] font-medium text-navy-600 mb-1.5 flex items-center gap-1">
          <Factory size={11} />
          匹配工厂供应商
        </p>
        <div className="space-y-2">
          {matchedSuppliers.map((s) => (
            <div key={s.id} className="p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-navy-700">{s.name}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.isOnline ? 'bg-teal-500' : 'bg-gray-300'}`} />
                  <StarRating score={s.creditScore} />
                </div>
              </div>
              <CapacityBar current={s.capacity.current} max={s.capacity.max} />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-teal-600">
                  可用{s.capacity.available.toLocaleString()}件，预计{getAvailableDays(s)}天可排产
                </span>
                <span className="text-[10px] text-amber-600 font-medium">
                  报价 ¥{getQuote(s).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => handleAcceptQuote(s)}
                className="mt-1.5 w-full py-1 text-[10px] font-medium rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                接受报价
              </button>
            </div>
          ))}
          {matchedSuppliers.length === 0 && (
            <p className="text-[10px] text-navy-300">暂无匹配工厂</p>
          )}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-[11px] font-medium text-navy-600 mb-1.5 flex items-center gap-1">
          <Play size={11} />
          履约状态
        </p>
        <StageProgress stages={processingStages} currentIdx={orderStage} />
      </div>

      <button
        onClick={() => setCapacityExpanded(!capacityExpanded)}
        className="mt-2 flex items-center gap-1 text-[10px] text-navy-400 hover:text-navy-600 transition-colors"
      >
        {capacityExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {capacityExpanded ? '收起产能面板' : '展开产能面板'}
      </button>

      {capacityExpanded && matchedSuppliers.length > 0 && (
        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-[10px]">
            <thead className="bg-gray-50">
              <tr className="text-navy-500">
                <th className="px-2 py-1.5 text-left font-medium">工厂名</th>
                <th className="px-2 py-1.5 text-right font-medium">总产能</th>
                <th className="px-2 py-1.5 text-right font-medium">已用</th>
                <th className="px-2 py-1.5 text-right font-medium">可用</th>
                <th className="px-2 py-1.5 text-right font-medium">排产周期</th>
              </tr>
            </thead>
            <tbody>
              {matchedSuppliers.map((s) => (
                <tr key={s.id} className="border-t border-gray-100 text-navy-600">
                  <td className="px-2 py-1.5">{s.name}</td>
                  <td className="px-2 py-1.5 text-right">{s.capacity.max.toLocaleString()}</td>
                  <td className="px-2 py-1.5 text-right">{s.capacity.current.toLocaleString()}</td>
                  <td className="px-2 py-1.5 text-right text-teal-600">{s.capacity.available.toLocaleString()}</td>
                  <td className="px-2 py-1.5 text-right">{getAvailableDays(s)}天</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 flex items-center gap-1 text-[10px] text-navy-400 hover:text-navy-600 transition-colors"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? '收起详情' : '展开详情'}
      </button>

      {expanded && matchedSuppliers.length > 0 && matchedSuppliers.map((s) => (
        <DetailPanel key={s.id} supplier={s} budgetMax={p.budget.max} onInquiry={handleInquiry} showToast={showToast} />
      ))}
      {expanded && matchedSuppliers.length === 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-navy-300">暂无匹配供应商</p>
        </div>
      )}

      <InquiryWizard
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        supplierId={selectedSupplier.id}
        supplierName={selectedSupplier.name}
      />
      <ToastDisplay msg={toastMsg} />
    </div>
  )
}

function AccessoryCard({ item, borderColor }: MarketCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string }>({ id: '', name: '' })
  const [accessoryStage] = useState(0)
  const [inputQty, setInputQty] = useState('')
  const { suppliers, accessories } = useStore()
  const { toastMsg, showToast } = useToast()
  const a = item as AccessorySupply
  const supplier = suppliers.find((s) => s.id === a.supplierId)

  const sameCategoryAccessories = accessories.filter(
    (acc) => acc.category === a.category && acc.id !== a.id
  )
  const comparisonSuppliers = sameCategoryAccessories.map((acc) => {
    const sup = suppliers.find((s) => s.id === acc.supplierId)
    return { accessory: acc, supplier: sup }
  }).filter((c) => c.supplier)

  const minOrderNotMet = inputQty && Number(inputQty) < a.minOrder

  const handleInquiry = (id: string, name: string) => {
    setSelectedSupplier({ id, name })
    setInquiryOpen(true)
  }

  const handleBatchInquiry = () => {
    if (supplier) {
      setSelectedSupplier({ id: supplier.id, name: supplier.name })
      setInquiryOpen(true)
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${borderColor} p-4 card-hover cursor-pointer`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-navy-700">{a.name}</h3>
      </div>
      <div className="flex items-center gap-3 text-xs text-navy-400 mb-2">
        <span className="flex items-center gap-1"><Tag size={12} />{a.category}</span>
        <span className="flex items-center gap-1"><MapPin size={12} />{a.location}</span>
      </div>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-navy-500">库存 {a.stock.toLocaleString()}{a.unit}</span>
        <span className="text-amber-600 font-medium">¥{a.price}/{a.unit}</span>
      </div>

      <div className="mb-2">
        <StockBar stock={a.stock} minOrder={a.minOrder} />
      </div>

      <div className="mb-2">
        <label className="block text-[10px] text-navy-500 mb-1">采购数量</label>
        <input
          type="number"
          value={inputQty}
          onChange={(e) => setInputQty(e.target.value)}
          placeholder={`最小起订量 ${a.minOrder.toLocaleString()}`}
          className="w-full px-2 py-1 border border-gray-200 rounded text-[10px] focus:outline-none focus:border-amber-400"
        />
        {minOrderNotMet && (
          <p className="mt-0.5 text-[9px] text-red-500 flex items-center gap-0.5">
            <AlertTriangle size={9} />
            未达最小起订量（{a.minOrder.toLocaleString()}{a.unit}）
          </p>
        )}
      </div>

      {supplier && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-navy-400 font-medium">{supplier.name}</span>
          <StarRating score={supplier.creditScore} />
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${sampleStatusColors[supplier.sampleShippingStatus ?? 'none']}`}>
            <Truck size={8} className="inline mr-0.5" />
            {sampleStatusLabels[supplier.sampleShippingStatus ?? 'none']}
          </span>
        </div>
      )}

      {comparisonSuppliers.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] font-medium text-navy-600 mb-1.5 flex items-center gap-1">
            <Users size={11} />
            同类辅料报价对比
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-[10px]">
              <thead className="bg-gray-50">
                <tr className="text-navy-500">
                  <th className="px-2 py-1.5 text-left font-medium">供应商</th>
                  <th className="px-2 py-1.5 text-left font-medium">辅料</th>
                  <th className="px-2 py-1.5 text-right font-medium">单价</th>
                  <th className="px-2 py-1.5 text-right font-medium">库存</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-100 text-navy-600 bg-amber-50/50">
                  <td className="px-2 py-1.5">{supplier?.name}</td>
                  <td className="px-2 py-1.5">{a.name}</td>
                  <td className="px-2 py-1.5 text-right text-amber-600 font-medium">¥{a.price}</td>
                  <td className="px-2 py-1.5 text-right">{a.stock.toLocaleString()}</td>
                </tr>
                {comparisonSuppliers.map(({ accessory: acc, supplier: sup }) => (
                  <tr key={acc.id} className="border-t border-gray-100 text-navy-600">
                    <td className="px-2 py-1.5">{sup!.name}</td>
                    <td className="px-2 py-1.5">{acc.name}</td>
                    <td className="px-2 py-1.5 text-right">¥{acc.price}</td>
                    <td className="px-2 py-1.5 text-right">{acc.stock.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-2">
        <p className="text-[11px] font-medium text-navy-600 mb-1.5 flex items-center gap-1">
          <Play size={11} />
          履约状态
        </p>
        <StageProgress stages={accessoryStages} currentIdx={accessoryStage} />
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={handleBatchInquiry}
          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium rounded border border-navy-200 text-navy-600 bg-navy-50 hover:bg-navy-100 transition-colors"
        >
          <FileText size={11} />
          批量询价
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-navy-400 hover:text-navy-600 transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {expanded ? '收起' : '详情'}
        </button>
      </div>

      {expanded && supplier && <DetailPanel supplier={supplier} budgetMax={a.price * a.minOrder} onInquiry={handleInquiry} showToast={showToast} />}
      {expanded && !supplier && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[11px] text-navy-300">暂无供应商信息</p>
        </div>
      )}

      <InquiryWizard
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        supplierId={selectedSupplier.id}
        supplierName={selectedSupplier.name}
      />
      <ToastDisplay msg={toastMsg} />
    </div>
  )
}

export default function MarketCard({ item, borderColor }: MarketCardProps) {
  if ('deliveryDate' in item) return <ProcurementCard item={item} borderColor={borderColor} />
  if ('deadline' in item) return <ProcessingCard item={item} borderColor={borderColor} />
  return <AccessoryCard item={item} borderColor={borderColor} />
}
