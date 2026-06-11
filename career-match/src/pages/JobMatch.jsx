import { useState } from 'react'
import { jobListings } from '../data/mockData'
import { GraduationCap, RotateCcw, Cpu, BookOpen, ExternalLink, ChevronDown, ChevronUp, Search, MapPin, Banknote, Star } from 'lucide-react'

function GrowthLabel({ type, active, detail }) {
  const config = {
    training: { icon: GraduationCap, label: '培训体系', activeColor: 'bg-accent-50 text-accent-700 border-accent-200', inactiveColor: 'bg-gray-50 text-gray-400 border-gray-100' },
    rotation: { icon: RotateCcw, label: '轮岗机会', activeColor: 'bg-primary-50 text-primary-700 border-primary-200', inactiveColor: 'bg-gray-50 text-gray-400 border-gray-100' },
    techEvolution: { icon: Cpu, label: '技术演进', activeColor: 'bg-warn-50 text-warn-700 border-warn-200', inactiveColor: 'bg-gray-50 text-gray-400 border-gray-100' },
  }
  const c = config[type]
  const Icon = c.icon
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${active ? c.activeColor : c.inactiveColor}`}>
      <Icon className="w-3.5 h-3.5" />
      {c.label}
      {!active && <span className="text-[10px] opacity-60">未提供</span>}
    </div>
  )
}

function SignalMeter({ label, value, color }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color: value >= 70 ? '#059669' : value >= 40 ? '#d97706' : '#dc2626' }}>
        {value}
      </span>
    </div>
  )
}

function JobCard({ job, expanded, onToggle }) {
  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 ${expanded ? 'border-primary-200 shadow-lg' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
            {job.logo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-500">{job.company}</p>
              </div>
              <div className={`text-2xl font-bold ${job.matchScore >= 80 ? 'text-accent-500' : job.matchScore >= 60 ? 'text-warn-500' : 'text-gray-400'}`}>
                {job.matchScore}%
                <span className="text-xs font-normal text-gray-400 ml-1">匹配</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
              <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5" />{job.salary}</span>
              <span>{job.experience}</span>
              <span className="text-xs text-gray-400">{job.postedDays}天前发布</span>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {job.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">{tag}</span>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <GrowthLabel type="training" active={job.growthLabels.training} detail={job.growthLabels.trainingDetail} />
              <GrowthLabel type="rotation" active={job.growthLabels.rotation} detail={job.growthLabels.rotationDetail} />
              <GrowthLabel type="techEvolution" active={job.growthLabels.techEvolution} detail={job.growthLabels.techEvolutionDetail} />
            </div>
          </div>
        </div>

        <button onClick={onToggle} className="w-full flex items-center justify-center gap-1 mt-4 pt-4 border-t border-gray-50 text-sm text-primary-600 hover:text-primary-700">
          {expanded ? '收起详情' : '查看详情'}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="px-6 pb-6 space-y-5 border-t border-gray-100 pt-5">
          <div>
            <h4 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary-500" /> 成长性详情
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {job.growthLabels.training && (
                <div className="bg-accent-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <GraduationCap className="w-4 h-4 text-accent-600" />
                    <span className="text-xs font-semibold text-accent-700">培训体系</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{job.growthLabels.trainingDetail}</p>
                </div>
              )}
              {job.growthLabels.rotation && (
                <div className="bg-primary-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <RotateCcw className="w-4 h-4 text-primary-600" />
                    <span className="text-xs font-semibold text-primary-700">轮岗机会</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{job.growthLabels.rotationDetail}</p>
                </div>
              )}
              {job.growthLabels.techEvolution && (
                <div className="bg-warn-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Cpu className="w-4 h-4 text-warn-600" />
                    <span className="text-xs font-semibold text-warn-700">技术演进</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{job.growthLabels.techEvolutionDetail}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-500" /> 隐性信号分析
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <SignalMeter label="技术博客活跃度" value={job.implicitSignals.techBlogActivity} color={job.implicitSignals.techBlogActivity >= 70 ? 'bg-accent-500' : job.implicitSignals.techBlogActivity >= 40 ? 'bg-warn-500' : 'bg-danger-500'} />
              <SignalMeter label="开源项目贡献" value={job.implicitSignals.openSourceContribution} color={job.implicitSignals.openSourceContribution >= 70 ? 'bg-accent-500' : job.implicitSignals.openSourceContribution >= 40 ? 'bg-warn-500' : 'bg-danger-500'} />
              <SignalMeter label="职级分布健康度" value={job.implicitSignals.employeeLevelHealth} color={job.implicitSignals.employeeLevelHealth >= 70 ? 'bg-accent-500' : job.implicitSignals.employeeLevelHealth >= 40 ? 'bg-warn-500' : 'bg-danger-500'} />
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 bg-primary-600 text-white py-3 rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2">
              立即申请 <ExternalLink className="w-4 h-4" />
            </button>
            <button className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors">
              收藏
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function JobMatch() {
  const [expandedId, setExpandedId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchText, setSearchText] = useState('')

  const filtered = jobListings
    .filter((j) => {
      if (filter === 'growth') return j.growthLabels.training && j.growthLabels.techEvolution
      if (filter === 'high-match') return j.matchScore >= 80
      return true
    })
    .filter((j) => !searchText || j.title.includes(searchText) || j.company.includes(searchText) || j.tags.some((t) => t.includes(searchText)))
    .sort((a, b) => b.matchScore - a.matchScore)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">职位匹配</h1>
        <p className="text-gray-500 mt-2">融合显性条件与隐性信号的成长性职位推荐</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索职位、公司或技能..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border-0 text-sm focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: '全部职位' },
            { key: 'growth', label: '高成长性' },
            { key: 'high-match', label: '高匹配度' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            expanded={expandedId === job.id}
            onToggle={() => setExpandedId(expandedId === job.id ? null : job.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>没有找到匹配的职位</p>
          </div>
        )}
      </div>
    </div>
  )
}
