import { User, GraduationCap, Building2 } from 'lucide-react'
import type { Resume } from '../../../shared/types'
import { desensitizePhone } from '@/utils/helpers'
import Tag from '@/components/ui/Tag'

interface TalentCardProps {
  resume: Resume
  onView?: () => void
  onRequestContact?: () => void
}

const categoryColorMap: Record<string, 'blue' | 'green' | 'orange' | 'purple' | 'red'> = {
  技能: 'blue',
  语言: 'green',
  证书: 'purple',
  经验: 'orange',
}

function getCategoryColor(category: string): 'blue' | 'green' | 'orange' | 'purple' | 'red' {
  return categoryColorMap[category] || 'blue'
}

function getLatestExperience(resume: Resume): string {
  if (!resume.workExperience || resume.workExperience.length === 0) return '暂无工作经验'
  const latest = resume.workExperience[0]
  const end = latest.endDate ? latest.endDate : '至今'
  return `${latest.companyName} · ${latest.position}（${latest.startDate.slice(0, 7)} - ${end.slice(0, 7)}）`
}

export default function TalentCard({ resume, onView, onRequestContact }: TalentCardProps) {
  const { basicInfo, skillTags } = resume
  const displayName = resume.isDesensitized
    ? basicInfo.name.charAt(0) + '**'
    : basicInfo.name

  return (
    <div className="glass rounded-2xl p-5 transition-shadow hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-gray-900">{displayName}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {basicInfo.age && <span>{basicInfo.age}岁</span>}
            {basicInfo.gender && (
              <span>{basicInfo.gender === 'male' ? '男' : '女'}</span>
            )}
            {basicInfo.education && (
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {basicInfo.education}
              </span>
            )}
            {basicInfo.phone && (
              <span>{desensitizePhone(basicInfo.phone)}</span>
            )}
          </div>
        </div>
      </div>

      {skillTags && skillTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {skillTags.map(tag => (
            <Tag
              key={tag.id}
              label={tag.name}
              color={getCategoryColor(tag.category)}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
        <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
        <span>{getLatestExperience(resume)}</span>
      </div>

      <div className="mt-4 flex gap-2">
        {onView && (
          <button
            onClick={onView}
            className="flex-1 rounded-lg border border-primary py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            查看详情
          </button>
        )}
        {onRequestContact && (
          <button
            onClick={onRequestContact}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            申请联系方式
          </button>
        )}
      </div>
    </div>
  )
}
