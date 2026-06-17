import { useState } from 'react'
import { Wallet, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Clock } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface WithdrawalRecord {
  id: string
  userId: string
  userType: 'rider' | 'merchant'
  name: string
  amount: number
  fee: number
  actualAmount: number
  payMethod: 'wechat' | 'alipay' | 'bank'
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed'
  createdAt: string
}

const overviewData = [
  { name: '平台收入', value: 128500, color: '#3B82F6' },
  { name: '骑手结算', value: 89200, color: '#10B981' },
  { name: '商户结算', value: 67800, color: '#F59E0B' },
  { name: '退款支出', value: 12400, color: '#EF4444' },
]

const mockWithdrawals: WithdrawalRecord[] = [
  { id: 'W001', userId: 'R001', userType: 'rider', name: '王建国', amount: 500, fee: 3, actualAmount: 497, payMethod: 'wechat', status: 'pending', createdAt: '2024-01-15 14:30' },
  { id: 'W002', userId: 'M001', userType: 'merchant', name: '美味餐厅', amount: 2000, fee: 12, actualAmount: 1988, payMethod: 'bank', status: 'pending', createdAt: '2024-01-15 13:00' },
  { id: 'W003', userId: 'R002', userType: 'rider', name: '李明', amount: 300, fee: 1.8, actualAmount: 298.2, payMethod: 'alipay', status: 'pending', createdAt: '2024-01-15 11:20' },
  { id: 'W004', userId: 'M002', userType: 'merchant', name: '鲜味轩', amount: 1500, fee: 9, actualAmount: 1491, payMethod: 'wechat', status: 'approved', createdAt: '2024-01-14 16:00' },
  { id: 'W005', userId: 'R003', userType: 'rider', name: '张伟', amount: 800, fee: 4.8, actualAmount: 795.2, payMethod: 'bank', status: 'completed', createdAt: '2024-01-14 10:00' },
  { id: 'W006', userId: 'M003', userType: 'merchant', name: '快捷便利', amount: 600, fee: 3.6, actualAmount: 596.4, payMethod: 'alipay', status: 'rejected', createdAt: '2024-01-13 15:00' },
]

const statusConfig: Record<WithdrawalRecord['status'], { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: '待审核', color: '#F59E0B', icon: Clock },
  approved: { label: '已通过', color: '#3B82F6', icon: CheckCircle2 },
  rejected: { label: '已拒绝', color: '#EF4444', icon: XCircle },
  processing: { label: '打款中', color: '#8B5CF6', icon: Clock },
  completed: { label: '已完成', color: '#10B981', icon: CheckCircle2 },
}

const payMethodLabels: Record<WithdrawalRecord['payMethod'], string> = {
  wechat: '微信',
  alipay: '支付宝',
  bank: '银行卡',
}

export default function AdminFinance() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>(mockWithdrawals)

  const pendingCount = withdrawals.filter((w) => w.status === 'pending').length
  const totalPending = withdrawals.filter((w) => w.status === 'pending').reduce((s, w) => s + w.amount, 0)

  const handleApprove = (id: string) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'approved' as const } : w)),
    )
  }

  const handleReject = (id: string) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'rejected' as const } : w)),
    )
  }

  return (
    <div className="space-y-6" style={{ backgroundColor: '#0F172A', minHeight: '100vh', padding: '1.5rem' }}>
      <h1 className="text-2xl font-bold text-white">运营财务</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">平台总收入</span>
              <Wallet className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">¥128.5K</div>
            <div className="text-xs text-green-400 mt-1">+8.2%</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">待审核</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{pendingCount}</div>
            <div className="text-xs text-gray-500 mt-1">¥{totalPending.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">骑手结算</span>
              <ArrowDownRight className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">¥89.2K</div>
          </div>
          <div className="bg-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">商户结算</span>
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">¥67.8K</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">收入构成</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={overviewData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                {overviewData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `¥${(value / 1000).toFixed(1)}K`}
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {overviewData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-gray-400">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">提现审核</h3>
          <span className="text-sm text-amber-400">{pendingCount} 笔待审核</span>
        </div>
        <div className="space-y-3">
          {withdrawals.map((w) => {
            const config = statusConfig[w.status]
            const StatusIcon = config.icon
            return (
              <div key={w.id} className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{w.name}</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: w.userType === 'rider' ? '#10B98120' : '#F59E0B20', color: w.userType === 'rider' ? '#10B981' : '#F59E0B' }}
                      >
                        {w.userType === 'rider' ? '骑手' : '商户'}
                      </span>
                      <span className="text-xs text-gray-500">{payMethodLabels[w.payMethod]}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {w.id} · {w.createdAt}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">¥{w.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">手续费 ¥{w.fee}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/30">
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className="w-3.5 h-3.5" style={{ color: config.color }} />
                    <span className="text-xs" style={{ color: config.color }}>{config.label}</span>
                  </div>
                  {w.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(w.id)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                      >
                        拒绝
                      </button>
                      <button
                        onClick={() => handleApprove(w.id)}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
                      >
                        通过
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
