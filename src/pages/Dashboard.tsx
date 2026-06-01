import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Waves,
  Zap,
  GitBranch,
  MapPin,
  FileText,
  AlertTriangle,
  Droplets,
  Clock,
  Sprout,
  Wrench,
  ClipboardList,
  BarChart3,
  Shield,
  Users,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import {
  canalApi,
  pumpApi,
  gateApi,
  zoneApi,
  cropApi,
  quotaApi,
  applicationApi,
  alarmApi,
  scheduleApi,
  recordApi,
  dispatchApi,
  workOrderApi,
  reportApi,
} from '@/services/api'
import type {
  DashboardStats,
  Schedule,
  Record as IrrigationRecord,
  Alarm,
  Dispatch,
  DispatchItem,
  ReportStatistics,
} from '@/types'

type ViewTab = 'admin' | 'duty' | 'farmer' | 'supervisor'
type StatusCounts = { [key: string]: number }

const statCards = [
  { key: 'totalCanals', label: '渠道总数', icon: Waves, color: 'from-blue-500 to-blue-600' },
  { key: 'totalPumps', label: '泵站总数', icon: Zap, color: 'from-yellow-500 to-yellow-600' },
  { key: 'totalGates', label: '闸门总数', icon: GitBranch, color: 'from-green-500 to-green-600' },
  { key: 'totalZones', label: '灌区总数', icon: MapPin, color: 'from-purple-500 to-purple-600' },
  { key: 'totalCrops', label: '作物类型总数', icon: Sprout, color: 'from-emerald-500 to-emerald-600' },
  { key: 'pendingApplications', label: '待处理申请', icon: FileText, color: 'from-orange-500 to-orange-600' },
  { key: 'activeAlarms', label: '活动告警', icon: AlertTriangle, color: 'from-red-500 to-red-600' },
  { key: 'activeWorkOrders', label: '活跃工单数', icon: Wrench, color: 'from-indigo-500 to-indigo-600' },
]

const navCards = [
  { label: '渠道管理', path: '/canals', icon: Waves, gradient: 'from-blue-500 to-cyan-400', countKey: 'totalCanals' as const },
  { label: '泵站管理', path: '/pumps', icon: Zap, gradient: 'from-yellow-500 to-orange-400', countKey: 'totalPumps' as const },
  { label: '闸门管理', path: '/gates', icon: GitBranch, gradient: 'from-green-500 to-emerald-400', countKey: 'totalGates' as const },
  { label: '灌区管理', path: '/zones', icon: MapPin, gradient: 'from-purple-500 to-pink-400', countKey: 'totalZones' as const },
  { label: '作物管理', path: '/crops', icon: Sprout, gradient: 'from-emerald-500 to-teal-400', countKey: 'totalCrops' as const },
  { label: '用水定额', path: '/quotas', icon: Droplets, gradient: 'from-sky-500 to-blue-400', countKey: 'totalQuotas' as const },
]

const viewTabs: { key: ViewTab; label: string; icon: typeof Eye }[] = [
  { key: 'admin', label: '管理视图', icon: ClipboardList },
  { key: 'duty', label: '值班视图', icon: Users },
  { key: 'farmer', label: '农户视图', icon: Sprout },
  { key: 'supervisor', label: '监管视图', icon: Shield },
]

const itemStatusLabel: Record<string, string> = {
  completed: '已完成',
  in_progress: '进行中',
  pending: '待执行',
  executing: '执行中',
  skipped: '已跳过',
  cancelled: '已取消',
}

