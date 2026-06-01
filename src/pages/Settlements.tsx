import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { api } from "@/lib/api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const COLORS = ['#eab308', '#3b82f6', '#22c55e']

interface Settlement {
  id: number
  order_id: number
  brand_id: number
  service_center_id: number
  technician_id: number
  service_fee: number
  auxiliary_fee: number
  total_fee: number
  status: 'pending' | 'approved' | 'paid'
  created_at: string
  updated_at: string
  order_no: string
  consumer_name: string
  brand_name: string
  center_name: string
  technician_name: string
}

interface Brand { id: number; name: string }
interface ServiceCenter { id: number; name: string }
interface Technician { id: number; name: string }
interface CompletedOrder { id: number; order_no: string; consumer_name: string }

interface SummaryItem { name: string; count: number; total_fee: number; service_fee: number; auxiliary_fee: number }
interface StatusItem { status: string; label: string; count: number; total_fee: number }
interface Summary {
  byBrand: SummaryItem[]
  byCenter: SummaryItem[]
  byTechnician: SummaryItem[]
  byStatus: StatusItem[]
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

interface OrderDetail {
  id: number
  order_no: string
  consumer_name: string
  product_model: string
  install_address: string
}

const statusConfig: Record<string, { label: string; variant: "warning" | "default" | "success" }> = {
  pending: { label: "待审核", variant: "warning" },
  approved: { label: "已审核", variant: "default" },
  paid: { label: "已支付", variant: "success" },
}

function formatMoney(value: number) {
  return `¥${value.toFixed(2)}`
}

function calcAuxTotal(charges: AuxiliaryCharge[]) {
  return charges.reduce((sum, c) => sum + c.quantity * c.unit_price, 0)
}

export default function Settlements() {
  const [urlParams] = useSearchParams()
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState(urlParams.get("status") || "")
  const [brandFilter, setBrandFilter] = useState("")
  const [centerFilter, setCenterFilter] = useState("")
  const [orderIdFilter, setOrderIdFilter] = useState(urlParams.get("order_id") || "")

  const [brands, setBrands] = useState<Brand[]>([])
  const [centers, setCenters] = useState<ServiceCenter[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formOrderId, setFormOrderId] = useState("")
  const [formBrandId, setFormBrandId] = useState("")
  const [formCenterId, setFormCenterId] = useState("")
  const [formTechnicianId, setFormTechnicianId] = useState("")
  const [formServiceFee, setFormServiceFee] = useState("")
  const [formAuxiliaryFee, setFormAuxiliaryFee] = useState("0")
  const [submitting, setSubmitting] = useState(false)

  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false)
  const [evidenceRecord, setEvidenceRecord] = useState<OnSiteRecord | null>(null)
  const [evidenceLoading, setEvidenceLoading] = useState(false)

  const [expandedRowId, setExpandedRowId] = useState<number | null>(null)
  const [expandedOrderDetail, setExpandedOrderDetail] = useState<OrderDetail | null>(null)
  const [expandedEvidence, setExpandedEvidence] = useState<OnSiteRecord | null>(null)
  const [expandedLoading, setExpandedLoading] = useState(false)

