import { useState } from 'react'
import { Star, User, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

const mockOrder = {
  id: '1',
  orderNo: 'WO-20260610-001',
  category: '水电',
  description: '3号楼2单元501水管漏水严重，厨房顶棚持续滴水，已放置接水盆',
  urgency: 'critical' as const,
  status: 'processing' as const,
  reporterName: '张三',
  assigneeName: '维修工-王师傅',
  createdAt: '2026-06-10 09:30:00',
  updatedAt: '2026-06-10 10:15:00',
}

const timeline = [
  { time: '2026-06-10 09:30', label: '工单创建', status: 'completed' as const },
  { time: '2026-06-10 09:45', label: '已派单给 王师傅', status: 'completed' as const },
  { time: '2026-06-10 10:15', label: '王师傅开始处理', status: 'current' as const },
  { time: '', label: '处理完成', status: 'pending' as const },
  { time: '', label: '居民反馈', status: 'pending' as const },
]

const feedbacks = [
  { id: '1', author: '王师傅', content: '已到达现场，确认是管道接口老化导致漏水，正在更换管件', time: '2026-06-10 10:20', images: [] },
]

export default function RepairDetail() {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  return (
    <div className="space-y-6">
      <PageHeader
        title={`工单 ${mockOrder.orderNo}`}
        actions={<StatusBadge status={mockOrder.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">处理进度</h3>
            <div className="space-y-0">
              {timeline.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                      step.status === 'completed' ? 'bg-emerald-500' : step.status === 'current' ? 'bg-blue-500' : 'bg-slate-200'
                    )}>
                      {step.status === 'completed' ? <CheckCircle size={14} className="text-white" /> :
                       step.status === 'current' ? <ArrowRight size={14} className="text-white" /> :
                       <span className="w-2 h-2 rounded-full bg-slate-400" />}
                    </div>
                    {i < timeline.length - 1 && (
                      <div className={cn('w-0.5 h-10', step.status === 'completed' ? 'bg-emerald-300' : 'bg-slate-200')} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={cn('text-sm font-medium', step.status === 'pending' ? 'text-slate-400' : 'text-slate-700')}>
                      {step.label}
                    </p>
                    {step.time && <p className="text-xs text-slate-400 mt-0.5">{step.time}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">工单信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400">工单号</span>
                <p className="text-sm font-mono text-slate-700 mt-0.5">{mockOrder.orderNo}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">分类</span>
                <p className="text-sm text-slate-700 mt-0.5">{mockOrder.category}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">紧急度</span>
                <div className="mt-0.5"><StatusBadge status={mockOrder.urgency} /></div>
              </div>
              <div>
                <span className="text-xs text-slate-400">报修人</span>
                <p className="text-sm text-slate-700 mt-0.5 flex items-center gap-1"><User size={14} />{mockOrder.reporterName}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">处理人</span>
                <p className="text-sm text-slate-700 mt-0.5">{mockOrder.assigneeName}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">创建时间</span>
                <p className="text-sm text-slate-700 mt-0.5 flex items-center gap-1"><Clock size={14} />{mockOrder.createdAt}</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-slate-400">问题描述</span>
                <p className="text-sm text-slate-700 mt-0.5">{mockOrder.description}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">处理反馈</h3>
            {feedbacks.map((fb) => (
              <div key={fb.id} className="flex gap-3 py-3 border-b border-slate-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-medium shrink-0">
                  {fb.author[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">{fb.author}</span>
                    <span className="text-xs text-slate-400">{fb.time}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{fb.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">工单评价</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-2">评分</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)} className="p-0.5">
                      <Star size={24} className={cn(rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1.5">评价内容</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="请输入您的评价"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <button className="h-9 px-6 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
                提交评价
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
