import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { StarRating } from '../components/StarRating'
import { getCategoryById, getCategoryPath, mockSkillTags } from '../data/mockData'
import { formatDateTime, formatDistance } from '../utils/geo'
import { formatMoney } from '../utils/matching'
import { matchTechnicians } from '../utils/matching'
import type { ServiceNode, RepairTask } from '../types'
import {
  Camera,
  Star,
  FileText,
  Upload,
  Radio,
  Home,
  Play,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  User as UserIcon,
  BadgeCheck,
  Unlock,
  Lock,
  Eye,
} from 'lucide-react'

const nodeConfig: Record<ServiceNode, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  door_arrival: { label: '师傅已上门', icon: Home },
  start_work: { label: '开始维修', icon: Play },
  completed: { label: '维修完工', icon: CheckCircle2 },
}

const timelineSteps = [
  { key: 'broadcasting', label: '广播派单', icon: Radio },
  { key: 'accepted', label: '师傅接单', icon: UserIcon },
  { key: 'arrived', label: '到达现场', icon: Home },
  { key: 'in_progress', label: '维修中', icon: Play },
  { key: 'completed', label: '维修完工', icon: CheckCircle2 },
  { key: 'paid', label: '已支付', icon: Camera },
  { key: 'reviewed', label: '已评价', icon: Star },
]

const getStepStatus = (taskStatus: string, stepKey: string): 'done' | 'current' | 'pending' => {
  const order = ['broadcasting', 'accepted', 'arrived', 'in_progress', 'completed', 'paid', 'reviewed']
  const currentIdx = order.indexOf(taskStatus)
  const stepIdx = order.indexOf(stepKey)
  if (stepIdx < currentIdx) return 'done'
  if (stepIdx === currentIdx) return 'current'
  return 'pending'
}

