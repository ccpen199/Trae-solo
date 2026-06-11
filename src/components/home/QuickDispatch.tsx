import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, Factory, Package, ArrowRight, CheckCircle, Send, Eye,
  Truck, ShieldCheck, CreditCard, PackageCheck, MapPin, Calendar, Tag,
  Plus, X, Star, Users, TrendingDown, BarChart3, FileText, DollarSign,
  ClipboardList, Sparkles, CheckSquare, Scale, Boxes,
  ShoppingCart, Warehouse, Receipt,
} from 'lucide-react'
import { useStore, type ProcurementRequest, type ProcessingOrder, type AccessorySupply } from '@/store'
import InquiryWizard from '@/components/supplier/InquiryWizard'

const tabs = [
  { key: 'procurement' as const, label: '采购找货', icon: Search, color: 'text-blue-500', border: 'border-l-blue-500', bg: 'bg-blue-50', btn: 'bg-blue-500 hover:bg-blue-600' },
  { key: 'processing' as const, label: '加工接单', icon: Factory, color: 'text-amber-500', border: 'border-l-amber-400', bg: 'bg-amber-50', btn: 'bg-amber-500 hover:bg-amber-600' },
  { key: 'accessory' as const, label: '辅料供应', icon: Package, color: 'text-teal-500', border: 'border-l-teal-500', bg: 'bg-teal-50', btn: 'bg-teal-500 hover:bg-teal-600' },
]

type TabKey = typeof tabs[number]['key']

const procurementStatusMap: Record<ProcurementRequest['status'], { label: string; cls: string }> = {
  open: { label: '开放中', cls: 'bg-emerald-50 text-emerald-600' },
  matched: { label: '已匹配', cls: 'bg-blue-50 text-blue-600' },
  closed: { label: '已关闭', cls: 'bg-navy-100 text-navy-400' },
}

const processingStatusMap: Record<ProcessingOrder['status'], { label: string; cls: string }> = {
  open: { label: '开放中', cls: 'bg-emerald-50 text-emerald-600' },
  in_progress: { label: '进行中', cls: 'bg-amber-50 text-amber-600' },
  completed: { label: '已完成', cls: 'bg-teal-50 text-teal-600' },
}

function getStockStatus(stock: number, minOrder: number): { label: string; cls: string; percent: number } {
  const ratio = stock / (minOrder * 10)
  if (stock >= minOrder * 10) return { label: '充足', cls: 'bg-emerald-50 text-emerald-600', percent: Math.min(100, ratio * 100) }
  if (stock >= minOrder * 2) return { label: '紧张', cls: 'bg-amber-50 text-amber-600', percent: Math.min(100, ratio * 100) }
  return { label: '缺货', cls: 'bg-red-50 text-red-500', percent: Math.max(5, ratio * 100) }
}

const craftOptions = ['横机编织', '圆机编织', '提花', '缝盘', '洗水', '整烫', '缩绒', '绣花', '印花']
const factoryTypeOptions = ['横机厂', '圆机厂', '提花厂', '缝合厂', '洗水厂', '综合厂']
const accessoryCategoryOptions = ['拉链', '纽扣', '纱线', '织带', '花边', '衬布', '标牌', '其他']
const accessoryMaterialOptions = ['涤纶', '树脂', '尼龙', '金属', '木质', '贝壳', '羊绒', '羊毛', '混纺', '丝绸']

const matchedSuppliers = [
  { id: 's1', name: '濮院华锦毛衫厂', avatar: 'P', color: 'bg-blue-500' },
  { id: 's2', name: '大朗鑫达针织', avatar: 'D', color: 'bg-amber-500' },
  { id: 's6', name: '苏州锦绣服饰', avatar: 'S', color: 'bg-teal-500' },
  { id: 's3', name: '义乌辅料中心', avatar: 'Y', color: 'bg-purple-500' },
]

const respondingFactories = [
  { id: 's1', name: '濮院华锦', matchScore: 92, avatar: 'P', color: 'bg-emerald-500' },
  { id: 's2', name: '大朗鑫达', matchScore: 85, avatar: 'D', color: 'bg-blue-500' },
  { id: 's6', name: '苏州锦绣', matchScore: 78, avatar: 'S', color: 'bg-amber-500' },
]

