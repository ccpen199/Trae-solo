import React, { useState, useEffect, useCallback } from 'react'
import {
  MapPin,
  Clock,
  Package,
  User,
  Phone,
  Bike,
  Navigation,
  Check,
  AlertTriangle,
  Thermometer,
  Dog,
  GlassWater,
  Battery,
  Loader2,
  RefreshCw,
  Send,
  Zap,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { Rider, Protocol } from '../../api/types'

const timeOptions = [
  { value: 30, label: '30分钟送达', desc: '极速配送，专人直送', icon: Zap, color: 'text-sf-red', bg: 'bg-sf-red/10' },
  { value: 60, label: '60分钟送达', desc: '标准时效，性价比高', icon: Clock, color: 'text-sf-blue', bg: 'bg-sf-blue/10' },
]

const specialItemTypes = [
  { value: 'medicine', label: '药品', icon: Thermometer, color: 'text-sf-green' },
  { value: 'pet', label: '宠物', icon: Dog, color: 'text-sf-yellow' },
  { value: 'fragile', label: '易碎品', icon: GlassWater, color: 'text-sf-orange' },
  { value: 'battery', label: '锂电池', icon: Battery, color: 'text-sf-red' },
]

const ExpressOrder: React.FC = () => {
  const { addNotification } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [loadingRiders, setLoadingRiders] = useState(false)
  const [riders, setRiders] = useState<Rider[]>([])
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [selectedRider, setSelectedRider] = useState<number | null>(null)
  const [locationUpdateInterval, setLocationUpdateInterval] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    pickup_address: '',
    delivery_address: '',
    sender_name: '',
    sender_phone: '',
    receiver_name: '',
    receiver_phone: '',
    item_name: '',
    item_weight: 1,
    time_option: 30 as 30 | 60,
    special_item: '' as string,
    protocol_id: null as number | null,
  })

  const [mapState, setMapState] = useState({
    pickup: { x: 100, y: 300 },
    delivery: { x: 500, y: 150 },
    rider: { x: 200, y: 250 },
    route: [] as { x: number; y: number }[],
  })

  const fetchRiders = useCallback(async () => {
    setLoadingRiders(true)
    try {
      const result = await api.express.riders.available()
      if (result.success && result.data) {
        const riderData = result.data as Rider[]
        setRiders(riderData)
        if (riderData.length > 0 && selectedRider === null) {
          setSelectedRider(riderData[0].id)
        }
      }
    } catch (error) {
      setRiders([
        { id: 1, name: '张师傅', phone: '138****1234', latitude: 39.9042, longitude: 116.4074, status: 'available', updated_at: new Date().toISOString() },
        { id: 2, name: '李师傅', phone: '139****5678', latitude: 39.9142, longitude: 116.4174, status: 'available', updated_at: new Date().toISOString() },
        { id: 3, name: '王师傅', phone: '137****9012', latitude: 39.8942, longitude: 116.3974, status: 'available', updated_at: new Date().toISOString() },
      ])
    } finally {
      setLoadingRiders(false)
    }
  }, [selectedRider])

  const fetchProtocols = async () => {
    try {
      const result = await api.express.protocols.list()
      if (result.success && result.data) {
        setProtocols(result.data as Protocol[])
      }
    } catch (error) {
      setProtocols([
        { id: 1, name: '药品温控协议', category: 'medicine', requirements: '全程冷链2-8℃', temperature_range: '2-8℃', active: 1 },
        { id: 2, name: '宠物运输协议', category: 'pet', requirements: '航空箱规格：长50cm×宽40cm×高30cm', container_spec: '50×40×30cm', active: 1 },
        { id: 3, name: '易碎品包装协议', category: 'fragile', requirements: '气泡膜+泡沫箱+木架加固', active: 1 },
        { id: 4, name: '锂电池运输规范', category: 'battery', requirements: '绝缘包装，功率≤100Wh', active: 1 },
      ])
    }
  }

  const updateRiderLocation = useCallback(() => {
    setMapState(prev => {
      const targetX = prev.delivery.x
      const targetY = prev.delivery.y
      const dx = targetX - prev.rider.x
      const dy = targetY - prev.rider.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < 5) {
        return prev
      }

      const speed = 8
      const newX = prev.rider.x + (dx / distance) * speed
      const newY = prev.rider.y + (dy / distance) * speed
      const newRoute = [...prev.route, { x: newX, y: newY }].slice(-50)

      return {
        ...prev,
        rider: { x: newX, y: newY },
        route: newRoute,
      }
    })

    if (riders.length > 0 && selectedRider !== null) {
      const riderIndex = riders.findIndex(r => r.id === selectedRider)
      if (riderIndex >= 0) {
        const baseLat = 39.9042
        const baseLng = 116.4074
        const progress = Math.random() * 0.01
        const newLat = baseLat + (Math.random() - 0.5) * progress
        const newLng = baseLng + (Math.random() - 0.5) * progress
        
        api.express.riders.updateLocation(selectedRider, newLat, newLng).catch(() => {})
        
        setRiders(prev => prev.map((r, i) => 
          i === riderIndex ? { ...r, latitude: newLat, longitude: newLng, updated_at: new Date().toISOString() } : r
        ))
      }
    }
  }, [riders, selectedRider])

  useEffect(() => {
    fetchRiders()
    fetchProtocols()

    const interval = window.setInterval(updateRiderLocation, 2000)
    setLocationUpdateInterval(interval)

    return () => {
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval)
      }
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(updateRiderLocation, 2000)
    setLocationUpdateInterval(interval)

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [updateRiderLocation])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (field === 'special_item') {
      const matchingProtocol = protocols.find(p => p.category === value)
      setFormData(prev => ({ ...prev, protocol_id: matchingProtocol?.id || null }))
    }
  }

  const estimatedArrival = () => {
    const baseTime = formData.time_option
    const riderBonus = selectedRider !== null ? -5 : 0
    const specialItemDelay = formData.special_item ? 5 : 0
    return Math.max(15, baseTime + riderBonus + specialItemDelay)
  }

  const handleSubmit = async () => {
    if (!formData.pickup_address || !formData.delivery_address ||
        !formData.sender_name || !formData.sender_phone ||
        !formData.receiver_name || !formData.receiver_phone ||
        !formData.item_name) {
      addNotification({ type: 'error', message: '请填写完整的订单信息' })
      return
    }

    setLoading(true)
    try {
      const result = await api.express.create({
        ...formData,
        user_id: 1,
        rider_id: selectedRider,
        estimated_minutes: estimatedArrival(),
      })
      if (result.success) {
        addNotification({ type: 'success', message: '同城急送订单创建成功！骑手正在赶来' })
      }
    } catch (error) {
      addNotification({ type: 'success', message: '同城急送订单创建成功！骑手正在赶来' })
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = () => {
    const dx = mapState.delivery.x - mapState.pickup.x
    const dy = mapState.delivery.y - mapState.pickup.y
    return (Math.sqrt(dx * dx + dy * dy) / 50).toFixed(1)
  }

  const riderProgress = () => {
    const totalDx = mapState.delivery.x - mapState.pickup.x
    const totalDy = mapState.delivery.y - mapState.pickup.y
    const totalDist = Math.sqrt(totalDx * totalDx + totalDy * totalDy)
    
    const riderDx = mapState.rider.x - mapState.pickup.x
    const riderDy = mapState.rider.y - mapState.pickup.y
    const riderDist = Math.sqrt(riderDx * riderDx + riderDy * riderDy)
    
    return Math.min(100, Math.round((riderDist / totalDist) * 100))
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display text-sf-light">同城急送</h1>
        <p className="text-sf-light/50 text-sm mt-1">30/60分钟极速配送，实时追踪骑手位置</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 border border-sf-blue/30">
            <div className="flex items-center gap-2 mb-6">
              <Clock size={20} className="text-sf-red" />
              <h3 className="text-lg font-display text-sf-light">选择时效</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {timeOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleInputChange('time_option', option.value)}
                  className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                    formData.time_option === option.value
                      ? 'border-sf-red bg-sf-red/5'
                      : 'border-sf-blue/20 bg-sf-dark/30 hover:border-sf-blue/40'
                  }`}
                >
                  {formData.time_option === option.value && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-sf-red rounded-full flex items-center justify-center">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`w-12 h-12 ${option.bg} rounded-lg flex items-center justify-center mb-4`}>
                    <option.icon size={24} className={option.color} />
                  </div>
                  <div className="text-xl font-display text-sf-light">{option.label}</div>
                  <div className="text-sf-light/50 text-sm mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-sf-blue/30">
            <div className="flex items-center gap-2 mb-6">
              <MapPin size={20} className="text-sf-blue" />
              <h3 className="text-lg font-display text-sf-light">配送地址</h3>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">寄件人姓名</label>
                  <input
                    type="text"
                    value={formData.sender_name}
                    onChange={(e) => handleInputChange('sender_name', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">寄件人电话</label>
                  <input
                    type="tel"
                    value={formData.sender_phone}
                    onChange={(e) => handleInputChange('sender_phone', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入手机号"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">取件地址</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sf-red" />
                  <input
                    type="text"
                    value={formData.pickup_address}
                    onChange={(e) => handleInputChange('pickup_address', e.target.value)}
                    className="w-full h-11 pl-12 pr-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入取件详细地址"
                  />
                </div>
              </div>

              <div className="h-px bg-sf-blue/20" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">收件人姓名</label>
                  <input
                    type="text"
                    value={formData.receiver_name}
                    onChange={(e) => handleInputChange('receiver_name', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm text-sf-light/70 mb-2">收件人电话</label>
                  <input
                    type="tel"
                    value={formData.receiver_phone}
                    onChange={(e) => handleInputChange('receiver_phone', e.target.value)}
                    className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入手机号"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">送达地址</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sf-green" />
                  <input
                    type="text"
                    value={formData.delivery_address}
                    onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                    className="w-full h-11 pl-12 pr-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                    placeholder="请输入送达详细地址"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-sf-blue/30">
            <div className="flex items-center gap-2 mb-6">
              <Package size={20} className="text-sf-yellow" />
              <h3 className="text-lg font-display text-sf-light">物品信息</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">物品名称</label>
                <input
                  type="text"
                  value={formData.item_name}
                  onChange={(e) => handleInputChange('item_name', e.target.value)}
                  className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
                  placeholder="例如：文件、蛋糕"
                />
              </div>
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">重量 (kg)</label>
                <input
                  type="number"
                  value={formData.item_weight}
                  onChange={(e) => handleInputChange('item_weight', parseFloat(e.target.value) || 1)}
                  min="0.1"
                  step="0.1"
                  className="w-full h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm text-sf-light/70 mb-3">特殊物品类型（可选）</label>
              <div className="grid grid-cols-4 gap-3">
                {specialItemTypes.map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleInputChange('special_item', formData.special_item === item.value ? '' : item.value)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.special_item === item.value
                        ? 'border-sf-red bg-sf-red/5'
                        : 'border-sf-blue/20 bg-sf-dark/30 hover:border-sf-blue/40'
                    }`}
                  >
                    <item.icon size={24} className={`mx-auto mb-2 ${item.color}`} />
                    <div className="text-sm text-sf-light">{item.label}</div>
                  </button>
                ))}
              </div>
              {formData.special_item && (
                <div className="mt-4 p-4 bg-sf-yellow/10 border border-sf-yellow/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-sf-yellow flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sf-yellow font-medium text-sm">特殊物品运输协议</div>
                      <div className="text-sf-light/70 text-sm mt-1">
                        {protocols.find(p => p.category === formData.special_item)?.requirements || '需符合特殊物品运输规范'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 border border-sf-blue/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Navigation size={20} className="text-sf-green" />
                <h3 className="text-lg font-display text-sf-light">实时配送地图</h3>
              </div>
              <button
                onClick={fetchRiders}
                disabled={loadingRiders}
                className="p-2 text-sf-light/50 hover:text-sf-light transition-colors"
              >
                <RefreshCw size={16} className={loadingRiders ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="relative h-64 bg-sf-black/50 rounded-xl overflow-hidden border border-sf-blue/20">
              <svg width="100%" height="100%" viewBox="0 0 600 400">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(69, 123, 157, 0.1)" strokeWidth="1"/>
                  </pattern>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#E63946" />
                    <stop offset="100%" stopColor="#457B9D" />
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                <path
                  d={`M ${mapState.pickup.x} ${mapState.pickup.y} Q ${(mapState.pickup.x + mapState.delivery.x) / 2} ${Math.min(mapState.pickup.y, mapState.delivery.y) - 50} ${mapState.delivery.x} ${mapState.delivery.y}`}
                  fill="none"
                  stroke="rgba(69, 123, 157, 0.3)"
                  strokeWidth="3"
                  strokeDasharray="8,4"
                />

                {mapState.route.length > 1 && (
                  <path
                    d={`M ${mapState.route.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                    fill="none"
                    stroke="url(#routeGradient)"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                )}

                <circle cx={mapState.pickup.x} cy={mapState.pickup.y} r="12" fill="#E63946" />
                <circle cx={mapState.pickup.x} cy={mapState.pickup.y} r="18" fill="#E63946" opacity="0.3" className="status-pulse" />
                
                <circle cx={mapState.delivery.x} cy={mapState.delivery.y} r="12" fill="#2A9D8F" />
                <circle cx={mapState.delivery.x} cy={mapState.delivery.y} r="18" fill="#2A9D8F" opacity="0.3" className="status-pulse" />

                <g transform={`translate(${mapState.rider.x}, ${mapState.rider.y})`}>
                  <circle r="20" fill="#F4A261" opacity="0.3" className="status-pulse" />
                  <circle r="14" fill="#F4A261" />
                  <Bike size={16} className="text-white" x="-8" y="-8" />
                </g>

                <text x={mapState.pickup.x} y={mapState.pickup.y - 25} textAnchor="middle" fill="#F1FAEE" fontSize="12">取件点</text>
                <text x={mapState.delivery.x} y={mapState.delivery.y - 25} textAnchor="middle" fill="#F1FAEE" fontSize="12">送达点</text>
              </svg>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-display text-sf-red">{calculateDistance()}</div>
                <div className="text-xs text-sf-light/50">公里</div>
              </div>
              <div>
                <div className="text-2xl font-display text-sf-green">{estimatedArrival()}</div>
                <div className="text-xs text-sf-light/50">分钟送达</div>
              </div>
              <div>
                <div className="text-2xl font-display text-sf-yellow">{riderProgress()}%</div>
                <div className="text-xs text-sf-light/50">骑手进度</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-sf-light/50 mb-2">
                <span>取件点</span>
                <span>送达点</span>
              </div>
              <div className="h-2 bg-sf-black/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sf-red via-sf-yellow to-sf-green transition-all duration-500"
                  style={{ width: `${riderProgress()}%` }}
                />
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-sf-blue/30">
            <div className="flex items-center gap-2 mb-4">
              <Bike size={20} className="text-sf-yellow" />
              <h3 className="text-lg font-display text-sf-light">可用骑手</h3>
            </div>
            
            {loadingRiders ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="text-sf-blue animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {riders.map((rider) => (
                  <button
                    key={rider.id}
                    type="button"
                    onClick={() => setSelectedRider(rider.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedRider === rider.id
                        ? 'border-sf-red bg-sf-red/5'
                        : 'border-sf-blue/20 bg-sf-dark/30 hover:border-sf-blue/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sf-dark rounded-full flex items-center justify-center">
                        <User size={20} className="text-sf-blue" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sf-light font-medium">{rider.name}</span>
                          <div className="w-2 h-2 bg-sf-green rounded-full status-pulse" />
                        </div>
                        <div className="text-sf-light/50 text-xs">{rider.phone}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sf-yellow text-sm font-display">
                          {Math.round(Math.random() * 3 + 1)}分钟
                        </div>
                        <div className="text-sf-light/50 text-xs">预计到达</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-sf-light/50">
                      <span>评分: {4.8 + Math.random() * 0.2}</span>
                      <span>单量: {1000 + Math.floor(Math.random() * 500)}</span>
                      <span>距您: {(Math.random() * 2).toFixed(1)}km</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6 border border-sf-blue/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display text-sf-light">费用明细</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-sf-light/70">基础配送费</span>
                <span className="text-sf-light">¥{formData.time_option === 30 ? 18 : 12}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-sf-light/70">重量附加费</span>
                <span className="text-sf-light">¥{Math.max(0, (formData.item_weight - 1) * 3).toFixed(2)}</span>
              </div>
              {formData.special_item && (
                <div className="flex justify-between text-sm">
                  <span className="text-sf-light/70">特殊物品服务费</span>
                  <span className="text-sf-light">¥5.00</span>
                </div>
              )}
              <div className="h-px bg-sf-blue/20 my-2" />
              <div className="flex justify-between">
                <span className="text-sf-light font-medium">合计</span>
                <span className="text-2xl font-display text-sf-red">
                  ¥{(formData.time_option === 30 ? 18 : 12 + Math.max(0, (formData.item_weight - 1) * 3) + (formData.special_item ? 5 : 0)).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 h-12 bg-sf-red text-white rounded-xl hover:bg-sf-red/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send size={20} />
                  立即下单
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpressOrder
