import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import StatusBadge from '@/components/StatusBadge'
import { Smartphone, Users, AlertTriangle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const IMEI_MAP: Record<string, string> = {
  re001: 'IMEI-890123',
  re004: 'IMEI-445678',
  re007: 'IMEI-778899',
}

export default function DeviceMonitor() {
  const { riskEvents } = useStore()
  const [expanded, setExpanded] = useState<string | null>(null)

  const deviceEvents = useMemo(
    () => riskEvents.filter((e) => e.type === 'device_multi_account'),
    [riskEvents]
  )

  const flaggedCount = deviceEvents.filter((e) => e.status !== 'resolved').length

  return (
    <div>
      <PageHeader title="设备多账户监控" description="检测同设备多账户领券核销行为" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">监控设备数</p>
              <p className="text-xl font-bold text-primary">{deviceEvents.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">标记设备数</p>
              <p className="text-xl font-bold text-primary">{flaggedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {deviceEvents.map((event) => {
          const imei = IMEI_MAP[event.id] || `IMEI-${event.id.slice(-6)}`
          const isExpanded = expanded === event.id

          return (
            <Card key={event.id} className={cn(event.level === 'critical' && 'border-red-200 bg-red-50/20')}>
              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : event.id)}
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  event.level === 'critical' ? 'bg-red-100' : event.level === 'high' ? 'bg-orange-100' : 'bg-yellow-100'
                )}>
                  <Smartphone className={cn(
                    'w-5 h-5',
                    event.level === 'critical' ? 'text-red-600' : event.level === 'high' ? 'text-orange-600' : 'text-yellow-600'
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-primary">{imei}</span>
                    <StatusBadge status={event.level} />
                    <StatusBadge status={event.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#6B7A99]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {event.accounts.length} 个关联账户
                    </span>
                    <span>{event.detectedAt}</span>
                  </div>
                </div>

                <ExternalLink className={cn(
                  'w-4 h-4 text-[#6B7A99] transition-transform',
                  isExpanded && 'rotate-90'
                )} />
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-[#6B7A99] mb-2">关联账户列表</p>
                  <div className="flex flex-wrap gap-2">
                    {event.accounts.map((acc) => (
                      <span key={acc} className="px-2 py-1 rounded bg-gray-100 text-xs font-mono text-primary">
                        {acc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