const pipelineByTab: Record<TabKey, { label: string; icon: typeof Search }[]> = {
  procurement: [
    { label: '寻源', icon: Search },
    { label: '匹配', icon: Eye },
    { label: '询价', icon: Send },
    { label: '寄样', icon: Truck },
    { label: '验厂', icon: ShieldCheck },
    { label: '下单', icon: PackageCheck },
    { label: '支付', icon: CreditCard },
    { label: '交付', icon: CheckCircle },
  ],
  processing: [
    { label: '发布', icon: FileText },
    { label: '接收', icon: ClipboardList },
    { label: '报价', icon: DollarSign },
    { label: '打样', icon: Sparkles },
    { label: '确认', icon: CheckSquare },
    { label: '生产', icon: Factory },
    { label: '质检', icon: ShieldCheck },
    { label: '交付', icon: Truck },
  ],
  accessory: [
    { label: '发布', icon: Package },
    { label: '搜索', icon: Search },
    { label: '比价', icon: Scale },
    { label: '寄样', icon: Truck },
    { label: '下单', icon: ShoppingCart },
    { label: '配送', icon: Warehouse },
    { label: '收货', icon: Boxes },
    { label: '结款', icon: Receipt },
  ],
}

const stepHighlightByTab: Record<TabKey, number> = {
  procurement: 2,
  processing: 4,
  accessory: 1,
}

function renderStars(score: number) {
  const fullStars = Math.floor(score / 20)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={10}
          className={i < fullStars ? 'text-amber-400 fill-amber-400' : 'text-navy-200'}
        />
      ))}
    </div>
  )
}

