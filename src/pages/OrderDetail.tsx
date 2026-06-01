import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { api } from "@/lib/api"

interface Order {
  id: number
  order_no: string
  consumer_name: string
  consumer_phone: string
  product_model: string
  purchase_channel: string
  install_address: string
  appointment_time: string
  parts_requirements: string
  warranty_status: string
  status: string
  brand_id: number
  service_center_id: number
  created_at: string
  updated_at: string
  brand_name: string
  service_center_name: string
}

interface Dispatch {
  id: number
  technician_name: string
  dispatch_type: "auto" | "manual"
  status: "assigned" | "accepted" | "completed" | "rejected"
  dispatch_time: string
  accept_time: string | null
  reject_reason: string | null
}

interface InstallStep {
  step: number
  description: string
  photo: string
}

interface AuxiliaryCharge {
  item: string
  quantity: number
  unit_price: number
}

interface OnSiteRecord {
  id: number
  technician_name: string
  status: "in_progress" | "completed"
  latitude: number | null
  longitude: number | null
  unboxing_photos: string[]
  install_steps: InstallStep[]
  auxiliary_charges: AuxiliaryCharge[]
  user_signature: string
  exception_notes: string
}

interface ServiceTicket {
  id: string
  type: "reschedule" | "complaint" | "second_visit" | "missing_parts" | "charge_dispute"
  status: "open" | "in_progress" | "resolved" | "closed"
  handler_name: string | null
  description: string
  created_at: string
}

interface Settlement {
  id: number
  order_id: number
  brand_name: string
  center_name: string
  technician_name: string
  service_fee: number
  auxiliary_fee: number
  total_fee: number
  status: "pending" | "approved" | "paid"
  created_at: string
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  pending: { label: "待派工", variant: "warning" },
  dispatched: { label: "已派工", variant: "default" },
  installing: { label: "安装中", variant: "default" },
  completed: { label: "已完成", variant: "success" },
  cancelled: { label: "已取消", variant: "destructive" },
}

const warrantyMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  in_warranty: { label: "保修内", variant: "success" },
  out_of_warranty: { label: "保修外", variant: "destructive" },
  unknown: { label: "未知", variant: "secondary" },
}

const statusActions: Record<string, { nextStatus: string; label: string; variant: "default" | "destructive" | "outline" }[]> = {
  pending: [
    { nextStatus: "dispatched", label: "标记已派工", variant: "default" },
    { nextStatus: "cancelled", label: "取消订单", variant: "destructive" },
  ],
  dispatched: [
    { nextStatus: "installing", label: "标记安装中", variant: "default" },
    { nextStatus: "cancelled", label: "取消订单", variant: "destructive" },
  ],
  installing: [
    { nextStatus: "completed", label: "标记已完成", variant: "default" },
    { nextStatus: "cancelled", label: "取消订单", variant: "destructive" },
  ],
  completed: [],
  cancelled: [],
}

const dispatchStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  assigned: { label: "已派工", variant: "warning" },
  accepted: { label: "已接单", variant: "default" },
  completed: { label: "已完成", variant: "success" },
  rejected: { label: "已拒绝", variant: "destructive" },
}

const dispatchTypeMap: Record<string, { label: string; variant: "default" | "secondary" }> = {
  auto: { label: "自动", variant: "secondary" },
  manual: { label: "手动", variant: "default" },
}

const onSiteStatusMap: Record<string, { label: string; variant: "warning" | "success" }> = {
  in_progress: { label: "进行中", variant: "warning" },
  completed: { label: "已完成", variant: "success" },
}

const ticketTypeMap: Record<string, { label: string; variant: "default" | "destructive" | "warning" | "outline" | "secondary" }> = {
  reschedule: { label: "改约", variant: "default" },
  complaint: { label: "投诉", variant: "destructive" },
  second_visit: { label: "二次上门", variant: "warning" },
  missing_parts: { label: "缺件", variant: "outline" },
  charge_dispute: { label: "收费争议", variant: "secondary" },
}

const ticketStatusMap: Record<string, { label: string; variant: "destructive" | "warning" | "success" | "secondary" }> = {
  open: { label: "待处理", variant: "destructive" },
  in_progress: { label: "处理中", variant: "warning" },
  resolved: { label: "已解决", variant: "success" },
  closed: { label: "已关闭", variant: "secondary" },
}

