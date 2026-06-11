import { useState } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'

const modeLabels: Record<string, string> = {
  bluetooth: '蓝牙', nfc: 'NFC', qrcode: '二维码', face: '人脸',
}

const mockRecords = Array.from({ length: 15 }, (_, i) => ({
  id: String(i + 1),
  time: `2026-06-10 ${String(9 + Math.floor(i / 3)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
  userName: ['张三', '李四', '王五', '赵六', '孙七'][i % 5],
  deviceName: ['1号楼大门', '3号楼单元门', '5号楼大门', '2号楼单元门'][i % 4],
  mode: (['bluetooth', 'nfc', 'qrcode', 'face'] as const)[i % 4],
  result: (['success', 'success', 'denied', 'success', 'error'] as const)[i % 5],
}))

export default function AccessRecords() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [mode, setMode] = useState('')
  const [device, setDevice] = useState('')

  const filtered = mockRecords.filter((r) => {
    if (mode && r.mode !== mode) return false
    if (device && !r.deviceName.includes(device)) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader title="通行记录" subtitle="查看门禁通行历史" />

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">开始日期</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
              className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">结束日期</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
              className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">通行方式</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">全部方式</option>
              <option value="bluetooth">蓝牙</option>
              <option value="nfc">NFC</option>
              <option value="qrcode">二维码</option>
              <option value="face">人脸识别</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">设备</label>
            <input
              type="text"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              placeholder="搜索设备名称"
              className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-40"
            />
          </div>
          <button className="h-9 px-4 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5">
            <Search size={16} />查询
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">时间</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">人员</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">设备</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">方式</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">结果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-600">{r.time}</td>
                  <td className="px-5 py-3 text-sm text-slate-800 font-medium">{r.userName}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{r.deviceName}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{modeLabels[r.mode]}</td>
                  <td className="px-5 py-3"><StatusBadge status={r.result} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
