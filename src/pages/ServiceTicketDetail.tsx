import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"

interface ServiceTicket {
  id: string
  order_id: string
  type: "reschedule" | "complaint" | "second_visit" | "missing_parts" | "charge_dispute"
  description: string
  status: "open" | "in_progress" | "resolved" | "closed"
  handler_name: string | null
  resolution: string | null
  created_at: string
  updated_at: string
  order_no: string
  consumer_name: string
}

interface RelatedOrder {
  id: number
  order_no: string
  consumer_name: string
  consumer_phone: string
  product_model: string
  install_address: string
  appointment_time: string
  warranty_status: string
  status: string
}

const TYPE_LABELS: Record<string, string> = {
  reschedule: "改约",
  complaint: "投诉",
  second_visit: "二次上门",
  missing_parts: "缺件",
  charge_dispute: "收费争议",
}

const TYPE_BADGE_VARIANT: Record<string, "default" | "destructive" | "warning" | "outline" | "secondary"> = {
  reschedule: "default",
  complaint: "destructive",
  second_visit: "warning",
  missing_parts: "outline",
  charge_dispute: "secondary",
}

const STATUS_LABELS: Record<string, string> = {
  open: "待处理",
  in_progress: "处理中",
  resolved: "已解决",
  closed: "已关闭",
}

const STATUS_BADGE_VARIANT: Record<string, "destructive" | "warning" | "success" | "secondary"> = {
  open: "destructive",
  in_progress: "warning",
  resolved: "success",
  closed: "secondary",
}

const ORDER_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  pending: { label: "待派工", variant: "warning" },
  dispatched: { label: "已派工", variant: "default" },
  installing: { label: "安装中", variant: "default" },
  completed: { label: "已完成", variant: "success" },
  cancelled: { label: "已取消", variant: "destructive" },
}

const WARRANTY_MAP: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  in_warranty: { label: "保修内", variant: "success" },
  out_of_warranty: { label: "保修外", variant: "destructive" },
  unknown: { label: "未知", variant: "secondary" },
}

const NOTIFICATION_MAP: Record<string, { label: string; variant: "warning" | "default" | "success" | "secondary" }> = {
  open: { label: "待通知", variant: "warning" },
  in_progress: { label: "已通知用户", variant: "default" },
  resolved: { label: "已同步解决结果", variant: "success" },
  closed: { label: "已确认关闭", variant: "secondary" },
}

