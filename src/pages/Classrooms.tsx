import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react'
import { api } from '@/lib/api'

interface Classroom {
  id: number
  name: string
  building: string
  room_no: string
  capacity: number
  classroom_type: string
  equipment: string
  status: string
}

const classroomTypeMap: Record<string, string> = {
  normal: '普通教室',
  experiment: '实验室',
  multimedia: '多媒体教室',
  lecture: '阶梯教室',
}

const statusMap: Record<string, { label: string; color: string }> = {
  available: { label: '可用', color: 'bg-green-100 text-green-700' },
  maintenance: { label: '维护中', color: 'bg-yellow-100 text-yellow-700' },
  disabled: { label: '停用', color: 'bg-red-100 text-red-700' },
}

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [buildings, setBuildings] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null)
  const [searchText, setSearchText] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    room_no: '',
    capacity: 0,
    classroom_type: 'normal',
    equipment: '',
    status: 'available',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [classroomsRes, buildingsRes] = await Promise.all([
      api.classrooms.list(),
      api.classrooms.getBuildings(),
    ])
    if (classroomsRes.success) setClassrooms(classroomsRes.data)
    if (buildingsRes.success) setBuildings(buildingsRes.data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingClassroom) {
      const res = await api.classrooms.update(editingClassroom.id, formData)
      if (res.success) {
        setShowModal(false)
        loadData()
      } else {
        alert(res.error || '操作失败')
      }
    } else {
      const res = await api.classrooms.create(formData)
      if (res.success) {
        setShowModal(false)
        loadData()
      } else {
        alert(res.error || '操作失败')
      }
    }
  }

  const handleEdit = (classroom: Classroom) => {
    setEditingClassroom(classroom)
    setFormData({
      name: classroom.name,
      building: classroom.building,
      room_no: classroom.room_no,
      capacity: classroom.capacity,
      classroom_type: classroom.classroom_type,
      equipment: classroom.equipment || '',
      status: classroom.status,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个教室吗？')) {
      const res = await api.classrooms.delete(id)
      if (res.success) {
        loadData()
      } else {
        alert(res.error || '删除失败')
      }
    }
  }

  const filteredClassrooms = classrooms.filter(
    (c) =>
      c.name.includes(searchText) ||
      c.building.includes(searchText) ||
      c.room_no.includes(searchText)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">教室管理</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="搜索教室..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-48" />
          </div>
          <button onClick={() => { setEditingClassroom(null); setFormData({ name: '', building: '', room_no: '', capacity: 0, classroom_type: 'normal', equipment: '', status: 'available' }); setShowModal(true) }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <Plus className="w-4 h-4 mr-2" />新增教室
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">教室名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">教学楼</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">教室号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">容量</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (<tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">加载中...</td></tr>) : filteredClassrooms.length === 0 ? (<tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">暂无数据</td></tr>) : (
              filteredClassrooms.map((classroom) => (
                <tr key={classroom.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{classroom.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{classroom.building}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{classroom.room_no}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{classroom.capacity}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{classroomTypeMap[classroom.classroom_type]}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusMap[classroom.status]?.color}`}>
                      {statusMap[classroom.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button onClick={() => handleEdit(classroom)} className="text-blue-600 hover:text-blue-800 mr-3"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(classroom.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">{editingClassroom ? '编辑教室' : '新增教室'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">教室名称 *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">教学楼 *</label>
                  <input type="text" value={formData.building} onChange={(e) => setFormData({ ...formData, building: e.target.value })} required placeholder="如：教学楼A" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">教室号 *</label>
                  <input type="text" value={formData.room_no} onChange={(e) => setFormData({ ...formData, room_no: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">容量</label>
                  <input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">教室类型</label>
                  <select value={formData.classroom_type} onChange={(e) => setFormData({ ...formData, classroom_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="normal">普通教室</option>
                    <option value="experiment">实验室</option>
                    <option value="multimedia">多媒体教室</option>
                    <option value="lecture">阶梯教室</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">设备</label>
                  <input type="text" value={formData.equipment} onChange={(e) => setFormData({ ...formData, equipment: e.target.value })} placeholder="如：投影仪,音响" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="available">可用</option>
                    <option value="maintenance">维护中</option>
                    <option value="disabled">停用</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">{editingClassroom ? '保存' : '创建'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
