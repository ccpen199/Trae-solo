import { useState, useEffect } from 'react'
import { Search, MapPin, Clock, Briefcase, Settings2, Sparkles } from 'lucide-react'
import type { Job, MatchResult, JobPreferences, IndustryType } from '@/../shared/types'
import { mockResumes, mockJobs } from '@/mock/data'
import { useStore } from '@/store'
import { formatSalary, getIndustryLabel } from '@/utils/helpers'
import JobCard from '@/components/business/JobCard'
import Tag from '@/components/ui/Tag'

const industryOptions: { value: IndustryType; label: string }[] = [
  { value: 'restaurant', label: '餐饮' },
  { value: 'retail', label: '零售' },
  { value: 'housekeeping', label: '家政' },
  { value: 'logistics', label: '物流' },
  { value: 'security', label: '安保' },
  { value: 'other', label: '其他' },
]

const locationOptions = ['上海市浦东新区', '上海市徐汇区', '上海市长宁区', '上海市闵行区', '上海市普陀区']

function calculateMatchScore(job: Job, preferences: JobPreferences): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  if (preferences.industries.includes(job.industry)) {
    score += 25
    reasons.push('行业偏好匹配')
  }

  if (job.salaryMin >= (preferences.salaryMin || 0) && job.salaryMax <= (preferences.salaryMax || Infinity)) {
    score += 25
    reasons.push('薪资范围匹配')
  }

  if (job.location.includes('浦东新区')) {
    score += 20
    reasons.push('通勤距离在范围内')
  }

  const hasOverlap = job.workHours.some((jobHour) =>
    preferences.workHours.some(
      (prefHour) =>
        jobHour.day === prefHour.day &&
        jobHour.startTime >= prefHour.startTime &&
        jobHour.endTime <= prefHour.endTime
    )
  )
  if (hasOverlap) {
    score += 20
    reasons.push('工作时间匹配')
  }

  const hasCommonTags = job.tags.some((tag) => preferences.tags.includes(tag))
  if (hasCommonTags) {
    score += 10
    reasons.push('福利偏好匹配')
  }

  return { score: Math.min(score, 100), reasons }
}

function generateMatchResults(jobs: Job[], preferences: JobPreferences): MatchResult[] {
  return jobs
    .filter((job) => job.status === 'published' && job.reviewStatus === 'approved')
    .map((job) => {
      const { score, reasons } = calculateMatchScore(job, preferences)
      return {
        jobId: job.id,
        job,
        matchScore: score,
        matchReasons: reasons,
      }
    })
    .filter((result) => result.matchScore >= 40)
    .sort((a, b) => b.matchScore - a.matchScore)
}

function CircularProgress({ score }: { score: number }) {
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative h-14 w-14">
      <svg className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#FF6B35' : '#ef4444'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`text-sm font-bold ${score >= 80 ? 'text-success' : score >= 60 ? 'text-info' : score >= 40 ? 'text-accent' : 'text-danger'}`}
        >
          {score}%
        </span>
      </div>
    </div>
  )
}

export default function JobseekerHome() {
  const { recommendedJobs, setRecommendedJobs } = useStore()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [commuteRadius, setCommuteRadius] = useState(5)
  const [salaryMin, setSalaryMin] = useState(20)
  const [salaryMax, setSalaryMax] = useState(30)
  const [selectedIndustries, setSelectedIndustries] = useState<IndustryType[]>(['restaurant', 'retail'])
  const [preferences, setPreferences] = useState<JobPreferences>(mockResumes[0].preferences)

  useEffect(() => {
    const results = generateMatchResults(mockJobs, preferences)
    setRecommendedJobs(results)
  }, [preferences, setRecommendedJobs])

  const handleIndustryToggle = (industry: IndustryType) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    )
  }

  const handleQuickSelectHours = () => {
    setPreferences((prev) => ({
      ...prev,
      workHours: [
        { day: 1, startTime: '18:00', endTime: '22:00' },
        { day: 2, startTime: '18:00', endTime: '22:00' },
        { day: 3, startTime: '18:00', endTime: '22:00' },
        { day: 4, startTime: '18:00', endTime: '22:00' },
        { day: 5, startTime: '18:00', endTime: '22:00' },
      ],
    }))
  }

  const handleApplyPreferences = () => {
    setPreferences({
      industries: selectedIndustries,
      salaryMin,
      salaryMax,
      commuteRadius,
      workHours: preferences.workHours,
      tags: ['就近分配', '包餐', '弹性排班'],
    })
  }

  const filteredJobs = recommendedJobs.filter((result) => {
    const matchesKeyword =
      searchKeyword === '' ||
      result.job.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      result.job.companyName.toLowerCase().includes(searchKeyword.toLowerCase())
    const matchesLocation =
      selectedLocation === '' || result.job.location.includes(selectedLocation)
    return matchesKeyword && matchesLocation
  })

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">找工作</h1>
        <p className="mt-1 text-sm text-gray-500">智能匹配，为您推荐最合适的岗位</p>
      </div>

      <div className="glass mb-8 rounded-2xl p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索职位、公司名称..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
            />
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
            <MapPin className="h-5 w-5 text-gray-400" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-transparent text-sm text-gray-900 outline-none"
            >
              <option value="">全部地区</option>
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="glass mb-8 rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">求职偏好</h2>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">通勤半径</label>
              <span className="text-sm font-semibold text-accent">{commuteRadius} km</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={commuteRadius}
              onChange={(e) => setCommuteRadius(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>0km</span>
              <span>10km</span>
              <span>20km</span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">薪资期望（元/时）</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="最低"
                value={salaryMin}
                onChange={(e) => setSalaryMin(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none transition-colors focus:border-primary"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="最高"
                value={salaryMax}
                onChange={(e) => setSalaryMax(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">工作时间偏好</label>
              <button
                onClick={handleQuickSelectHours}
                className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
              >
                宝妈夜间时段(18:00-22:00)
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.workHours.map((wh, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 rounded-lg bg-primary/5 px-3 py-1.5 text-xs text-primary"
                >
                  <Clock className="h-3 w-3" />
                  <span>
                    {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][wh.day]} {wh.startTime}-{wh.endTime}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">行业偏好</label>
            <div className="flex flex-wrap gap-2">
              {industryOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleIndustryToggle(opt.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedIndustries.includes(opt.value) ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleApplyPreferences}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            应用偏好设置
          </button>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-gray-900">为您智能推荐</h2>
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              {filteredJobs.length} 个匹配
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((result) => (
            <div key={result.jobId} className="relative">
              <div className="absolute right-4 top-4 z-10">
                <CircularProgress score={result.matchScore} />
              </div>
              <JobCard
                job={result.job}
                matchScore={result.matchScore}
                matchReasons={result.matchReasons}
                showApplyButton
              />
            </div>
          ))}
        </div>

        {filteredJobs.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">暂无匹配的职位，请调整搜索条件或偏好设置</p>
          </div>
        )}
      </div>
    </div>
  )
}
