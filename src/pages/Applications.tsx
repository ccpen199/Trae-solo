import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, Check, X, Calendar, FileText, ChevronRight, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TablePagination,
} from '@/components/ui/Table'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import { applicationApi, zoneApi, cropApi, gateApi } from '@/services/api'
import type { Application, Zone, Crop, Gate } from '@/types'
import ApplicationDetailPanel from './ApplicationDetailPanel'
import ApplicationModals from './ApplicationModals'

const PRIORITY_CONFIG: Record<number, { label: string; className: string }> = {
  1: { label: '紧急', className: 'bg-red-100 text-red-700' },
  2: { label: '紧急', className: 'bg-red-50 text-red-600' },
  3: { label: '一般', className: 'bg-yellow-100 text-yellow-700' },
  4: { label: '一般', className: 'bg-yellow-50 text-yellow-600' },
  5: { label: '普通', className: 'bg-gray-100 text-gray-600' },
}

const Applications = () => {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [crops, setCrops] = useState<Crop[]>([])
  const [gates, setGates] = useState<Gate[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Application | null>(null)
  const [selectedItem, setSelectedItem] = useState<Application | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  })
  const [rejectReason, setRejectReason] = useState('')
  const [scheduleData, setScheduleData] = useState({
    gate_id: 0,
    scheduled_date: '',
    start_time: '',
    end_time: '',
    planned_flow: 0,
    planned_volume: 0,
    sequence: 1,
    description: '',
  })
  const [formData, setFormData] = useState<Partial<Application>>({
    applicant_name: '',
    applicant_type: 'individual',
    zone_id: 0,
    crop_type_id: 0,
    irrigation_area: 0,
    start_date: '',
    end_date: '',
    estimated_water: 0,
    priority: 5,
    reason: '',
    created_by: '管理员',
  })

  useEffect(() => {
    fetchData()
    fetchZones()
    fetchCrops()
    fetchGates()
  }, [page, keyword, status])

  const fetchZones = async () => {
    try {
      const res = await zoneApi.getList({ pageSize: 100 })
      setZones(res.data.list)
    } catch (err) {
      console.error('获取灌区列表失败:', err)
    }
  }

  const fetchCrops = async () => {
    try {
      const res = await cropApi.getList({ pageSize: 100 })
      setCrops(res.data.list)
    } catch (err) {
      console.error('获取作物列表失败:', err)
    }
  }

  const fetchGates = async () => {
    try {
      const res = await gateApi.getList({ pageSize: 100 })
      setGates(res.data.list)
    } catch (err) {
      console.error('获取闸门列表失败:', err)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await applicationApi.getList({ keyword, status, page, pageSize })
      setApplications(res.data.list)
      setTotal(res.data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await applicationApi.update(editingItem.id, { ...formData, user_name: '管理员' })
      } else {
        await applicationApi.create({ ...formData, user_name: '管理员' })
      }
      setModalOpen(false)
      resetForm()
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      await applicationApi.delete(deleteConfirm.id, '管理员')
      setDeleteConfirm({ open: false, id: null })
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await applicationApi.approve(id, { reviewed_by: '管理员', user_name: '管理员' })
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '审批失败')
    }
  }

  const handleReject = async () => {
    if (!selectedItem) return
    try {
      await applicationApi.reject(selectedItem.id, {
        reviewed_by: '管理员',
        reason: rejectReason,
        user_name: '管理员',
      })
      setRejectModalOpen(false)
      setRejectReason('')
      setSelectedItem(null)
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '驳回失败')
    }
  }

  const handleGenerateSchedule = async () => {
    if (!selectedItem) return
    try {
      await applicationApi.generateSchedule(selectedItem.id, {
        ...scheduleData,
        user_name: '管理员',
      })
      setScheduleModalOpen(false)
      setSelectedItem(null)
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '生成计划失败')
    }
  }

  const handleEdit = (item: Application) => {
    setEditingItem(item)
    setFormData(item)
    setModalOpen(true)
  }

  const openScheduleModal = (item: Application) => {
    setSelectedItem(item)
    setScheduleData({
      gate_id: 0,
      scheduled_date: item.start_date,
      start_time: '08:00',
      end_time: '12:00',
      planned_flow: 10,
      planned_volume: item.estimated_water,
      sequence: 1,
      description: '',
    })
    setScheduleModalOpen(true)
  }

  const resetForm = () => {
    setEditingItem(null)
    setFormData({
      applicant_name: '',
      applicant_type: 'individual',
      zone_id: 0,
      crop_type_id: 0,
      irrigation_area: 0,
      start_date: '',
      end_date: '',
      estimated_water: 0,
      priority: 5,
      reason: '',
      created_by: '管理员',
    })
  }

  const renderPriorityBadge = (priority: number) => {
    const conf = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG[5]
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${conf.className}`}>
        {conf.label} ({priority})
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-500" />
              用水申请
            </CardTitle>
            <Button onClick={() => { resetForm(); setModalOpen(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              新增申请
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索申请人或申请事由..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>申请人</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>灌区</TableHead>
                    <TableHead>作物</TableHead>
                    <TableHead>面积(亩)</TableHead>
                    <TableHead>时间窗口</TableHead>
                    <TableHead>预估水量(m³)</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    const isExpanded = expandedIds.has(app.id)
                    return (
                      <>
                        <TableRow
                          key={app.id}
                          className={`cursor-pointer ${isExpanded ? 'bg-blue-50/50' : ''}`}
                          onClick={() => toggleExpand(app.id)}
                        >
                          <TableCell className="w-10">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{app.applicant_name}</TableCell>
                          <TableCell><StatusBadge status={app.applicant_type} /></TableCell>
                          <TableCell>{app.zone_name || '-'}</TableCell>
                          <TableCell>{app.crop_name || '-'}</TableCell>
                          <TableCell>{app.irrigation_area}</TableCell>
                          <TableCell>
                            <div className="flex items-center whitespace-nowrap">
                              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                              {app.start_date} ~ {app.end_date}
                            </div>
                          </TableCell>
                          <TableCell>{app.estimated_water}</TableCell>
                          <TableCell>{renderPriorityBadge(app.priority)}</TableCell>
                          <TableCell><StatusBadge status={app.status} /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {app.status === 'pending' && (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => handleApprove(app.id)} title="审批通过">
                                    <Check className="h-4 w-4 text-green-500" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(app); setRejectModalOpen(true) }} title="审批驳回">
                                    <X className="h-4 w-4 text-red-500" />
                                  </Button>
                                </>
                              )}
                              {app.status === 'approved' && (
                                <Button variant="ghost" size="sm" onClick={() => openScheduleModal(app)} title="生成计划">
                                  <Calendar className="h-4 w-4 text-blue-500" />
                                </Button>
                              )}
                              {app.status === 'pending' && (
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(app)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ open: true, id: app.id })}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${app.id}-detail`}>
                            <TableCell colSpan={11} className="p-0 border-t-0">
                              <ApplicationDetailPanel app={app} />
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}
                  {applications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <ApplicationModals
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        zones={zones}
        crops={crops}
        gates={gates}
        rejectModalOpen={rejectModalOpen}
        setRejectModalOpen={setRejectModalOpen}
        selectedItem={selectedItem}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        handleReject={handleReject}
        scheduleModalOpen={scheduleModalOpen}
        setScheduleModalOpen={setScheduleModalOpen}
        scheduleData={scheduleData}
        setScheduleData={setScheduleData}
        handleGenerateSchedule={handleGenerateSchedule}
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        handleDelete={handleDelete}
      />
    </div>
  )
}

export default Applications
