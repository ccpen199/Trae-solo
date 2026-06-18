import { motion } from 'framer-motion'
import { History, RotateCcw } from 'lucide-react'
import type { HistoryRecord } from './types'
import { identityLabels } from './types'

interface HistoryRecordsProps {
  records: HistoryRecord[]
  onLoad: (record: HistoryRecord) => void
}

export default function HistoryRecords({ records, onLoad }: HistoryRecordsProps) {
  if (records.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="bg-white rounded-xl p-4 border border-gray-100"
    >
      <h3 className="font-medium text-gray-900 text-sm mb-3 flex items-center gap-2">
        <History size={16} className="text-gray-500" />
        历史测算记录
      </h3>
      <div className="space-y-2">
        {records.map((record, index) => (
          <motion.button
            key={record.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
            onClick={() => onLoad(record)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
          >
            <div>
              <div className="text-sm font-medium text-gray-900">
                {identityLabels[record.identity]}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {new Date(record.timestamp).toLocaleString('zh-CN')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-sm font-semibold text-primary">
                  ¥{record.result.monthlyTotal.toLocaleString()}/月
                </div>
                <div className="text-xs text-gray-500">
                  缴费{record.result.paymentYears}年
                </div>
              </div>
              <RotateCcw size={14} className="text-gray-400" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
