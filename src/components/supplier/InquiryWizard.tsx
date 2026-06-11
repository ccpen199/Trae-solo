import { useState, useEffect } from 'react'
import {
  X, Send, ChevronRight, ChevronLeft, Plus, Trash2, Upload,
  FileText, Package, Truck, Building2, ShieldCheck, Clock,
  CheckCircle, Circle, AlertCircle, CreditCard, MapPin,
} from 'lucide-react'
import {
  useStore,
  type BomItem,
  type BomSupplierQuote,
  type SampleShipping,
  type FactoryInspection,
  type DepositInfo,
  type TimelineNode,
  type Inquiry,
} from '@/store'

interface InquiryWizardProps {
  open: boolean
  onClose: () => void
  supplierId: string
  supplierName: string
}

const steps = [
  { id: 1, label: '基本信息', icon: FileText },
  { id: 2, label: 'BOM比价', icon: Package },
  { id: 3, label: '样品寄送', icon: Truck },
  { id: 4, label: '在线验厂', icon: Building2 },
  { id: 5, label: '定金担保', icon: ShieldCheck },
  { id: 6, label: '提交确认', icon: CheckCircle },
]

const typeLabels: Record<'procurement' | 'processing' | 'accessory', string> = {
  procurement: '采购',
  processing: '加工',
  accessory: '辅料',
}

const sampleBomItems: BomItem[] = [
  { name: '羊毛纱线', qty: 500, unit: 'kg' },
  { name: '涤纶拉链', qty: 5000, unit: '条' },
  { name: '树脂纽扣', qty: 30000, unit: '颗' },
  { name: '洗水标', qty: 5000, unit: '张' },
]

const mockSuppliers = [
  { id: 's1', name: '濮院华锦毛衫厂' },
  { id: 's2', name: '大朗鑫达针织有限公司' },
  { id: 's6', name: '苏州锦绣服饰加工厂' },
]

function generateQuotes(bomItems: BomItem[]): BomSupplierQuote[] {
  return mockSuppliers.map((sup, sIdx) => {
    const baseMultiplier = 0.95 + sIdx * 0.08
    const items = bomItems.map((b) => ({
      name: b.name,
      unitPrice: Math.round((20 + Math.random() * 10) * baseMultiplier * 100) / 100,
    }))
    const totalQuote = items.reduce((sum, it) => {
      const bom = bomItems.find((b) => b.name === it.name)
      return sum + it.unitPrice * (bom?.qty || 1)
    }, 0)
    return {
      supplierId: sup.id,
      supplierName: sup.name,
      items,
      totalQuote: Math.round(totalQuote * 100) / 100,
    }
  })
}

const defaultTimeline: TimelineNode[] = [
  { time: '', step: '发送询价', status: 'current' },
  { time: '', step: '供应商报价', status: 'pending' },
  { time: '', step: 'BOM确认', status: 'pending' },
  { time: '', step: '样品寄送', status: 'pending' },
  { time: '', step: '在线验厂', status: 'pending' },
  { time: '', step: '定金支付', status: 'pending' },
  { time: '', step: '正式下单', status: 'pending' },
  { time: '', step: '订单完成', status: 'pending' },
]

