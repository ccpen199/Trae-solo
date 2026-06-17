import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gavel,
  MapPin,
  Clock,
  Users,
  AlertCircle,
  ChevronDown,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

interface BidOrder {
  id: string
  title: string
  pickup: string
  delivery: string
  cargoType: string
  vehicleType: string
  basePrice: number
  currentBid: number
  bidCount: number
  myBid?: number
  endTime: number
  distance: string
}

const mockBiddingOrders: BidOrder[] = [
  {
    id: '1',
    title: '电子产品长途运输',
    pickup: '朝阳区望京SOHO',
    delivery: '上海市浦东新区张江',
    cargoType: '电子产品',
    vehicleType: '6.8米厢货',
    basePrice: 3200,
    currentBid: 3450,
    bidCount: 8,
    myBid: 3500,
    endTime: 3600,
    distance: '1,250km',
  },
  {
    id: '2',
    title: '建材瓷砖批量运输',
    pickup: '大兴区亦庄开发区',
    delivery: '天津市滨海新区',
    cargoType: '建材瓷砖',
    vehicleType: '9.6米厢货',
    basePrice: 1800,
    currentBid: 1920,
    bidCount: 5,
    endTime: 7200,
    distance: '180km',
  },
  {
    id: '3',
    title: '生鲜冷链运输',
    pickup: '丰台区新发地',
    delivery: '济南市历下区',
    cargoType: '生鲜蔬菜',
    vehicleType: '6.8米冷藏',
    basePrice: 2500,
    currentBid: 2680,
    bidCount: 12,
    endTime: 1800,
    distance: '420km',
  },
]

function formatCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function DriverBidding() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({})

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-lg px-4 pt-2 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Gavel className="w-5 h-5 text-orange-500" />
            竞价中心
          </h1>
          <Tag color="orange" size="sm">{mockBiddingOrders.length} 单进行中</Tag>
        </div>

        <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3 border border-amber-100">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-700">
            <span className="font-semibold">防狙击机制：</span>
            最后 5 分钟内有新出价，竞价时间自动延长 5 分钟
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {mockBiddingOrders.map((order, index) => {
            const isExpanded = expandedId === order.id
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="!p-0 overflow-hidden">
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 pr-3">
                        <h3 className="text-base font-bold text-gray-900">{order.title}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Tag color="orange" size="sm">{order.vehicleType}</Tag>
                          <Tag color="purple" size="sm">{order.cargoType}</Tag>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 items-end">
                      <div>
                        <p className="text-xs text-gray-500">当前最高出价</p>
                        <p className="text-2xl font-extrabold text-orange-500">¥{order.currentBid}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">起拍 ¥{order.basePrice}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">距结束</p>
                        <motion.p
                          key={order.endTime}
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          className="text-xl font-bold text-red-500 font-mono"
                        >
                          {formatCountdown(order.endTime)}
                        </motion.p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          {order.bidCount} 人出价
                        </div>
                        {order.myBid && (
                          <Tag color="green" size="sm" className="mt-1.5">
                            我的出价 ¥{order.myBid}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-gray-50 pt-4">
                          <div className="space-y-2 mb-4">
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                              <span className="line-clamp-1">{order.pickup}</span>
                            </div>
                            <div className="ml-1 w-px h-4 bg-gray-300" />
                            <div className="flex items-start gap-2 text-sm text-gray-600">
                              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                              <span className="line-clamp-1">{order.delivery}</span>
                              <Tag color="cyan" size="sm" className="ml-auto">{order.distance}</Tag>
                            </div>
                          </div>

                          <div className="bg-orange-50 rounded-xl p-3 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                {order.myBid ? '修改出价' : '提交出价'}
                              </span>
                              <span className="text-xs text-orange-600 font-medium">
                                至少高于 ¥{order.currentBid + 10}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <div className="flex-1 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                                <Input
                                  type="number"
                                  placeholder="输入您的出价"
                                  value={bidAmounts[order.id] || ''}
                                  onChange={(e) =>
                                    setBidAmounts({ ...bidAmounts, [order.id]: e.target.value })
                                  }
                                  className="!pl-7 !py-2.5"
                                />
                              </div>
                              <Button
                                size="md"
                                className="!bg-gradient-to-r !from-orange-500 !to-amber-600 hover:!from-orange-600 hover:!to-amber-700 shadow-orange-500/30"
                              >
                                <Gavel className="w-4 h-4" />
                                出价
                              </Button>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {[order.currentBid + 50, order.currentBid + 100, order.currentBid + 200].map(
                              (amount) => (
                                <motion.button
                                  key={amount}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() =>
                                    setBidAmounts({ ...bidAmounts, [order.id]: String(amount) })
                                  }
                                  className="flex-1 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition-all"
                                >
                                  +¥{amount - order.currentBid}
                                </motion.button>
                              )
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
