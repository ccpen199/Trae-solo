import { useState, useEffect } from 'react'
import { Bluetooth, Smartphone, QrCode, ScanFace } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

type TabKey = 'bluetooth' | 'nfc' | 'qrcode' | 'face'

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'bluetooth', label: '蓝牙', icon: Bluetooth },
  { key: 'nfc', label: 'NFC', icon: Smartphone },
  { key: 'qrcode', label: '二维码', icon: QrCode },
  { key: 'face', label: '人脸识别', icon: ScanFace },
]

const recentRecords = [
  { id: '1', time: '10:23', user: '张三', device: '1号楼大门', mode: 'face', result: 'success' },
  { id: '2', time: '10:20', user: '李四', device: '3号楼单元门', mode: 'bluetooth', result: 'success' },
  { id: '3', time: '10:15', user: '访客王五', device: '1号楼大门', mode: 'qrcode', result: 'success' },
  { id: '4', time: '10:12', user: '赵六', device: '5号楼大门', mode: 'nfc', result: 'denied' },
  { id: '5', time: '10:08', user: '孙七', device: '2号楼单元门', mode: 'face', result: 'error' },
]

function BluetoothPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="relative">
        <div className="w-32 h-32 rounded-full border-4 border-blue-400/30 animate-pulse-ring" />
        <div className="absolute inset-2 rounded-full border-4 border-blue-400/50 animate-pulse-ring animation-delay-500" />
        <div className="absolute inset-4 rounded-full border-4 border-blue-400/70 animate-pulse-ring animation-delay-1000" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Bluetooth size={40} className="text-blue-500" />
        </div>
      </div>
      <p className="mt-6 text-sm text-slate-500">正在搜索附近蓝牙设备...</p>
      <p className="mt-1 text-xs text-slate-400">请确保手机蓝牙已开启并靠近门禁</p>
    </div>
  )
}

function NFCPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="relative">
        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
          <Smartphone size={40} className="text-white" />
        </div>
        <div className="absolute -inset-4 rounded-3xl border-2 border-emerald-400/40 animate-ripple" />
        <div className="absolute -inset-8 rounded-3xl border-2 border-emerald-400/20 animate-ripple animation-delay-500" />
      </div>
      <p className="mt-8 text-sm text-slate-500">请将手机靠近NFC感应区域</p>
      <p className="mt-1 text-xs text-slate-400">支持NFC功能的手机可直接碰触开锁</p>
    </div>
  )
}

function QRCodePanel() {
  const [countdown, setCountdown] = useState(120)
  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 120)), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="w-44 h-44 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center relative">
        <div className="grid grid-cols-8 gap-0.5 w-36 h-36">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className={cn('w-full aspect-square rounded-[1px]', Math.random() > 0.4 ? 'bg-slate-800' : 'bg-white')} />
          ))}
        </div>
        <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-xl animate-scan-line" />
      </div>
      <p className="mt-4 text-sm text-slate-500">请在门禁设备上扫描此二维码</p>
      <p className="mt-1 text-xs text-slate-400">
        有效期剩余 <span className="text-emerald-600 font-mono font-medium">{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span>
      </p>
    </div>
  )
}

function FacePanel() {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="relative w-40 h-48">
        <div className="absolute inset-0 border-2 border-blue-400/60 rounded-[40%_40%_35%_35%] animate-scan-face" />
        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan-line" />
        <div className="absolute inset-4 flex items-center justify-center">
          <ScanFace size={48} className="text-blue-300/60" />
        </div>
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-lg" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-lg" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-lg" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-lg" />
      </div>
      <p className="mt-6 text-sm text-slate-500">请正对摄像头进行人脸识别</p>
      <p className="mt-1 text-xs text-slate-400">保持面部在识别框内</p>
    </div>
  )
}

const panels: Record<TabKey, () => JSX.Element> = {
  bluetooth: BluetoothPanel,
  nfc: NFCPanel,
  qrcode: QRCodePanel,
  face: FacePanel,
}

const modeLabels: Record<string, string> = {
  bluetooth: '蓝牙', nfc: 'NFC', qrcode: '二维码', face: '人脸',
}

export default function AccessControl() {
  const [activeTab, setActiveTab] = useState<TabKey>('bluetooth')
  const Panel = panels[activeTab]

  return (
    <div className="space-y-6">
      <PageHeader title="门禁开锁" subtitle="选择开锁方式" />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
        <Panel />
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">最近通行记录</h3>
        </div>
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
              {recentRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-600">{r.time}</td>
                  <td className="px-5 py-3 text-sm text-slate-800 font-medium">{r.user}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{r.device}</td>
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