export default function InquiryWizard({ open, onClose, supplierId, supplierName }: InquiryWizardProps) {
  const addInquiry = useStore((s) => s.addInquiry)
  const currentUser = useStore((s) => s.currentUser)

  const [currentStep, setCurrentStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)

  const [type, setType] = useState<'procurement' | 'processing' | 'accessory'>('procurement')
  const [title, setTitle] = useState('')
  const [quantity, setQuantity] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [description, setDescription] = useState('')

  const [bomItems, setBomItems] = useState<BomItem[]>([])
  const [bomQuotes, setBomQuotes] = useState<BomSupplierQuote[]>([])
  const [selectedSupplierQuote, setSelectedSupplierQuote] = useState<string>('')
  const [newBomName, setNewBomName] = useState('')
  const [newBomQty, setNewBomQty] = useState('')
  const [newBomUnit, setNewBomUnit] = useState('件')

  const [needSample, setNeedSample] = useState(true)
  const [sampleQty, setSampleQty] = useState('3')
  const [sampleAddress, setSampleAddress] = useState('浙江省杭州市西湖区文三路123号 锦衣服饰仓库 李明远 13800138000')
  const [freightCollect, setFreightCollect] = useState(false)
  const [sampleDelivery, setSampleDelivery] = useState('')

  const [needInspection, setNeedInspection] = useState(false)
  const [inspectionType, setInspectionType] = useState<'video' | 'vr' | 'onsite'>('video')
  const [inspectionTime, setInspectionTime] = useState('')

  const [depositRatio, setDepositRatio] = useState(20)
  const [guaranteeType, setGuaranteeType] = useState<'platform' | 'bank' | 'letter'>('platform')

  useEffect(() => {
    if (open) {
      setCurrentStep(1)
      setSubmitted(false)
      setType('procurement')
      setTitle(`关于${supplierName}的询价`)
      setQuantity('')
      setBudgetMin('')
      setBudgetMax('')
      setDeliveryDate('')
      setDescription('')
      setBomItems([])
      setBomQuotes([])
      setSelectedSupplierQuote('')
      setNewBomName('')
      setNewBomQty('')
      setNewBomUnit('件')
      setNeedSample(true)
      setSampleQty('3')
      setSampleAddress('浙江省杭州市西湖区文三路123号 锦衣服饰仓库 李明远 13800138000')
      setFreightCollect(false)
      setSampleDelivery('')
      setNeedInspection(false)
      setInspectionType('video')
      setInspectionTime('')
      setDepositRatio(20)
      setGuaranteeType('platform')
    }
  }, [open, supplierName])

  if (!open) return null

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return title && quantity && budgetMin && budgetMax && deliveryDate
      case 2:
        return bomItems.length > 0 && selectedSupplierQuote
      case 3:
        return !needSample || (sampleQty && sampleAddress && sampleDelivery)
      case 4:
        return !needInspection || inspectionTime
      case 5:
        return true
      default:
        return true
    }
  }

  const handleNext = () => {
    if (currentStep === 2 && bomItems.length > 0 && bomQuotes.length === 0) {
      setBomQuotes(generateQuotes(bomItems))
    }
    if (currentStep < 6) setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const addBomItem = () => {
    if (!newBomName || !newBomQty) return
    setBomItems([...bomItems, { name: newBomName, qty: Number(newBomQty), unit: newBomUnit }])
    setNewBomName('')
    setNewBomQty('')
    setNewBomUnit('件')
    setBomQuotes([])
    setSelectedSupplierQuote('')
  }

  const removeBomItem = (idx: number) => {
    setBomItems(bomItems.filter((_, i) => i !== idx))
    setBomQuotes([])
    setSelectedSupplierQuote('')
  }

  const loadSampleBom = () => {
    setBomItems(sampleBomItems)
    setBomQuotes(generateQuotes(sampleBomItems))
    setSelectedSupplierQuote('')
  }

  const minPriceQuote = bomQuotes.length > 0
    ? bomQuotes.reduce((min, q) => (q.totalQuote < min.totalQuote ? q : min))
    : null

  const depositAmount = Number(budgetMax) > 0 ? Math.round(Number(budgetMax) * depositRatio / 100) : 0

  const handleSubmit = () => {
    const sampleShipping: SampleShipping = {
      status: needSample ? 'requested' : 'none',
      needSample,
      sampleQuantity: Number(sampleQty) || 0,
      address: sampleAddress,
      freightCollect,
      estimatedDelivery: sampleDelivery,
    }
    const inspection: FactoryInspection = {
      scheduled: needInspection,
      completed: false,
      needInspection,
      inspectionType,
      expectedTime: inspectionTime,
    }
    const deposit: DepositInfo = {
      ratio: depositRatio,
      amount: depositAmount,
      status: depositAmount > 0 ? 'pending' : 'none',
      guaranteeType,
    }
    const timeline = defaultTimeline.map((n, i) => ({
      ...n,
      date: i === 0 ? new Date().toLocaleDateString('zh-CN') : undefined,
    }))

    const inquiryData = {
      fromUserId: currentUser?.id || 'u1',
      toSupplierId: supplierId,
      supplierId: selectedSupplierQuote || supplierId,
      toSupplierName: supplierName,
      type,
      title,
      content: description,
      quantity: Number(quantity) || 0,
      budget: { min: Number(budgetMin) || 0, max: Number(budgetMax) || 0 },
      deliveryDate,
      bomItems,
      bomSupplierQuotes: bomQuotes,
      selectedSupplierId: selectedSupplierQuote || supplierId,
      sampleShipping,
      inspection,
      deposit,
      timeline,
    }
    addInquiry(inquiryData)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      onClose()
    }, 2000)
  }

  const inspectionTypeLabels = { video: '视频直播', vr: 'VR实景', onsite: '预约实地' }
  const guaranteeLabels = { platform: '平台担保', bank: '银行托管', letter: '信用证' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-navy-100">
          <h2 className="text-lg font-semibold text-navy-700">发起询价单 - {supplierName}</h2>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-600"><X size={20} /></button>
        </div>

        <div className="px-5 py-4 border-b border-navy-100 bg-navy-50/50">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isDone = step.id < currentStep
              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? 'bg-amber-500 text-white' :
                      isDone ? 'bg-emerald-500 text-white' : 'bg-navy-200 text-navy-400'
                    }`}>
                      {isDone ? <CheckCircle size={16} /> : <Icon size={14} />}
                    </div>
                    <span className={`text-[10px] mt-1 whitespace-nowrap ${
                      isActive ? 'text-amber-600 font-medium' :
                      isDone ? 'text-emerald-600' : 'text-navy-400'
                    }`}>{step.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 ${
                      step.id < currentStep ? 'bg-emerald-400' : 'bg-navy-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {submitted ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <p className="text-lg font-medium text-navy-700 mb-1">询价单已提交</p>
              <p className="text-sm text-navy-400">已通知供应商，可在订单中心查看进度</p>
            </div>
          ) : currentStep === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-navy-500 mb-1">询价类型</label>
                <div className="flex gap-2">
                  {(['procurement', 'processing', 'accessory'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                        type === t
                          ? 'bg-amber-50 border-amber-400 text-amber-700 font-medium'
                          : 'bg-white border-navy-200 text-navy-500 hover:border-navy-300'
                      }`}
                    >
                      {typeLabels[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-500 mb-1">询价标题</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-navy-500 mb-1">需求数量</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="请输入数量"
                    className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy-500 mb-1">期望交期</label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-500 mb-1">预算范围（元）</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="最低"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="flex-1 px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-navy-400">-</span>
                  <input
                    type="number"
                    placeholder="最高"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="flex-1 px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-500 mb-1">详细描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="请详细描述规格、工艺、材质要求等..."
                  className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>
          ) : currentStep === 2 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-navy-700">BOM物料清单</h4>
                <button
                  onClick={loadSampleBom}
                  className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg"
                >
                  <Upload size={12} />
                  上传CSV/BOM（示例）
                </button>
              </div>

              <div className="bg-surface rounded-lg p-3 space-y-2">
                {bomItems.length === 0 ? (
                  <p className="text-xs text-navy-400 text-center py-4">暂无物料，请添加或上传BOM</p>
                ) : (
                  bomItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-sm">
                      <span className="flex-1 text-navy-700">{item.name}</span>
                      <span className="text-navy-500">{item.qty}</span>
                      <span className="text-navy-400 text-xs">{item.unit}</span>
                      <button
                        onClick={() => removeBomItem(idx)}
                        className="text-red-400 hover:text-red-500 p-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="grid grid-cols-12 gap-2">
                <input
                  placeholder="物料名称"
                  value={newBomName}
                  onChange={(e) => setNewBomName(e.target.value)}
                  className="col-span-5 px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                />
                <input
                  type="number"
                  placeholder="用量"
                  value={newBomQty}
                  onChange={(e) => setNewBomQty(e.target.value)}
                  className="col-span-3 px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                />
                <input
                  placeholder="单位"
                  value={newBomUnit}
                  onChange={(e) => setNewBomUnit(e.target.value)}
                  className="col-span-2 px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={addBomItem}
                  className="col-span-2 flex items-center justify-center gap-1 bg-navy-600 text-white text-sm rounded-lg hover:bg-navy-700 transition-colors"
                >
                  <Plus size={14} />
                  添加
                </button>
              </div>

              {bomQuotes.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-navy-700 mb-2 flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-teal-500" />
                    系统匹配供应商报价对比
                  </h4>
                  <div className="border border-navy-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-navy-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-navy-500 font-medium">供应商</th>
                          {bomItems.map((b, i) => (
                            <th key={i} className="px-2 py-2 text-right text-navy-500 font-medium">
                              {b.name}
                            </th>
                          ))}
                          <th className="px-3 py-2 text-right text-navy-500 font-medium">总价</th>
                          <th className="px-3 py-2 text-center text-navy-500 font-medium">选择</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bomQuotes.map((q) => {
                          const isMin = minPriceQuote?.supplierId === q.supplierId
                          const isSelected = selectedSupplierQuote === q.supplierId
                          return (
                            <tr
                              key={q.supplierId}
                              className={`border-t border-navy-100 cursor-pointer transition-colors ${
                                isSelected ? 'bg-amber-50' : isMin ? 'bg-emerald-50/50' : 'hover:bg-navy-50'
                              }`}
                              onClick={() => setSelectedSupplierQuote(q.supplierId)}
                            >
                              <td className="px-3 py-2 text-navy-700">
                                <div className="flex items-center gap-1.5">
                                  {q.supplierName}
                                  {isMin && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] rounded">
                                      最低价
                                    </span>
                                  )}
                                </div>
                              </td>
                              {q.items.map((it, i) => (
                                <td key={i} className="px-2 py-2 text-right text-navy-600">¥{it.unitPrice}</td>
                              ))}
                              <td className={`px-3 py-2 text-right font-medium ${isMin ? 'text-emerald-600' : 'text-navy-700'}`}>
                                ¥{q.totalQuote.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <div className={`w-4 h-4 mx-auto rounded-full border-2 flex items-center justify-center ${
                                  isSelected ? 'border-amber-500 bg-amber-500' : 'border-navy-300'
                                }`}>
                                  {isSelected && <CheckCircle size={10} className="text-white" />}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : currentStep === 3 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-navy-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Truck size={18} className="text-teal-500" />
                  <span className="text-sm font-medium text-navy-700">需要寄送样品</span>
                </div>
                <button
                  onClick={() => setNeedSample(!needSample)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    needSample ? 'bg-teal-500' : 'bg-navy-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${
                    needSample ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {needSample && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">样品数量</label>
                      <input
                        type="number"
                        value={sampleQty}
                        onChange={(e) => setSampleQty(e.target.value)}
                        className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-navy-500 mb-1">预计送达时间</label>
                      <input
                        type="date"
                        value={sampleDelivery}
                        onChange={(e) => setSampleDelivery(e.target.value)}
                        className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1 flex items-center gap-1">
                      <MapPin size={10} />
                      收件地址
                    </label>
                    <textarea
                      value={sampleAddress}
                      onChange={(e) => setSampleAddress(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-surface rounded-lg px-4 py-3">
                    <span className="text-sm text-navy-600">运费到付</span>
                    <button
                      onClick={() => setFreightCollect(!freightCollect)}
                      className={`w-11 h-6 rounded-full transition-colors relative ${
                        freightCollect ? 'bg-amber-500' : 'bg-navy-200'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${
                        freightCollect ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : currentStep === 4 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-navy-50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-blue-500" />
                  <span className="text-sm font-medium text-navy-700">预约在线验厂</span>
                </div>
                <button
                  onClick={() => setNeedInspection(!needInspection)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    needInspection ? 'bg-blue-500' : 'bg-navy-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${
                    needInspection ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {needInspection && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-2">验厂类型</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['video', 'vr', 'onsite'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setInspectionType(t)}
                          className={`py-3 text-sm rounded-lg border transition-colors ${
                            inspectionType === t
                              ? 'bg-blue-50 border-blue-400 text-blue-700 font-medium'
                              : 'bg-white border-navy-200 text-navy-500 hover:border-navy-300'
                          }`}
                        >
                          {inspectionTypeLabels[t]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-500 mb-1 flex items-center gap-1">
                      <Clock size={10} />
                      期望时间
                    </label>
                    <input
                      type="datetime-local"
                      value={inspectionTime}
                      onChange={(e) => setInspectionTime(e.target.value)}
                      className="w-full px-3 py-2 border border-navy-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : currentStep === 5 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-navy-500 mb-2">定金比例</label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 20, 30].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setDepositRatio(ratio)}
                      className={`py-3 text-sm rounded-lg border transition-colors ${
                        depositRatio === ratio
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-medium'
                          : 'bg-white border-navy-200 text-navy-500 hover:border-navy-300'
                      }`}
                    >
                      {ratio}%
                      {ratio === 20 && <span className="block text-[10px] text-navy-400 mt-0.5">推荐</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-emerald-700">预算上限 × 比例</span>
                  <span className="text-xs text-emerald-600">¥{Number(budgetMax || 0).toLocaleString()} × {depositRatio}%</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <CreditCard size={20} className="text-emerald-600" />
                  <span className="text-2xl font-bold font-serif text-emerald-700">
                    ¥{depositAmount.toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-600">定金金额</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-navy-500 mb-2">担保方式</label>
                <div className="space-y-2">
                  {(['platform', 'bank', 'letter'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGuaranteeType(g)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg border transition-colors ${
                        guaranteeType === g
                          ? 'bg-navy-50 border-navy-400 text-navy-700'
                          : 'bg-white border-navy-200 text-navy-500 hover:border-navy-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        guaranteeType === g ? 'border-navy-600' : 'border-navy-300'
                      }`}>
                        {guaranteeType === g && <div className="w-2 h-2 rounded-full bg-navy-600" />}
                      </div>
                      <span className="font-medium">{guaranteeLabels[g]}</span>
                      <span className="text-xs text-navy-400 ml-auto">
                        {g === 'platform' && '平台托管，确认收货后放款'}
                        {g === 'bank' && '银行第三方托管账户'}
                        {g === 'letter' && '银行信用证担保'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="bg-navy-50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-navy-700 flex items-center gap-1.5">
                  <FileText size={14} />
                  询价信息摘要
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div><span className="text-navy-400">类型：</span><span className="text-navy-700">{typeLabels[type]}</span></div>
                  <div><span className="text-navy-400">数量：</span><span className="text-navy-700">{quantity}件</span></div>
                  <div className="col-span-2"><span className="text-navy-400">标题：</span><span className="text-navy-700">{title}</span></div>
                  <div><span className="text-navy-400">预算：</span><span className="text-navy-700">¥{budgetMin} - ¥{budgetMax}</span></div>
                  <div><span className="text-navy-400">交期：</span><span className="text-navy-700">{deliveryDate}</span></div>
                </div>
                {selectedSupplierQuote && (
                  <div className="pt-2 border-t border-navy-200">
                    <span className="text-xs text-navy-400">意向供应商：</span>
                    <span className="text-xs font-medium text-amber-600 ml-1">
                      {bomQuotes.find((q) => q.supplierId === selectedSupplierQuote)?.supplierName || supplierName}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-2 border-t border-navy-200">
                  <div>
                    <span className="text-navy-400">样品：</span>
                    <span className="text-navy-700">{needSample ? `需要${sampleQty}件` : '不需要'}</span>
                  </div>
                  <div>
                    <span className="text-navy-400">验厂：</span>
                    <span className="text-navy-700">{needInspection ? inspectionTypeLabels[inspectionType] : '不需要'}</span>
                  </div>
                  <div>
                    <span className="text-navy-400">定金：</span>
                    <span className="text-navy-700">{depositRatio}% = ¥{depositAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-navy-400">担保：</span>
                    <span className="text-navy-700">{guaranteeLabels[guaranteeType]}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-navy-700 mb-3 flex items-center gap-1.5">
                  <Clock size={14} />
                  订单流程预览
                </h4>
                <div className="space-y-0 pl-1">
                  {defaultTimeline.map((node, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {node.status === 'current' ? (
                          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shrink-0" />
                        ) : node.status === 'done' ? (
                          <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                        ) : (
                          <Circle size={12} className="text-navy-300 shrink-0" />
                        )}
                        {i < defaultTimeline.length - 1 && <div className="w-px h-6 bg-navy-200" />}
                      </div>
                      <div className="pb-3 text-xs">
                        <span className={
                          node.status === 'current' ? 'text-amber-600 font-medium' :
                          node.status === 'done' ? 'text-emerald-600' : 'text-navy-400'
                        }>{node.step}</span>
                        {i === 0 && <span className="text-navy-300 ml-2">（立即执行）</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {!submitted && (
          <div className="flex items-center gap-3 p-5 border-t border-navy-100">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="flex items-center justify-center gap-1 px-5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-500 hover:bg-navy-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              上一步
            </button>
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-500 hover:bg-navy-50 transition-colors"
            >
              取消
            </button>
            {currentStep < 6 ? (
              <button
                onClick={handleNext}
                disabled={!canGoNext()}
                className="flex items-center justify-center gap-1 px-5 py-2.5 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一步
                <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors font-medium"
              >
                <Send size={14} />
                提交询价单
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
