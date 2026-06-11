import { useMemo } from 'react'
import { useStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import StatusBadge from '@/components/StatusBadge'
import { AlertTriangle, UserX, Shield, Ban } from 'lucide-react'
import { cn } from '@/lib/utils'

function extractCount(desc: string): string {
  const m = desc.match(/(\d+)\s*张/)
  return m ? m[1] : '-'
}

export default function HoardingAlert() {
  const { riskEvents } = useStore()

  const hoardingEvents = useMemo(
    () => riskEvents.filter((e) => e.type === 'hoarding'),
    [riskEvents]
  )

  const totalAccounts = useMemo(
    () => hoardingEvents.reduce((s, e) => s + e.accounts.length, 0),
    [hoardingEvents]
  )

  const pendingCount = hoardingEvents.filter((e) => e.status === 'pending').length

  return (
    <div>
      <PageHeader title="囤券预警" description="检测批量领券与黄牛囤券行为" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">预警事件数</p>
              <p className="text-xl font-bold text-primary">{hoardingEvents.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">涉及账户数</p>
              <p className="text-xl font-bold text-primary">{totalAccounts}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">待处理</p>
              <p className="text-xl font-bold text-primary">{pendingCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-[#6B7A99]">账户ID</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7A99]">领券数量</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7A99]">风险等级</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7A99]">描述</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7A99]">检测时间</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7A99]">状态</th>
                <th className="text-left px-4 py-3 font-medium text-[#6B7A99]">操作</th>
              </tr>
            </thead>
            <tbody>
              {hoardingEvents.map((event) => (
                <tr key={event.id} className="border-b border-border hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs">{event.accounts.join(', ')}</td>
                  <td className="px-4 py-3 font-bold text-primary">{extractCount(event.description)}</td>
                  <td className="px-4 py-3"><StatusBadge status={event.level} /></td>
                  <td className="px-4 py-3 text-[#6B7A99] max-w-[200px] truncate">{event.description}</td>
                  <td className="px-4 py-3 text-xs text-[#6B7A99]">{event.detectedAt}</td>
                  <td className="px-4 py-3"><StatusBadge status={event.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button className={cn('px-2 py-1 rounded text-xs font-medium', 'bg-red-50 text-red-600 hover:bg-red-100')}>
                        <Ban className="w-3 h-3 inline mr-0.5" />冻结
                      </button>
                      <button className={cn('px-2 py-1 rounded text-xs font-medium', 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100')}>
                        <AlertTriangle className="w-3 h-3 inline mr-0.5" />标记
                      </button>
                      <button className={cn('px-2 py-1 rounded text-xs font-medium', 'bg-green-50 text-green-700 hover:bg-green-100')}>
                        <Shield className="w-3 h-3 inline mr-0.5" />解除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
