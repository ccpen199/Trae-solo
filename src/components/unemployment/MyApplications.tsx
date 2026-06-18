import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ChevronRight, Filter } from 'lucide-react'
import { type ApplicationRecord, type ApplicationStatus, statusLabels, statusColors, subsidyTypeLabels } from './data'

interface MyApplicationsProps {
  applications: ApplicationRecord[]
  onViewDetail: (app: ApplicationRecord) => void
}

const filterTabs: { key: ApplicationStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'reviewing', label: '审核中' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已拒绝' },
  { key: 'supplement', label: '待补充' },
]

export default function MyApplications({ applications, onViewDetail }: MyApplicationsProps) {
  const [activeFilter, setActiveFilter] = useState<ApplicationStatus | 'all'>('all')

  const filteredApplications = applications.filter((app) => {
    if (activeFilter === 'all') return true
    return app.status === activeFilter
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: '#86909C' }} />
          <span className="text-sm font-medium" style={{ color: '#4E5969' }}>筛选</span>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap bg-gray-100 rounded-lg p-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex-1 min-w-[60px] py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeFilter === tab.key
                ? 'bg-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{ color: activeFilter === tab.key ? '#165DFF' : undefined }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div layout className="space-y-3">
          {filteredApplications.map((app) => (
            <motion.div
              key={app.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs" style={{ color: '#86909C' }}>申领编号</p>
                  <p className="text-sm font-semibold" style={{ color: '#1D2129' }}>{app.applicationNo}</p>
                </div>
                <span
                  className="px-2.5 py-1 text-xs font-medium rounded-full"
                  style={{
                    backgroundColor: statusColors[app.status] + '15',
                    color: statusColors[app.status],
                  }}
                >
                  {statusLabels[app.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs" style={{ color: '#86909C' }}>补贴类型</p>
                  <p className="text-sm font-medium" style={{ color: '#4E5969' }}>
                    {subsidyTypeLabels[app.subsidyType]}
                  </p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: '#86909C' }}>申请日期</p>
                  <p className="text-sm" style={{ color: '#4E5969' }}>{app.applyDate}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #F2F3F5' }}>
                <div className="flex items-center gap-1">
                  <FileText size={14} style={{ color: '#165DFF' }} />
                  <span className="text-sm font-bold" style={{ color: '#165DFF' }}>
                    ¥{app.totalAmount.toLocaleString()}
                  </span>
                  <span className="text-xs" style={{ color: '#86909C' }}>
                    （{app.months > 0 ? `${app.months}个月` : '---'}）
                  </span>
                </div>
                <button
                  onClick={() => onViewDetail(app)}
                  className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
                  style={{ color: '#165DFF' }}
                >
                  查看详情
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} style={{ color: '#E5E6EB' }} className="mx-auto mb-3" />
          <p className="text-sm" style={{ color: '#86909C' }}>暂无申领记录</p>
        </div>
      )}
    </div>
  )
}
