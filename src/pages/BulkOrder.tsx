import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sofa,
  Tv,
  Refrigerator,
  WashingMachine,
  Bed,
  Table,
  User,
  Phone,
  MapPin,
  Ruler,
  Weight,
  Clock,
  ChevronRight,
  Check,
  Wrench,
  Building2,
  Calendar,
  Loader2,
  Calculator,
  AlertCircle,
  Package,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { Provider } from '../../api/types'

const steps = ['物品信息', '服务选择', '预约时间', '确认下单']

const itemCategories = [
  { value: '家具', label: '家具', icon: Sofa },
  { value: '家电', label: '家电', icon: Tv },
  { value: '厨房电器', label: '厨房电器', icon: Refrigerator },
  { value: '卫浴设备', label: '卫浴设备', icon: WashingMachine },
  { value: '床品', label: '床品', icon: Bed },
  { value: '办公家具', label: '办公家具', icon: Table },
]

const furnitureItems = [
  { value: '沙发', label: '沙发', weight: 80, dimensions: '200×90×80' },
  { value: '衣柜', label: '衣柜', weight: 120, dimensions: '180×60×220' },
  { value: '餐桌', label: '餐桌', weight: 60, dimensions: '160×90×75' },
  { value: '茶几', label: '茶几', weight: 30, dimensions: '120×60×45' },
  { value: '电视柜', label: '电视柜', weight: 40, dimensions: '180×45×50' },
  { value: '床架', label: '床架', weight: 100, dimensions: '200×180×30' },
  { value: '书桌', label: '书桌', weight: 50, dimensions: '140×70×75' },
  { value: '椅子', label: '椅子', weight: 15, dimensions: '50×50×90' },
]

const applianceItems = [
  { value: '电视机', label: '电视机', weight: 35, dimensions: '150×10×90' },
  { value: '冰箱', label: '冰箱', weight: 80, dimensions: '70×70×180' },
  { value: '洗衣机', label: '洗衣机', weight: 60, dimensions: '60×60×85' },
  { value: '空调', label: '空调', weight: 40, dimensions: '100×30×40' },
  { value: '热水器', label: '热水器', weight: 30, dimensions: '80×40×40' },
  { value: '油烟机', label: '油烟机', weight: 25, dimensions: '90×50×60' },
  { value: '消毒柜', label: '消毒柜', weight: 30, dimensions: '60×45×60' },
  { value: '洗碗机', label: '洗碗机', weight: 40, dimensions: '60×60×85' },
]

const timeSlots = [
  { value: 'morning', label: '上午 09:00-12:00' },
  { value: 'afternoon', label: '下午 14:00-18:00' },
  { value: 'evening', label: '晚间 18:00-21:00' },
  { value: 'weekend', label: '周末全天' },
]

