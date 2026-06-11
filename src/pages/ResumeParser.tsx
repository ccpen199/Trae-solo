import { useState } from 'react'
import {
  FileSearch,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  Check,
  X,
  AlertTriangle,
  Tag,
  Award,
  FolderOpen,
} from 'lucide-react'
import { sampleResumes, skillTags } from '../data/mockData'
import type { ResumeData, AnnotatedKeyword, CapabilityGap } from '../data/mockData'

const borderColors = ['border-blue-500', 'border-emerald-500', 'border-amber-500']
const borderBgColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500']

const skillCategoryStyle: Record<string, string> = {
  hard: 'bg-blue-100 text-blue-700',
  cert: 'bg-amber-100 text-amber-700',
  domain: 'bg-emerald-100 text-emerald-700',
  soft: 'bg-purple-100 text-purple-700',
}

const keywordTypeStyle: Record<string, string> = {
  skill: 'bg-blue-50 text-blue-600 border-blue-200',
  cert: 'bg-amber-50 text-amber-600 border-amber-200',
  domain: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  project: 'bg-violet-50 text-violet-600 border-violet-200',
}

const keywordTypeIcon: Record<string, typeof Tag> = {
  skill: Tag,
  cert: Award,
  domain: FolderOpen,
  project: Briefcase,
}

const keywordTypeLabel: Record<string, string> = {
  skill: '技能',
  cert: '认证',
  domain: '领域',
  project: '项目',
}

