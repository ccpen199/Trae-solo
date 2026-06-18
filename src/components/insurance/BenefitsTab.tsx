import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle, Clock, DollarSign } from 'lucide-react'
import { benefitsData } from './mockData'

type BenefitType = 'pension' | 'medical' | 'unemployment'

const tabs = [
  { key: 'pension' as const, label: '养老待遇' },
  { key: 'medical' as const, label: '医疗待遇' },
  { key: 'unemployment' as const, label: '失业待遇' },
]

export default function BenefitsTab() {
  const [activeType, setActiveType] = useState<BenefitType>('pension')
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const benefits = benefitsData[activeType]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActiveType(t.key)
              setExpandedIndex(null)
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeType === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    benefit.status === '正常发放' || benefit.status === '正常享受'
                      ? 'bg-success/10'
                      : 'bg-gray-100'
                  }`}>
                    {benefit.status === '正常发放' || benefit.status === '正常享受' ? (
                      <CheckCircle size={20} className="text-success" />
                    ) : (
                      <Clock size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{benefit.name}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{benefit.period}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold text-primary">
                      {benefit.amount !== '-' ? `¥${benefit.amount}` : '-'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {benefit.lastDate !== '-' ? `最近发放：${benefit.lastDate}` : '暂无发放记录'}
                    </div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform ${expandedIndex === index ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {expandedIndex === index && benefit.history.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-50"
                  >
                    <div className="p-5 pt-0">
                      <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                        <DollarSign size={14} />
                        历史发放记录
                      </div>
                      <div className="space-y-2">
                        {benefit.history.map((record, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm text-gray-500">{record.date}</span>
                            <span className="text-sm font-medium text-gray-900">{record.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
