import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Droplets,
  Gauge,
  Plus,
  RefreshCw,
  Wrench,
} from 'lucide-react'

type ApiList<T> = {
  list: T[]
  total: number
}

type Canal = {
  id: number
  name: string
  code: string
  length: number
  capacity: number
  status: string
}

type Application = {
  id: number
  applicant_name: string
  applicant_type: string
  zone_name: string
  crop_name: string
  irrigation_area: number
  estimated_water: number
  priority: number
  status: string
  start_date: string
  end_date: string
}

type Schedule = {
  id: number
  applicant_name: string
  zone_name: string
  gate_name: string
  scheduled_date: string
  start_time: string
  end_time: string
  planned_flow: number
  planned_volume: number
  status: string
}

type DispatchPlan = {
  id: number
  plan_date: string
  water_source: string
  water_level: number
  pump_capacity: number
  total_planned_volume: number
  status: string
  item_count: number
}

type DeviceStatus = {
  id: number
  device_type: string
  device_code: string
  gate_opening: number | null
  flow_rate: number | null
  water_level: number | null
  pump_status: string | null
  status: string
  timestamp: string
}

type Alarm = {
  id: number
  device_code: string
  alarm_type: string
  alarm_level: string
  alarm_message: string
  status: string
}

type WorkOrder = {
  id: number
  device_code: string
  order_type: string
  priority: string
  status: string
  description: string
  assignee: string
}

type WaterReport = {
  id: number
  report_type: string
  report_period: string
  zone_name: string | null
  planned_water: number
  actual_water: number
  water_loss: number
  deficit: number
  completion_rate: number
}

type DashboardData = {
  canals: ApiList<Canal>
  applications: ApiList<Application>
  schedules: ApiList<Schedule>
  dispatches: ApiList<DispatchPlan>
  devices: DeviceStatus[]
  alarms: ApiList<Alarm>
  workOrders: ApiList<WorkOrder>
  reports: ApiList<WaterReport>
}

const initialData: DashboardData = {
  canals: { list: [], total: 0 },
  applications: { list: [], total: 0 },
  schedules: { list: [], total: 0 },
  dispatches: { list: [], total: 0 },
  devices: [],
  alarms: { list: [], total: 0 },
  workOrders: { list: [], total: 0 },
  reports: { list: [], total: 0 },
}

const statusText: Record<string, string> = {
  active: '启用',
  normal: '正常',
  pending: '待处理',
  approved: '已通过',
  rejected: '已驳回',
  scheduled: '已排程',
  in_progress: '执行中',
  completed: '已完成',
  executing: '执行中',
  draft: '草稿',
  acknowledged: '已确认',
  resolved: '已解决',
}

const statusClass: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  normal: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  scheduled: 'bg-sky-50 text-sky-700 ring-sky-200',
  executing: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_progress: 'bg-sky-50 text-sky-700 ring-sky-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  draft: 'bg-slate-100 text-slate-700 ring-slate-200',
  acknowledged: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || payload?.error || `HTTP ${response.status}`)
  }

  return payload.data
}

function listEndpoint<T>(path: string) {
  return api<ApiList<T>>(path)
}

function Badge({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ${statusClass[value] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {statusText[value] || value}
    </span>
  )
}

function Metric({ icon: Icon, label, value, detail }: { icon: any; label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-3 text-xs text-slate-500">{detail}</div>
    </div>
  )
}

function SectionTitle({ icon: Icon, title, action }: { icon: any; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-base font-semibold text-slate-950">
        <Icon size={18} className="text-cyan-700" />
        <span>{title}</span>
      </div>
      {action}
    </div>
  )
}

function formatNumber(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined) return '-'
  return `${Number(value).toLocaleString('zh-CN')}${suffix}`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return value.slice(0, 10)
}

