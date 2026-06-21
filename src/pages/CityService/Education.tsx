import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CreditCard, Check, Clock } from 'lucide-react'
import { mockEducationPayments } from '@/data/mockData'

type TabKey = '待缴费' | '已缴费'

export default function Education() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('待缴费')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successName, setSuccessName] = useState('')

  const pending = mockEducationPayments.filter((p) => p.status === '待缴费')
  const paid = mockEducationPayments.filter((p) => p.status === '已缴费')
  const totalPending = pending.reduce((sum, p) => sum + p.items.reduce((s, i) => s + i.amount, 0), 0)

  const handlePay = (name: string) => {
    setSuccessName(name)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  const list = activeTab === '待缴费' ? pending : paid

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/city-service')} className="p-1 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="section-title mb-0">教育缴费</h1>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">待缴费总额</p>
              <p className="text-2xl font-bold text-red-500">¥{totalPending.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-gold-500" />
            </div>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          {(['待缴费', '已缴费'] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${activeTab === tab ? 'bg-white text-primary-500 shadow-sm' : 'text-gray-500'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {list.map((payment) => {
              const total = payment.items.reduce((s, i) => s + i.amount, 0)
              return (
                <div
                  key={payment.id}
                  className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800">{payment.schoolName}</h3>
                    <span className={`badge ${payment.status === '待缴费' ? 'bg-gold-50 text-gold-600' : 'bg-success-light text-success'}`}>
                      {payment.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-3">学生：{payment.studentName}</p>

                  <div className="space-y-1.5 mb-4">
                    {payment.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-500">{item.name}</span>
                        <span className="text-gray-700">¥{item.amount}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      截止：{payment.dueDate}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-red-500">¥{total.toLocaleString()}</span>
                      {payment.status === '待缴费' ? (
                        <button
                          onClick={() => handlePay(payment.schoolName)}
                          className="btn-primary px-4 py-1.5 text-sm"
                        >
                          立即缴费
                        </button>
                      ) : (
                        <button className="btn-outline px-4 py-1.5 text-sm border-primary-300 text-primary-400">
                          查看收据
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>

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
            <p className="text-lg font-bold text-gray-800">缴费成功</p>
            <p className="text-sm text-gray-500">{successName}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
