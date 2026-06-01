import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { api } from "@/lib/api"
import { ChevronDown, ChevronRight } from "lucide-react"

interface Dispatch {
  id: number
  order_id: number
  technician_id: number
  service_center_id: number
  dispatch_type: "auto" | "manual"
  status: "assigned" | "accepted" | "rejected" | "completed"
  dispatch_time: string
  accept_time: string | null
  reject_reason: string | null
  created_at: string
  order_no: string
  consumer_name: string
  technician_name: string
  service_center_name: string
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

interface Order {
  id: number
  order_no: string
  consumer_name: string
}

interface Technician {
  id: number
  name: string
  skills?: string[]
  phone?: string
  brand_authorizations?: string[]
  service_area?: string
}

interface ServiceCenter {
  id: number
  name: string
}

interface AutoMatchResult {
  technician: Technician
  score: number
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  assigned: { label: "已派工", variant: "warning" },
  accepted: { label: "已接单", variant: "default" },
  completed: { label: "已完成", variant: "success" },
  rejected: { label: "已拒绝", variant: "destructive" },
}

const dispatchTypeMap: Record<string, { label: string; variant: "default" | "secondary" }> = {
  auto: { label: "自动", variant: "secondary" },
  manual: { label: "手动", variant: "default" },
}

const statusSteps: { key: string; label: string }[] = [
  { key: "assigned", label: "派工" },
  { key: "accepted", label: "接单" },
  { key: "completed", label: "完成" },
]

function getStepIndex(status: string): number {
  if (status === "assigned") return 0
  if (status === "accepted") return 1
  if (status === "completed") return 2
  return -1
}

function getScoreBreakdown(score: number): { label: string; points: number }[] {
  const items: { label: string; points: number }[] = []
  if (score >= 10) items.push({ label: "技能匹配", points: 10 })
  if (score >= 15) items.push({ label: "品牌授权", points: 5 })
  if (score >= 18) items.push({ label: "网点匹配", points: 3 })
  return items
}

export default function Dispatches() {
  const [urlParams] = useSearchParams()
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState(urlParams.get("status") || "")
  const [dispatchTypeFilter, setDispatchTypeFilter] = useState(urlParams.get("dispatch_type") || "")
  const [orderIdFilter, setOrderIdFilter] = useState(urlParams.get("order_id") || "")

  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [autoDialogOpen, setAutoDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [adjustingId, setAdjustingId] = useState<number | null>(null)
  const [adjustTechnicianId, setAdjustTechnicianId] = useState("")
  const [adjusting, setAdjusting] = useState(false)

  const [expandedId, setExpandedId] = useState<number | null>(null)

  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [serviceCenters, setServiceCenters] = useState<ServiceCenter[]>([])

  const [manualForm, setManualForm] = useState({ order_id: "", technician_id: "", service_center_id: "" })
  const [autoForm, setAutoForm] = useState({ order_id: "" })
  const [matchResult, setMatchResult] = useState<AutoMatchResult | null>(null)
  const [matching, setMatching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadDispatches = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(pagination.page))
      params.set("pageSize", String(pagination.pageSize))
      if (statusFilter) params.set("status", statusFilter)
      if (dispatchTypeFilter) params.set("dispatch_type", dispatchTypeFilter)
      if (orderIdFilter) params.set("order_id", orderIdFilter)
      const res = await api.get<{ data: Dispatch[]; pagination: Pagination }>(`/dispatches?${params.toString()}`)
      setDispatches(res.data || [])
      setPagination(res.pagination || pagination)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.pageSize, statusFilter, dispatchTypeFilter, orderIdFilter])

  useEffect(() => {
    loadDispatches()
  }, [loadDispatches])

  const loadDropdownData = useCallback(async () => {
    try {
      const [ordersRes, techRes, scRes] = await Promise.all([
        api.get<{ data: Order[] }>("/orders?status=pending&pageSize=50"),
        api.get<Technician[]>("/technicians?status=available"),
        api.get<ServiceCenter[]>("/service-centers"),
      ])
      setPendingOrders(ordersRes.data || [])
      setTechnicians(techRes as unknown as Technician[] || [])
      setServiceCenters(scRes as unknown as ServiceCenter[] || [])
    } catch (e) {
      console.error(e)
    }
  }, [])

