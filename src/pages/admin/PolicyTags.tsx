import { useState } from 'react'
import PolicyStatsWithPush from '@/components/policy-tags/PolicyStatsWithPush'
import EnhancedPolicyList, { type Policy, mockPolicies } from '@/components/policy-tags/EnhancedPolicyList'
import EnhancedTagSystem from '@/components/policy-tags/EnhancedTagSystem'
import CrowdAssociationMatrix from '@/components/policy-tags/CrowdAssociationMatrix'
import PolicyGraph from '@/components/policy-tags/PolicyGraph'
import PolicyDetailModal from '@/components/policy-tags/PolicyDetailModal'
import TagRecommendModal from '@/components/policy-tags/TagRecommendModal'

const tabs = [
  { key: 'tags', label: '标签体系' },
  { key: 'crowd', label: '人群关联' },
  { key: 'graph', label: '政策图谱' },
] as const

type TabKey = typeof tabs[number]['key']

export default function PolicyTags() {
  const [statusFilter, setStatusFilter] = useState('全部')
  const [tagFilter, setTagFilter] = useState('')
  const [taggingPolicy, setTaggingPolicy] = useState<Policy | null>(null)
  const [detailPolicy, setDetailPolicy] = useState<Policy | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('tags')

  const legacyTaggingPolicy = taggingPolicy
    ? {
        id: taggingPolicy.id,
        title: taggingPolicy.title,
        docNumber: taggingPolicy.docNumber,
        department: taggingPolicy.department,
        date: taggingPolicy.date,
        status: taggingPolicy.status,
        tags: taggingPolicy.tags,
      }
    : null

  return (
    <div>
      <PolicyStatsWithPush />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7">
          <EnhancedPolicyList
            onTagClick={setTaggingPolicy}
            onViewDetail={setDetailPolicy}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
          />
        </div>
        <div className="col-span-5 flex flex-col">
          <div className="flex border-b border-gray-100 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm transition-colors relative ${
                  activeTab === tab.key ? 'text-primary font-medium' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-[640px]">
            {activeTab === 'tags' && <EnhancedTagSystem />}
            {activeTab === 'crowd' && <CrowdAssociationMatrix />}
            {activeTab === 'graph' && <PolicyGraph />}
          </div>
        </div>
      </div>

      {legacyTaggingPolicy && (
        <TagRecommendModal policy={legacyTaggingPolicy} onClose={() => setTaggingPolicy(null)} />
      )}

      {detailPolicy && (
        <PolicyDetailModal policy={detailPolicy} onClose={() => setDetailPolicy(null)} />
      )}
    </div>
  )
}

export { mockPolicies }