export default function Home() {
  const [data, setData] = useState<DashboardData>(initialData)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [
        canals,
        applications,
        schedules,
        dispatches,
        devices,
        alarms,
        workOrders,
        reports,
      ] = await Promise.all([
        listEndpoint<Canal>('/api/canals?pageSize=50'),
        listEndpoint<Application>('/api/applications?pageSize=50'),
        listEndpoint<Schedule>('/api/schedules?pageSize=50'),
        listEndpoint<DispatchPlan>('/api/dispatches?pageSize=50'),
        api<DeviceStatus[]>('/api/devices/latest'),
        listEndpoint<Alarm>('/api/alarms?pageSize=50'),
        listEndpoint<WorkOrder>('/api/work-orders?pageSize=50'),
        listEndpoint<WaterReport>('/api/reports?pageSize=50'),
      ])
      setData({ canals, applications, schedules, dispatches, devices, alarms, workOrders, reports })
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stats = useMemo(() => {
    const plannedWater = data.schedules.list.reduce((sum, item) => sum + Number(item.planned_volume || 0), 0)
    const actualWater = data.reports.list.reduce((sum, item) => sum + Number(item.actual_water || 0), 0)
    const activeAlarms = data.alarms.list.filter((item) => item.status !== 'resolved').length
    const completion = data.reports.list.length
      ? Math.round(data.reports.list.reduce((sum, item) => sum + Number(item.completion_rate || 0), 0) / data.reports.list.length)
      : 0

    return { plannedWater, actualWater, activeAlarms, completion }
  }, [data])

  const runAction = async (key: string, action: () => Promise<void>, message: string) => {
    setBusy(key)
    setNotice('')
    setError('')
    try {
      await action()
      setNotice(message)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setBusy(null)
    }
  }

  const createApplication = () => runAction(
    'create-application',
    async () => {
      await api('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          applicant_name: `东一轮灌申请-${Date.now().toString().slice(-4)}`,
          applicant_type: 'cooperative',
          zone_id: 1,
          crop_type_id: 1,
          irrigation_area: 180,
          start_date: '2025-06-10',
          end_date: '2025-06-12',
          estimated_water: 1440,
          priority: 2,
          reason: '水稻分蘖期轮灌补水',
          created_by: '调度中心',
          user_name: '调度中心',
        }),
      })
    },
    '已新增一条用水申请',
  )

  const approvePending = () => runAction(
    'approve',
    async () => {
      const pending = data.applications.list.find((item) => item.status === 'pending')
      if (!pending) throw new Error('当前没有待审核申请')
      await api(`/api/applications/${pending.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reviewed_by: '值班调度员', user_name: '值班调度员' }),
      })
    },
    '待审核申请已通过',
  )

  const acknowledgeAlarm = () => runAction(
    'ack-alarm',
    async () => {
      const alarm = data.alarms.list.find((item) => item.status === 'active')
      if (!alarm) throw new Error('当前没有待确认告警')
      await api(`/api/alarms/${alarm.id}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({ acknowledged_by: '泵站值班员', user_name: '泵站值班员' }),
      })
    },
    '告警已确认',
  )

  const generateDailyReport = () => runAction(
    'daily-report',
    async () => {
      await api('/api/reports/generate-daily', {
        method: 'POST',
        body: JSON.stringify({ report_date: '2025-06-01', user_name: '报表系统' }),
      })
    },
    '已生成 2025-06-01 用水日报',
  )

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-5">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">水利灌溉调度系统</h1>
            <div className="mt-1 text-sm text-slate-500">灌区档案、用水申请、调度计划、执行监控、用水报表</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              title="刷新数据"
              onClick={loadData}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              onClick={createApplication}
              disabled={busy === 'create-application'}
              className="inline-flex items-center gap-2 rounded-md bg-cyan-700 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-800 disabled:opacity-60"
            >
              <Plus size={16} />
              新增申请
            </button>
            <button
              type="button"
              onClick={approvePending}
              disabled={busy === 'approve'}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <CheckCircle2 size={16} />
              通过待审
            </button>
            <button
              type="button"
              onClick={generateDailyReport}
              disabled={busy === 'daily-report'}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <ClipboardList size={16} />
              生成日报
            </button>
          </div>
        </header>

        {(error || notice) && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || notice}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Droplets} label="计划水量" value={formatNumber(stats.plannedWater, ' m3')} detail={`${data.schedules.total} 条排程`} />
          <Metric icon={Gauge} label="实际用水" value={formatNumber(stats.actualWater, ' m3')} detail={`报表完成率 ${stats.completion}%`} />
          <Metric icon={CalendarClock} label="调度计划" value={data.dispatches.total} detail={`${data.dispatches.list.filter((item) => item.status === 'executing').length} 个执行中`} />
          <Metric icon={AlertTriangle} label="活动告警" value={stats.activeAlarms} detail={`${data.workOrders.total} 张设备工单`} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle icon={Droplets} title="灌区档案" />
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-2 py-2 font-medium">渠系</th>
                    <th className="px-2 py-2 font-medium">编码</th>
                    <th className="px-2 py-2 font-medium">长度</th>
                    <th className="px-2 py-2 font-medium">能力</th>
                    <th className="px-2 py-2 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.canals.list.slice(0, 6).map((item) => (
                    <tr key={item.id}>
                      <td className="px-2 py-2 font-medium text-slate-900">{item.name}</td>
                      <td className="px-2 py-2 text-slate-600">{item.code}</td>
                      <td className="px-2 py-2 text-slate-600">{formatNumber(item.length, ' km')}</td>
                      <td className="px-2 py-2 text-slate-600">{formatNumber(item.capacity, ' m3/s')}</td>
                      <td className="px-2 py-2"><Badge value={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle icon={ClipboardList} title="用水申请" />
            <div className="space-y-3">
              {data.applications.list.slice(0, 5).map((item) => (
                <div key={item.id} className="grid gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0 md:grid-cols-[1fr_auto]">
                  <div>
                    <div className="font-medium text-slate-950">{item.applicant_name}</div>
                    <div className="mt-1 text-sm text-slate-500">{item.zone_name} / {item.crop_name} / {formatNumber(item.irrigation_area, ' 亩')}</div>
                  </div>
                  <div className="flex items-center gap-3 md:justify-end">
                    <div className="text-sm text-slate-600">{formatNumber(item.estimated_water, ' m3')}</div>
                    <Badge value={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle icon={CalendarClock} title="调度计划与排程" />
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-2 py-2 font-medium">日期</th>
                    <th className="px-2 py-2 font-medium">申请/灌区</th>
                    <th className="px-2 py-2 font-medium">闸门</th>
                    <th className="px-2 py-2 font-medium">时段</th>
                    <th className="px-2 py-2 font-medium">水量</th>
                    <th className="px-2 py-2 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.schedules.list.slice(0, 6).map((item) => (
                    <tr key={item.id}>
                      <td className="px-2 py-2 text-slate-600">{formatDate(item.scheduled_date)}</td>
                      <td className="px-2 py-2">
                        <div className="font-medium text-slate-900">{item.applicant_name}</div>
                        <div className="text-xs text-slate-500">{item.zone_name}</div>
                      </td>
                      <td className="px-2 py-2 text-slate-600">{item.gate_name}</td>
                      <td className="px-2 py-2 text-slate-600">{item.start_time}-{item.end_time}</td>
                      <td className="px-2 py-2 text-slate-600">{formatNumber(item.planned_volume, ' m3')}</td>
                      <td className="px-2 py-2"><Badge value={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle icon={Activity} title="执行监控" />
            <div className="space-y-3">
              {data.devices.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-md border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-950">{item.device_code}</div>
                    <Badge value={item.status} />
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500">
                    <span>开度 {formatNumber(item.gate_opening, '%')}</span>
                    <span>流量 {formatNumber(item.flow_rate, ' m3/s')}</span>
                    <span>水位 {formatNumber(item.water_level, ' m')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle
              icon={AlertTriangle}
              title="异常告警"
              action={(
                <button
                  type="button"
                  title="确认告警"
                  onClick={acknowledgeAlarm}
                  disabled={busy === 'ack-alarm'}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <CheckCircle2 size={15} />
                </button>
              )}
            />
            <div className="space-y-3">
              {data.alarms.list.slice(0, 4).map((item) => (
                <div key={item.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-950">{item.device_code}</div>
                    <Badge value={item.status} />
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{item.alarm_message}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle icon={Wrench} title="设备工单" />
            <div className="space-y-3">
              {data.workOrders.list.slice(0, 4).map((item) => (
                <div key={item.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-950">{item.device_code}</div>
                    <Badge value={item.status} />
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{item.description}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.assignee || '未派发'} / {item.priority}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <SectionTitle icon={Gauge} title="用水报表" />
            <div className="space-y-3">
              {data.reports.list.slice(0, 4).map((item) => (
                <div key={item.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-slate-950">{item.zone_name || '全灌区'}</div>
                    <div className="text-sm font-medium text-cyan-700">{formatNumber(item.completion_rate, '%')}</div>
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{item.report_period} / 计划 {formatNumber(item.planned_water, ' m3')} / 实际 {formatNumber(item.actual_water, ' m3')}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <SectionTitle icon={Activity} title="调度总览" />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-medium">计划日期</th>
                  <th className="px-2 py-2 font-medium">水源</th>
                  <th className="px-2 py-2 font-medium">水位</th>
                  <th className="px-2 py-2 font-medium">泵站能力</th>
                  <th className="px-2 py-2 font-medium">计划水量</th>
                  <th className="px-2 py-2 font-medium">明细</th>
                  <th className="px-2 py-2 font-medium">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.dispatches.list.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-2 text-slate-600">{formatDate(item.plan_date)}</td>
                    <td className="px-2 py-2 font-medium text-slate-900">{item.water_source}</td>
                    <td className="px-2 py-2 text-slate-600">{formatNumber(item.water_level, ' m')}</td>
                    <td className="px-2 py-2 text-slate-600">{formatNumber(item.pump_capacity, ' m3/s')}</td>
                    <td className="px-2 py-2 text-slate-600">{formatNumber(item.total_planned_volume, ' m3')}</td>
                    <td className="px-2 py-2 text-slate-600">{item.item_count} 条</td>
                    <td className="px-2 py-2"><Badge value={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {loading && (
          <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-5 py-2 text-center text-sm text-slate-500 shadow-sm">
            正在加载灌区调度数据...
          </div>
        )}
      </div>
    </main>
  )
}
