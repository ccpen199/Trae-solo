import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Sofa,
  Tv,
  Shirt,
  Package as PackageIcon,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Building2,
  Sparkles,
  Crown,
  Check,
  Star,
  AlertTriangle,
  Box,
  Truck,
  Clock,
} from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tag from '../../components/ui/Tag'
import { publishMoving, PublishMovingData } from '../../services/employer.api'

interface MovingItem {
  id: string
  name: string
  volume: number
  quantity: number
}

interface MovingFormData {
  items: {
    furniture: MovingItem[]
    appliance: MovingItem[]
    clothing: MovingItem[]
    sundries: MovingItem[]
  }
  fromAddress: string
  toAddress: string
  hasElevatorFrom: boolean
  hasElevatorTo: boolean
  floorFrom: number
  floorTo: number
  packageType: 'standard' | 'premium' | 'japanese'
  specialItems: string[]
  needWorkers: number
  scheduledAt: string
  budget: number
  description: string
}

const categoryConfig = {
  furniture: { name: '家具', icon: Sofa, color: 'purple' as const, defaultItems: [
    { id: 'f1', name: '双人床', volume: 1.5, quantity: 0 },
    { id: 'f2', name: '衣柜', volume: 2.0, quantity: 0 },
    { id: 'f3', name: '沙发', volume: 1.8, quantity: 0 },
    { id: 'f4', name: '餐桌', volume: 0.8, quantity: 0 },
    { id: 'f5', name: '书桌', volume: 0.6, quantity: 0 },
  ]},
  appliance: { name: '家电', icon: Tv, color: 'blue' as const, defaultItems: [
    { id: 'a1', name: '冰箱', volume: 0.8, quantity: 0 },
    { id: 'a2', name: '洗衣机', volume: 0.5, quantity: 0 },
    { id: 'a3', name: '电视', volume: 0.3, quantity: 0 },
    { id: 'a4', name: '空调', volume: 0.4, quantity: 0 },
    { id: 'a5', name: '热水器', volume: 0.3, quantity: 0 },
  ]},
  clothing: { name: '衣物', icon: Shirt, color: 'pink' as const, defaultItems: [
    { id: 'c1', name: '整理箱（大）', volume: 0.15, quantity: 0 },
    { id: 'c2', name: '整理箱（中）', volume: 0.08, quantity: 0 },
    { id: 'c3', name: '编织袋', volume: 0.1, quantity: 0 },
  ]},
  sundries: { name: '杂物', icon: PackageIcon, color: 'orange' as const, defaultItems: [
    { id: 's1', name: '纸箱（大）', volume: 0.12, quantity: 0 },
    { id: 's2', name: '纸箱（中）', volume: 0.06, quantity: 0 },
    { id: 's3', name: '纸箱（小）', volume: 0.03, quantity: 0 },
  ]},
}

const specialItemsList = [
  { id: 'piano', name: '钢琴', icon: '🎹', extraFee: 500 },
  { id: 'mahogany', name: '红木家具', icon: '🪵', extraFee: 300 },
  { id: 'fish_tank', name: '鱼缸', icon: '🐠', extraFee: 200 },
  { id: 'safe', name: '保险柜', icon: '🔐', extraFee: 200 },
  { id: 'gym', name: '健身器材', icon: '🏋️', extraFee: 150 },
  { id: 'art', name: '艺术品', icon: '🎨', extraFee: 300 },
]

const packageTypes = [
  {
    id: 'standard' as const,
    name: '标准搬家',
    price: 399,
    icon: Truck,
    features: ['基础搬运服务', '简单家具拆装', '常规防护包装', '运输保险1万'],
    recommended: false,
    color: 'gray',
  },
  {
    id: 'premium' as const,
    name: '精品搬家',
    price: 699,
    icon: Sparkles,
    features: ['标准服务全含', '专业家具拆装', '防损气泡膜包装', '运输保险5万', '专人全程跟踪'],
    recommended: true,
    color: 'purple',
  },
  {
    id: 'japanese' as const,
    name: '日式搬家',
    price: 1299,
    icon: Crown,
    features: ['精品服务全含', '全屋整理打包', '家具精细包装', '运输保险20万', '还原摆放到位', '深度清洁服务'],
    recommended: false,
    color: 'gold',
  },
]

