import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import {
  FileSearch,
  SpellCheck,
  Target,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
} from 'lucide-react'
import { useStore } from '@/store'
import type { GrammarError, Suggestion, Resume, ResumeSection } from '@/types'

const TABS = [
  { key: 'jd', label: 'JD匹配分析', icon: FileSearch },
  { key: 'grammar', label: '语法检查', icon: SpellCheck },
  { key: 'fitness', label: '适配度评分', icon: Target },
] as const

type TabKey = (typeof TABS)[number]['key']

const JD_SKILLS = [
  'React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'Node.js',
  'Python', 'Java', 'Go', 'Docker', 'Kubernetes', 'AWS', 'CI/CD',
  'Git', 'SQL', 'MongoDB', 'Redis', 'GraphQL', 'REST', 'Webpack',
  'Vite', 'Tailwind', 'CSS', 'HTML', 'Sass', 'Jest', 'Cypress',
  'Figma', 'Agile', 'Scrum', 'Linux', 'Nginx', 'Microservices',
]

function extractResumeText(sections: ResumeSection[]) {
  return sections.map((s: ResumeSection) => Object.values(s.content).flat().join(' ')).join(' ')
}

function getResumeSkills(sections: ResumeSection[]) {
  const skillsSection = sections.find((s: ResumeSection) => s.type === 'skills')
  const items = (skillsSection?.content?.items as string[]) || []
  const text = extractResumeText(sections)
  return [...new Set([...items, ...JD_SKILLS.filter((sk: string) => text.toLowerCase().includes(sk.toLowerCase()))])]
}

function analyzeJd(jdText: string, resumeSkills: string[]) {
  if (!jdText.trim()) return { score: 0, matched: [], missing: [], overlap: [] }
  const jdLower = jdText.toLowerCase()
  const found = JD_SKILLS.filter((s) => jdLower.includes(s.toLowerCase()))
  const matched = found.filter((s) => resumeSkills.some((r) => r.toLowerCase() === s.toLowerCase()))
  const missing = found.filter((s) => !resumeSkills.some((r) => r.toLowerCase() === s.toLowerCase()))
  const score = found.length ? Math.round((matched.length / found.length) * 100) : 0
  const overlap = found.map((s) => ({
    name: s,
    overlap: matched.includes(s) ? 100 : 0,
  }))
  return { score, matched, missing, overlap }
}

function checkGrammar(text: string): GrammarError[] {
  const errors: GrammarError[] = []
  if (!text.trim()) return errors
  let offset = 0
  const lines = text.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { offset += line.length + 1; continue }
    const doubleSpace = trimmed.indexOf('  ')
    if (doubleSpace !== -1) {
      errors.push({ text: trimmed.substring(doubleSpace, doubleSpace + 2), offset: offset + doubleSpace, length: 2, message: '多余的空格', suggestion: ' ' })
    }
    const firstChar = trimmed[0]
    if (firstChar && /[a-z]/.test(firstChar) && trimmed.length > 1) {
      errors.push({ text: firstChar, offset, length: 1, message: '句首未大写', suggestion: firstChar.toUpperCase() })
    }
    const words = trimmed.split(/\s+/)
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i] && words[i] === words[i + 1]) {
        const pos = trimmed.indexOf(words[i] + ' ' + words[i + 1])
        errors.push({ text: `${words[i]} ${words[i + 1]}`, offset: offset + pos, length: words[i].length * 2 + 1, message: '重复词语', suggestion: words[i] })
      }
    }
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
      if (!/[.。!！]$/.test(trimmed)) {
        errors.push({ text: trimmed.slice(-1), offset: offset + trimmed.length - 1, length: 1, message: '要点缺少句末标点', suggestion: trimmed.slice(-1) + '。' })
      }
    }
    offset += line.length + 1
  }
  return errors
}

