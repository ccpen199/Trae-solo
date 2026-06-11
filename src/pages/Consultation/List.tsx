import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Filter, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import ConsultationCard from '@/components/ConsultationCard'
import Empty from '@/components/Empty'
import { useConsultationStore } from '@/store/useConsultationStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { ConsultationStatus, LegalCaseType, Consultation } from '@/types'

type TabKey = 'all' | 'pending' | 'in_progress' | 'completed'

const tabs: { key: TabKey; label: string; status?: ConsultationStatus }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待分派', status: 'pending' },
  { key: 'in_progress', label: '进行中', status: 'in_progress' },
  { key: 'completed', label: '已结案', status: 'completed' },
]

const caseTypeFilter: { value: LegalCaseType | ''; label: string }[] = [
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

export default function List() {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { consultations, fetchConsultations } = useConsultationStore()

  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [searchText, setSearchText] = useState('')
  const [caseType, setCaseType] = useState<LegalCaseType | ''>('')
  const [showFilter, setShowFilter] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return
      setLoading(true)
      if (currentUser.role === 'lawyer') {
        await fetchConsultations(undefined, currentUser.id)
      } else {
        await fetchConsultations(currentUser.id)
      }
      setLoading(false)
    }
    load()
  }, [currentUser, fetchConsultations])

  const filteredList = useMemo(() => {
    let list = consultations
    const currentTab = tabs.find((t) => t.key === activeTab)
    if (currentTab?.status) {
      list = list.filter((c) => c.status === currentTab.status)
    } else if (activeTab === 'in_progress') {
      list = list.filter((c) => c.status === 'dispatched' || c.status === 'in_progress')
    }
    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(keyword) ||
          c.description.toLowerCase().includes(keyword)
      )
    }
    if (caseType) {
      list = list.filter((c) => c.caseType === caseType)
    }
    return list
  }, [consultations, activeTab, searchText, caseType])

  const handleCardClick = (c: Consultation) => {
    navigate(`/consultation/${c.id}`)
  }

  const tabCounts = useMemo(() => {
    return {
      all: consultations.length,
      pending: consultations.filter((c) => c.status === 'pending').length,
      in_progress: consultations.filter(
        (c) => c.status === 'dispatched' || c.status === 'in_progress'
      ).length,
      completed: consultations.filter((c) => c.status === 'completed').length,
    }
  }, [consultations])

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-slate-50">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold text-slate-800">我的咨询</h1>
          <button
            onClick={() => navigate('/consultation/submit')}
            className="flex h-9 items-center gap-1 rounded-lg bg-blue-500 px-3 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            发起咨询
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 pb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索咨询标题或内容"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
              showFilter
                ? 'border-blue-500 bg-blue-50 text-blue-500'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            )}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {showFilter && (
          <div className="border-t border-slate-100 px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {caseTypeFilter.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCaseType(opt.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    caseType === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex border-t border-slate-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative flex-1 py-3 text-sm font-medium transition-colors',
                activeTab === tab.key ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
              {tabCounts[tab.key] > 0 && (
                <span
                  className={cn(
                    'ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs',
                    activeTab === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {tabCounts[tab.key]}
                </span>
              )}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : filteredList.length > 0 ? (
          filteredList.map((c) => (
            <ConsultationCard
              key={c.id}
              consultation={c}
              onClick={handleCardClick}
            />
          ))
        ) : (
          <div className="py-16">
            <div className="mx-auto flex max-w-xs flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                <FileText className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="mb-1 text-base font-medium text-slate-600">暂无咨询记录</h3>
              <p className="mb-4 text-sm text-slate-400">
                {searchText || caseType
                  ? '没有找到符合条件的咨询，请调整筛选条件'
                  : '发起您的第一个法律咨询，获取专业律师帮助'}
              </p>
              {!searchText && !caseType && (
                <button
                  onClick={() => navigate('/consultation/submit')}
                  className="flex h-10 items-center gap-1 rounded-lg bg-blue-500 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  发起咨询
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
