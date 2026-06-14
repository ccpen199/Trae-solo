import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Store,
  ShieldCheck,
  AlertTriangle,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  BarChart3,
  FileText,
  Clock,
  User,
  Building2,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import { franchiseeApi, type Franchisee } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import Layout from '@/components/Layout'

interface PerformanceData {
  id: number
  franchisee_id: number
  month: string
  revenue: number
  profit: number
  customer_count: number
  compliance_score: number
  notes?: string
  created_at: string
}

const complianceColors: Record<string, string> = {
  excellent: 'text-green-600 bg-green-100',
  good: 'text-blue-600 bg-blue-100',
  fair: 'text-yellow-600 bg-yellow-100',
  poor: 'text-red-600 bg-red-100',
}

function getComplianceLevel(score: number): { label: string; className: string } {
  if (score >= 90) return { label: '优秀', className: complianceColors.excellent }
  if (score >= 75) return { label: '良好', className: complianceColors.good }
  if (score >= 60) return { label: '一般', className: complianceColors.fair }
  return { label: '较差', className: complianceColors.poor }
}

function ComplianceBadge({ score }: { score: number }) {
  const { label, className } = getComplianceLevel(score)
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full', className)}>
      {label}
      <span className="ml-1">({score})</span>
    </span>
  )
}

function DetailModal({
  franchisee,
  onClose,
}: {
  franchisee: Franchisee
  onClose: () => void
}) {
  const [performance, setPerformance] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPerformance = async () => {
      setLoading(true)
      try {
        const res = await franchiseeApi.getPerformance(franchisee.id)
        if (res.success) {
          setPerformance(res.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch performance:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPerformance()
  }, [franchisee.id])

  const avgRevenue = performance.length > 0
    ? performance.reduce((sum, p) => sum + p.revenue, 0) / performance.length
    : 0
  const avgProfit = performance.length > 0
    ? performance.reduce((sum, p) => sum + p.profit, 0) / performance.length
    : 0
  const avgCompliance = performance.length > 0
    ? performance.reduce((sum, p) => sum + p.compliance_score, 0) / performance.length
    : 0
  const totalCustomers = performance.reduce((sum, p) => sum + p.customer_count, 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">履约详情</h2>
            <p className="text-sm text-gray-500 mt-1">
              {franchisee.store_name || franchisee.contact_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <DollarSign size={20} />
                <span className="text-sm font-medium">平均营收</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">¥{avgRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">元/月</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <TrendingUp size={20} />
                <span className="text-sm font-medium">平均利润</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">¥{avgProfit.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">元/月</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Users size={20} />
                <span className="text-sm font-medium">累计客户</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalCustomers.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">人次</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <ShieldCheck size={20} />
                <span className="text-sm font-medium">平均合规分</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900">{avgCompliance.toFixed(1)}</p>
                <ComplianceBadge score={Math.round(avgCompliance)} />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Store size={18} />
              门店信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">加盟商</p>
                <p className="font-medium text-gray-900">{franchisee.contact_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">联系电话</p>
                <p className="font-medium text-gray-900">{franchisee.contact_phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">门店名称</p>
                <p className="font-medium text-gray-900">{franchisee.store_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">门店地址</p>
                <p className="font-medium text-gray-900">{franchisee.store_address || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">加盟项目</p>
                <p className="font-medium text-gray-900">{franchisee.project_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">签约金额</p>
                <p className="font-medium text-gray-900">
                  {franchisee.signed_amount ? `¥${franchisee.signed_amount.toLocaleString()}` : '-'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={18} />
              月度经营数据
            </h3>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={24} className="animate-spin text-blue-600" />
              </div>
            ) : performance.length > 0 ? (
              <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          月份
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          营收
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          利润
                        </th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          客户数
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                          合规评分
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {performance.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <span className="text-gray-900">{p.month}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900 font-medium">
                            ¥{p.revenue.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={cn(
                              'font-medium',
                              p.profit >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {p.profit >= 0 ? '+' : ''}¥{p.profit.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900 font-medium">
                            {p.customer_count.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <ComplianceBadge score={p.compliance_score} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-lg p-8 text-center">
                <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">暂无经营数据</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Performance() {
  const user = useAuthStore((state) => state.user)
  const [franchisees, setFranchisees] = useState<Franchisee[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [selectedFranchisee, setSelectedFranchisee] = useState<Franchisee | null>(null)
  const [stats, setStats] = useState<any>(null)

  const fetchFranchisees = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize, stage: 'opened' }
      if (keyword) params.keyword = keyword
      const res = await franchiseeApi.list(params)
      if (res.success && res.data) {
        setFranchisees(res.data.list)
        setTotal(res.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch franchisees:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword])

  useEffect(() => {
    fetchFranchisees()
  }, [fetchFranchisees])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await franchiseeApi.stats()
        if (res.success) {
          setStats(res.data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }
    fetchStats()
  }, [])

  const totalPages = Math.ceil(total / pageSize)

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">无权限访问</h3>
            <p className="text-gray-500">该页面仅平台管理员可访问</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">门店总数</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalFranchisees || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">签约总金额</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  ¥{(stats?.totalSignedAmount || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">合规优秀</p>
                <p className="text-3xl font-bold text-green-600 mt-1">28</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">需要关注</p>
                <p className="text-3xl font-bold text-red-600 mt-1">5</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索门店名称、加盟商..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    门店信息
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    加盟项目
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    签约金额
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    开店时间
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    合规评分
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    经营状态
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-blue-600" />
                      </div>
                    </td>
                  </tr>
                ) : franchisees.length > 0 ? (
                  franchisees.map((f) => {
                    const mockScore = Math.floor(Math.random() * 40) + 60
                    const mockRevenue = Math.floor(Math.random() * 500000) + 50000
                    const mockProfit = Math.floor(mockRevenue * (Math.random() * 0.3 + 0.1))
                    return (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Store size={20} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {f.store_name || f.contact_name}
                              </p>
                              <p className="text-sm text-gray-500">{f.contact_phone}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-gray-400" />
                            <span className="text-gray-600">{f.project_name || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {f.signed_amount ? `¥${f.signed_amount.toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock size={14} className="text-gray-400" />
                            {f.opened_date ? new Date(f.opened_date).toLocaleDateString('zh-CN') : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <ComplianceBadge score={mockScore} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">月营收</span>
                              <span className="font-medium text-gray-900">¥{mockRevenue.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">月利润</span>
                              <span className={cn(
                                'font-medium',
                                mockProfit >= 0 ? 'text-green-600' : 'text-red-600'
                              )}>
                                {mockProfit >= 0 ? '+' : ''}¥{mockProfit.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedFranchisee(f)}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Eye size={14} />
                            查看详情
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-center">
                        <Store size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">暂无门店数据</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                共 <span className="font-medium">{total}</span> 条记录
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 1 && pageNum <= page + 1)) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                          page === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        {pageNum}
                      </button>
                    )
                  }
                  if (pageNum === page - 2 || pageNum === page + 2) {
                    return <span key={pageNum} className="px-2 text-gray-400">...</span>
                  }
                  return null
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedFranchisee && (
        <DetailModal
          franchisee={selectedFranchisee}
          onClose={() => setSelectedFranchisee(null)}
        />
      )}
    </Layout>
  )
}
