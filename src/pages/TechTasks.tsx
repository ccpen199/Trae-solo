import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { StarRating } from '../components/StarRating'
import { getCategoryById, getCategoryPath } from '../data/mockData'
import { formatDateTime } from '../utils/geo'
import type { ServiceNode, ServicePart } from '../types'
import {
  MapPin,
  Home,
  Play,
  CheckCircle2,
  FileText,
  Star,
  Plus,
  Minus,
} from 'lucide-react'

const serviceNodes: { node: ServiceNode; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { node: 'door_arrival', label: '已上门', icon: Home, desc: '到达客户地址后打卡' },
  { node: 'start_work', label: '开工', icon: Play, desc: '开始维修作业' },
  { node: 'completed', label: '完工', icon: CheckCircle2, desc: '维修完成待客户验收' },
]

export const TechTasks: React.FC = () => {
  const navigate = useNavigate()
  const {
    tasks,
    currentTechnician,
    addTaskCheckin,
    createServiceReport,
    addReview,
    currentUser,
  } = useAppStore()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [diagnosis, setDiagnosis] = useState('')
  const [parts, setParts] = useState<ServicePart[]>([{ name: '', quantity: 1, unitPrice: 0 }])
  const [warrantyMonths, setWarrantyMonths] = useState(3)
  const [reportNotes, setReportNotes] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')

  const myTasks = tasks.filter(t => t.technicianId === currentTechnician?.id)
  const selectedTask = tasks.find(t => t.id === selectedTaskId)

  const handleCheckin = async (taskId: string, node: ServiceNode) => {
    await addTaskCheckin(taskId, node)
  }

  const handleSubmitReport = async () => {
    if (!selectedTask) return
    await createServiceReport({
      taskId: selectedTask.id,
      diagnosis,
      parts: parts.filter(p => p.name),
      warrantyMonths,
      notes: reportNotes,
    })
    setShowReportModal(false)
    setDiagnosis('')
    setParts([{ name: '', quantity: 1, unitPrice: 0 }])
    setWarrantyMonths(3)
    setReportNotes('')
  }

  const handleSubmitReview = async () => {
    if (!selectedTask || !currentTechnician || !currentUser) return
    await addReview({
      taskId: selectedTask.id,
      fromUserId: currentTechnician.id,
      toUserId: selectedTask.userId,
      fromRole: 'technician',
      rating: reviewRating,
      content: reviewContent,
    })
    setShowReviewModal(false)
    setReviewRating(5)
    setReviewContent('')
  }

  const addPart = () => {
    setParts(prev => [...prev, { name: '', quantity: 1, unitPrice: 0 }])
  }

  const updatePart = (index: number, field: keyof ServicePart, value: string | number) => {
    setParts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const removePart = (index: number) => {
    setParts(prev => prev.filter((_, i) => i !== index))
  }

  const getCompletedNodes = (task: typeof selectedTask) => {
    if (!task) return new Set<ServiceNode>()
    return new Set(task.checkins.map(c => c.node))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">我的任务</h2>

      {myTasks.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">
          暂无进行中的任务
        </div>
      ) : (
        myTasks.map(task => {
          const cat = getCategoryById(task.categoryId)
          const completedNodes = getCompletedNodes(task)
          return (
            <div key={task.id} className="card space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{task.title}</h3>
                    <StatusBadge status={task.status} />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {cat ? getCategoryPath(cat.id).map(c => c.name).join(' / ') : '未分类'}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600">{task.description}</p>

              <div className="text-sm text-gray-500 space-y-1">
                <p className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />{task.address}
                </p>
                <p>📅 发布时间：{formatDateTime(task.createdAt)}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">服务节点打卡</p>
                <div className="space-y-2">
                  {serviceNodes.map(({ node, label, icon: Icon, desc }) => {
                    const done = completedNodes.has(node)
                    const prevDone = node === 'door_arrival' ||
                      (node === 'start_work' && completedNodes.has('door_arrival')) ||
                      (node === 'completed' && completedNodes.has('start_work'))
                    return (
                      <button
                        key={node}
                        onClick={() => prevDone && !done && handleCheckin(task.id, node)}
                        disabled={done || !prevDone}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          done
                            ? 'bg-success-50 border-success-200'
                            : prevDone
                              ? 'border-primary-300 bg-primary-50 hover:bg-primary-100 cursor-pointer'
                              : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          done ? 'bg-success-500 text-white' : prevDone ? 'bg-primary-500 text-white' : 'bg-gray-300 text-white'
                        }`}>
                          {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{label}</p>
                          <p className="text-xs text-gray-500">{desc}</p>
                        </div>
                        {done && task.checkins.find(c => c.node === node) && (
                          <span className="text-xs text-success-600">
                            {formatDateTime(task.checkins.find(c => c.node === node)!.timestamp)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {task.status === 'in_progress' && !task.serviceReportId && (
                  <button onClick={() => {
                    setSelectedTaskId(task.id)
                    setShowReportModal(true)
                  }} className="btn-primary">
                    <FileText className="w-4 h-4 inline mr-1" />
                    生成服务报告
                  </button>
                )}
                {task.serviceReportId && (
                  <button className="btn-secondary" onClick={() => navigate(`/report/${task.serviceReportId}`)}>
                    <FileText className="w-4 h-4 inline mr-1" />
                    查看服务报告
                  </button>
                )}
                {task.status === 'paid' && !task.technicianReviewId && (
                  <button onClick={() => {
                    setSelectedTaskId(task.id)
                    setShowReviewModal(true)
                  }} className="btn-warning">
                    <Star className="w-4 h-4 inline mr-1" />
                    评价客户
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}

      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="生成服务报告"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">故障诊断</label>
            <textarea
              className="input min-h-[80px]"
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              placeholder="请详细说明故障原因和诊断过程"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">更换配件清单</label>
              <button onClick={addPart} className="text-sm text-primary-600 flex items-center gap-1">
                <Plus className="w-4 h-4" /> 添加配件
              </button>
            </div>
            <div className="space-y-2">
              {parts.map((part, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="配件名称"
                    value={part.name}
                    onChange={e => updatePart(idx, 'name', e.target.value)}
                  />
                  <input
                    type="number"
                    className="input w-20"
                    placeholder="数量"
                    value={part.quantity}
                    onChange={e => updatePart(idx, 'quantity', parseInt(e.target.value) || 1)}
                  />
                  <input
                    type="number"
                    className="input w-24"
                    placeholder="单价"
                    value={part.unitPrice}
                    onChange={e => updatePart(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                  {parts.length > 1 && (
                    <button onClick={() => removePart(idx)} className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg">
                      <Minus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">质保期限（月）</label>
            <select
              className="input"
              value={warrantyMonths}
              onChange={e => setWarrantyMonths(parseInt(e.target.value))}
            >
              <option value={1}>1个月</option>
              <option value={3}>3个月</option>
              <option value={6}>6个月</option>
              <option value={12}>12个月</option>
              <option value={24}>24个月</option>
            </select>
          </div>

          <div>
            <label className="label">备注（可选）</label>
            <textarea
              className="input min-h-[60px]"
              value={reportNotes}
              onChange={e => setReportNotes(e.target.value)}
              placeholder="其他需要说明的事项"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowReportModal(false)} className="btn-secondary flex-1">取消</button>
            <button onClick={handleSubmitReport} disabled={!diagnosis} className="btn-primary flex-1">
              提交服务报告
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="评价客户">
        <div className="space-y-4">
          {selectedTask && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">订单：{selectedTask.title}</p>
              <p className="text-sm text-gray-500">地址：{selectedTask.address}</p>
            </div>
          )}
          <div>
            <label className="label">客户评分</label>
            <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
          </div>
          <div>
            <label className="label">评价内容</label>
            <textarea
              className="input min-h-[100px]"
              value={reviewContent}
              onChange={e => setReviewContent(e.target.value)}
              placeholder="请评价客户的配合度等..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowReviewModal(false)} className="btn-secondary flex-1">取消</button>
            <button onClick={handleSubmitReview} className="btn-primary flex-1">提交评价</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