  const fetchSettlements = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set("status", statusFilter)
      if (brandFilter) params.set("brand_id", brandFilter)
      if (centerFilter) params.set("service_center_id", centerFilter)
      if (orderIdFilter) params.set("order_id", orderIdFilter)
      params.set("page", String(pagination.page))
      params.set("pageSize", String(pagination.pageSize))
      const res = await api.get<{ data: Settlement[]; pagination: { page: number; pageSize: number; total: number } }>(`/settlements?${params}`)
      setSettlements(res.data || [])
      setPagination(prev => ({ ...prev, total: res.pagination?.total ?? 0 }))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, brandFilter, centerFilter, orderIdFilter, pagination.page, pagination.pageSize])

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get<Summary>("/settlements/summary")
      setSummary(res)
    } catch (e) {
      console.error(e)
    }
  }, [])

  const fetchOptions = useCallback(async () => {
    try {
      const [brandsRes, centersRes, techniciansRes] = await Promise.all([
        api.get<Brand[]>("/brands"),
        api.get<ServiceCenter[]>("/service-centers"),
        api.get<Technician[]>("/technicians"),
      ])
      setBrands(brandsRes || [])
      setCenters(centersRes || [])
      setTechnicians(techniciansRes || [])
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    fetchSettlements()
  }, [fetchSettlements])

  useEffect(() => {
    fetchSummary()
    fetchOptions()
  }, [fetchSummary, fetchOptions])

  const handleStatusChange = async (id: number, newStatus: 'approved' | 'paid') => {
    try {
      await api.put(`/settlements/${id}`, { status: newStatus })
      fetchSettlements()
      fetchSummary()
    } catch (e) {
      console.error(e)
    }
  }

  const openCreateDialog = async () => {
    try {
      const res = await api.get<{ data: CompletedOrder[] }>("/orders?status=completed&pageSize=50")
      setCompletedOrders(res.data || [])
    } catch (e) {
      console.error(e)
    }
    setFormOrderId("")
    setFormBrandId("")
    setFormCenterId("")
    setFormTechnicianId("")
    setFormServiceFee("")
    setFormAuxiliaryFee("0")
    setDialogOpen(true)
  }

  const handleCreate = async () => {
    if (!formOrderId || !formBrandId || !formCenterId || !formTechnicianId || !formServiceFee) return
    setSubmitting(true)
    try {
      await api.post("/settlements", {
        order_id: Number(formOrderId),
        brand_id: Number(formBrandId),
        service_center_id: Number(formCenterId),
        technician_id: Number(formTechnicianId),
        service_fee: Number(formServiceFee),
        auxiliary_fee: Number(formAuxiliaryFee) || 0,
      })
      setDialogOpen(false)
      fetchSettlements()
      fetchSummary()
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (statusFilter) params.set("status", statusFilter)
    if (brandFilter) params.set("brand_id", brandFilter)
    window.open(`/api/settlements/export?${params}`, "_blank")
  }

  const openEvidenceDialog = async (orderId: number) => {
    setEvidenceDialogOpen(true)
    setEvidenceLoading(true)
    setEvidenceRecord(null)
    try {
      const res = await api.get<{ data: OnSiteRecord[] }>(`/on-site-records?order_id=${orderId}`)
      const records = res.data || []
      setEvidenceRecord(records.length > 0 ? records[0] : null)
    } catch (e) {
      console.error(e)
    } finally {
      setEvidenceLoading(false)
    }
  }

  const handleRowExpand = async (settlement: Settlement) => {
    if (expandedRowId === settlement.id) {
      setExpandedRowId(null)
      setExpandedOrderDetail(null)
      setExpandedEvidence(null)
      return
    }
    setExpandedRowId(settlement.id)
    setExpandedLoading(true)
    setExpandedOrderDetail(null)
    setExpandedEvidence(null)
    try {
      const [orderRes, evidenceRes] = await Promise.all([
        api.get<OrderDetail>(`/orders/${settlement.order_id}`),
        api.get<{ data: OnSiteRecord[] }>(`/on-site-records?order_id=${settlement.order_id}`),
      ])
      setExpandedOrderDetail(orderRes || null)
      const records = evidenceRes.data || []
      setExpandedEvidence(records.length > 0 ? records[0] : null)
    } catch (e) {
      console.error(e)
    } finally {
      setExpandedLoading(false)
    }
  }

  const pendingTotal = summary?.byStatus?.find(s => s.status === 'pending')?.total_fee ?? 0
  const approvedTotal = summary?.byStatus?.find(s => s.status === 'approved')?.total_fee ?? 0
  const paidTotal = summary?.byStatus?.find(s => s.status === 'paid')?.total_fee ?? 0
  const pendingCount = summary?.byStatus?.find(s => s.status === 'pending')?.count ?? 0

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  const pieData = (summary?.byStatus || []).map(s => ({
    name: statusConfig[s.status]?.label || s.status,
    value: s.count,
  }))

  const formTotalFee = (Number(formServiceFee) || 0) + (Number(formAuxiliaryFee) || 0)

  const evidenceAuxTotal = evidenceRecord ? calcAuxTotal(evidenceRecord.auxiliary_charges || []) : 0
  const expandedAuxTotal = expandedEvidence ? calcAuxTotal(expandedEvidence.auxiliary_charges || []) : 0

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">结算管理</h1>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">待结算金额</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatMoney(pendingTotal)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">已审核金额</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatMoney(approvedTotal)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">已支付金额</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatMoney(paidTotal)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">待结算笔数</CardTitle>
            <div className="h-4 w-4 rounded-full bg-orange-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{pendingCount}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">品牌服务费分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.byBrand || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="service_fee" fill="#3b82f6" radius={[4, 4, 0, 0]} name="服务费" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">结算状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">结算明细</CardTitle>
          <div className="flex gap-2">
            <Button onClick={openCreateDialog}>新建结算</Button>
            <Button variant="outline" onClick={handleExport}>导出CSV</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select className="w-32" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })) }}>
              <option value="">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已审核</option>
              <option value="paid">已支付</option>
            </Select>
            <Select className="w-40" value={brandFilter} onChange={e => { setBrandFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })) }}>
              <option value="">全部品牌</option>
              {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </Select>
            <Select className="w-40" value={centerFilter} onChange={e => { setCenterFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })) }}>
              <option value="">全部网点</option>
              {centers.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">加载中...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>订单号</TableHead>
                    <TableHead>品牌</TableHead>
                    <TableHead>网点</TableHead>
                    <TableHead>师傅</TableHead>
                    <TableHead>服务费</TableHead>
                    <TableHead>辅材费</TableHead>
                    <TableHead>总计</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map(s => (
                    <>
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRowExpand(s)}
                      >
                        <TableCell>{s.id}</TableCell>
                        <TableCell>{s.order_no}</TableCell>
                        <TableCell>{s.brand_name}</TableCell>
                        <TableCell>{s.center_name}</TableCell>
                        <TableCell>{s.technician_name}</TableCell>
                        <TableCell>{formatMoney(s.service_fee)}</TableCell>
                        <TableCell>{formatMoney(s.auxiliary_fee)}</TableCell>
                        <TableCell className="font-medium">{formatMoney(s.total_fee)}</TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[s.status]?.variant || "default"}>
                            {statusConfig[s.status]?.label || s.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{s.created_at?.slice(0, 10)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <Button size="sm" variant="outline" onClick={() => openEvidenceDialog(s.order_id)}>查看验收</Button>
                            {s.status === 'pending' && (
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(s.id, 'approved')}>审核通过</Button>
                            )}
                            {s.status === 'approved' && (
                              <Button size="sm" variant="outline" onClick={() => handleStatusChange(s.id, 'paid')}>标记支付</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRowId === s.id && (
                        <TableRow key={`expanded-${s.id}`}>
                          <TableCell colSpan={11} className="bg-gray-50 px-8 py-4">
                            {expandedLoading ? (
                              <div className="text-center text-gray-400 py-4">加载中...</div>
                            ) : (
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">订单详情</h4>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <p>客户姓名：{expandedOrderDetail?.consumer_name || s.consumer_name || '-'}</p>
                                    <p>产品型号：{expandedOrderDetail?.product_model || '-'}</p>
                                    <p>安装地址：{expandedOrderDetail?.install_address || '-'}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">验收证据摘要</h4>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    <p>开箱照片：{expandedEvidence && expandedEvidence.unboxing_photos?.length > 0 ? 'Y' : 'N'}</p>
                                    <p>用户签字：{expandedEvidence?.user_signature ? 'Y' : 'N'}</p>
                                    <p>异常说明：{expandedEvidence?.exception_notes ? 'Y' : 'N'}</p>
                                    <p>辅材合计：{formatMoney(expandedAuxTotal)}</p>
                                  </div>
                                  {s.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      className="mt-3"
                                      onClick={() => handleStatusChange(s.id, 'approved')}
                                    >
                                      复查通过
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                  {settlements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-400">暂无数据</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}>上一页</Button>
                  <span className="text-sm text-gray-500">{pagination.page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={pagination.page >= totalPages} onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}>下一页</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="新建结算">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">订单</label>
            <Select value={formOrderId} onChange={e => setFormOrderId(e.target.value)}>
              <option value="">请选择订单</option>
              {completedOrders.map(o => <option key={o.id} value={String(o.id)}>{o.order_no} - {o.consumer_name}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
            <Select value={formBrandId} onChange={e => setFormBrandId(e.target.value)}>
              <option value="">请选择品牌</option>
              {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">网点</label>
            <Select value={formCenterId} onChange={e => setFormCenterId(e.target.value)}>
              <option value="">请选择网点</option>
              {centers.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">师傅</label>
            <Select value={formTechnicianId} onChange={e => setFormTechnicianId(e.target.value)}>
              <option value="">请选择师傅</option>
              {technicians.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">服务费</label>
            <Input type="number" value={formServiceFee} onChange={e => setFormServiceFee(e.target.value)} placeholder="请输入服务费" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">辅材费</label>
            <Input type="number" value={formAuxiliaryFee} onChange={e => setFormAuxiliaryFee(e.target.value)} placeholder="0" />
          </div>
          <div className="rounded-md bg-gray-50 p-3">
            <span className="text-sm text-gray-500">合计金额：</span>
            <span className="text-lg font-bold">{formatMoney(formTotalFee)}</span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={submitting || !formOrderId || !formBrandId || !formCenterId || !formTechnicianId || !formServiceFee}>
              {submitting ? "提交中..." : "确认创建"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={evidenceDialogOpen} onClose={() => setEvidenceDialogOpen(false)} title="验收证据" className="max-w-2xl">
        {evidenceLoading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : !evidenceRecord ? (
          <div className="text-center py-8 text-gray-400">暂无验收记录</div>
        ) : (
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">开箱照片 - {evidenceRecord.unboxing_photos?.length || 0}张</h4>
              <div className="flex flex-wrap gap-2">
                {(evidenceRecord.unboxing_photos || []).map((photo, i) => (
                  <a key={i} href={photo} target="_blank" rel="noopener noreferrer">
                    <img src={photo} alt={`开箱照片${i + 1}`} className="h-16 w-16 rounded object-cover border" />
                  </a>
                ))}
                {(!evidenceRecord.unboxing_photos || evidenceRecord.unboxing_photos.length === 0) && (
                  <span className="text-sm text-gray-400">无</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">安装步骤 - {evidenceRecord.install_steps?.length || 0}步</h4>
              <div className="space-y-2">
                {(evidenceRecord.install_steps || []).map((step, i) => (
                  <div key={i} className="flex items-center gap-3 rounded border p-2">
                    <span className="text-xs font-medium text-gray-500 shrink-0">步骤{step.step}</span>
                    <span className="text-sm text-gray-700 flex-1">{step.description}</span>
                    {step.photo && (
                      <a href={step.photo} target="_blank" rel="noopener noreferrer">
                        <img src={step.photo} alt={`步骤${step.step}`} className="h-10 w-10 rounded object-cover border" />
                      </a>
                    )}
                  </div>
                ))}
                {(!evidenceRecord.install_steps || evidenceRecord.install_steps.length === 0) && (
                  <span className="text-sm text-gray-400">无</span>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">辅材收费</h4>
              {evidenceRecord.auxiliary_charges && evidenceRecord.auxiliary_charges.length > 0 ? (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-1 pr-4 font-medium">项目</th>
                      <th className="py-1 pr-4 font-medium">数量</th>
                      <th className="py-1 pr-4 font-medium">单价</th>
                      <th className="py-1 font-medium">小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidenceRecord.auxiliary_charges.map((c, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1 pr-4">{c.item}</td>
                        <td className="py-1 pr-4">{c.quantity}</td>
                        <td className="py-1 pr-4">{formatMoney(c.unit_price)}</td>
                        <td className="py-1">{formatMoney(c.quantity * c.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-semibold">
                      <td colSpan={3} className="py-1 text-right">合计</td>
                      <td className="py-1">{formatMoney(evidenceAuxTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <span className="text-sm text-gray-400">无</span>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">用户签字</h4>
              {evidenceRecord.user_signature ? (
                <img src={evidenceRecord.user_signature} alt="用户签字" className="h-24 rounded border" />
              ) : (
                <span className="text-sm text-gray-400">无</span>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">异常说明</h4>
              {evidenceRecord.exception_notes ? (
                <p className="text-sm text-gray-700 bg-yellow-50 rounded p-2">{evidenceRecord.exception_notes}</p>
              ) : (
                <span className="text-sm text-gray-400">无</span>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
