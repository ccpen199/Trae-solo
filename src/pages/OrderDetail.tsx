import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, Clock, Play, Lock, Unlock, AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApi } from '@/hooks/useApi'

const timelineNodes = [
  { key: 'pending', label: '待接单' },
  { key: 'accepted', label: '已接单' },
  { key: 'arrived', label: '已到场' },
  { key: 'repairing', label: '维修中' },
  { key: 'inspecting', label: '待验收' },
  { key: 'completed', label: '已完工' },
]

const mockParts = [
  { code: 'PTH-20240101-001', name: 'iPhone 15 Pro 屏幕总成', warehouse: '华东仓', batch: 'B2024010', status: 'bound' },
  { code: 'PTH-20240101-002', name: '密封胶条', warehouse: '华东仓', batch: 'B2024008', status: 'in_stock' },
]

const mockVideos = [
  { id: 'v1', label: '拆机前', time: '14:30', duration: '02:15' },
  { id: 'v2', label: '维修过程', time: '14:45', duration: '15:30' },
  { id: 'v3', label: '维修完成', time: '15:10', duration: '01:45' },
]

export default function OrderDetail() {
  const { id } = useParams()
  const { request, loading } = useApi()
  const [currentStatus, setCurrentStatus] = useState('repairing')
  const [escrowUnlocked, setEscrowUnlocked] = useState(false)

  const currentIndex = timelineNodes.findIndex((n) => n.key === currentStatus)

  return (
    <div className="min-h-screen bg-surface-light px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-title text-3xl font-bold text-primary">订单详情</h1>
            <p className="mt-1 text-gray-500">订单号: {id}</p>
          </div>
          <span className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium',
            'bg-purple-100 text-purple-700',
          )}>
            维修中
          </span>
        </div>

        <div className="mt-8 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="font-title text-lg font-semibold text-primary">维修进度</h3>
          <div className="mt-6 flex items-start">
            {timelineNodes.map((node, index) => {
              const isCompleted = index < currentIndex
              const isCurrent = index === currentIndex
              return (
                <div key={node.key} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {index > 0 && (
                      <div className={cn(
                        'h-0.5 flex-1',
                        index <= currentIndex ? 'bg-accent' : 'bg-gray-200',
                      )} />
                    )}
                    <div className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                      isCompleted ? 'border-accent bg-accent text-white' :
                      isCurrent ? 'border-accent bg-accent/10 text-accent animate-pulse-slow' :
                      'border-gray-200 bg-white text-gray-400',
                    )}>
                      {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                    </div>
                    {index < timelineNodes.length - 1 && (
                      <div className={cn(
                        'h-0.5 flex-1',
                        index < currentIndex ? 'bg-accent' : 'bg-gray-200',
                      )} />
                    )}
                  </div>
                  <span className={cn(
                    'mt-2 text-xs font-medium whitespace-nowrap',
                    isCompleted || isCurrent ? 'text-accent' : 'text-gray-400',
                  )}>
                    {node.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="font-title text-lg font-semibold text-primary">视频取证</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {mockVideos.map((video) => (
                <div key={video.id} className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="flex aspect-video items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-all group-hover:bg-white/30">
                      <Play className="h-5 w-5 fill-current" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs font-medium text-white">{video.label}</p>
                    <p className="text-xs text-white/60">{video.time} · {video.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="font-title text-lg font-semibold text-primary">配件溯源</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-2 text-left font-medium text-gray-500">溯源码</th>
                    <th className="pb-2 text-left font-medium text-gray-500">名称</th>
                    <th className="pb-2 text-left font-medium text-gray-500">仓库</th>
                    <th className="pb-2 text-left font-medium text-gray-500">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {mockParts.map((part) => (
                    <tr key={part.code} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 font-mono text-xs text-accent">{part.code}</td>
                      <td className="py-2.5 text-gray-700">{part.name}</td>
                      <td className="py-2.5 text-gray-500">{part.warehouse}</td>
                      <td className="py-2.5">
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          part.status === 'bound' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700',
                        )}>
                          {part.status === 'bound' ? '已绑定' : '库存充足'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="font-title text-lg font-semibold text-primary">资金托管</h3>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex h-14 w-14 items-center justify-center rounded-xl',
                escrowUnlocked ? 'bg-accent/10' : 'bg-alert/10',
              )}>
                {escrowUnlocked ? (
                  <Unlock className="h-7 w-7 text-accent" />
                ) : (
                  <Lock className="h-7 w-7 text-alert" />
                )}
              </div>
              <div>
                <p className="font-title text-2xl font-bold text-primary">¥599.00</p>
                <p className="text-sm text-gray-500">
                  {escrowUnlocked ? '验收解冻 - 资金已释放' : '定金冻结 - 待验收解冻'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium',
                  !escrowUnlocked ? 'bg-alert/10 text-alert' : 'bg-gray-100 text-gray-500',
                )}>
                  <Lock className="h-3 w-3" />定金冻结
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300" />
                <span className={cn(
                  'flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium',
                  escrowUnlocked ? 'bg-accent/10 text-accent' : 'bg-gray-100 text-gray-500',
                )}>
                  <Unlock className="h-3 w-3" />验收解冻
                </span>
              </div>
              <button className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                发起争议
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
