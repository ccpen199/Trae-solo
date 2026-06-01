import { useEffect, useState } from 'react'
import { api, Mold } from '@/lib/api'
import { Plus, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react'

export default function Molds() {
  const [molds, setMolds] = useState<Mold[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMold, setEditingMold] = useState<Mold | null>(null)
  const [formData, setFormData] = useState({
    mold_number: '',
    product_name: '',
    cavity_count: 1,
    total_life: 100000,
    storage_location: '',
    maintenance_cycle: 10000,
    responsible_person: '',
  })

  useEffect(() => {
    loadMolds()
  }, [statusFilter, search])

  async function loadMolds() {
    setLoading(true)
    try {
      const res = await api.getMolds(statusFilter || undefined, search || undefined)
      if (res.success) {
        setMolds(res.data)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingMold) {
      api.updateMold(editingMold.id, formData).then(() => {
        setShowModal(false)
        loadMolds()
      })
    } else {
      api.createMold(formData).then(() => {
        setShowModal(false)
        loadMolds()
      })
    }
  }

  function handleEdit(mold: Mold) {
    setEditingMold(mold)
    setFormData({
      mold_number: mold.mold_number,
      product_name: mold.product_name,
      cavity_count: mold.cavity_count,
      total_life: mold.total_life,
      storage_location: mold.storage_location,
      maintenance_cycle: mold.maintenance_cycle,
      responsible_person: mold.responsible_person,
    })
    setShowModal(true)
  }

  function handleDelete(id: number) {
    if (confirm('确定要删除这个模具吗？')) {
      api.deleteMold(id).then(() => loadMolds())
    }
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, { text: string; class: string }> = {
      idle: { text: '空闲', class: 'bg-teal-100 text-teal-700' },
      in_use: { text: '生产中', class: 'bg-green-100 text-green-700' },
      maintenance: { text: '维修中', class: 'bg-orange-100 text-orange-700' },
    }
    return labels[status] || { text: status, class: 'bg-gray-100 text-gray-700' }
  }

  function getLifePercentage(mold: Mold) {
    return Math.min(100, (mold.current_usage / mold.total_life) * 100)
  }

  function isNearEndOfLife(mold: Mold) {
    return mold.current_usage >= mold.total_life * 0.9
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">模具档案</h2>
        <button
          onClick={() => {
            setEditingMold(null)
            setFormData({
              mold_number: '',
              product_name: '',
              cavity_count: 1,
              total_life: 100000,
              storage_location: '',
              maintenance_cycle: 10000,
              responsible_person: '',
            })
            setShowModal(true)
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增模具
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索模号或产品..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">全部状态</option>
            <option value="idle">空闲</option>
            <option value="in_use">生产中</option>
            <option value="maintenance">维修中</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">模号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">适用产品</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">穴数</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">寿命使用</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">存放位置</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">责任人</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {molds.map((mold) => {
                const status = getStatusLabel(mold.status)
                const nearEnd = isNearEndOfLife(mold)
                return (
                  <tr key={mold.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{mold.mold_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{mold.product_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{mold.cavity_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className={`h-2 rounded-full ${nearEnd ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${getLifePercentage(mold)}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm ${nearEnd ? 'text-red-600' : 'text-gray-600'}`}>
                          {mold.current_usage.toLocaleString()}/{mold.total_life.toLocaleString()}
                        </span>
                        {nearEnd && <AlertTriangle className="w-4 h-4 text-red-500 ml-1" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{mold.storage_location}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{mold.responsible_person}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.class}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(mold)}
                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mold.id)}
                          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{editingMold ? '编辑模具' : '新增模具'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">模号</label>
                <input
                  type="text"
                  value={formData.mold_number}
                  onChange={(e) => setFormData({ ...formData, mold_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">适用产品</label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">穴数</label>
                  <input
                    type="number"
                    value={formData.cavity_count}
                    onChange={(e) => setFormData({ ...formData, cavity_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">总寿命次数</label>
                  <input
                    type="number"
                    value={formData.total_life}
                    onChange={(e) => setFormData({ ...formData, total_life: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">存放位置</label>
                <input
                  type="text"
                  value={formData.storage_location}
                  onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">保养周期</label>
                  <input
                    type="number"
                    value={formData.maintenance_cycle}
                    onChange={(e) => setFormData({ ...formData, maintenance_cycle: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">责任人</label>
                  <input
                    type="text"
                    value={formData.responsible_person}
                    onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingMold ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
