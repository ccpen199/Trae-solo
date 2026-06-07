import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Plus, User, Battery, Award, AlertCircle, CreditCard, TrendingUp, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Rider {
  id: number
  name: string
  phone: string
  device_model: string | null
  battery_health: number
  current_load: number
  max_load: number
  performance_rate: number
  is_novice: number
  status: string
  total_orders: number
  total_income: number
}

interface RiderDetail extends Rider {
  violations: Violation[]
  mentorships: {
    asMentor: Mentorship[]
    asMentee: Mentorship[]
  }
  noviceCards: NoviceCard[]
}

interface Violation {
  id: number
  type: string
  description: string | null
  penalty_points: number
  created_at: string
}

interface Mentorship {
  id: number
  mentor_id: number
  mentee_id: number
  mentor_name?: string
  mentee_name?: string
  status: string
  started_at: string
}

interface NoviceCard {
  id: number
  card_type: string
  reason: string | null
  used: number
  created_at: string
}

interface IncomeData {
  total_base_fee: number
  total_reward: number
  total_subsidy: number
  total_income: number
}

interface RiderParams {
  page: number
  pageSize: number
  status?: string
  is_novice?: number
  search?: string
}

export default function Riders() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [noviceFilter, setNoviceFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedRider, setSelectedRider] = useState<number | null>(null)
  const [riderDetail, setRiderDetail] = useState<RiderDetail | null>(null)
  const [incomeData, setIncomeData] = useState<IncomeData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [newRider, setNewRider] = useState({
    name: '',
    phone: '',
    device_model: '',
    battery_health: 100,
    max_load: 5,
    is_novice: 1,
  })
  const [showMentorModal, setShowMentorModal] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [showViolationModal, setShowViolationModal] = useState(false)
  const [mentorId, setMentorId] = useState('')
  const [cardType, setCardType] = useState('timeout_elimination')
  const [cardReason, setCardReason] = useState('')
  const [violationType, setViolationType] = useState('timeout')
  const [violationDesc, setViolationDesc] = useState('')
  const [violationPoints, setViolationPoints] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchRiders = useCallback(async () => {
    setLoading(true)
    try {
      const params: RiderParams = { page, pageSize }
      if (statusFilter !== 'all') params.status = statusFilter
      if (noviceFilter !== 'all') params.is_novice = noviceFilter === 'novice' ? 1 : 0
      if (search) params.search = search

      const data = await api.getRiders(params)
      setRiders(data.list)
      setTotal(data.total)
    } catch (error) {
      console.error('Failed to fetch riders:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, noviceFilter, search])

  const fetchRiderDetail = useCallback(async (id: number) => {
    setDetailLoading(true)
    try {
      const [detail, income] = await Promise.all([
        api.getRider(id),
        api.getRiderIncome(id),
      ])
      setRiderDetail(detail)
      setIncomeData(income)
    } catch (error) {
      console.error('Failed to fetch rider detail:', error)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRiders()
  }, [fetchRiders])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchRiders()
      } else {
        setPage(1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, page, fetchRiders])

  useEffect(() => {
    if (selectedRider) {
      fetchRiderDetail(selectedRider)
    }
  }, [selectedRider, fetchRiderDetail])

  async function handleAddRider() {
    if (!newRider.name.trim()) {
      setFormError('姓名不能为空')
      return
    }
    if (!newRider.phone.trim()) {
      setFormError('手机号不能为空')
      return
    }
    if (!/^1\d{10}$/.test(newRider.phone.trim())) {
      setFormError('请输入正确的11位手机号')
      return
    }
    setFormError('')
    setSubmitting(true)
    try {
      await api.createRider(newRider)
      setShowAddModal(false)
      setNewRider({ name: '', phone: '', device_model: '', battery_health: 100, max_load: 5, is_novice: 1 })
      showToast('骑手添加成功', 'success')
      setPage(1)
      fetchRiders()
    } catch (error: any) {
      const msg = error?.message || '添加失败'
      setFormError(msg.includes('UNIQUE') || msg.includes('already') ? '该手机号已存在' : msg)
      showToast(msg.includes('UNIQUE') || msg.includes('already') ? '该手机号已存在' : '添加失败: ' + msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAssignMentor() {
    if (!selectedRider || !mentorId) { showToast('请选择导师', 'error'); return }
    setSubmitting(true)
    try {
      await api.assignMentor(selectedRider, parseInt(mentorId))
      setShowMentorModal(false)
      setMentorId('')
      showToast('导师分配成功', 'success')
      fetchRiderDetail(selectedRider)
    } catch (error: any) {
      showToast('分配失败: ' + (error?.message || '未知错误'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGrantCard() {
    if (!selectedRider) return
    setSubmitting(true)
    try {
      await api.grantNoviceCard(selectedRider, { card_type: cardType, reason: cardReason })
      setShowCardModal(false)
      setCardType('timeout_elimination')
      setCardReason('')
      showToast('保护卡发放成功', 'success')
      fetchRiderDetail(selectedRider)
    } catch (error: any) {
      showToast('发放失败: ' + (error?.message || '未知错误'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddViolation() {
    if (!selectedRider) return
    setSubmitting(true)
    try {
      await api.addRiderViolation(selectedRider, {
        type: violationType,
        description: violationDesc,
        penalty_points: violationPoints,
      })
      setShowViolationModal(false)
      setViolationType('timeout')
      setViolationDesc('')
      setViolationPoints(0)
      showToast('违规记录已添加', 'success')
      fetchRiderDetail(selectedRider)
    } catch (error: any) {
      showToast('添加失败: ' + (error?.message || '未知错误'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUseCard(cardId: number) {
    if (!selectedRider) return
    try {
      await api.useNoviceCard(selectedRider, cardId)
      showToast('保护卡已使用', 'success')
      fetchRiderDetail(selectedRider)
    } catch (error: any) {
      showToast('使用失败: ' + (error?.message || '未知错误'), 'error')
    }
  }

  function getBatteryColor(health: number) {
    if (health >= 80) return 'bg-green-500'
    if (health >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      online: 'bg-green-100 text-green-800',
      busy: 'bg-yellow-100 text-yellow-800',
      offline: 'bg-gray-100 text-gray-800',
    }
    const labels: Record<string, string> = {
      online: '在线',
      busy: '忙碌',
      offline: '离线',
    }
    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', styles[status])}>
        {labels[status] || status}
      </span>
    )
  }

  function getNoviceBadge(isNovice: number) {
    if (!isNovice) return null
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        新手
      </span>
    )
  }

  function getViolationTypeLabel(type: string) {
    const labels: Record<string, string> = {
      timeout: '超时',
      false_signin: '虚假签到',
      gps_deviation: 'GPS偏移',
      other: '其他',
    }
    return labels[type] || type
  }

  function getCardTypeLabel(type: string) {
    const labels: Record<string, string> = {
      timeout_elimination: '超时消除卡',
      bonus_reward: '奖励加成卡',
    }
    return labels[type] || type
  }

  const totalPages = Math.ceil(total / pageSize)

  const chartData = incomeData
    ? [
        { name: '基础运费', value: incomeData.total_base_fee, fill: '#3B82F6' },
        { name: '奖励', value: incomeData.total_reward, fill: '#10B981' },
        { name: '补贴', value: incomeData.total_subsidy, fill: '#F59E0B' },
      ]
    : []

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">骑手管理</h1>
        <p className="text-gray-600 mt-1">管理所有骑手信息、状态和绩效</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索姓名或手机号..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">全部状态</option>
              <option value="online">在线</option>
              <option value="busy">忙碌</option>
              <option value="offline">离线</option>
            </select>
          </div>

          <select
            value={noviceFilter}
            onChange={(e) => { setNoviceFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">全部新手</option>
            <option value="novice">新手</option>
            <option value="experienced">资深</option>
          </select>

          <button
            onClick={() => { setShowAddModal(true); setFormError('') }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加骑手
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">手机号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备型号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">电池健康</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">负载</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">绩效率</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">新手</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总订单</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总收入</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : riders.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-gray-500">暂无数据</td>
                </tr>
              ) : (
                riders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{rider.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{rider.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{rider.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{rider.device_model || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', getBatteryColor(rider.battery_health))}
                            style={{ width: `${rider.battery_health}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{rider.battery_health}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {rider.current_load}/{rider.max_load}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {(rider.performance_rate * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3">{getNoviceBadge(rider.is_novice)}</td>
                    <td className="px-4 py-3">{getStatusBadge(rider.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{rider.total_orders}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">¥{rider.total_income}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedRider(rider.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            共 {total} 条记录，第 {page} / {totalPages || 1} 页
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                    page === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-100'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); setFormError('') } }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">添加骑手</h3>
              <button onClick={() => { setShowAddModal(false); setFormError('') }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newRider.name}
                  onChange={(e) => setNewRider({ ...newRider, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newRider.phone}
                  onChange={(e) => setNewRider({ ...newRider, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入11位手机号"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">设备型号</label>
                <input
                  type="text"
                  value={newRider.device_model}
                  onChange={(e) => setNewRider({ ...newRider, device_model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入设备型号"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电池健康 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newRider.battery_health}
                    onChange={(e) => setNewRider({ ...newRider, battery_health: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大负载</label>
                  <input
                    type="number"
                    min="1"
                    value={newRider.max_load}
                    onChange={(e) => setNewRider({ ...newRider, max_load: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">是否新手</label>
                <select
                  value={newRider.is_novice}
                  onChange={(e) => setNewRider({ ...newRider, is_novice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>是</option>
                  <option value={0}>否</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setFormError('') }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleAddRider}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && <span className="animate-spin">⟳</span>}
                {submitting ? '提交中...' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRider && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={(e) => { if (e.target === e.currentTarget) { setSelectedRider(null); setRiderDetail(null); setShowMentorModal(false); setShowCardModal(false); setShowViolationModal(false) } }}>
          <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold">骑手详情</h3>
              <button onClick={() => { setSelectedRider(null); setRiderDetail(null); setShowMentorModal(false); setShowCardModal(false); setShowViolationModal(false) }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-6 text-center text-gray-500">加载中...</div>
            ) : riderDetail ? (
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xl font-semibold">{riderDetail.name}</h4>
                      {getNoviceBadge(riderDetail.is_novice)}
                      {getStatusBadge(riderDetail.status)}
                    </div>
                    <p className="text-gray-500 mt-1">{riderDetail.phone}</p>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">设备型号</p>
                        <p className="font-medium">{riderDetail.device_model || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">电池健康</p>
                        <div className="flex items-center gap-2">
                          <Battery className={cn('w-4 h-4', riderDetail.battery_health >= 80 ? 'text-green-500' : riderDetail.battery_health >= 50 ? 'text-yellow-500' : 'text-red-500')} />
                          <span className="font-medium">{riderDetail.battery_health}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">负载</p>
                        <p className="font-medium">{riderDetail.current_load}/{riderDetail.max_load}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">绩效率</p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{(riderDetail.performance_rate * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">总订单</p>
                        <p className="font-medium">{riderDetail.total_orders}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">总收入</p>
                        <p className="font-medium">¥{riderDetail.total_income}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMentorModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" />
                    分配导师
                  </button>
                  <button
                    onClick={() => setShowCardModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <CreditCard className="w-4 h-4" />
                    发放保护卡
                  </button>
                  <button
                    onClick={() => setShowViolationModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <AlertCircle className="w-4 h-4" />
                    添加违规
                  </button>
                </div>

                {riderDetail.violations.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      违规记录
                    </h5>
                    <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                      {riderDetail.violations.map((v) => (
                        <div key={v.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded">
                              {getViolationTypeLabel(v.type)}
                            </span>
                            <span className="text-xs text-gray-500">{new Date(v.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{v.description || '无描述'}</p>
                          <p className="text-sm text-red-600 mt-1">扣分: {v.penalty_points}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    收入构成
                  </h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {incomeData && (
                      <>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={80} />
                              <Tooltip formatter={(value: number) => [`¥${value}`, '']} />
                              <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">¥{incomeData.total_base_fee}</p>
                            <p className="text-xs text-gray-500">基础运费</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">¥{incomeData.total_reward}</p>
                            <p className="text-xs text-gray-500">奖励</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">¥{incomeData.total_subsidy}</p>
                            <p className="text-xs text-gray-500">补贴</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">¥{incomeData.total_income}</p>
                            <p className="text-xs text-gray-500">总计</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {(riderDetail.mentorships.asMentor.length > 0 || riderDetail.mentorships.asMentee.length > 0) && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-500" />
                      师徒关系
                    </h5>
                    <div className="space-y-3">
                      {riderDetail.mentorships.asMentee.length > 0 && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-xs text-purple-600 font-medium mb-2">我的导师</p>
                          {riderDetail.mentorships.asMentee.map((m) => (
                            <div key={m.id} className="flex items-center justify-between">
                              <span className="font-medium">{m.mentor_name}</span>
                              <span className={cn('text-xs px-2 py-0.5 rounded', m.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                                {m.status === 'active' ? '进行中' : '已完成'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {riderDetail.mentorships.asMentor.length > 0 && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-xs text-blue-600 font-medium mb-2">我的徒弟</p>
                          {riderDetail.mentorships.asMentor.map((m) => (
                            <div key={m.id} className="flex items-center justify-between">
                              <span className="font-medium">{m.mentee_name}</span>
                              <span className={cn('text-xs px-2 py-0.5 rounded', m.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800')}>
                                {m.status === 'active' ? '进行中' : '已完成'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {riderDetail.noviceCards.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-orange-500" />
                      新手保护卡
                    </h5>
                    <div className="grid gap-3">
                      {riderDetail.noviceCards.map((card) => (
                        <div key={card.id} className={cn('rounded-lg p-4 border', card.used ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-200')}>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className={cn('px-2 py-0.5 text-xs font-medium rounded', card.used ? 'bg-gray-200 text-gray-600' : 'bg-orange-200 text-orange-800')}>
                                {getCardTypeLabel(card.card_type)}
                              </span>
                              <p className="text-sm text-gray-600 mt-1">{card.reason || '无原因'}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(card.created_at).toLocaleDateString()}</p>
                            </div>
                            {!card.used && (
                              <button
                                onClick={() => handleUseCard(card.id)}
                                className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                              >
                                使用
                              </button>
                            )}
                            {card.used && (
                              <span className="text-xs text-gray-500">已使用</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showMentorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]" onClick={(e) => { if (e.target === e.currentTarget) setShowMentorModal(false) }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">分配导师</h3>
              <button onClick={() => setShowMentorModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择导师</label>
              <select
                value={mentorId}
                onChange={(e) => setMentorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择资深骑手作为导师</option>
                {riders.filter(r => !r.is_novice && r.id !== selectedRider).map(r => (
                  <option key={r.id} value={r.id}>{r.name} - {r.phone}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowMentorModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                取消
              </button>
              <button onClick={handleAssignMentor} disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {submitting && <span className="animate-spin">⟳</span>}
                {submitting ? '提交中...' : '确认分配'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]" onClick={(e) => { if (e.target === e.currentTarget) setShowCardModal(false) }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">发放新手保护卡</h3>
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">卡片类型</label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="timeout_elimination">超时消除卡</option>
                  <option value="bonus_reward">奖励加成卡</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">发放原因</label>
                <textarea
                  value={cardReason}
                  onChange={(e) => setCardReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="请输入发放原因"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCardModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                取消
              </button>
              <button onClick={handleGrantCard} disabled={submitting} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {submitting && <span className="animate-spin">⟳</span>}
                {submitting ? '提交中...' : '确认发放'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViolationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]" onClick={(e) => { if (e.target === e.currentTarget) setShowViolationModal(false) }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">添加违规记录</h3>
              <button onClick={() => setShowViolationModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">违规类型</label>
                <select
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="timeout">超时</option>
                  <option value="false_signin">虚假签到</option>
                  <option value="gps_deviation">GPS偏移</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">违规描述</label>
                <textarea
                  value={violationDesc}
                  onChange={(e) => setViolationDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="请输入违规描述"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">扣分数</label>
                <input
                  type="number"
                  min="0"
                  value={violationPoints}
                  onChange={(e) => setViolationPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowViolationModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                取消
              </button>
              <button onClick={handleAddViolation} disabled={submitting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {submitting && <span className="animate-spin">⟳</span>}
                {submitting ? '提交中...' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
