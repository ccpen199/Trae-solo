import { motion } from 'framer-motion'
import { CheckCircle, PauseCircle, XCircle, ChevronRight } from 'lucide-react'
import type { InsuranceItem, InsuranceStatus, IdentityType } from './types'
import { insuranceData } from './mockData'

const statusConfig: Record<InsuranceStatus, { color: string; bgColor: string; icon: typeof CheckCircle }> = {
  '正常': { color: 'text-success', bgColor: 'bg-success/10', icon: CheckCircle },
  '停缴': { color: 'text-warning', bgColor: 'bg-warning/10', icon: PauseCircle },
  '终止': { color: 'text-danger', bgColor: 'bg-danger/10', icon: XCircle },
}

interface StatusTabProps {
  identityType: IdentityType
}

export default function StatusTab({ identityType }: StatusTabProps) {
  const items = insuranceData[identityType]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {items.map((item, index) => (
        <InsuranceCard key={item.type} item={item} index={index} />
      ))}
    </motion.div>
  )
}

function InsuranceCard({ item, index }: { item: InsuranceItem; index: number }) {
  const config = statusConfig[item.status]
  const StatusIcon = config.icon
  const progress = (item.months / item.totalMonths) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-medium text-gray-900">{item.type}</span>
        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${config.bgColor} ${config.color}`}>
          <StatusIcon size={12} />
          {item.status}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">参保起始时间</span>
          <span className="text-gray-700">{item.startDate}</span>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-400">累计缴费月数</span>
            <span className="text-gray-700">{item.months} / {item.totalMonths}月</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
              className={`h-full rounded-full ${item.status === '正常' ? 'bg-success' : item.status === '停缴' ? 'bg-warning' : 'bg-danger'}`}
            />
          </div>
        </div>

        {item.balance !== '-' && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">个人账户余额</span>
            <span className="text-gray-900 font-semibold">¥{item.balance}</span>
          </div>
        )}

        {item.monthlyDeposit !== '-' && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">本月划入</span>
            <span className="text-success font-medium">+¥{item.monthlyDeposit}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-400">最近缴费日期</span>
          <span className="text-gray-700">{item.lastDate}</span>
        </div>
      </div>

      <button className="w-full mt-4 pt-3 border-t border-gray-50 flex items-center justify-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors">
        查看明细
        <ChevronRight size={14} />
      </button>
    </motion.div>
  )
}
