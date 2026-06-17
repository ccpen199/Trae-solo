import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Package,
  Scale,
  Box,
  Hash,
  MapPin,
  ArrowRight as ArrowRightIcon,
  Building2,
  ShieldCheck,
  Clock,
  Truck,
  Car,
  Snowflake,
  RectangleHorizontal,
  FileText,
  Check,
  Eye,
  Gavel,
} from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tag from '../../components/ui/Tag'
import { getVehicleTypes } from '../../services/common.api'
import { publishVehicle, PublishVehicleData } from '../../services/employer.api'
import { VEHICLE_TYPES } from '../../constants'

interface VehicleFormData {
  cargoType: string
  weight: number
  volume: number
  quantity: number
  vehicleTypeId: string
  pickupAddress: string
  deliveryAddress: string
  needLoading: boolean
  needUnloading: boolean
  floorFrom: number
  floorTo: number
  hasElevatorFrom: boolean
  hasElevatorTo: boolean
  budget: number
  enableBidding: boolean
  insuranceAmount: number
  scheduledAt: string
  description: string
}

const vehicleIconMap: Record<string, typeof Truck> = {
  car: Car,
  truck: Truck,
  'rectangle-horizontal': RectangleHorizontal,
  snowflake: Snowflake,
}

const cargoTypes = [
  '普通货物', '家具家电', '建材装修', '生鲜冷链',
  '易碎品', '贵重物品', '机械设备', '其他',
]

