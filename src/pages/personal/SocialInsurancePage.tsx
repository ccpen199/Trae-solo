import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Shield } from 'lucide-react'
import {
  insuranceAccounts,
  monthlyRecords,
  transferProgress,
  insuranceTypeLabels,
  insuranceTypeColors,
} from '@/mocks/data'
import type { InsuranceType } from '@/types'
import Timeline from '@/components/ui/Timeline'

const tabs: InsuranceType[] = [
  'pension',
  'medical',
  'unemployment',
  'injury',
  'maternity',
  'housing',
]

const statusBadgeMap: Record<string, string> = {
  paid: 'gov-badge-green',
  unpaid: 'gov-badge-red',
  adjusting: 'gov-badge-gold',
}

const statusLabelMap: Record<string, string> = {
  paid: '已缴',
  unpaid: '未缴',
  adjusting: '调整中',
}

const transferStatusLabel: Record<string, string> = {
  pending: '待处理',
  processing: '办理中',
  timeout: '已超时',
  completed: '已完成',
}

const transferStatusBadge: Record<string, string> = {
  pending: 'gov-badge-gray',
  processing: 'gov-badge-blue',
  timeout: 'gov-badge-red',
  completed: 'gov-badge-green',
}

const chartData = [...monthlyRecords].reverse()

export default function SocialInsurancePage() {
  const [activeTab, setActiveTab] = useState<InsuranceType>('pension')
  const currentAccount = insuranceAccounts.find(
    (a) => a.insuranceType === activeTab
  )!

  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">五险一金查询</h1>

      <div className="flex gap-1 border-b border-gov-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? 'text-gov-blue'
                : 'text-gov-text-secondary hover:text-gov-text'
            }`}
          >
            {insuranceTypeLabels[tab]}
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gov-blue"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="gov-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: insuranceTypeColors[activeTab] }}
            >
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="font-semibold text-lg text-gov-text">
              {insuranceTypeLabels[activeTab]}
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gov-text-secondary">账户余额</p>
              <p className="text-2xl font-mono font-bold text-gov-blue mt-1">
                ¥
                {currentAccount.accountBalance.toLocaleString('zh-CN', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gov-text-secondary">个人月缴</p>
              <p className="text-xl font-mono font-semibold text-gov-text mt-1">
                ¥{currentAccount.personalMonthly.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gov-text-secondary">单位月缴</p>
              <p className="text-xl font-mono font-semibold text-gov-text mt-1">
                ¥{currentAccount.companyMonthly.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gov-text-secondary">累计月数</p>
              <p className="text-xl font-mono font-semibold text-gov-text mt-1">
                {currentAccount.totalMonths} 个月
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="gov-card p-6">
        <h2 className="font-semibold text-gov-text mb-4">月度缴费记录</h2>
        <table className="gov-table">
          <thead>
            <tr>
              <th>月份</th>
              <th>缴费基数</th>
              <th>个人缴纳</th>
              <th>单位缴纳</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRecords.map((record) => (
              <tr key={record.month}>
                <td className="font-mono">{record.month}</td>
                <td className="font-mono">
                  ¥{record.base.toLocaleString()}
                </td>
                <td className="font-mono">
                  ¥{record.personalAmount.toFixed(2)}
                </td>
                <td className="font-mono">
                  ¥{record.companyAmount.toFixed(2)}
                </td>
                <td>
                  <span className={statusBadgeMap[record.status]}>
                    {statusLabelMap[record.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="gov-card p-6">
        <h2 className="font-semibold text-gov-text mb-4">近12个月缴费趋势</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF4" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => `¥${value.toLocaleString()}`}
            />
            <Legend />
            <Bar
              dataKey="personalAmount"
              name="个人缴纳"
              fill="#0D3B66"
              radius={[2, 2, 0, 0]}
            />
            <Bar
              dataKey="companyAmount"
              name="单位缴纳"
              fill="#D4A843"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="gov-card p-6">
        <h2 className="font-semibold text-gov-text mb-4">社保关系转移进度</h2>
        <div className="flex items-center gap-4 mb-4 text-sm">
          <span className="text-gov-text-secondary">
            转移编号：{transferProgress.transferId}
          </span>
          <span className="text-gov-text-secondary">
            {transferProgress.fromProvince} → {transferProgress.toProvince}
          </span>
          <span
            className={transferStatusBadge[transferProgress.status]}
          >
            {transferStatusLabel[transferProgress.status]}
          </span>
        </div>
        <Timeline steps={transferProgress.steps} />
      </div>
    </div>
  )
}
