import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import PageHeader from '@/components/PageHeader'

const devices = [
  { id: '1', name: '1号楼大门门禁', currentVersion: 'v2.1.3', targetVersion: 'v2.2.0' },
  { id: '2', name: '3号楼单元门门禁', currentVersion: 'v2.1.3', targetVersion: 'v2.2.0' },
  { id: '3', name: '5号楼大门门禁', currentVersion: 'v2.0.8', targetVersion: 'v2.2.0' },
  { id: '4', name: '地下车库闸机', currentVersion: 'v1.9.5', targetVersion: 'v2.2.0' },
]

const history = [
  { id: '1', device: '1号楼大门门禁', from: 'v2.0.8', to: 'v2.1.3', status: 'success', time: '2026-06-08 14:30:00' },
  { id: '2', device: '3号楼单元门门禁', from: 'v2.0.8', to: 'v2.1.3', status: 'success', time: '2026-06-08 14:25:00' },
  { id: '3', device: '7号楼门禁', from: 'v2.0.5', to: 'v2.1.3', status: 'failed', time: '2026-06-07 10:00:00' },
  { id: '4', device: '5号楼大门门禁', from: 'v1.9.5', to: 'v2.0.8', status: 'success', time: '2026-06-05 16:20:00' },
]

export default function OTAUpgrade() {
  const [selectedDevice, setSelectedDevice] = useState('')
  const [upgrading, setUpgrading] = useState(false)
  const [progress, setProgress] = useState(0)

  const selected = devices.find((d) => d.id === selectedDevice)

  const handleUpgrade = () => {
    if (!selectedDevice) return
    setUpgrading(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          setUpgrading(false)
          return 100
        }
        return p + Math.random() * 15
      })
    }, 500)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="OTA升级" subtitle="远程设备固件升级管理" />

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-4">发起升级</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">选择设备</label>
            <select
              value={selectedDevice}
              onChange={(e) => { setSelectedDevice(e.target.value); setProgress(0) }}
              className="w-full max-w-md h-10 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">请选择设备</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.currentVersion})</option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="flex items-center gap-8">
              <div>
                <div className="text-xs text-slate-400">当前版本</div>
                <div className="text-sm font-mono font-medium text-slate-600">{selected.currentVersion}</div>
              </div>
              <div className="text-slate-300">→</div>
              <div>
                <div className="text-xs text-slate-400">目标版本</div>
                <div className="text-sm font-mono font-medium text-emerald-600">{selected.targetVersion}</div>
              </div>
            </div>
          )}

          {upgrading && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-600">升级进度</span>
                <span className="font-mono text-emerald-600">{Math.min(Math.round(progress), 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {progress >= 100 && !upgrading && (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle size={18} />
              <span className="text-sm font-medium">升级完成</span>
            </div>
          )}

          <button
            onClick={handleUpgrade}
            disabled={!selectedDevice || upgrading}
            className="h-10 px-6 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Upload size={16} />
            {upgrading ? '升级中...' : '开始升级'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">升级历史</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">设备</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">升级版本</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">状态</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-800 font-medium">{h.device}</td>
                  <td className="px-5 py-3 text-sm text-slate-600 font-mono">{h.from} → {h.to}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${h.status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {h.status === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {h.status === 'success' ? '成功' : '失败'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-600">{h.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
