import { useState } from 'react'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import { ScanLine, QrCode, CreditCard, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

const terminalTypes = [
  { label: 'POS机具', icon: CreditCard, active: 'bg-blue-600 text-white' },
  { label: '小程序码', icon: QrCode, active: 'bg-emerald-600 text-white' },
  { label: '城市码', icon: Monitor, active: 'bg-amber-600 text-white' },
]

const recentRecords = [
  { id: 'vr0001', couponName: '2026春季惠民消费券', citizenName: '张伟', amount: 50, time: '2026-06-09 14:23', status: 'success' as const },
  { id: 'vr0002', couponName: '满100减20餐饮券', citizenName: '王芳', amount: 20, time: '2026-06-09 14:10', status: 'success' as const },
  { id: 'vr0003', couponName: '文旅消费专项补贴', citizenName: '李明', amount: 100, time: '2026-06-09 13:55', status: 'failed' as const },
  { id: 'vr0004', couponName: '铁西商圈地理围栏券', citizenName: '赵丽', amount: 30, time: '2026-06-09 13:40', status: 'success' as const },
  { id: 'vr0005', couponName: '满100减20餐饮券', citizenName: '刘洋', amount: 20, time: '2026-06-09 13:25', status: 'success' as const },
]

export default function MerchantVerify() {
  const [activeTerminal, setActiveTerminal] = useState(0)
  const [couponCode, setCouponCode] = useState('')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="核销操作" description="扫描市民券二维码或手动输入券码进行核销" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex flex-col items-center gap-4">
            <div className="w-64 h-64 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 bg-gray-50/50">
              <ScanLine className="w-16 h-16 text-gray-300" />
              <p className="text-sm text-[#6B7A99]">请将市民券二维码对准扫描区域</p>
            </div>
            <div className="flex gap-3 w-full justify-center">
              {terminalTypes.map((t, i) => (
                <button
                  key={t.label}
                  onClick={() => setActiveTerminal(i)}
                  className={cn(
                    'flex-1 max-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border',
                    activeTerminal === i ? t.active + ' border-transparent' : 'bg-white text-gray-600 border-border hover:bg-gray-50'
                  )}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">手动输入券码</h3>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="请输入券码编号"
                className="flex-1 px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                核销
              </button>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">最近核销记录</h3>
            <div className="space-y-2.5">
              {recentRecords.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{r.couponName}</div>
                    <div className="text-xs text-[#6B7A99]">{r.citizenName} · {r.time}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium">¥{r.amount}</span>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