const BulkOrder: React.FC = () => {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null)
  const [feeEstimate, setFeeEstimate] = useState<{
    baseFee: number
    floorFee: number
    disassemblyFee: number
    distanceFee: number
    total: number
    breakdown: Array<{ name: string; value: number; formula: string }>
  } | null>(null)

  const [formData, setFormData] = useState({
    category: '家具' as string,
    itemName: '',
    itemWeight: 50,
    itemLength: 100,
    itemWidth: 60,
    itemHeight: 80,
    itemQuantity: 1,
    sender_name: '',
    sender_phone: '',
    sender_address: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    has_elevator: 1,
    floors: 3,
    floor_height: 3,
    disassembly_required: 1,
    appointment_date: '',
    appointment_time: 'morning' as string,
    special_instructions: '',
  })

  const getItemList = () => {
    switch (formData.category) {
      case '家具':
      case '办公家具':
        return furnitureItems
      case '家电':
      case '厨房电器':
        return applianceItems
      default:
        return [...furnitureItems, ...applianceItems]
    }
  }

  const handleItemSelect = (item: typeof furnitureItems[0]) => {
    setFormData(prev => ({
      ...prev,
      itemName: item.value,
      itemWeight: item.weight,
      ...parseDimensions(item.dimensions),
    }))
  }

  const parseDimensions = (dim: string) => {
    const [l, w, h] = dim.split('×').map(Number)
    return { itemLength: l, itemWidth: w, itemHeight: h }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    if (formData.itemWeight > 0 && formData.floors > 0) {
      const calculate = async () => {
        setCalculating(true)
        try {
          const result = await api.bulk.calculator({
            weight: formData.itemWeight,
            quantity: formData.itemQuantity,
            floors: formData.floors,
            has_elevator: formData.has_elevator,
            floor_height: formData.floor_height,
            disassembly_required: formData.disassembly_required,
            length: formData.itemLength,
            width: formData.itemWidth,
            height: formData.itemHeight,
            fromAddress: formData.sender_address,
            toAddress: formData.receiver_address,
          })
          if (result.success && result.data) {
            setFeeEstimate(result.data as any)
          }
        } catch (error) {
          console.error('Failed to calculate fee:', error)
        } finally {
          setCalculating(false)
        }
      }
      const timer = setTimeout(calculate, 500)
      return () => clearTimeout(timer)
    }
  }, [
    formData.itemWeight,
    formData.itemQuantity,
    formData.floors,
    formData.has_elevator,
    formData.floor_height,
    formData.disassembly_required,
    formData.itemLength,
    formData.itemWidth,
    formData.itemHeight,
    formData.sender_address,
    formData.receiver_address,
  ])

  useEffect(() => {
    if (currentStep >= 1 && providers.length === 0) {
      const fetchProviders = async () => {
        try {
          const result = await api.bulk.providers.list()
          if (result.success && result.data) {
            setProviders(result.data as Provider[])
          }
        } catch (error) {
          console.error('Failed to fetch providers:', error)
        }
      }
      fetchProviders()
    }
  }, [currentStep, providers.length])

  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.itemName || formData.itemWeight <= 0) {
        addNotification({ type: 'error', message: '请填写完整的物品信息' })
        return
      }
      if (!formData.sender_name || !formData.sender_phone || !formData.sender_address) {
        addNotification({ type: 'error', message: '请填写完整的寄件人信息' })
        return
      }
      if (!formData.receiver_name || !formData.receiver_phone || !formData.receiver_address) {
        addNotification({ type: 'error', message: '请填写完整的收件人信息' })
        return
      }
      setCurrentStep(1)
    } else if (currentStep === 1) {
      if (formData.disassembly_required === 1 && selectedProvider === null) {
        addNotification({ type: 'error', message: '请选择拆装服务商' })
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (!formData.appointment_date || !formData.appointment_time) {
        addNotification({ type: 'error', message: '请选择预约时间' })
        return
      }
      setCurrentStep(3)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const result = await api.bulk.create({
        ...formData,
        provider_id: selectedProvider,
        user_id: 1,
        item_desc: `${formData.category} - ${formData.itemName}`,
        fee: feeEstimate?.total || 0,
      })
      if (result.success) {
        addNotification({ type: 'success', message: '大件物流订单创建成功！' })
        setTimeout(() => navigate('/track'), 1500)
      }
    } catch (error) {
      addNotification({ type: 'error', message: '创建订单失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display text-sf-light">大件物流下单</h1>
        <p className="text-sf-light/50 text-sm mt-1">家具家电等大件物品专业搬运，拆装服务一站式解决</p>
      </div>

      <div className="flex items-center justify-center mb-10 overflow-x-auto pb-4">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex items-center gap-3 min-w-max">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-display transition-all shrink-0 ${
                  index < currentStep
                    ? 'bg-sf-green text-white'
                    : index === currentStep
                    ? 'bg-sf-red text-white'
                    : 'bg-sf-dark text-sf-light/50 border border-sf-blue/30'
                }`}
              >
                {index < currentStep ? <Check size={18} /> : index + 1}
              </div>
              <span
                className={`text-sm ${
                  index <= currentStep ? 'text-sf-light' : 'text-sf-light/50'
                }`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-2 sm:mx-4 shrink-0 ${
                  index < currentStep ? 'bg-sf-green' : 'bg-sf-dark'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {feeEstimate && (
        <div className="glass rounded-xl p-4 mb-6 border border-sf-yellow/30">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sf-yellow/10 rounded-lg flex items-center justify-center">
                <Calculator size={20} className="text-sf-yellow" />
              </div>
              <div>
                <div className="text-sm text-sf-light/70">实时费用估算</div>
                <div className="text-2xl font-display text-sf-red">
                  ¥{feeEstimate.total.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-sf-light/70">
                基础费 <span className="text-sf-light">¥{feeEstimate.baseFee.toFixed(2)}</span>
              </div>
              <div className="text-sf-light/70">
                楼层费 <span className="text-sf-light">¥{feeEstimate.floorFee.toFixed(2)}</span>
              </div>
              {feeEstimate.disassemblyFee > 0 && (
                <div className="text-sf-light/70">
                  拆装费 <span className="text-sf-light">¥{feeEstimate.disassemblyFee.toFixed(2)}</span>
                </div>
              )}
              {feeEstimate.distanceFee > 0 && (
                <div className="text-sf-light/70">
                  距离费 <span className="text-sf-light">¥{feeEstimate.distanceFee.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-8 border border-sf-blue/30">
        {currentStep === 0 && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Ruler size={18} className="text-sf-red" />
                <h3 className="text-lg font-display text-sf-light">物品类别</h3>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {itemCategories.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleInputChange('category', cat.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      formData.category === cat.value
                        ? 'bg-sf-red/10 border-sf-red/50 text-sf-red'
                        : 'bg-sf-dark/50 border-sf-blue/20 text-sf-light/70 hover:border-sf-blue/40'
                    }`}
                  >
                    <cat.icon size={24} />
                    <span className="text-xs">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-sf-blue/20" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Weight size={18} className="text-sf-yellow" />
                <h3 className="text-lg font-display text-sf-light">快速选择物品</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {getItemList().map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleItemSelect(item)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.itemName === item.value
                        ? 'bg-sf-yellow/10 border-sf-yellow/50'
                        : 'bg-sf-dark/50 border-sf-blue/20 hover:border-sf-blue/40'
                    }`}
                  >
                    <div className="text-sm text-sf-light">{item.label}</div>
                    <div className="text-xs text-sf-light/50 mt-1">
                      {item.weight}kg · {item.dimensions}cm
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-sf-blue/20" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-sf-blue" />
                  <h3 className="text-lg font-display text-sf-light">物品详细信息</h3>
                </div>
                {calculating && (
                  <div className="flex items-center gap-2 text-sf-yellow text-sm">
                    <Loader2 size={14} className="animate-spin" />
                    重新计算中...
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-sf-light/70 mb-2">物品名称</label>
                  <input
                    type="text"
                    value={formData.itemName}
                    onChange={(e) => handleInputChange('itemName', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入物品名称"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">重量 (kg)</label>
                  <input
                    type="number"
                    value={formData.itemWeight}
                    onChange={(e) => handleInputChange('itemWeight', parseFloat(e.target.value) || 0)}
                    min="1"
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">数量</label>
                  <input
                    type="number"
                    value={formData.itemQuantity}
                    onChange={(e) => handleInputChange('itemQuantity', parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">长 (cm)</label>
                  <input
                    type="number"
                    value={formData.itemLength}
                    onChange={(e) => handleInputChange('itemLength', parseFloat(e.target.value) || 0)}
                    min="1"
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">宽 (cm)</label>
                  <input
                    type="number"
                    value={formData.itemWidth}
                    onChange={(e) => handleInputChange('itemWidth', parseFloat(e.target.value) || 0)}
                    min="1"
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">高 (cm)</label>
                  <input
                    type="number"
                    value={formData.itemHeight}
                    onChange={(e) => handleInputChange('itemHeight', parseFloat(e.target.value) || 0)}
                    min="1"
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-sf-blue/20" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <User size={18} className="text-sf-red" />
                <h3 className="text-lg font-display text-sf-light">寄件人信息</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">姓名</label>
                  <input
                    type="text"
                    value={formData.sender_name}
                    onChange={(e) => handleInputChange('sender_name', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入寄件人姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">手机号</label>
                  <input
                    type="tel"
                    value={formData.sender_phone}
                    onChange={(e) => handleInputChange('sender_phone', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入手机号"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-sf-light/70 mb-2">详细地址</label>
                  <input
                    type="text"
                    value={formData.sender_address}
                    onChange={(e) => handleInputChange('sender_address', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入详细地址"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-sf-blue/20" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-sf-blue" />
                <h3 className="text-lg font-display text-sf-light">收件人信息</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">姓名</label>
                  <input
                    type="text"
                    value={formData.receiver_name}
                    onChange={(e) => handleInputChange('receiver_name', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入收件人姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">手机号</label>
                  <input
                    type="tel"
                    value={formData.receiver_phone}
                    onChange={(e) => handleInputChange('receiver_phone', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入手机号"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-sf-light/70 mb-2">详细地址</label>
                  <input
                    type="text"
                    value={formData.receiver_address}
                    onChange={(e) => handleInputChange('receiver_address', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入详细地址"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-sf-blue/20" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={18} className="text-sf-green" />
                <h3 className="text-lg font-display text-sf-light">楼层搬运信息</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">是否有电梯</label>
                  <div className="flex gap-2 h-11">
                    <button
                      type="button"
                      onClick={() => handleInputChange('has_elevator', 1)}
                      className={`flex-1 rounded-lg border transition-all ${
                        formData.has_elevator === 1
                          ? 'bg-sf-green/10 border-sf-green/50 text-sf-green'
                          : 'bg-sf-dark/50 border-sf-blue/20 text-sf-light/70 hover:border-sf-blue/40'
                      }`}
                    >
                      有电梯
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('has_elevator', 0)}
                      className={`flex-1 rounded-lg border transition-all ${
                        formData.has_elevator === 0
                          ? 'bg-sf-orange/10 border-sf-orange/50 text-sf-orange'
                          : 'bg-sf-dark/50 border-sf-blue/20 text-sf-light/70 hover:border-sf-blue/40'
                      }`}
                    >
                      无电梯
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">楼层数</label>
                  <input
                    type="number"
                    value={formData.floors}
                    onChange={(e) => handleInputChange('floors', parseInt(e.target.value) || 1)}
                    min="1"
                    max="60"
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">层高 (米)</label>
                  <input
                    type="number"
                    value={formData.floor_height}
                    onChange={(e) => handleInputChange('floor_height', parseFloat(e.target.value) || 2.8)}
                    min="2"
                    max="5"
                    step="0.1"
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Wrench size={18} className="text-sf-red" />
                <h3 className="text-lg font-display text-sf-light">拆装服务</h3>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sf-light/70">需要拆装服务：</span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('disassembly_required', 1)}
                    className={`px-4 h-9 rounded-lg border transition-all ${
                      formData.disassembly_required === 1
                        ? 'bg-sf-red/10 border-sf-red/50 text-sf-red'
                        : 'bg-sf-dark/50 border-sf-blue/20 text-sf-light/70 hover:border-sf-blue/40'
                    }`}
                  >
                    是
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('disassembly_required', 0)}
                    className={`px-4 h-9 rounded-lg border transition-all ${
                      formData.disassembly_required === 0
                        ? 'bg-sf-green/10 border-sf-green/50 text-sf-green'
                        : 'bg-sf-dark/50 border-sf-blue/20 text-sf-light/70 hover:border-sf-blue/40'
                    }`}
                  >
                    否
                  </button>
                </div>
              </div>

              {formData.disassembly_required === 1 && (
                <>
                  <p className="text-sf-light/50 text-sm mb-4">
                    选择专业拆装服务商，为您的大件物品提供安全可靠的拆装服务
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providers.map((provider, index) => (
                      <div
                        key={provider.id}
                        onClick={() => setSelectedProvider(index)}
                        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedProvider === index
                            ? 'border-sf-red bg-sf-red/5'
                            : 'border-sf-blue/20 bg-sf-dark/30 hover:border-sf-blue/40'
                        }`}
                      >
                        {selectedProvider === index && (
                          <div className="absolute top-4 right-4 w-6 h-6 bg-sf-red rounded-full flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-sf-blue/10 rounded-lg flex items-center justify-center">
                                <Wrench size={24} className="text-sf-blue" />
                              </div>
                              <div>
                                <h4 className="text-lg font-display text-sf-light">{provider.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center text-sf-yellow">
                                    {[...Array(5)].map((_, i) => (
                                      <span
                                        key={i}
                                        className={`text-sm ${
                                          i < Math.floor(provider.rating)
                                            ? 'text-sf-yellow'
                                            : 'text-sf-light/30'
                                        }`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                    <span className="ml-1 text-sf-light/70 text-sm">{provider.rating}</span>
                                  </div>
                                  <span className="text-sf-light/30">|</span>
                                  <span className="text-sf-light/50 text-sm">已预约 {provider.booked_count} 次</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-sf-light/70">
                                <MapPin size={14} className="text-sf-blue" />
                                <span>服务区域：{provider.service_area}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sf-light/70">
                                <Wrench size={14} className="text-sf-yellow" />
                                <span>服务项目：{provider.services}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sf-light/70">
                                <Phone size={14} className="text-sf-green" />
                                <span>联系电话：{provider.contact}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {formData.disassembly_required === 0 && (
                <div className="p-6 bg-sf-dark/50 rounded-xl text-center">
                  <div className="w-16 h-16 bg-sf-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-sf-green" />
                  </div>
                  <p className="text-sf-light">无需拆装服务</p>
                  <p className="text-sf-light/50 text-sm mt-1">物品已为可搬运状态，将直接进行搬运服务</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-sf-red" />
                <h3 className="text-lg font-display text-sf-light">预约上门时间</h3>
              </div>
              <p className="text-sf-light/50 text-sm mb-6">
                选择您方便的时间段，我们将安排专业人员准时上门服务
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">预约日期</label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => handleInputChange('appointment_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">时间段</label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map(slot => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => handleInputChange('appointment_time', slot.value)}
                        className={`h-11 px-3 rounded-lg border text-sm transition-all ${
                          formData.appointment_time === slot.value
                            ? 'bg-sf-red/10 border-sf-red/50 text-sf-red'
                            : 'bg-sf-dark/50 border-sf-blue/20 text-sf-light/70 hover:border-sf-blue/40'
                        }`}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm text-sf-light/70 mb-2">特殊说明（可选）</label>
                <textarea
                  value={formData.special_instructions}
                  onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors resize-none"
                  placeholder="如有特殊要求请在此说明，如：大件物品无法通过电梯、需要拆除防护栏等..."
                />
              </div>

              <div className="mt-6 p-4 bg-sf-yellow/10 rounded-lg border border-sf-yellow/30">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-sf-yellow shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sf-yellow font-medium">温馨提示</h4>
                    <ul className="text-sf-light/70 text-sm mt-2 space-y-1">
                      <li>• 请提前清理搬运通道，确保物品搬运路径畅通</li>
                      <li>• 贵重物品请提前做好包装保护</li>
                      <li>• 如需提前现场勘查，请备注说明，我们将安排工作人员免费上门勘测</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-sf-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={40} className="text-sf-green" />
              </div>
              <h3 className="text-xl font-display text-sf-light">确认订单信息</h3>
              <p className="text-sf-light/50 text-sm mt-1">请核对以下订单信息，确认无误后提交</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-sf-dark/50 rounded-xl">
                <h4 className="text-sf-light/70 text-sm mb-4">物品信息</h4>
                <div className="space-y-2 text-sf-light">
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">类别</span>
                    <span>{formData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">名称</span>
                    <span>{formData.itemName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">规格</span>
                    <span>{formData.itemLength}×{formData.itemWidth}×{formData.itemHeight} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">重量</span>
                    <span>{formData.itemWeight} kg × {formData.itemQuantity}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-sf-dark/50 rounded-xl">
                <h4 className="text-sf-light/70 text-sm mb-4">搬运信息</h4>
                <div className="space-y-2 text-sf-light">
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">电梯</span>
                    <span>{formData.has_elevator === 1 ? '有' : '无'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">楼层</span>
                    <span>{formData.floors} 层</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">层高</span>
                    <span>{formData.floor_height} 米</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">拆装服务</span>
                    <span>{formData.disassembly_required === 1 ? '需要' : '不需要'}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-sf-dark/50 rounded-xl">
                <h4 className="text-sf-light/70 text-sm mb-4">寄件人</h4>
                <div className="space-y-2 text-sf-light">
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">姓名</span>
                    <span>{formData.sender_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">手机</span>
                    <span>{formData.sender_phone}</span>
                  </div>
                  <div className="flex justify-between text-right">
                    <span className="text-sf-light/50 shrink-0">地址</span>
                    <span className="ml-4">{formData.sender_address}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-sf-dark/50 rounded-xl">
                <h4 className="text-sf-light/70 text-sm mb-4">收件人</h4>
                <div className="space-y-2 text-sf-light">
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">姓名</span>
                    <span>{formData.receiver_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sf-light/50">手机</span>
                    <span>{formData.receiver_phone}</span>
                  </div>
                  <div className="flex justify-between text-right">
                    <span className="text-sf-light/50 shrink-0">地址</span>
                    <span className="ml-4">{formData.receiver_address}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedProvider !== null && providers[selectedProvider] && (
              <div className="p-6 bg-sf-dark/50 rounded-xl">
                <h4 className="text-sf-light/70 text-sm mb-4">拆装服务商</h4>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-sf-blue/10 rounded-lg flex items-center justify-center">
                    <Wrench size={24} className="text-sf-blue" />
                  </div>
                  <div>
                    <div className="text-sf-light font-medium">{providers[selectedProvider].name}</div>
                    <div className="text-sf-light/50 text-sm">{providers[selectedProvider].service_area}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 bg-sf-dark/50 rounded-xl">
              <h4 className="text-sf-light/70 text-sm mb-4">预约时间</h4>
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-sf-red" />
                <span className="text-sf-light">
                  {formData.appointment_date} {timeSlots.find(t => t.value === formData.appointment_time)?.label}
                </span>
              </div>
            </div>

            <div className="p-6 bg-sf-red/5 rounded-xl border border-sf-red/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sf-light font-medium">费用明细</h4>
                  {feeEstimate?.breakdown && (
                    <div className="mt-3 space-y-2">
                      {feeEstimate.breakdown.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-sf-light/70">{item.name}</span>
                          <span className="text-sf-light/50 text-xs font-mono">{item.formula}</span>
                          <span className="text-sf-light">¥{item.value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sf-light/50 text-sm">预估总价</div>
                  <div className="text-3xl font-display text-sf-red mt-1">
                    ¥{feeEstimate?.total.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-10 pt-6 border-t border-sf-blue/20">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0 || loading}
            className="px-6 h-11 rounded-lg border border-sf-blue/30 text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一步
          </button>
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 h-11 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors"
            >
              下一步
              <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 h-11 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  提交中...
                </>
              ) : (
                '确认下单'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkOrder
