import { useState, useEffect, useCallback } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

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

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface Order {
  id: string
  order_no: string
  consumer_name: string
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

export default function ServiceTickets() {
  const [urlParams] = useSearchParams()
  const [tickets, setTickets] = useState<ServiceTicket[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [statusFilter, setStatusFilter] = useState(urlParams.get("status") || "")
  const [typeFilter, setTypeFilter] = useState(urlParams.get("type") || "")
  const [orderIdFilter, setOrderIdFilter] = useState(urlParams.get("order_id") || "")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [form, setForm] = useState({ order_id: "", type: "reschedule" as string, description: "" })
  const [submitting, setSubmitting] = useState(false)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(pagination.page))
      params.set("pageSize", String(pagination.pageSize))
      if (statusFilter) params.set("status", statusFilter)
      if (typeFilter) params.set("type", typeFilter)
      if (orderIdFilter) params.set("order_id", orderIdFilter)
      const res = await api.get<{ data: ServiceTicket[]; pagination: Pagination }>(`/service-tickets?${params}`)
      setTickets(res.data)
      setPagination(res.pagination)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, statusFilter, typeFilter, orderIdFilter])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    api.get<{ data: Order[] }>("/orders?pageSize=50").then((res) => setOrders(res.data))
  }, [])

  const handleFilterChange = (newStatus: string, newType: string) => {
    setStatusFilter(newStatus)
    setTypeFilter(newType)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleCreate = async () => {
    if (!form.order_id || !form.description) return
    setSubmitting(true)
    try {
      await api.post("/service-tickets", form)
      setDialogOpen(false)
      setForm({ order_id: "", type: "reschedule", description: "" })
      fetchTickets()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">客服工单</h1>
        <Button onClick={() => setDialogOpen(true)}>新建工单</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">状态</span>
              <Select
                value={statusFilter}
                onChange={(e) => handleFilterChange(e.target.value, typeFilter)}
                className="w-32"
              >
                <option value="">全部</option>
                <option value="open">待处理</option>
                <option value="in_progress">处理中</option>
                <option value="resolved">已解决</option>
                <option value="closed">已关闭</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">类型</span>
              <Select
                value={typeFilter}
                onChange={(e) => handleFilterChange(statusFilter, e.target.value)}
                className="w-32"
              >
                <option value="">全部</option>
                <option value="reschedule">改约</option>
                <option value="complaint">投诉</option>
                <option value="second_visit">二次上门</option>
                <option value="missing_parts">缺件</option>
                <option value="charge_dispute">收费争议</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-gray-400">加载中...</div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center text-gray-400">暂无工单</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>订单号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>处理人</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell>{t.order_no}</TableCell>
                    <TableCell>{t.consumer_name}</TableCell>
                    <TableCell>
                      <Badge variant={TYPE_BADGE_VARIANT[t.type]}>{TYPE_LABELS[t.type]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[t.status]}>{STATUS_LABELS[t.status]}</Badge>
                    </TableCell>
                    <TableCell>{t.handler_name || "-"}</TableCell>
                    <TableCell className="text-gray-500">{new Date(t.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Link to={`/service-tickets/${t.id}`} className="text-blue-600 hover:underline text-sm">
                        详情
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                共 {pagination.total} 条，第 {pagination.page}/{pagination.totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="新建工单">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">关联订单</label>
            <Select value={form.order_id} onChange={(e) => setForm((prev) => ({ ...prev, order_id: e.target.value }))}>
              <option value="">请选择订单</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_no} - {o.consumer_name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">工单类型</label>
            <Select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}>
              <option value="reschedule">改约</option>
              <option value="complaint">投诉</option>
              <option value="second_visit">二次上门</option>
              <option value="missing_parts">缺件</option>
              <option value="charge_dispute">收费争议</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">问题描述</label>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="请输入问题描述"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={submitting || !form.order_id || !form.description}>
              {submitting ? "提交中..." : "提交"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
