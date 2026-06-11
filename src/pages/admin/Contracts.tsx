import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileText,
  AlertCircle,
  X,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Building2,
} from 'lucide-react'
import { contractApi, type ContractTemplate } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const statusLabels: Record<string, { label: string; className: string }> = {
  active: { label: '启用', className: 'bg-green-100 text-green-700' },
  draft: { label: '草稿', className: 'bg-gray-100 text-gray-700' },
  archived: { label: '已归档', className: 'bg-orange-100 text-orange-700' },
}

const industries = ['餐饮', '零售', '教育', '医疗', '服务', '娱乐', '科技', '家居']

function StatusBadge({ status }: { status: string }) {
  const config = statusLabels[status] || statusLabels.draft
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full', config.className)}>
      {config.label}
    </span>
  )
}

interface FormData {
  name: string
  industry: string
  content: string
  version: string
  status: string
}

function ContractModal({
  contract,
  onClose,
  onSuccess,
}: {
  contract?: ContractTemplate
  onClose: () => void
  onSuccess: () => void
}) {
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: contract?.name || '',
    industry: contract?.industry || '',
    content: contract?.content || '',
    version: contract?.version || 'v1.0',
    status: contract?.status || 'draft',
  })

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    try {
      let res
      if (contract) {
        res = await contractApi.update(contract.id, {
          ...formData,
        })
      } else {
        res = await contractApi.create({
          ...formData,
          created_by: user.id,
        })
      }
      if (res.success) {
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Failed to save contract:', error)
    } finally {
      setLoading(false)
    }
  }

  const isEdit = !!contract

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEdit ? '编辑合同模板' : '新增合同模板'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEdit ? '修改合同模板信息' : '创建新的合同模板'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模板名称
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入模板名称"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所属行业
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">请选择行业</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                版本号
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="v1.0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">草稿</option>
                <option value="active">启用</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              合同内容
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="请输入合同模板内容..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              rows={12}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.content}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {isEdit ? '保存修改' : '创建模板'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ViewModal({
  contract,
  onClose,
}: {
  contract: ContractTemplate
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{contract.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">版本: {contract.version}</span>
              <StatusBadge status={contract.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">所属行业</p>
              <p className="font-medium text-gray-900">{contract.industry || '通用'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">创建人</p>
              <p className="font-medium text-gray-900">{contract.created_by_name || '-'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">创建时间</p>
              <p className="font-medium text-gray-900">
                {new Date(contract.created_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700">
              {contract.content}
            </pre>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText size={18} />
              合同履约记录
            </h3>
            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      履约阶段
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      状态
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      完成时间
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      备注
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { stage: '签约完成', status: '已完成', time: '2025-01-15', note: '双方已签署正式合同' },
                    { stage: '首批货品交付', status: '已完成', time: '2025-02-20', note: '首批物料已验收通过' },
                    { stage: '门店装修验收', status: '进行中', time: '-', note: '装修施工中，预计3月底完成' },
                    { stage: '正式开业', status: '待完成', time: '-', note: '待装修验收后安排开业' },
                  ].map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">{record.stage}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full',
                          record.status === '已完成' ? 'bg-green-100 text-green-700' :
                          record.status === '进行中' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-500'
                        )}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{record.time}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{record.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

function DeleteConfirmModal({
  contract,
  onClose,
  onSuccess,
}: {
  contract: ContractTemplate
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await contractApi.delete(contract.id)
      if (res.success) {
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Failed to delete contract:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">确认删除</h3>
            <p className="text-sm text-gray-500">此操作不可撤销</p>
          </div>
        </div>
        <p className="text-gray-600 mb-6">
          确定要删除合同模板 "{contract.name}" 吗？删除后将无法恢复。
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            确认删除
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Contracts() {
  const user = useAuthStore((state) => state.user)
  const [contracts, setContracts] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [editingContract, setEditingContract] = useState<ContractTemplate | undefined>(undefined)
  const [viewingContract, setViewingContract] = useState<ContractTemplate | null>(null)
  const [deletingContract, setDeletingContract] = useState<ContractTemplate | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchContracts = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (keyword) params.keyword = keyword
      if (selectedIndustry) params.industry = selectedIndustry
      const res = await contractApi.list(params)
      if (res.success && res.data) {
        setContracts(res.data.list)
        setTotal(res.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch contracts:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, selectedIndustry])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  const totalPages = Math.ceil(total / pageSize)

  const handleSuccess = () => {
    fetchContracts()
  }

  if (user?.role !== 'admin') {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">无权限访问</h3>
            <p className="text-gray-500">该页面仅平台管理员可访问</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索合同模板名称..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(1)
                }}
                className="w-80 pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedIndustry}
              onChange={(e) => {
                setSelectedIndustry(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部行业</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={18} />
            新增模板
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    模板名称
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    行业
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    版本
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建人
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
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
                ) : contracts.length > 0 ? (
                  contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText size={20} className="text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{contract.name}</span>
                    </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {contract.industry || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {contract.version}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={contract.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User size={14} />
                        {contract.created_by_name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={14} />
                        {new Date(contract.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingContract(contract)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="查看"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setEditingContract(contract)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingContract(contract)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-center">
                        <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">暂无合同模板</p>
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

      {showCreateModal && (
        <ContractModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {editingContract && (
        <ContractModal
          contract={editingContract}
          onClose={() => setEditingContract(undefined)}
          onSuccess={handleSuccess}
        />
      )}

      {viewingContract && (
        <ViewModal
          contract={viewingContract}
          onClose={() => setViewingContract(null)}
        />
      )}

      {deletingContract && (
        <DeleteConfirmModal
          contract={deletingContract}
          onClose={() => setDeletingContract(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
