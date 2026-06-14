import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  Clock, Calendar, DollarSign, Upload, FileText, MessageSquare,
  CheckCircle, XCircle, AlertTriangle, Send, Shield, AlertCircle, 
  FileCheck, Target, CheckSquare, Square, Download, FileWarning,
  History, ThumbsUp, ThumbsDown, Zap
} from 'lucide-react'
import api from '../api'
import { Task, Bid, Milestone, FileVersion, Collaboration, RiskReport } from '../types'
import { useAuthStore } from '../store/authStore'

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('bids')
  const [showBidModal, setShowBidModal] = useState(false)
  const [bidForm, setBidForm] = useState({ price: '', deliveryDays: '', proposal: '', portfolioUrls: '' })
  const [newComment, setNewComment] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [fileDesc, setFileDesc] = useState('')
  const [annotationMode, setAnnotationMode] = useState(false)
  const [annotationPos, setAnnotationPos] = useState({ x: 0, y: 0 })
  const [showComplaintModal, setShowComplaintModal] = useState(false)
  const [complaintForm, setComplaintForm] = useState({ reason: '', description: '' })
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [riskReports, setRiskReports] = useState<RiskReport[]>([])
  const [checkingOriginality, setCheckingOriginality] = useState(false)

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const { data } = await api.get(`/tasks/${id}`)
        setTask(data)
      } catch (error) {
        console.error('获取任务详情失败', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [id])

  useEffect(() => {
    if (!task?.timeLeft) return

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const deadline = new Date(task.deadline).getTime()
      const diff = Math.max(0, deadline - now)

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setCountdown({ days, hours, minutes, seconds })
    }, 1000)

    return () => clearInterval(timer)
  }, [task?.deadline, task?.timeLeft])

  const milestones = task?.milestones || []
  const fileVersions = task?.fileVersions || []
  const bids = task?.bids || []
  const collaborations = task?.collaborations || []

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: '高风险', color: 'text-red-600', bgColor: 'bg-red-50', barColor: 'bg-red-500' }
    if (score >= 40) return { label: '中风险', color: 'text-yellow-600', bgColor: 'bg-yellow-50', barColor: 'bg-yellow-500' }
    return { label: '低风险', color: 'text-green-600', bgColor: 'bg-green-50', barColor: 'bg-green-500' }
  }

  const myBid = useMemo(() => {
    if (!user || !bids.length) return null
    return bids.find(b => b.providerId === user.id)
  }, [bids, user])

  const escrowStats = useMemo(() => {
    if (!task) return { total: 0, released: 0, frozen: 0 }
    const released = milestones
      .filter(m => m.status === 'APPROVED' || m.status === 'PAID')
      .reduce((sum, m) => sum + m.amount, 0)
    const frozen = task.escrowAmount - released
    return {
      total: task.escrowAmount,
      released: Math.max(0, released),
      frozen: Math.max(0, frozen),
    }
  }, [task, milestones])

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      DESIGN: '设计服务',
      DEVELOPMENT: '开发服务',
      COPYWRITING: '文案撰写',
      MARKETING: '营销推广',
      DECORATION: '装修设计',
      VIDEO: '视频制作',
      CONSULTING: '咨询服务',
      OTHER: '其他',
    }
    return map[cat] || cat
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      BIDDING: { label: '招标中', color: 'bg-blue-50 text-blue-700' },
      SELECTED: { label: '已选标', color: 'bg-yellow-50 text-yellow-700' },
      IN_PROGRESS: { label: '进行中', color: 'bg-green-50 text-green-700' },
      DELIVERED: { label: '已交付', color: 'bg-purple-50 text-purple-700' },
      COMPLETED: { label: '已完成', color: 'bg-gray-100 text-gray-600' },
      DISPUTED: { label: '争议中', color: 'bg-red-50 text-red-700' },
      CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-500' },
    }
    return map[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
  }

  const refreshTask = async () => {
    const { data } = await api.get(`/tasks/${id}`)
    setTask(data)
  }

  const fetchRiskReports = async () => {
    if (!isAuthenticated) return
    try {
      const { data } = await api.get('/risk/reports')
      setRiskReports(Array.isArray(data) ? data : data.data || [])
    } catch (error) {
      console.error('获取风控报告失败', error)
    }
  }

  useEffect(() => {
    if (isAuthenticated && activeTab === 'risk') {
      fetchRiskReports()
    }
  }, [isAuthenticated, activeTab, id])

  const handleBid = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (user?.role !== 'PROVIDER' && user?.role !== 'BOTH') {
      alert('只有服务商可以投标')
      return
    }
    try {
      await api.post('/bids', {
        taskId: parseInt(id!),
        price: parseFloat(bidForm.price),
        deliveryDays: parseInt(bidForm.deliveryDays),
        proposal: bidForm.proposal,
        portfolioUrls: bidForm.portfolioUrls || undefined,
      })
      setShowBidModal(false)
      setBidForm({ price: '', deliveryDays: '', proposal: '', portfolioUrls: '' })
      alert('投标成功！')
      refreshTask()
    } catch (err: any) {
      alert(err.response?.data?.error || '投标失败')
    }
  }

  const handleSelectBid = async (bidId: number) => {
    if (!confirm('确认选择此服务商中标？选择后将开始任务执行。')) return
    try {
      await api.post(`/tasks/${id}/select-bid/${bidId}`)
      alert('已选择中标服务商')
      refreshTask()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleApproveMilestone = async (milestoneId: number) => {
    if (!confirm('确认验收通过？验收后将释放该里程碑款项。')) return
    try {
      await api.post(`/milestones/${milestoneId}/approve`, { feedback: '满意', rating: 5 })
      alert('里程碑验收通过')
      refreshTask()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleRejectMilestone = async (milestoneId: number) => {
    const feedback = prompt('请输入修改意见：')
    if (!feedback) return
    try {
      await api.post(`/milestones/${milestoneId}/reject`, { feedback })
      alert('已申请修改')
      refreshTask()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleSubmitMilestone = async (milestoneId: number) => {
    if (!confirm('确认提交该里程碑进行验收？')) return
    try {
      await api.post(`/milestones/${milestoneId}/submit`)
      alert('已提交里程碑')
      refreshTask()
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleUploadFile = async () => {
    if (!newFile) return
    const formData = new FormData()
    formData.append('file', newFile)
    formData.append('description', fileDesc)
    try {
      await api.post(`/milestones/task/${id}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setNewFile(null)
      setFileDesc('')
      alert('文件上传成功')
      refreshTask()
    } catch (err: any) {
      alert(err.response?.data?.error || '上传失败')
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    try {
      const payload: any = {
        type: annotationMode ? 'annotation' : 'comment',
        content: newComment,
      }
      if (annotationMode) {
        payload.positionX = annotationPos.x
        payload.positionY = annotationPos.y
        payload.pageNumber = 1
      }
      await api.post(`/milestones/task/${id}/collaborations`, payload)
      setNewComment('')
      setAnnotationMode(false)
      refreshTask()
    } catch (err: any) {
      alert(err.response?.data?.error || '发送失败')
    }
  }

  const handleResolveComment = async (commentId: number, resolved: boolean) => {
    try {
      await api.patch(`/milestones/task/${id}/collaborations/${commentId}`, { resolved })
      refreshTask()
    } catch (err: any) {
      console.error('更新状态失败', err)
    }
  }

  const handleCheckOriginality = async () => {
    if (fileVersions.length === 0) {
      alert('请先上传文件后再进行原创性检测')
      return
    }
    setCheckingOriginality(true)
    try {
      const latestFile = fileVersions[0]
      const { data } = await api.post('/risk/originality', {
        taskId: parseInt(id!),
        fileVersionId: latestFile.id,
        contentType: 'IMAGE',
      })
      alert(`原创性检测完成！相似度：${data.similarityRate.toFixed(2)}%`)
      refreshTask()
      fetchRiskReports()
    } catch (err: any) {
      alert(err.response?.data?.error || '检测失败')
    } finally {
      setCheckingOriginality(false)
    }
  }

  const handleSubmitComplaint = async () => {
    if (!complaintForm.reason || !complaintForm.description) {
      alert('请填写投诉原因和描述')
      return
    }
    try {
      const targetUserId = isEmployer ? task?.selectedBid?.providerId : task?.employerId
      await api.post('/risk/complaints', {
        toUserId: targetUserId,
        taskId: parseInt(id!),
        reason: complaintForm.reason,
        description: complaintForm.description,
      })
      alert('投诉已提交，平台将尽快处理')
      setShowComplaintModal(false)
      setComplaintForm({ reason: '', description: '' })
      fetchRiskReports()
    } catch (err: any) {
      alert(err.response?.data?.error || '提交失败')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="h-40 bg-gray-200 rounded-xl"></div>
              <div className="h-60 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-80 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-xl font-semibold text-gray-900">任务不存在</h2>
        <Link to="/tasks" className="text-primary-600 mt-4 inline-block">返回任务列表</Link>
      </div>
    )
  }

  const status = getStatusBadge(task.status)
  const isEmployer = user?.id === task.employerId
  const isProvider = user?.role === 'PROVIDER' || user?.role === 'BOTH'
  const isSelectedProvider = task.selectedBidId && task.bids?.some(
    (bid) => bid.id === task.selectedBidId && bid.providerId === user?.id
  )
  const hasBid = task.bids?.some((b) => b.providerId === user?.id)
  const showProgressTabs = task.status === 'IN_PROGRESS' || task.status === 'SELECTED'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5" />
              <span className="font-medium">任务倒计时</span>
            </div>
            <div className="flex items-center space-x-6 font-mono text-lg">
              <div className="text-center">
                <span className="text-2xl font-bold">{countdown.days}</span>
                <span className="text-xs ml-1 opacity-80">天</span>
              </div>
              <span className="text-2xl font-bold">:</span>
              <div className="text-center">
                <span className="text-2xl font-bold">{String(countdown.hours).padStart(2, '0')}</span>
                <span className="text-xs ml-1 opacity-80">时</span>
              </div>
              <span className="text-2xl font-bold">:</span>
              <div className="text-center">
                <span className="text-2xl font-bold">{String(countdown.minutes).padStart(2, '0')}</span>
                <span className="text-xs ml-1 opacity-80">分</span>
              </div>
              <span className="text-2xl font-bold">:</span>
              <div className="text-center">
                <span className="text-2xl font-bold">{String(countdown.seconds).padStart(2, '0')}</span>
                <span className="text-xs ml-1 opacity-80">秒</span>
              </div>
            </div>
            <div className="text-sm opacity-90">
              {task.daysLeft && task.daysLeft > 0 
                ? `剩余 ${task.daysLeft} 天截止` 
                : '已截止'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-primary-600">首页</Link>
          <span>/</span>
          <Link to="/tasks" className="hover:text-primary-600">任务大厅</Link>
          <span>/</span>
          <span className="text-gray-900">{task.title}</span>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className={`badge ${status.color} text-sm`}>{status.label}</span>
                <span className="badge bg-gray-100 text-gray-600">{getCategoryLabel(task.category)}</span>
                {task.fraudWarning && (
                  <span className="badge bg-red-50 text-red-600 flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    风控预警
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{task.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <img
                    src={task.employer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.employerId}`}
                    alt=""
                    className="w-5 h-5 rounded-full mr-1.5"
                  />
                  <span>{task.employer?.username}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  <span>发布于 {new Date(task.publishedAt || task.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-3xl font-bold text-amber-600">
                ¥{task.budgetMin.toLocaleString()} ~ {task.budgetMax.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {task.totalAmount ? `已确定 ¥${task.totalAmount.toLocaleString()}` : '预算范围'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100">
            <span className="text-sm text-gray-500 mr-2">技能标签：</span>
            {task.skills?.map((skill) => (
              <Link
                key={skill.id}
                to={`/tasks?skillId=${skill.id}`}
                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm hover:bg-primary-100 transition-colors"
              >
                {skill.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">任务描述</h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {task.description}
              </div>

              {task.attachments?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">任务附件</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {task.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{att.fileName}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <div className="flex border-b border-gray-100 overflow-x-auto">
                {[
                  { key: 'bids', label: `投标 (${bids.length || 0})', always: true },
                  { key: 'milestones', label: '里程碑', show: showProgressTabs },
                  { key: 'files', label: `文件版本 (${fileVersions.length})`, show: showProgressTabs },
                  { key: 'comments', label: `协同讨论 (${collaborations.length})`, show: showProgressTabs },
                  { key: 'risk', label: '风控信息', always: true },
                ].filter(t => t.always || t.show).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'bids' && (
                <div className="p-6">
                  {task.status === 'BIDDING' && isEmployer && (
                    <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                      请在下方投标中选择合适的服务商中标
                    </div>
                  )}

                  {task.status === 'BIDDING' && isProvider && !isEmployer && !hasBid && (
                    <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm">
                      点击右侧「立即投标」按钮提交您的方案
                    </div>
                  )}

                  {bids.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">暂无服务商投标</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bids.map((bid: Bid) => (
                        <div
                          key={bid.id}
                          className={`p-5 border-2 rounded-xl transition-all ${
                            task.selectedBidId === bid.id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                              <img
                                src={bid.provider?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${bid.providerId}`}
                                alt=""
                                className="w-12 h-12 rounded-full"
                              />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-gray-900">{bid.provider?.username}</span>
                                  {task.selectedBidId === bid.id && (
                                    <span className="badge bg-green-100 text-green-700">已中标</span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                                  <span>⭐ {bid.provider?.rating?.toFixed(1)}</span>
                                  <span>Lv.{bid.provider?.level}</span>
                                  <span>{bid.provider?.completedOrders || 0}单</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-amber-600">¥{bid.price.toLocaleString()}</div>
                              <div className="text-sm text-gray-500 mt-1">{bid.deliveryDays}天交付</div>
                            </div>
                          </div>

                          <p className="mt-4 text-gray-600 text-sm leading-relaxed">{bid.proposal}</p>

                          {bid.portfolioUrls && (
                            <div className="mt-3">
                              <a 
                                href={bid.portfolioUrls} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                              >
                                <FileCheck className="w-4 h-4 mr-1" />
                                查看作品集
                              </a>
                            </div>
                          )}

                          {bid.provider?.skills && (
                            <div className="flex flex-wrap gap-1.5 mt-4">
                              {bid.provider.skills.slice(0, 5).map((skill) => (
                                <span key={skill.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                  {skill.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {task.status === 'BIDDING' && isEmployer && task.selectedBidId !== bid.id && (
                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => handleSelectBid(bid.id)}
                                className="btn-success text-sm"
                              >
                                选择中标
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'milestones' && (
                <div className="p-6">
                  {milestones.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">暂无里程碑</p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      <div className="space-y-4">
                        {milestones.map((ms, index) => {
                          const colors: Record<string, string> = {
                            PENDING: 'bg-gray-400',
                            IN_PROGRESS: 'bg-blue-500',
                            SUBMITTED: 'bg-yellow-500',
                            APPROVED: 'bg-green-500',
                            PAID: 'bg-green-600',
                            REJECTED: 'bg-red-500',
                          }
                          const labels: Record<string, string> = {
                            PENDING: '待开始',
                            IN_PROGRESS: '进行中',
                            SUBMITTED: '待验收',
                            APPROVED: '已验收',
                            PAID: '已付款',
                            REJECTED: '已驳回',
                          }
                          return (
                            <div key={ms.id} className="relative pl-14">
                              <div className={`absolute left-3.5 w-3.5 h-3.5 rounded-full ${colors[ms.status]} border-4 border-white ring-2 ring-gray-200`}></div>
                              <div className="card p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <span className="text-xs text-gray-400">里程碑 {index + 1}</span>
                                    <h4 className="font-semibold text-gray-900 mt-0.5">{ms.title}</h4>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-amber-600">¥{ms.amount.toLocaleString()}</div>
                                    <span className="text-xs text-gray-500">{ms.percentage}%</span>
                                  </div>
                                </div>
                                {ms.description && (
                                  <p className="text-sm text-gray-500 mb-3">{ms.description}</p>
                                )}
                                {ms.feedback && (
                                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">反馈：{ms.feedback}</p>
                                  </div>
                                )}
                                <div className="flex items-center justify-between">
                                  <span className={`badge ${
                                    ms.status === 'APPROVED' || ms.status === 'PAID' ? 'bg-green-50 text-green-700' :
                                    ms.status === 'SUBMITTED' ? 'bg-yellow-50 text-yellow-700' :
                                    ms.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {labels[ms.status]}
                                  </span>
                                  <div className="flex gap-2">
                                    {ms.status === 'SUBMITTED' && isEmployer && (
                                      <>
                                        <button onClick={() => handleApproveMilestone(ms.id)} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700">
                                          验收通过
                                        </button>
                                        <button onClick={() => handleRejectMilestone(ms.id)} className="text-xs px-3 py-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200">
                                          申请修改
                                        </button>
                                      </>
                                    )}
                                    {(ms.status === 'PENDING' || ms.status === 'REJECTED') && isSelectedProvider && (
                                      <button onClick={() => handleSubmitMilestone(ms.id)} className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700">
                                        提交验收
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'files' && (
                <div className="p-6">
                  {(isEmployer || isSelectedProvider) && (
                    <div className="mb-6 p-4 border-2 border-dashed border-gray-200 rounded-xl">
                      <div className="flex flex-col md:flex-row gap-3">
                        <input
                          type="file"
                          onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                          className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                        />
                        <input
                          type="text"
                          value={fileDesc}
                          onChange={(e) => setFileDesc(e.target.value)}
                          placeholder="文件说明（可选）"
                          className="flex-1 input-field"
                        />
                        <button
                          onClick={handleUploadFile}
                          disabled={!newFile}
                          className="btn-primary disabled:opacity-50 whitespace-nowrap"
                        >
                          <Upload className="w-4 h-4 inline mr-1" /> 上传
                        </button>
                      </div>
                    </div>
                  )}

                  {fileVersions.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">暂无文件版本</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fileVersions.map((fv) => (
                        <div key={fv.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <FileText className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 flex items-center space-x-2">
                                <span>{fv.fileName}</span>
                                <span className="badge bg-primary-50 text-primary-700">{fv.version}</span>
                                {fv.isFinal && <span className="badge bg-green-50 text-green-700">最终版</span>}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {fv.uploader?.username} 上传于 {new Date(fv.createdAt).toLocaleString()}
                                {fv.description && ` · ${fv.description}`}
                              </div>
                            </div>
                          </div>
                          <a href={fv.fileUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                            查看
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="p-6">
                  {isAuthenticated && (
                    <div className="mb-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAnnotationMode(!annotationMode)}
                            className={`text-xs px-3 py-1.5 rounded flex items-center ${
                              annotationMode 
                                ? 'bg-primary-600 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Target className="w-3.5 h-3.5 mr-1" />
                            {annotationMode ? '取消标注' : '添加标注'}
                          </button>
                          {annotationMode && (
                            <span className="text-xs text-gray-500 flex items-center">
                              点击图片选择标注位置
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                          placeholder={annotationMode ? "输入标注内容..." : "发表评论或标注..."}
                          className="flex-1 input-field"
                          onClick={(e) => {
                            if (annotationMode) {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setAnnotationPos({
                                x: Math.round((e.clientX - rect.left) / rect.width * 100),
                                y: Math.round((e.clientY - rect.top) / rect.height * 100),
                              })
                            }
                          }}
                        />
                        <button onClick={handleAddComment} className="btn-primary">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {!task.collaborations || task.collaborations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">暂无讨论，来发表第一条评论吧</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {task.collaborations.map((c) => (
                        <div key={c.id} className={`flex gap-3 ${c.resolved ? 'opacity-60' : ''}`}>
                          <img
                            src={c.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userId}`}
                            alt=""
                            className="w-9 h-9 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900 text-sm">{c.user?.username}</span>
                                  {c.type === 'annotation' && (
                                    <span className="badge bg-amber-50 text-amber-700 text-xs">
                                      <Target className="w-3 h-3 inline mr-1" />
                                      标注
                                    </span>
                                  )}
                                  {c.positionX !== null && c.positionY !== null && (
                                    <span className="text-xs text-gray-400">
                                      位置: ({c.positionX}%, {c.positionY}%)
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                                  {(isEmployer || isSelectedProvider) && (
                                    <button
                                      onClick={() => handleResolveComment(c.id, !c.resolved)}
                                      className="text-gray-400 hover:text-green-600"
                                      title={c.resolved ? '标记未解决' : '标记已解决'}
                                    >
                                      {c.resolved ? (
                                        <CheckSquare className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Square className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className={`text-gray-700 text-sm ${c.resolved ? 'line-through' : ''}`}>{c.content}</p>
                              {c.resolved && (
                                <div className="mt-2 text-xs text-green-600 flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  已解决
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'risk' && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-5 rounded-xl ${getRiskLevel(task.riskScore).bgColor}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          <Shield className="w-5 h-5 mr-2 text-primary-600" />
                          欺诈风险评分
                        </h3>
                        <span className={`text-lg font-bold ${getRiskLevel(task.riskScore).color}`}>
                          {task.riskScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-white/50 rounded-full h-3 mb-2">
                        <div 
                          className={`h-3 rounded-full transition-all ${getRiskLevel(task.riskScore).barColor}`}
                          style={{ width: `${task.riskScore}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">风险等级</span>
                        <span className={`font-medium ${getRiskLevel(task.riskScore).color}`}>
                          {getRiskLevel(task.riskScore).label}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-amber-500" />
                        快速操作
                      </h3>
                      <div className="space-y-3">
                        <button 
                          onClick={handleCheckOriginality}
                          disabled={checkingOriginality}
                          className="w-full btn-primary flex items-center justify-center disabled:opacity-50"
                        >
                          <FileCheck className="w-4 h-4 mr-2" />
                          {checkingOriginality ? '检测中...' : '原创性检测'}
                        </button>
                        <button 
                          onClick={() => setShowComplaintModal(true)}
                          className="w-full btn-secondary flex items-center justify-center text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          投诉举报
                        </button>
                      </div>
                    </div>
                  </div>

                  {task.fraudWarning && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-red-800">风控预警</h4>
                          <p className="text-sm text-red-700 mt-1">该任务存在较高风险，请谨慎交易。建议保留沟通记录和交付凭证。</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <History className="w-5 h-5 mr-2 text-gray-600" />
                      历史风控报告
                    </h3>
                    {riskReports.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <FileWarning className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">暂无风控报告</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {riskReports.map((report) => {
                          const levelColors: Record<string, string> = {
                            LOW: 'bg-green-50 text-green-700 border-green-200',
                            MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                            HIGH: 'bg-red-50 text-red-700 border-red-200',
                          }
                          const levelLabels: Record<string, string> = {
                            LOW: '低风险',
                            MEDIUM: '中风险',
                            HIGH: '高风险',
                          }
                          return (
                            <div key={report.id} className={`p-4 rounded-xl border ${levelColors[report.level] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{report.title}</span>
                                    <span className="badge bg-white/80 text-xs">
                                      {levelLabels[report.level] || report.level}
                                    </span>
                                  </div>
                                  {report.description && (
                                    <p className="text-sm mt-1 opacity-80">{report.description}</p>
                                  )}
                                  <div className="text-xs mt-2 opacity-70">
                                    {new Date(report.createdAt).toLocaleString()}
                                  </div>
                                </div>
                                {report.handled ? (
                                  <span className="badge bg-white/80 flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    已处理
                                  </span>
                                ) : (
                                  <span className="badge bg-white/80 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    处理中
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      安全交易提示
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• 所有交易请通过平台资金托管进行，保障双方权益</li>
                      <li>• 重要沟通请在平台内进行，便于纠纷时取证</li>
                      <li>• 交付物请通过文件版本功能上传，留存历史记录</li>
                      <li>• 遇到问题及时发起投诉或争议仲裁</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 sticky top-24">
              {task.status === 'BIDDING' && !isEmployer && !hasBid && (
                <button
                  onClick={() => isAuthenticated ? (isProvider ? setShowBidModal(true) : alert('请切换到服务商身份投标')) : navigate('/login')}
                  className="w-full btn-primary !py-3"
                >
                  立即投标
                </button>
              )}

              {task.status === 'BIDDING' && !isEmployer && hasBid && (
                <div className="text-center p-4 bg-green-50 text-green-700 rounded-xl">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-medium">您已投标</p>
                  <p className="text-sm text-green-600 mt-1">等待雇主选择</p>
                </div>
              )}

              {isEmployer && task.status === 'BIDDING' && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">{bids.length || 0}</div>
                  <div className="text-sm text-gray-500 mb-4">位服务商已投标</div>
                  <Link to="/tasks/create" className="w-full btn-secondary block">
                    发布新任务
                  </Link>
                </div>
              )}

              {(isEmployer || isSelectedProvider) && showProgressTabs && (
                <div className="space-y-3">
                  <button 
                    onClick={handleCheckOriginality}
                    className="w-full btn-secondary flex items-center justify-center"
                  >
                    <FileCheck className="w-4 h-4 mr-2" />
                    原创性检测
                  </button>
                  <button 
                    onClick={() => setShowComplaintModal(true)}
                    className="w-full btn-secondary flex items-center justify-center text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    投诉举报
                  </button>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-primary-600" />
                  资金托管
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">托管金额</span>
                    <span className="font-semibold text-gray-900">¥{escrowStats.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">已释放</span>
                    <span className="font-semibold text-green-600">¥{escrowStats.released.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">冻结中</span>
                    <span className="font-semibold text-amber-600">¥{escrowStats.frozen.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${escrowStats.total > 0 ? (escrowStats.released / escrowStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" />
                  风控信息
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">欺诈风险评分</span>
                    <span className={`font-medium ${
                      task.riskScore >= 70 ? 'text-red-600' :
                      task.riskScore >= 40 ? 'text-yellow-600' : 'text-green-600'
                    }`}>{task.riskScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        task.riskScore >= 70 ? 'bg-red-500' :
                        task.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${task.riskScore}%` }}
                    ></div>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <button 
                    onClick={handleCheckOriginality}
                    className="w-full text-xs py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center justify-center"
                  >
                    <FileCheck className="w-3.5 h-3.5 mr-1" />
                    原创性检测
                  </button>
                  <button 
                    onClick={() => setShowComplaintModal(true)}
                    className="w-full text-xs py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center justify-center"
                  >
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    投诉举报
                  </button>
                </div>
                {task.riskScore >= 40 && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-yellow-700 flex items-start">
                      <AlertTriangle className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
                      该任务存在一定风险，请谨慎交易
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showBidModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">提交投标方案</h3>
              <p className="text-sm text-gray-500 mt-1">{task.title}</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">报价 (元)</label>
                  <input
                    type="number"
                    value={bidForm.price}
                    onChange={(e) => setBidForm({ ...bidForm, price: e.target.value })}
                    placeholder="请输入报价"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">交付天数</label>
                  <input
                    type="number"
                    value={bidForm.deliveryDays}
                    onChange={(e) => setBidForm({ ...bidForm, deliveryDays: e.target.value })}
                    placeholder="请输入天数"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">作品链接 (可选)</label>
                <input
                  type="url"
                  value={bidForm.portfolioUrls}
                  onChange={(e) => setBidForm({ ...bidForm, portfolioUrls: e.target.value })}
                  placeholder="请输入作品集或案例链接"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">投标方案</label>
                <textarea
                  value={bidForm.proposal}
                  onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })}
                  placeholder="请详细描述您的服务方案、经验和优势..."
                  rows={6}
                  className="input-field resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowBidModal(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleBid} className="btn-primary">
                确认投标
              </button>
            </div>
          </div>
        </div>
      )}

      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">提交投诉</h3>
              <p className="text-sm text-gray-500 mt-1">平台将在24小时内处理</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">投诉原因</label>
                <select
                  value={complaintForm.reason}
                  onChange={(e) => setComplaintForm({ ...complaintForm, reason: e.target.value })}
                  className="input-field"
                >
                  <option value="">请选择原因</option>
                  <option value="质量问题">质量问题</option>
                  <option value="交付延迟">交付延迟</option>
                  <option value="沟通不畅">沟通不畅</option>
                  <option value="涉嫌抄袭">涉嫌抄袭</option>
                  <option value="欺诈行为">欺诈行为</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">详细描述</label>
                <textarea
                  value={complaintForm.description}
                  onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                  placeholder="请详细描述问题情况..."
                  rows={4}
                  className="input-field resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowComplaintModal(false)
                  setComplaintForm({ reason: '', description: '' })
                }}
                className="btn-secondary"
              >
                取消
              </button>
              <button onClick={handleSubmitComplaint} className="btn-primary bg-red-600 hover:bg-red-700">
                提交投诉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
