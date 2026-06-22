import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import { StatusBadge } from '../components/StatusBadge'
import { Modal } from '../components/Modal'
import { StarRating } from '../components/StarRating'
import { getCategoryById, getCategoryPath } from '../data/mockData'
import { formatDateTime } from '../utils/geo'
import { ChevronRight, Camera, Star, FileText, Upload } from 'lucide-react'

export const UserTasks: React.FC = () => {
  const navigate = useNavigate()
  const { tasks, technicians, addReview, uploadPaymentProof, currentUser } = useAppStore()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">我的订单</h2>

      {myTasks.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">
          暂无订单，快去发布维修任务吧
        </div>
      ) : (
        myTasks.map(task => {
          const cat = getCategoryById(task.categoryId)
          const tech = task.technicianId ? technicians.find(t => t.id === task.technicianId) : null
          return (
            <div key={task.id} className="card space-y-3">
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

              {task.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
              )}

              {task.images.length > 0 && (
                <div className="flex gap-2">
                  {task.images.slice(0, 4).map((img, i) => (
                    <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  ))}
                </div>
              )}

              <div className="text-sm text-gray-500 space-y-1">
                <p>📍 {task.address}</p>
                <p>📅 {formatDateTime(task.createdAt)}</p>
                {tech && <p>🔧 {tech.name} · 评分{tech.rating}</p>}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {task.status === 'completed' && !task.paymentProofId && (
                  <button onClick={() => {
                    setSelectedTaskId(task.id)
                    setShowPaymentModal(true)
                  }} className="btn-success">
                    <Camera className="w-4 h-4 inline mr-1" />
                    上传支付凭证
                  </button>
                )}
                {task.status === 'paid' && !task.userReviewId && (
                  <button onClick={() => {
                    setSelectedTaskId(task.id)
                    setShowReviewModal(true)
                  }} className="btn-warning">
                    <Star className="w-4 h-4 inline mr-1" />
                    去评价
                  </button>
                )}
                {task.serviceReportId && (
                  <button className="btn-secondary" onClick={() => navigate(`/report/${task.serviceReportId}`)}>
                    <FileText className="w-4 h-4 inline mr-1" />
                    服务报告
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}

      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="评价服务">
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
            </div>
            <div>
              <label className="label">评价内容</label>
              <textarea
                className="input min-h-[100px]"
                value={reviewContent}
                onChange={e => setReviewContent(e.target.value)}
                placeholder="请分享您的服务体验..."
              />
              {reviewRating <= 2 && (
                <p className="text-xs text-danger-600 mt-2">
                  ⚠️ 差评将触发师傅账号自动冻结，需人工复核后解禁
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReviewModal(false)} className="btn-secondary flex-1">取消</button>
              <button onClick={handleSubmitReview} className="btn-primary flex-1">提交评价</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="上传支付凭证">
        <div className="space-y-4">
          <div>
            <label className="label">支付金额（元）</label>
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
                <span className="text-sm text-gray-500 mt-2">点击上传支付截图/照片</span>
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
              确认上传
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