const priorityStyle: Record<string, { dot: string; bg: string; border: string; text: string }> = {
  high: { dot: 'bg-red-500', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  medium: { dot: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  low: { dot: 'bg-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
}

const priorityLabel: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

function CircularProgress({ percentage, size = 120, strokeWidth = 8 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference
  const color = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#3b82f6' : '#f59e0b'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-slate-800">{percentage}%</span>
        <span className="text-xs text-slate-400">匹配率</span>
      </div>
    </div>
  )
}

function CandidateCard({ resume, index, selected, onClick }: { resume: ResumeData; index: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border-l-4 ${borderColors[index]} transition-all duration-200 ${
        selected ? 'bg-blue-50 shadow-sm ring-1 ring-blue-200' : 'bg-white hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm text-slate-800">{resume.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{resume.title}</p>
        </div>
        <span className={`w-2 h-2 rounded-full mt-1.5 ${borderBgColors[index]}`} />
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Briefcase className="w-3 h-3" />
          {resume.yearsOfExperience}年
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {resume.location}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {resume.skills.slice(0, 3).map((sid) => {
          const tag = skillTags.find((s) => s.id === sid)
          if (!tag) return null
          return (
            <span key={sid} className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 text-slate-500">
              {tag.name}
            </span>
          )
        })}
      </div>
    </button>
  )
}

function SkillTags({ skillIds }: { skillIds: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {skillIds.map((sid) => {
        const tag = skillTags.find((s) => s.id === sid)
        if (!tag) return null
        return (
          <span key={sid} className={`px-2.5 py-1 text-xs rounded-full font-medium ${skillCategoryStyle[tag.category]}`}>
            {tag.name}
          </span>
        )
      })}
    </div>
  )
}

function KeywordBadge({ kw }: { kw: AnnotatedKeyword }) {
  const Icon = keywordTypeIcon[kw.type]
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${keywordTypeStyle[kw.type]}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="text-xs font-medium">{keywordTypeLabel[kw.type]}</span>
      <span className="text-xs text-slate-700 font-medium">{kw.keyword}</span>
      <span className="flex-1" />
      {kw.matched ? (
        <span className="flex items-center gap-0.5 text-emerald-600">
          <Check className="w-3.5 h-3.5" />
          <span className="text-[10px]">匹配</span>
        </span>
      ) : (
        <span className="flex items-center gap-0.5 text-red-500">
          <X className="w-3.5 h-3.5" />
          <span className="text-[10px]">缺失</span>
        </span>
      )}
      <span className="text-[10px] text-slate-400 ml-1">{kw.source}</span>
    </div>
  )
}

function GapCard({ gap }: { gap: CapabilityGap }) {
  const style = priorityStyle[gap.priority]
  return (
    <div className={`p-3 rounded-lg border ${style.bg} ${style.border}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
        <span className={`text-xs font-semibold ${style.text}`}>优先级：{priorityLabel[gap.priority]}</span>
      </div>
      <p className="text-sm font-medium text-slate-800">{gap.required}</p>
      <p className="text-xs text-slate-500 mt-1">
        当前状态：{gap.current ?? <span className="text-red-500 font-medium">缺失</span>}
      </p>
      <div className="flex items-start gap-1.5 mt-1.5">
        <AlertTriangle className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500">{gap.gap}</p>
      </div>
    </div>
  )
}

export default function ResumeParser() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const resume = sampleResumes[selectedIndex]
  const matchedCount = resume.annotatedKeywords.filter((k) => k.matched).length
  const totalCount = resume.annotatedKeywords.length
  const matchRate = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0

  return (
    <div className="flex h-full">
      <aside className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileSearch className="w-4 h-4 text-blue-500" />
            候选人列表
          </h2>
          <p className="text-xs text-slate-400 mt-1">共 {sampleResumes.length} 份简历</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sampleResumes.map((r, i) => (
            <CandidateCard key={r.id} resume={r} index={i} selected={i === selectedIndex} onClick={() => setSelectedIndex(i)} />
          ))}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-800">{resume.name}</h1>
                <p className="text-sm text-slate-500 mt-1">{resume.title}</p>
              </div>
              <span className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-600 font-medium">
                {resume.yearsOfExperience}年经验
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {resume.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-400" />
                {resume.yearsOfExperience}年工作经验
              </span>
              {resume.education.map((edu) => (
                <span key={edu.school} className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  {edu.school} · {edu.major} · {edu.degree}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">专业技能</h2>
            <SkillTags skillIds={resume.skills} />
            {resume.certifications.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs text-slate-400 mb-2">资质认证</h3>
                <div className="flex flex-wrap gap-2">
                  {resume.certifications.map((cid) => (
                    <span key={cid} className="px-2.5 py-1 text-xs rounded-full bg-amber-50 text-amber-700 font-medium">
                      {cid === 'c1' ? 'ISO 26262功能安全工程师' : cid === 'c2' ? 'ASPICE Assessor' : cid === 'c5' ? 'CATIA V5专业认证' : cid === 'c6' ? '六西格玛黑带' : cid === 'c8' ? 'CCF CSP软件能力' : cid}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">项目经验</h2>
            <div className="space-y-4">
              {resume.projects.map((proj) => (
                <div key={proj.id} className="border border-slate-100 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-sm text-slate-800">{proj.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-600 font-medium">
                          {proj.vehicleModel}
                        </span>
                        <span className="text-xs text-slate-400">{proj.role}</span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {proj.duration}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{proj.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {proj.technologies.map((t) => (
                      <span key={t} className="px-2 py-0.5 text-[10px] rounded bg-slate-100 text-slate-600">
                        {t}
                      </span>
                    ))}
                  </div>
                  {proj.testFieldExperience && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-xs rounded bg-amber-50 text-amber-700 font-medium">
                        试验场: {proj.testFieldExperience}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">工作经历</h2>
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-200" />
              <div className="space-y-5">
                {resume.workHistory.map((work, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-400 z-10" />
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-sm text-slate-800">{work.company}</h3>
                        <p className="text-xs text-slate-500">{work.position}</p>
                        <p className="text-xs text-slate-400">{work.department}</p>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {work.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">JD关键词标注</h2>
            <div className="space-y-2">
              {resume.annotatedKeywords.map((kw, i) => (
                <KeywordBadge key={i} kw={kw} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <aside className="w-80 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">JD匹配分析</h2>
        </div>

        <div className="p-4">
          <div className="flex flex-col items-center py-4">
            <h3 className="text-xs font-medium text-slate-500 mb-3">JD关键词匹配率</h3>
            <CircularProgress percentage={matchRate} />
            <p className="text-xs text-slate-400 mt-2">
              已匹配 {matchedCount}/{totalCount} 个关键词
            </p>
          </div>
        </div>

        <div className="px-4 pb-3">
          <h3 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            关键词标注结果
          </h3>
          <div className="space-y-1.5">
            {resume.annotatedKeywords.map((kw, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-50 text-xs">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${keywordTypeStyle[kw.type]}`}>
                  {keywordTypeLabel[kw.type]}
                </span>
                <span className="text-slate-700 font-medium flex-1">{kw.keyword}</span>
                {kw.matched ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <X className="w-3.5 h-3.5 text-red-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4 mt-2">
          <h3 className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
            能力缺口提示
          </h3>
          <div className="space-y-2">
            {resume.capabilityGaps.map((gap, i) => (
              <GapCard key={i} gap={gap} />
            ))}
            {resume.capabilityGaps.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">暂无能力缺口</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
