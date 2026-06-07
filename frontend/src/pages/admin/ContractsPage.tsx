import { useState, useEffect } from 'react'
import { FileText, Plus, X, PenTool } from 'lucide-react'
import { admin } from '../../api'

export default function ContractsPage() {
  const [contractList, setContractList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [riderId, setRiderId] = useState('')
  const [contractContent, setContractContent] = useState('')
  const [templateVersion, setTemplateVersion] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadContracts()
  }, [])

  const loadContracts = async () => {
    try {
      const res: any = await admin.listContracts()
      setContractList(Array.isArray(res) ? res : res?.list || [])
    } catch {
      setContractList([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!riderId) return
    setActionLoading(true)
    try {
      await admin.createContract({
        rider_id: parseInt(riderId),
        content: contractContent,
        template_version: templateVersion,
      })
      setShowCreate(false)
      setRiderId('')
      setContractContent('')
      setTemplateVersion('')
      loadContracts()
    } catch {
    } finally {
      setActionLoading(false)
    }
  }

  const handleSign = async (id: number) => {
    setActionLoading(true)
    try {
      await admin.signContract(id)
      loadContracts()
    } catch {
    } finally {
      setActionLoading(false)
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'signed') return 'status-completed'
    if (status === 'pending') return 'status-pending'
    return 'status-cancelled'
  }

  const statusLabel = (status: string) => {
    const map: Record<string, string> = { signed: '已签署', pending: '待签署', expired: '已过期' }
    return map[status] || status
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-secondary">合规管理</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> 新建合同
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contractList.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">暂无合同记录</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-3 font-medium text-gray-500">骑手</th>
                  <th className="text-left p-3 font-medium text-gray-500">合同编号</th>
                  <th className="text-center p-3 font-medium text-gray-500">状态</th>
                  <th className="text-left p-3 font-medium text-gray-500">签署时间</th>
                  <th className="text-left p-3 font-medium text-gray-500">模板版本</th>
                  <th className="text-center p-3 font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {contractList.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3 font-medium text-secondary">{c.rider_name || `骑手#${c.rider_id}`}</td>
                    <td className="p-3 text-gray-600">{c.contract_no}</td>
                    <td className="p-3 text-center">
                      <span className={`status-badge ${statusBadge(c.status)}`}>{statusLabel(c.status)}</span>
                    </td>
                    <td className="p-3 text-gray-500">{c.signed_at?.slice(0, 10) || '--'}</td>
                    <td className="p-3 text-gray-600">{c.template_version || '--'}</td>
                    <td className="p-3 text-center">
                      {c.status === 'pending' && (
                        <button
                          onClick={() => handleSign(c.id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 mx-auto text-primary hover:underline text-xs font-medium disabled:opacity-50"
                        >
                          <PenTool size={12} /> 签署
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-secondary">新建合同</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">骑手ID</label>
                <input
                  type="number"
                  value={riderId}
                  onChange={(e) => setRiderId(e.target.value)}
                  placeholder="请输入骑手ID"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">合同内容</label>
                <textarea
                  value={contractContent}
                  onChange={(e) => setContractContent(e.target.value)}
                  rows={3}
                  placeholder="请输入合同内容"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模板版本</label>
                <input
                  type="text"
                  value={templateVersion}
                  onChange={(e) => setTemplateVersion(e.target.value)}
                  placeholder="如: v1.0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={actionLoading || !riderId}
                className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {actionLoading ? '创建中...' : '创建合同'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
