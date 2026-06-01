import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
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

interface Brand {
  id: number
  name: string
  contact_name: string
  contact_phone: string
}

interface ServiceCenter {
  id: number
  name: string
  address: string
  brand_id: number
  manager_name: string
  manager_phone: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
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

const initialForm = {
  consumer_name: "",
  consumer_phone: "",
  product_model: "",
  purchase_channel: "",
  install_address: "",
  appointment_time: "",
  parts_requirements: "",
  warranty_status: "unknown",
  brand_id: "",
  service_center_id: "",
}

export default function Orders() {
  const navigate = useNavigate()
  const [urlParams] = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState(urlParams.get("status") || "")
  const [brandFilter, setBrandFilter] = useState("")
  const [search, setSearch] = useState(urlParams.get("search") || "")
  const [searchInput, setSearchInput] = useState(urlParams.get("search") || "")

  const [brands, setBrands] = useState<Brand[]>([])
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get<{ data: Brand[] }>("/brands").then((res) => setBrands(res.data || [])).catch(() => {})
    api.get<{ data: ServiceCenter[] }>("/service-centers").then((res) => setServiceCenters(res.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set("page", String(pagination.page))
    params.set("pageSize", String(pagination.pageSize))
    if (statusFilter) params.set("status", statusFilter)
    if (brandFilter) params.set("brand_id", brandFilter)
    if (search) params.set("search", search)

    api.get<{ data: Order[]; pagination: Pagination }>(`/orders?${params.toString()}`)
      .then((res) => {
        setOrders(res.data || [])
        setPagination(res.pagination)
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [statusFilter, brandFilter, search, pagination.page])

  function handleSearch() {
    setSearch(searchInput)
    setPagination((p) => ({ ...p, page: 1 }))
  }

  function handleFilterChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      setter(e.target.value)
      setPagination((p) => ({ ...p, page: 1 }))
    }
  }

  function handleFormChange(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.consumer_name.trim()) return
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = { ...form }
      if (payload.brand_id) payload.brand_id = Number(payload.brand_id)
      else delete payload.brand_id
      if (payload.service_center_id) payload.service_center_id = Number(payload.service_center_id)
      else delete payload.service_center_id
      await api.post("/orders", payload)
      setDialogOpen(false)
      setForm(initialForm)
      setPagination((p) => ({ ...p, page: 1 }))
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredServiceCenters = form.brand_id
    ? serviceCenters.filter((sc) => sc.brand_id === Number(form.brand_id))
    : serviceCenters

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">安装订单</h1>
        <Button onClick={() => setDialogOpen(true)}>新建订单</Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">订单状态</label>
            <Select value={statusFilter} onChange={handleFilterChange(setStatusFilter)} className="w-32">
              <option value="">全部</option>
              <option value="pending">待派工</option>
              <option value="dispatched">已派工</option>
              <option value="installing">安装中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">品牌</label>
            <Select value={brandFilter} onChange={handleFilterChange(setBrandFilter)} className="w-36">
              <option value="">全部</option>
              {brands.map((b) => (
                <option key={b.id} value={String(b.id)}>{b.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <Input
              placeholder="订单号/客户姓名/手机号/商品型号"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-xs"
            />
            <Button variant="outline" size="sm" onClick={handleSearch}>搜索</Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>订单号</TableHead>
              <TableHead>客户姓名</TableHead>
              <TableHead>商品型号</TableHead>
              <TableHead>品牌</TableHead>
              <TableHead>安装地址</TableHead>
              <TableHead>服务网点</TableHead>
              <TableHead>预约时间</TableHead>
              <TableHead>保修状态</TableHead>
              <TableHead>订单状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-gray-400 py-8">加载中...</TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-gray-400 py-8">暂无数据</TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_no}</TableCell>
                  <TableCell>{order.consumer_name}</TableCell>
                  <TableCell>{order.product_model}</TableCell>
                  <TableCell>{order.brand_name}</TableCell>
                  <TableCell>{order.install_address && order.install_address.length > 20 ? order.install_address.slice(0, 20) + "..." : order.install_address || "-"}</TableCell>
                  <TableCell>{order.service_center_name || "-"}</TableCell>
                  <TableCell>{order.appointment_time ? new Date(order.appointment_time).toLocaleString("zh-CN") : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={warrantyMap[order.warranty_status]?.variant || "secondary"}>
                      {warrantyMap[order.warranty_status]?.label || order.warranty_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusMap[order.status]?.variant || "default"}>
                      {statusMap[order.status]?.label || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="link" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>详情</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {pagination.totalPages > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            第 {pagination.page}/{pagination.totalPages} 页 共 {pagination.total} 条
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="新建订单" className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名 <span className="text-red-500">*</span></label>
              <Input value={form.consumer_name} onChange={handleFormChange("consumer_name")} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">客户电话</label>
              <Input value={form.consumer_phone} onChange={handleFormChange("consumer_phone")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">商品型号</label>
              <Input value={form.product_model} onChange={handleFormChange("product_model")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">购买渠道</label>
              <Select value={form.purchase_channel} onChange={handleFormChange("purchase_channel")}>
                <option value="">请选择</option>
                <option value="线上商城">线上商城</option>
                <option value="线下门店">线下门店</option>
                <option value="经销商">经销商</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
              <Select value={form.brand_id} onChange={handleFormChange("brand_id")}>
                <option value="">请选择</option>
                {brands.map((b) => (
                  <option key={b.id} value={String(b.id)}>{b.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">服务中心</label>
              <Select value={form.service_center_id} onChange={handleFormChange("service_center_id")}>
                <option value="">请选择</option>
                {filteredServiceCenters.map((sc) => (
                  <option key={sc.id} value={String(sc.id)}>{sc.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">保修状态</label>
              <Select value={form.warranty_status} onChange={handleFormChange("warranty_status")}>
                <option value="in_warranty">保修内</option>
                <option value="out_of_warranty">保修外</option>
                <option value="unknown">未知</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预约时间</label>
              <Input type="datetime-local" value={form.appointment_time} onChange={handleFormChange("appointment_time")} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">安装地址</label>
            <Input value={form.install_address} onChange={handleFormChange("install_address")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">配件要求</label>
            <Textarea value={form.parts_requirements} onChange={handleFormChange("parts_requirements")} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "提交中..." : "提交"}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
