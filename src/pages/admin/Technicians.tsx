import { useState } from 'react'
import { Search, Filter, Star, Eye, CheckCircle, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

interface Technician {
  id: string
  name: string
  phone: string
  skills: string[]
  rating: number
  status: string
  avatar: string
}

const mockTechnicians: Technician[] = [
  { id: 'T001', name: '张伟', phone: '138****1234', skills: ['手机维修', '平板维修'], rating: 4.9, status: 'approved', avatar: '张' },
  { id: 'T002', name: '李明', phone: '139****5678', skills: ['笔记本维修', '台式机'], rating: 4.8, status: 'approved', avatar: '李' },
  { id: 'T003', name: '王强', phone: '137****9012', skills: ['手机维修'], rating: 4.5, status: 'reviewing', avatar: '王' },
  { id: 'T004', name: '赵刚', phone: '136****3456', skills: ['智能穿戴'], rating: 3.8, status: 'rejected', avatar: '赵' },
  { id: 'T005', name: '陈磊', phone: '135****7890', skills: ['手机维修', '笔记本维修'], rating: 4.7, status: 'suspended', avatar: '陈' },
]

const statusFilters = [
  { label: '全部', value: '' },
  { label: '审核中', value: 'reviewing' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '已暂停', value: 'suspended' },
]

export default function Technicians() {
  const [statusFilter, setStatusFilter] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [search, setSearch] = useState('')
  const [auditTech, setAuditTech] = useState<Technician | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const filtered = mockTechnicians.filter((tech) => {
    if (statusFilter && tech.status !== statusFilter) return false
    if (skillFilter && !tech.skills.some((s) => s.includes(skillFilter))) return false
    if (search && !tech.name.includes(search) && !tech.phone.includes(search)) return false
    return true
  })

  return (
    <div className="animate-fade-in">
      <h1 className="font-title text-2xl font-bold text-white">技师管理</h1>
      <p className="mt-1 text-gray-400">审核和管理平台认证技师</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg bg-surface p-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                statusFilter === f.value ? 'bg-accent text-primary' : 'text-gray-400 hover:text-white',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          placeholder="技能筛选..."
          className="rounded-lg border border-gray-700 bg-surface px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none"
        />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索姓名或手机号..."
            className="w-full rounded-lg border border-gray-700 bg-surface py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-700 bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left font-medium text-gray-400">技师</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">手机号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">技能</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">评分</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tech) => (
              <tr key={tech.id} className="border-b border-gray-700/50 hover:bg-surface-light/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
                      {tech.avatar}
                    </div>
                    <span className="font-medium text-white">{tech.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-400">{tech.phone}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {tech.skills.map((s) => (
                      <span key={s} className="rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-alert">
                    <Star className="h-3.5 w-3.5 fill-current" />{tech.rating}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={tech.status} />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setAuditTech(tech)}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                  >
                    <Eye className="h-3.5 w-3.5" />审核
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {auditTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-title text-lg font-semibold text-white">技师审核</h3>
              <button onClick={() => setAuditTech(null)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-primary p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-lg font-bold text-accent">
                    {auditTech.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-white">{auditTech.name}</p>
                    <p className="text-sm text-gray-400">{auditTech.phone}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {auditTech.skills.map((s) => (
                    <span key={s} className="rounded bg-accent/10 px-2 py-0.5 text-xs text-accent">{s}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-primary p-4">
                <p className="text-sm font-medium text-gray-400">资质证书</p>
                <div className="mt-2 h-32 rounded-lg bg-gray-700/50 flex items-center justify-center text-gray-500">
                  证书预览区域
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">驳回原因</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="如驳回，请填写原因..."
                  className="w-full rounded-lg border border-gray-700 bg-primary px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none"
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setAuditTech(null)}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-accent py-2.5 font-medium text-primary transition-all hover:opacity-90"
              >
                <CheckCircle className="h-4 w-4" />通过
              </button>
              <button
                onClick={() => setAuditTech(null)}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-500/50 py-2.5 font-medium text-red-400 transition-all hover:bg-red-500/10"
              >
                <XCircle className="h-4 w-4" />驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
