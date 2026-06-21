import { useState, useEffect } from 'react'
import { FileText, MapPin, Clock, Briefcase, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import type { Application, ApplicationStatus } from '@/../shared/types'
import { mockApplications } from '@/mock/data'
import { useStore } from '@/store'
import { formatSalary, formatDate, getStatusLabel } from '@/utils/helpers'
import StatusBadge from '@/components/ui/StatusBadge'

const tabs: { key: 'all' | ApplicationStatus; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'viewed', label: '待查看' },
  { key: 'interviewing', label: '面试中' },
  { key: 'accepted', label: '已接受' },
  { key: 'rejected', label: '已拒绝' },
]

const timelineSteps = [
  { key: 'applied', label: '已投递' },
  { key: 'viewed', label: '已查看' },
  { key: 'interviewing', label: '面试中' },
  { key: 'accepted', label: '已录用' },
]

function getStepIndex(status: ApplicationStatus): number {
  return timelineSteps.findIndex((step) => step.key === status)
}

function Timeline({ status }: { status: ApplicationStatus }) {
  const currentIndex = getStepIndex(status)

  return (
    <div className="flex items-center gap-1">
      {timelineSteps.map((step, idx) => (
        <div key={step.key} className="flex items-center">
          <div className="flex flex-col items-center">
            {idx <= currentIndex ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <Circle className="h-4 w-4 text-gray-300" />
            )}
            <span
              className={`mt-1 text-[10px] ${idx <= currentIndex ? 'text-success' : 'text-gray-400'}`}
            >
              {step.label}
            </span>
          </div>
          {idx < timelineSteps.length - 1 && (
            <div
              className={`mx-1 h-0.5 w-6 ${idx < currentIndex ? 'bg-success' : 'bg-gray-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default function JobseekerApplications() {
  const { myApplications, setMyApplications } = useStore()
  const [activeTab, setActiveTab] = useState<'all' | ApplicationStatus>('all')

  useEffect(() => {
    setMyApplications(mockApplications.filter((app) => app.userId === 'user-002'))
  }, [setMyApplications])

  const filteredApplications = myApplications.filter((app) => {
    if (activeTab === 'all') return true
    return app.status === activeTab
  })

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">申请记录</h1>
        <p className="mt-1 text-sm text-gray-500">查看您的职位申请进度</p>
      </div>

      <div className="glass mb-6 rounded-2xl p-2">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {tab.label}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`}
              >
                {tab.key === 'all'
                  ? myApplications.length
                  : myApplications.filter((app) => app.status === tab.key).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredApplications.map((app) => (
          <div
            key={app.id}
            className="glass rounded-2xl p-5 transition-shadow hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-lg font-bold text-gray-900">
                    {app.job?.title || '职位'}
                  </h3>
                  <StatusBadge status={app.status} type="application" />
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                  <Briefcase className="h-4 w-4" />
                  <span className="truncate">{app.job?.companyName || '公司'}</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-300" />
            </div>

            {app.job && (
              <div className="mt-3 text-lg font-semibold text-accent">
                {formatSalary(app.job.salaryMin, app.job.salaryMax, app.job.salaryType)}
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {app.job && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {app.job.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                申请时间：{formatDate(app.appliedAt)}
              </span>
            </div>

            <div className="mt-4 overflow-x-auto">
              <Timeline status={app.status} />
            </div>

            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50">
                查看详情
              </button>
              <button className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90">
                查看岗位
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredApplications.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">暂无相关申请记录</p>
          <button className="mt-4 rounded-xl bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90">
            去投递职位
          </button>
        </div>
      )}
    </div>
  )
}
