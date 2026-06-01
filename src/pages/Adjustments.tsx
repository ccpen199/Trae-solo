import { useEffect, useState } from 'react'
import { Plus, Search, X, Check, XCircle, FileText, Clock, User, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface Adjustment {
  id: number
  original_schedule_id: number
  course_name: string
  teacher_name: string
  class_name: string
  applicant_id: number
  applicant_name: string
  applicant_type: string
  adjust_type: string
  day_of_week: number
  slot_name: string
  original_classroom: string
  new_day_of_week: number | null
  new_slot_id: number | null
  new_classroom: string | null
  reason: string
  affected_students: string
  status: string
  approver_id: number | null
  approver_name: string | null
  approval_comment: string | null
  approved_at: string | null
  created_at: string
}

interface Schedule {
  id: number
  course_name: string
  teacher_name: string
  class_name: string
  classroom_name: string
  day_of_week: number
  slot_id: number
  slot_name: string
}

const adjustTypeMap: Record<string, string> = {
  change_time: '时间调整',
  change_room: '教室调整',
  cancel: '停课',
  reschedule: '补课',
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待审批', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  cancelled: { label: '已撤销', color: 'bg-gray-100 text-gray-700' },
}

export default function Adjustments() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [approvalComment, setApprovalComment] = useState('')
  const [showApprovalModal, setShowApprovalModal] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null)
  const [formData, setFormData] = useState({
    original_schedule_id: '',
    adjust_type: 'change_time',
    new_day_of_week: '',
    new_slot_id: '',
    new_classroom_id: '',
    reason: '',
  })
  const { user } = useAuthStore()

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const timeSlots = [
    { id: 1, name: '第一节' },
    { id: 2, name: '第二节' },
    { id: 3, name: '第三节' },
    { id: 4, name: '第四节' },
    { id: 5, name: '第五节' },
    { id: 6, name: '第六节' },
    { id: 7, name: '第七节' },
    { id: 8, name: '第八节' },
    { id: 9, name: '第九节' },
    { id: 10, name: '第十节' },
  ]

  useEffect(() => {
    loadData()
  }, [filterStatus])

  const loadData = async () => {
    setLoading(true)
    const params: any = {}
    if (filterStatus !== 'all') params.status = filterStatus
    const [adjRes, schedRes] = await Promise.all([
      api.adjustments.list(params),
      api.schedules.list({ semester: '2024-2025-2' }),
    ])
    if (adjRes.success) setAdjustments(adjRes.data)
    if (schedRes.success) setSchedules(schedRes.data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const schedule = schedules.find((s) => s.id === Number(formData.original_schedule_id))
    if (!schedule) return

    const data = {
      ...formData,
      original_schedule_id: Number(formData.original_schedule_id),
      applicant_id: user?.id || 1,
      applicant_type: user?.role === 'teacher' ? 'teacher' : 'dean',
      original_day_of_week: schedule.day_of_week,
      original_slot_id: schedule.slot_id,
      original_classroom_id: schedules.find(s => s.id === Number(formData.original_schedule_id))?.id,
      new_day_of_week: formData.new_day_of_week ? Number(formData.new_day_of_week) : null,
      new_slot_id: formData.new_slot_id ? Number(formData.new_slot_id) : null,
      new_classroom_id: formData.new_classroom_id ? Number(formData.new_classroom_id) : null,
    }

    const res = await api.adjustments.create(data)
    if (res.success) {
      setShowModal(false)
      loadData()
    } else {
      alert(res.error || '提交失败')
    }
  }

  const handleApproval = async () => {
    if (!showApprovalModal) return
    const fn = showApprovalModal.action === 'approve' ? api.adjustments.approve : api.adjustments.reject
    const res = await fn(showApprovalModal.id, { approver_id: user?.id || 2, approval_comment: approvalComment })
    if (res.success) {
      setShowApprovalModal(null)
      setApprovalComment('')
      loadData()
    } else {
      alert(res.error || '操作失败')
    }
  }

  const handleCancel = async (id: number) => {
    if (confirm('确定要撤销这个申请吗？')) {
      const res = await api.adjustments.cancel(id)
      if (res.success) {
        loadData()
      }
    }
  }

  const canApprove = user?.role === 'admin' || user?.role === 'dean'
  const filteredAdjustments = adjustments.filter(
    (a) => a.course_name.includes(searchText) || a.reason.includes(searchText)
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">调课申请</h1>
        <div className="flex items-center gap-3">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="all">全部状态</option>
            <option value="pending">待审批</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="搜索..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-40" />
          </div>
          <button onClick={() => { setFormData({ original_schedule_id: '', adjust_type: 'change_time', new_day_of_week: '', new_slot_id: '', new_classroom_id: '', reason: '' }); setShowModal(true) }} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <Plus className="w-4 h-4 mr-2" />提交申请
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : filteredAdjustments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无申请记录</div>
        ) : (
          filteredAdjustments.map((adj) => (
            <div key={adj.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-800">{adj.course_name}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusMap[adj.status]?.color}`}>{statusMap[adj.status]?.label}</span>
                    <span className="text-xs text-gray-500">{adjustTypeMap[adj.adjust_type]}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>申请人: {adj.applicant_name || adj.teacher_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>原时间: {weekDays[adj.day_of_week - 1]} {adj.slot_name}</span>
                    </div>
                    {adj.new_day_of_week && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>新时间: {weekDays[adj.new_day_of_week - 1]} {timeSlots.find(s => s.id === adj.new_slot_id)?.name}</span>
                      </div>
                    )}
                    {adj.new_classroom && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>新教室: {adj.new_classroom}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">原因: {adj.reason}</p>
                  {adj.approval_comment && <p className="text-sm text-gray-500 mt-1">审批意见: {adj.approval_comment}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-2">{adj.created_at.slice(0, 10)}</p>
                  {adj.status === 'pending' && (
                    <div className="flex gap-2">
                      {canApprove ? (
                        <>
                          <button onClick={() => setShowApprovalModal({ id: adj.id, action: 'approve' })} className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setShowApprovalModal({ id: adj.id, action: 'reject' })} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"><XCircle className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <button onClick={() => handleCancel(adj.id)} className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">撤销</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">提交调课申请</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择课程 *</label>
                <select value={formData.original_schedule_id} onChange={(e) => setFormData({ ...formData, original_schedule_id: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">请选择要调整的课程</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>{s.course_name} - {weekDays[s.day_of_week - 1]} {s.slot_name} - {s.classroom_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">调整类型 *</label>
                <select value={formData.adjust_type} onChange={(e) => setFormData({ ...formData, adjust_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="change_time">时间调整</option>
                  <option value="change_room">教室调整</option>
                  <option value="cancel">停课</option>
                  <option value="reschedule">补课</option>
                </select>
              </div>
              {(formData.adjust_type === 'change_time' || formData.adjust_type === 'reschedule') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">新星期</label>
                    <select value={formData.new_day_of_week} onChange={(e) => setFormData({ ...formData, new_day_of_week: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">请选择</option>
                      {weekDays.map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">新节次</label>
                    <select value={formData.new_slot_id} onChange={(e) => setFormData({ ...formData, new_slot_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">请选择</option>
                      {timeSlots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {(formData.adjust_type === 'change_room' || formData.adjust_type === 'reschedule') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">新教室</label>
                  <select value={formData.new_classroom_id} onChange={(e) => setFormData({ ...formData, new_classroom_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">请选择</option>
                    <option value="1">教学楼A101</option>
                    <option value="2">教学楼A102</option>
                    <option value="3">实验楼B201</option>
                    <option value="4">教学楼C301</option>
                    <option value="5">实验楼B202</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">申请原因 *</label>
                <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="请详细说明调课原因..." />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">提交申请</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">{showApprovalModal.action === 'approve' ? '通过申请' : '拒绝申请'}</h3>
              <button onClick={() => setShowApprovalModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">审批意见</label>
                <textarea value={approvalComment} onChange={(e) => setApprovalComment(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="请输入审批意见..." />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowApprovalModal(null)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">取消</button>
                <button onClick={handleApproval} className={`px-4 py-2 text-white rounded-lg text-sm ${showApprovalModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {showApprovalModal.action === 'approve' ? '通过' : '拒绝'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
