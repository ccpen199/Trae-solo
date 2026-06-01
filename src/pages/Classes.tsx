import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Search, X, Calendar } from 'lucide-react'
import { message } from 'antd'
import { api } from '@/lib/api'

interface Class {
  id: number
  name: string
  code: string
  grade: number
  student_count: number
  department_id: number | null
  department_name: string
}

interface Department {
  id: number
  name: string
}

interface FormErrors {
  name?: string
  code?: string
  [key: string]: string | undefined
}

interface AvailabilitySlot {
  day_of_week: number
  slot_id: number
  is_available: number
  reason: string
  slot_name: string
  start_time: string
  end_time: string
}

const DAYS = ['周一', '周二', '周三', '周四', '周五']
const SLOT_COUNT = 10

const DEFAULT_SLOTS: Omit<AvailabilitySlot, 'day_of_week' | 'slot_id'>[] = [
  { slot_name: '第一节', start_time: '08:00', end_time: '08:45', is_available: 1, reason: '' },
  { slot_name: '第二节', start_time: '08:55', end_time: '09:40', is_available: 1, reason: '' },
  { slot_name: '第三节', start_time: '10:00', end_time: '10:45', is_available: 1, reason: '' },
  { slot_name: '第四节', start_time: '10:55', end_time: '11:40', is_available: 1, reason: '' },
  { slot_name: '第五节', start_time: '14:00', end_time: '14:45', is_available: 1, reason: '' },
  { slot_name: '第六节', start_time: '14:55', end_time: '15:40', is_available: 1, reason: '' },
  { slot_name: '第七节', start_time: '16:00', end_time: '16:45', is_available: 1, reason: '' },
  { slot_name: '第八节', start_time: '16:55', end_time: '17:40', is_available: 1, reason: '' },
  { slot_name: '第九节', start_time: '19:00', end_time: '19:45', is_available: 1, reason: '' },
  { slot_name: '第十节', start_time: '19:55', end_time: '20:40', is_available: 1, reason: '' },
]

