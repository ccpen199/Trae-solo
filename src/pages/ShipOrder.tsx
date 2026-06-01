import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package,
  User,
  Phone,
  MapPin,
  Weight,
  Clock,
  ChevronRight,
  Check,
  Route,
  Truck,
  Zap,
  Loader2,
  Upload,
  QrCode,
  Mic,
  ArrowRight,
  BarChart3,
  Shield,
  TrendingUp,
  AlertCircle,
  Copy,
  ExternalLink,
  Info,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { RoutingOption, Order } from '../../api/types'

const steps = ['填写运单信息', '智能路由推荐', '确认下单']

const goodsTypes = [
  { value: '普通物品', label: '普通物品' },
  { value: '电子产品', label: '电子产品' },
  { value: '服装', label: '服装' },
  { value: '文件', label: '文件' },
  { value: '精密仪器', label: '精密仪器' },
  { value: '易碎品', label: '易碎品' },
  { value: '食品', label: '食品' },
  { value: '其他', label: '其他' },
]

const urgencyOptions = [
  { value: 'standard', label: '标准快递', desc: '3-4天送达', icon: Truck, color: 'text-sf-blue', bgColor: 'bg-sf-blue/10' },
  { value: 'express', label: '航空快递', desc: '2天内送达', icon: Route, color: 'text-sf-yellow', bgColor: 'bg-sf-yellow/10' },
  { value: 'urgent', label: '特快专递', desc: '次日送达', icon: Zap, color: 'text-sf-red', bgColor: 'bg-sf-red/10' },
]

