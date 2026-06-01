import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  AlertTriangle,
  User,
  Users,
  Home,
  AlertCircle,
  FlaskConical,
  CalendarClock,
  Clock,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Info
} from 'lucide-react'
import { message, Modal, Tooltip } from 'antd'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Schedule {
  id: number
  course_id: number
  course_name: string
  course_type: string
  teacher_id: number
  teacher_name: string
  class_id: number
  class_name: string
  class_student_count: number
  classroom_id: number
  classroom_name: string
  classroom_capacity: number
  classroom_type: string
  day_of_week: number
  slot_id: number
  slot_name: string
  start_time: string
  end_time: string
  week_type: string
  start_week: number
  end_week: number
  semester: string
  status: string
}

interface Course { id: number; name: string; course_type: string }
interface Teacher { id: number; name: string }
interface Class { id: number; name: string; student_count: number }
interface Classroom { id: number; name: string; capacity: number; classroom_type: string }
interface TimeSlot { id: number; slot_no: number; name: string; start_time: string; end_time: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ApiResponse<T = any> {
  success: boolean
  data: T
  error?: string
  conflicts?: Conflict[]
  structured_conflicts?: Conflict[]
}

interface Conflict {
  type: string
  severity: 'error' | 'warning'
  category: string
  title: string
  message: string
  detailed_message: string
  suggestion: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: any
}

type ConflictConfig = {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
  category: string
}

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const weekTypeMap: Record<string, string> = { all: '全周', odd: '单周', even: '双周' }

const conflictConfig: Record<string, ConflictConfig> = {
  teacher_time: {
    label: '教师时间冲突',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <User className="w-4 h-4" />,
    category: 'teacher'
  },
  teacher_unavailable: {
    label: '教师可用时段冲突',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <CalendarClock className="w-4 h-4" />,
    category: 'teacher'
  },
  classroom_time: {
    label: '教室时间冲突',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: <Home className="w-4 h-4" />,
    category: 'classroom'
  },
  class_time: {
    label: '班级时间冲突',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: <Users className="w-4 h-4" />,
    category: 'class'
  },
  class_unavailable: {
    label: '班级可排时段冲突',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: <Clock className="w-4 h-4" />,
    category: 'class'
  },
  capacity_insufficient: {
    label: '教室容量不足',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <AlertTriangle className="w-4 h-4" />,
    category: 'capacity'
  },
  odd_even_overlap: {
    label: '单双周重叠',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: <AlertCircle className="w-4 h-4" />,
    category: 'odd_even'
  },
  classroom_type_mismatch: {
    label: '实验课类型不匹配',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    icon: <FlaskConical className="w-4 h-4" />,
    category: 'classroom_type'
  }
}

const categoryLabels: Record<string, string> = {
  teacher: '教师冲突',
  classroom: '教室冲突',
  class: '班级冲突',
  capacity: '容量冲突',
  odd_even: '周次冲突',
  classroom_type: '实验室冲突'
}

export default function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [semesters, setSemesters] = useState<string[]>([])
  const [, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('2024-2025-2')
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [checkingConflict, setCheckingConflict] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showConflictConfirm, setShowConflictConfirm] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)
  const [formData, setFormData] = useState({
    course_id: '',
    teacher_id: '',
    class_id: '',
    classroom_id: '',
    day_of_week: '1',
    slot_id: '1',
    week_type: 'all',
    start_week: 1,
    end_week: 18,
    semester: '2024-2025-2',
  })

  const [messageApi, messageContextHolder] = message.useMessage()
  const [modal, modalContextHolder] = Modal.useModal()

  const loadData = useCallback(async () => {
    setLoading(true)
    const [schedulesRes, coursesRes, teachersRes, classesRes, classroomsRes, slotsRes, semestersRes] = await Promise.all([
      api.schedules.list({ semester: selectedSemester }) as Promise<ApiResponse<Schedule[]>>,
      api.courses.list() as Promise<ApiResponse<Course[]>>,
      api.teachers.list() as Promise<ApiResponse<Teacher[]>>,
      api.classes.list() as Promise<ApiResponse<Class[]>>,
      api.classrooms.list() as Promise<ApiResponse<Classroom[]>>,
      api.schedules.getTimeSlots() as Promise<ApiResponse<TimeSlot[]>>,
      api.schedules.getSemesters() as Promise<ApiResponse<string[]>>,
    ])
    if (schedulesRes.success) setSchedules(schedulesRes.data)
    if (coursesRes.success) setCourses(coursesRes.data)
    if (teachersRes.success) setTeachers(teachersRes.data)
    if (classesRes.success) setClasses(classesRes.data)
    if (classroomsRes.success) setClassrooms(classroomsRes.data)
    if (slotsRes.success) setTimeSlots(slotsRes.data)
    if (semestersRes.success) setSemesters(semestersRes.data)
    setLoading(false)
  }, [selectedSemester])

  useEffect(() => {
    loadData()
  }, [loadData])

  const checkConflict = async (showSuccess = false) => {
    if (!formData.course_id || !formData.teacher_id || !formData.class_id || !formData.classroom_id) {
      messageApi.warning('请先填写完整的排课信息')
      return
    }
    setCheckingConflict(true)
    const data = {
      ...formData,
      course_id: Number(formData.course_id),
      teacher_id: Number(formData.teacher_id),
      class_id: Number(formData.class_id),
      classroom_id: Number(formData.classroom_id),
      day_of_week: Number(formData.day_of_week),
      slot_id: Number(formData.slot_id),
    }
    const res = await api.schedules.checkConflict(data) as Promise<ApiResponse<{ structured_conflicts: Conflict[]; conflicts: Conflict[] }>>
    if (res.success) {
      const newConflicts = res.data.structured_conflicts || res.data.conflicts || []
      setConflicts(newConflicts)
      setExpandedCategories(new Set(newConflicts.map((c: Conflict) => c.category)))
      if (showSuccess && newConflicts.length === 0) {
        messageApi.success('未检测到冲突，可以安全排课')
      }
    }
    setCheckingConflict(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingSubmit) {
      if (!formData.course_id || !formData.teacher_id || !formData.class_id || !formData.classroom_id) {
        messageApi.warning('请填写完整的排课信息')
        return
      }
      setCheckingConflict(true)
      const data = {
        ...formData,
        course_id: Number(formData.course_id),
        teacher_id: Number(formData.teacher_id),
        class_id: Number(formData.class_id),
        classroom_id: Number(formData.classroom_id),
        day_of_week: Number(formData.day_of_week),
        slot_id: Number(formData.slot_id),
      }
      const res = await api.schedules.checkConflict(data) as Promise<ApiResponse<{ structured_conflicts: Conflict[]; conflicts: Conflict[] }>>
      setCheckingConflict(false)
      if (res.success) {
        const newConflicts = res.data.structured_conflicts || res.data.conflicts || []
        setConflicts(newConflicts)
        setExpandedCategories(new Set(newConflicts.map((c: Conflict) => c.category)))
        if (newConflicts.length > 0) {
          setShowConflictConfirm(true)
          return
        }
      }
    }
    setPendingSubmit(false)
    setShowConflictConfirm(false)
    await doSubmit()
  }

  const doSubmit = async () => {
    const data = {
      ...formData,
      course_id: Number(formData.course_id),
      teacher_id: Number(formData.teacher_id),
      class_id: Number(formData.class_id),
      classroom_id: Number(formData.classroom_id),
      day_of_week: Number(formData.day_of_week),
      slot_id: Number(formData.slot_id),
    }

    if (editingSchedule) {
      const res = await api.schedules.update(editingSchedule.id, data) as Promise<ApiResponse<Schedule>>
      if (res.success) {
        setShowModal(false)
        messageApi.success('排课更新成功')
        loadData()
      } else {
        if (res.structured_conflicts || res.conflicts) {
          setConflicts(res.structured_conflicts || res.conflicts)
          setExpandedCategories(new Set((res.structured_conflicts || res.conflicts).map((c: Conflict) => c.category)))
        }
        messageApi.error(res.error || '操作失败')
      }
    } else {
      const res = await api.schedules.create(data) as Promise<ApiResponse<Schedule>>
      if (res.success) {
        setShowModal(false)
        messageApi.success('排课创建成功')
        loadData()
      } else {
        if (res.structured_conflicts || res.conflicts) {
          setConflicts(res.structured_conflicts || res.conflicts)
          setExpandedCategories(new Set((res.structured_conflicts || res.conflicts).map((c: Conflict) => c.category)))
        }
        messageApi.error(res.error || '操作失败')
      }
    }
  }

  const handleConfirmedSubmit = () => {
    setPendingSubmit(true)
    doSubmit()
  }

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      course_id: schedule.course_id.toString(),
      teacher_id: schedule.teacher_id.toString(),
      class_id: schedule.class_id.toString(),
      classroom_id: schedule.classroom_id.toString(),
      day_of_week: schedule.day_of_week.toString(),
      slot_id: schedule.slot_id.toString(),
      week_type: schedule.week_type,
      start_week: schedule.start_week,
      end_week: schedule.end_week,
      semester: schedule.semester,
    })
    setConflicts([])
    setExpandedCategories(new Set())
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这条排课吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await api.schedules.delete(id) as Promise<ApiResponse<any>>
        if (res.success) {
          messageApi.success('删除成功')
          loadData()
        } else {
          messageApi.error(res.error || '删除失败')
        }
      }
    })
  }

  const filteredSchedules = schedules.filter(
    (s) =>
      s.course_name.includes(searchText) ||
      s.teacher_name.includes(searchText) ||
      s.class_name.includes(searchText)
  )

  const getScheduleBySlot = (day: number, slotId: number) => {
    return filteredSchedules.filter((s) => s.day_of_week === day && s.slot_id === slotId)
  }

  const hasCapacityIssue = (schedule: Schedule) => {
    return schedule.classroom_capacity < schedule.class_student_count
  }

  const isExperimentMismatch = (schedule: Schedule) => {
    return schedule.course_type === 'experiment' && schedule.classroom_type !== 'experiment'
  }

  const hasConflict = (schedule: Schedule) => {
    return hasCapacityIssue(schedule) || isExperimentMismatch(schedule)
  }

  const groupedConflicts = useMemo(() => {
    const groups: Record<string, Conflict[]> = {}
    conflicts.forEach(c => {
      if (!groups[c.category]) {
        groups[c.category] = []
      }
      groups[c.category].push(c)
    })
    return groups
  }, [conflicts])

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const getTooltipContent = (schedule: Schedule) => {
    const items = [
      <div key="course" className="font-medium">{schedule.course_name}</div>,
      <div key="teacher" className="text-sm">教师：{schedule.teacher_name}</div>,
      <div key="class" className="text-sm">班级：{schedule.class_name} ({schedule.class_student_count}人)</div>,
      <div key="room" className="text-sm">教室：{schedule.classroom_name} (容量{schedule.classroom_capacity}人)</div>,
      <div key="time" className="text-sm">时间：{weekDays[schedule.day_of_week - 1]} {schedule.slot_name}</div>,
      <div key="week" className="text-sm">周次：{weekTypeMap[schedule.week_type]} 第{schedule.start_week}-{schedule.end_week}周</div>,
    ]
    if (hasCapacityIssue(schedule)) {
      items.push(<div key="capacity" className="text-sm text-red-600 font-medium mt-1">⚠️ 容量不足：教室{schedule.classroom_capacity}人，班级{schedule.class_student_count}人</div>)
    }
    if (isExperimentMismatch(schedule)) {
      items.push(<div key="lab" className="text-sm text-teal-600 font-medium">🧪 实验室要求：需要实验室，但当前是{schedule.classroom_type === 'normal' ? '普通' : schedule.classroom_type === 'multimedia' ? '多媒体' : '阶梯'}教室</div>)
    }
    return <div className="space-y-1">{items}</div>
  }

  const getConflictIcon = (severity: string) => {
    if (severity === 'error') {
      return <AlertCircle className="w-4 h-4 text-red-500" />
    }
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />
  }

  return (
    <div className="space-y-4">
      {messageContextHolder}
      {modalContextHolder}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">排课计划</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="2024-2025-2">2024-2025学年第二学期</option>
            {semesters.filter(s => s !== '2024-2025-2').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="搜索课程..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-48" />
          </div>
          <button onClick={() => { setEditingSchedule(null); setFormData({ course_id: '', teacher_id: '', class_id: '', classroom_id: '', day_of_week: '1', slot_id: '1', week_type: 'all', start_week: 1, end_week: 18, semester: selectedSemester }); setConflicts([]); setExpandedCategories(new Set()); setShowModal(true) }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <Plus className="w-4 h-4 mr-2" />新增排课
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 w-24">时间</th>
                {weekDays.map((day, i) => (
                  <th key={i} className="px-2 py-3 text-center text-xs font-medium text-gray-500 min-w-32">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot.id} className="border-t border-gray-100">
                  <td className="px-2 py-3 text-center text-xs text-gray-500">
                    <div className="font-medium">{slot.name}</div>
                    <div className="text-gray-400">{slot.start_time}-{slot.end_time}</div>
                  </td>
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const slotSchedules = getScheduleBySlot(day, slot.id)
                    return (
                      <td key={day} className="px-1 py-2 border-l border-gray-100">
                        {slotSchedules.map((s) => (
                          <Tooltip key={s.id} title={getTooltipContent(s)} placement="topLeft" overlayInnerStyle={{ maxWidth: '320px' }}>
                            <div
                              className={cn(
                                "p-2 rounded-lg mb-1 text-xs relative group cursor-pointer transition-all duration-200",
                                s.status === 'cancelled' ? 'bg-gray-100 text-gray-400 line-through' :
                                s.status === 'adjusted' ? 'bg-orange-50 border border-orange-200 text-orange-700' :
                                hasConflict(s) ? 'bg-red-50 border-2 border-red-400 text-red-700 shadow-sm' :
                                'bg-blue-50 border border-blue-200 text-blue-700'
                              )}
                            >
                              <div className="font-medium truncate flex items-center gap-1">
                                {s.course_name}
                                {isExperimentMismatch(s) && (
                                  <span className="text-teal-600" title="实验课类型不匹配">
                                    <FlaskConical className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-500 truncate">{s.teacher_name}</div>
                              <div className="text-gray-400 truncate flex items-center gap-1">
                                {s.classroom_name}
                                {hasCapacityIssue(s) && (
                                  <span className="text-red-600 font-medium" title="容量不足">
                                    <AlertTriangle className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {s.classroom_capacity}/{s.class_student_count}人
                              </div>
                              {hasCapacityIssue(s) && (
                                <div className="text-[10px] text-red-600 font-medium mt-0.5">
                                  容量不足
                                </div>
                              )}
                              {isExperimentMismatch(s) && (
                                <div className="text-[10px] text-teal-600 font-medium mt-0.5">
                                  需实验室
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-gray-400 text-[10px]">{weekTypeMap[s.week_type]}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEdit(s)} className="text-blue-500 hover:text-blue-700"><Edit2 className="w-3 h-3" /></button>
                                  <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              </div>
                            </div>
                          </Tooltip>
                        ))}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500 bg-white rounded-lg p-3 shadow-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200"></div>
          <span>正常排课</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-50 border-2 border-red-400"></div>
          <span>冲突排课</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-50 border border-orange-200"></div>
          <span>已调整</span>
        </div>
        <div className="flex items-center gap-1">
          <FlaskConical className="w-3 h-3 text-teal-600" />
          <span>实验室要求</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          <span>容量不足</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-800">{editingSchedule ? '编辑排课' : '新增排课'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">课程 *</label>
                  <select value={formData.course_id} onChange={(e) => setFormData({ ...formData, course_id: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">请选择课程</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.name} {c.course_type === 'experiment' ? '(实验课)' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">教师 *</label>
                  <select value={formData.teacher_id} onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">请选择教师</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">班级 *</label>
                  <select value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">请选择班级</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.student_count}人)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">教室 *</label>
                  <select value={formData.classroom_id} onChange={(e) => setFormData({ ...formData, classroom_id: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">请选择教室</option>
                    {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name} (容量: {c.capacity}, {c.classroom_type === 'normal' ? '普通' : c.classroom_type === 'experiment' ? '实验' : c.classroom_type === 'multimedia' ? '多媒体' : '阶梯'}教室)</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">星期 *</label>
                  <select value={formData.day_of_week} onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {weekDays.map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">节次 *</label>
                  <select value={formData.slot_id} onChange={(e) => setFormData({ ...formData, slot_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {timeSlots.map((s) => <option key={s.id} value={s.id}>{s.name} {s.start_time}-{s.end_time}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">周次类型</label>
                  <select value={formData.week_type} onChange={(e) => setFormData({ ...formData, week_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="all">全周</option>
                    <option value="odd">单周</option>
                    <option value="even">双周</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始周</label>
                  <input type="number" min="1" max="18" value={formData.start_week} onChange={(e) => setFormData({ ...formData, start_week: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束周</label>
                  <input type="number" min="1" max="18" value={formData.end_week} onChange={(e) => setFormData({ ...formData, end_week: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学期</label>
                  <input type="text" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <button type="button" onClick={() => checkConflict(true)} disabled={checkingConflict} className="w-full py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                {checkingConflict ? (
                  <><span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></span>检查中...</>
                ) : (
                  <><AlertTriangle className="w-4 h-4" />检测冲突</>
                )}
              </button>

              {conflicts.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-gray-800">发现 {conflicts.length} 个冲突</span>
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                        {conflicts.filter(c => c.severity === 'error').length} 个严重
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                        {conflicts.filter(c => c.severity === 'warning').length} 个警告
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const allCategories = new Set(conflicts.map(c => c.category))
                        if (expandedCategories.size === allCategories.size) {
                          setExpandedCategories(new Set())
                        } else {
                          setExpandedCategories(allCategories)
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {expandedCategories.size === new Set(conflicts.map(c => c.category)).size ? '全部收起' : '全部展开'}
                    </button>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {Object.entries(groupedConflicts).map(([category, categoryConflicts]) => (
                      <div key={category}>
                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {conflictConfig[categoryConflicts[0].type]?.icon || <AlertCircle className="w-4 h-4 text-gray-500" />}
                            <span className="font-medium text-gray-700">
                              {categoryLabels[category] || category}
                            </span>
                            <span className="text-xs text-gray-500">({categoryConflicts.length}项)</span>
                          </div>
                          {expandedCategories.has(category) ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <div className={cn(
                          "overflow-hidden transition-all duration-300 ease-in-out",
                          expandedCategories.has(category) ? "max-h-[1000px]" : "max-h-0"
                        )}>
                          <div className="px-4 pb-3 space-y-2">
                            {categoryConflicts.map((conflict, idx) => {
                              const config = conflictConfig[conflict.type] as ConflictConfig | undefined
                              return (
                                <div
                                  key={idx}
                                  className={cn(
                                    "p-3 rounded-lg border transition-all",
                                    config?.bgColor,
                                    config?.borderColor
                                  )}
                                >
                                  <div className="flex items-start gap-2">
                                    <div className="mt-0.5">
                                      {getConflictIcon(conflict.severity)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className={cn("font-medium text-sm", config?.color)}>
                                        {conflict.title}
                                      </div>
                                      <div className="text-sm text-gray-700 mt-1">
                                        {conflict.message}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {conflict.detailed_message}
                                      </div>
                                      <div className="flex items-start gap-1 mt-2 text-xs bg-white/50 p-2 rounded">
                                        <Lightbulb className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-600">
                                          <span className="font-medium">建议：</span>{conflict.suggestion}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">{editingSchedule ? '保存' : '创建'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>检测到排课冲突</span>
          </div>
        }
        open={showConflictConfirm}
        onOk={handleConfirmedSubmit}
        onCancel={() => { setShowConflictConfirm(false); setPendingSubmit(false) }}
        okText="继续保存"
        cancelText="取消"
        okType="danger"
        width={600}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            当前排课安排存在以下冲突，确定要继续保存吗？
          </p>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {conflicts.map((conflict, idx) => {
              const config = conflictConfig[conflict.type] as ConflictConfig | undefined
              return (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg border",
                    config?.bgColor,
                    config?.borderColor
                  )}
                >
                  <div className="flex items-start gap-2">
                    {getConflictIcon(conflict.severity)}
                    <div>
                      <div className={cn("font-medium text-sm", config?.color)}>
                        {conflict.title}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        {conflict.message}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
            <Info className="w-4 h-4" />
            <span>保存后请检查课表，冲突的排课会用红色标记显示。</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
