import { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react'
import type { Drug } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { api } from '@/utils/request'

const emptyDrug: Omit<Drug, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  genericName: '',
  batchNumber: '',
  manufacturer: '',
  holder: '',
  indications: '',
  risks: '',
}

const requiredFields: (keyof Omit<Drug, 'id' | 'createdAt' | 'updatedAt'>)[] = [
  'name',
  'genericName',
  'batchNumber',
  'manufacturer',
  'holder',
  'indications',
  'risks',
]

const fieldLabels: Record<string, string> = {
  name: '药品名称',
  genericName: '通用名',
  batchNumber: '批号',
  manufacturer: '生产厂家',
  holder: '上市许可持有人',
  indications: '适应症',
  risks: '风险信息',
}

export default function DrugList() {
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [searchText, setSearchText] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null)
  const [formData, setFormData] = useState(emptyDrug)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const { permissions } = useAppStore()

  const loadDrugs = async () => {
    try {
      setLoading(true)
      const res = await api.get<{ data: Drug[]; pagination?: { total: number; totalPages: number } }>('/drugs', {
        params: { pageSize: 100 },
      })
      const data = (res as any).data || []
      setDrugs(data)
    } catch (err) {
      console.error('加载药品列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDrugs()
  }, [])

  const filteredDrugs = drugs.filter(
    (d) =>
      d.name.includes(searchText) ||
      d.genericName.includes(searchText) ||
      d.batchNumber.includes(searchText) ||
      d.manufacturer.includes(searchText)
  )

  const paginatedDrugs = filteredDrugs.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filteredDrugs.length / pageSize)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    requiredFields.forEach((field) => {
      if (!formData[field]?.trim()) {
        newErrors[field] = `请输入${fieldLabels[field]}`
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdd = () => {
    setEditingDrug(null)
    setFormData(emptyDrug)
    setErrors({})
    setModalOpen(true)
  }

  const handleEdit = (drug: Drug) => {
    setEditingDrug(drug)
    setFormData({
      name: drug.name,
      genericName: drug.genericName,
      batchNumber: drug.batchNumber,
      manufacturer: drug.manufacturer,
      holder: drug.holder,
      indications: drug.indications,
      risks: drug.risks,
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除药品「${name}」吗？\n\n注意：如果该药品有关联的上报记录，将无法删除。`)) {
      return
    }
    try {
      await api.delete(`/drugs/${id}`)
      setDrugs(drugs.filter((d) => d.id !== id))
      alert('删除成功')
    } catch (err: any) {
      alert(err.message || '删除失败，该药品可能有关联的上报记录')
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      if (editingDrug) {
        await api.put(`/drugs/${editingDrug.id}`, formData)
        setDrugs(
          drugs.map((d) =>
            d.id === editingDrug.id
              ? { ...d, ...formData, updatedAt: new Date().toISOString().split('T')[0] }
              : d
          )
        )
      } else {
        const res = await api.post<{ data: Drug }>('/drugs', formData)
        const newDrug = (res as any).data
        if (newDrug) {
          setDrugs([newDrug, ...drugs])
        }
      }
      setModalOpen(false)
    } catch (err: any) {
      alert(err.message || '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">药品库</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {filteredDrugs.length} 条药品记录
            {permissions.canManageDrugs ? '，您可以进行新增、编辑和删除操作' : '，您仅有查看权限'}
          </p>
        </div>
        {permissions.canManageDrugs && (
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新增药品
          </button>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索药品名称、通用名、批号、厂家..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">药品名称</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">通用名</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">批号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">生产厂家</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">持有人</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    加载中...
                  </td>
                </tr>
              ) : paginatedDrugs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    暂无药品记录
                  </td>
                </tr>
              ) : (
                paginatedDrugs.map((drug) => (
                  <tr key={drug.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-500">{drug.id}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-800">{drug.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{drug.genericName}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-mono">{drug.batchNumber}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{drug.manufacturer}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{drug.holder}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {permissions.canManageDrugs && (
                          <>
                            <button
                              onClick={() => handleEdit(drug)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg text-primary-600 transition-colors"
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(drug.id, drug.name)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-danger-600 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary px-3 py-1.5 text-sm"
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  currentPage === page
                    ? 'bg-primary-500 text-white'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary px-3 py-1.5 text-sm"
            >
              下一页
            </button>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">
                {editingDrug ? '编辑药品' : '新增药品'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {Object.keys(errors).length > 0 && (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-danger-800">请完善以下必填项：</p>
                    <ul className="text-sm text-danger-700 mt-1 list-disc list-inside">
                      {Object.values(errors).map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    药品名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (errors.name) setErrors({ ...errors, name: '' })
                    }}
                    className={`input ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="请输入药品名称"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    通用名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => {
                      setFormData({ ...formData, genericName: e.target.value })
                      if (errors.genericName) setErrors({ ...errors, genericName: '' })
                    }}
                    className={`input ${errors.genericName ? 'border-red-500' : ''}`}
                    placeholder="请输入通用名"
                  />
                  {errors.genericName && <p className="text-red-500 text-xs mt-1">{errors.genericName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生产批号 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => {
                      setFormData({ ...formData, batchNumber: e.target.value })
                      if (errors.batchNumber) setErrors({ ...errors, batchNumber: '' })
                    }}
                    className={`input ${errors.batchNumber ? 'border-red-500' : ''}`}
                    placeholder="请输入生产批号，如 20240501"
                  />
                  {errors.batchNumber && <p className="text-red-500 text-xs mt-1">{errors.batchNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生产厂家 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => {
                      setFormData({ ...formData, manufacturer: e.target.value })
                      if (errors.manufacturer) setErrors({ ...errors, manufacturer: '' })
                    }}
                    className={`input ${errors.manufacturer ? 'border-red-500' : ''}`}
                    placeholder="请输入生产厂家"
                  />
                  {errors.manufacturer && <p className="text-red-500 text-xs mt-1">{errors.manufacturer}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    上市许可持有人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.holder}
                    onChange={(e) => {
                      setFormData({ ...formData, holder: e.target.value })
                      if (errors.holder) setErrors({ ...errors, holder: '' })
                    }}
                    className={`input ${errors.holder ? 'border-red-500' : ''}`}
                    placeholder="请输入上市许可持有人"
                  />
                  {errors.holder && <p className="text-red-500 text-xs mt-1">{errors.holder}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    适应症 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.indications}
                    onChange={(e) => {
                      setFormData({ ...formData, indications: e.target.value })
                      if (errors.indications) setErrors({ ...errors, indications: '' })
                    }}
                    className={`input min-h-[80px] ${errors.indications ? 'border-red-500' : ''}`}
                    placeholder="请输入药品适应症"
                  />
                  {errors.indications && <p className="text-red-500 text-xs mt-1">{errors.indications}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    风险信息（说明书风险） <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.risks}
                    onChange={(e) => {
                      setFormData({ ...formData, risks: e.target.value })
                      if (errors.risks) setErrors({ ...errors, risks: '' })
                    }}
                    className={`input min-h-[80px] ${errors.risks ? 'border-red-500' : ''}`}
                    placeholder="请输入药品风险信息，包括不良反应、禁忌症、注意事项等"
                  />
                  {errors.risks && <p className="text-red-500 text-xs mt-1">{errors.risks}</p>}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 sticky bottom-0 bg-white">
              <button onClick={() => setModalOpen(false)} className="btn-secondary">
                取消
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
                {submitting ? '保存中...' : editingDrug ? '保存修改' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
