import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { api } from "@/lib/api"

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
  order_id: number
  technician_id: number
  latitude: number | null
  longitude: number | null
  unboxing_photos: string[]
  install_steps: InstallStep[]
  auxiliary_charges: AuxiliaryCharge[]
  user_signature: string
  exception_notes: string
  status: "in_progress" | "completed"
  created_at: string
  order_no: string
  consumer_name: string
  technician_name: string
}

interface Order {
  id: number
  order_no: string
  consumer_name: string
}

interface Technician {
  id: number
  name: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

const statusMap: Record<string, { label: string; variant: "warning" | "success" }> = {
  in_progress: { label: "进行中", variant: "warning" },
  completed: { label: "已完成", variant: "success" },
}

function calcAuxTotal(charges: AuxiliaryCharge[]) {
  return charges.reduce((sum, c) => sum + c.quantity * c.unit_price, 0)
}

export default function OnSiteRecords() {
  const [urlParams] = useSearchParams()
  const [records, setRecords] = useState<OnSiteRecord[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState(urlParams.get("status") || "")
  const [orderIdFilter, setOrderIdFilter] = useState(urlParams.get("order_id") || "")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [form, setForm] = useState({
    order_id: "",
    technician_id: "",
    latitude: "",
    longitude: "",
    exception_notes: "",
  })
  const [submitting, setSubmitting] = useState(false)

  function buildQuery(page: number) {
    const params = new URLSearchParams({ page: String(page), pageSize: "20" })
    if (statusFilter) params.set("status", statusFilter)
    if (orderIdFilter) params.set("order_id", orderIdFilter)
    return `/on-site-records?${params.toString()}`
  }

  function loadRecords(page = 1) {
    setLoading(true)
    api.get<{ data: OnSiteRecord[]; pagination: Pagination }>(buildQuery(page))
      .then((res) => {
        setRecords(res.data || [])
        setPagination(res.pagination || { page, pageSize: 20, total: 0, totalPages: 0 })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRecords()
  }, [statusFilter])

  function handleSearch() {
    loadRecords(1)
  }

  function openCreateDialog() {
    Promise.all([
      api.get<{ data: Order[] }>("/orders?status=installing&pageSize=50"),
      api.get<{ data: Technician[] }>("/technicians?status=busy"),
    ])
      .then(([ordersRes, techRes]) => {
        setOrders(ordersRes.data || [])
        setTechnicians(techRes.data || [])
      })
      .catch(console.error)
    setForm({ order_id: "", technician_id: "", latitude: "", longitude: "", exception_notes: "" })
    setDialogOpen(true)
  }

  async function handleCreate() {
    if (!form.order_id || !form.technician_id) return
    setSubmitting(true)
    try {
      await api.post("/on-site-records", {
        order_id: Number(form.order_id),
        technician_id: Number(form.technician_id),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        exception_notes: form.exception_notes,
        status: "in_progress",
      })
      setDialogOpen(false)
      loadRecords(1)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && records.length === 0) {
    return <div className="flex h-full items-center justify-center"><span className="text-gray-400">加载中...</span></div>
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">上门记录</h1>
        <Button onClick={openCreateDialog}>新建记录</Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">状态</span>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-32"
            >
              <option value="">全部</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">订单ID</span>
            <Input
              value={orderIdFilter}
              onChange={(e) => setOrderIdFilter(e.target.value)}
              placeholder="输入订单ID"
              className="w-40"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleSearch}>搜索</Button>
        </div>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>订单号</TableHead>
            <TableHead>客户</TableHead>
            <TableHead>师傅</TableHead>
            <TableHead>定位</TableHead>
            <TableHead>开箱照片</TableHead>
            <TableHead>辅材费用</TableHead>
            <TableHead>签字</TableHead>
            <TableHead>异常</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => {
            const auxTotal = calcAuxTotal(r.auxiliary_charges || [])
            const photoCount = (r.unboxing_photos || []).length
            return (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.order_no}</TableCell>
                <TableCell>{r.consumer_name}</TableCell>
                <TableCell>{r.technician_name}</TableCell>
                <TableCell>
                  {r.latitude != null && r.longitude != null
                    ? `${r.latitude}, ${r.longitude}`
                    : "未记录"}
                </TableCell>
                <TableCell>{photoCount > 0 ? `${photoCount}张` : "无"}</TableCell>
                <TableCell>{auxTotal > 0 ? `¥${auxTotal.toFixed(2)}` : "无"}</TableCell>
                <TableCell>
                  {r.user_signature ? (
                    <Badge variant="success">有</Badge>
                  ) : (
                    <Badge variant="secondary">无</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {r.exception_notes ? (
                    <Badge variant="destructive">有</Badge>
                  ) : (
                    <Badge variant="secondary">无</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusMap[r.status]?.variant || "warning"}>
                    {statusMap[r.status]?.label || r.status}
                  </Badge>
                </TableCell>
                <TableCell>{r.created_at}</TableCell>
                <TableCell>
                  <Link to={`/on-site/${r.id}`} className="text-blue-600 hover:underline text-sm">详情</Link>
                </TableCell>
              </TableRow>
            )
          })}
          {records.length === 0 && (
            <TableRow>
              <TableCell colSpan={12} className="text-center text-gray-400 py-8">暂无记录</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            共 {pagination.total} 条，第 {pagination.page}/{pagination.totalPages} 页
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => loadRecords(pagination.page - 1)}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadRecords(pagination.page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="新建上门记录">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">订单</label>
            <Select
              value={form.order_id}
              onChange={(e) => setForm((f) => ({ ...f, order_id: e.target.value }))}
            >
              <option value="">请选择订单</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>{o.order_no} - {o.consumer_name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">师傅</label>
            <Select
              value={form.technician_id}
              onChange={(e) => setForm((f) => ({ ...f, technician_id: e.target.value }))}
            >
              <option value="">请选择师傅</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">纬度</label>
              <Input
                type="number"
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                placeholder="纬度"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">经度</label>
              <Input
                type="number"
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                placeholder="经度"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">异常说明</label>
            <Textarea
              value={form.exception_notes}
              onChange={(e) => setForm((f) => ({ ...f, exception_notes: e.target.value }))}
              placeholder="请输入异常说明"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting || !form.order_id || !form.technician_id}>
              {submitting ? "提交中..." : "提交"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
