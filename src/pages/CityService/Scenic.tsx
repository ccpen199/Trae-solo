import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MapPin, Calendar, ArrowLeft, X, Check, History, QrCode, Ticket } from 'lucide-react'
import { mockScenicSpots } from '@/data/mockData'
import type { ScenicSpot } from '@/types'

const bookingHistory = [
  { id: 1, spot: '无锡鼋头渚风景区', date: '2026-06-21', count: 2, amount: 176, status: '待使用', qr: 'YTZ-20260621001' },
  { id: 2, spot: '灵山大佛景区', date: '2026-06-10', count: 3, amount: 630, status: '已使用', qr: 'LS-20260610008' },
  { id: 3, spot: '无锡惠山古镇', date: '2026-05-28', count: 4, amount: 0, status: '已使用', qr: 'HS-20260528015' },
  { id: 4, spot: '无锡蠡园公园', date: '2026-05-15', count: 2, amount: 90, status: '已取消', qr: 'LY-20260515022' },
]

export default function Scenic() {
  const navigate = useNavigate()
  const [selectedSpot, setSelectedSpot] = useState<ScenicSpot | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [ticketCount, setTicketCount] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const openModal = (spot: ScenicSpot) => {
    setSelectedSpot(spot)
    setSelectedDate(spot.availableDates[0])
    setTicketCount(1)
    setShowModal(true)
  }

  const totalPrice = selectedSpot ? selectedSpot.ticketPrice * ticketCount : 0

  const handleConfirm = () => {
    setShowModal(false)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setShowHistory(true)
    }, 2000)
  }

  const statusColors: Record<string, string> = {
    '待使用': 'bg-primary-50 text-primary-500',
    '已使用': 'bg-success-light text-success',
    '已取消': 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/city-service')} className="p-1 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="section-title mb-0">景点预约</h1>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`ml-auto p-2 rounded-lg transition-colors ${showHistory ? 'bg-primary-50 text-primary-500' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <History className="w-5 h-5" />
          </button>
        </div>

        {showHistory ? (
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">我的预约记录</span>
              <span className="text-sm text-gray-400">{bookingHistory.length} 条</span>
            </div>
            {bookingHistory.map((booking) => (
              <div key={booking.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                        <Ticket className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{booking.spot}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {booking.date}
                          </span>
                          <span>× {booking.count}张</span>
                        </div>
                      </div>
                    </div>
                    <span className={`badge flex-shrink-0 ${statusColors[booking.status]}`}>{booking.status}</span>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400">订单金额</span>
                      <p className="text-xl font-bold text-red-500">{booking.amount === 0 ? '免费' : `¥${booking.amount}`}</p>
                    </div>
                    <div className="flex gap-2">
                      {booking.status === '待使用' && (
                        <>
                          <button className="btn-outline px-4 py-1.5 text-sm border-primary-300 text-primary-500 flex items-center gap-1">
                            <QrCode className="w-4 h-4" /> 入园码
                          </button>
                          <button className="btn-outline px-4 py-1.5 text-sm border-gray-300 text-gray-500">取消预约</button>
                        </>
                      )}
                      {booking.status === '已使用' && (
                        <>
                          <button className="btn-outline px-4 py-1.5 text-sm">查看凭证</button>
                          <button className="btn-primary px-4 py-1.5 text-sm">再次预约</button>
                        </>
                      )}
                      {booking.status === '已取消' && (
                        <button className="btn-primary px-4 py-1.5 text-sm">再次预约</button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-2 text-xs text-gray-400 flex items-center justify-between">
                  <span>订单号</span>
                  <span className="font-mono">{booking.qr}</span>
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowHistory(false)}
              className="w-full py-3.5 gradient-gold text-primary-900 rounded-xl font-semibold
                         hover:from-gold-300 hover:to-gold-400 active:from-gold-500 active:to-gold-600 transition-all"
            >
              浏览所有景点
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockScenicSpots.map((spot) => (
              <motion.div
                key={spot.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden card-hover"
                whileHover={{ y: -4 }}
              >
                <img
                  src={spot.image}
                  alt={spot.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{spot.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold text-gray-700">{spot.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{spot.address}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-red-500">
                        {spot.ticketPrice === 0 ? '免费' : `¥${spot.ticketPrice}`}
                      </span>
                      <span className="badge bg-success-light text-success">
                        <Calendar className="w-3 h-3 mr-1" />
                        {spot.availableDates.length}天可约
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openModal(spot)}
                    className="w-full mt-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium
                               hover:bg-primary-600 active:bg-primary-700 transition-colors"
                  >
                    立即预约
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && selectedSpot && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-gray-800">{selectedSpot.name}</h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="mb-5">
                <p className="text-sm font-medium text-gray-600 mb-2">选择日期</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSpot.availableDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all
                        ${selectedDate === date
                          ? 'border-primary-500 text-primary-500 bg-primary-50'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                      {date}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <p className="text-sm font-medium text-gray-600 mb-2">购票数量</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setTicketCount((c) => Math.max(1, c - 1))}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center
                               text-gray-500 hover:bg-gray-50 text-lg font-bold"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-lg font-semibold">{ticketCount}</span>
                  <button
                    onClick={() => setTicketCount((c) => Math.min(10, c + 1))}
                    className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center
                               text-gray-500 hover:bg-gray-50 text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">合计</p>
                  <p className="text-2xl font-bold text-red-500">{totalPrice === 0 ? '免费' : `¥${totalPrice}`}</p>
                </div>
                <button
                  onClick={handleConfirm}
                  className="btn-gold px-8"
                >
                  确认预约
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                       bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="w-14 h-14 rounded-full bg-success-light flex items-center justify-center">
              <Check className="w-7 h-7 text-success" />
            </div>
            <p className="text-lg font-bold text-gray-800">预约成功</p>
            <p className="text-sm text-gray-500">已加入我的预约记录</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
