import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, MapPin, Users, DollarSign, Settings } from 'lucide-react'
import { api } from '../lib/api'

export default function Halls() {
  const [halls, setHalls] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingHall, setEditingHall] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    min_consumption: '',
    location: '',
    facilities: '',
    description: '',
    status: 'active',
  })

  useEffect(() => {
    loadHalls()
  }, [])

  async function loadHalls() {
    try {
      const res = await api.halls.list()
      setHalls(res.data)
    } catch (error) {
      alert('加载宴会厅失败')
    }
  }

  function handleOpenModal(hall?: any) {
    if (hall) {
      setEditingHall(hall)
      setFormData({
        name: hall.name,
        capacity: hall.capacity,
        min_consumption: hall.min_consumption,
        location: hall.location || '',
        facilities: hall.facilities || '',
        description: hall.description || '',
        status: hall.status,
      })
    } else {
      setEditingHall(null)
      setFormData({
        name: '',
        capacity: '',
        min_consumption: '',
        location: '',
        facilities: '',
        description: '',
        status: 'active',
      })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        capacity: Number(formData.capacity),
        min_consumption: Number(formData.min_consumption),
      }
      
      if (editingHall) {
        await api.halls.update(editingHall.id, data)
      } else {
        await api.halls.create(data)
      }
      
      setShowModal(false)
      loadHalls()
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('确定要删除这个宴会厅吗？')) return
    try {
      await api.halls.delete(id)
      loadHalls()
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500">管理酒店宴会厅资源，设置容量、最低消费等信息</p>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          新增宴会厅
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {halls.map((hall) => (
          <div key={hall.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{hall.name}</span>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>容纳 {hall.capacity} 桌</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>最低消费 ¥{hall.min_consumption.toLocaleString()}</span>
                </div>
                {hall.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{hall.location}</span>
                  </div>
                )}
                {hall.facilities && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <Settings className="w-4 h-4 mt-0.5" />
                    <span className="text-sm">{hall.facilities}</span>
                  </div>
                )}
              </div>
              
              {hall.description && (
                <p className="mt-4 text-sm text-gray-500">{hall.description}</p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className={`px-2 py-1 rounded text-xs ${
                  hall.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {hall.status === 'active' ? '启用中' : '已停用'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(hall)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(hall.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold">
                {editingHall ? '编辑宴会厅' : '新增宴会厅'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">厅名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">容纳桌数 *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最低消费</label>
                  <input
                    type="number"
                    value={formData.min_consumption}
                    onChange={(e) => setFormData({ ...formData, min_consumption: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="如：一楼东侧"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">配套设施</label>
                <input
                  type="text"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="如：音响, 投影, LED屏"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">启用</option>
                  <option value="inactive">停用</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingHall ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
