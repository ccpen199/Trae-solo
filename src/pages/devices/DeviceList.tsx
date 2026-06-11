import { useState } from 'react'
import { Search, Eye, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'

const mockDevices = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: ['1号楼大门门禁', '3号楼单元门门禁', '5号楼大门门禁', '2号楼电梯控制', '地下车库闸机', '7号楼门禁'][i % 6],
  location: ['1号楼', '3号楼', '5号楼', '2号楼', '地下车库', '7号楼'][i % 6],
  type: (['access', 'camera', 'sensor', 'elevator', 'access', 'light'] as const)[i % 6],
  status: (['online', 'online', 'offline', 'online', 'maintenance', 'online'] as const)[i % 6],
  firmwareVersion: `v2.${i % 3 + 1}.${(i * 7) % 10}`,
  lastHeartbeat: `2026-06-10 ${String(9 + i).padStart(2, '0')}:${String(i * 5 % 60).padStart(2, '0')}:00`,
}))

const typeLabels: Record<string, string> = {
  access: '门禁', camera: '摄像头', sensor: '传感器', elevator: '电梯', light: '照明',
}

export default function DeviceList() {
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const navigate = useNavigate()

  const filtered = mockDevices.filter((d) => {
    if (statusFilter && d.status !== statusFilter) return false
    if (typeFilter && d.type !== typeFilter) return false
    if (locationFilter && !d.location.includes(locationFilter)) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader title="设备列表" subtitle="管理社区所有智能设备" />

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">状态</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">全部状态</option>
              <option value="online">在线</option>
              <option value="offline">离线</option>
              <option value="maintenance">维护中</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">类型</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">全部类型</option>
              <option value="access">门禁</option>
              <option value="camera">摄像头</option>
              <option value="sensor">传感器</option>
              <option value="elevator">电梯</option>
              <option value="light">照明</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">位置</label>
            <input type="text" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} placeholder="搜索位置" className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-36" />
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
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">设备名称</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">位置</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">类型</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">状态</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">固件版本</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">最后心跳</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-800 font-medium">{d.name}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{d.location}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{typeLabels[d.type]}</td>
                  <td className="px-5 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-5 py-3 text-sm text-slate-600 font-mono">{d.firmwareVersion}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{d.lastHeartbeat}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors" title="详情">
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => navigate('/devices/ota')}
                        className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
                        title="OTA升级"
                      >
                        <Upload size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
