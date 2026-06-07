import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, User, Users, DollarSign, Upload, Check, Clock, FileText, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

interface TransactionNode {
  id: number
  transaction_id: number
  node_type: 'contract' | 'loan' | 'transfer'
  status: 'pending' | 'processing' | 'completed'
  documents: string
  remark: string | null
  completed_at: string | null
  created_at: string
}

interface TransactionDetail {
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
  nodes: TransactionNode[]
}

const nodeConfig = {
  contract: { label: '签约', icon: FileText },
  loan: { label: '贷款', icon: DollarSign },
  transfer: { label: '过户', icon: Home },
}

const statusConfig = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-600' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
}

const stepOrder: Array<'contract' | 'loan' | 'transfer'> = ['contract', 'loan', 'transfer']

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-CN')
}

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const hasRole = useAuthStore(s => s.hasRole)
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingNode, setUpdatingNode] = useState<number | null>(null)
  const [uploadingNode, setUploadingNode] = useState<number | null>(null)

  const canEdit = hasRole('director', 'manager') || 
    (transaction && useAuthStore.getState().user?.id === transaction.agent_id)

  const fetchTransaction = async () => {
    if (!id) return
    setLoading(true)
    try {
      const result = await api.get<TransactionDetail>(`/transactions/${id}`)
      if (result.success && result.data) {
        setTransaction(result.data)
      } else {
        console.error('获取交易详情失败:', result.error)
      }
    } catch (err) {
      console.error('Failed to fetch transaction:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransaction()
  }, [id])

  const handleNodeStatus = async (nodeId: number, status: 'processing' | 'completed') => {
    if (!id || !canEdit) return
    setUpdatingNode(nodeId)
    try {
      await api.put(`/transactions/${id}/nodes/${nodeId}`, { status })
      await fetchTransaction()
    } catch (err) {
      console.error('Failed to update node status:', err)
    } finally {
      setUpdatingNode(null)
    }
  }

  const handleFileUpload = async (nodeId: number, file: File) => {
    if (!id || !canEdit) return
    setUploadingNode(nodeId)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await api.upload(`/upload`, formData)
      await fetchTransaction()
    } catch (err) {
      console.error('Failed to upload file:', err)
    } finally {
      setUploadingNode(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-500">
          <p>交易不存在</p>
          <button
            onClick={() => navigate('/transactions')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            返回交易列表
          </button>
        </div>
      </div>
    )
  }

  const completedSteps = transaction.nodes.filter(n => n.status === 'completed').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <button
          onClick={() => navigate('/transactions')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回交易列表
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{transaction.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  transaction.status === 'contract' && 'bg-blue-100 text-blue-700',
                  transaction.status === 'loan' && 'bg-amber-100 text-amber-700',
                  transaction.status === 'transfer' && 'bg-purple-100 text-purple-700',
                  transaction.status === 'completed' && 'bg-green-100 text-green-700',
                )}>
                  {transaction.status === 'contract' && '签约中'}
                  {transaction.status === 'loan' && '贷款中'}
                  {transaction.status === 'transfer' && '过户中'}
                  {transaction.status === 'completed' && '已完成'}
                </span>
                <span className="text-gray-500 text-sm">创建于 {formatDate(transaction.created_at)}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">总价</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(transaction.total_amount)}</div>
              <div className="text-sm text-green-600 mt-1">佣金: {formatCurrency(transaction.commission_amount)}</div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">交易进度</h2>
              <span className="text-sm text-gray-500">{completedSteps}/3 步骤已完成</span>
            </div>
            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${(completedSteps / 3) * 100}%` }}
                />
              </div>
              <div className="relative flex justify-between">
                {stepOrder.map((step, index) => {
                  const node = transaction.nodes.find(n => n.node_type === step)
                  const isCompleted = node?.status === 'completed'
                  const isProcessing = node?.status === 'processing'
                  const Icon = nodeConfig[step].icon
                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 transition-colors',
                        isCompleted && 'bg-green-500 border-green-500 text-white',
                        isProcessing && 'bg-blue-500 border-blue-500 text-white',
                        !isCompleted && !isProcessing && 'bg-white border-gray-300 text-gray-400',
                      )}>
                        {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span className={cn(
                        'mt-2 text-sm font-medium',
                        isCompleted ? 'text-green-600' : isProcessing ? 'text-blue-600' : 'text-gray-500'
                      )}>
                        {nodeConfig[step].label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {stepOrder.map((step, index) => {
            const node = transaction.nodes.find(n => n.node_type === step)
            if (!node) return null
            const Icon = nodeConfig[step].icon
            const prevStep = index > 0 ? stepOrder[index - 1] : null
            const prevNode = prevStep ? transaction.nodes.find(n => n.node_type === prevStep) : null
            const canStart = !prevStep || prevNode?.status === 'completed'

            return (
              <div key={step} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      node.status === 'completed' && 'bg-green-100 text-green-600',
                      node.status === 'processing' && 'bg-blue-100 text-blue-600',
                      node.status === 'pending' && 'bg-gray-100 text-gray-500',
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{nodeConfig[step].label}</h3>
                      <span className={cn(
                        'inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-full text-xs font-medium',
                        statusConfig[node.status].color,
                      )}>
                        {node.status === 'pending' && <Clock className="w-3 h-3" />}
                        {node.status === 'completed' && <Check className="w-3 h-3" />}
                        {statusConfig[node.status].label}
                      </span>
                      {node.completed_at && (
                        <p className="text-sm text-gray-500 mt-1">完成于 {formatDate(node.completed_at)}</p>
                      )}
                    </div>
                  </div>
                  {canEdit && canStart && node.status !== 'completed' && (
                    <div className="flex gap-2">
                      {node.status === 'pending' && (
                        <button
                          onClick={() => handleNodeStatus(node.id, 'processing')}
                          disabled={updatingNode === node.id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          {updatingNode === node.id && <Loader2 className="w-4 h-4 animate-spin" />}
                          开始处理
                        </button>
                      )}
                      {node.status === 'processing' && (
                        <button
                          onClick={() => handleNodeStatus(node.id, 'completed')}
                          disabled={updatingNode === node.id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          {updatingNode === node.id && <Loader2 className="w-4 h-4 animate-spin" />}
                          标记完成
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {canEdit && canStart && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">上传相关文件</span>
                      <div className="mt-2">
                        <label className={cn(
                          'inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors',
                          uploadingNode === node.id && 'opacity-50 cursor-not-allowed'
                        )}>
                          {uploadingNode === node.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <span className="text-sm">{uploadingNode === node.id ? '上传中...' : '选择文件'}</span>
                          <input
                            type="file"
                            className="hidden"
                            disabled={uploadingNode === node.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileUpload(node.id, file)
                            }}
                          />
                        </label>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">房源信息</span>
            </div>
            <p className="font-semibold text-gray-900">{transaction.house_title}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">客户信息</span>
            </div>
            <p className="font-semibold text-gray-900">{transaction.client_name}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">经纪人</span>
            </div>
            <p className="font-semibold text-gray-900">{transaction.agent_name}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