export default function Classes() {
  const [classes, setClasses] = useState<Class[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [availabilityClass, setAvailabilityClass] = useState<Class | null>(null)
  const [searchText, setSearchText] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    grade: new Date().getFullYear(),
    student_count: 0,
    department_id: '',
  })
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [selectedReasonSlot, setSelectedReasonSlot] = useState<{ day: number; slot: number } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [classesRes, deptsRes] = await Promise.all([
      api.classes.list(),
      api.courses.getDepartments(),
    ])
    if (classesRes.success) setClasses(classesRes.data)
    if (deptsRes.success) setDepartments(deptsRes.data)
    setLoading(false)
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    if (!formData.code.trim()) {
      errors.code = '请输入班级代码'
    }
    if (!formData.name.trim()) {
      errors.name = '请输入班级名称'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      message.error('请填写必填项')
      return
    }

    const data = {
      ...formData,
      department_id: formData.department_id ? Number(formData.department_id) : null,
    }

    try {
      if (editingClass) {
        const res = await api.classes.update(editingClass.id, data)
        if (res.success) {
          message.success('班级信息更新成功')
          setShowModal(false)
          loadData()
        } else {
          if (res.errors) {
            setFormErrors(res.errors)
            const firstError = Object.values(res.errors)[0]
            message.error(firstError || '操作失败')
          } else {
            message.error(res.error || '操作失败')
          }
        }
      } else {
        const res = await api.classes.create(data)
        if (res.success) {
          message.success('班级创建成功')
          setShowModal(false)
          loadData()
        } else {
          if (res.errors) {
            setFormErrors(res.errors)
            const firstError = Object.values(res.errors)[0]
            message.error(firstError || '操作失败')
          } else {
            message.error(res.error || '操作失败')
          }
        }
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    }
  }

  const handleAdd = () => {
    setEditingClass(null)
    setFormData({
      name: '',
      code: '',
      grade: new Date().getFullYear(),
      student_count: 0,
      department_id: '',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleEdit = (cls: Class) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      code: cls.code,
      grade: cls.grade,
      student_count: cls.student_count,
      department_id: cls.department_id?.toString() || '',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个班级吗？')) {
      try {
        const res = await api.classes.delete(id)
        if (res.success) {
          message.success('删除成功')
          loadData()
        } else {
          message.error(res.error || '删除失败')
        }
      } catch (error) {
        message.error('网络错误，请稍后重试')
      }
    }
  }

  const handleAvailability = async (cls: Class) => {
    setAvailabilityClass(cls)
    setShowAvailabilityModal(true)
    setAvailabilityLoading(true)
    setSelectedReasonSlot(null)

    try {
      const res = await api.classes.getAvailability(cls.id)
      if (res.success && res.data.length > 0) {
        setAvailability(res.data.map((item: AvailabilitySlot) => ({
          ...item,
          reason: item.reason || ''
        })))
      } else {
        const defaultAvailability: AvailabilitySlot[] = []
        for (let day = 1; day <= 5; day++) {
          for (let slot = 1; slot <= 10; slot++) {
            defaultAvailability.push({
              day_of_week: day,
              slot_id: slot,
              ...DEFAULT_SLOTS[slot - 1],
            })
          }
        }
        setAvailability(defaultAvailability)
      }
    } catch (error) {
      message.error('获取可用时段失败')
      const defaultAvailability: AvailabilitySlot[] = []
      for (let day = 1; day <= 5; day++) {
        for (let slot = 1; slot <= 10; slot++) {
          defaultAvailability.push({
            day_of_week: day,
            slot_id: slot,
            ...DEFAULT_SLOTS[slot - 1],
          })
        }
      }
      setAvailability(defaultAvailability)
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const toggleSlot = (day: number, slot: number) => {
    setAvailability((prev) =>
      prev.map((item) =>
        item.day_of_week === day && item.slot_id === slot
          ? { 
              ...item, 
              is_available: item.is_available === 1 ? 0 : 1,
              reason: item.is_available === 1 ? item.reason : ''
            }
          : item
      )
    )
  }

  const handleReasonClick = (day: number, slot: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const slotData = getSlot(day, slot)
    if (slotData?.is_available === 0) {
      setSelectedReasonSlot({ day, slot })
    }
  }

  const handleReasonChange = (reason: string) => {
    if (!selectedReasonSlot) return
    setAvailability((prev) =>
      prev.map((item) =>
        item.day_of_week === selectedReasonSlot.day && item.slot_id === selectedReasonSlot.slot
          ? { ...item, reason }
          : item
      )
    )
  }

  const setAllSlots = (isAvailable: number) => {
    setAvailability((prev) =>
      prev.map((item) => ({ 
        ...item, 
        is_available: isAvailable,
        reason: isAvailable === 1 ? '' : item.reason
      }))
    )
  }

  const setDaySlots = (day: number, isAvailable: number) => {
    setAvailability((prev) =>
      prev.map((item) =>
        item.day_of_week === day 
          ? { 
              ...item, 
              is_available: isAvailable,
              reason: isAvailable === 1 ? '' : item.reason
            } 
          : item
      )
    )
  }

  const setSlotSlots = (slot: number, isAvailable: number) => {
    setAvailability((prev) =>
      prev.map((item) =>
        item.slot_id === slot 
          ? { 
              ...item, 
              is_available: isAvailable,
              reason: isAvailable === 1 ? '' : item.reason
            } 
          : item
      )
    )
  }

  const getSlot = (day: number, slot: number) => {
    return availability.find((item) => item.day_of_week === day && item.slot_id === slot)
  }

  const handleSaveAvailability = async () => {
    if (!availabilityClass) return

    setSavingAvailability(true)
    try {
      const res = await api.classes.batchUpdateAvailability(availabilityClass.id, {
        availability: availability.map((item) => ({
          day_of_week: item.day_of_week,
          slot_id: item.slot_id,
          is_available: item.is_available,
          reason: item.reason,
        })),
      })
      if (res.success) {
        message.success('可用时段保存成功')
        setShowAvailabilityModal(false)
        setSelectedReasonSlot(null)
      } else {
        message.error(res.error || '保存失败')
      }
    } catch (error) {
      message.error('网络错误，请稍后重试')
    } finally {
      setSavingAvailability(false)
    }
  }

  const filteredClasses = classes.filter(
    (c) =>
      c.name.includes(searchText) ||
      c.code.includes(searchText)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">班级管理</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索班级..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-48"
            />
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增班级
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">班级代码</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">班级名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">年级</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">学生人数</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">所属院系</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">加载中...</td></tr>
            ) : filteredClasses.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">暂无数据</td></tr>
            ) : (
              filteredClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{cls.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{cls.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{cls.grade}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{cls.student_count}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{cls.department_name || '-'}</td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button
                      onClick={() => handleAvailability(cls)}
                      className="text-green-600 hover:text-green-800 mr-3"
                      title="设置可排时段"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(cls)} className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cls.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{editingClass ? '编辑班级' : '新增班级'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">班级代码 *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => {
                      setFormData({ ...formData, code: e.target.value })
                      if (formErrors.code) setFormErrors({ ...formErrors, code: undefined })
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      formErrors.code ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.code && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.code}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">班级名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (formErrors.name) setFormErrors({ ...formErrors, name: undefined })
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                  <input
                    type="number"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学生人数</label>
                  <input
                    type="number"
                    value={formData.student_count}
                    onChange={(e) => setFormData({ ...formData, student_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">所属院系</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">请选择院系</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  {editingClass ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAvailabilityModal && availabilityClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">设置可排时段</h3>
                <p className="text-sm text-gray-500 mt-1">
                  班级：{availabilityClass.name}（{availabilityClass.code}）
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAvailabilityModal(false)
                  setSelectedReasonSlot(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {availabilityLoading ? (
              <div className="p-8 text-center text-gray-500">加载中...</div>
            ) : (
              <div className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4 bg-green-500 rounded"></span>
                      <span className="text-gray-600">可排课</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4 bg-red-500 rounded"></span>
                      <span className="text-gray-600">不可排课</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-4 h-4 bg-red-500 rounded flex items-center justify-center text-white text-[10px]">!</span>
                      <span className="text-gray-600">有原因</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setAllSlots(1)}
                      className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                    >
                      全部设为可排
                    </button>
                    <button
                      onClick={() => setAllSlots(0)}
                      className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                    >
                      全部设为不可排
                    </button>
                  </div>
                </div>

                {selectedReasonSlot && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">
                        编辑不可用原因：{DAYS[selectedReasonSlot.day - 1]} {getSlot(selectedReasonSlot.day, selectedReasonSlot.slot)?.slot_name}
                      </span>
                      <button
                        onClick={() => setSelectedReasonSlot(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={getSlot(selectedReasonSlot.day, selectedReasonSlot.slot)?.reason || ''}
                      onChange={(e) => handleReasonChange(e.target.value)}
                      placeholder="请输入不可用原因（如：班会、活动等）"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      autoFocus
                    />
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <th className="p-2 border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 w-24">
                          节次
                        </th>
                        {DAYS.map((day, index) => (
                          <th
                            key={day}
                            className="p-2 border border-gray-200 bg-gray-50 text-xs font-medium text-gray-600 min-w-[100px]"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span>{day}</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setDaySlots(index + 1, 1)}
                                  className="px-1.5 py-0.5 text-[10px] bg-green-100 text-green-700 rounded hover:bg-green-200"
                                >
                                  全可排
                                </button>
                                <button
                                  onClick={() => setDaySlots(index + 1, 0)}
                                  className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  全不可排
                                </button>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {DEFAULT_SLOTS.map((slotInfo, slotIndex) => {
                        const slotId = slotIndex + 1
                        return (
                          <tr key={slotId}>
                            <td className="p-2 border border-gray-200 bg-gray-50 text-xs text-gray-600">
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="font-medium">{slotInfo.slot_name}</span>
                                <span className="text-gray-400">
                                  {slotInfo.start_time}-{slotInfo.end_time}
                                </span>
                                <div className="flex gap-1 mt-1">
                                  <button
                                    onClick={() => setSlotSlots(slotId, 1)}
                                    className="px-1 py-0.5 text-[9px] bg-green-100 text-green-700 rounded hover:bg-green-200"
                                  >
                                    可排
                                  </button>
                                  <button
                                    onClick={() => setSlotSlots(slotId, 0)}
                                    className="px-1 py-0.5 text-[9px] bg-red-100 text-red-700 rounded hover:bg-red-200"
                                  >
                                    不可排
                                  </button>
                                </div>
                              </div>
                            </td>
                            {DAYS.map((_, dayIndex) => {
                              const dayId = dayIndex + 1
                              const slot = getSlot(dayId, slotId)
                              const isAvailable = slot?.is_available ?? 1
                              const hasReason = slot?.reason && slot.reason.trim() !== ''
                              const isSelected = selectedReasonSlot?.day === dayId && selectedReasonSlot?.slot === slotId
                              return (
                                <td
                                  key={`${dayId}-${slotId}`}
                                  className={`p-1 border border-gray-200 cursor-pointer transition-all hover:opacity-80 relative ${
                                    isAvailable
                                      ? 'bg-green-500 hover:bg-green-600'
                                      : isSelected
                                      ? 'bg-red-700'
                                      : 'bg-red-500 hover:bg-red-600'
                                  }`}
                                  onClick={() => toggleSlot(dayId, slotId)}
                                  title={`${DAYS[dayIndex]} ${slotInfo.slot_name} ${isAvailable ? '可排课' : '不可排课'}${slot?.reason ? ` - ${slot.reason}` : ''}`}
                                >
                                  <div className="h-12 flex flex-col items-center justify-center relative">
                                    <span className="text-white text-xs font-medium">
                                      {isAvailable ? '✓' : '✗'}
                                    </span>
                                    {!isAvailable && hasReason && (
                                      <button
                                        onClick={(e) => handleReasonClick(dayId, slotId, e)}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-white text-[10px] hover:bg-yellow-600 transition"
                                        title={slot?.reason}
                                      >
                                        !
                                      </button>
                                    )}
                                    {!isAvailable && !hasReason && (
                                      <button
                                        onClick={(e) => handleReasonClick(dayId, slotId, e)}
                                        className="absolute -bottom-0.5 text-[9px] text-white/80 hover:text-white transition"
                                        title="添加原因"
                                      >
                                        +原因
                                      </button>
                                    )}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAvailabilityModal(false)
                      setSelectedReasonSlot(null)
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAvailability}
                    disabled={savingAvailability}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingAvailability ? '保存中...' : '保存'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
