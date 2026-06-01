import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, UserPlus, Camera, CheckCircle, AlertCircle, ClipboardList, MapPin, Clock, User, FileText, MessageSquare, Star, ChevronRight, X, Zap, Wrench, CircleDot } from 'lucide-react'
import { useStore } from '@/store/useStore'
import StatusBadge from '@/components/StatusBadge'
import * as api from '@/api/client'
import type { WorkOrderPhoto, Order } from '@/api/client'
import { cn } from '@/lib/utils'

const woTypeLabels: Record<string, string> = {
  device_offline: '设备离线',
  port_damage: '端口损坏',
  charge_interrupt: '充电中断',
  complaint: '用户投诉',
}

const mockComplaintInfo = {
  user_name: '张先生',
  user_phone: '138****5678',
  complaint_time: '2024-01-15 14:30:00',
  complaint_content: '充电过程中突然中断，导致车辆未充满电，影响出行计划。希望尽快处理并给予合理补偿。',
  satisfaction: 4,
  processing_result: '已为用户全额退款并赠送50元充电优惠券，用户表示满意。',
  communications: [
    {
      id: 1,
      sender: '用户',
      time: '2024-01-15 14:30:00',
      content: '充电到一半突然断了，什么情况？',
      is_user: true,
    },
    {
      id: 2,
      sender: '客服小王',
      time: '2024-01-15 14:32:00',
      content: '非常抱歉给您带来不便！我们正在排查设备故障，请您提供一下订单号？',
      is_user: false,
    },
    {
      id: 3,
      sender: '用户',
      time: '2024-01-15 14:35:00',
      content: '订单号是 20240115140023，充了20分钟就停了。',
      is_user: true,
    },
    {
      id: 4,
      sender: '客服小王',
      time: '2024-01-15 14:40:00',
      content: '已查到您的订单，我们将为您全额退款，并赠送50元充电券作为补偿，预计24小时内到账。设备故障我们已派工程师处理。',
      is_user: false,
    },
  ],
}

