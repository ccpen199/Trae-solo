import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, FolderKanban } from 'lucide-react'
import ConsultationCard from '@/components/ConsultationCard'
import { useConsultationStore } from '@/store/useConsultationStore'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'
import { caseTypeMap } from '@/utils/format'
import type { Consultation, ConsultationStatus, LegalCaseType, Lawyer } from '@/types'

type TabType = 'in_progress' | 'dispatched' | 'completed'

interface TabItem {
  key: TabType
  label: string
  status: ConsultationStatus[]
}

const tabs: TabItem[] = [
  { key: 'in_progress', label: '进行中', status: ['in_progress'] },
  { key: 'dispatched', label: '待确认', status: ['dispatched'] },
  { key: 'completed', label: '已结案', status: ['completed'] },
]

const caseTypeOptions: { value: LegalCaseType | ''; label: string }[] = [
  { value: '', label: '全部案由' },
  { value: 'marriage', label: '婚姻家庭' },
  { value: 'labor', label: '劳动纠纷' },
  { value: 'debt', label: '债务纠纷' },
  { value: 'property', label: '房产纠纷' },
  { value: 'contract', label: '合同纠纷' },
  { value: 'traffic', label: '交通事故' },
  { value: 'criminal', label: '刑事辩护' },
  { value: 'other', label: '其他' },
]

export default function LawyerCases() {
  const navigate = useNavigate()
  const { consultations, fetchConsultations } = useConsultationStore()
  const { currentUser } = useAuthStore()
  const lawyer = currentUser as Lawyer

  const [activeTab, setActiveTab] = useState<TabType>('in_progress')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedType, setSelectedType] = useState<LegalCaseType | ''>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (lawyer) {
      setIsLoading(true)
      fetchConsultations(undefined, lawyer.id).finally(() => setIsLoading(false))
    }
  }, [lawyer, fetchConsultations])

  const filteredCases = useMemo(() => {
    const activeTabConfig = tabs.find((t) => t.key === activeTab)
    if (!activeTabConfig) return []

    return consultations.filter((c) => {
      if (c.lawyerId !== lawyer?.id) return false
      if (!activeTabConfig.status.includes(c.status)) return false
      if (selectedType && c.caseType !== selectedType) return false
      if (
        searchKeyword &&
        !c.title.includes(searchKeyword) &&
        !c.description.includes(searchKeyword)
      ) {
        return false
      }
      return true
    })
  }, [consultations, activeTab, selectedType, searchKeyword, lawyer?.id])

  const getCaseCount = (tabKey: TabType) => {
    const tabConfig = tabs.find((t) => t.key === tabKey)
    if (!tabConfig) return 0
    return consultations.filter(
      (c) => c.lawyerId === lawyer?.id && tabConfig.status.includes(c.status)
    ).length
  }

  const handleCardClick = (consultation: Consultation) => {
    navigate(`/consultation/${consultation.id}`)
  }

  return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">我的案件</h1>
          <p className="text-slate-500 mt-1">管理您承接的所有咨询案件</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center border-b border-slate-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'relative flex-1 px-6 py-4 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'text-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  {tab.label}
                  <span
                    className={cn(
                      'inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs',
                      activeTab === tab.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {getCaseCount(tab.key)}
                  </span>
                </span>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索案件标题或描述..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent placeholder:text-slate-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as LegalCaseType | '')}
                  className="px-4 py-2.5 bg-slate-50 border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent appearance-none cursor-pointer pr-10"
                >
                  {caseTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-5">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 rounded-xl bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredCases.length > 0 ? (
              <div className="space-y-3">
                {filteredCases.map((consultation) => (
                  <ConsultationCard
                    key={consultation.id}
                    consultation={consultation}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <FolderKanban className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500 mb-1">
                  {activeTab === 'in_progress'
                    ? '暂无进行中的案件'
                    : activeTab === 'dispatched'
                    ? '暂无待确认的案件'
                    : '暂无已结案的案件'}
                </p>
                {activeTab === 'in_progress' && (
                  <button
                    onClick={() => navigate('/lawyer/grab')}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-1"
                  >
                    去抢单大厅看看
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  )
}
