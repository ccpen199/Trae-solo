import { useEffect, useState } from 'react'
import { api, Mold, QualityRecord } from '@/lib/api'
import { Plus } from 'lucide-react'

export default function Quality() {
  const [molds, setMolds] = useState<Mold[]>([])
  const [records, setRecords] = useState<QualityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    mold_id: 0,
    work_order: '',
    defect_type: '',
    defect_count: 0,
    inspector: '',
    notes: '',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [moldsRes, recordsRes] = await Promise.all([
        api.getMolds(),
        api.getQualityRecords(),
      ])
      if (moldsRes.success) setMolds(moldsRes.data)
      if (recordsRes.success) setRecords(recordsRes.data)
    } finally {
      setLoading(false)
    }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const res = await api.createQualityRecord(formData)

    if (res.success) {
      showMessage('success', '质量记录已创建')
      setShowModal(false)
      loadData()
    } else {
      showMessage('error', '操作失败')
    }
  }

  const defectTypes = [
    '飞边',
    '缺料',
    '气泡',
    '缩水',
    '变形',
    '烧焦',
    '色差',
    '拉伤',
    '其他',
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">质量记录</h2>
        <button
          onClick={() => {
            setFormData({
              mold_id: 0,
              work_order: '',
              defect_type: '',
              defect_count: 0,
              inspector: '',
              notes: '',
            })
            setShowModal(true)
          }}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增记录
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">模号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">产品</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">工单号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">缺陷类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">缺陷数量</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">检验员</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">备注</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">记录时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    暂无质量记录
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {record.mold_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{record.product_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{record.work_order}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        {record.defect_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{record.defect_count}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{record.inspector}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {record.notes || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{record.record_time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-6">新增质量异常记录</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  选择模具 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.mold_id || ''}
                  onChange={(e) => setFormData({ ...formData, mold_id: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  required
                >
                  <option value="">-- 请选择模具 --</option>
                  {molds.map((mold) => (
                    <option key={mold.id} value={mold.id}>
                      {mold.mold_number} - {mold.product_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  关联工单号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.work_order}
                  onChange={(e) => setFormData({ ...formData, work_order: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  placeholder="请输入生产工单号"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    缺陷类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.defect_type}
                    onChange={(e) => setFormData({ ...formData, defect_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                    required
                  >
                    <option value="">-- 请选择 --</option>
                    {defectTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    缺陷数量 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.defect_count}
                    onChange={(e) => setFormData({ ...formData, defect_count: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                    placeholder="不良品数量"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  缺陷描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  rows={3}
                  placeholder="请详细描述缺陷现象、产生位置、严重程度等信息"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  检验员 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.inspector}
                  onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  placeholder="请输入检验员姓名"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setFormData({
                      mold_id: 0,
                      work_order: '',
                      defect_type: '',
                      defect_count: 0,
                      inspector: '',
                      notes: '',
                    })
                  }}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  创建记录
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
