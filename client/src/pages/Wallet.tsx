import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api'
import { Payment } from '../types'
import { CreditCard, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, Plus, Clock, CheckCircle } from 'lucide-react'

export default function Wallet() {
  const { user, isAuthenticated } = useAuthStore()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchPayments = async () => {
      try {
        const { data } = await api.get('/payments/transactions')
        setPayments(data.data || data)
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [isAuthenticated])

  const typeIcons: Record<string, any> = {
    ESCROW_DEPOSIT: ArrowDownLeft,
    MILESTONE_RELEASE: ArrowUpRight,
    REFUND: ArrowDownLeft,
    WITHDRAWAL: ArrowUpRight,
    PLATFORM_FEE: CreditCard,
  }

  const typeLabels: Record<string, string> = {
    ESCROW_DEPOSIT: '资金托管',
    MILESTONE_RELEASE: '里程碑收款',
    REFUND: '退款',
    WITHDRAWAL: '提现',
    PLATFORM_FEE: '平台服务费',
  }

  const typeColors: Record<string, string> = {
    ESCROW_DEPOSIT: 'bg-blue-50 text-blue-600',
    MILESTONE_RELEASE: 'bg-green-50 text-green-600',
    REFUND: 'bg-green-50 text-green-600',
    WITHDRAWAL: 'bg-red-50 text-red-600',
    PLATFORM_FEE: 'bg-gray-100 text-gray-600',
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold mb-4">请先登录</h2>
        <Link to="/login" className="btn-primary">去登录</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">我的钱包</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white mb-8 shadow-xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-blue-100">账户余额</p>
            <p className="text-5xl font-bold mt-2">¥{user?.balance?.toLocaleString() || 0}</p>
            <p className="text-blue-100 mt-2">冻结金额：¥{user?.frozenBalance?.toLocaleString() || 0}</p>
          </div>
          <WalletIcon className="w-12 h-12 text-white/50" />
        </div>
        <div className="flex gap-3">
          <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur py-3 rounded-xl font-medium transition-colors">
            <Plus className="w-4 h-4 inline mr-1" /> 充值
          </button>
          <button className="flex-1 bg-white text-indigo-600 hover:bg-blue-50 py-3 rounded-xl font-medium transition-colors">
            提现
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-sm text-gray-500">累计收入</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ¥{payments
              .filter((p) => p.type === 'MILESTONE_RELEASE' && p.status === 'COMPLETED')
              .reduce((sum, p) => sum + p.amount, 0)
              .toLocaleString() || 0}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">累计支出</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            ¥{payments
              .filter((p) => p.type === 'ESCROW_DEPOSIT' && p.status === 'COMPLETED')
              .reduce((sum, p) => sum + p.amount, 0)
              .toLocaleString() || 0}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">交易笔数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{payments.length}</p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">交易记录</h3>

        {loading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无交易记录</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payments.map((p) => {
              const Icon = typeIcons[p.type] || CreditCard
              const isIncome = p.type === 'MILESTONE_RELEASE' || p.type === 'REFUND'
              return (
                <div key={p.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${typeColors[p.type] || 'bg-gray-100 text-gray-600'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {typeLabels[p.type] || p.type}
                        {p.task?.title && <span className="text-gray-400 font-normal ml-2">- {p.task.title}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(p.createdAt).toLocaleString()}</span>
                        {p.status === 'COMPLETED' && (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="w-3 h-3 mr-0.5" /> 已完成
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-gray-900'}`}>
                    {isIncome ? '+' : '-'}¥{p.amount.toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