export const UserTasks: React.FC = () => {
  const navigate = useNavigate()
  const { tasks, technicians, addReview, uploadPaymentProof, currentUser, reviews, reports, payments, unfreezeTechnician } = useAppStore()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showTechDetailModal, setShowTechDetailModal] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewContent, setReviewContent] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentImage, setPaymentImage] = useState('')

  const selectedTask = tasks.find(t => t.id === selectedTaskId)
  const selectedTech = selectedTask?.technicianId
    ? technicians.find(t => t.id === selectedTask.technicianId)
    : null

  const handlePaymentImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPaymentImage(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmitReview = async () => {
    if (!selectedTask || !selectedTech || !currentUser) return
    await addReview({
      taskId: selectedTask.id,
      fromUserId: currentUser.id,
      toUserId: selectedTech.id,
      fromRole: 'user',
      rating: reviewRating,
      content: reviewContent,
    })
    setShowReviewModal(false)
    setReviewRating(5)
    setReviewContent('')
  }

  const handleSubmitPayment = async () => {
    if (!selectedTask || !paymentImage || !paymentAmount) return
    await uploadPaymentProof({
      taskId: selectedTask.id,
      imageUrl: paymentImage,
      amount: paymentAmount,
    })
    setShowPaymentModal(false)
    setPaymentImage('')
    setPaymentAmount(0)
  }

  const myTasks = tasks.filter(t => t.userId === currentUser?.id || currentUser?.role === 'user')

  const getTaskReport = (taskId: string) => reports.find(r => r.taskId === taskId)
  const getTaskPayment = (taskId: string) => payments.find(p => p.taskId === taskId)
  const getTaskUserReview = (taskId: string) => reviews.find(r => r.taskId === taskId && r.fromRole === 'user')
  const getTaskTechReview = (taskId: string) => reviews.find(r => r.taskId === taskId && r.fromRole === 'technician')
  const getBroadcastingTechs = (task: RepairTask) => matchTechnicians(task, technicians, task.location).slice(0, 5)

  const toggleExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">我的订单</h2>
        <span className="text-sm text-gray-500">共 {myTasks.length} 单</span>
      </div>

      {myTasks.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">暂无订单</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary mt-4"
          >
            去发布维修任务
          </button>
        </div>
      ) : (
        myTasks.map(task => {
          const cat = getCategoryById(task.categoryId)
          const tech = task.technicianId ? technicians.find(t => t.id === task.technicianId) : null
          const report = getTaskReport(task.id)
          const payment = getTaskPayment(task.id)
          const userReview = getTaskUserReview(task.id)
          const techReview = getTaskTechReview(task.id)
          const isExpanded = expandedTaskId === task.id
          const broadcastTechs = task.status === 'broadcasting' ? getBroadcastingTechs(task) : []

          return (
            <div key={task.id} className="card space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{task.title}</h3>
                    <StatusBadge status={task.status} />
                    {tech?.frozen && <span className="badge-danger">师傅已冻结</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {cat ? getCategoryPath(cat.id).map(c => c.name).join(' / ') : '未分类'}
                  </p>
                </div>
                <button
                  onClick={() => toggleExpand(task.id)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                >
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <div className="flex justify-between">
                  {timelineSteps.map((step, idx) => {
                    const StepIcon = step.icon
                    const status = getStepStatus(task.status, step.key)
                    const isLast = idx === timelineSteps.length - 1
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                          status === 'done' ? 'bg-success-500 text-white' :
                          status === 'current' ? 'bg-primary-500 text-white animate-pulse' :
                          'bg-gray-200 text-gray-400'
                        }`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] mt-1 text-center ${
                          status === 'pending' ? 'text-gray-400' : 'text-gray-700'
                        }`}>
                          {step.label}
                        </span>
                        {!isLast && (
                          <div className={`absolute top-4 left-1/2 w-full h-0.5 ${
                            status === 'done' ? 'bg-success-500' : 'bg-gray-200'
                          }`} style={{ marginLeft: '4px' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {isExpanded && (
                <div className="space-y-4 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{task.address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">期望 {task.expectedResponseTime} 分钟内响应</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">故障描述</p>
                    <p className="text-sm text-gray-700">{task.description || '无描述'}</p>
                  </div>

                  {task.images.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">故障图片</p>
                      <div className="flex gap-2 flex-wrap">
                        {task.images.map((img, i) => (
                          <img key={i} src={img} alt="" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                        ))}
                      </div>
                    </div>
                  )}

                  {task.status === 'broadcasting' && (
                    <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-3">
                        <Radio className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <p className="font-medium text-primary-800">正在向周边师傅实时广播</p>
                          <p className="text-xs text-primary-700 mt-0.5">
                            发布于 {formatDateTime(task.createdAt)}，已推送给 {broadcastTechs.length} 位匹配的师傅
                          </p>
                        </div>
                      </div>
                      {broadcastTechs.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-primary-700 font-medium">📡 推送中的师傅：</p>
                          {broadcastTechs.map(m => (
                            <div key={m.technician.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-primary-100">
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-medium">
                                {m.technician.name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{m.technician.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDistance(m.distanceKm)} · 评分{m.technician.rating}
                                </p>
                              </div>
                              <span className="text-xs text-primary-600 font-medium">
                                {Math.round(m.totalScore * 100)}%匹配
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {tech && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">接单师傅</p>
                      <div
                        onClick={() => {
                          setSelectedTaskId(task.id)
                          setShowTechDetailModal(true)
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 cursor-pointer transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-lg">
                          {tech.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{tech.name}</p>
                            {tech.certificates.some(c => c.verified) && (
                              <BadgeCheck className="w-4 h-4 text-primary-600" />
                            )}
                            {tech.frozen && (
                              <span className="badge-danger flex items-center gap-0.5">
                                <Lock className="w-3 h-3" /> 已冻结
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span>⭐ {tech.rating}</span>
                            <span>📋 {tech.reviewCount}单</span>
                            <span>📍 服务{tech.serviceRadius}km</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {mockSkillTags.filter(s => tech.skillTags.includes(s.id)).slice(0, 4).map(s => (
                              <span key={s.id} className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-600">
                                {s.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  )}

                  {task.checkins.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">服务节点打卡记录</p>
                      <div className="space-y-2">
                        {(['door_arrival', 'start_work', 'completed'] as ServiceNode[]).map(node => {
                          const checkin = task.checkins.find(c => c.node === node)
                          const config = nodeConfig[node]
                          const ConfigIcon = config.icon
                          return (
                            <div key={node} className={`flex items-center gap-3 p-2 rounded-lg ${
                              checkin ? 'bg-success-50' : 'bg-gray-50 opacity-60'
                            }`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                checkin ? 'bg-success-500 text-white' : 'bg-gray-200 text-gray-400'
                              }`}>
                                {checkin ? <ConfigIcon className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${checkin ? '' : 'text-gray-400'}`}>
                                  {config.label}
                                </p>
                                {checkin && (
                                  <p className="text-xs text-success-700">{formatDateTime(checkin.timestamp)}</p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {report && (
                    <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <FileText className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-teal-800">服务报告已生成</p>
                          <p className="text-xs text-teal-700 mt-0.5">
                            {formatDateTime(report.createdAt)} · 质保 {report.warrantyMonths} 个月
                          </p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 mb-3">
                        <p className="text-xs text-gray-500 mb-1">故障诊断</p>
                        <p className="text-sm text-gray-700">{report.diagnosis}</p>
                      </div>
                      {report.parts.length > 0 && (
                        <div className="bg-white rounded-lg p-3 mb-3">
                          <p className="text-xs text-gray-500 mb-2">更换配件（共 {formatMoney(report.parts.reduce((s, p) => s + p.quantity * p.unitPrice, 0))}）</p>
                          <div className="space-y-1">
                            {report.parts.map((p, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-700">{p.name} × {p.quantity}</span>
                                <span className="text-gray-900 font-medium">{formatMoney(p.unitPrice * p.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => navigate(`/report/${report.id}`)}
                        className="btn-secondary w-full text-sm"
                      >
                        <FileText className="w-4 h-4 inline mr-1" /> 查看完整服务报告
                      </button>
                    </div>
                  )}

                  {payment && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Camera className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-green-800">支付凭证已上传</p>
                            <span className="font-bold text-green-700">{formatMoney(payment.amount)}</span>
                          </div>
                          <p className="text-xs text-green-700 mt-0.5">{formatDateTime(payment.uploadedAt)}</p>
                          {payment.imageUrl && (
                            <img src={payment.imageUrl} alt="支付凭证" className="mt-2 w-full max-w-xs rounded-lg border border-green-200" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {(userReview || techReview) && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500">双向互评记录</p>
                      {userReview && (
                        <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-warning-800">我对师傅的评价</span>
                            <StarRating value={userReview.rating} readonly size="sm" />
                          </div>
                          <p className="text-sm text-warning-700">{userReview.content || '未填写评价'}</p>
                          <p className="text-xs text-warning-500 mt-1">{formatDateTime(userReview.createdAt)}</p>
                        </div>
                      )}
                      {techReview && (
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-indigo-800">师傅对我的评价</span>
                            <StarRating value={techReview.rating} readonly size="sm" />
                          </div>
                          <p className="text-sm text-indigo-700">{techReview.content || '未填写评价'}</p>
                          <p className="text-xs text-indigo-500 mt-1">{formatDateTime(techReview.createdAt)}</p>
                        </div>
                      )}
                      {tech?.frozen && userReview && userReview.rating <= 2 && (
                        <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-danger-800">差评自动冻结已触发</p>
                              <p className="text-xs text-danger-700 mt-1">
                                您的差评已触发师傅账号自动冻结，该师傅暂无法接单。
                                如为误评，您可以联系平台人工复核解禁。
                              </p>
                              <button
                                onClick={() => unfreezeTechnician(tech.id)}
                                className="btn-danger text-xs mt-2"
                              >
                                <Unlock className="w-3 h-3 inline mr-1" />
                                申请人工复核解禁
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {task.status === 'completed' && !payment && (
                  <button onClick={() => {
                    setSelectedTaskId(task.id)
                    setShowPaymentModal(true)
                  }} className="btn-success text-sm">
                    <Camera className="w-4 h-4 inline mr-1" />
                    上传支付凭证
                  </button>
                )}
                {payment && !userReview && (
                  <button onClick={() => {
                    setSelectedTaskId(task.id)
                    setShowReviewModal(true)
                  }} className="btn-warning text-sm">
                    <Star className="w-4 h-4 inline mr-1" />
                    评价师傅服务
                  </button>
                )}
                {report && (
                  <button className="btn-secondary text-sm" onClick={() => navigate(`/report/${report.id}`)}>
                    <FileText className="w-4 h-4 inline mr-1" />
                    服务报告
                  </button>
                )}
                {tech && (
                  <button
                    onClick={() => {
                      setSelectedTaskId(task.id)
                      setShowTechDetailModal(true)
                    }}
                    className="btn-secondary text-sm"
                  >
                    <UserIcon className="w-4 h-4 inline mr-1" />
                    师傅档案
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}

      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="评价师傅服务">
        {selectedTask && selectedTech && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-lg">
                {selectedTech.name[0]}
              </div>
              <div>
                <p className="font-medium">{selectedTech.name}</p>
                <p className="text-sm text-gray-500">{selectedTask.title}</p>
              </div>
            </div>
            <div>
              <label className="label">服务评分</label>
              <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
              <div className="flex gap-2 mt-1">
                {['非常差', '较差', '一般', '满意', '非常满意'].map((label, i) => (
                  <span
                    key={i}
                    className={`text-xs ${reviewRating === i + 1 ? 'text-primary-600 font-medium' : 'text-gray-400'}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="label">评价内容</label>
              <textarea
                className="input min-h-[100px]"
                value={reviewContent}
                onChange={e => setReviewContent(e.target.value)}
                placeholder="请分享您的服务体验，包括师傅的专业度、响应速度、维修质量等..."
              />
              {reviewRating <= 2 && (
                <div className="mt-2 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-danger-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-danger-800">差评自动冻结机制已启动</p>
                      <p className="text-[11px] text-danger-700 mt-0.5">
                        提交差评将自动冻结该师傅账号，需人工复核后方可解禁。
                        请确保评价客观真实，如为误评可申请解除冻结。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReviewModal(false)} className="btn-secondary flex-1">取消</button>
              <button onClick={handleSubmitReview} className="btn-primary flex-1">提交评价</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="上传线下支付凭证">
        <div className="space-y-4">
          <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warning-700">
                请上传清晰的支付截图或转账凭证，包括交易金额、时间、收款方信息。
                凭证将加密存储在本地，用于交易记录留存。
              </p>
            </div>
          </div>
          <div>
            <label className="label">实际支付金额（元）</label>
            <input
              type="number"
              className="input"
              value={paymentAmount}
              onChange={e => setPaymentAmount(parseFloat(e.target.value))}
              placeholder="请输入实际支付金额"
            />
          </div>
          <div>
            <label className="label">支付凭证照片</label>
            {paymentImage ? (
              <div className="relative">
                <img src={paymentImage} alt="" className="w-full rounded-lg max-h-64 object-contain bg-gray-100" />
                <button
                  onClick={() => setPaymentImage('')}
                  className="absolute top-2 right-2 px-3 py-1 bg-black/50 text-white rounded-lg text-sm"
                >
                  重新上传
                </button>
              </div>
            ) : (
              <label className="block w-full aspect-video rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500 mt-2">点击上传支付截图/转账凭证</span>
                <span className="text-xs text-gray-400 mt-1">支持微信/支付宝/银行转账截图</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePaymentImage} />
              </label>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowPaymentModal(false)} className="btn-secondary flex-1">取消</button>
            <button
              onClick={handleSubmitPayment}
              disabled={!paymentImage || !paymentAmount}
              className="btn-primary flex-1"
            >
              <ShieldCheck className="w-4 h-4 inline mr-1" /> 确认上传凭证
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showTechDetailModal} onClose={() => setShowTechDetailModal(false)} title="师傅档案详情" size="lg">
        {selectedTech && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
                {selectedTech.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{selectedTech.name}</h3>
                  {selectedTech.certificates.some(c => c.verified) && (
                    <span className="badge-success flex items-center gap-0.5">
                      <BadgeCheck className="w-3 h-3" /> 已认证
                    </span>
                  )}
                  {selectedTech.frozen && (
                    <span className="badge-danger flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> 账号已冻结
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{selectedTech.phone}</p>
                <div className="flex items-center gap-3 mt-2">
                  <StarRating value={Math.round(selectedTech.rating)} readonly size="sm" />
                  <span className="text-sm text-gray-600">{selectedTech.rating} 分</span>
                  <span className="text-sm text-gray-400">·</span>
                  <span className="text-sm text-gray-600">{selectedTech.reviewCount} 单历史记录</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">📍 服务范围</p>
              <p className="text-sm text-gray-600">
                以当前位置为中心，服务半径 <span className="font-medium text-primary-600">{selectedTech.serviceRadius} 公里</span>
              </p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">🏷️ 专业技能标签</p>
              <div className="flex flex-wrap gap-2">
                {mockSkillTags.filter(s => selectedTech.skillTags.includes(s.id)).length > 0 ? (
                  mockSkillTags.filter(s => selectedTech.skillTags.includes(s.id)).map(s => (
                    <span key={s.id} className="badge-info">
                      {s.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">暂无技能标签</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">📜 资质证书（OCR识别记录）</p>
              {selectedTech.certificates.length === 0 ? (
                <p className="text-sm text-gray-400">该师傅暂未上传资质证书</p>
              ) : (
                <div className="space-y-2">
                  {selectedTech.certificates.map(cert => (
                    <div key={cert.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{cert.name}</span>
                        {cert.verified ? (
                          <span className="badge-success flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" /> 人工复核通过
                          </span>
                        ) : (
                          <span className="badge-warning">待人工复核</span>
                        )}
                      </div>
                      {cert.ocrData && (
                        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-1">
                          📷 OCR识别：{cert.ocrData}
                        </p>
                      )}
                      {cert.verifiedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          复核时间：{formatDateTime(cert.verifiedAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-2">⭐ 历史评价记录</p>
              {reviews.filter(r => r.toUserId === selectedTech.id).length === 0 ? (
                <p className="text-sm text-gray-400">暂无历史评价</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {reviews.filter(r => r.toUserId === selectedTech.id).map(r => (
                    <div key={r.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <StarRating value={r.rating} readonly size="sm" />
                        <span className="text-xs text-gray-400">{formatDateTime(r.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{r.content || '未填写评价内容'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {r.fromRole === 'user' ? '来自客户评价' : '来自师傅互评'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedTech.frozen && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-danger-800">该师傅账号已被冻结</p>
                    <p className="text-xs text-danger-700 mt-0.5">
                      冻结原因：{selectedTech.frozenReason || '收到差评自动冻结'}
                    </p>
                    <button
                      onClick={() => unfreezeTechnician(selectedTech.id)}
                      className="btn-danger text-xs mt-2"
                    >
                      <Unlock className="w-3 h-3 inline mr-1" /> 人工复核并解禁
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
