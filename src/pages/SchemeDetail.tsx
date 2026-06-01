import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Scheme } from '@/types'
import { useSchemesStore, schemeStatusLabels } from '@/store/schemes'
import BasicInfo from '@/components/SchemeDetail/BasicInfo'
import ProcessReview from '@/components/SchemeDetail/ProcessReview'
import DecisionRecords from '@/components/SchemeDetail/DecisionRecords'
import ChangeManagement from '@/components/SchemeDetail/ChangeManagement'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  in_review: 'bg-blue-100 text-blue-600',
  approved: 'bg-green-100 text-green-600',
  rejected: 'bg-red-100 text-red-600',
  archived: 'bg-gray-100 text-gray-600',
}

const tabs = [
  { key: 'basic', label: '基本信息' },
  { key: 'process', label: '流程评审' },
  { key: 'decisions', label: '决策记录' },
  { key: 'changes', label: '变更管理' },
]

export default function SchemeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentScheme, fetchScheme, updateScheme } = useSchemesStore()
  const [activeTab, setActiveTab] = useState('basic')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      setLoading(true)
      fetchScheme(parseInt(id)).finally(() => setLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleUpdateScheme = async (data: Partial<Scheme>) => {
    if (id) {
      await updateScheme(parseInt(id), data)
    }
  }

  if (loading || !currentScheme) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return <BasicInfo scheme={currentScheme} onUpdate={handleUpdateScheme} />
      case 'process':
        return <ProcessReview schemeId={currentScheme.id} />
      case 'decisions':
        return <DecisionRecords schemeId={currentScheme.id} />
      case 'changes':
        return <ChangeManagement schemeId={currentScheme.id} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/schemes')}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{currentScheme.name}</h1>
            <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', statusColors[currentScheme.status])}>
              {schemeStatusLabels[currentScheme.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border-b border-gray-200">
        <div className="flex gap-1 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-5 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-[#e8723a] text-[#e8723a]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {renderTabContent()}
    </div>
  )
}