export default function PublishVehicle() {
  const navigate = useNavigate()
  const [showWaybillPreview, setShowWaybillPreview] = useState(false)

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<VehicleFormData>({
    defaultValues: {
      cargoType: '普通货物',
      weight: 0.5,
      volume: 2,
      quantity: 1,
      vehicleTypeId: 'small_truck',
      pickupAddress: '',
      deliveryAddress: '',
      needLoading: false,
      needUnloading: false,
      floorFrom: 1,
      floorTo: 1,
      hasElevatorFrom: true,
      hasElevatorTo: true,
      budget: 280,
      enableBidding: false,
      insuranceAmount: 1000,
      scheduledAt: '',
      description: '',
    },
  })

  const { data: vehicleTypes = VEHICLE_TYPES } = useQuery({
    queryKey: ['vehicleTypes'],
    queryFn: getVehicleTypes,
    initialData: VEHICLE_TYPES,
  })

  const needLoading = watch('needLoading')
  const needUnloading = watch('needUnloading')
  const budget = watch('budget')
  const insuranceAmount = watch('insuranceAmount')
  const enableBidding = watch('enableBidding')

  const floorFee = (() => {
    let fee = 0
    if (needLoading && !watch('hasElevatorFrom') && watch('floorFrom') > 1) {
      fee += (watch('floorFrom') - 1) * 20
    }
    if (needUnloading && !watch('hasElevatorTo') && watch('floorTo') > 1) {
      fee += (watch('floorTo') - 1) * 20
    }
    return fee
  })()

  const totalPrice = budget + Math.round(insuranceAmount * 0.005) + floorFee

  const publishMutation = useMutation({
    mutationFn: (data: PublishVehicleData) => publishVehicle(data),
    onSuccess: () => {
      navigate('/orders')
    },
  })

  const onSubmit = (data: VehicleFormData) => {
    publishMutation.mutate({
      title: `${data.cargoType}运输`,
      description: data.description,
      vehicleTypeId: data.vehicleTypeId,
      pickupAddress: data.pickupAddress,
      pickupLat: 22.5431,
      pickupLng: 114.0579,
      deliveryAddress: data.deliveryAddress,
      deliveryLat: 22.5431,
      deliveryLng: 114.0579,
      weight: data.weight,
      volume: data.volume,
      needLoading: data.needLoading,
      needUnloading: data.needUnloading,
      scheduledAt: data.scheduledAt,
      budget: data.budget,
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
          <h1 className="text-lg font-bold text-gray-900 ml-2">发布找车</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-gray-900">货物信息</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">货物类型</label>
              <div className="flex flex-wrap gap-2">
                {cargoTypes.map((type) => (
                  <Controller
                    key={type}
                    name="cargoType"
                    control={control}
                    render={({ field }) => (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => field.onChange(type)}
                        className={`
                          px-3 py-1.5 rounded-full text-sm font-medium transition-all
                          ${field.value === type
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                      >
                        {type}
                      </motion.button>
                    )}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-gray-400" /> 货物重量
                </label>
                <span className="text-sm font-bold text-orange-600">{watch('weight')} 吨</span>
              </div>
              <Controller
                name="weight"
                control={control}
                render={({ field }) => (
                  <input
                    type="range"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                )}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.1吨</span>
                <span>10吨</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-gray-400" /> 货物体积
                </label>
                <span className="text-sm font-bold text-orange-600">{watch('volume')} 方</span>
              </div>
              <Controller
                name="volume"
                control={control}
                render={({ field }) => (
                  <input
                    type="range"
                    min={0.5}
                    max={40}
                    step={0.5}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                )}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0.5方</span>
                <span>40方</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-gray-400" /> 件数
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setValue('quantity', Math.max(1, watch('quantity') - 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                >
                  -
                </button>
                <span className="text-2xl font-bold text-gray-900 w-12 text-center">{watch('quantity')}</span>
                <button
                  type="button"
                  onClick={() => setValue('quantity', Math.min(100, watch('quantity') + 1))}
                  className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600"
                >
                  +
                </button>
                <span className="text-sm text-gray-500 ml-2">件</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-gray-900">选择车型</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {vehicleTypes.map((vt, idx) => {
              const Icon = vehicleIconMap[vt.icon] || Truck
              const isRecommended = idx === 1
              const selected = watch('vehicleTypeId') === vt.id
              return (
                <Controller
                  key={vt.id}
                  name="vehicleTypeId"
                  control={control}
                  render={({ field }) => (
                    <motion.button
                      type="button"
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => field.onChange(vt.id)}
                      className={`
                        relative flex-shrink-0 w-28 p-4 rounded-2xl border-2 transition-all text-left
                        ${selected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                        }
                      `}
                    >
                      {isRecommended && (
                        <div className="absolute -top-2 -right-2">
                          <Tag color="orange" size="sm">推荐</Tag>
                        </div>
                      )}
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                        selected ? 'bg-orange-500' : 'bg-orange-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${selected ? 'text-white' : 'text-orange-600'}`} />
                      </div>
                      <div className="text-sm font-bold text-gray-800">{vt.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{vt.capacity}</div>
                      <div className="text-xs text-gray-400">{vt.volume}</div>
                    </motion.button>
                  )}
                />
              )
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-gray-900">运输路线</h2>
          </div>
          <div className="space-y-3">
            <Controller
              name="pickupAddress"
              control={control}
              rules={{ required: '请填写装货地址' }}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">装货地址</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-500" />
                    <input
                      {...field}
                      type="text"
                      placeholder="请输入装货地址"
                      className="w-full py-3.5 pl-10 pr-4 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  {errors.pickupAddress && (
                    <p className="mt-1 text-sm text-red-500">{errors.pickupAddress.message}</p>
                  )}
                </div>
              )}
            />

            <div className="flex items-center justify-center py-1">
              <div className="w-0.5 h-6 bg-gray-200 relative">
                <ArrowRightIcon className="w-4 h-4 text-gray-400 absolute -top-0.5 -left-1.5 bg-white" />
              </div>
            </div>

            <Controller
              name="deliveryAddress"
              control={control}
              rules={{ required: '请填写卸货地址' }}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">卸货地址</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-red-500" />
                    <input
                      {...field}
                      type="text"
                      placeholder="请输入卸货地址"
                      className="w-full py-3.5 pl-10 pr-4 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  {errors.deliveryAddress && (
                    <p className="mt-1 text-sm text-red-500">{errors.deliveryAddress.message}</p>
                  )}
                </div>
              )}
            />

            <div className="mt-3 h-32 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-1 text-orange-400" />
                <span className="text-sm">点击在地图上选择起止点</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-gray-900">搬运服务</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="needLoading"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`
                      p-4 rounded-xl border-2 transition-all text-left
                      ${field.value ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white'}
                    `}
                  >
                    <div className="text-sm font-bold text-gray-800">需要装货</div>
                    <div className="text-xs text-gray-500 mt-0.5">师傅帮忙搬上车</div>
                  </button>
                )}
              />
              <Controller
                name="needUnloading"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`
                      p-4 rounded-xl border-2 transition-all text-left
                      ${field.value ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white'}
                    `}
                  >
                    <div className="text-sm font-bold text-gray-800">需要卸货</div>
                    <div className="text-xs text-gray-500 mt-0.5">师傅帮忙搬下车</div>
                  </button>
                )}
              />
            </div>

            {(needLoading || needUnloading) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-gray-50 space-y-4">
                  {needLoading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">装货楼层</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{watch('floorFrom')} 楼</span>
                          <Controller
                            name="hasElevatorFrom"
                            control={control}
                            render={({ field }) => (
                              <button
                                type="button"
                                onClick={() => field.onChange(!field.value)}
                                className={`
                                  px-2.5 py-1 rounded-full text-xs font-medium transition-all
                                  ${field.value ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}
                                `}
                              >
                                {field.value ? '有电梯' : '无电梯'}
                              </button>
                            )}
                          />
                        </div>
                      </div>
                      <Controller
                        name="floorFrom"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="range"
                            min={1}
                            max={30}
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                        )}
                      />
                    </div>
                  )}

                  {needUnloading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">卸货楼层</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{watch('floorTo')} 楼</span>
                          <Controller
                            name="hasElevatorTo"
                            control={control}
                            render={({ field }) => (
                              <button
                                type="button"
                                onClick={() => field.onChange(!field.value)}
                                className={`
                                  px-2.5 py-1 rounded-full text-xs font-medium transition-all
                                  ${field.value ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}
                                `}
                              >
                                {field.value ? '有电梯' : '无电梯'}
                              </button>
                            )}
                          />
                        </div>
                      </div>
                      <Controller
                        name="floorTo"
                        control={control}
                        render={({ field }) => (
                          <input
                            type="range"
                            min={1}
                            max={30}
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                        )}
                      />
                    </div>
                  )}

                  {floorFee > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-500">楼层费</span>
                      <span className="text-sm font-bold text-orange-600">+¥{floorFee}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gavel className="w-5 h-5 text-orange-600" />
              <h2 className="text-base font-bold text-gray-900">运费出价</h2>
            </div>
            <Controller
              name="enableBidding"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={`
                    relative w-12 h-7 rounded-full transition-colors
                    ${field.value ? 'bg-orange-500' : 'bg-gray-300'}
                  `}
                >
                  <motion.div
                    animate={{ x: field.value ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                  />
                </button>
              )}
            />
          </div>

          {enableBidding && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-700">
                💡 开启竞价模式，多位司机将为您报价，您可选择最合适的接单
              </p>
            </div>
          )}

          <Controller
            name="budget"
            control={control}
            rules={{ required: '请输入运费', min: { value: 1, message: '运费不能为0' } }}
            render={({ field }) => (
              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-400">¥</span>
                  <input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="w-full py-4 pl-12 pr-4 text-4xl font-bold text-gray-900 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Tag color="green" size="sm">市场价约 ¥260-320</Tag>
                </div>
                {errors.budget && (
                  <p className="mt-2 text-sm text-red-500">{errors.budget.message}</p>
                )}
              </div>
            )}
          />
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-gray-900">货物保价</h2>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">保价金额</label>
              <span className="text-sm font-bold text-orange-600">¥{insuranceAmount.toLocaleString()}</span>
            </div>
            <Controller
              name="insuranceAmount"
              control={control}
              render={({ field }) => (
                <input
                  type="range"
                  min={0}
                  max={50000}
                  step={1000}
                  value={field.value}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              )}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>不保价</span>
              <span>5万元</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">保费（0.5%）</span>
              <span className="text-sm font-bold text-gray-700">¥{Math.round(insuranceAmount * 0.005)}</span>
            </div>
          </div>
        </Card>

        <Card>
          <button
            type="button"
            onClick={() => setShowWaybillPreview(!showWaybillPreview)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <h2 className="text-base font-bold text-gray-900">电子运单预览</h2>
            </div>
            <Eye className="w-5 h-5 text-gray-400" />
          </button>

          {showWaybillPreview && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
            >
              <div className="text-center mb-3">
                <div className="text-xs text-gray-500">城运通电子运单</div>
                <div className="text-sm font-mono font-bold text-gray-700 mt-1">CYT{Date.now()}</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">货物类型</span>
                  <span className="text-gray-800 font-medium">{watch('cargoType')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">重量/体积</span>
                  <span className="text-gray-800 font-medium">{watch('weight')}吨 / {watch('volume')}方</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">运费</span>
                  <span className="text-orange-600 font-bold">¥{budget}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                <div className="w-24 h-24 mx-auto bg-white rounded-lg flex items-center justify-center">
                  <div className="grid grid-cols-5 gap-0.5">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={`w-3 h-3 ${i % 3 === 0 ? 'bg-gray-800' : 'bg-white'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">运单二维码</p>
              </div>
            </motion.div>
          )}
        </Card>
      </form>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-lg border-t border-gray-100 p-4 z-40">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs text-gray-500">预计总费用</span>
            <div className="text-xl font-bold text-orange-600">¥{totalPrice}</div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>预计5分钟内接单</span>
          </div>
        </div>
        <Button
          type="submit"
          variant="cta"
          size="lg"
          fullWidth
          loading={publishMutation.isPending}
          onClick={handleSubmit(onSubmit)}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
        >
          立即叫车
        </Button>
      </div>
    </div>
  )
}
