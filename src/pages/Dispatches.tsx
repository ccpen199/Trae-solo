import { useState, useEffect, useCallback } from 'react'
import { Plus, Eye, Edit3, Play, Trash2, FileText, RefreshCw, Droplets, AlertTriangle } from 'lucide-react'
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
import Modal from '@/components/ui/Modal'
import { dispatchApi, pumpApi, recordApi, scheduleApi, applicationApi } from '@/services/api'
import type { Dispatch, DispatchItem, DispatchAdjustment, Pump, Schedule, Application } from '@/types'

interface IrrigationItem {
  id: number
  planned_volume: number
  actual_volume: number
  status: string
}

const ADJ_LABELS: Record<string, string> = {
  water_source: '水源',
  water_level: '水位',
  pump_capacity: '水泵流量',
  total_planned_volume: '总水量',
}

function parseAdjJson(jsonStr: string): { label: string; value: string }[] {
  try {
    const obj = JSON.parse(jsonStr)
    return Object.entries(obj).map(([key, val]) => ({
      label: ADJ_LABELS[key] || key,
      value: String(val),
    }))
  } catch {
    return [{ label: '原始值', value: jsonStr }]
  }
}

const Dispatches = () => {
  const [loading, setLoading] = useState(true)
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [pumps, setPumps] = useState<Pump[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [status, setStatus] = useState('')
  const [planDate, setPlanDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  })
  const [generateData, setGenerateData] = useState({
    plan_date: new Date().toISOString().split('T')[0],
    water_source: '水库',
    water_level: 100,
    pump_capacity: 50,
    rotation_rule: '轮灌',
  })
  const [adjustData, setAdjustData] = useState({
    water_source: '',
    water_level: 0,
    pump_capacity: 0,
    rotation_rule: '',
    total_planned_volume: 0,
    adjust_reason: '',
    status: '',
  })

  const [applicationWater, setApplicationWater] = useState<number>(0)
  const [irrigationRecords, setIrrigationRecords] = useState<Record<string, IrrigationItem[]>>({})
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetchData()
    fetchPumps()
  }, [page, status, planDate])

  const fetchPumps = async () => {
    try {
      const res = await pumpApi.getList({ pageSize: 100 })
      setPumps(res.data.list)
    } catch (err) {
      console.error('获取泵站列表失败:', err)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = { page, pageSize }
      if (status) params.status = status
      if (planDate) params.plan_date = planDate
      const res = await dispatchApi.getList(params)
      setDispatches(res.data.list)
      setTotal(res.data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchDetail = useCallback(async (id: number) => {
    try {
      setDetailLoading(true)
      const res = await dispatchApi.getDetail(id)
      const dispatch = res.data
      setSelectedDispatch(dispatch)

      const scheduleIds = (dispatch.items || [])
        .map((item: DispatchItem) => item.schedule_id)
        .filter((id): id is number => id != null)

      let appWater = 0
      if (scheduleIds.length > 0) {
        try {
          const scheduleResults = await Promise.all(
            scheduleIds.map(sid => scheduleApi.getDetail(sid).catch(() => null))
          )
          const appIds = scheduleResults
            .map(r => r?.data?.application_id)
            .filter((id): id is number => id != null)
          const uniqueAppIds = [...new Set(appIds)]

          if (uniqueAppIds.length > 0) {
            const appResults = await Promise.all(
              uniqueAppIds.map(aid => applicationApi.getDetail(aid).catch(() => null))
            )
            appWater = appResults.reduce((sum, r) => sum + (r?.data?.estimated_water || 0), 0)
          }
        } catch (err) {
          console.error('获取申请水量失败:', err)
        }
      }
      setApplicationWater(appWater)

      const recordsMap: Record<string, IrrigationItem[]> = {}
      if (dispatch.status === 'executing' || dispatch.status === 'completed') {
        const items = dispatch.items || []
        const recordResults = await Promise.all(
          items.map(async (item: DispatchItem) => {
            try {
              const r = await recordApi.getList({ dispatch_item_id: item.id, pageSize: 100 })
              return { itemId: item.id, records: r.data.list }
            } catch {
              return { itemId: item.id, records: [] }
            }
          })
        )
        recordResults.forEach(({ itemId, records }) => {
          recordsMap[itemId] = records
        })
      }
      setIrrigationRecords(recordsMap)
      setDetailModalOpen(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : '获取详情失败')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleGenerate = async () => {
    try {
      await dispatchApi.generateFromSchedules({
        ...generateData,
        generated_by: '管理员',
        user_name: '管理员',
      })
      setGenerateModalOpen(false)
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '生成失败')
    }
  }

  const handleAdjust = async () => {
    if (!selectedDispatch) return
    try {
      await dispatchApi.adjust(selectedDispatch.id, {
        ...adjustData,
        adjusted_by: '管理员',
        user_name: '管理员',
      })
      setAdjustModalOpen(false)
      fetchData()
      fetchDetail(selectedDispatch.id)
    } catch (err) {
      alert(err instanceof Error ? err.message : '调整失败')
    }
  }

  const handleExecute = async (id: number) => {
    try {
      await dispatchApi.update(id, { status: 'executing', user_name: '管理员' })
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '执行失败')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      await dispatchApi.delete(deleteConfirm.id, '管理员')
      setDeleteConfirm({ open: false, id: null })
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  const openAdjustModal = (item: Dispatch) => {
    setSelectedDispatch(item)
    setAdjustData({
      water_source: item.water_source,
      water_level: item.water_level,
      pump_capacity: item.pump_capacity,
      rotation_rule: item.rotation_rule,
      total_planned_volume: item.total_planned_volume,
      adjust_reason: '',
      status: item.status,
    })
    setAdjustModalOpen(true)
  }

  const dispatchWater = (selectedDispatch?.items || []).reduce(
    (sum, item) => sum + item.volume,
    0
  )
  const waterDiff = applicationWater - dispatchWater

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-orange-500" />
              执行调度
            </CardTitle>
            <Button onClick={() => setGenerateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              生成调度计划
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-xs">
              <input
                type="date"
                value={planDate}
                onChange={(e) => setPlanDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="executing">执行中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
            <Button variant="secondary" onClick={() => { setPlanDate(''); setStatus('') }}>
              重置
            </Button>
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
                    <TableHead>计划日期</TableHead>
                    <TableHead>水源</TableHead>
                    <TableHead>水位 (m)</TableHead>
                    <TableHead>总计划水量 (m³)</TableHead>
                    <TableHead>明细数</TableHead>
                    <TableHead>轮灌规则</TableHead>
                    <TableHead>创建人</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dispatches.map((dispatch) => (
                    <TableRow key={dispatch.id}>
                      <TableCell className="font-medium">{dispatch.plan_date}</TableCell>
                      <TableCell>{dispatch.water_source}</TableCell>
                      <TableCell>{dispatch.water_level}</TableCell>
                      <TableCell>{dispatch.total_planned_volume}</TableCell>
                      <TableCell>
                        {dispatch.item_count != null && dispatch.item_count > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {dispatch.item_count}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            无明细
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{dispatch.rotation_rule}</TableCell>
                      <TableCell>{dispatch.generated_by}</TableCell>
                      <TableCell>
                        <StatusBadge status={dispatch.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchDetail(dispatch.id)}
                            title="查看详情"
                          >
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Button>
                          {(dispatch.status === 'draft' || dispatch.status === 'published') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openAdjustModal(dispatch)}
                              title="调整计划"
                            >
                              <Edit3 className="h-4 w-4 text-yellow-500" />
                            </Button>
                          )}
                          {dispatch.status === 'published' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExecute(dispatch.id)}
                              title="开始执行"
                            >
                              <Play className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm({ open: true, id: dispatch.id })}
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {dispatches.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                page={page}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="生成调度计划"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setGenerateModalOpen(false)}>取消</Button>
            <Button onClick={handleGenerate}>生成计划</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">计划日期 *</label>
              <input
                type="date"
                value={generateData.plan_date}
                onChange={(e) => setGenerateData({ ...generateData, plan_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">水源 *</label>
              <select
                value={generateData.water_source}
                onChange={(e) => setGenerateData({ ...generateData, water_source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="水库">水库</option>
                <option value="河流">河流</option>
                <option value="地下水">地下水</option>
                <option value="引水渠">引水渠</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">水位 (m) *</label>
              <input
                type="number"
                value={generateData.water_level}
                onChange={(e) => setGenerateData({ ...generateData, water_level: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">水泵流量 (m³/h) *</label>
              <select
                value={generateData.pump_capacity}
                onChange={(e) => setGenerateData({ ...generateData, pump_capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {pumps.map((p) => (
                  <option key={p.id} value={p.flow_rate}>{p.name} - {p.flow_rate} m³/h</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">轮灌规则</label>
            <input
              type="text"
              value={generateData.rotation_rule}
              onChange={(e) => setGenerateData({ ...generateData, rotation_rule: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="如：轮灌、续灌"
            />
          </div>
          <div className="bg-blue-50 p-4 rounded-md">
            <p className="text-sm text-blue-700">
              系统将自动根据计划日期的用水计划生成本调度计划。
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="调整调度计划"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustModalOpen(false)}>取消</Button>
            <Button variant="warning" onClick={handleAdjust}>
              <RefreshCw className="h-4 w-4 mr-2" />
              确认调整
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">水源</label>
              <select
                value={adjustData.water_source}
                onChange={(e) => setAdjustData({ ...adjustData, water_source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="水库">水库</option>
                <option value="河流">河流</option>
                <option value="地下水">地下水</option>
                <option value="引水渠">引水渠</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">水位 (m)</label>
              <input
                type="number"
                value={adjustData.water_level}
                onChange={(e) => setAdjustData({ ...adjustData, water_level: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">水泵流量 (m³/h)</label>
              <input
                type="number"
                value={adjustData.pump_capacity}
                onChange={(e) => setAdjustData({ ...adjustData, pump_capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">总计划水量 (m³)</label>
              <input
                type="number"
                value={adjustData.total_planned_volume}
                onChange={(e) => setAdjustData({ ...adjustData, total_planned_volume: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">轮灌规则</label>
              <input
                type="text"
                value={adjustData.rotation_rule}
                onChange={(e) => setAdjustData({ ...adjustData, rotation_rule: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                value={adjustData.status}
                onChange={(e) => setAdjustData({ ...adjustData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">调整原因 *</label>
            <textarea
              value={adjustData.adjust_reason}
              onChange={(e) => setAdjustData({ ...adjustData, adjust_reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="请输入调整原因"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`调度计划详情 - ${selectedDispatch?.plan_date}`}
        size="xl"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : selectedDispatch ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-500">水源</p>
                <p className="font-medium">{selectedDispatch.water_source}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-500">水位</p>
                <p className="font-medium">{selectedDispatch.water_level} m</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-500">总水量</p>
                <p className="font-medium">{selectedDispatch.total_planned_volume} m³</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-500">状态</p>
                <StatusBadge status={selectedDispatch.status} />
              </div>
            </div>

            {selectedDispatch.adjust_reason && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                <p className="text-sm font-medium text-yellow-800">调整原因</p>
                <p className="text-sm text-yellow-700">{selectedDispatch.adjust_reason}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Droplets className="h-4 w-4 mr-2 text-blue-500" />
                水量对比
              </h4>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-md text-center">
                  <p className="text-xs text-blue-600 mb-1">申请水量</p>
                  <p className="text-lg font-bold text-blue-800">{applicationWater.toFixed(1)} m³</p>
                </div>
                <div className="bg-green-50 border border-green-200 p-3 rounded-md text-center">
                  <p className="text-xs text-green-600 mb-1">排程水量</p>
                  <p className="text-lg font-bold text-green-800">{dispatchWater.toFixed(1)} m³</p>
                </div>
                <div className={`${waterDiff > 0 ? 'bg-orange-50 border-orange-200' : waterDiff < 0 ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'} border p-3 rounded-md text-center`}>
                  <p className={`text-xs mb-1 ${waterDiff > 0 ? 'text-orange-600' : waterDiff < 0 ? 'text-purple-600' : 'text-gray-600'}`}>
                    差异 (申请 - 排程)
                  </p>
                  <p className={`text-lg font-bold ${waterDiff > 0 ? 'text-orange-800' : waterDiff < 0 ? 'text-purple-800' : 'text-gray-800'}`}>
                    {waterDiff > 0 ? '+' : ''}{waterDiff.toFixed(1)} m³
                  </p>
                </div>
              </div>
              {applicationWater > 0 && (
                <>
                  <div className="relative h-6 rounded-full overflow-hidden bg-gray-200">
                    <div
                      className="absolute left-0 top-0 h-full bg-blue-400 rounded-l-full transition-all"
                      style={{ width: `${Math.min((applicationWater / Math.max(applicationWater, dispatchWater)) * 100, 100)}%` }}
                      title={`申请水量: ${applicationWater.toFixed(1)} m³`}
                    />
                    <div
                      className="absolute left-0 top-0 h-full bg-green-400 rounded-l-full transition-all opacity-60"
                      style={{ width: `${Math.min((dispatchWater / Math.max(applicationWater, dispatchWater)) * 100, 100)}%` }}
                      title={`排程水量: ${dispatchWater.toFixed(1)} m³`}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center text-xs text-gray-500">
                      <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block mr-1" />
                      申请水量
                    </span>
                    <span className="flex items-center text-xs text-gray-500">
                      <span className="w-3 h-3 rounded-sm bg-green-400 opacity-60 inline-block mr-1" />
                      排程水量
                    </span>
                  </div>
                </>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">调度明细</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>顺序</TableHead>
                    <TableHead>灌区</TableHead>
                    <TableHead>闸门</TableHead>
                    <TableHead>泵站</TableHead>
                    <TableHead>时间段</TableHead>
                    <TableHead>流量 (m³/h)</TableHead>
                    <TableHead>水量 (m³)</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDispatch.items?.map((item: DispatchItem) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.sequence}</TableCell>
                      <TableCell>{item.zone_name || '-'}</TableCell>
                      <TableCell>{item.gate_name || '-'}</TableCell>
                      <TableCell>{item.pump_station_name || '-'}</TableCell>
                      <TableCell>
                        {item.start_time.split(' ')[1] || item.start_time} - {item.end_time.split(' ')[1] || item.end_time}
                      </TableCell>
                      <TableCell>{item.flow_rate}</TableCell>
                      <TableCell>{item.volume}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!selectedDispatch.items || selectedDispatch.items.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                        暂无明细
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {(selectedDispatch.status === 'executing' || selectedDispatch.status === 'completed') && (selectedDispatch.items || []).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Droplets className="h-4 w-4 mr-2 text-cyan-500" />
                  灌溉执行记录
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>灌区</TableHead>
                      <TableHead>闸门</TableHead>
                      <TableHead>计划水量 (m³)</TableHead>
                      <TableHead>实际水量 (m³)</TableHead>
                      <TableHead>损耗 (m³)</TableHead>
                      <TableHead>完成率</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedDispatch.items || []).map((item: DispatchItem) => {
                      const records = irrigationRecords[item.id] || []
                      const plannedVol = records.reduce((s, r) => s + (r.planned_volume || 0), 0)
                      const actualVol = records.reduce((s, r) => s + (r.actual_volume || 0), 0)
                      const loss = plannedVol - actualVol
                      const completionRate = plannedVol > 0 ? (actualVol / plannedVol) * 100 : 0
                      const hasDeficit = actualVol < plannedVol && plannedVol > 0

                      if (records.length === 0) {
                        return (
                          <TableRow key={item.id}>
                            <TableCell>{item.zone_name || '-'}</TableCell>
                            <TableCell>{item.gate_name || '-'}</TableCell>
                            <TableCell>{item.volume}</TableCell>
                            <TableCell className="text-gray-400">-</TableCell>
                            <TableCell className="text-gray-400">-</TableCell>
                            <TableCell className="text-gray-400">-</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                                无记录
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      }

                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.zone_name || '-'}</TableCell>
                          <TableCell>{item.gate_name || '-'}</TableCell>
                          <TableCell>{plannedVol.toFixed(1)}</TableCell>
                          <TableCell>{actualVol.toFixed(1)}</TableCell>
                          <TableCell className={loss > 0 ? 'text-orange-600' : 'text-green-600'}>
                            {loss.toFixed(1)}
                            {hasDeficit && (
                              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-700">
                                不足
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              completionRate >= 100 ? 'bg-green-100 text-green-800' :
                              completionRate >= 80 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {completionRate.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={records[0].status} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {(() => {
                  const allRecords = Object.values(irrigationRecords).flat()
                  const totalPlanned = allRecords.reduce((s, r) => s + (r.planned_volume || 0), 0)
                  const totalActual = allRecords.reduce((s, r) => s + (r.actual_volume || 0), 0)
                  const totalLoss = totalPlanned - totalActual
                  const totalRate = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0

                  if (allRecords.length === 0) return null

                  return (
                    <div className="mt-3 bg-gray-50 p-3 rounded-md">
                      <p className="text-xs text-gray-500 mb-2 font-medium">汇总统计</p>
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <p className="text-xs text-gray-500">总计划水量</p>
                          <p className="font-medium text-sm">{totalPlanned.toFixed(1)} m³</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">总实际水量</p>
                          <p className="font-medium text-sm">{totalActual.toFixed(1)} m³</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">总损耗</p>
                          <p className={`font-medium text-sm ${totalLoss > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            {totalLoss.toFixed(1)} m³
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">总完成率</p>
                          <p className={`font-medium text-sm ${totalRate >= 100 ? 'text-green-600' : totalRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {totalRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {selectedDispatch.adjustments && selectedDispatch.adjustments.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">调整记录</h4>
                <div className="space-y-3">
                  {selectedDispatch.adjustments.map((adj: DispatchAdjustment) => {
                    const originalFields = parseAdjJson(adj.original_value)
                    const newFields = parseAdjJson(adj.new_value)

                    return (
                      <div key={adj.id} className="border border-gray-200 rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{new Date(adj.created_at).toLocaleString('zh-CN')}</span>
                            <span className="text-gray-400">|</span>
                            <span>调整人: <span className="text-gray-700 font-medium">{adj.adjusted_by || '-'}</span></span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs font-medium text-red-600 mb-2">调整前</p>
                            <div className="space-y-1">
                              {originalFields.map((f, i) => (
                                <div key={i} className="flex items-center justify-between text-sm bg-red-50 px-2 py-1 rounded">
                                  <span className="text-gray-600">{f.label}</span>
                                  <span className="font-medium text-red-800">{f.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-green-600 mb-2">调整后</p>
                            <div className="space-y-1">
                              {newFields.map((f, i) => (
                                <div key={i} className="flex items-center justify-between text-sm bg-green-50 px-2 py-1 rounded">
                                  <span className="text-gray-600">{f.label}</span>
                                  <span className="font-medium text-green-800">{f.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        {adj.adjust_reason && (
                          <div className="bg-yellow-50 border border-yellow-100 px-3 py-2 rounded">
                            <p className="text-xs text-yellow-700">
                              <span className="font-medium">调整原因: </span>{adj.adjust_reason}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        title="确认删除"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm({ open: false, id: null })}>取消</Button>
            <Button variant="danger" onClick={handleDelete}>删除</Button>
          </>
        }
      >
        <p className="text-gray-600">确定要删除该调度计划吗？此操作不可恢复。</p>
      </Modal>
    </div>
  )
}

export default Dispatches
