import { useState } from 'react'
import PolicyStatsCards from '@/components/policy-tags/PolicyStatsCards'
import PolicyFileList from '@/components/policy-tags/PolicyFileList'
import type { Policy } from '@/components/policy-tags/PolicyFileList'
import TagSystem from '@/components/policy-tags/TagSystem'
import TagRecommendModal from '@/components/policy-tags/TagRecommendModal'

export default function PolicyTags() {
  const [statusFilter, setStatusFilter] = useState('全部')
  const [tagFilter, setTagFilter] = useState('')
  const [taggingPolicy, setTaggingPolicy] = useState<Policy | null>(null)

  return (
    <div>
      <PolicyStatsCards />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7">
          <PolicyFileList
            onTagClick={setTaggingPolicy}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            tagFilter={tagFilter}
            onTagFilterChange={setTagFilter}
          />
        </div>
        <div className="col-span-5">
          <TagSystem />
        </div>
      </div>

      {taggingPolicy && (
        <TagRecommendModal policy={taggingPolicy} onClose={() => setTaggingPolicy(null)} />
      )}
    </div>
  )
}
