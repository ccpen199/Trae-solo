import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jobList, mySkillTags } from '@/mocks/employment'
import { Search, MapPin, Briefcase, DollarSign, Video, Calendar, Sparkles, ChevronRight } from 'lucide-react'

const regions = ['全部', '广州', '深圳', '珠海', '佛山', '东莞']
const industries = ['全部', '互联网', '制造业', '电子商务', '智能硬件']
const salaryRanges = ['不限', '10K以下', '10K-20K', '20K-30K', '30K以上']

function matchIndustry(jobIndustry: string, filter: string): boolean {
  if (filter === '全部') return true
  return jobIndustry.includes(filter)
}

function matchSalary(salary: string, range: string): boolean {
  if (range === '不限') return true
  const numStr = salary.replace(/K/g, '')
  const parts = numStr.split('-').map(Number)
  const low = parts[0]
  const high = parts.length > 1 ? parts[1] : low
  switch (range) {
    case '10K以下': return low < 10
    case '10K-20K': return low < 20 && high >= 10
    case '20K-30K': return low < 30 && high >= 20
    case '30K以上': return low >= 30
    default: return true
  }
}

function matchScoreColor(score: number): string {
  if (score > 90) return 'bg-green-100 text-green-700'
  if (score > 70) return 'bg-blue-100 text-primary-500'
  return 'bg-yellow-100 text-yellow-700'
}

export default function EmploymentIndex() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('全部')
  const [industry, setIndustry] = useState('全部')
  const [salaryRange, setSalaryRange] = useState('不限')
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null)

  const filtered = jobList.filter((job) => {
    const matchSearch = search === '' || job.title.includes(search) || job.company.includes(search)
    const matchRegion = region === '全部' || job.location === region
    const matchInd = matchIndustry(job.industry, industry)
    const matchSal = matchSalary(job.salary, salaryRange)
    return matchSearch && matchRegion && matchInd && matchSal
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="gov-section-title">就业服务</h2>
        <p className="text-gov-muted text-sm mt-2 ml-4">智能匹配岗位，助力精准就业</p>
      </div>

      <div className="gov-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary-500" />
          <h3 className="font-semibold text-gov-text text-sm">我的专业/技能标签</h3>
          <span className="text-xs text-gov-muted ml-1">（系统根据您的简历和认证信息自动提取）</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {mySkillTags.map((tag) => (
            <span key={tag} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-50 text-primary-600 border border-primary-200">
              {tag}
            </span>
          ))}
        </div>
        <p className="text-xs text-gov-muted mt-3">以上标签将用于岗位智能匹配，您可在个人中心更新技能信息</p>
      </div>

      <div className="gov-card p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gov-muted" />
          <input
            type="text"
            placeholder="搜索岗位、公司关键词"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="gov-input pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-gov-muted" />
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="border border-gov-border rounded-lg px-3 py-2 text-sm text-gov-text focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
              {regions.map((r) => (<option key={r} value={r}>{r === '全部' ? '地区' : r}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-gov-muted" />
            <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="border border-gov-border rounded-lg px-3 py-2 text-sm text-gov-text focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
              {industries.map((i) => (<option key={i} value={i}>{i === '全部' ? '行业' : i}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-gov-muted" />
            <select value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} className="border border-gov-border rounded-lg px-3 py-2 text-sm text-gov-text focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white">
              {salaryRanges.map((s) => (<option key={s} value={s}>{s === '不限' ? '薪资范围' : s}</option>))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="gov-card p-8 text-center text-gov-muted">暂无匹配岗位</div>
        )}
        {filtered.map((job) => (
          <div key={job.id} className="gov-card overflow-hidden">
            <div
              className="p-4 flex gap-4 cursor-pointer"
              onClick={() => navigate(`/employment/job/${job.id}`)}
            >
              <img src={job.companyLogo} alt={job.company} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gov-text truncate">{job.title}</h3>
                  <span className="text-accent-500 font-bold text-lg whitespace-nowrap">{job.salary}</span>
                </div>
                <p className="text-sm text-gov-muted mt-0.5">{job.company}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gov-muted flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                    {job.matchedSkills.map((skill) => (
                      <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-600 border border-green-200 font-medium">
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${matchScoreColor(job.matchScore)}`}>
                    匹配 {job.matchScore}%
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-gov-border px-4 py-2.5 flex items-center justify-between bg-gray-50/50">
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedMatch(expandedMatch === job.id ? null : job.id) }}
                className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5" />
                查看推荐依据
                <ChevronRight className={`w-3 h-3 transition-transform ${expandedMatch === job.id ? 'rotate-90' : ''}`} />
              </button>
              <div className="flex items-center gap-3">
                {job.hasVideoInterview && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/employment/job/${job.id}`) }}
                    className="text-xs text-accent-500 hover:text-accent-600 flex items-center gap-1 font-medium"
                  >
                    <Video className="w-3.5 h-3.5" />
                    视频面试
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/employment/job/${job.id}`) }}
                  className="text-xs text-gov-success hover:text-green-600 flex items-center gap-1 font-medium"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  预约面试
                </button>
              </div>
            </div>

            {expandedMatch === job.id && (
              <div className="border-t border-gov-border px-4 py-3 bg-primary-50/30 animate-slide-up">
                <div className="text-xs font-medium text-primary-600 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  智能推荐依据
                </div>
                <ul className="space-y-1.5">
                  {job.matchReasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-gov-text">
                      <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">{idx + 1}</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {job.matchedSkills.map((skill) => (
                    <span key={skill} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-green-100 text-green-700 font-medium">
                      技能匹配: {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
