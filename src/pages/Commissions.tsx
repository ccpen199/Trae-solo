import { useState, useEffect } from 'react'
import { DollarSign, Clock, CheckCircle, Send, Filter, Edit2, Save, X, Loader2, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore, type UserRole } from '@/store/authStore'

interface Commission {
  id: number
  transaction_id: number
  transaction_title: string
  agent_id: number
  agent_name: string
  amount: number
  rate: number
  status: 'pending' | 'approved' | 'paid'
  created_at: string
  paid_at: string | null
}

interface CommissionSummary {
  total: number
  pending: number
  paid: number
  byMonth: Array<{ month: string; paid_amount: number; pending_amount: number }>
}

interface CommissionRule {
  id: number
  org_id: number
  role: string
  rate: number
  created_at: string
}

const statusConfig = {
  pending: { label: '待结算', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已审批', color: 'bg-blue-100 text-blue-700' },
  paid: { label: '已发放', color: 'bg-green-100 text-green-700' },
}

const roleLabels: Record<string, string> = {
  director: '总监',
  manager: '经理',
  agent: '经纪人',
  admin: '系统管理员',
  platform: '平台运营',
  ops: '运维工程师',
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-CN')
}

export default function Commissions() {
  const hasRole = useAuthStore(s => s.hasRole)
  const canApprove = hasRole('director', 'manager', 'admin', 'platform')
  const canPay = hasRole('director', 'admin')
  const canEditRules = hasRole('director')

  const [commissions, setCommissions] = useState<Commission[]>([])
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [rules, setRules] = useState<CommissionRule[]>([])
  const [editingRules, setEditingRules] = useState(false)
  const [editedRules, setEditedRules] = useState<Array<{ role: string; rate: number }>>([])
  const [filters, setFilters] = useState({ status: '', agentId: '' })
  const [agents, setAgents] = useState<Array<{ id: number; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [savingRules, setSavingRules] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [commRes, summaryRes, rulesRes, membersRes] = await Promise.all([
        api.get<Commission[]>('/commissions', { ...filters, pageSize: 100 }),
        canApprove ? api.get<CommissionSummary>('/commissions/summary') : Promise.resolve({ success: true, data: null }),
        canEditRules ? api.get<CommissionRule[]>('/commissions/rules') : Promise.resolve({ success: true, data: [] }),
        api.get<any[]>('/organizations/members', { pageSize: 100 }),
      ])
      if (commRes.success && commRes.data) {
        setCommissions(commRes.data || [])
      }
      if (summaryRes.success) {
        setSummary(summaryRes.data)
      }
      if (rulesRes.success && rulesRes.data) {
        setRules(rulesRes.data || [])
      }
      if (membersRes.success && membersRes.data) {
        setAgents(membersRes.data?.filter(m => m.role === 'agent').map(m => ({ id: m.id, name: m.name })) || [])
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  const handleApprove = async (id: number) => {
    setActionId(id)
    try {
      await api.post('/commissions/settle', { id, pay: false })
      await fetchData()
    } catch (err) {
      console.error('Failed to approve:', err)
    } finally {
      setActionId(null)
    }
  }

  const handlePay = async (id: number) => {
    setActionId(id)
    try {
      await api.post('/commissions/settle', { id, pay: true })
      await fetchData()
    } catch (err) {
      console.error('Failed to mark as paid:', err)
    } finally {
      setActionId(null)
    }
  }

  const handleEditRules = () => {
    setEditedRules(rules.map(r => ({ role: r.role, rate: r.rate * 100 })))
    setEditingRules(true)
  }

  const handleCancelEdit = () => {
    setEditingRules(false)
    setEditedRules([])
  }

  const handleRuleChange = (index: number, field: 'role' | 'rate', value: string | number) => {
    setEditedRules(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  const handleAddRule = () => {
    setEditedRules(prev => [...prev, { role: 'agent', rate: 2.5 }])
  }

  const handleRemoveRule = (index: number) => {
    setEditedRules(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveRules = async () => {
    setSavingRules(true)
    try {
      const formattedRules = editedRules.map(r => ({ role: r.role, rate: r.rate / 100 }))
      await api.put('/commissions/rules', { rules: formattedRules })
      setEditingRules(false)
      await fetchData()
    } catch (err) {
      console.error('Failed to save rules:', err)
    } finally {
      setSavingRules(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-2xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">佣金管理</h1>
          <p className="text-gray-500 mt-1">管理佣金结算和规则配置</p>
        </div>

        {canApprove && summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">待结算</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.pending)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">已审批</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.total - summary.pending - summary.paid)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">已发放</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.paid)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">累计佣金</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.total)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">筛选</span>
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">全部状态</option>
              <option value="pending">待结算</option>
              <option value="approved">已审批</option>
              <option value="paid">已发放</option>
            </select>
            <select
              value={filters.agentId}
              onChange={(e) => setFilters(prev => ({ ...prev, agentId: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">全部经纪人</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">交易标题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">经纪人</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">费率</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建日期</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {commissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">暂无佣金记录</td>
                    </tr>
                  ) : (
                    commissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{commission.transaction_title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{commission.agent_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{formatCurrency(commission.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(commission.rate * 100).toFixed(1)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusConfig[commission.status].color)}>
                            {statusConfig[commission.status].label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(commission.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {commission.status === 'pending' && canApprove && (
                            <button
                              onClick={() => handleApprove(commission.id)}
                              disabled={actionId === commission.id}
                              className="text-blue-600 hover:text-blue-700 font-medium mr-3 disabled:opacity-50"
                            >
                              {actionId === commission.id ? '处理中...' : '审批'}
                            </button>
                          )}
                          {commission.status === 'approved' && canPay && (
                            <button
                              onClick={() => handlePay(commission.id)}
                              disabled={actionId === commission.id}
                              className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                            >
                              {actionId === commission.id ? '处理中...' : '标记已发放'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {canEditRules && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">佣金规则</h2>
              </div>
              {!editingRules ? (
                <button
                  onClick={handleEditRules}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  编辑
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    取消
                  </button>
                  <button
                    onClick={handleSaveRules}
                    disabled={savingRules}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {savingRules ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    保存
                  </button>
                </div>
              )}
            </div>
            <div className="p-4">
              {editingRules ? (
                <div className="space-y-3">
                  {editedRules.map((rule, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <select
                        value={rule.role}
                        onChange={(e) => handleRuleChange(index, 'role', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="director">总监</option>
                        <option value="manager">经理</option>
                        <option value="agent">经纪人</option>
                      </select>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={rule.rate}
                          onChange={(e) => handleRuleChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-500">%</span>
                      </div>
                      <button
                        onClick={() => handleRemoveRule(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleAddRule}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + 添加规则
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">费率</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {rules.map((rule) => (
                        <tr key={rule.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{roleLabels[rule.role] || rule.role}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{(rule.rate * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
