import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  Clock, MapPin, Calendar, DollarSign, Upload, FileText, MessageSquare,
  CheckCircle, XCircle, AlertTriangle, Send, Plus, ChevronDown
} from 'lucide-react'
import api from '../api'
import { Task, Bid, Milestone, FileVersion, Collaboration } from '../types'
import { useAuthStore } from '../store/authStore'

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('bids')
  const [showBidModal, setShowBidModal] = useState(false)
  const [bidForm, setBidForm] = useState({ price: '', deliveryDays: '', proposal: '' })
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [fileVersions, setFileVersions] = useState<FileVersion[]>([])
  const [collaborations, setCollaborations] = useState<Collaboration[]>([])
  const [newComment, setNewComment] = useState('')
  const [newFile, setNewFile] = useState<File | null>(null)
  const [fileDesc, setFileDesc] = useState('')

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

    const fetchRelated = async () => {
      try {
        const [mRes, fRes, cRes] = await Promise.all([
          api.get(`/milestones/task/${id}`),
          api.get(`/milestones/task/${id}/files`),
          api.get(`/milestones/task/${id}/collaborations`),
        ])
        setMilestones(mRes.data)
        setFileVersions(fRes.data)
        setCollaborations(cRes.data)
      } catch (e) {
        console.log('部分数据加载失败')
      }
    }

    fetchTask()
    fetchRelated()
  }, [id])

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

  const handleBid = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    try {
      await api.post('/bids', {
        taskId: parseInt(id!),
        price: parseFloat(bidForm.price),
        deliveryDays: parseInt(bidForm.deliveryDays),
        proposal: bidForm.proposal,
      })
      setShowBidModal(false)
      alert('投标成功！')
      const { data } = await api.get(`/tasks/${id}`)
      setTask(data)
    } catch (err: any) {
      alert(err.response?.data?.error || '投标失败')
    }
  }

  const handleSelectBid = async (bidId: number) => {
    if (!confirm('确认选择此服务商中标？')) return
    try {
      await api.post(`/tasks/${id}/select-bid/${bidId}`)
      const { data } = await api.get(`/tasks/${id}`)
      setTask(data)
      alert('已选择中标服务商')
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleApproveMilestone = async (milestoneId: number) => {
    try {
      await api.post(`/milestones/${milestoneId}/approve`, { feedback: '满意', rating: 5 })
      const [tRes, mRes] = await Promise.all([
        api.get(`/tasks/${id}`),
        api.get(`/milestones/task/${id}`),
      ])
      setTask(tRes.data)
      setMilestones(mRes.data)
      alert('里程碑验收通过')
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败')
    }
  }

  const handleSubmitMilestone = async (milestoneId: number) => {
    try {
      await api.post(`/milestones/${milestoneId}/submit`)
      const mRes = await api.get(`/milestones/task/${id}`)
      setMilestones(mRes.data)
      alert('已提交里程碑')
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
      const fRes = await api.get(`/milestones/task/${id}/files`)
      setFileVersions(fRes.data)
      setNewFile(null)
      setFileDesc('')
      alert('文件上传成功')
    } catch (err: any) {
      alert(err.response?.data?.error || '上传失败')
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    try {
      await api.post(`/milestones/task/${id}/collaborations`, {
        type: 'comment',
        content: newComment,
      })
      const cRes = await api.get(`/milestones/task/${id}/collaborations`)
      setCollaborations(cRes.data)
      setNewComment('')
    } catch (err: any) {
      alert(err.response?.data?.error || '发送失败')
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
  const isSelectedProvider = task.bids?.some(
    (bid) => bid.id === task.selectedBidId && bid.providerId === user?.id
  )
  const hasBid = task.bids?.some((b) => b.providerId === user?.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600">首页</Link>
        <span>/</span>
        <Link to="/tasks" className="hover:text-primary-600">任务大厅</Link>
        <span>/</span>
        <span className="text-gray-900">{task.title}</span>
      </div>

      {/* Task Header */}
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
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1.5" />
                <span className={task.daysLeft && task.daysLeft < 3 ? 'text-red-600 font-medium' : ''}>
                  {task.daysLeft && task.daysLeft > 0 ? `剩余 ${task.daysLeft} 天截止` : '已截止'}
                </span>
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
            <div className="text-sm text-gray-500 mt-1">
              托管金额: ¥{task.escrowAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Skills */}
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
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
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

          {/* Tabs */}
          <div className="card">
            <div className="flex border-b border-gray-100">
              {[
                { key: 'bids', label: `投标 (${task.bids?.length || 0})` },
                { key: 'milestones', label: '里程碑' },
                { key: 'files', label: `文件版本 (${fileVersions.length})` },
                { key: 'comments', label: `协同讨论 (${collaborations.length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Bids Tab */}
            {activeTab === 'bids' && (
              <div className="p-6">
                {task.status === 'BIDDING' && isEmployer && (
                  <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    请在下方投标中选择合适的服务商中标
                  </div>
                )}

                {task.bids?.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无服务商投标</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {task.bids?.map((bid: Bid) => (
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

            {/* Milestones Tab */}
            {activeTab === 'milestones' && (
              <div className="p-6">
                {isEmployer && milestones.length === 0 && task.status === 'SELECTED' && (
                  <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm">
                    请设置里程碑付款计划
                  </div>
                )}

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
                                      <button className="text-xs px-3 py-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200">
                                        驳回
                                      </button>
                                    </>
                                  )}
                                  {(ms.status === 'PENDING' || ms.status === 'REJECTED') && isSelectedProvider && (
                                    <button onClick={() => handleSubmitMilestone(ms.id)} className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded hover:bg-primary-700">
                                      提交
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

            {/* Files Tab */}
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
                          下载
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="p-6">
                {isAuthenticated && (
                  <div className="mb-6 flex gap-3">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                      placeholder="发表评论或标注..."
                      className="flex-1 input-field"
                    />
                    <button onClick={handleAddComment} className="btn-primary">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {collaborations.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无讨论，来发表第一条评论吧</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {collaborations.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <img
                          src={c.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userId}`}
                          alt=""
                          className="w-9 h-9 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900 text-sm">{c.user?.username}</span>
                              <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-700 text-sm">{c.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Action Card */}
          <div className="card p-6 sticky top-24">
            {task.status === 'BIDDING' && !isEmployer && !hasBid && (
              <button
                onClick={() => isAuthenticated ? setShowBidModal(true) : navigate('/login')}
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
                <div className="text-3xl font-bold text-gray-900 mb-1">{task.bids?.length || 0}</div>
                <div className="text-sm text-gray-500 mb-4">位服务商已投标</div>
                <Link to="/tasks/create" className="w-full btn-secondary block">
                  发布新任务
                </Link>
              </div>
            )}

            {(isEmployer || isSelectedProvider) && task.status === 'IN_PROGRESS' && (
              <div className="space-y-3">
                <Link to="#" className="w-full btn-primary block text-center">
                  托管资金
                </Link>
                <button className="w-full btn-secondary">
                  申请争议仲裁
                </button>
              </div>
            )}

            {/* Risk Info */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">风控信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">风险评分</span>
                  <span className={`font-medium ${
                    task.riskScore >= 70 ? 'text-red-600' :
                    task.riskScore >= 40 ? 'text-yellow-600' : 'text-green-600'
                  }`}>{task.riskScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">雇主投诉率</span>
                  <span className="font-medium text-gray-700">{task.employer?.username}</span>
                </div>
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

      {/* Bid Modal */}
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
    </div>
  )
}
