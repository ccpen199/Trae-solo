import { useEffect, useState } from 'react'
import {
  Server, ArrowRightLeft, RefreshCw, CheckCircle2, AlertTriangle, XCircle,
  ArrowUpRight, ArrowDownLeft, Download, Eye, ChevronRight,
  BarChart2, Database, Clock, CloudLightning,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area,
} from 'recharts'
import { apiFetch, mapRelayRecord } from '@/utils/api'

interface RelayRecord {
  id: string
  time: string
  direction: 'to-province' | 'from-province'
  service: string
  dept: string
  records: number
  dataSize: string
  status: 'success' | 'partial' | 'failed' | 'syncing'
  duration: string
  batchNo: string
  dataType: string
  remarks?: string
}

const mockRecords: RelayRecord[] = [
  { id: 'r-001', time: '2026-06-10 14:32:18', direction: 'to-province', service: '社保缴纳', dept: '人社局', records: 892, dataSize: '1.2 MB', status: 'success', duration: '2.1s', batchNo: 'SYNC-20260610-1432-0891', dataType: '办件数据', remarks: '例行同步' },
  { id: 'r-002', time: '2026-06-10 14:30:05', direction: 'from-province', service: '不动产查询', dept: '自然资源局', records: 45, dataSize: '86 KB', status: 'success', duration: '0.8s', batchNo: 'SYNC-20260610-1430-0044', dataType: '证照回执', remarks: '省平台证照下发' },
  { id: 'r-003', time: '2026-06-10 14:25:44', direction: 'to-province', service: '税务预约', dept: '税务局', records: 328, dataSize: '412 KB', status: 'partial', duration: '5.6s', batchNo: 'SYNC-20260610-1425-0327', dataType: '预约记录', remarks: '12条记录超时重传中' },
  { id: 'r-004', time: '2026-06-10 14:20:11', direction: 'to-province', service: '公积金提取', dept: '住建局', records: 156, dataSize: '198 KB', status: 'success', duration: '1.2s', batchNo: 'SYNC-20260610-1420-0155', dataType: '资金流水', remarks: '成功' },
  { id: 'r-005', time: '2026-06-10 14:15:38', direction: 'from-province', service: '营业执照', dept: '市场监管局', records: 78, dataSize: '124 KB', status: 'success', duration: '0.6s', batchNo: 'SYNC-20260610-1415-0077', dataType: '电子证照', remarks: '省库同步' },
  { id: 'r-006', time: '2026-06-10 14:10:22', direction: 'to-province', service: '违章处理', dept: '城管局', records: 412, dataSize: '560 KB', status: 'failed', duration: '超时', batchNo: 'SYNC-20260610-1410-0411', dataType: '处罚决定书', remarks: '504网关超时，重试2次' },
  { id: 'r-007', time: '2026-06-10 14:05:59', direction: 'to-province', service: '投诉反馈', dept: '城管局', records: 56, dataSize: '88 KB', status: 'success', duration: '0.4s', batchNo: 'SYNC-20260610-1405-0055', dataType: '工单', remarks: '成功' },
  { id: 'r-008', time: '2026-06-10 14:00:18', direction: 'from-province', service: '户籍信息', dept: '公安局', records: 28, dataSize: '42 KB', status: 'success', duration: '0.5s', batchNo: 'SYNC-20260610-1400-0027', dataType: '身份核验', remarks: '核验反馈' },
  { id: 'r-009', time: '2026-06-10 13:55:12', direction: 'to-province', service: '水电气缴费', dept: '水务局', records: 1820, dataSize: '2.4 MB', status: 'success', duration: '3.2s', batchNo: 'SYNC-20260610-1355-1819', dataType: '缴费流水', remarks: '例行同步' },
  { id: 'r-010', time: '2026-06-10 13:50:01', direction: 'to-province', service: '社保缴纳', dept: '人社局', records: 1245, dataSize: '1.6 MB', status: 'syncing', duration: '进行中', batchNo: 'SYNC-20260610-1350-1244', dataType: '月度汇总', remarks: '大批量数据上传' },
]

const successTrend = Array.from({ length: 12 }, (_, i) => ({
  hour: `${String(i * 2).padStart(2, '0')}:00`,
  success: 92 + Math.round(Math.sin(i / 2) * 4 + Math.random() * 4),
  toProvince: 820 + Math.round(Math.sin(i / 3) * 280 + Math.random() * 240),
  fromProvince: 180 + Math.round(Math.sin(i / 2) * 90 + Math.random() * 120),
}))