export default function PublishMoving() {
  const navigate = useNavigate()
  const [expandedCategory, setExpandedCategory] = useState<string>('furniture')

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<MovingFormData>({
    defaultValues: {
      items: {
        furniture: categoryConfig.furniture.defaultItems,
        appliance: categoryConfig.appliance.defaultItems,
        clothing: categoryConfig.clothing.defaultItems,
        sundries: categoryConfig.sundries.defaultItems,
      },
      fromAddress: '',
      toAddress: '',
      hasElevatorFrom: true,
      hasElevatorTo: true,
      floorFrom: 1,
      floorTo: 1,
      packageType: 'premium',
      specialItems: [],
      needWorkers: 2,
      scheduledAt: '',
      budget: 699,
      description: '',
    },
  })

  const packageType = watch('packageType')
  const selectedPackage = packageTypes.find((p) => p.id === packageType)!
  const specialItems = watch('specialItems')

  const toggleSpecialItem = (itemId: string) => {
    const current = specialItems || []
    if (current.includes(itemId)) {
      setValue('specialItems', current.filter((id) => id !== itemId))
    } else {
      setValue('specialItems', [...current, itemId])
    }
  }

  const updateItemQuantity = (
    category: keyof MovingFormData['items'],
    itemIndex: number,
    delta: number
  ) => {
    const items = watch(`items.${category}`)
    const newItems = [...items]
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      quantity: Math.max(0, newItems[itemIndex].quantity + delta),
    }
    setValue(`items.${category}`, newItems)
  }

  const addCustomItem = (category: keyof MovingFormData['items']) => {
    const items = watch(`items.${category}`)
    const newItem: MovingItem = {
      id: `custom-${Date.now()}`,
      name: '自定义物品',
      volume: 0.1,
      quantity: 1,
    }
    setValue(`items.${category}`, [...items, newItem])
  }

  const removeItem = (category: keyof MovingFormData['items'], itemIndex: number) => {
    const items = watch(`items.${category}`)
    const newItems = items.filter((_, i) => i !== itemIndex)
    setValue(`items.${category}`, newItems)
  }

  const totalVolume = Object.values(watch('items')).reduce((sum, categoryItems) => {
    return sum + categoryItems.reduce((catSum, item) => catSum + item.volume * item.quantity, 0)
  }, 0)

  const specialItemsFee = specialItems.reduce((sum, id) => {
    const item = specialItemsList.find((i) => i.id === id)
    return sum + (item?.extraFee || 0)
  }, 0)

  const floorFee = (() => {
    let fee = 0
    if (!watch('hasElevatorFrom') && watch('floorFrom') > 1) {
      fee += (watch('floorFrom') - 1) * 30
    }
    if (!watch('hasElevatorTo') && watch('floorTo') > 1) {
      fee += (watch('floorTo') - 1) * 30
    }
    return fee
  })()

  const recommendedVehicle = totalVolume < 4 ? '面包车' : totalVolume < 8 ? '小货车' : totalVolume < 15 ? '中货车' : '大货车'
  const totalPrice = selectedPackage.price + specialItemsFee + floorFee

  const publishMutation = useMutation({
    mutationFn: (data: PublishMovingData) => publishMoving(data),
    onSuccess: () => {
      navigate('/orders')
    },
  })

  const onSubmit = (data: MovingFormData) => {
    const allItems: string[] = []
    Object.values(data.items).forEach((categoryItems) => {
      categoryItems.forEach((item) => {
        if (item.quantity > 0) {
          allItems.push(`${item.name} x${item.quantity}`)
        }
      })
    })

    publishMutation.mutate({
      title: `${selectedPackage.name} - ${recommendedVehicle}`,
      description: data.description,
      fromAddress: data.fromAddress,
      fromLat: 22.5431,
      fromLng: 114.0579,
      toAddress: data.toAddress,
      toLat: 22.5431,
      toLng: 114.0579,
      hasElevator: data.hasElevatorFrom && data.hasElevatorTo,
      floorFrom: data.floorFrom,
      floorTo: data.floorTo,
      items: allItems,
      vehicleTypeId: 'small_truck',
      needWorkers: data.needWorkers,
      scheduledAt: data.scheduledAt,
      budget: totalPrice,
    })
  }

  return (
    <div className="pb-32">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-2">发布搬家</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
        <Card padded={false}>
          {Object.entries(categoryConfig).map(([key, config]) => {
            const Icon = config.icon
            const isExpanded = expandedCategory === key
            const categoryItems = watch(`items.${key as keyof MovingFormData['items']}`)
            const itemCount = categoryItems.reduce((sum, item) => sum + item.quantity, 0)

            return (
              <div key={key} className="border-b border-gray-50 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpandedCategory(isExpanded ? '' : key)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-${config.color}-100 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${config.color}-600`} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-gray-800">{config.name}</div>
                      <div className="text-xs text-gray-500">{itemCount} 件物品</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {categoryItems.map((item, idx) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-800">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.volume}方/件</div>
                            </div>
                            <div className="flex items-center gap-3">
                              {item.id.startsWith('custom-') && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(key as keyof MovingFormData['items'], idx)}
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => updateItemQuantity(key as keyof MovingFormData['items'], idx, -1)}
                                className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateItemQuantity(key as keyof MovingFormData['items'], idx, 1)}
                                className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white hover:bg-purple-700"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addCustomItem(key as keyof MovingFormData['items'])}
                          className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-medium hover:border-purple-400 hover:text-purple-500 transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus className="w-4 h-4" /> 添加自定义物品
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Box className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-gray-900">体积估算</h2>
            </div>
            <Tag color="purple" size="sm">AI智能估算</Tag>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50">
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="text-xs text-gray-500">预估总体积</span>
                <div className="text-3xl font-bold text-purple-600">{totalVolume.toFixed(1)} <span className="text-lg font-medium">方</span></div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500">推荐车型</span>
                <div className="text-sm font-bold text-purple-700 flex items-center gap-1">
                  <Truck className="w-4 h-4" />
                  {recommendedVehicle}
                </div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (totalVolume / 20) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0方</span>
              <span>10方</span>
              <span>20方+</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-gray-900">起止地址</h2>
          </div>
          <div className="space-y-3">
            <Controller
              name="fromAddress"
              control={control}
              rules={{ required: '请填写搬出地址' }}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">搬出地址</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-500" />
                    <input
                      {...field}
                      type="text"
                      placeholder="请输入搬出地址"
                      className="w-full py-3.5 pl-10 pr-4 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  {errors.fromAddress && (
                    <p className="mt-1 text-sm text-red-500">{errors.fromAddress.message}</p>
                  )}
                </div>
              )}
            />

            <div className="space-y-2 p-3 rounded-xl bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">楼层</span>
                <div className="flex items-center gap-2">
                  <Controller
                    name="floorFrom"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-16 px-3 py-1.5 rounded-lg border border-gray-200 text-center text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    )}
                  />
                  <span className="text-sm text-gray-600">楼</span>
                  <Controller
                    name="hasElevatorFrom"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                          ${field.value ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}
                        `}
                      >
                        {field.value ? '有电梯' : '无电梯'}
                      </button>
                    )}
                  />
                </div>
              </div>
            </div>

            <Controller
              name="toAddress"
              control={control}
              rules={{ required: '请填写搬入地址' }}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">搬入地址</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500" />
                    <input
                      {...field}
                      type="text"
                      placeholder="请输入搬入地址"
                      className="w-full py-3.5 pl-10 pr-4 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  {errors.toAddress && (
                    <p className="mt-1 text-sm text-red-500">{errors.toAddress.message}</p>
                  )}
                </div>
              )}
            />

            <div className="space-y-2 p-3 rounded-xl bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">楼层</span>
                <div className="flex items-center gap-2">
                  <Controller
                    name="floorTo"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="number"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="w-16 px-3 py-1.5 rounded-lg border border-gray-200 text-center text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    )}
                  />
                  <span className="text-sm text-gray-600">楼</span>
                  <Controller
                    name="hasElevatorTo"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                          ${field.value ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}
                        `}
                      >
                        {field.value ? '有电梯' : '无电梯'}
                      </button>
                    )}
                  />
                </div>
              </div>
            </div>

            {floorFee > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                <span className="text-sm text-amber-700">楼层搬运费（无电梯）</span>
                <span className="text-sm font-bold text-amber-700">+¥{floorFee}</span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-gray-900">选择服务包</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {packageTypes.map((pkg) => {
              const Icon = pkg.icon
              const isSelected = packageType === pkg.id
              return (
                <Controller
                  key={pkg.id}
                  name="packageType"
                  control={control}
                  render={({ field }) => (
                    <motion.button
                      type="button"
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => field.onChange(pkg.id)}
                      className={`
                        relative p-3 rounded-2xl border-2 transition-all text-left
                        ${isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                        }
                      `}
                    >
                      {pkg.recommended && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                          <Tag color="purple" size="sm">推荐</Tag>
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 mx-auto ${
                        isSelected ? 'bg-purple-500' : 'bg-purple-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-800">{pkg.name}</div>
                        <div className="text-lg font-bold text-purple-600 mt-1">¥{pkg.price}</div>
                        <div className="text-xs text-gray-400">起</div>
                      </div>
                    </motion.button>
                  )}
                />
              )
            })}
          </div>

          <div className="mt-4 p-4 rounded-xl bg-gray-50">
            <div className="text-sm font-bold text-gray-800 mb-2">{selectedPackage.name}包含：</div>
            <div className="space-y-1.5">
              {selectedPackage.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-gray-900">特殊物品</h2>
            <Tag color="orange" size="sm">需额外收费</Tag>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {specialItemsList.map((item) => {
              const selected = specialItems.includes(item.id)
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSpecialItem(item.id)}
                  className={`
                    p-3 rounded-xl border-2 transition-all text-center
                    ${selected
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="text-xs font-medium text-gray-800">{item.name}</div>
                  <div className="text-xs text-orange-600 mt-0.5">+¥{item.extraFee}</div>
                </motion.button>
              )
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-gray-900">工人数量</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setValue('needWorkers', Math.max(1, watch('needWorkers') - 1))}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-bold text-gray-900">{watch('needWorkers')}</span>
              <span className="text-sm text-gray-500 ml-1">位师傅</span>
            </div>
            <button
              type="button"
              onClick={() => setValue('needWorkers', Math.min(10, watch('needWorkers') + 1))}
              className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white hover:bg-purple-700"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </Card>
      </form>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-lg border-t border-gray-100 p-4 z-40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Star className="w-3 h-3 text-amber-400" fill="#f59e0b" />
              <span>{selectedPackage.name}</span>
            </div>
            <div className="text-xl font-bold text-purple-600">¥{totalPrice}</div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>预计30分钟内上门</span>
          </div>
        </div>
        <Button
          type="submit"
          variant="cta"
          size="lg"
          fullWidth
          loading={publishMutation.isPending}
          onClick={handleSubmit(onSubmit)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          立即预约搬家
        </Button>
      </div>
    </div>
  )
}