function ProcurementCard({ item, onInquiry }: { item: ProcurementRequest; onInquiry: () => void }) {
  const status = procurementStatusMap[item.status]
  const topMatched = matchedSuppliers.slice(0, 3)

  return (
    <div className="border-l-4 border-l-blue-500 bg-surface rounded-r-lg p-3 card-hover">
      <div className="flex items-start justify-between mb-1.5">
        <h3 className="text-sm font-medium text-navy-700 leading-tight">{item.title}</h3>
        <span className={`shrink-0 ml-2 px-2 py-0.5 rounded text-[10px] font-medium ${status.cls}`}>{status.label}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-navy-400 mb-2">
        <span className="flex items-center gap-1"><Tag size={12} />{item.category}</span>
        <span className="flex items-center gap-1"><MapPin size={12} />{item.location}</span>
        <span className="flex items-center gap-1"><Calendar size={12} />{item.deliveryDate}</span>
      </div>
      <div className="flex items-center gap-1 mb-2">
        {topMatched.map((s, i) => (
          <div
            key={s.id}
            className={`w-6 h-6 rounded-full ${s.color} text-white text-[10px] font-medium flex items-center justify-center border-2 border-white -ml-${i > 0 ? '1' : '0'} ${i > 0 ? '-ml-1' : ''}`}
            title={s.name}
          >
            {s.avatar}
          </div>
        ))}
        {item.status === 'matched' && (
          <span className="text-[10px] text-navy-400 ml-1">已匹配{topMatched.length}家供应商</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-amber-600 font-medium">¥{item.budget.min}-{item.budget.max}/{item.unit}</span>
        <div className="flex items-center gap-1">
          {item.status !== 'closed' && (
            <button
              onClick={onInquiry}
              className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              <Send size={10} />一键发起询价
            </button>
          )}
          {item.status !== 'closed' && (
            <Link
              to="/match"
              className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium bg-navy-50 text-navy-600 rounded hover:bg-navy-100 transition-colors"
            >
              <Eye size={10} />进入撮合流程
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function ProcessingCard({ item, onAcceptQuote }: { item: ProcessingOrder; onAcceptQuote: () => void }) {
  const status = processingStatusMap[item.status]
  const quoteCount = 2 + Math.floor(Math.random() * 3)
  const avgMatch = Math.floor(75 + Math.random() * 20)

  return (
    <div className="border-l-4 border-l-amber-400 bg-surface rounded-r-lg p-3 card-hover">
      <div className="flex items-start justify-between mb-1.5">
        <h3 className="text-sm font-medium text-navy-700 leading-tight">{item.title}</h3>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${status.cls}`}>{status.label}</span>
          {item.status === 'open' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 flex items-center gap-0.5">
              <Users size={10} />{quoteCount}家报价
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-navy-400 mb-2">
        <span className="flex items-center gap-1"><Factory size={12} />{item.factoryType}</span>
        <span className="flex items-center gap-1"><MapPin size={12} />{item.location}</span>
        <span className="flex items-center gap-1"><Calendar size={12} />{item.deadline}</span>
      </div>
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] text-navy-400 mb-0.5">
          <span>工厂匹配度</span>
          <span className="font-medium text-navy-600">{avgMatch}%</span>
        </div>
        <div className="h-1.5 bg-navy-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${avgMatch}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-1 mb-2">
        {respondingFactories.map((f) => (
          <div key={f.id} className="flex items-center gap-0.5" title={`${f.name} ${f.matchScore}%`}>
            <div className={`w-5 h-5 rounded-full ${f.color} text-white text-[9px] font-medium flex items-center justify-center`}>
              {f.avatar}
            </div>
          </div>
        ))}
        <span className="text-[10px] text-navy-400 ml-1">{respondingFactories.length}家响应</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-amber-600 font-medium">¥{item.budget.min}-{item.budget.max}/件</span>
        <div className="flex items-center gap-1">
          {item.status === 'open' && (
            <button
              onClick={onAcceptQuote}
              className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
            >
              <CheckCircle size={10} />接受报价
            </button>
          )}
          <Link
            to="/market?tab=processing"
            className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium bg-navy-50 text-navy-600 rounded hover:bg-navy-100 transition-colors"
          >
            <Users size={10} />查看所有工厂
          </Link>
        </div>
      </div>
    </div>
  )
}

function AccessoryCard({ item, onInquiry, onViewSample, onCompare, compareCount }: { item: AccessorySupply; onInquiry: () => void; onViewSample: () => void; onCompare: () => void; compareCount: number }) {
  const stockStatus = getStockStatus(item.stock, item.minOrder)
  const todayDiscount = item.stock > 10000 ? Math.floor(5 + Math.random() * 15) : 0
  const creditScore = 78 + Math.floor(Math.random() * 20)
  const dealCount = 20 + Math.floor(Math.random() * 200)

  return (
    <div className="border-l-4 border-l-teal-500 bg-surface rounded-r-lg p-3 card-hover relative overflow-hidden">
      {todayDiscount > 0 && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-bl-lg flex items-center gap-0.5">
          <TrendingDown size={9} />今日降{todayDiscount}%
        </div>
      )}
      <div className="flex items-start justify-between mb-1.5 pr-12">
        <h3 className="text-sm font-medium text-navy-700 leading-tight">{item.name}</h3>
        <span className={`shrink-0 ml-2 px-2 py-0.5 rounded text-[10px] font-medium ${stockStatus.cls}`}>{stockStatus.label}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-navy-400 mb-2">
        <span className="flex items-center gap-1"><Tag size={12} />{item.category}</span>
        <span className="flex items-center gap-1"><MapPin size={12} />{item.location}</span>
        <span className="flex items-center gap-1"><Package size={12} />起订{item.minOrder}{item.unit}</span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        {renderStars(creditScore)}
        <span className="text-[10px] text-navy-400">信用{creditScore}分</span>
        <span className="text-[10px] text-navy-400">·</span>
        <span className="text-[10px] text-navy-400">成交{dealCount}笔</span>
      </div>
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] text-navy-400 mb-0.5">
          <span>库存状态</span>
          <span className="font-medium text-navy-600">{item.stock.toLocaleString()}{item.unit}</span>
        </div>
        <div className="h-1.5 bg-navy-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${stockStatus.percent > 50 ? 'bg-emerald-500' : stockStatus.percent > 20 ? 'bg-amber-400' : 'bg-red-400'}`}
            style={{ width: `${stockStatus.percent}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-amber-600 font-medium">¥{item.price}/{item.unit}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={onInquiry}
            className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
          >
            <Send size={10} />批量询价
          </button>
          <button
            onClick={onViewSample}
            className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium bg-navy-50 text-navy-600 rounded hover:bg-navy-100 transition-colors"
          >
            <Eye size={10} />查看样品
          </button>
          <button
            onClick={onCompare}
            className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-medium bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors"
          >
            <BarChart3 size={10} />加入对比
          </button>
        </div>
      </div>
    </div>
  )
}

function MatchingPipeline({ activeTab, onStepClick }: { activeTab: TabKey; onStepClick: (step: string) => void }) {
  const steps = pipelineByTab[activeTab]
  const currentStep = stepHighlightByTab[activeTab]
  const activeConfig = tabs.find((t) => t.key === activeTab)!

  return (
    <div className="mt-5 pt-4 border-t border-navy-100">
      <p className="text-xs font-medium text-navy-500 mb-3">撮合闭环流程</p>
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const Icon = step.icon
          const isActive = idx === currentStep
          const isPast = idx < currentStep
          return (
            <div key={step.label} className="flex items-center">
              <div
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => onStepClick(step.label)}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isActive
                      ? `${activeConfig.bg.replace('50', '500')} text-white`
                      : isPast
                        ? 'bg-teal-500 text-white'
                        : 'bg-navy-100 text-navy-300'
                  }`}
                >
                  <Icon size={13} />
                </div>
                <span
                  className={`mt-1 text-[9px] ${
                    isActive ? `${activeConfig.color} font-medium` : isPast ? 'text-teal-600' : 'text-navy-300'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <ArrowRight
                  size={12}
                  className={`mx-0.5 -mt-3 ${isPast ? 'text-teal-400' : 'text-navy-200'}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
      <div className="bg-navy-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm">
        <CheckCircle size={16} className="text-emerald-400" />
        {message}
      </div>
    </div>
  )
}

export default function QuickDispatch() {
  const [active, setActive] = useState<TabKey>('procurement')
  const procurements = useStore((s) => s.procurements)
  const processingOrders = useStore((s) => s.processingOrders)
  const accessories = useStore((s) => s.accessories)
  const addProcurement = useStore((s) => s.addProcurement)
  const addProcessingOrder = useStore((s) => s.addProcessingOrder)
  const addAccessory = useStore((s) => s.addAccessory)
  const addInquiry = useStore((s) => s.addInquiry)
  const updateSupplierSampleStatus = useStore((s) => s.updateSupplierSampleStatus)
  const navigate = useNavigate()

  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState('')
  const [inquiryOpen, setInquiryOpen] = useState(false)
  const [inquirySupplier, setInquirySupplier] = useState<{ id: string; name: string }>({ id: 's1', name: '濮院华锦毛衫厂' })
  const [compareList, setCompareList] = useState<string[]>([])

  const [procTitle, setProcTitle] = useState('')
  const [procCategory, setProcCategory] = useState('')
  const [procCrafts, setProcCrafts] = useState<string[]>([])
  const [procQty, setProcQty] = useState('')
  const [procMin, setProcMin] = useState('')
  const [procMax, setProcMax] = useState('')
  const [procDate, setProcDate] = useState('')
  const [procDesc, setProcDesc] = useState('')

  const [procOrderTitle, setProcOrderTitle] = useState('')
  const [procOrderCrafts, setProcOrderCrafts] = useState<string[]>([])
  const [procOrderQty, setProcOrderQty] = useState('')
  const [procOrderDeadline, setProcOrderDeadline] = useState('')
  const [procOrderFactoryType, setProcOrderFactoryType] = useState('')
  const [procOrderMin, setProcOrderMin] = useState('')
  const [procOrderMax, setProcOrderMax] = useState('')
  const [procOrderDesc, setProcOrderDesc] = useState('')

  const [accName, setAccName] = useState('')
  const [accCategory, setAccCategory] = useState('')
  const [accMaterial, setAccMaterial] = useState('')
  const [accSpecs, setAccSpecs] = useState('')
  const [accPrice, setAccPrice] = useState('')
  const [accMinOrder, setAccMinOrder] = useState('')
  const [accStock, setAccStock] = useState('')
  const [accDesc, setAccDesc] = useState('')

  const currentTab = tabs.find((t) => t.key === active)!
  const counts = {
    procurement: procurements.length,
    processing: processingOrders.length,
    accessory: accessories.length,
  }

  const openInquiry = (supplierId: string, supplierName: string) => {
    setInquirySupplier({ id: supplierId, name: supplierName })
    setInquiryOpen(true)
  }

  const handleAcceptQuote = (item: ProcessingOrder) => {
    const firstFactory = respondingFactories[0]
    addInquiry({
      fromUserId: 'u1',
      toSupplierId: firstFactory.id,
      toSupplierName: firstFactory.name,
      type: 'processing',
      title: item.title,
      content: item.description || '',
      quantity: item.quantity || 0,
      budget: item.budget,
      deliveryDate: item.deadline || '',
    })
    setToast('已接受报价，询价单已创建，可在订单中心查看')
  }

  const handleViewSample = (supplierId: string) => {
    updateSupplierSampleStatus(supplierId, 'requested')
    setToast('样品寄送已申请')
  }

  const handleCompare = (itemId: string) => {
    setCompareList((prev) => {
      if (prev.includes(itemId)) return prev
      return [...prev, itemId]
    })
    setToast(`已加入对比清单(共${compareList.length + 1}项)`)
  }

  const handlePipelineStepClick = (step: string) => {
    if (active === 'procurement') {
      switch (step) {
        case '寻源': navigate('/market'); break
        case '匹配': navigate('/match'); break
        case '询价': openInquiry(matchedSuppliers[0].id, matchedSuppliers[0].name); break
        case '寄样': setToast('请先发起询价'); break
        case '验厂': navigate(`/supplier/${matchedSuppliers[0].id}#inspection`); break
        case '下单': navigate('/orders'); break
        case '支付': navigate('/orders?tab=deposit'); break
        case '交付': navigate('/orders'); break
      }
    }
  }

  const resetForms = () => {
    setProcTitle('')
    setProcCategory('')
    setProcCrafts([])
    setProcQty('')
    setProcMin('')
    setProcMax('')
    setProcDate('')
    setProcDesc('')
    setProcOrderTitle('')
    setProcOrderCrafts([])
    setProcOrderQty('')
    setProcOrderDeadline('')
    setProcOrderFactoryType('')
    setProcOrderMin('')
    setProcOrderMax('')
    setProcOrderDesc('')
    setAccName('')
    setAccCategory('')
    setAccMaterial('')
    setAccSpecs('')
    setAccPrice('')
    setAccMinOrder('')
    setAccStock('')
    setAccDesc('')
  }

  const toggleCraft = (craft: string, current: string[], setter: (v: string[]) => void) => {
    if (current.includes(craft)) {
      setter(current.filter((c) => c !== craft))
    } else {
      setter([...current, craft])
    }
  }

  const handleSubmitProcurement = () => {
    if (!procTitle || !procCategory || procCrafts.length === 0 || !procQty || !procMin || !procMax || !procDate) return
    addProcurement({
      title: procTitle,
      category: procCategory,
      craftType: procCrafts,
      quantity: Number(procQty),
      unit: '件',
      deliveryDate: procDate,
      budget: { min: Number(procMin), max: Number(procMax) },
      location: '杭州',
      description: procDesc,
    })
    setShowModal(false)
    resetForms()
    setToast('采购需求已发布')
  }

  const handleSubmitProcessing = () => {
    if (!procOrderTitle || procOrderCrafts.length === 0 || !procOrderQty || !procOrderDeadline || !procOrderFactoryType || !procOrderMin || !procOrderMax) return
    addProcessingOrder({
      title: procOrderTitle,
      craftType: procOrderCrafts,
      quantity: Number(procOrderQty),
      deadline: procOrderDeadline,
      factoryType: procOrderFactoryType,
      location: '濮院',
      budget: { min: Number(procOrderMin), max: Number(procOrderMax) },
      description: procOrderDesc,
    })
    setShowModal(false)
    resetForms()
    setToast('加工订单已发布成功')
  }

  const handleSubmitAccessory = () => {
    if (!accName || !accCategory || !accMaterial || !accSpecs || !accPrice || !accMinOrder || !accStock) return
    addAccessory({
      name: accName,
      category: accCategory,
      material: accMaterial,
      specs: accSpecs,
      price: Number(accPrice),
      unit: '件',
      minOrder: Number(accMinOrder),
      stock: Number(accStock),
      location: '义乌',
      description: accDesc,
    })
    setShowModal(false)
    resetForms()
    setToast('辅料产品已发布成功')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 relative">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <InquiryWizard
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        supplierId={inquirySupplier.id}
        supplierName={inquirySupplier.name}
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-semibold text-navy-700">供需速递</h2>
      </div>
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                active === t.key ? 'bg-navy-700 text-white' : 'bg-navy-50 text-navy-500 hover:bg-navy-100'
              }`}
            >
              <Icon size={14} />
              {t.label}
              <span className={`text-[10px] ${active === t.key ? 'text-navy-200' : 'text-navy-400'}`}>
                {counts[t.key]}条
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-navy-400">
          {currentTab.label} {counts[active]}条
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors ${currentTab.btn}`}
          >
            <Plus size={12} />
            {active === 'procurement' && '发布采购需求'}
            {active === 'processing' && '发布加工订单'}
            {active === 'accessory' && '发布辅料产品'}
          </button>
          <Link to="/market" className="flex items-center gap-0.5 text-xs text-amber-600 hover:text-amber-700 transition-colors">
            查看全部 <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {active === 'procurement' && procurements.slice(0, 3).map((item) => (
          <ProcurementCard key={item.id} item={item} onInquiry={() => openInquiry(matchedSuppliers[0].id, matchedSuppliers[0].name)} />
        ))}
        {active === 'processing' && processingOrders.slice(0, 3).map((item) => (
          <ProcessingCard key={item.id} item={item} onAcceptQuote={() => handleAcceptQuote(item)} />
        ))}
        {active === 'accessory' && accessories.slice(0, 3).map((item) => (
          <AccessoryCard
            key={item.id}
            item={item}
            onInquiry={() => openInquiry('s3', '义乌辅料中心')}
            onViewSample={() => handleViewSample('s3')}
            onCompare={() => handleCompare(item.id)}
            compareCount={compareList.length}
          />
        ))}
      </div>

      <MatchingPipeline activeTab={active} onStepClick={handlePipelineStepClick} />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForms() }} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-navy-100">
              <h3 className="font-semibold text-navy-700">
                {active === 'procurement' && '发布采购需求'}
                {active === 'processing' && '发布加工订单'}
                {active === 'accessory' && '发布辅料产品'}
              </h3>
              <button onClick={() => { setShowModal(false); resetForms() }} className="text-navy-400 hover:text-navy-600">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {active === 'procurement' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1">标题</label>
                    <input
                      value={procTitle}
                      onChange={(e) => setProcTitle(e.target.value)}
                      placeholder="例如：秋季羊绒混纺毛衣采购"
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1">品类</label>
                    <input
                      value={procCategory}
                      onChange={(e) => setProcCategory(e.target.value)}
                      placeholder="例如：毛衣"
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1">工艺（多选）</label>
                    <div className="flex flex-wrap gap-1.5">
                      {craftOptions.map((c) => (
                        <button
                          key={c}
                          onClick={() => toggleCraft(c, procCrafts, setProcCrafts)}
                          className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${
                            procCrafts.includes(c)
                              ? 'bg-blue-50 border-blue-400 text-blue-600'
                              : 'bg-white border-navy-200 text-navy-500 hover:border-navy-300'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">数量</label>
                      <input
                        type="number"
                        value={procQty}
                        onChange={(e) => setProcQty(e.target.value)}
                        placeholder="5000"
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">交期</label>
                      <input
                        type="date"
                        value={procDate}
                        onChange={(e) => setProcDate(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">预算最低（元）</label>
                      <input
                        type="number"
                        value={procMin}
                        onChange={(e) => setProcMin(e.target.value)}
                        placeholder="80"
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">预算最高（元）</label>
                      <input
                        type="number"
                        value={procMax}
                        onChange={(e) => setProcMax(e.target.value)}
                        placeholder="120"
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1">描述</label>
                    <textarea
                      value={procDesc}
                      onChange={(e) => setProcDesc(e.target.value)}
                      rows={3}
                      placeholder="规格、工艺、材质要求等..."
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                    />
                  </div>
                </>
              )}

              {active === 'processing' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1">标题</label>
                    <input
                      value={procOrderTitle}
                      onChange={(e) => setProcOrderTitle(e.target.value)}
                      placeholder="例如：羊绒衫整单加工"
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1">工艺（多选）</label>
                    <div className="flex flex-wrap gap-1.5">
                      {craftOptions.map((c) => (
                        <button
                          key={c}
                          onClick={() => toggleCraft(c, procOrderCrafts, setProcOrderCrafts)}
                          className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${
                            procOrderCrafts.includes(c)
                              ? 'bg-amber-50 border-amber-400 text-amber-600'
                              : 'bg-white border-navy-200 text-navy-500 hover:border-navy-300'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">数量</label>
                      <input
                        type="number"
                        value={procOrderQty}
                        onChange={(e) => setProcOrderQty(e.target.value)}
                        placeholder="5000"
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">截止日</label>
                      <input
                        type="date"
                        value={procOrderDeadline}
                        onChange={(e) => setProcOrderDeadline(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1">工厂类型</label>
                    <select
                      value={procOrderFactoryType}
                      onChange={(e) => setProcOrderFactoryType(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                    >
                      <option value="">请选择工厂类型</option>
                      {factoryTypeOptions.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">预算最低（元/件）</label>
                      <input
                        type="number"
                        value={procOrderMin}
                        onChange={(e) => setProcOrderMin(e.target.value)}
                        placeholder="25"
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">预算最高（元/件）</label>
                      <input
                        type="number"
                        value={procOrderMax}
                        onChange={(e) => setProcOrderMax(e.target.value)}
                        placeholder="40"
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1">描述</label>
                    <textarea
                      value={procOrderDesc}
                      onChange={(e) => setProcOrderDesc(e.target.value)}
                      rows={3}
                      placeholder="加工要求、工艺细节等..."
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                    />
                  </div>
                </>
              )}

              {active === 'accessory' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1">名称</label>
                    <input
                      value={accName}
                      onChange={(e) => setAccName(e.target.value)}
                      placeholder="例如：高弹力涤纶拉链"
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">品类</label>
                      <select
                        value={accCategory}
                        onChange={(e) => setAccCategory(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400"
                      >
                        <option value="">请选择</option>
                        {accessoryCategoryOptions.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">材质</label>
                      <select
                        value={accMaterial}
                        onChange={(e) => setAccMaterial(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400"
                      >
                        <option value="">请选择</option>
                        {accessoryMaterialOptions.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1">规格</label>
                    <input
                      value={accSpecs}
                      onChange={(e) => setAccSpecs(e.target.value)}
                      placeholder="例如：5号闭尾"
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">单价（元）</label>
                      <input
                        type="number"
                        value={accPrice}
                        onChange={(e) => setAccPrice(e.target.value)}
                        placeholder="2.5"
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">起订量</label>
                      <input
                        type="number"
                        value={accMinOrder}
                        onChange={(e) => setAccMinOrder(e.target.value)}
                        placeholder="1000"
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">库存</label>
                      <input
                        type="number"
                        value={accStock}
                        onChange={(e) => setAccStock(e.target.value)}
                        placeholder="50000"
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1">描述</label>
                    <textarea
                      value={accDesc}
                      onChange={(e) => setAccDesc(e.target.value)}
                      rows={3}
                      placeholder="产品特性、使用场景等..."
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-400 resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 p-4 border-t border-navy-100">
              <button
                onClick={() => { setShowModal(false); resetForms() }}
                className="flex-1 py-2 text-sm border border-navy-200 text-navy-500 rounded-md hover:bg-navy-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={
                  active === 'procurement' ? handleSubmitProcurement :
                  active === 'processing' ? handleSubmitProcessing :
                  handleSubmitAccessory
                }
                className={`flex-1 py-2 text-sm text-white rounded-md transition-colors ${currentTab.btn}`}
              >
                提交发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