const ShipOrder: React.FC = () => {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [routingOptions, setRoutingOptions] = useState<RoutingOption[]>([])
  const [selectedRouting, setSelectedRouting] = useState<number | null>(null)
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)
  const [orderChannel, setOrderChannel] = useState<'manual' | 'batch' | 'scan' | 'voice'>('manual')

  const [formData, setFormData] = useState({
    sender_name: '',
    sender_phone: '',
    sender_address: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    goods_type: '普通物品',
    weight: 1,
    urgency: 'standard' as 'standard' | 'express' | 'urgent',
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    if (currentStep === 1 && formData.goods_type && formData.weight > 0) {
      const fetchRouting = async () => {
        try {
          const result = await api.orders.routingOptions({
            goodsType: formData.goods_type,
            urgency: formData.urgency,
            weight: formData.weight,
            fromCity: formData.sender_address,
            toCity: formData.receiver_address,
          })
          if (result.success && result.data) {
            setRoutingOptions(result.data as RoutingOption[])
          }
        } catch (error) {
          console.error('Failed to fetch routing options:', error)
        }
      }
      fetchRouting()
    }
  }, [currentStep, formData.goods_type, formData.urgency, formData.weight, formData.sender_address, formData.receiver_address])

  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.sender_name || !formData.sender_phone || !formData.sender_address ||
          !formData.receiver_name || !formData.receiver_phone || !formData.receiver_address) {
        addNotification({ type: 'error', message: '请填写完整的收发件信息' })
        return
      }
      setCurrentStep(1)
    } else if (currentStep === 1) {
      if (selectedRouting === null) {
        addNotification({ type: 'error', message: '请选择承运方式' })
        return
      }
      setCurrentStep(2)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const result = await api.orders.create({
        ...formData,
        user_id: 1,
        routing_plan: routingOptions[selectedRouting!]?.reason,
        carrier: routingOptions[selectedRouting!]?.carrier,
      })
      if (result.success && result.data) {
        setCreatedOrder(result.data as Order)
        addNotification({ type: 'success', message: '运单创建成功！' })
      }
    } catch (error) {
      addNotification({ type: 'error', message: '创建运单失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  const copyOrderNo = () => {
    if (createdOrder?.tracking_no) {
      navigator.clipboard.writeText(createdOrder.tracking_no)
      addNotification({ type: 'success', message: '运单号已复制' })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-sf-green'
    if (score >= 75) return 'text-sf-yellow'
    return 'text-sf-orange'
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display text-sf-light">寄件下单</h1>
            <p className="text-sf-light/50 text-sm mt-1">多渠道下单入口，智能匹配最优承运方案</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/ship/batch')}
              className="flex items-center gap-2 px-4 py-2 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light/70 hover:border-sf-blue/40 hover:text-sf-light transition-colors"
            >
              <Upload size={16} />
              批量导入
            </button>
            <button
              onClick={() => navigate('/ship/scan')}
              className="flex items-center gap-2 px-4 py-2 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light/70 hover:border-sf-blue/40 hover:text-sf-light transition-colors"
            >
              <QrCode size={16} />
              扫码下单
            </button>
            <button
              onClick={() => navigate('/ship/voice')}
              className="flex items-center gap-2 px-4 py-2 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light/70 hover:border-sf-blue/40 hover:text-sf-light transition-colors"
            >
              <Mic size={16} />
              语音转单
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6">
          {[
            { key: 'manual', label: '手工填单', icon: Package, desc: '标准下单流程' },
            { key: 'batch', label: '批量导入', icon: Upload, desc: '电商API批量导入' },
            { key: 'scan', label: '扫码下单', icon: QrCode, desc: '小程序扫码下单' },
            { key: 'voice', label: '语音转单', icon: Mic, desc: '电话语音转单' },
          ].map(channel => (
            <button
              key={channel.key}
              onClick={() => {
                setOrderChannel(channel.key as any)
                if (channel.key !== 'manual') {
                  navigate(`/ship/${channel.key}`)
                }
              }}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                orderChannel === channel.key
                  ? 'border-sf-red bg-sf-red/5'
                  : 'border-sf-blue/20 bg-sf-dark/30 hover:border-sf-blue/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  orderChannel === channel.key ? 'bg-sf-red/20' : 'bg-sf-dark/50'
                }`}>
                  <channel.icon size={20} className={orderChannel === channel.key ? 'text-sf-red' : 'text-sf-light/50'} />
                </div>
                <div className="text-left">
                  <div className={`font-medium ${orderChannel === channel.key ? 'text-sf-light' : 'text-sf-light/70'}`}>
                    {channel.label}
                  </div>
                  <div className="text-xs text-sf-light/50">{channel.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {!createdOrder ? (
        <>
          <div className="flex items-center justify-center mb-10">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-display transition-all ${
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
                    className={`w-20 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-sf-green' : 'bg-sf-dark'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="glass rounded-2xl p-8 border border-sf-blue/30">
            {currentStep === 0 && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <User size={18} className="text-sf-red" />
                    <h3 className="text-lg font-display text-sf-light">寄件人信息</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="col-span-2">
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
                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="col-span-2">
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
                    <Package size={18} className="text-sf-yellow" />
                    <h3 className="text-lg font-display text-sf-light">物品信息</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-sf-light/70 mb-2">物品类型</label>
                      <select
                        value={formData.goods_type}
                        onChange={(e) => handleInputChange('goods_type', e.target.value)}
                        className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                      >
                        {goodsTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-sf-light/70 mb-2">重量 (kg)</label>
                      <input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 1)}
                        min="0.1"
                        step="0.1"
                        className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-sf-light/70 mb-2">时效要求</label>
                      <div className="flex gap-2 h-11">
                        {urgencyOptions.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleInputChange('urgency', opt.value)}
                            className={`flex-1 flex items-center justify-center gap-1 rounded-lg border transition-all ${
                              formData.urgency === opt.value
                                ? `${opt.bgColor} border-sf-red/50 text-sf-red`
                                : 'bg-sf-dark/50 border-sf-blue/20 text-sf-light/70 hover:border-sf-blue/40'
                            }`}
                          >
                            <opt.icon size={14} className={formData.urgency === opt.value ? opt.color : ''} />
                            <span className="text-xs">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-display text-sf-light mb-2">智能路由推荐</h3>
                    <p className="text-sf-light/50 text-sm">基于货品类型、时效要求和网点承载力，为您推荐以下承运方案</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-sf-blue/10 border border-sf-blue/30 rounded-lg">
                    <Info size={14} className="text-sf-blue" />
                    <span className="text-sf-blue text-xs">共 {routingOptions.length} 个推荐方案</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                    <div className="text-xs text-sf-light/50 mb-1">物品类型</div>
                    <div className="text-sf-light font-medium">{formData.goods_type}</div>
                  </div>
                  <div className="p-4 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                    <div className="text-xs text-sf-light/50 mb-1">重量</div>
                    <div className="text-sf-light font-medium">{formData.weight} kg</div>
                  </div>
                  <div className="p-4 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                    <div className="text-xs text-sf-light/50 mb-1">时效要求</div>
                    <div className="text-sf-light font-medium">{urgencyOptions.find(o => o.value === formData.urgency)?.label}</div>
                  </div>
                  <div className="p-4 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
                    <div className="text-xs text-sf-light/50 mb-1">距离估算</div>
                    <div className="text-sf-light font-medium">约 1,200 km</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {routingOptions.map((option, index) => {
                    const costDiff = option.cost - routingOptions[0]?.cost
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedRouting(index)}
                        className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedRouting === index
                            ? 'border-sf-red bg-sf-red/5'
                            : 'border-sf-blue/20 bg-sf-dark/30 hover:border-sf-blue/40'
                        }`}
                      >
                        {selectedRouting === index && (
                          <div className="absolute top-4 right-4 w-6 h-6 bg-sf-red rounded-full flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xl font-display text-sf-light">{option.carrier}</h4>
                                {index === 0 && (
                                  <span className="px-2 py-0.5 bg-sf-green/10 text-sf-green text-xs rounded">
                                    最优推荐
                                  </span>
                                )}
                              </div>
                              <div className={`px-2 py-0.5 bg-sf-blue/10 ${getScoreColor(option.score)} text-xs rounded font-mono`}>
                                综合评分 {option.score}
                              </div>
                            </div>
                            
                            <p className="text-sf-light/60 text-sm mt-2">{option.reason}</p>
                            
                            <div className="grid grid-cols-4 gap-4 mt-4">
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-8 h-8 bg-sf-blue/10 rounded-lg flex items-center justify-center">
                                  <Clock size={14} className="text-sf-blue" />
                                </div>
                                <div>
                                  <div className="text-sf-light/50 text-xs">时效</div>
                                  <div className="text-sf-light">{option.estimated_days}个工作日</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-8 h-8 bg-sf-green/10 rounded-lg flex items-center justify-center">
                                  <TrendingUp size={14} className="text-sf-green" />
                                </div>
                                <div>
                                  <div className="text-sf-light/50 text-xs">网点承载</div>
                                  <div className="text-sf-light">充足</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-8 h-8 bg-sf-yellow/10 rounded-lg flex items-center justify-center">
                                  <Shield size={14} className="text-sf-yellow" />
                                </div>
                                <div>
                                  <div className="text-sf-light/50 text-xs">保障</div>
                                  <div className="text-sf-light">全额保价</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <div className="w-8 h-8 bg-sf-red/10 rounded-lg flex items-center justify-center">
                                  <BarChart3 size={14} className="text-sf-red" />
                                </div>
                                <div>
                                  <div className="text-sf-light/50 text-xs">准时率</div>
                                  <div className="text-sf-light">98.5%</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-3xl font-display text-sf-red">
                              ¥{option.cost.toFixed(2)}
                            </div>
                            <div className="text-sf-light/50 text-sm mt-1">预估运费</div>
                            {costDiff !== 0 && (
                              <div className={`mt-2 text-xs ${costDiff > 0 ? 'text-sf-yellow' : 'text-sf-green'}`}>
                                {costDiff > 0 ? '+' : ''}¥{costDiff.toFixed(2)}
                                <span className="text-sf-light/50 ml-1">vs 标准</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="p-4 bg-sf-yellow/5 border border-sf-yellow/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-sf-yellow flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sf-yellow text-sm font-medium">费用差异说明</div>
                      <div className="text-sf-light/60 text-xs mt-1">
                        • 标准快递：陆运干线，经济实惠，适合普通物品
                        <br />
                        • 航空快递：航空运输，速度快，适合紧急物品
                        <br />
                        • 特快专递：优先配送，价格较高，适合高价值紧急物品
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-sf-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={40} className="text-sf-green" />
                  </div>
                  <h3 className="text-xl font-display text-sf-light">确认订单信息</h3>
                  <p className="text-sf-light/50 text-sm mt-1">请核对以下运单信息，确认无误后提交</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
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
                      <div className="flex justify-between">
                        <span className="text-sf-light/50">地址</span>
                        <span>{formData.sender_address}</span>
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
                      <div className="flex justify-between">
                        <span className="text-sf-light/50">地址</span>
                        <span>{formData.receiver_address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-sf-dark/50 rounded-xl">
                  <h4 className="text-sf-light/70 text-sm mb-4">物品与承运</h4>
                  <div className="grid grid-cols-4 gap-4 text-sf-light">
                    <div>
                      <div className="text-sf-light/50 text-sm">物品类型</div>
                      <div className="mt-1">{formData.goods_type}</div>
                    </div>
                    <div>
                      <div className="text-sf-light/50 text-sm">重量</div>
                      <div className="mt-1">{formData.weight} kg</div>
                    </div>
                    <div>
                      <div className="text-sf-light/50 text-sm">承运方式</div>
                      <div className="mt-1">{selectedRouting !== null ? routingOptions[selectedRouting]?.carrier : '-'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sf-light/50 text-sm">预估运费</div>
                      <div className="mt-1 text-2xl font-display text-sf-red">
                        ¥{selectedRouting !== null ? routingOptions[selectedRouting]?.cost.toFixed(2) : '0.00'}
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
        </>
      ) : (
        <div className="glass rounded-2xl p-8 border border-sf-green/30">
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-sf-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={48} className="text-sf-green" />
            </div>
            <h2 className="text-2xl font-display text-sf-light mb-2">运单创建成功！</h2>
            <p className="text-sf-light/50">您的运单已成功提交，快递员将尽快上门揽收</p>
          </div>

          <div className="max-w-md mx-auto space-y-6">
            <div className="p-6 bg-sf-dark/50 rounded-xl border border-sf-blue/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sf-light/50 text-sm">运单号</span>
                <button
                  onClick={copyOrderNo}
                  className="flex items-center gap-1 text-sf-blue text-sm hover:text-sf-blue/80 transition-colors"
                >
                  <Copy size={14} />
                  复制
                </button>
              </div>
              <div className="text-3xl font-display text-sf-light font-mono tracking-wider">
                {createdOrder.tracking_no || createdOrder.order_no}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-sf-dark/50 rounded-xl">
                <div className="text-xs text-sf-light/50 mb-1">预估运费</div>
                <div className="text-xl font-display text-sf-red">
                  ¥{createdOrder.cost?.toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="p-4 bg-sf-dark/50 rounded-xl">
                <div className="text-xs text-sf-light/50 mb-1">承运方式</div>
                <div className="text-lg text-sf-light">{createdOrder.carrier || '顺丰速运'}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-sf-green/5 rounded-lg border border-sf-green/20">
                <div className="w-8 h-8 bg-sf-green/10 rounded-lg flex items-center justify-center">
                  <Clock size={16} className="text-sf-green" />
                </div>
                <div>
                  <div className="text-sm text-sf-light">已下单</div>
                  <div className="text-xs text-sf-light/50">{new Date(createdOrder.created_at!).toLocaleString('zh-CN')}</div>
                </div>
                <Check size={16} className="text-sf-green ml-auto" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-sf-dark/30 rounded-lg border border-sf-blue/10">
                <div className="w-8 h-8 bg-sf-blue/10 rounded-lg flex items-center justify-center">
                  <Package size={16} className="text-sf-blue" />
                </div>
                <div>
                  <div className="text-sm text-sf-light">等待揽收</div>
                  <div className="text-xs text-sf-light/50">快递员即将上门</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => navigate('/track')}
                className="flex-1 h-11 rounded-lg border border-sf-blue/30 text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors flex items-center justify-center gap-2"
              >
                查看运单列表
                <ExternalLink size={14} />
              </button>
              <button
                onClick={() => navigate(`/track/${createdOrder.id}`)}
                className="flex-1 h-11 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors flex items-center justify-center gap-2"
              >
                查看轨迹详情
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShipOrder
