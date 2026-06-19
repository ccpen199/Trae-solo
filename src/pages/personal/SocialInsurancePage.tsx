import { useState, useMemo } from 'react'
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
import { Shield, Info } from 'lucide-react'
import {
  insuranceAccounts,
  monthlyRecords,
  transferProgress,
  insuranceTypeLabels,
  insuranceTypeColors,
} from '@/mocks/data'
import type { InsuranceType, MonthlyRecord } from '@/types'
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

interface InsurancePolicyInfo {
  topAlert: string
  balanceLabel?: string
  balanceNote?: string
  showBalance: boolean
  personalMonthlyNote?: string
  transferMode: 'show' | 'hide' | 'unemployment' | 'housing' | 'injury'
}

const insurancePolicyMap: Record<InsuranceType, InsurancePolicyInfo> = {
  pension: {
    topAlert: '养老保险由用人单位和职工共同缴纳，实行社会统筹与个人账户相结合。个人账户资金可依法继承，跨省就业可办理养老保险关系转移接续。',
    showBalance: true,
    transferMode: 'show',
  },
  medical: {
    topAlert: '医疗保险由用人单位和职工共同缴纳，建立统筹基金和个人账户。个人账户（门诊账户）资金可用于支付门诊费用、药店购药等，可按规定办理转移接续。',
    balanceNote: '余额为医保个人账户（门诊账户）资金',
    showBalance: true,
    transferMode: 'show',
  },
  unemployment: {
    topAlert: '失业保险由用人单位和职工共同缴纳，用于保障失业人员失业期间的基本生活。失业保险关系随本人转移，缴费年限累计计算。',
    balanceNote: '失业保险为统筹基金，无传统个人账户',
    showBalance: true,
    transferMode: 'unemployment',
  },
  injury: {
    topAlert: '工伤保险由用人单位缴纳，职工个人不缴纳工伤保险费。工伤保险实行省级统筹，不设立个人账户，不支持跨省转移接续。职工发生工伤时可按规定享受工伤保险待遇。',
    balanceNote: '工伤保险无个人账户',
    showBalance: true,
    personalMonthlyNote: '职工个人不缴费',
    transferMode: 'injury',
  },
  maternity: {
    topAlert: '生育保险由用人单位缴纳，职工个人不缴纳生育保险费。生育保险不设立个人账户，不支持跨省转移接续。职工生育时可按规定享受生育医疗费用和生育津贴待遇。',
    balanceNote: '生育保险无个人账户',
    showBalance: true,
    personalMonthlyNote: '职工个人不缴费',
    transferMode: 'injury',
  },
  housing: {
    topAlert: '住房公积金由用人单位和职工共同缴存，归职工个人所有。住房公积金由住房公积金管理中心独立管理，与社会保险分属不同管理体系。',
    balanceNote: '住房公积金由住房公积金管理中心独立管理',
    showBalance: true,
    transferMode: 'housing',
  },
}

function deriveMonthlyRecords(
  records: MonthlyRecord[],
  accountType: InsuranceType
): MonthlyRecord[] {
  return records.map((record) => {
    if (accountType === 'injury' || accountType === 'maternity') {
      return {
        ...record,
        personalAmount: 0,
        companyAmount: +(record.companyAmount * (164 / 2586)).toFixed(2),
      }
    }
    if (accountType === 'housing') {
      return {
        ...record,
        personalAmount: 1200,
        companyAmount: 1200,
      }
    }
    if (accountType === 'pension') {
      const ratio = 656 / 1266
      return {
        ...record,
        personalAmount: +(record.personalAmount * ratio).toFixed(2),
        companyAmount: +(record.companyAmount * (1640 / 2586)).toFixed(2),
      }
    }
    if (accountType === 'medical') {
      const ratio = 328 / 1266
      return {
        ...record,
        personalAmount: +(record.personalAmount * ratio).toFixed(2),
        companyAmount: +(record.companyAmount * (1148 / 2586)).toFixed(2),
      }
    }
    if (accountType === 'unemployment') {
      const ratio = 82 / 1266
      return {
        ...record,
        personalAmount: +(record.personalAmount * ratio).toFixed(2),
        companyAmount: +(record.companyAmount * (246 / 2586)).toFixed(2),
      }
    }
    return record
  })
}

export default function SocialInsurancePage() {
  const [activeTab, setActiveTab] = useState<InsuranceType>('pension')
  const currentAccount = insuranceAccounts.find(
    (a) => a.insuranceType === activeTab
  )!
  const policyInfo = insurancePolicyMap[activeTab]

  const derivedMonthlyRecords = useMemo(
    () => deriveMonthlyRecords(monthlyRecords, activeTab),
    [activeTab]
  )

  const chartData = useMemo(
    () => [...derivedMonthlyRecords].reverse(),
    [derivedMonthlyRecords]
  )

  const displayPersonalMonthly =
    activeTab === 'injury' || activeTab === 'maternity'
      ? 0
      : currentAccount.personalMonthly

  const displayAccountBalance =
    activeTab === 'injury' || activeTab === 'maternity'
      ? 0
      : currentAccount.accountBalance

  return (
    <div className="space-y-6">
      <h1 className="gov-section-title">五险一金查询</h1>

      <div className="flex gap-1 border-b border-gov-border flex-wrap">
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
          key={`alert-${activeTab}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <Info className="w-5 h-5 text-gov-blue mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gov-text leading-relaxed">
            {policyInfo.topAlert}
          </p>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`account-${activeTab}`}
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
              <p className="text-sm text-gov-text-secondary">
                账户余额
                {policyInfo.balanceNote && (
                  <span className="block text-xs text-gov-blue mt-0.5">
                    （{policyInfo.balanceNote}）
                  </span>
                )}
              </p>
              <p className="text-2xl font-mono font-bold text-gov-blue mt-1">
                {activeTab === 'injury' || activeTab === 'maternity' ? (
                  <span className="text-gov-text-secondary">—</span>
                ) : (
                  <>
                    ¥
                    {displayAccountBalance.toLocaleString('zh-CN', {
                      minimumFractionDigits: 2,
                    })}
                  </>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gov-text-secondary">
                个人月缴
                {policyInfo.personalMonthlyNote && (
                  <span className="block text-xs text-gov-blue mt-0.5">
                    （{policyInfo.personalMonthlyNote}）
                  </span>
                )}
              </p>
              <p className="text-xl font-mono font-semibold text-gov-text mt-1">
                {activeTab === 'injury' || activeTab === 'maternity' ? (
                  <span className="text-gov-text-secondary">—</span>
                ) : (
                  <>¥{displayPersonalMonthly.toFixed(2)}</>
                )}
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
            {derivedMonthlyRecords.map((record) => (
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

      <AnimatePresence mode="wait">
        <motion.div
          key={`transfer-${activeTab}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="gov-card p-6"
        >
          {policyInfo.transferMode === 'show' && (
            <>
              <h2 className="font-semibold text-gov-text mb-4">
                社保关系转移进度
              </h2>
              <div className="flex items-center gap-4 mb-4 text-sm flex-wrap">
                <span className="text-gov-text-secondary">
                  转移编号：{transferProgress.transferId}
                </span>
                <span className="text-gov-text-secondary">
                  {transferProgress.fromProvince} → {transferProgress.toProvince}
                </span>
                <span className={transferStatusBadge[transferProgress.status]}>
                  {transferStatusLabel[transferProgress.status]}
                </span>
              </div>
              <Timeline steps={transferProgress.steps} />
            </>
          )}

          {policyInfo.transferMode === 'unemployment' && (
            <>
              <h2 className="font-semibold text-gov-text mb-4">
                失业保险关系转移
              </h2>
              <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <Info className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gov-text mb-2">
                    失业保险关系转移按规定办理
                  </p>
                  <div className="flex items-center gap-4 mb-4 text-sm flex-wrap">
                    <span className="text-gov-text-secondary">
                      转移编号：{transferProgress.transferId}
                    </span>
                    <span className="text-gov-text-secondary">
                      {transferProgress.fromProvince} →{' '}
                      {transferProgress.toProvince}
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
            </>
          )}

          {policyInfo.transferMode === 'injury' && (
            <>
              <h2 className="font-semibold text-gov-text mb-4">
                关系转移说明
              </h2>
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gov-text">
                  {activeTab === 'injury'
                    ? '工伤保险为省级统筹，不支持跨省转移接续。职工在新就业地参保后，工伤保险关系自动建立。'
                    : '生育保险为市级统筹，不支持跨省转移接续。职工在新就业地参保后，生育保险关系自动建立。'}
                </p>
              </div>
            </>
          )}

          {policyInfo.transferMode === 'housing' && (
            <>
              <h2 className="font-semibold text-gov-text mb-4">
                住房公积金转移接续
              </h2>
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <Info className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gov-text">
                  公积金转移接续请至住房公积金服务专区办理。住房公积金由住房公积金管理中心独立管理，与社会保险分属不同管理体系。
                </p>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
