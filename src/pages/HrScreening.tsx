import { useState } from 'react'
import { useStore } from '@/store'
import { Shield, CheckCircle, XCircle, Eye, Filter, CheckCheck, XSquare, SlidersHorizontal, ChevronDown, ChevronUp, ShieldAlert, RotateCcw, GraduationCap, Briefcase, Wrench } from 'lucide-react'

type CandidateStatus = 'passed' | 'pending' | 'rejected'

interface Candidate {
  id: string
  name: string
  position: string
  matchScore: number
  status: CandidateStatus
}

interface ResumeData {
  skills: string[]
  experience: string
  education: string
  scores: { name: string; score: number }[]
}

const MOCK_CANDIDATES: Candidate[] = [
  { id: 'c1', name: '张伟', position: '前端工程师', matchScore: 92, status: 'passed' },
  { id: 'c2', name: '李娜', position: '前端工程师', matchScore: 87, status: 'passed' },
  { id: 'c3', name: '王磊', position: '产品经理', matchScore: 74, status: 'pending' },
  { id: 'c4', name: '赵敏', position: '前端工程师', matchScore: 68, status: 'pending' },
  { id: 'c5', name: '刘洋', position: '数据分析师', matchScore: 55, status: 'pending' },
  { id: 'c6', name: '陈静', position: '产品经理', matchScore: 42, status: 'rejected' },
  { id: 'c7', name: '杨帆', position: '前端工程师', matchScore: 38, status: 'rejected' },
  { id: 'c8', name: '吴桐', position: '数据分析师', matchScore: 81, status: 'passed' },
]

const MOCK_RESUMES: Record<string, ResumeData> = {
  c1: { skills: ['React', 'TypeScript', 'Node.js', 'CSS3', 'Webpack'], experience: '5年前端开发经验，曾主导多个大型SPA项目', education: '浙江大学 计算机科学 本科', scores: [{ name: '技能匹配', score: 95 }, { name: '经验相关性', score: 90 }, { name: '教育背景', score: 88 }, { name: '语言能力', score: 85 }, { name: '项目经验', score: 93 }] },
  c2: { skills: ['Vue.js', 'JavaScript', 'Sass', 'Git'], experience: '3年前端开发，擅长组件库开发', education: '北京大学 软件工程 硕士', scores: [{ name: '技能匹配', score: 88 }, { name: '经验相关性', score: 82 }, { name: '教育背景', score: 95 }, { name: '语言能力', score: 80 }, { name: '项目经验', score: 85 }] },
  c3: { skills: ['Axure', 'Figma', '用户研究', '数据分析', 'SQL'], experience: '4年产品经验，负责过B端SaaS产品', education: '复旦大学 工商管理 本科', scores: [{ name: '技能匹配', score: 78 }, { name: '经验相关性', score: 72 }, { name: '教育背景', score: 70 }, { name: '语言能力', score: 68 }, { name: '项目经验', score: 75 }] },
  c4: { skills: ['React', 'JavaScript', 'HTML/CSS'], experience: '2年前端开发，有电商项目经验', education: '同济大学 计算机科学 本科', scores: [{ name: '技能匹配', score: 72 }, { name: '经验相关性', score: 65 }, { name: '教育背景', score: 75 }, { name: '语言能力', score: 60 }, { name: '项目经验', score: 62 }] },
  c5: { skills: ['Python', 'SQL', 'Tableau', 'Excel'], experience: '2年数据分析经验，擅长可视化报表', education: '华中科技大学 统计学 本科', scores: [{ name: '技能匹配', score: 60 }, { name: '经验相关性', score: 52 }, { name: '教育背景', score: 68 }, { name: '语言能力', score: 45 }, { name: '项目经验', score: 48 }] },
  c6: { skills: ['竞品分析', 'PRD撰写'], experience: '1年产品助理经验', education: '某大学 市场营销 本科', scores: [{ name: '技能匹配', score: 45 }, { name: '经验相关性', score: 38 }, { name: '教育背景', score: 42 }, { name: '语言能力', score: 35 }, { name: '项目经验', score: 40 }] },
  c7: { skills: ['HTML', 'CSS', 'jQuery'], experience: '1年前端实习经验', education: '某大学 信息管理 大专', scores: [{ name: '技能匹配', score: 35 }, { name: '经验相关性', score: 30 }, { name: '教育背景', score: 40 }, { name: '语言能力', score: 32 }, { name: '项目经验', score: 28 }] },
  c8: { skills: ['Python', 'R', '机器学习', 'SQL', 'Spark'], experience: '3年数据分析和建模经验', education: '中国科学技术大学 统计学 硕士', scores: [{ name: '技能匹配', score: 88 }, { name: '经验相关性', score: 82 }, { name: '教育背景', score: 90 }, { name: '语言能力', score: 72 }, { name: '项目经验', score: 78 }] },
}

