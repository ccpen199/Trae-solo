import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ClipboardList, Loader2, CheckCircle, FileWarning,
  Tag, ChevronRight, Inbox
} from 'lucide-react'
import api from '@/lib/api'
import type { HouseholdBiz } from '../../shared/types'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
  submitted: { label: '已提交', color: 'bg-blue-100 text-blue-700' },
  reviewing: { label: '审核中', color: 'bg-yellow-100 text-yellow-700' },
  material: { label: '待补材料', color: 'bg-orange-100 text-orange-700' },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-600' },
  completed: { label: '已完成', color: 'bg-emerald-100 text-emerald-700' },
}

const TYPE_MAP: Record<string, { label: string; color: string }> = {
  settle: { label: '落户', color: 'bg-purple-100 text-purple-700' },
  residence: { label: '居住证', color: 'bg-blue-100 text-blue-700' },
  newborn: { label: '新生儿', color: 'bg-pink-100 text-pink-700' },
}

function StatCard({ icon, label, count, color }: {
  icon: React.ReactNode; label: string; count: number; color: string
}) {
  return (
    <div className={`rounded-xl p-4 ${color} shadow-sm`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-bold">{count}</p>
    </div>
  )
}

export default function TrackingCenter() {
  const [list, setList] = useState<HouseholdBiz[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<HouseholdBiz[]>('/household/list')
      .then((res) => setList(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: list.length,
    processing: list.filter((b) => ['submitted', 'reviewing'].includes(b.status)).length,
    completed: list.filter((b) => b.status === 'completed').length,
    material: list.filter((b) => b.status === 'material').length,
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <h1 className="text-xl font-bold text-text-dark mb-4">事项办理中心</h1>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<ClipboardList className="w-4 h-4" />}
          label="全部"
          count={stats.total}
          color="bg-blue-50 text-primary"
        />
        <StatCard
          icon={<Loader2 className="w-4 h-4" />}
          label="办理中"
          count={stats.processing}
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          icon={<CheckCircle className="w-4 h-4" />}
          label="已完成"
          count={stats.completed}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={<FileWarning className="w-4 h-4" />}
          label="待补材料"
          count={stats.material}
          color="bg-orange-50 text-orange-600"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-16 text-text-muted animate-slideUp">
          <Inbox className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">暂无办理事项</p>
          <p className="text-sm mb-4">您可以前往户籍办理提交新业务</p>
          <Link
            to="/household"
            className="inline-flex items-center gap-1 text-primary text-sm hover:underline"
          >
            前往办理 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((biz) => {
            const activeStep = biz.steps.find((s) => s.status === 'active')
            const st = STATUS_MAP[biz.status] || STATUS_MAP.draft
            const tp = TYPE_MAP[biz.type] || { label: biz.type, color: 'bg-gray-100 text-gray-600' }

            return (
              <div
                key={biz.id}
                onClick={() => navigate(`/household/progress/${biz.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer animate-slideUp"
              >
                <span className={`shrink-0 px-2 py-1 rounded-lg text-xs font-medium ${tp.color}`}>
                  {tp.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-dark truncate">{biz.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                    {activeStep && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        当前：{activeStep.name}
                      </span>
                    )}
                    {biz.submittedAt && <span>提交：{biz.submittedAt}</span>}
                  </div>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${st.color}`}>
                  {st.label}
                </span>
                <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