function calcFitness(resume: Resume) {
  const skills = getResumeSkills(resume.sections)
  const expSection = resume.sections.find((s: ResumeSection) => s.type === 'experience')
  const eduSection = resume.sections.find((s: ResumeSection) => s.type === 'education')
  const kd = resume.keywordDensity
  const dims = [
    { name: '技能匹配', score: Math.min(100, skills.length * 15), benchmark: 70 },
    { name: '经验相关性', score: expSection ? 75 : 30, benchmark: 65 },
    { name: '教育背景', score: eduSection ? 80 : 40, benchmark: 60 },
    { name: '关键词密度', score: kd.atsScore, benchmark: 70 },
    { name: '格式规范', score: resume.sections.length >= 3 ? 85 : 50, benchmark: 65 },
  ]
  const overall = Math.round(dims.reduce((s, d) => s + d.score, 0) / dims.length)
  return { overall, dimensions: dims }
}

function buildSuggestions(fitness: ReturnType<typeof calcFitness>) {
  const list: Suggestion[] = []
  fitness.dimensions.forEach((d) => {
    if (d.score < d.benchmark) {
      list.push({ priority: d.score < d.benchmark - 20 ? 'high' : d.score < d.benchmark - 10 ? 'medium' : 'low', category: d.name, content: `${d.name}得分${d.score}分，低于行业基准${d.benchmark}分，建议优化` })
    }
  })
  return list.sort((a, b) => (a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2) - (b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2))
}

const PRIORITY_BADGE = { high: 'bg-coral/10 text-coral', medium: 'bg-amber-400/10 text-amber-500', low: 'bg-navy-100 text-navy-500' }
const PRIORITY_LABEL = { high: '高', medium: '中', low: '低' }