export default function ServiceTicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<ServiceTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionDialog, setActionDialog] = useState<"start" | "resolve" | null>(null)
  const [handlerName, setHandlerName] = useState("")
  const [resolution, setResolution] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [relatedOrder, setRelatedOrder] = useState<RelatedOrder | null>(null)
  const [orderLoading, setOrderLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api.get<ServiceTicket>(`/service-tickets/${id}`)
      .then(setTicket)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!ticket?.order_id) return
    setOrderLoading(true)
    api.get<RelatedOrder>(`/orders/${ticket.order_id}`)
      .then(setRelatedOrder)
      .catch(() => setRelatedOrder(null))
      .finally(() => setOrderLoading(false))
  }, [ticket?.order_id])

  const handleStart = async () => {
    if (!handlerName || !ticket) return
    setSubmitting(true)
    try {
      const updated = await api.put<ServiceTicket>(`/service-tickets/${ticket.id}`, {
        status: "in_progress",
        handler_name: handlerName,
      })
      setTicket(updated)
      setActionDialog(null)
      setHandlerName("")
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async () => {
    if (!resolution || !ticket) return
    setSubmitting(true)
    try {
      const updated = await api.put<ServiceTicket>(`/service-tickets/${ticket.id}`, {
        status: "resolved",
        resolution,
      })
      setTicket(updated)
      setActionDialog(null)
      setResolution("")
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = async () => {
    if (!ticket) return
    setSubmitting(true)
    try {
      const updated = await api.put<ServiceTicket>(`/service-tickets/${ticket.id}`, {
        status: "closed",
      })
      setTicket(updated)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-400 py-20">加载中...</div>
  }

  if (!ticket) {
    return <div className="p-6 text-center text-gray-400 py-20">工单不存在</div>
  }

  const statusOrder: Array<"open" | "in_progress" | "resolved" | "closed"> = ["open", "in_progress", "resolved", "closed"]
  const currentStatusIndex = statusOrder.indexOf(ticket.status)

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/service-tickets")}>
        ← 返回客服工单
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>工单信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">订单号：</span>
              <span className="font-medium">{ticket.order_no}</span>
            </div>
            <div>
              <span className="text-gray-500">类型：</span>
              <Badge variant={TYPE_BADGE_VARIANT[ticket.type]}>{TYPE_LABELS[ticket.type]}</Badge>
            </div>
            <div>
              <span className="text-gray-500">状态：</span>
              <Badge variant={STATUS_BADGE_VARIANT[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
            </div>
            <div>
              <span className="text-gray-500">创建时间：</span>
              <span>{new Date(ticket.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">更新时间：</span>
              <span>{new Date(ticket.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>关联订单信息</CardTitle>
        </CardHeader>
        <CardContent>
          {orderLoading ? (
            <div className="text-sm text-gray-400">加载中...</div>
          ) : relatedOrder ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">订单号：</span>
                  <span className="font-medium">{relatedOrder.order_no}</span>
                </div>
                <div>
                  <span className="text-gray-500">客户姓名：</span>
                  <span className="font-medium">{relatedOrder.consumer_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">商品型号：</span>
                  <span className="font-medium">{relatedOrder.product_model}</span>
                </div>
                <div>
                  <span className="text-gray-500">安装地址：</span>
                  <span className="font-medium">{relatedOrder.install_address}</span>
                </div>
                <div>
                  <span className="text-gray-500">订单状态：</span>
                  <Badge variant={ORDER_STATUS_MAP[relatedOrder.status]?.variant || "default"}>
                    {ORDER_STATUS_MAP[relatedOrder.status]?.label || relatedOrder.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">预约时间：</span>
                  <span>{relatedOrder.appointment_time ? new Date(relatedOrder.appointment_time).toLocaleString("zh-CN") : "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500">保修状态：</span>
                  <Badge variant={WARRANTY_MAP[relatedOrder.warranty_status]?.variant || "secondary"}>
                    {WARRANTY_MAP[relatedOrder.warranty_status]?.label || relatedOrder.warranty_status}
                  </Badge>
                </div>
              </div>
              <div>
                <Link to={`/orders/${relatedOrder.id}`} className="text-blue-600 hover:underline text-sm">查看订单</Link>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">无法加载关联订单信息</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>问题描述</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>处理信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500">处理人：</span>
              <span className="font-medium">{ticket.handler_name || "未分配"}</span>
            </div>
            <div>
              <span className="text-gray-500">处理结果：</span>
              <span className="whitespace-pre-wrap">{ticket.resolution || "暂无"}</span>
            </div>
            <div>
              <span className="text-gray-500">用户通知状态：</span>
              <Badge variant={NOTIFICATION_MAP[ticket.status]?.variant || "secondary"}>
                {NOTIFICATION_MAP[ticket.status]?.label || "未知"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>处理闭环时间线</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="w-px h-8 bg-gray-200" />
              </div>
              <div className="pb-4">
                <div className="text-sm font-medium text-gray-900">工单创建</div>
                <div className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {currentStatusIndex >= 1 ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-gray-300 bg-white" />
                )}
                <div className="w-px h-8 bg-gray-200" />
              </div>
              <div className="pb-4">
                <div className={`text-sm font-medium ${currentStatusIndex >= 1 ? "text-gray-900" : "text-gray-400"}`}>开始处理</div>
                {currentStatusIndex >= 1 && ticket.handler_name ? (
                  <div className="text-xs text-gray-500">处理人：{ticket.handler_name} · {new Date(ticket.updated_at).toLocaleString()}</div>
                ) : (
                  <div className="text-xs text-gray-400">待处理</div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {currentStatusIndex >= 2 ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-gray-300 bg-white" />
                )}
                <div className="w-px h-8 bg-gray-200" />
              </div>
              <div className="pb-4">
                <div className={`text-sm font-medium ${currentStatusIndex >= 2 ? "text-gray-900" : "text-gray-400"}`}>已解决</div>
                {currentStatusIndex >= 2 && ticket.resolution ? (
                  <div className="text-xs text-gray-500">{ticket.resolution}</div>
                ) : (
                  <div className="text-xs text-gray-400">待解决</div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                {currentStatusIndex >= 3 ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-3.5 w-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full border-2 border-gray-300 bg-white" />
                )}
              </div>
              <div>
                <div className={`text-sm font-medium ${currentStatusIndex >= 3 ? "text-gray-900" : "text-gray-400"}`}>已关闭</div>
                {currentStatusIndex >= 3 ? (
                  <div className="text-xs text-gray-500">工单已关闭</div>
                ) : (
                  <div className="text-xs text-gray-400">待关闭</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>操作</CardTitle>
        </CardHeader>
        <CardContent>
          {ticket.status === "open" && (
            <Button onClick={() => setActionDialog("start")}>开始处理</Button>
          )}
          {ticket.status === "in_progress" && (
            <Button onClick={() => setActionDialog("resolve")}>标记解决</Button>
          )}
          {ticket.status === "resolved" && (
            <Button variant="destructive" onClick={handleClose} disabled={submitting}>
              {submitting ? "处理中..." : "关闭工单"}
            </Button>
          )}
          {ticket.status === "closed" && (
            <span className="text-sm text-gray-400">工单已关闭，无可用操作</span>
          )}
        </CardContent>
      </Card>

      <Dialog open={actionDialog === "start"} onClose={() => setActionDialog(null)} title="开始处理">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">处理人姓名</label>
            <Input
              value={handlerName}
              onChange={(e) => setHandlerName(e.target.value)}
              placeholder="请输入处理人姓名"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActionDialog(null)}>取消</Button>
            <Button onClick={handleStart} disabled={submitting || !handlerName}>
              {submitting ? "提交中..." : "确认"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={actionDialog === "resolve"} onClose={() => setActionDialog(null)} title="标记解决">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">处理结果</label>
            <Textarea
              rows={4}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="请输入处理结果"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActionDialog(null)}>取消</Button>
            <Button onClick={handleResolve} disabled={submitting || !resolution}>
              {submitting ? "提交中..." : "确认"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