interface TimelineNode {
  key: string
  label: string
  icon: any
  time: string | null
  actor: string
  description: string
  done: boolean
  isCurrent?: boolean
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

function calculateMinutes(start: string | null, end: string | null): number | null {
  if (!start || !end) return null
  const diffMs = new Date(end).getTime() - new Date(start).getTime()
  return Math.round(diffMs / (1000 * 60))
}

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentWorkOrder, fetchWorkOrder, resolveWorkOrder } = useStore()
  const [assignee, setAssignee] = useState('')
  const [showAssign, setShowAssign] = useState(false)
  const [resolution, setResolution] = useState('')
  const [showResolve, setShowResolve] = useState(false)
  const [photos, setPhotos] = useState<WorkOrderPhoto[]>([])
  const [photoDesc, setPhotoDesc] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<WorkOrderPhoto | null>(null)
  const [relatedOrders, setRelatedOrders] = useState<Order[]>([])

  const woId = Number(id)

  useEffect(() => {
    if (woId) {
      fetchWorkOrder(woId)
      fetch(`/api/work-orders/${woId}/photos`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setPhotos(data) })
        .catch(() => {})
    }
  }, [woId, fetchWorkOrder])

  useEffect(() => {
    if (currentWorkOrder?.device_id) {
      api.getOrders({ device_id: String(currentWorkOrder.device_id) })
        .then(setRelatedOrders)
        .catch(() => {})
    }
  }, [currentWorkOrder])

  if (!currentWorkOrder) {
    return <div className="text-center text-slate-400 py-12">加载中...</div>
  }

  const handleAssign = async () => {
    await api.assignWorkOrder(woId, assignee)
    fetchWorkOrder(woId)
    setShowAssign(false)
    setAssignee('')
  }

  const handleResolve = async () => {
    await resolveWorkOrder(woId, resolution)
    setShowResolve(false)
    setResolution('')
    fetchWorkOrder(woId)
  }

  const handleAddPhoto = async () => {
    await api.addWorkOrderPhoto(woId, {
      photo_url: `https://placehold.co/400x300?text=Photo+${photos.length + 1}`,
      description: photoDesc || undefined,
    })
    fetch(`/api/work-orders/${woId}/photos`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPhotos(data) })
      .catch(() => {})
    setPhotoDesc('')
  }

  const responseMinutes = calculateMinutes(currentWorkOrder.created_at, currentWorkOrder.assigned_at)
  const processingMinutes = calculateMinutes(currentWorkOrder.assigned_at, currentWorkOrder.resolved_at)

  const isComplaint = currentWorkOrder.type === 'complaint'

  const timeline = useMemo((): TimelineNode[] => {
    const nodes: TimelineNode[] = []

    nodes.push({
      key: 'created',
      label: '工单创建',
      icon: AlertCircle,
      time: currentWorkOrder.created_at,
      actor: '系统自动',
      description: `工单创建，类型：${woTypeLabels[currentWorkOrder.type] || currentWorkOrder.type}`,
      done: true,
    })

    if (isComplaint) {
      nodes.push({
        key: 'complaint',
        label: '用户投诉',
        icon: MessageSquare,
        time: mockComplaintInfo.complaint_time,
        actor: mockComplaintInfo.user_name,
        description: '用户提交投诉，等待处理',
        done: true,
      })
    }

    nodes.push({
      key: 'assigned',
      label: '工单指派',
      icon: ClipboardList,
      time: currentWorkOrder.assigned_at,
      actor: currentWorkOrder.assignee || '待分配',
      description: currentWorkOrder.assigned_at ? `已指派给 ${currentWorkOrder.assignee}` : '等待系统派单或人工指派',
      done: !!currentWorkOrder.assigned_at,
    })

    if (currentWorkOrder.assignee) {
      nodes.push({
        key: 'accepted',
        label: '处理人接单',
        icon: User,
        time: currentWorkOrder.assigned_at,
        actor: currentWorkOrder.assignee,
        description: '处理人已接单，准备前往现场',
        done: true,
      })

      nodes.push({
        key: 'processing',
        label: '现场处理',
        icon: Wrench,
        time: currentWorkOrder.assigned_at,
        actor: currentWorkOrder.assignee,
        description: '技术人员现场排查并处理问题',
        done: currentWorkOrder.status === 'resolved',
      })
    }

    nodes.push({
      key: 'resolved',
      label: '问题解决',
      icon: CheckCircle,
      time: currentWorkOrder.resolved_at,
      actor: currentWorkOrder.assignee || '待处理',
      description: currentWorkOrder.resolution || '等待处理完成',
      done: currentWorkOrder.status === 'resolved',
    })

    if (currentWorkOrder.status === 'resolved') {
      nodes.push({
        key: 'closed',
        label: '工单关闭',
        icon: FileText,
        time: currentWorkOrder.resolved_at,
        actor: '系统自动',
        description: '工单已解决，系统自动关闭',
        done: true,
      })
    }

    let lastDoneIndex = -1
    nodes.forEach((node, index) => {
      if (node.done) lastDoneIndex = index
    })

    return nodes.map((node, index) => ({
      ...node,
      isCurrent: index === lastDoneIndex,
    }))
  }, [currentWorkOrder, isComplaint])

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(
              'w-4 h-4',
              i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/work-orders')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> 返回工单列表
      </button>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">工单 WO-{currentWorkOrder.id}</h2>
            {isComplaint && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded border border-red-200">
                <AlertCircle className="w-3 h-3" /> 投诉工单
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {currentWorkOrder.device_id && (
              <button
                onClick={() => navigate(`/devices/${currentWorkOrder.device_id}`)}
                className="flex items-center gap-1 text-slate-600 border border-slate-200 px-3 py-1 rounded text-sm hover:bg-slate-50"
              >
                <Zap className="w-3 h-3" /> 查看设备
              </button>
            )}
            {relatedOrders.length > 0 && (
              <button
                onClick={() => navigate(`/orders/${relatedOrders[0].id}`)}
                className="flex items-center gap-1 text-slate-600 border border-slate-200 px-3 py-1 rounded text-sm hover:bg-slate-50"
              >
                <FileText className="w-3 h-3" /> 查看关联订单
              </button>
            )}
            {currentWorkOrder.status === 'pending' && (
              <button onClick={() => setShowAssign(true)} className="flex items-center gap-1 text-blue-600 border border-blue-200 px-3 py-1 rounded text-sm hover:bg-blue-50">
                <UserPlus className="w-3 h-3" /> 分配
              </button>
            )}
            {(currentWorkOrder.status === 'assigned' || currentWorkOrder.status === 'pending') && (
              <button onClick={() => setShowResolve(true)} className="flex items-center gap-1 text-emerald-600 border border-emerald-200 px-3 py-1 rounded text-sm hover:bg-emerald-50">
                <CheckCircle className="w-3 h-3" /> 解决
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4 text-sm">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">工单号</div>
              <div className="font-medium font-mono">WO-{currentWorkOrder.id}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ClipboardList className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">类型</div>
              <div className="font-medium">{woTypeLabels[currentWorkOrder.type] || currentWorkOrder.type}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CircleDot className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">状态</div>
              <div><StatusBadge status={currentWorkOrder.status} /></div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">优先级</div>
              <div><StatusBadge status={currentWorkOrder.priority} type="priority" /></div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">关联设备</div>
              {currentWorkOrder.device_id ? (
                <button
                  onClick={() => navigate(`/devices/${currentWorkOrder.device_id}`)}
                  className="font-medium text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  {currentWorkOrder.device_name || `设备 #${currentWorkOrder.device_id}`}
                  <ChevronRight className="w-3 h-3" />
                </button>
              ) : (
                <div className="font-medium text-slate-400">-</div>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">所属站点</div>
              {currentWorkOrder.site_id ? (
                <button
                  onClick={() => navigate(`/sites/${currentWorkOrder.site_id}`)}
                  className="font-medium text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  {currentWorkOrder.site_name || `站点 #${currentWorkOrder.site_id}`}
                  <ChevronRight className="w-3 h-3" />
                </button>
              ) : (
                <div className="font-medium text-slate-400">-</div>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">处理人</div>
              {currentWorkOrder.assignee ? (
                <div className="font-medium text-slate-800">{currentWorkOrder.assignee}</div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-amber-600">待分配</span>
                  {currentWorkOrder.status === 'pending' && (
                    <button
                      onClick={() => setShowAssign(true)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      立即指派
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {isComplaint && (
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-slate-500">投诉用户</div>
                <div className="font-medium text-slate-800">{mockComplaintInfo.user_name}</div>
                <div className="text-xs text-slate-500">{mockComplaintInfo.user_phone}</div>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">创建时间</div>
              <div className="font-medium text-slate-800">
                {new Date(currentWorkOrder.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <UserPlus className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">指派时间</div>
              <div className="font-medium text-slate-800">
                {currentWorkOrder.assigned_at
                  ? new Date(currentWorkOrder.assigned_at).toLocaleString()
                  : '-'}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">响应时长</div>
              <div className="font-medium text-slate-800">
                {responseMinutes !== null ? formatDuration(responseMinutes) : '-'}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">处理时长</div>
              <div className="font-medium text-slate-800">
                {processingMinutes !== null ? formatDuration(processingMinutes) : '-'}
              </div>
            </div>
          </div>

          {currentWorkOrder.description && (
            <div className="sm:col-span-2 lg:col-span-4 flex items-start gap-2">
              <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-slate-500">问题描述</div>
                <div className="font-medium text-slate-800">{currentWorkOrder.description}</div>
              </div>
            </div>
          )}

          {currentWorkOrder.resolution && (
            <div className="sm:col-span-2 lg:col-span-4 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-slate-500">处理结果</div>
                <div className="font-medium text-emerald-700">{currentWorkOrder.resolution}</div>
                {currentWorkOrder.resolved_at && (
                  <div className="text-xs text-slate-500 mt-1">
                    解决时间：{new Date(currentWorkOrder.resolved_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isComplaint && (
        <div className="bg-white rounded-lg border border-red-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-slate-800">投诉处理记录</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 text-sm mb-5 pb-5 border-b border-slate-100">
            <div>
              <div className="text-slate-500">投诉用户</div>
              <div className="font-medium text-slate-800">{mockComplaintInfo.user_name}</div>
              <div className="text-xs text-slate-500">{mockComplaintInfo.user_phone}</div>
            </div>
            <div>
              <div className="text-slate-500">投诉时间</div>
              <div className="font-medium text-slate-800">{mockComplaintInfo.complaint_time}</div>
            </div>
            <div>
              <div className="text-slate-500">用户满意度</div>
              <div className="flex items-center gap-2">
                {renderStars(mockComplaintInfo.satisfaction)}
                <span className="font-medium text-slate-800">{mockComplaintInfo.satisfaction}分</span>
              </div>
            </div>
            <div>
              <div className="text-slate-500">处理结果</div>
              <div className="font-medium text-emerald-600">已解决</div>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <div className="text-slate-500">投诉内容</div>
              <div className="font-medium text-slate-800 bg-slate-50 rounded-lg p-3 mt-1">
                {mockComplaintInfo.complaint_content}
              </div>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <div className="text-slate-500">处理方案</div>
              <div className="font-medium text-emerald-700 bg-emerald-50 rounded-lg p-3 mt-1">
                {mockComplaintInfo.processing_result}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">沟通记录</h4>
            <div className="space-y-3">
              {mockComplaintInfo.communications.map((comm) => (
                <div
                  key={comm.id}
                  className={cn(
                    'flex gap-3',
                    comm.is_user ? 'flex-row' : 'flex-row-reverse'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      comm.is_user ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                    )}
                  >
                    <User className="w-4 h-4" />
                  </div>
                  <div
                    className={cn(
                      'max-w-[80%]',
                      comm.is_user ? '' : 'text-right'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-700">{comm.sender}</span>
                      <span className="text-xs text-slate-400">{comm.time}</span>
                    </div>
                    <div
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm',
                        comm.is_user
                          ? 'bg-blue-50 text-slate-800 rounded-tl-none'
                          : 'bg-emerald-50 text-slate-800 rounded-tr-none inline-block text-left'
                      )}
                    >
                      {comm.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">维修照片</h3>
          {photos.length > 0 && (
            <span className="text-xs text-slate-500">共 {photos.length} 张照片</span>
          )}
        </div>
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {photos.map((p) => (
              <div
                key={p.id}
                className="rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedPhoto(p)}
              >
                <img
                  src={p.photo_url}
                  alt={p.description || ''}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2">
                  {p.description && <p className="text-xs text-slate-700 font-medium mb-1">{p.description}</p>}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <User className="w-3 h-3" />
                    <span>{currentWorkOrder.assignee || '处理人'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(p.uploaded_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg mb-4">
            <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">暂无维修照片</p>
            <p className="text-xs text-slate-400 mt-1">处理人可上传现场维修照片</p>
          </div>
        )}
        {currentWorkOrder.status !== 'resolved' && (
          <div className="flex gap-2">
            <input
              value={photoDesc}
              onChange={(e) => setPhotoDesc(e.target.value)}
              placeholder="照片描述（可选）"
              className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-sm"
            />
            <button
              onClick={handleAddPhoto}
              className="flex items-center gap-1 text-blue-600 border border-blue-200 px-3 py-1 rounded text-sm hover:bg-blue-50"
            >
              <Camera className="w-3 h-3" /> 上传
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">处理时间线</h3>
        <div className="space-y-0">
          {timeline.map((item, i) => {
            const StepIcon = item.icon
            return (
              <div key={item.key} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ring-4',
                      item.isCurrent
                        ? 'bg-blue-500 text-white ring-blue-100'
                        : item.done
                        ? 'bg-emerald-500 text-white ring-emerald-100'
                        : 'bg-slate-200 text-slate-400 ring-slate-50'
                    )}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>
                  {i < timeline.length - 1 && (
                    <div
                      className={cn(
                        'w-0.5 h-12',
                        item.done && timeline[i + 1]?.done
                          ? 'bg-emerald-200'
                          : 'bg-slate-200'
                      )}
                    />
                  )}
                </div>
                <div className="pb-6 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        item.isCurrent
                          ? 'text-blue-600'
                          : item.done
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      )}
                    >
                      {item.label}
                    </p>
                    {item.isCurrent && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                        当前节点
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {item.actor}
                    </span>
                    {item.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.time).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showAssign && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold mb-4">分配处理人</h3>
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="处理人姓名"
              className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm"
            />
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowAssign(false)}
                className="px-4 py-1.5 text-sm text-slate-600 border border-slate-200 rounded hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleAssign}
                className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {showResolve && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold mb-4">处理工单</h3>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="处理结果"
              rows={3}
              className="w-full border border-slate-200 rounded px-3 py-1.5 text-sm resize-none"
            />
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowResolve(false)}
                className="px-4 py-1.5 text-sm text-slate-600 border border-slate-200 rounded hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleResolve}
                className="px-4 py-1.5 text-sm text-white bg-emerald-600 rounded hover:bg-emerald-700"
              >
                确认解决
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.description || ''}
              className="max-w-full max-h-[75vh] object-contain"
            />
            <div className="p-4 border-t border-slate-100">
              {selectedPhoto.description && (
                <p className="text-sm font-medium text-slate-800 mb-2">
                  {selectedPhoto.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  上传人：{currentWorkOrder.assignee || '处理人'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  上传时间：{new Date(selectedPhoto.uploaded_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