const deptStats = [
  { dept: '人社局', total: 4280, success: 4251, rate: 99.3, avgMs: 1420 },
  { dept: '税务局', total: 2865, success: 2832, rate: 98.8, avgMs: 1180 },
  { dept: '自然资源局', total: 1820, success: 1796, rate: 98.7, avgMs: 1650 },
  { dept: '住建局', total: 1430, success: 1425, rate: 99.7, avgMs: 980 },
  { dept: '城管局', total: 2185, success: 2102, rate: 96.2, avgMs: 2140 },
  { dept: '水务局', total: 3540, success: 3518, rate: 99.4, avgMs: 1260 },
  { dept: '市监局', total: 960, success: 956, rate: 99.6, avgMs: 890 },
  { dept: '公安局', total: 1120, success: 1115, rate: 99.6, avgMs: 760 },
]

function StatusTag({ status }: { status: RelayRecord['status'] }) {
  const map = {
    success: { label: '成功', icon: CheckCircle2, cls: 'bg-green-50 text-green-600 border-green-200' },
    partial: { label: '部分', icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    failed: { label: '失败', icon: XCircle, cls: 'bg-red-50 text-red-600 border-red-200' },
    syncing: { label: '同步中', icon: RefreshCw, cls: 'bg-gov-blue-50 text-gov-blue-600 border-gov-blue-200 animate-pulse' },
  }
  const c = map[status]
  const IC = c.icon
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border font-medium ${c.cls}`}><IC className="w-3 h-3" />{c.label}</span>
}

export default function Relay() {
  const [status, setStatus] = useState({
    connection: 'connected' as 'connected' | 'warning' | 'disconnected',
    lastSync: '2026-06-10 14:32:18',
    nextSync: '2026-06-10 14:40:00',
    interval: 5,
    todayTotal: 20372,
    successRate: 98.6,
    toProvince: 14562,
    fromProvince: 5810,
    pending: 28,
  })
  const [records, setRecords] = useState<RelayRecord[]>(mockRecords)
  const [filterDir, setFilterDir] = useState<'all' | RelayRecord['direction']>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | RelayRecord['status']>('all')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    apiFetch<Record<string, unknown>>('/api/relay/status')
      .then((d) => {
        if (d && typeof d === 'object') {
          setStatus({
            connection: d.connected ? 'connected' : 'disconnected',
            lastSync: String(d.lastSync || d.last_sync || '未知'),
            nextSync: String(d.nextSync || d.next_sync || '未知'),
            interval: Number(d.interval || 5),
            todayTotal: Number(d.todayTotal || d.today_total || 20000),
            successRate: Number(d.successRate || d.success_rate || 98.5),
            toProvince: Number(d.toProvince || d.to_province || 14000),
            fromProvince: Number(d.fromProvince || d.from_province || 5500),
            pending: Number(d.pending || 20),
          })
        }
      }).catch(() => {})

    apiFetch<Record<string, unknown>[]>('/api/relay/logs')
      .then((arr) => {
        if (Array.isArray(arr) && arr.length) {
          setRecords(arr.map(mapRelayRecord))
        }
      }).catch(() => {})
  }, [])

  const filteredRecords = records.filter(
    (r) => (filterDir === 'all' || r.direction === filterDir) && (filterStatus === 'all' || r.status === filterStatus),
  )

  function triggerSync() {
    setSyncing(true)
    apiFetch('/api/relay/sync', { method: 'POST' })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => {
          setSyncing(false)
          setStatus((s) => ({ ...s, todayTotal: s.todayTotal + 256, toProvince: s.toProvince + 200, fromProvince: s.fromProvince + 56, lastSync: new Date().toLocaleString('zh-CN').replace(/\//g, '-') }))
          const now = new Date().toLocaleString('zh-CN').replace(/\//g, '-')
          setRecords((prev) => [
            { id: `r-new-${Date.now()}`, time: now, direction: 'to-province' as const, service: '综合数据', dept: '政务服务局', records: 256, dataSize: '384 KB', status: 'success' as const, duration: '1.8s', batchNo: `SYNC-NOW-${Math.floor(Math.random() * 9000 + 1000)}`, dataType: '汇总数据', remarks: '手动同步触发' },
            ...prev,
          ].slice(0, 30))
        }, 1600)
      })
  }

  const connConfig = {
    connected: { cls: 'bg-green-500', ring: 'ring-green-200', label: '通道连通', text: 'text-green-600' },
    warning: { cls: 'bg-amber-500', ring: 'ring-amber-200', label: '延迟偏高', text: 'text-amber-600' },
    disconnected: { cls: 'bg-red-500', ring: 'ring-red-200', label: '连接中断', text: 'text-red-600' },
  }
  const CC = connConfig[status.connection]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">省级通道状态</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="relative">
                  <span className={`inline-flex w-3.5 h-3.5 rounded-full ${CC.cls} ring-4 ${CC.ring} animate-pulse`} />
                </div>
                <p className={`text-lg font-bold ${CC.text}`}>{CC.label}</p>
              </div>
              <div className="space-y-1 mt-4 text-[11px] text-gray-500">
                <p className="flex items-center justify-between"><span>上级地址</span><span className="font-mono text-gray-700">gov.cn/gateway</span></p>
                <p className="flex items-center justify-between"><span>最近心跳</span><span className="font-mono text-gray-700">{status.lastSync.slice(11)}</span></p>
                <p className="flex items-center justify-between"><span>下次同步</span><span className="font-mono text-gray-700">{status.nextSync.slice(11)}</span></p>
                <p className="flex items-center justify-between"><span>同步间隔</span><span className="font-mono text-gray-700">{status.interval}分钟</span></p>
                <p className="flex items-center justify-between"><span>认证方式</span><span className="text-gov-blue-600">双向TLS + CA签名</span></p>
              </div>
            </div>
          </div>
        </div>

        {[
          { label: '今日回传总量', value: status.todayTotal.toLocaleString(), unit: '条', icon: ArrowRightLeft, cls: 'from-gov-blue-500 to-gov-blue-600' },
          { label: '回传成功率', value: status.successRate, unit: '%', icon: CheckCircle2, cls: 'from-convenience to-teal-500' },
          { label: '上传→省平台', value: status.toProvince.toLocaleString(), unit: '条', icon: ArrowUpRight, cls: 'from-purple-500 to-gov-blue-500' },
          { label: '下载←省平台', value: status.fromProvince.toLocaleString(), unit: '条', icon: ArrowDownLeft, cls: 'from-amber-500 to-alert' },
          { label: '待重试队列', value: status.pending, unit: '条', icon: CloudLightning, cls: 'from-pink-500 to-gov-blue-500' },
        ].map((s, i) => (
          <div key={i} className="col-span-1.8 col-span-2 bg-gradient-to-br from-transparent to-transparent">
            <div className={`bg-gradient-to-br ${s.cls} text-white rounded-lg p-5 shadow-sm h-full`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs opacity-90 mb-1.5"><s.icon className="w-3.5 h-3.5" />{s.label}</div>
                  <p className="text-2xl font-bold leading-tight">{s.value}<span className="text-sm opacity-80 ml-1">{s.unit}</span></p>
                </div>
                <div className="w-9 h-9 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <s.icon className="w-4.5 h-4.5 text-white" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-gov-blue-500" />回传成功率趋势（24小时）</h3>
            <span className="text-[10px] text-gray-400">单位：%</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={successTrend}>
              <defs>
                <linearGradient id="sr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2EC4B6" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#2EC4B6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
              <YAxis tick={{ fontSize: 10 }} domain={[90, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="success" stroke="#2EC4B6" strokeWidth={2} fill="url(#sr)" name="成功率" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2"><Database className="w-4 h-4 text-convenience" />双向流量（每2小时）</h3>
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gov-blue-500" />上传→省</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400" />省→下载</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={successTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="toProvince" name="上传→省" fill="#1A5FB4" radius={[2, 2, 0, 0]} />
              <Bar dataKey="fromProvince" name="省→下载" fill="#F4A261" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-4 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-800 flex items-center gap-2"><Server className="w-4 h-4 text-alert" />各委办局回传统计</h3>
            <button onClick={triggerSync} disabled={syncing} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-gradient-to-r from-gov-blue-500 to-gov-blue-600 text-white disabled:opacity-50 hover:shadow-md shadow-sm">
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />{syncing ? '同步中...' : '手动触发同步'}
            </button>
          </div>
          <div className="space-y-2">
            {deptStats.map((d, i) => (
              <div key={i} className="text-[11px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-700 w-16">{d.dept}</span>
                  <span className="text-gray-400 font-mono">{d.total.toLocaleString()}</span>
                  <span className={`font-medium ${d.rate >= 99 ? 'text-convenience' : d.rate >= 98 ? 'text-gov-blue-600' : 'text-alert'}`}>{d.rate}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-gradient-to-r from-gov-blue-400 to-gov-blue-500" style={{ width: `${Math.min(100, d.rate)}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">平均耗时 {d.avgMs}ms · 成功 {d.success.toLocaleString()}条</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gov-blue-500" />省级回传记录明细
            <span className="text-[10px] text-gray-400 font-normal">共 {filteredRecords.length} 条</span>
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-50 rounded-md border border-gray-200 p-0.5">
              {[{ k: 'all', l: '全部' }, { k: 'to-province', l: '上传→省', ic: ArrowUpRight }, { k: 'from-province', l: '省→下载', ic: ArrowDownLeft }].map((o) => (
                <button
                  key={o.k}
                  onClick={() => setFilterDir(o.k as typeof filterDir)}
                  className={`flex items-center gap-1 px-3 py-1 text-xs rounded transition-colors ${filterDir === o.k ? 'bg-white text-gov-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {o.ic && <o.ic className="w-3 h-3" />}{o.l}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-md border border-gray-200 p-0.5">
              {[{ k: 'all', l: '全部状态' }, { k: 'success', l: '成功' }, { k: 'partial', l: '部分' }, { k: 'failed', l: '失败' }].map((o) => (
                <button
                  key={o.k}
                  onClick={() => setFilterStatus(o.k as typeof filterStatus)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${filterStatus === o.k ? 'bg-white text-gov-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {o.l}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
              <Download className="w-3 h-3" />导出
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">时间</th>
                <th className="text-left px-3 py-2.5 font-medium">方向</th>
                <th className="text-left px-3 py-2.5 font-medium">服务/部门</th>
                <th className="text-center px-3 py-2.5 font-medium">批次号</th>
                <th className="text-left px-3 py-2.5 font-medium">数据类型</th>
                <th className="text-right px-3 py-2.5 font-medium">记录数</th>
                <th className="text-right px-3 py-2.5 font-medium">数据量</th>
                <th className="text-right px-3 py-2.5 font-medium">耗时</th>
                <th className="text-center px-3 py-2.5 font-medium">状态</th>
                <th className="text-center px-3 py-2.5 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r.id} className="border-t border-gray-50 hover:bg-gov-blue-50/30 transition-colors">
                  <td className="px-4 py-2.5 text-gray-500 font-mono text-[11px]">{r.time}</td>
                  <td className="px-3 py-2.5">
                    {r.direction === 'to-province'
                      ? <span className="inline-flex items-center gap-1 text-gov-blue-600 font-medium"><ArrowUpRight className="w-3 h-3" />上传→省</span>
                      : <span className="inline-flex items-center gap-1 text-amber-600 font-medium"><ArrowDownLeft className="w-3 h-3" />省→下载</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-gray-800 font-medium">{r.service}</p>
                    <p className="text-[10px] text-gray-400">{r.dept}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center font-mono text-[10px] text-gray-500">{r.batchNo}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 text-gray-600">{r.dataType}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-700">{r.records.toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-500">{r.dataSize}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-500">{r.duration}</td>
                  <td className="px-3 py-2.5 text-center"><StatusTag status={r.status} /></td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="inline-flex items-center gap-0.5">
                      <button className="p-1 rounded text-gray-400 hover:text-gov-blue-600 hover:bg-gov-blue-50" title="详情"><Eye className="w-3.5 h-3.5" /></button>
                      {r.status !== 'success' && (
                        <button className="p-1 rounded text-gray-400 hover:text-convenience hover:bg-convenience/10" title="重传"><RefreshCw className="w-3.5 h-3.5" /></button>
                      )}
                      <button className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100" title="查看"><ChevronRight className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400">
          <span>共显示 {filteredRecords.length} 条记录，最近 {status.interval * 3} 分钟内同步 {records.filter(r => r.status === 'success').length} 次成功</span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50">上一页</button>
            <span className="px-2 py-1 bg-gov-blue-500 text-white rounded">1</span>
            <button className="px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50">2</button>
            <button className="px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50">下一页</button>
          </div>
        </div>
      </div>
    </div>
  )
}