const STATUS_CONFIG: Record<CandidateStatus, { label: string; color: string }> = {
  passed: { label: '通过', color: 'bg-emerald-100 text-emerald-600' },
  pending: { label: '待审', color: 'bg-amber-100 text-amber-600' },
  rejected: { label: '拒绝', color: 'bg-red-100 text-red-500' },
}

function AccessDenied({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="glass-card p-10 text-center max-w-md">
        <div className="bg-red-50 p-4 rounded-full inline-flex mb-4">
          <ShieldAlert className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="font-display text-xl font-semibold text-navy-700 mb-2">访问受限</h2>
        <p className="text-graphite/60 mb-6">该功能仅限HR角色访问</p>
        <button className="btn-primary inline-flex items-center gap-2" onClick={onSwitch}>
          <RotateCcw className="h-4 w-4" /> 切换至HR角色
        </button>
      </div>
    </div>
  )
}

function ResumeModal({ candidate, resume, onClose }: { candidate: Candidate; resume: ResumeData; onClose: () => void }) {
  const barColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-amber-400'
    return 'bg-red-400'
  }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-navy-700 text-lg">{candidate.name}</h3>
            <p className="text-xs text-graphite/50">{candidate.position} · 综合匹配度 {candidate.matchScore}%</p>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-graphite/50" onClick={onClose}>✕</button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-3 bg-ivory rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-4 w-4 text-navy-500" />
              <span className="text-sm font-medium text-navy-700">技能</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {resume.skills.map((s) => (
                <span key={s} className="text-xs bg-navy-50 text-navy-500 px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-ivory rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-4 w-4 text-navy-500" />
              <span className="text-sm font-medium text-navy-700">工作经验</span>
            </div>
            <p className="text-sm text-graphite/70">{resume.experience}</p>
          </div>

          <div className="p-3 bg-ivory rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-navy-500" />
              <span className="text-sm font-medium text-navy-700">教育背景</span>
            </div>
            <p className="text-sm text-graphite/70">{resume.education}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-navy-700 mb-3">匹配度分项得分</h4>
          <div className="space-y-3">
            {resume.scores.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-xs text-graphite/60 w-20 text-right">{s.name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className={`${barColor(s.score)} h-full rounded-full transition-all`} style={{ width: `${s.score}%` }} />
                </div>
                <span className="text-xs font-medium text-navy-700 w-8">{s.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button className="btn-secondary text-sm" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  )
}

export default function HrScreening() {
  const { currentRole, switchRole } = useStore()
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES)
  const [threshold, setThreshold] = useState(60)
  const [filters, setFilters] = useState({ noExp: true, noEdu: true, noSkill: false })
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)

  if (currentRole !== 'hr') {
    return <AccessDenied onSwitch={() => switchRole('hr')} />
  }

  const passed = candidates.filter((c) => c.matchScore >= threshold && c.status !== 'rejected').length
  const pending = candidates.filter((c) => c.matchScore < threshold && c.status !== 'passed').length

  const handleStatusChange = (id: string, status: CandidateStatus) => {
    setCandidates(candidates.map((c) => c.id === id ? { ...c, status } : c))
  }

  const handleBatchAction = (status: CandidateStatus) => {
    setCandidates(candidates.map((c) => {
      if (c.matchScore >= threshold && c.status === 'pending') return { ...c, status }
      if (c.matchScore < threshold && c.status === 'pending') return { ...c, status }
      return c
    }))
  }

  const barColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-amber-400'
    return 'bg-red-400'
  }

  return (
    <div className="min-h-screen bg-ivory p-6">
      <h1 className="section-title mb-6">AI初筛设置</h1>

      <div className="glass-card mb-6 overflow-hidden">
        <button className="w-full p-4 flex items-center justify-between text-left" onClick={() => setRulesOpen(!rulesOpen)}>
          <div className="flex items-center gap-3">
            <div className="bg-navy-50 p-2.5 rounded-xl"><Shield className="h-5 w-5 text-navy-500" /></div>
            <span className="font-semibold text-navy-700">筛选规则说明</span>
          </div>
          {rulesOpen ? <ChevronUp className="h-5 w-5 text-graphite/50" /> : <ChevronDown className="h-5 w-5 text-graphite/50" />}
        </button>
        {rulesOpen && (
          <div className="px-5 pb-5 space-y-3">
            <div className="flex items-start gap-3 p-3 bg-ivory rounded-xl">
              <div className="bg-emerald-100 p-1.5 rounded-lg mt-0.5"><CheckCircle className="h-4 w-4 text-emerald-600" /></div>
              <div>
                <p className="text-sm font-medium text-navy-700">自动通过</p>
                <p className="text-xs text-graphite/60">综合匹配度达到阈值且通过所有过滤规则的候选人将自动标记为"通过"，无需人工干预</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-ivory rounded-xl">
              <div className="bg-amber-100 p-1.5 rounded-lg mt-0.5"><Filter className="h-4 w-4 text-amber-600" /></div>
              <div>
                <p className="text-sm font-medium text-navy-700">自动过滤</p>
                <p className="text-xs text-graphite/60">启用过滤规则后，缺少相关经验、学历不符或技能缺失的简历将被自动排除，不进入评分流程</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-ivory rounded-xl">
              <div className="bg-red-100 p-1.5 rounded-lg mt-0.5"><XCircle className="h-4 w-4 text-red-500" /></div>
              <div>
                <p className="text-sm font-medium text-navy-700">自动拒绝</p>
                <p className="text-xs text-graphite/60">综合匹配度低于自动拒绝阈值（如评分标准配置中的设定）的候选人将自动标记为"拒绝"</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-ivory rounded-xl">
              <div className="bg-navy-50 p-1.5 rounded-lg mt-0.5"><SlidersHorizontal className="h-4 w-4 text-navy-500" /></div>
              <div>
                <p className="text-sm font-medium text-navy-700">人工复审</p>
                <p className="text-xs text-graphite/60">介于自动通过和自动拒绝之间的候选人将进入"待审"状态，由HR人工决策</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-navy-50 p-2.5 rounded-xl"><SlidersHorizontal className="h-5 w-5 text-navy-500" /></div>
          <h2 className="font-semibold text-navy-700 text-lg">筛选配置</h2>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-navy-700">匹配阈值</span>
            <span className="text-sm font-bold text-amber-600">{threshold}%</span>
          </div>
          <input type="range" min={0} max={100} value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-navy-500" />
        </div>

        <p className="text-sm text-graphite/70 mb-5">
          当前阈值: <span className="font-semibold text-navy-700">{threshold}%</span>
          {' | '}符合条件: <span className="font-semibold text-emerald-600">{passed} 份</span>
          {' | '}需人工复审: <span className="font-semibold text-amber-600">{pending} 份</span>
        </p>

        <div className="space-y-3">
          <p className="text-xs text-graphite/60">自动过滤规则</p>
          {[
            { key: 'noExp' as const, label: '过滤无相关经验' },
            { key: 'noEdu' as const, label: '过滤学历不符' },
            { key: 'noSkill' as const, label: '过滤技能缺失' },
          ].map((rule) => (
            <label key={rule.key} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={filters[rule.key]}
                onChange={(e) => setFilters({ ...filters, [rule.key]: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-navy-500 focus:ring-navy-500" />
              <span className="text-sm text-navy-700">{rule.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-navy-700 text-lg">筛选结果</h2>
        <div className="flex gap-3">
          <button className="btn-primary inline-flex items-center gap-2 text-sm" onClick={() => handleBatchAction('passed')}>
            <CheckCheck className="h-4 w-4" /> 批量通过
          </button>
          <button className="btn-secondary inline-flex items-center gap-2 text-sm" onClick={() => handleBatchAction('rejected')}>
            <XSquare className="h-4 w-4" /> 批量拒绝
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy-500 text-white">
              <th className="px-4 py-3 text-left font-medium">候选人</th>
              <th className="px-4 py-3 text-left font-medium">岗位</th>
              <th className="px-4 py-3 text-left font-medium">匹配度</th>
              <th className="px-4 py-3 text-left font-medium">状态</th>
              <th className="px-4 py-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-ivory/50 transition">
                <td className="px-4 py-3 font-semibold text-navy-700">{c.name}</td>
                <td className="px-4 py-3 text-graphite/70">{c.position}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden max-w-[120px]">
                      <div className={`${barColor(c.matchScore)} h-full rounded-full transition-all`} style={{ width: `${c.matchScore}%` }} />
                    </div>
                    <span className="text-xs font-medium text-navy-700 w-8">{c.matchScore}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CONFIG[c.status].color}`}>
                    {STATUS_CONFIG[c.status].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button className="p-1.5 rounded-lg hover:bg-navy-50 text-navy-500" title="查看简历"
                      onClick={() => setViewingCandidate(c)}><Eye className="h-4 w-4" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500" title="通过"
                      onClick={() => handleStatusChange(c.id, 'passed')}><CheckCircle className="h-4 w-4" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="拒绝"
                      onClick={() => handleStatusChange(c.id, 'rejected')}><XCircle className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewingCandidate && MOCK_RESUMES[viewingCandidate.id] && (
        <ResumeModal
          candidate={viewingCandidate}
          resume={MOCK_RESUMES[viewingCandidate.id]}
          onClose={() => setViewingCandidate(null)}
        />
      )}
    </div>
  )
}
