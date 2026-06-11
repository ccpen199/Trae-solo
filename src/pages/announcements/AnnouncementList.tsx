import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'

const mockAnnouncements = [
  { id: '1', title: '关于电梯年度检修的通知', priority: 'important' as const, pushScope: ['1号楼', '2号楼', '3号楼'], status: 'published' as const, publishedAt: '2026-06-10 09:00', readRate: 72 },
  { id: '2', title: '社区端午活动安排', priority: 'normal' as const, pushScope: ['全社区'], status: 'published' as const, publishedAt: '2026-06-08 14:00', readRate: 85 },
  { id: '3', title: '物业费缴纳截止提醒', priority: 'urgent' as const, pushScope: ['未缴费住户'], status: 'published' as const, publishedAt: '2026-06-06 10:00', readRate: 63 },
  { id: '4', title: '地下车库消防演练通知', priority: 'important' as const, pushScope: ['有车位住户'], status: 'draft' as const, publishedAt: '', readRate: 0 },
  { id: '5', title: '社区健身房开放时间调整', priority: 'normal' as const, pushScope: ['全社区'], status: 'archived' as const, publishedAt: '2026-05-20 08:00', readRate: 91 },
]

export default function AnnouncementList() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = mockAnnouncements.filter((a) => {
    if (statusFilter && a.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="公告管理"
        actions={
          <button
            onClick={() => navigate('/announcements/create')}
            className="h-9 px-4 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
          >
            <Plus size={16} />发布公告
          </button>
        }
      />

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">标题</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">优先级</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">推送范围</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">状态</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">发布时间</th>
                <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">阅读率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-800 font-medium">{a.title}</td>
                  <td className="px-5 py-3"><StatusBadge status={a.priority} /></td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {a.pushScope.map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-3 text-sm text-slate-600">{a.publishedAt || '-'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${a.readRate}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{a.readRate}%</span>
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