const itemStatusColor: Record<string, string> = {
  completed: 'bg-green-500',
  in_progress: 'bg-blue-500',
  executing: 'bg-blue-500',
  pending: 'bg-gray-400',
  skipped: 'bg-purple-500',
  cancelled: 'bg-gray-300',
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  )
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ViewTab>('admin')
  const [stats, setStats] = useState<DashboardStats & { totalQuotas: number }>({
    totalCanals: 0,
    totalPumps: 0,
    totalGates: 0,
    totalZones: 0,
    totalCrops: 0,
    pendingApplications: 0,
    activeAlarms: 0,
    activeWorkOrders: 0,
    totalQuotas: 0,
  })
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([])
  const [recentRecords, setRecentRecords] = useState<IrrigationRecord[]>([])
  const [activeAlarms, setActiveAlarms] = useState<Alarm[]>([])
  const [executingDispatches, setExecutingDispatches] = useState<(Dispatch & { items: DispatchItem[] })[]>([])
  const [reportStats, setReportStats] = useState<ReportStatistics | null>(null)
  const [pumpStatusCounts, setPumpStatusCounts] = useState<StatusCounts>({})
  const [gateStatusCounts, setGateStatusCounts] = useState<StatusCounts>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        canalsRes,
        pumpsRes,
        gatesRes,
        zonesRes,
        cropsRes,
        quotasRes,
        applicationsRes,
        alarmsRes,
        schedulesRes,
        recordsRes,
        workOrdersRes,
        dispatchesRes,
      ] = await Promise.all([
        canalApi.getList({ pageSize: 1 }),
        pumpApi.getList({ pageSize: 1 }),
        gateApi.getList({ pageSize: 1 }),
        zoneApi.getList({ pageSize: 1 }),
        cropApi.getList({ pageSize: 1 }),
        quotaApi.getList({ pageSize: 1 }),
        applicationApi.getList({ status: 'pending', pageSize: 1 }),
        alarmApi.getList({ status: 'active', pageSize: 5 }),
        scheduleApi.getList({ scheduled_date: new Date().toISOString().split('T')[0], pageSize: 5 }),
        recordApi.getList({ pageSize: 5 }),
        workOrderApi.getList({ pageSize: 1 }),
        dispatchApi.getList({ status: 'executing', pageSize: 5 }),
      ])

      setStats({
        totalCanals: canalsRes.data.total,
        totalPumps: pumpsRes.data.total,
        totalGates: gatesRes.data.total,
        totalZones: zonesRes.data.total,
        totalCrops: cropsRes.data.total,
        totalQuotas: quotasRes.data.total,
        pendingApplications: applicationsRes.data.total,
        activeAlarms: alarmsRes.data.total,
        activeWorkOrders: workOrdersRes.data.total,
      })
      setTodaySchedules(schedulesRes.data.list)
      setRecentRecords(recordsRes.data.list)
      setActiveAlarms(alarmsRes.data.list)

      const dispatchDetails = await Promise.all(
        dispatchesRes.data.list.map((d: Dispatch) => dispatchApi.getDetail(d.id))
      )
      setExecutingDispatches(dispatchDetails.map(r => r.data))

      try {
        const reportRes = await reportApi.getStatistics({})
        setReportStats(reportRes.data)
      } catch {}

      try {
        const [pumpAll, gateAll] = await Promise.all([
          pumpApi.getList({ pageSize: 9999 }),
          gateApi.getList({ pageSize: 9999 }),
        ])
        const pCounts: StatusCounts = {}
        pumpAll.data.list.forEach(p => { pCounts[p.status] = (pCounts[p.status] || 0) + 1 })
        setPumpStatusCounts(pCounts)
        const gCounts: StatusCounts = {}
        gateAll.data.list.forEach(g => { gCounts[g.status] = (gCounts[g.status] || 0) + 1 })
        setGateStatusCounts(gCounts)
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const getDispatchProgress = (items: DispatchItem[]) => {
    if (!items || items.length === 0) return 0
    const completed = items.filter(i => i.status === 'completed').length
    return Math.round((completed / items.length) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <Button variant="primary" size="sm" className="mt-2" onClick={fetchData}>
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {navCards.map((card) => (
          <Card
            key={card.path}
            className="cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate(card.path)}
          >
            <CardContent className="p-4">
              <div className={`bg-gradient-to-br ${card.gradient} p-3 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform`}>
                <card.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-700">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats[card.countKey] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {statCards.map((card) => (
          <Card key={card.key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stats[card.key as keyof DashboardStats]}
                  </p>
                </div>
                <div className={`bg-gradient-to-br ${card.color} p-3 rounded-lg`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {viewTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  今日调度计划
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaySchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">今日暂无调度计划</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>灌区</TableHead>
                        <TableHead>时间</TableHead>
                        <TableHead>计划水量</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todaySchedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>{schedule.zone_name || '-'}</TableCell>
                          <TableCell>{schedule.start_time} - {schedule.end_time}</TableCell>
                          <TableCell>{schedule.planned_volume} m³</TableCell>
                          <TableCell><StatusBadge status={schedule.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Droplets className="h-5 w-5 mr-2 text-green-600" />
                  最近灌溉记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">暂无灌溉记录</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>灌区</TableHead>
                        <TableHead>开始时间</TableHead>
                        <TableHead>实际水量</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.zone_name || '-'}</TableCell>
                          <TableCell>
                            {new Date(record.start_time).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>{record.actual_volume || '-'} m³</TableCell>
                          <TableCell><StatusBadge status={record.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="h-5 w-5 mr-2 text-indigo-600" />
                调度执行概览
              </CardTitle>
            </CardHeader>
            <CardContent>
              {executingDispatches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">当前无执行中的调度计划</div>
              ) : (
                <div className="space-y-4">
                  {executingDispatches.map((dispatch) => {
                    const progress = getDispatchProgress(dispatch.items || [])
                    const statusCounts = (dispatch.items || []).reduce((acc, item) => {
                      acc[item.status] = (acc[item.status] || 0) + 1
                      return acc
                    }, {} as StatusCounts)

                    return (
                      <div key={dispatch.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-medium text-gray-900">
                              调度计划 #{dispatch.id}
                            </span>
                            <span className="text-sm text-gray-500 ml-3">
                              计划日期: {dispatch.plan_date}
                            </span>
                            <StatusBadge status={dispatch.status} className="ml-3" />
                          </div>
                          <span className="text-sm font-medium text-blue-600">{progress}%</span>
                        </div>
                        <ProgressBar percent={progress} />
                        <div className="flex gap-4 mt-3 text-sm">
                          {(dispatch.items || []).length > 0 && Object.entries(statusCounts).map(([status, count]) => (
                            <span key={status} className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${itemStatusColor[status] || 'bg-gray-400'}`} />
                              {itemStatusLabel[status] || status}: {count}
                            </span>
                          ))}
                        </div>
                        {(dispatch.items || []).length > 0 && (
                          <div className="mt-3 text-xs text-gray-500 space-y-1">
                            {dispatch.items.slice(0, 5).map((item) => (
                              <div key={item.id} className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${itemStatusColor[item.status] || 'bg-gray-400'}`} />
                                <span>{item.zone_name || `灌区#${item.zone_id}`}</span>
                                <span>-</span>
                                <span>{item.gate_name || `闸门#${item.gate_id}`}</span>
                                <span>-</span>
                                <span>{item.start_time} ~ {item.end_time}</span>
                                <StatusBadge status={item.status} />
                              </div>
                            ))}
                            {dispatch.items.length > 5 && (
                              <div className="text-blue-500">...共 {dispatch.items.length} 项</div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                活动告警
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeAlarms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无活动告警</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>设备编码</TableHead>
                      <TableHead>告警类型</TableHead>
                      <TableHead>告警级别</TableHead>
                      <TableHead>告警信息</TableHead>
                      <TableHead>发生时间</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeAlarms.map((alarm) => (
                      <TableRow key={alarm.id}>
                        <TableCell>{alarm.device_code}</TableCell>
                        <TableCell>{alarm.alarm_type}</TableCell>
                        <TableCell><StatusBadge status={alarm.alarm_level} /></TableCell>
                        <TableCell>{alarm.alarm_message}</TableCell>
                        <TableCell>{new Date(alarm.created_at).toLocaleString('zh-CN')}</TableCell>
                        <TableCell><StatusBadge status={alarm.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'duty' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                  泵站状态概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {['running', 'stopped', 'fault', 'maintenance'].map((s) => (
                    <div key={s} className="border border-gray-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-500">{s === 'running' ? '运行中' : s === 'stopped' ? '已停止' : s === 'fault' ? '故障' : '维护中'}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{pumpStatusCounts[s] || 0}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GitBranch className="h-5 w-5 mr-2 text-green-600" />
                  闸门状态概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {['open', 'closed', 'partial', 'fault', 'maintenance'].map((s) => (
                    <div key={s} className="border border-gray-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-500">{s === 'open' ? '开启' : s === 'closed' ? '关闭' : s === 'partial' ? '部分开启' : s === 'fault' ? '故障' : '维护中'}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{gateStatusCounts[s] || 0}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                活动告警
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeAlarms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无活动告警</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>设备编码</TableHead>
                      <TableHead>告警类型</TableHead>
                      <TableHead>告警级别</TableHead>
                      <TableHead>告警信息</TableHead>
                      <TableHead>发生时间</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeAlarms.map((alarm) => (
                      <TableRow key={alarm.id}>
                        <TableCell>{alarm.device_code}</TableCell>
                        <TableCell>{alarm.alarm_type}</TableCell>
                        <TableCell><StatusBadge status={alarm.alarm_level} /></TableCell>
                        <TableCell>{alarm.alarm_message}</TableCell>
                        <TableCell>{new Date(alarm.created_at).toLocaleString('zh-CN')}</TableCell>
                        <TableCell><StatusBadge status={alarm.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'farmer' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  今日调度计划
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaySchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">今日暂无调度计划</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>灌区</TableHead>
                        <TableHead>时间</TableHead>
                        <TableHead>计划水量</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {todaySchedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell>{schedule.zone_name || '-'}</TableCell>
                          <TableCell>{schedule.start_time} - {schedule.end_time}</TableCell>
                          <TableCell>{schedule.planned_volume} m³</TableCell>
                          <TableCell><StatusBadge status={schedule.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Droplets className="h-5 w-5 mr-2 text-green-600" />
                  灌溉记录
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentRecords.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">暂无灌溉记录</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>灌区</TableHead>
                        <TableHead>开始时间</TableHead>
                        <TableHead>实际水量</TableHead>
                        <TableHead>状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.zone_name || '-'}</TableCell>
                          <TableCell>
                            {new Date(record.start_time).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell>{record.actual_volume || '-'} m³</TableCell>
                          <TableCell><StatusBadge status={record.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'supervisor' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" />
                用水报告概览
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">报告总数</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportStats.summary.report_count}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">计划总水量</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportStats.summary.total_planned_water}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">实际总水量</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{reportStats.summary.total_actual_water}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">平均完成率</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {reportStats.summary.avg_completion_rate}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">暂无报告数据</div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  告警统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-600">活动告警</p>
                    <p className="text-2xl font-bold text-red-700 mt-1">{stats.activeAlarms}</p>
                  </div>
                  <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-orange-600">活跃工单</p>
                    <p className="text-2xl font-bold text-orange-700 mt-1">{stats.activeWorkOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Droplets className="h-5 w-5 mr-2 text-blue-600" />
                  水量损失
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportStats ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">总损失水量</span>
                      <span className="font-medium text-gray-900">{reportStats.summary.total_water_loss} m³</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">总缺水量</span>
                      <span className="font-medium text-gray-900">{reportStats.summary.total_deficit} m³</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">灌溉总面积</span>
                      <span className="font-medium text-gray-900">{reportStats.summary.total_irrigation_area} 亩</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">暂无数据</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
