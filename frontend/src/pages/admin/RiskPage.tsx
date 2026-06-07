import { useState, useEffect } from 'react'
import { ShieldAlert, Plus, X } from 'lucide-react'
import { admin } from '../../api'

export default function RiskPage() {
  const [auditList, setAuditList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showResolve, setShowResolve] = useState<number | null>(null)
  const [resolution, setResolution] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [newRiderId, setNewRiderId] = useState('')
  const [newOrderId, setNewOrderId] = useState('')
  const [newType, setNewType] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newLevel, setNewLevel] = useState('medium')

  useEffect(() => {
    loadAudits()
  }, [statusFilter, levelFilter])

  const loadAudits = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      if (levelFilter) params.risk_level = levelFilter
      const res: any = await admin.listRiskAudits(params)
      setAuditList(Array.isArray(res) ? res : res?.list || [])
    } catch {
      setAuditList([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setActionLoading(true)
    try {
      await admin.createRiskAudit({
        rider_id: parseInt(newRiderId),
        order_id: parseInt(newOrderId),
        audit_type: newType,
        description: newDesc,
        risk_level: newLevel,
      })
      setShowCreate(false)
      setNewRiderId('')
      setNewOrderId('')
      setNewType('')
      setNewDesc('')
      setNewLevel('medium')
      loadAudits()
    } catch {
    } finally {
      setActionLoading(false)
    }
  }

  const handleResolve = async (id: number) => {
    setActionLoading(true)
    try {
      await admin.resolveRiskAudit(id, { status: 'resolved' })
      setShowResolve(null)
      setResolution('')
      loadAudits()
    } catch {
    } finally {
      setActionLoading(false)
    }
  }

  const riskBadge = (level: string) => {
    if (level === 'high') return 'status-appealing'
    if (level === 'medium') return 'status-delivering'
    return 'status-pending'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-secondary">风控审核</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> 新建审核
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white"
        >
          <option value="">全部状态</option>
          <option value="pending">待处理</option>
          <option value="resolved">已处理</option>
        </select>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white"
        >
          <option value="">全部风险</option>
          <option value="high">高风险</option>
          <option value="medium">中风险</option>
          <option value="low">低风险</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {auditList.map((audit) => (
            <div key={audit.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-danger" />
                  <span className="font-medium text-secondary">{audit.rider_name || `骑手#${audit.rider_id}`}</span>
                  <span className={`status-badge ${riskBadge(audit.risk_level)}`}>
                    {audit.risk_level === 'high' ? '高风险' : audit.risk_level === 'medium' ? '中风险' : '低风险'}
                  </span>
                </div>
                <span className={`status-badge ${audit.status === 'resolved' ? 'status-completed' : 'status-pending'}`}>
                  {audit.status === 'resolved' ? '已处理' : '待处理'}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <span className="text-gray-400">类型: {audit.audit_type}</span>
                <span className="mx-2 text-gray-300">|</span>
                {audit.description}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{audit.created_at?.slice(0, 16)}</span>
                {audit.status !== 'resolved' && (
                  <button
                    onClick={() => setShowResolve(audit.id)}
                    className="text-primary hover:underline font-medium"
                  >
                    处理
                  </button>
                )}
              </div>
            </div>
          ))}
          {auditList.length === 0 && (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400">暂无风控记录</div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-secondary">新建风控审核</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">骑手ID</label>
                <input type="number" value={newRiderId} onChange={(e) => setNewRiderId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">订单ID</label>
                <input type="number" value={newOrderId} onChange={(e) => setNewOrderId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">风险类型</label>
                <input type="text" value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="如: 超时、虚假配送等"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">风险描述</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">风险等级</label>
                <select value={newLevel} onChange={(e) => setNewLevel(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white">
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
              <button onClick={handleCreate} disabled={actionLoading}
                className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                {actionLoading ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolve !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-secondary">处理风控审核</h3>
              <button onClick={() => setShowResolve(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">处理备注</label>
                <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} placeholder="请输入处理说明"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none" />
              </div>
              <button onClick={() => handleResolve(showResolve)} disabled={actionLoading || !resolution}
                className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                {actionLoading ? '处理中...' : '确认处理'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