export default function ResumeDiagnosis() {
  const { id } = useParams()
  const { resumes } = useStore()
  const resume = useMemo(() => {
    if (id === 'new') return resumes[0]
    return resumes.find((r) => r.id === id) || resumes[0]
  }, [resumes, id])

  const [activeTab, setActiveTab] = useState<TabKey>('jd')
  const [jdText, setJdText] = useState('')
  const [jdResult, setJdResult] = useState<ReturnType<typeof analyzeJd> | null>(null)
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
  const [grammarChecked, setGrammarChecked] = useState(false)

  const resumeSkills = useMemo(() => resume ? getResumeSkills(resume.sections) : [], [resume])
  const resumeText = useMemo(() => resume ? extractResumeText(resume.sections) : '', [resume])
  const fitness = useMemo(() => resume ? calcFitness(resume) : null, [resume])
  const suggestions = useMemo(() => fitness ? buildSuggestions(fitness) : [], [fitness])

  const handleJdMatch = () => {
    if (!resume) return
    setJdResult(analyzeJd(jdText, resumeSkills))
  }

  const handleGrammarCheck = () => {
    setGrammarErrors(checkGrammar(resumeText))
    setGrammarChecked(true)
  }

  const handleFix = (idx: number) => {
    setGrammarErrors((prev) => prev.filter((_, i) => i !== idx))
  }

  if (!resume) return <div className="p-8 text-center text-navy-400">未找到简历数据</div>

  const scoreColor = (s: number) => s >= 80 ? 'text-emerald' : s >= 60 ? 'text-amber-500' : 'text-coral'

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-ivory min-h-screen">
      <h1 className="section-title">简历智能诊断</h1>
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.key ? 'btn-primary' : 'bg-white text-navy-500 hover:bg-navy-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'jd' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-navy-700">职位描述</h3>
            <textarea
              className="input-field h-64 resize-none"
              placeholder="粘贴目标岗位的职位描述..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
            <button className="btn-amber flex items-center gap-2" onClick={handleJdMatch}>
              <Play size={15} /> 开始匹配
            </button>
          </div>
          {jdResult && (
            <div className="space-y-4">
              <div className="glass-card p-6 text-center">
                <p className="text-sm text-graphite/60 mb-1">匹配度</p>
                <p className={`text-5xl font-bold font-display ${scoreColor(jdResult.score)}`}>{jdResult.score}%</p>
              </div>
              <div className="glass-card p-6">
                <p className="text-sm font-medium text-emerald mb-2 flex items-center gap-1"><CheckCircle2 size={14} /> 匹配技能</p>
                <div className="flex flex-wrap gap-2">
                  {jdResult.matched.length ? jdResult.matched.map((s) => (
                    <span key={s} className="bg-emerald/10 text-emerald text-xs font-medium px-2.5 py-1 rounded-full">{s}</span>
                  )) : <span className="text-xs text-graphite/50">无</span>}
                </div>
              </div>
              <div className="glass-card p-6">
                <p className="text-sm font-medium text-coral mb-2 flex items-center gap-1"><XCircle size={14} /> 缺失技能</p>
                <div className="flex flex-wrap gap-2">
                  {jdResult.missing.length ? jdResult.missing.map((s) => (
                    <span key={s} className="bg-coral/10 text-coral text-xs font-medium px-2.5 py-1 rounded-full">{s}</span>
                  )) : <span className="text-xs text-graphite/50">无</span>}
                </div>
              </div>
              {jdResult.overlap.length > 0 && (
                <div className="glass-card p-6">
                  <p className="text-sm font-medium text-navy-700 mb-3">关键词重叠</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={jdResult.overlap}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="overlap" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'grammar' && (
        <div className="space-y-4">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy-700">简历文本</h3>
              <button className="btn-amber flex items-center gap-2 text-sm" onClick={handleGrammarCheck}>
                <Play size={14} /> 开始检查
              </button>
            </div>
            <div className="bg-white rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {resumeText.split('').map((char, i) => {
                const hasError = grammarErrors.some((e) => i >= e.offset && i < e.offset + e.length)
                return <span key={i} className={hasError ? 'underline decoration-red-500 decoration-2 decoration-wavy' : ''}>{char}</span>
              })}
            </div>
          </div>
          {grammarChecked && (
            <div className="glass-card p-6">
              <h3 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                发现 {grammarErrors.length} 个问题
              </h3>
              {grammarErrors.length === 0 ? (
                <p className="text-sm text-emerald">未发现语法问题，内容规范！</p>
              ) : (
                <div className="space-y-3">
                  {grammarErrors.map((err, i) => (
                    <div key={i} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-navy-700">
                          <span className="line-through text-coral">{err.text}</span>
                          {' → '}
                          <span className="text-emerald font-medium">{err.suggestion}</span>
                        </p>
                        <p className="text-xs text-graphite/50 mt-0.5">{err.message}</p>
                      </div>
                      <button
                        className="btn-secondary text-xs px-3 py-1 ml-3 shrink-0"
                        onClick={() => handleFix(i)}
                      >
                        修复
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'fitness' && fitness && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-navy-700 mb-4">能力雷达图</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={fitness.dimensions}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="你的得分" dataKey="score" stroke="#1e3a5f" fill="#1e3a5f" fillOpacity={0.25} />
                  <Radar name="行业基准" dataKey="benchmark" stroke="#f59e0b" fill="none" strokeDasharray="5 5" />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2 text-xs text-graphite/60">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-navy-500 inline-block" /> 你的得分</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block border-dashed" /> 行业基准</span>
              </div>
            </div>
            <div className="glass-card p-6 flex flex-col items-center justify-center">
              <p className="text-sm text-graphite/60 mb-2">综合评分</p>
              <p className={`text-6xl font-bold font-display ${scoreColor(fitness.overall)}`}>
                {fitness.overall}
              </p>
              <div className="mt-4 w-full">
                {fitness.dimensions.map((d) => (
                  <div key={d.name} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-navy-600">{d.name}</span>
                    <span className={scoreColor(d.score)}>{d.score}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {suggestions.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
                <Wrench size={16} className="text-amber-500" /> 优化建议
              </h3>
              <div className="space-y-3">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${PRIORITY_BADGE[s.priority]}`}>
                      {PRIORITY_LABEL[s.priority]}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-navy-700">{s.category}</p>
                      <p className="text-xs text-graphite/60 mt-0.5">{s.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