  const openManualDialog = () => {
    loadDropdownData()
    setManualForm({ order_id: "", technician_id: "", service_center_id: "" })
    setManualDialogOpen(true)
  }

  const openAutoDialog = () => {
    loadDropdownData()
    setAutoForm({ order_id: "" })
    setMatchResult(null)
    setAutoDialogOpen(true)
  }

  const handleManualSubmit = async () => {
    if (!manualForm.order_id || !manualForm.technician_id || !manualForm.service_center_id) return
    setSubmitting(true)
    try {
      await api.post("/dispatches", {
        order_id: Number(manualForm.order_id),
        technician_id: Number(manualForm.technician_id),
        service_center_id: Number(manualForm.service_center_id),
        dispatch_type: "manual",
      })
      setManualDialogOpen(false)
      loadDispatches()
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAutoMatch = async () => {
    if (!autoForm.order_id) return
    setMatching(true)
    setMatchResult(null)
    try {
      const res = await api.post<AutoMatchResult>("/dispatches/auto-match", { order_id: Number(autoForm.order_id) })
      setMatchResult(res)
    } catch (e) {
      console.error(e)
    } finally {
      setMatching(false)
    }
  }

  const handleAutoConfirm = async () => {
    if (!autoForm.order_id || !matchResult) return
    setSubmitting(true)
    try {
      await api.post("/dispatches", {
        order_id: Number(autoForm.order_id),
        technician_id: matchResult.technician.id,
        service_center_id: 0,
        dispatch_type: "auto",
      })
      setAutoDialogOpen(false)
      loadDispatches()
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAction = async (id: number, status: "accepted" | "completed") => {
    try {
      await api.put(`/dispatches/${id}`, { status })
      loadDispatches()
    } catch (e) {
      console.error(e)
    }
  }

  const openRejectDialog = (id: number) => {
    setRejectingId(id)
    setRejectReason("")
    setRejectDialogOpen(true)
  }

  const handleRejectSubmit = async () => {
    if (rejectingId === null || !rejectReason.trim()) return
    try {
      await api.put(`/dispatches/${rejectingId}`, { status: "rejected", reject_reason: rejectReason.trim() })
      setRejectDialogOpen(false)
      setRejectingId(null)
      setRejectReason("")
      loadDispatches()
    } catch (e) {
      console.error(e)
    }
  }

  const openAdjustDialog = (id: number) => {
    loadDropdownData()
    setAdjustingId(id)
    setAdjustTechnicianId("")
    setAdjustDialogOpen(true)
  }

  const handleAdjustSubmit = async () => {
    if (adjustingId === null || !adjustTechnicianId) return
    setAdjusting(true)
    try {
      await api.put(`/dispatches/${adjustingId}`, { technician_id: Number(adjustTechnicianId) })
      setAdjustDialogOpen(false)
      setAdjustingId(null)
      setAdjustTechnicianId("")
      loadDispatches()
    } catch (e) {
      console.error(e)
    } finally {
      setAdjusting(false)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const formatTime = (t: string | null | undefined) => {
    if (!t) return "-"
    return new Date(t).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
  }

  const formatFullTime = (t: string | null | undefined) => {
    if (!t) return "-"
    return new Date(t).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const renderTimeline = (d: Dispatch) => {
    const currentStep = getStepIndex(d.status)
    const isRejected = d.status === "rejected"

    return (
      <div className="flex items-center gap-1 text-xs">
        {statusSteps.map((step, idx) => {
          const reached = !isRejected && currentStep >= idx
          const isCurrent = !isRejected && currentStep === idx
          return (
            <span key={step.key} className="flex items-center gap-1">
              {idx > 0 && <span className={reached ? "text-green-500" : "text-gray-300"}>→</span>}
              <span
                className={
                  isCurrent
                    ? "font-semibold text-blue-600"
                    : reached
                      ? "text-green-600"
                      : "text-gray-300"
                }
              >
                {step.label}
              </span>
            </span>
          )
        })}
        {isRejected && (
          <>
            <span className="text-red-400">→</span>
            <span className="font-semibold text-red-600">拒绝</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">派工管理</h1>
        <div className="flex gap-2">
          <Button onClick={openManualDialog}>手动派工</Button>
          <Button variant="outline" onClick={openAutoDialog}>智能派工</Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex gap-4">
            <div className="w-40">
              <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}>
                <option value="">全部状态</option>
                <option value="assigned">已派工</option>
                <option value="accepted">已接单</option>
                <option value="rejected">已拒绝</option>
                <option value="completed">已完成</option>
              </Select>
            </div>
            <div className="w-40">
              <Select value={dispatchTypeFilter} onChange={(e) => { setDispatchTypeFilter(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}>
                <option value="">全部方式</option>
                <option value="auto">自动</option>
                <option value="manual">手动</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><span className="text-gray-400">加载中...</span></div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>派工ID</TableHead>
                    <TableHead>订单号</TableHead>
                    <TableHead>客户姓名</TableHead>
                    <TableHead>师傅</TableHead>
                    <TableHead>服务网点</TableHead>
                    <TableHead>派工方式</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>派工时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-gray-400 py-8">暂无数据</TableCell>
                    </TableRow>
                  ) : (
                    dispatches.map((d) => (
                      <>
                        <TableRow key={d.id}>
                          <TableCell>
                            <button
                              onClick={() => toggleExpand(d.id)}
                              className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100"
                            >
                              {expandedId === d.id ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="font-medium">{d.id}</TableCell>
                          <TableCell>{d.order_no}</TableCell>
                          <TableCell>{d.consumer_name}</TableCell>
                          <TableCell>{d.technician_name}</TableCell>
                          <TableCell>{d.service_center_name}</TableCell>
                          <TableCell>
                            <Badge variant={dispatchTypeMap[d.dispatch_type]?.variant || "default"}>
                              {dispatchTypeMap[d.dispatch_type]?.label || d.dispatch_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusMap[d.status]?.variant || "default"}>
                              {statusMap[d.status]?.label || d.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatTime(d.dispatch_time)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {d.status === "assigned" && (
                                <>
                                  <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => handleAction(d.id, "accepted")}>接单</Button>
                                  <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => openRejectDialog(d.id)}>拒绝</Button>
                                </>
                              )}
                              {d.status === "accepted" && (
                                <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => handleAction(d.id, "completed")}>完成</Button>
                              )}
                              {(d.status === "assigned" || d.status === "rejected") && (
                                <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50" onClick={() => openAdjustDialog(d.id)}>调整师傅</Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedId === d.id && (
                          <TableRow key={`${d.id}-detail`}>
                            <TableCell colSpan={10} className="bg-gray-50 px-8 py-4">
                              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                                <div>
                                  <span className="text-gray-500">派工方式详情：</span>
                                  <span className="text-gray-900">{d.dispatch_type === "auto" ? "自动匹配" : "手动指定"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">派工时间：</span>
                                  <span className="text-gray-900">{formatFullTime(d.dispatch_time)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">接单时间：</span>
                                  <span className="text-gray-900">{formatFullTime(d.accept_time)}</span>
                                </div>
                                {d.status === "rejected" && d.reject_reason && (
                                  <div>
                                    <span className="text-gray-500">拒绝原因：</span>
                                    <span className="text-red-600 font-medium">{d.reject_reason}</span>
                                  </div>
                                )}
                                <div className="col-span-2">
                                  <span className="text-gray-500 mr-2">状态时间线：</span>
                                  {renderTimeline(d)}
                                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                    <span>派工: {formatFullTime(d.dispatch_time)}</span>
                                    {d.accept_time && <span>接单: {formatFullTime(d.accept_time)}</span>}
                                    {d.status === "completed" && d.accept_time && <span>完成: {formatFullTime(d.created_at)}</span>}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-500">共 {pagination.total} 条</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>上一页</Button>
                    <span className="flex items-center px-3 text-sm text-gray-600">{pagination.page} / {pagination.totalPages}</span>
                    <Button size="sm" variant="outline" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>下一页</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={manualDialogOpen} onClose={() => setManualDialogOpen(false)} title="手动派工">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择订单</label>
            <Select value={manualForm.order_id} onChange={(e) => setManualForm((f) => ({ ...f, order_id: e.target.value }))}>
              <option value="">请选择待派工订单</option>
              {pendingOrders.map((o) => (
                <option key={o.id} value={o.id}>{o.order_no} - {o.consumer_name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择师傅</label>
            <Select value={manualForm.technician_id} onChange={(e) => setManualForm((f) => ({ ...f, technician_id: e.target.value }))}>
              <option value="">请选择可用师傅</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}{t.phone ? ` (${t.phone})` : ""}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">服务网点</label>
            <Select value={manualForm.service_center_id} onChange={(e) => setManualForm((f) => ({ ...f, service_center_id: e.target.value }))}>
              <option value="">请选择服务网点</option>
              {serviceCenters.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setManualDialogOpen(false)}>取消</Button>
            <Button onClick={handleManualSubmit} disabled={submitting || !manualForm.order_id || !manualForm.technician_id || !manualForm.service_center_id}>
              {submitting ? "提交中..." : "确认派工"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={autoDialogOpen} onClose={() => setAutoDialogOpen(false)} title="智能派工">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择订单</label>
            <Select value={autoForm.order_id} onChange={(e) => { setAutoForm({ order_id: e.target.value }); setMatchResult(null) }}>
              <option value="">请选择待派工订单</option>
              {pendingOrders.map((o) => (
                <option key={o.id} value={o.id}>{o.order_no} - {o.consumer_name}</option>
              ))}
            </Select>
          </div>
          <Button variant="outline" onClick={handleAutoMatch} disabled={matching || !autoForm.order_id} className="w-full">
            {matching ? "匹配中..." : "匹配师傅"}
          </Button>

          {matchResult && (
            <div className="rounded-md border border-green-200 bg-green-50 p-4 space-y-3">
              <div className="text-sm font-medium text-green-800">匹配结果</div>
              <div className="text-sm text-gray-700">师傅：{matchResult.technician.name}</div>
              <div className="text-sm text-gray-700">
                匹配度：<span className="font-semibold text-green-700">{matchResult.score}%</span>
              </div>
              {getScoreBreakdown(matchResult.score).length > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="text-gray-500">评分明细：</span>
                  {getScoreBreakdown(matchResult.score).map((item, idx) => (
                    <span key={idx}>
                      {idx > 0 && "，"}
                      <span className="text-green-700 font-medium">{item.label} +{item.points}</span>
                    </span>
                  ))}
                </div>
              )}
              {matchResult.technician.skills && matchResult.technician.skills.length > 0 && (
                <div className="text-sm text-gray-700">
                  <span className="text-gray-500">技能：</span>
                  <span>{matchResult.technician.skills.join("、")}</span>
                </div>
              )}
              {matchResult.technician.brand_authorizations && matchResult.technician.brand_authorizations.length > 0 && (
                <div className="text-sm text-gray-700">
                  <span className="text-gray-500">品牌授权：</span>
                  <span>{matchResult.technician.brand_authorizations.join("、")}</span>
                </div>
              )}
              {matchResult.technician.service_area && (
                <div className="text-sm text-gray-700">
                  <span className="text-gray-500">服务区域：</span>
                  <span>{matchResult.technician.service_area}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAutoDialogOpen(false)}>取消</Button>
            <Button onClick={handleAutoConfirm} disabled={submitting || !matchResult}>
              {submitting ? "提交中..." : "确认派工"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} title="拒绝原因">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">请输入拒绝原因</label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="请填写拒绝原因..." rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleRejectSubmit} disabled={!rejectReason.trim()}>确认拒绝</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={adjustDialogOpen} onClose={() => setAdjustDialogOpen(false)} title="调整师傅">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择新师傅</label>
            <Select value={adjustTechnicianId} onChange={(e) => setAdjustTechnicianId(e.target.value)}>
              <option value="">请选择可用师傅</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.name}{t.phone ? ` (${t.phone})` : ""}</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>取消</Button>
            <Button onClick={handleAdjustSubmit} disabled={adjusting || !adjustTechnicianId}>
              {adjusting ? "提交中..." : "确认调整"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
