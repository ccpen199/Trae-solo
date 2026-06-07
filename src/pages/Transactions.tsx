import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Home, User, Users, DollarSign, ChevronRight, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Transaction {
  id: number
  title: string
  house_id: number
  house_title: string
  client_id: number
  client_name: string
  agent_id: number
  agent_name: string
  status: 'contract' | 'loan' | 'transfer' | 'completed'
  total_amount: number
  commission_rate: number
  commission_amount: number
  created_at: string
}

const statusConfig = {
  contract: { label: '签约', color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  loan: { label: '贷款', color: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  transfer: { label: '过户', color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  completed: { label: '已完成', color: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700' },
}

const statuses: Array<'contract' | 'loan' | 'transfer' | 'completed'> = ['contract', 'loan', 'transfer', 'completed']

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(amount)
}

interface TransactionCardProps {
  transaction: Transaction
  onMove: (id: number, direction: 'left' | 'right') => void
  onClick: () => void
}

function TransactionCard({ transaction, onMove, onClick }: TransactionCardProps) {
  const currentIndex = statuses.indexOf(transaction.status)
  const canMoveLeft = currentIndex > 0
  const canMoveRight = currentIndex < statuses.length - 1

  return (
    <div
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <h4 className="font-semibold text-gray-900 mb-2 truncate">{transaction.title}</h4>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center text-gray-600">
          <Home className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
          <span className="truncate">{transaction.house_title}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <User className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
          <span>{transaction.client_name}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Users className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
          <span>{transaction.agent_name}</span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">总价</span>
          <span className="font-medium text-gray-900">{formatCurrency(transaction.total_amount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">佣金</span>
          <span className="font-medium text-green-600">{formatCurrency(transaction.commission_amount)}</span>
        </div>
      </div>
      <div className="mt-3 flex gap-1" onClick={(e) => e.stopPropagation()}>
        {canMoveLeft && (
          <button
            onClick={() => onMove(transaction.id, 'left')}
            className="flex-1 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors flex items-center justify-center"
          >
            <ChevronRight className="w-3 h-3 mr-0.5 rotate-180" />
            上一步
          </button>
        )}
        {canMoveRight && (
          <button
            onClick={() => onMove(transaction.id, 'right')}
            className="flex-1 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center justify-center"
          >
            下一步
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </button>
        )}
      </div>
    </div>
  )
}

interface ColumnProps {
  status: 'contract' | 'loan' | 'transfer' | 'completed'
  transactions: Transaction[]
  onMove: (id: number, direction: 'left' | 'right') => void
  onCardClick: (id: number) => void
  loading: boolean
}

function Column({ status, transactions, onMove, onCardClick, loading }: ColumnProps) {
  const config = statusConfig[status]

  return (
    <div className={cn('flex-1 min-w-72 rounded-xl border p-4', config.color)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{config.label}</h3>
        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', config.badge)}>
          {transactions.length}
        </span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          暂无交易
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              onMove={onMove}
              onClick={() => onCardClick(tx.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Transactions() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [movingId, setMovingId] = useState<number | null>(null)

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const result = await api.get<Transaction[]>('/transactions', { keyword, pageSize: 100 })
      if (result.success && result.data) {
        setTransactions(result.data || [])
      } else {
        console.error('获取交易列表失败:', result.error)
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [keyword])

  const handleMove = async (id: number, direction: 'left' | 'right') => {
    const tx = transactions.find(t => t.id === id)
    if (!tx) return

    const currentIndex = statuses.indexOf(tx.status)
    const newIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1
    const newStatus = statuses[newIndex]

    if (!newStatus) return

    setMovingId(id)
    try {
      const result = await api.put(`/transactions/${id}/status`, { status: newStatus })
      if (!result.success) {
        console.error('更新交易状态失败:', result.error)
        return
      }
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
    } catch (err) {
      console.error('Failed to move transaction:', err)
    } finally {
      setMovingId(null)
    }
  }

  const handleCardClick = (id: number) => {
    navigate(`/transactions/${id}`)
  }

  const handleAddTransaction = () => {
    navigate('/transactions/new')
  }

  const transactionsByStatus = statuses.reduce((acc, status) => {
    acc[status] = transactions.filter(tx => tx.status === status)
    return acc
  }, {} as Record<string, Transaction[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">交易管理</h1>
            <p className="text-gray-500 mt-1">管理所有房产交易流程</p>
          </div>
          <button
            onClick={handleAddTransaction}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            新增交易
          </button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索交易标题、房源、客户..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {statuses.map((status) => (
            <Column
              key={status}
              status={status}
              transactions={transactionsByStatus[status] || []}
              onMove={handleMove}
              onCardClick={handleCardClick}
              loading={loading && movingId === null}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