const settlementStatusMap: Record<string, { label: string; variant: "warning" | "default" | "success" }> = {
  pending: { label: "待审核", variant: "warning" },
  approved: { label: "已审核", variant: "default" },
  paid: { label: "已支付", variant: "success" },
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{children || "-"}</dd>
    </div>
  )
}

function truncate(str: string | null | undefined, max: number) {
  if (!str) return "-"
  return str.length > max ? str.slice(0, max) + "..." : str
}

function calcAuxTotal(charges: AuxiliaryCharge[]) {
  return charges.reduce((sum, c) => sum + c.quantity * c.unit_price, 0)
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState(false)

  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [onSiteRecords, setOnSiteRecords] = useState<OnSiteRecord[]>([])
  const [serviceTicketList, setServiceTicketList] = useState<ServiceTicket[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])

  function loadOrder() {
    setLoading(true)
    setError("")
    api.get<Order>(`/orders/${id}`)
      .then(setOrder)
      .catch((err) => setError(err.message || "加载失败"))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadOrder()
  }, [id])

  useEffect(() => {
    if (!id) return
    api.get<{ data: Dispatch[] }>(`/dispatches?order_id=${id}`)
      .then((res) => setDispatches(res.data || []))
      .catch(() => setDispatches([]))
    api.get<{ data: OnSiteRecord[] }>(`/on-site-records?order_id=${id}`)
      .then((res) => setOnSiteRecords(res.data || []))
      .catch(() => setOnSiteRecords([]))
    api.get<{ data: ServiceTicket[] }>(`/service-tickets?order_id=${id}`)
      .then((res) => setServiceTicketList(res.data || []))
      .catch(() => setServiceTicketList([]))
    api.get<{ data: Settlement[] }>("/settlements?pageSize=100")
      .then((res) => {
        const all = res.data || []
        setSettlements(all.filter((s) => s.order_id === Number(id)))
      })
      .catch(() => setSettlements([]))
  }, [id])

  async function handleStatusChange(nextStatus: string) {
    setUpdating(true)
    try {
      await api.put(`/orders/${id}`, { status: nextStatus })
      loadOrder()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><span className="text-gray-400">加载中...</span></div>
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error}</p>
        <Button variant="outline" className="mt-4" onClick={loadOrder}>重试</Button>
      </div>
    )
  }

  if (!order) return null

  const actions = statusActions[order.status] || []

  return (
    <div className="p-6 space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>← 返回订单列表</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <Field label="订单号">{order.order_no}</Field>
            <Field label="订单状态">
              <Badge variant={statusMap[order.status]?.variant || "default"}>
                {statusMap[order.status]?.label || order.status}
              </Badge>
            </Field>
            <Field label="创建时间">{order.created_at ? new Date(order.created_at).toLocaleString("zh-CN") : "-"}</Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>客户信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <Field label="客户姓名">{order.consumer_name}</Field>
            <Field label="客户电话">{order.consumer_phone}</Field>
          </div>
          <div className="mt-4">
            <Field label="安装地址">{order.install_address}</Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>商品信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <Field label="商品型号">{order.product_model}</Field>
            <Field label="购买渠道">{order.purchase_channel}</Field>
            <Field label="品牌">{order.brand_name}</Field>
            <Field label="保修状态">
              <Badge variant={warrantyMap[order.warranty_status]?.variant || "secondary"}>
                {warrantyMap[order.warranty_status]?.label || order.warranty_status}
              </Badge>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="配件要求">{order.parts_requirements}</Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>预约信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <Field label="预约时间">{order.appointment_time ? new Date(order.appointment_time).toLocaleString("zh-CN") : "-"}</Field>
            <Field label="服务中心">{order.service_center_name}</Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>派工信息</CardTitle>
        </CardHeader>
        <CardContent>
          {dispatches.length === 0 ? (
            <div className="text-center text-gray-400 py-6">暂无派工记录</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>师傅姓名</TableHead>
                  <TableHead>派工方式</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>派工时间</TableHead>
                  <TableHead>接单时间</TableHead>
                  <TableHead>拒绝原因</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dispatches.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.technician_name}</TableCell>
                    <TableCell>
                      <Badge variant={dispatchTypeMap[d.dispatch_type]?.variant || "default"}>
                        {dispatchTypeMap[d.dispatch_type]?.label || d.dispatch_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={dispatchStatusMap[d.status]?.variant || "default"}>
                        {dispatchStatusMap[d.status]?.label || d.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{d.dispatch_time ? new Date(d.dispatch_time).toLocaleString("zh-CN") : "-"}</TableCell>
                    <TableCell>{d.accept_time ? new Date(d.accept_time).toLocaleString("zh-CN") : "-"}</TableCell>
                    <TableCell>{d.reject_reason || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>上门记录</CardTitle>
        </CardHeader>
        <CardContent>
          {onSiteRecords.length === 0 ? (
            <div className="text-center text-gray-400 py-6">暂无上门记录</div>
          ) : (
            <div className="space-y-4">
              {onSiteRecords.map((r) => (
                <div key={r.id} className="rounded-md border border-gray-200 p-4 space-y-3">
                  <div className="grid grid-cols-4 gap-4">
                    <Field label="师傅姓名">{r.technician_name}</Field>
                    <Field label="状态">
                      <Badge variant={onSiteStatusMap[r.status]?.variant || "warning"}>
                        {onSiteStatusMap[r.status]?.label || r.status}
                      </Badge>
                    </Field>
                    <Field label="定位">
                      {r.latitude != null && r.longitude != null
                        ? `${r.latitude}, ${r.longitude}`
                        : "未记录"}
                    </Field>
                    <Field label="签字">{r.user_signature ? "有" : "无"}</Field>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <Field label="开箱照片数">{r.unboxing_photos?.length ?? 0}</Field>
                    <Field label="安装步骤数">{r.install_steps?.length ?? 0}</Field>
                    <Field label="辅材费总计">¥{calcAuxTotal(r.auxiliary_charges || []).toFixed(2)}</Field>
                    <Field label="异常说明">{truncate(r.exception_notes, 20)}</Field>
                  </div>
                  <div className="flex justify-end">
                    <Link to={`/on-site/${r.id}`} className="text-blue-600 hover:underline text-sm">查看详情</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>客服工单</CardTitle>
        </CardHeader>
        <CardContent>
          {serviceTicketList.length === 0 ? (
            <div className="text-center text-gray-400 py-6">暂无客服工单</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>处理人</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceTicketList.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Badge variant={ticketTypeMap[t.type]?.variant || "default"}>
                        {ticketTypeMap[t.type]?.label || t.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ticketStatusMap[t.status]?.variant || "default"}>
                        {ticketStatusMap[t.status]?.label || t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.handler_name || "-"}</TableCell>
                    <TableCell>{truncate(t.description, 20)}</TableCell>
                    <TableCell>{t.created_at ? new Date(t.created_at).toLocaleString("zh-CN") : "-"}</TableCell>
                    <TableCell>
                      <Link to={`/service-tickets/${t.id}`} className="text-blue-600 hover:underline text-sm">查看</Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>结算信息</CardTitle>
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="text-center text-gray-400 py-6">暂无结算记录</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>品牌</TableHead>
                  <TableHead>网点</TableHead>
                  <TableHead>师傅</TableHead>
                  <TableHead>服务费</TableHead>
                  <TableHead>辅材费</TableHead>
                  <TableHead>总计</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.brand_name}</TableCell>
                    <TableCell>{s.center_name}</TableCell>
                    <TableCell>{s.technician_name}</TableCell>
                    <TableCell>¥{s.service_fee.toFixed(2)}</TableCell>
                    <TableCell>¥{s.auxiliary_fee.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">¥{s.total_fee.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={settlementStatusMap[s.status]?.variant || "default"}>
                        {settlementStatusMap[s.status]?.label || s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.created_at ? new Date(s.created_at).toLocaleString("zh-CN") : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>状态操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {actions.map((action) => (
                <Button
                  key={action.nextStatus}
                  variant={action.variant}
                  disabled={updating}
                  onClick={() => handleStatusChange(action.nextStatus)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
