import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

interface Complaint {
  id: string
  orderId: string
  priority: string
  type: string
  status: string
  description: string
  customer: string
  createdAt: string
}

const mockComplaints: Complaint[] = [
  { id: 'CMP-001', orderId: 'ORD-20240101', priority: 'urgent', type: '维修质量', status: 'open', description: '更换屏幕后出现触摸失灵', customer: '王先生', createdAt: '2024-01-15 14:30' },
  { id: 'CMP-002', orderId: 'ORD-20240102', priority: 'high', type: '态度问题', status: 'investigating', description: '技师态度恶劣，未按约定时间到场', customer: '李女士', createdAt: '2024-01-15 11:20' },
  { id: 'CMP-003', orderId: 'ORD-20240103', priority: 'medium', type: '价格争议', status: 'processing', description: '实际收费与预估价格不符', customer: '张先生', createdAt: '2024-01-14 16:45' },
  { id: 'CMP-004', orderId: 'ORD-20240104', priority: 'low', type: '配件问题', status: 'arbitrating', description: '更换的配件疑似非原装', customer: '赵先生', createdAt: '2024-01-13 09:15' },
  { id: 'CMP-005', orderId: 'ORD-20240105', priority: 'medium', type: '维修质量', status: 'closed', description: '维修后设备仍存在故障', customer: '刘女士', createdAt: '2024-01-12 08:30' },
]

const steps = ['受理', '调查', '处理', '仲裁', '关闭']
const stepStatuses: Record<string, number> = {
  open: 0,
  investigating: 1,
  processing: 2,
  arbitrating: 3,
  closed: 4,
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-400',
}

export default function Complaints() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [resultInput, setResultInput] = useState('')

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-title text-2xl font-bold text-white">投诉处理</h1>
      <p className="mt-1 text-gray-400">处理客户投诉和争议</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-3">
          {mockComplaints.map((complaint) => (
            <div
              key={complaint.id}
              className="rounded-lg border border-gray-700 bg-surface transition-all hover:border-gray-600"
            >
              <button
                onClick={() => toggleExpand(complaint.id)}
                className="flex w-full items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-4">
                  <span className={`h-2.5 w-2.5 rounded-full ${priorityColors[complaint.priority]}`} />
                  <span className="font-mono text-sm text-accent">{complaint.id}</span>
                  <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">{complaint.type}</span>
                  <StatusBadge status={complaint.priority} />
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={complaint.status} />
                  <a
                    href={`/order/${complaint.orderId}`}
                    className="text-gray-400 hover:text-accent"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {expandedId === complaint.id ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedId === complaint.id && (
                <div className="border-t border-gray-700 px-5 py-4">
                  <p className="text-sm text-gray-300">{complaint.description}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>客户: {complaint.customer}</span>
                    <span>关联订单: <span className="text-blue-400">{complaint.orderId}</span></span>
                    <span>创建时间: {complaint.createdAt}</span>
                  </div>
                  <button
                    onClick={() => setSelectedComplaint(complaint)}
                    className="mt-3 rounded-lg bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/20"
                  >
                    处理此投诉
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedComplaint ? (
            <div className="rounded-lg border border-gray-700 bg-surface p-6">
              <h3 className="font-title text-lg font-semibold text-white">处理面板</h3>
              <p className="mt-1 text-sm text-gray-400">{selectedComplaint.id} - {selectedComplaint.type}</p>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  {steps.map((step, i) => {
                    const currentStep = stepStatuses[selectedComplaint.status]
                    const isCompleted = i < currentStep
                    const isCurrent = i === currentStep
                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                          isCompleted ? 'bg-accent text-primary' :
                          isCurrent ? 'border-2 border-accent bg-accent/10 text-accent' :
                          'border border-gray-600 text-gray-500',
                        )}>
                          {i + 1}
                        </div>
                        <span className={cn(
                          'mt-1.5 text-xs',
                          isCompleted || isCurrent ? 'text-accent' : 'text-gray-500',
                        )}>
                          {step}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-1 block text-sm font-medium text-gray-400">处理结果</label>
                <textarea
                  value={resultInput}
                  onChange={(e) => setResultInput(e.target.value)}
                  placeholder="填写处理结果..."
                  className="w-full rounded-lg border border-gray-700 bg-primary px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none"
                  rows={4}
                />
              </div>

              <div className="mt-4 flex gap-3">
                {selectedComplaint.status === 'open' && (
                  <button className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-primary hover:opacity-90">
                    受理
                  </button>
                )}
                {selectedComplaint.status === 'investigating' && (
                  <button className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-primary hover:opacity-90">
                    提交处理方案
                  </button>
                )}
                {selectedComplaint.status === 'processing' && (
                  <>
                    <button className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-primary hover:opacity-90">
                      完成处理
                    </button>
                    <button className="flex-1 rounded-lg border border-orange-500/50 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/10">
                      转仲裁
                    </button>
                  </>
                )}
                {selectedComplaint.status === 'arbitrating' && (
                  <button className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-primary hover:opacity-90">
                    仲裁结果
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-gray-700 bg-surface">
              <p className="text-gray-500">选择一个投诉进行处理</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
