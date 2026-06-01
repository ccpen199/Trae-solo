import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { api } from "@/lib/api"
import {
  ClipboardList, Route, MapPin, HeadphonesIcon, Calculator,
  CalendarClock, AlertTriangle, DollarSign, Wrench, Camera,
  PenLine, AlertCircle, Package, ChevronRight, CheckCircle2,
  Clock, XCircle, UserCheck, ArrowRight
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Link } from "react-router-dom"

interface StatItem {
  status: string
  count: number
}

interface TicketTypeItem {
  type: string
  count: number
}

interface SettlementStatItem {
  status: string
  total_fee: number
  count: number
}

interface AuxCharge {
  item: string
  quantity: number
  unit_price: number
}

interface InstallStep {
  step: number
  description: string
  photo: string
}

interface RecentOrder {
  id: number
  order_no: string
  consumer_name: string
  consumer_phone: string
  product_model: string
  purchase_channel: string
  install_address: string
  appointment_time: string
  parts_requirements: string | null
  warranty_status: string
  status: string
  brand_name: string
  service_center_name: string
  dispatch_id: number | null
  dispatch_status: string | null
  dispatch_type: string | null
  dispatch_time: string | null
  accept_time: string | null
  technician_name: string | null
  onsite_record_id: number | null
  onsite_status: string | null
  unboxing_photos: string[]
  install_steps: InstallStep[]
  user_signature: string | null
  auxiliary_charges: AuxCharge[]
  onsite_exception: string | null
  latitude: number | null
  longitude: number | null
  settlement_id: number | null
  settlement_status: string | null
  settlement_total: number | null
  active_tickets: number
  created_at: string
}

interface PendingTicket {
  id: number
  order_id: number
  type: string
  description: string
  status: string
  handler_name: string | null
  resolution: string | null
  order_no: string
  consumer_name: string
  consumer_phone: string
  product_model: string
  install_address: string
  order_status: string
  warranty_status: string
  appointment_time: string
  settlement_id: number | null
  settlement_status: string | null
  total_fee: number | null
  onsite_id: number | null
  onsite_status: string | null
  dispatch_id: number | null
  dispatch_status: string | null
  created_at: string
  updated_at: string
}

interface DashboardData {
  orderStats: StatItem[]
  dispatchStats: StatItem[]
  onsiteStats: StatItem[]
  ticketStats: TicketTypeItem[]
  ticketStatusStats: StatItem[]
  settlementStats: SettlementStatItem[]
  recentOrders: RecentOrder[]
  pendingTickets: PendingTicket[]
  pendingSettlementTotal: number
}

const orderStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  pending: { label: "待派工", variant: "warning" },
  dispatched: { label: "已派工", variant: "default" },
  installing: { label: "安装中", variant: "default" },
  completed: { label: "已完成", variant: "success" },
  cancelled: { label: "已取消", variant: "destructive" },
}

const warrantyStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  in_warranty: { label: "保修期内", variant: "success" },
  out_of_warranty: { label: "保修期外", variant: "destructive" },
  unknown: { label: "未知", variant: "secondary" },
}

const dispatchStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  assigned: { label: "已派工", variant: "warning" },
  accepted: { label: "已接单", variant: "default" },
  completed: { label: "已完成", variant: "success" },
  rejected: { label: "已拒绝", variant: "destructive" },
}

const onsiteStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  in_progress: { label: "上门中", variant: "warning" },
  completed: { label: "已完成", variant: "success" },
}

const ticketTypeMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }> = {
  reschedule: { label: "改约", variant: "default" },
  complaint: { label: "投诉", variant: "destructive" },
  second_visit: { label: "二次上门", variant: "warning" },
  missing_parts: { label: "缺件", variant: "outline" },
  charge_dispute: { label: "收费争议", variant: "secondary" },
}

const ticketStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  open: { label: "待处理", variant: "destructive" },
  in_progress: { label: "处理中", variant: "warning" },
  resolved: { label: "已解决", variant: "success" },
  closed: { label: "已关闭", variant: "secondary" },
}

const settlementStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  pending: { label: "待结算", variant: "warning" },
  approved: { label: "已审批", variant: "default" },
  paid: { label: "已付款", variant: "success" },
  rejected: { label: "已驳回", variant: "destructive" },
}

function getCount(stats: StatItem[], key: string): number {
  return stats.find(s => s.status === key)?.count ?? 0
}

function getTicketTypeCount(stats: TicketTypeItem[], type: string): number {
  return stats.find(s => s.type === type)?.count ?? 0
}

function fmt(dt: string): string {
  if (!dt) return "--"
  const d = new Date(dt)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function auxTotal(charges: AuxCharge[]): number {
  if (!Array.isArray(charges)) return 0
  return charges.reduce((sum, c) => sum + (c.quantity || 0) * (c.unit_price || 0), 0)
}

function getUserSyncBadge(status: string) {
  switch (status) {
    case "open": return <Badge variant="warning">待通知用户</Badge>
    case "in_progress": return <Badge variant="default">已通知用户</Badge>
    case "resolved": return <Badge variant="success">已同步解决结果</Badge>
    case "closed": return <Badge variant="secondary">用户已确认</Badge>
    default: return <Badge variant="secondary">未知</Badge>
  }
}

function getResolutionBadge(resolution: string | null) {
  if (!resolution) return <Badge variant="outline">无处理结果</Badge>
  return <Badge variant="success">有处理结果</Badge>
}

function FulfillmentTimeline({ order }: { order: RecentOrder }) {
  const getDispatchStep = () => {
    if (!order.dispatch_id) {
      return order.status === "pending" ? "pending" : "pending"
    }
    if (order.dispatch_status === "completed") return "completed"
    if (order.dispatch_status === "rejected") return "pending"
    return "current"
  }

  const getOnsiteStep = () => {
    if (!order.onsite_record_id) {
      if (order.dispatch_id && order.dispatch_status !== "rejected") return "pending"
      if (order.status === "completed") return "completed"
      return "disabled"
    }
    if (order.onsite_status === "completed") return "completed"
    return "current"
  }

  const getTicketStep = () => {
    if (order.active_tickets > 0) return "current"
    const hasOnsiteCompleted = order.onsite_status === "completed" || order.status === "completed"
    if (hasOnsiteCompleted) return "completed"
    if (order.onsite_record_id) return "pending"
    return "disabled"
  }

  const getSettlementStep = () => {
    if (order.settlement_id) {
      if (order.settlement_status === "paid") return "completed"
      if (order.settlement_status === "approved") return "completed"
      return "current"
    }
    const hasOnsiteCompleted = order.onsite_status === "completed" || order.status === "completed"
    if (hasOnsiteCompleted) return "pending"
    return "disabled"
  }

  const getExportStep = () => {
    const hasEvidence = order.onsite_record_id && order.onsite_status === "completed"
    const hasSettlement = order.settlement_id && order.settlement_status !== "pending"
    if (hasEvidence && hasSettlement) return "completed"
    if (hasEvidence) return "pending"
    return "disabled"
  }

  const steps = [
    {
      key: "order",
      label: "订单创建",
      status: "completed",
      icon: <ClipboardList className="h-3.5 w-3.5" />,
      link: `/orders/${order.id}`,
      title: `创建时间: ${fmt(order.created_at)}`,
    },
    {
      key: "dispatch",
      label: "派工",
      status: getDispatchStep(),
      icon: <Route className="h-3.5 w-3.5" />,
      link: order.dispatch_id ? `/dispatches?order_id=${order.id}` : `/dispatches`,
      title: order.dispatch_id
        ? `派工: ${order.dispatch_type === "auto" ? "自动匹配" : "手动指定"} - ${order.technician_name || "--"}${order.dispatch_time ? `\n派工时间: ${fmt(order.dispatch_time)}` : ""}${order.accept_time ? `\n接单时间: ${fmt(order.accept_time)}` : ""}`
        : "尚未派工，点击去派工",
    },
    {
      key: "onsite",
      label: "上门验收",
      status: getOnsiteStep(),
      icon: <MapPin className="h-3.5 w-3.5" />,
      link: order.onsite_record_id ? `/on-site/${order.onsite_record_id}` : `/on-site?order_id=${order.id}`,
      title: order.onsite_record_id
        ? `${order.onsite_status === "completed" ? "已完成" : "进行中"}${order.user_signature ? "\n用户已签字" : "\n未签字"}${order.onsite_exception ? "\n存在异常记录" : "\n无异常"}${order.latitude != null ? `\n定位: ${order.latitude.toFixed(4)}, ${order.longitude.toFixed(4)}` : ""}`
        : "等待上门服务",
    },
    {
      key: "ticket",
      label: "客服处理",
      status: getTicketStep(),
      icon: <HeadphonesIcon className="h-3.5 w-3.5" />,
      link: `/service-tickets?order_id=${order.id}`,
      badge: order.active_tickets > 0 ? `${order.active_tickets}待处理` : null,
      title: order.active_tickets > 0
        ? `${order.active_tickets}个工单待处理，点击查看`
        : order.onsite_status === "completed" || order.status === "completed"
          ? "无待处理工单，客服环节已完成"
          : "等待上门完成",
    },
    {
      key: "settlement",
      label: "结算",
      status: getSettlementStep(),
      icon: <Calculator className="h-3.5 w-3.5" />,
      link: `/settlements?order_id=${order.id}`,
      title: order.settlement_id
        ? `结算金额: ¥${order.settlement_total?.toFixed(2) || "0.00"}\n状态: ${settlementStatusMap[order.settlement_status!]?.label || order.settlement_status}`
        : order.onsite_status === "completed" || order.status === "completed"
          ? "待创建结算单"
          : "等待上门完成",
    },
    {
      key: "export",
      label: "导出证据",
      status: getExportStep(),
      icon: <PenLine className="h-3.5 w-3.5" />,
      link: order.onsite_record_id ? `/on-site/${order.onsite_record_id}` : null,
      title: order.onsite_record_id
        ? `${order.unboxing_photos?.length || 0}张开箱照片\n${order.install_steps?.length || 0}个安装步骤\n辅材费: ¥${auxTotal(order.auxiliary_charges).toFixed(2)}`
        : "待上门记录完成后可导出",
    },
  ]

  return (
    <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-2">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center flex-1">
          {step.link ? (
            <Link
              to={step.link}
              className="flex items-center gap-1.5 hover:bg-white hover:rounded px-1 py-0.5 transition-colors group relative"
              title={step.title}
            >
              <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors
                ${step.status === "completed" ? "bg-green-100 text-green-600 group-hover:bg-green-200" :
                  step.status === "current" ? "bg-blue-100 text-blue-600 group-hover:bg-blue-200" :
                  step.status === "pending" ? "bg-yellow-100 text-yellow-600 group-hover:bg-yellow-200" :
                  "bg-gray-100 text-gray-400 group-hover:bg-gray-200"}`}>
                {step.status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                 step.status === "current" ? <Clock className="h-3.5 w-3.5 animate-pulse" /> :
                 step.status === "pending" ? step.icon :
                 <XCircle className="h-3.5 w-3.5" />}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap transition-colors
                ${step.status === "disabled" ? "text-gray-400" : "text-gray-700 group-hover:text-gray-900"}`}>
                {step.label}
              </span>
              {step.badge && (
                <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4 ml-0.5 animate-pulse">{step.badge}</Badge>
              )}
            </Link>
          ) : (
            <div className="flex items-center gap-1.5 px-1 py-0.5 opacity-50" title={step.title}>
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400">
                <XCircle className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium whitespace-nowrap text-gray-400">{step.label}</span>
            </div>
          )}
          {idx < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 rounded transition-colors
              ${step.status === "completed" ? "bg-green-300" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function TicketProcessingTimeline({ status }: { status: string }) {
  const steps = [
    { key: "created", label: "创建", done: true },
    { key: "processing", label: "处理", done: status === "in_progress" || status === "resolved" || status === "closed" },
    { key: "resolved", label: "解决", done: status === "resolved" || status === "closed" },
    { key: "closed", label: "关闭", done: status === "closed" },
  ]
  return (
    <div className="flex items-center gap-0.5">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center">
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded
            ${step.done ? "bg-green-50" : "bg-gray-50"}`}>
            {step.done ? (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            ) : (
              <Clock className="h-3 w-3 text-gray-400" />
            )}
            <span className={`text-[10px] ${step.done ? "text-green-700" : "text-gray-500"}`}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`w-4 h-px ${step.done ? "bg-green-300" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function TicketClosedLoopIndicator({ ticket }: { ticket: PendingTicket }) {
  const orderCompleted = ticket.order_status === "completed"
  const hasSettlement = ticket.settlement_id != null
  const hasOnsite = ticket.onsite_id != null
  const hasDispatch = ticket.dispatch_id != null

  const loopStages = [
    { key: "dispatch", label: "派工", done: hasDispatch, link: `/dispatches?order_id=${ticket.order_id}` },
    { key: "onsite", label: "上门", done: hasOnsite, link: `/on-site?order_id=${ticket.order_id}` },
    { key: "order", label: "订单", done: orderCompleted, link: `/orders/${ticket.order_id}` },
    { key: "settlement", label: "结算", done: hasSettlement, link: `/settlements?order_id=${ticket.order_id}` },
  ]

  const hasInconsistency = (orderCompleted || hasSettlement) && (ticket.status === "open" || ticket.status === "in_progress")

  return (
    <div className="space-y-2">
      {hasInconsistency && (
        <div className="flex items-center gap-1.5 text-sm text-red-600 bg-red-50 rounded px-2 py-1">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">状态异常：{orderCompleted ? "订单已完成" : "结算已创建"}，但工单仍{ticket.status === "open" ? "待处理" : "处理中"}</span>
        </div>
      )}

      <div className="flex items-center gap-1 bg-gray-50 rounded px-2 py-1">
        <span className="text-xs text-gray-500 mr-1">履约闭环:</span>
        {loopStages.map((stage, idx) => (
          <div key={stage.key} className="flex items-center flex-1">
            <Link
              to={stage.link}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors
                ${stage.done ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"}`}
              title={stage.done ? `${stage.label}已完成` : `${stage.label}待处理`}
            >
              {stage.done ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {stage.label}
            </Link>
            {idx < loopStages.length - 1 && (
              <div className={`w-2 h-px mx-0.5 ${stage.done ? "bg-green-300" : "bg-yellow-300"}`} />
            )}
          </div>
        ))}
      </div>

      {ticket.settlement_id && (
        <div className="flex items-center gap-2 text-xs bg-purple-50 text-purple-700 rounded px-2 py-1">
          <Calculator className="h-3.5 w-3.5" />
          <span>结算单 #{ticket.settlement_id}</span>
          <Badge variant={settlementStatusMap[ticket.settlement_status!]?.variant || "default"} className="text-[10px] h-4">
            {settlementStatusMap[ticket.settlement_status!]?.label || ticket.settlement_status}
          </Badge>
          {ticket.total_fee != null && <span>金额: ¥{ticket.total_fee.toFixed(2)}</span>}
          <Link to={`/settlements?order_id=${ticket.order_id}`} className="ml-auto text-purple-600 hover:text-purple-800">
            查看结算→
          </Link>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<DashboardData>("/dashboard")
        setData(res)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="flex h-full items-center justify-center"><span className="text-gray-400">加载中...</span></div>
  }

  if (!data) {
    return <div className="flex h-full items-center justify-center"><span className="text-gray-400">加载失败</span></div>
  }

  const pendingOrderCount = getCount(data.orderStats, "pending")
  const dispatchedCount = getCount(data.orderStats, "dispatched")
  const installingCount = getCount(data.orderStats, "installing")
  const completedOrderCount = getCount(data.orderStats, "completed")
  const pendingTicketCount = data.ticketStatusStats
    .filter(s => s.status === "open" || s.status === "in_progress")
    .reduce((sum, s) => sum + s.count, 0)
  const assignedDispatchCount = getCount(data.dispatchStats, "assigned")
  const inprogressOnsiteCount = getCount(data.onsiteStats, "in_progress")
  const pendingSettlementCount = data.settlementStats.find(s => s.status === "pending")?.count ?? 0

  const orderChartData = [
    { name: "待派工", value: pendingOrderCount },
    { name: "已派工", value: dispatchedCount },
    { name: "安装中", value: installingCount },
    { name: "已完成", value: completedOrderCount },
    { name: "已取消", value: getCount(data.orderStats, "cancelled") },
  ]

  const ticketChartData = [
    { name: "改约", value: getTicketTypeCount(data.ticketStats, "reschedule") },
    { name: "投诉", value: getTicketTypeCount(data.ticketStats, "complaint") },
    { name: "二次上门", value: getTicketTypeCount(data.ticketStats, "second_visit") },
    { name: "缺件", value: getTicketTypeCount(data.ticketStats, "missing_parts") },
    { name: "收费争议", value: getTicketTypeCount(data.ticketStats, "charge_dispute") },
  ]

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <h1 className="text-2xl font-bold text-gray-900">工作台</h1>

      <div className="grid grid-cols-5 gap-4">
        <Link to="/orders?status=pending" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">待派工订单</CardTitle>
              <ClipboardList className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrderCount}</div>
              <p className="text-xs text-gray-400 mt-1">点击进入派工</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dispatches?status=assigned" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">待接单派工</CardTitle>
              <Route className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedDispatchCount}</div>
              <p className="text-xs text-gray-400 mt-1">点击查看派工</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/on-site?status=in_progress" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">上门中记录</CardTitle>
              <MapPin className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inprogressOnsiteCount}</div>
              <p className="text-xs text-gray-400 mt-1">点击查看上门</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/service-tickets?status=open" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">待处理工单</CardTitle>
              <HeadphonesIcon className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingTicketCount}</div>
              <p className="text-xs text-gray-400 mt-1">点击处理工单</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/settlements?status=pending" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">待结算</CardTitle>
              <Calculator className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingSettlementCount}笔</div>
              <p className="text-xs text-gray-400 mt-1">¥{data.pendingSettlementTotal.toFixed(2)}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Link to="/service-tickets?type=reschedule" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">改约请求</CardTitle>
              <CalendarClock className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTicketTypeCount(data.ticketStats, "reschedule")}</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/service-tickets?type=complaint" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">投诉工单</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTicketTypeCount(data.ticketStats, "complaint")}</div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/service-tickets?type=charge_dispute" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">收费争议</CardTitle>
              <DollarSign className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTicketTypeCount(data.ticketStats, "charge_dispute")}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">订单状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">工单类型分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">近期订单履约明细</CardTitle>
          <Link to="/orders">
            <Button variant="ghost" size="sm">查看全部 <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{order.order_no}</span>
                  <Badge variant={orderStatusMap[order.status]?.variant || "default"}>
                    {orderStatusMap[order.status]?.label || order.status}
                  </Badge>
                  {order.brand_name && <Badge variant="secondary">{order.brand_name}</Badge>}
                  <Badge variant={warrantyStatusMap[order.warranty_status]?.variant || "secondary"}>
                    {warrantyStatusMap[order.warranty_status]?.label || order.warranty_status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{order.consumer_name}</span>
                  <span>{order.consumer_phone}</span>
                  <span className="flex items-center gap-1"><Wrench className="h-3.5 w-3.5" />{order.product_model}</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{order.install_address}</span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />预约: {fmt(order.appointment_time)}</span>
                  <span>渠道: {order.purchase_channel}</span>
                  <span>网点: {order.service_center_name || "--"}</span>
                </div>

                {order.dispatch_id ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 rounded px-2 py-1">
                    <Route className="h-3.5 w-3.5 text-blue-500" />
                    <span>派工: {order.technician_name}</span>
                    <Badge variant={dispatchStatusMap[order.dispatch_status!]?.variant || "default"} className="text-xs">
                      {dispatchStatusMap[order.dispatch_status!]?.label || order.dispatch_status}
                    </Badge>
                    <span className="text-xs text-gray-400">方式: {order.dispatch_type === "auto" ? "自动匹配" : "手动指定"}</span>
                    {order.dispatch_time && <span className="text-xs text-gray-400">派工: {fmt(order.dispatch_time)}</span>}
                    {order.accept_time && <span className="text-xs text-gray-400">接单: {fmt(order.accept_time)}</span>}
                    <Link to="/dispatches" className="text-xs text-blue-600 hover:text-blue-800 ml-auto">查看派工→</Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 rounded px-2 py-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>尚未派工</span>
                    <Link to="/dispatches" className="text-xs text-blue-600 hover:text-blue-800 ml-auto">去派工→</Link>
                  </div>
                )}

                {order.onsite_record_id ? (
                  <div className="flex items-center gap-3 text-sm text-gray-600 bg-green-50 rounded px-2 py-1">
                    <MapPin className="h-3.5 w-3.5 text-green-500" />
                    <Badge variant={onsiteStatusMap[order.onsite_status!]?.variant || "default"} className="text-xs">
                      {onsiteStatusMap[order.onsite_status!]?.label || order.onsite_status}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5" />{order.unboxing_photos?.length ?? 0}张照片
                    </span>
                    <span className="flex items-center gap-1">
                      {order.user_signature
                        ? <><PenLine className="h-3.5 w-3.5 text-green-500" /><span className="text-green-700">已签字</span></>
                        : <><PenLine className="h-3.5 w-3.5 text-red-400" /><span className="text-red-500">未签字</span></>
                      }
                    </span>
                    <span className="flex items-center gap-1">
                      {order.onsite_exception
                        ? <><AlertCircle className="h-3.5 w-3.5 text-red-400" /><span className="text-red-500">有异常</span></>
                        : <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /><span className="text-green-700">无异常</span></>
                      }
                    </span>
                    {order.auxiliary_charges && order.auxiliary_charges.length > 0 && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />辅材费 ¥{auxTotal(order.auxiliary_charges).toFixed(2)}
                      </span>
                    )}
                    {order.latitude != null && order.longitude != null && (
                      <span className="text-xs text-gray-400">定位: {Number(order.latitude).toFixed(4)}, {Number(order.longitude).toFixed(4)}</span>
                    )}
                    <span className="text-xs text-gray-400">安装步骤: {order.install_steps?.length ?? 0}步</span>
                    <Link to={`/on-site/${order.onsite_record_id}`} className="text-xs text-blue-600 hover:text-blue-800 ml-auto">查看上门→</Link>
                  </div>
                ) : (
                  order.dispatch_id && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded px-2 py-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>暂无上门记录</span>
                    </div>
                  )
                )}

                {order.parts_requirements && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 rounded px-2 py-1">
                    <Package className="h-3.5 w-3.5" />
                    <span>配件需求: {order.parts_requirements}</span>
                  </div>
                )}

                {order.settlement_id ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-purple-50 rounded px-2 py-1">
                    <Calculator className="h-3.5 w-3.5 text-purple-500" />
                    <span>结算单号 #{order.settlement_id}</span>
                    <Badge variant={settlementStatusMap[order.settlement_status!]?.variant || "default"} className="text-xs">
                      {settlementStatusMap[order.settlement_status!]?.label || order.settlement_status}
                    </Badge>
                    {order.settlement_total != null && (
                      <span className="text-sm font-semibold text-purple-700">¥{order.settlement_total.toFixed(2)}</span>
                    )}
                    <Link to={`/settlements?order_id=${order.id}`} className="text-xs text-purple-600 hover:text-purple-800 ml-auto">查看结算→</Link>
                  </div>
                ) : order.onsite_record_id && order.onsite_status === "completed" ? (
                  <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 rounded px-2 py-1">
                    <Calculator className="h-3.5 w-3.5" />
                    <span>待结算</span>
                    <Link to={`/settlements?order_id=${order.id}`} className="text-xs text-blue-600 hover:text-blue-800 ml-auto">去结算→</Link>
                  </div>
                ) : null}

                <FulfillmentTimeline order={order} />

                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-xs text-gray-400">创建: {fmt(order.created_at)}</span>
                  <Link to={`/orders/${order.id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">查看订单详情 →</Link>
                </div>
              </div>
            ))}
            {data.recentOrders.length === 0 && <div className="text-sm text-gray-400 text-center py-4">暂无订单</div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">待处理工单清单</CardTitle>
          <Link to="/service-tickets">
            <Button variant="ghost" size="sm">查看全部 <ArrowRight className="h-4 w-4 ml-1" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data.pendingTickets.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">暂无待处理工单</div>
          ) : (
            <div className="space-y-3">
              {data.pendingTickets.map((ticket) => (
                <div key={ticket.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">工单 #{ticket.id}</span>
                    <Badge variant={ticketTypeMap[ticket.type]?.variant || "default"}>
                      {ticketTypeMap[ticket.type]?.label || ticket.type}
                    </Badge>
                    <Badge variant={ticketStatusMap[ticket.status]?.variant || "default"}>
                      {ticketStatusMap[ticket.status]?.label || ticket.status}
                    </Badge>
                    {getUserSyncBadge(ticket.status)}
                  </div>

                  <div className="text-sm text-gray-700">{ticket.description}</div>

                  <TicketProcessingTimeline status={ticket.status} />

                  <TicketClosedLoopIndicator ticket={ticket} />

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>订单: {ticket.order_no}</span>
                    <span>客户: {ticket.consumer_name}</span>
                    <span>商品: {ticket.product_model}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>地址: {ticket.install_address}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {ticket.handler_name ? (
                      <span className="flex items-center gap-1"><UserCheck className="h-3.5 w-3.5 text-green-500" />处理人: {ticket.handler_name}</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500"><AlertCircle className="h-3.5 w-3.5" />未分配处理人</span>
                    )}
                    {getResolutionBadge(ticket.resolution)}
                    <span className="text-xs text-gray-400">创建: {fmt(ticket.created_at)}</span>
                    <span className="text-xs text-gray-400">更新: {fmt(ticket.updated_at)}</span>
                  </div>

                  {ticket.resolution && (
                    <div className="text-sm text-green-700 bg-green-50 rounded px-2 py-1">
                      处理结果: {ticket.resolution}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t">
                    <div className="flex items-center gap-2">
                      {ticket.order_status && (
                        <Badge variant={orderStatusMap[ticket.order_status]?.variant || "default"} className="text-xs">
                          订单: {orderStatusMap[ticket.order_status]?.label || ticket.order_status}
                        </Badge>
                      )}
                      {ticket.warranty_status && (
                        <Badge variant={warrantyStatusMap[ticket.warranty_status]?.variant || "secondary"} className="text-xs">
                          {warrantyStatusMap[ticket.warranty_status]?.label || ticket.warranty_status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link to={`/orders/${ticket.order_id}`} className="text-xs text-gray-500 hover:text-blue-600">
                        关联订单→
                      </Link>
                      <Link to={`/service-tickets/${ticket.id}`} className="text-xs text-gray-500 hover:text-blue-600">
                        复查记录→
                      </Link>
                      <Link to={`/service-tickets/${ticket.id}`} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        处理工单 →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
