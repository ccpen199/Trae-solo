import { useState } from 'react'
import {
  Search,
  Network,
  Award,
  CircleDot,
  Link2,
  Shield,
  Cpu,
  Wrench,
  Globe,
  X,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { skillTags, certifications, samplePositions, type SkillTag } from '../data/mockData'
import { usePositionStore } from '../store/PositionStore'

const categoryConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Cpu }> = {
  hard: { label: '硬技能', color: 'text-blue-700', bg: 'bg-blue-100', icon: Cpu },
  soft: { label: '软技能', color: 'text-purple-700', bg: 'bg-purple-100', icon: Globe },
  cert: { label: '资质认证', color: 'text-amber-700', bg: 'bg-amber-100', icon: Shield },
  domain: { label: '行业领域', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: Wrench },
}

const certLevelConfig: Record<string, { label: string; color: string; bg: string }> = {
  entry: { label: '初级', color: 'text-slate-600', bg: 'bg-slate-100' },
  intermediate: { label: '中级', color: 'text-blue-600', bg: 'bg-blue-100' },
  advanced: { label: '高级', color: 'text-amber-600', bg: 'bg-amber-100' },
  expert: { label: '专家', color: 'text-rose-600', bg: 'bg-rose-100' },
}

const categoryFilters = [
  { key: 'all', label: '全部' },
  { key: 'hard', label: '硬技能' },
  { key: 'soft', label: '软技能' },
  { key: 'cert', label: '资质认证' },
  { key: 'domain', label: '行业领域' },
]

function getCertsForSkill(skillId: string) {
  return certifications.filter((c) => c.mappedSkills.includes(skillId))
}

function getPositionsForSkill(skillId: string) {
  return samplePositions.filter(
    (p) => p.requiredSkills.includes(skillId) || p.preferredSkills.includes(skillId)
  )
}

function getPositionsForCert(certId: string) {
  return samplePositions.filter((p) => p.requiredCertifications.includes(certId))
}

export default function KnowledgeGraph() {
  usePositionStore()
  const [view, setView] = useState<'skills' | 'certs'>('skills')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSkill, setSelectedSkill] = useState<SkillTag | null>(null)
  const [expandedCert, setExpandedCert] = useState<string | null>(null)

  const filteredSkills = skillTags.filter((s) => {
    const matchCategory = categoryFilter === 'all' || s.category === categoryFilter
    const matchSearch =
      !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchCategory && matchSearch
  })

  const filteredCerts = certifications.filter((c) => {
    const matchSearch =
      !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.issuer.toLowerCase().includes(searchTerm.toLowerCase())
    return matchSearch
  })

  const getSkillById = (id: string) => skillTags.find((s) => s.id === id)

  const categoryCount = (key: string) => {
    if (key === 'all') return skillTags.length
    return skillTags.filter((s) => s.category === key).length
  }

  const handleSkillClick = (skill: SkillTag) => {
    setSelectedSkill(skill)
  }

  const handleRelatedSkillClick = (skillId: string) => {
    const skill = getSkillById(skillId)
    if (skill) setSelectedSkill(skill)
  }

  const handleClosePanel = () => {
    setSelectedSkill(null)
  }

  const handleCertExpand = (certId: string) => {
    setExpandedCert(expandedCert === certId ? null : certId)
  }

  const relatedCerts = selectedSkill ? getCertsForSkill(selectedSkill.id) : []
  const relatedPositions = selectedSkill ? getPositionsForSkill(selectedSkill.id) : []

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 rounded-2xl p-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Network className="w-8 h-8 text-amber-400" />
              <h1 className="text-2xl font-bold">汽车行业知识图谱</h1>
            </div>
            <p className="text-blue-200 text-sm">
              技能标签体系 · 认证映射 · 行业能力模型 — 覆盖 {skillTags.length} 项核心技能与{' '}
              {certifications.length} 项行业认证
            </p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex bg-white/10 rounded-lg p-0.5">
              <button
                onClick={() => { setView('skills'); setSelectedSkill(null); setExpandedCert(null) }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  view === 'skills' ? 'bg-white text-blue-900 shadow' : 'text-blue-200 hover:text-white'
                }`}
              >
                技能标签
              </button>
              <button
                onClick={() => { setView('certs'); setSelectedSkill(null); setExpandedCert(null) }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  view === 'certs' ? 'bg-white text-blue-900 shadow' : 'text-blue-200 hover:text-white'
                }`}
              >
                认证体系
              </button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" />
              <input
                type="text"
                placeholder="搜索技能或认证..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white/15 w-56 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className={`flex-1 min-w-0 space-y-6 transition-all duration-300 ${selectedSkill ? 'mr-0' : ''}`}>
          {view === 'skills' && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                {categoryFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setCategoryFilter(f.key)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                      categoryFilter === f.key
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                    }`}
                  >
                    {f.label}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                        categoryFilter === f.key
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {categoryCount(f.key)}
                    </span>
                  </button>
                ))}
                <span className="ml-auto text-sm text-slate-400">
                  共 {filteredSkills.length} 项技能
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSkills.map((skill) => {
                  const cfg = categoryConfig[skill.category]
                  const Icon = cfg.icon
                  const isSelected = selectedSkill?.id === skill.id
                  return (
                    <div
                      key={skill.id}
                      onClick={() => handleSkillClick(skill)}
                      className={`bg-white rounded-xl border p-5 hover:shadow-lg transition-all duration-200 group cursor-pointer ${
                        isSelected
                          ? 'border-blue-400 shadow-lg ring-2 ring-blue-100'
                          : 'border-slate-200 hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                            {skill.name}
                          </h3>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>

                      <p className="text-sm text-slate-500 mb-3 leading-relaxed line-clamp-2">{skill.description}</p>

                      <div className="flex items-center gap-1 mb-3">
                        <span className="text-xs text-slate-400 mr-1">等级</span>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <CircleDot
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i <= skill.level ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-slate-400 ml-1">{skill.level}/5</span>
                      </div>

                      {skill.relatedSkills.length > 0 && (
                        <div className="border-t border-slate-100 pt-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Link2 className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-400">关联技能</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {skill.relatedSkills.map((rid) => {
                              const related = getSkillById(rid)
                              if (!related) return null
                              const rCfg = categoryConfig[related.category]
                              return (
                                <span
                                  key={rid}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRelatedSkillClick(rid)
                                  }}
                                  className={`text-xs px-2 py-0.5 rounded-full ${rCfg.bg} ${rCfg.color} hover:opacity-75 cursor-pointer transition-opacity`}
                                >
                                  {related.name}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {view === 'certs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCerts.map((cert) => {
                const levelCfg = certLevelConfig[cert.level]
                const isExpanded = expandedCert === cert.id
                const certPositions = getPositionsForCert(cert.id)
                return (
                  <div
                    key={cert.id}
                    className={`bg-white rounded-xl border p-6 hover:shadow-lg transition-all duration-200 group ${
                      isExpanded ? 'border-amber-300 shadow-lg' : 'hover:border-amber-200 border-slate-200'
                    }`}
                  >
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => handleCertExpand(cert.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
                          <Award className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">
                            {cert.name}
                          </h3>
                          <p className="text-sm text-slate-400">{cert.issuer}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${levelCfg.bg} ${levelCfg.color}`}>
                          {levelCfg.label}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {cert.mappedSkills.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Link2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium text-slate-500">关联技能</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {cert.mappedSkills.map((sid) => {
                            const skill = getSkillById(sid)
                            if (!skill) return null
                            const cfg = categoryConfig[skill.category]
                            return (
                              <span
                                key={sid}
                                onClick={() => {
                                  setView('skills')
                                  setSelectedSkill(skill)
                                }}
                                className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} hover:opacity-75 cursor-pointer transition-opacity`}
                              >
                                {skill.name}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-slate-500">行业权重</span>
                        <span className="text-sm font-semibold text-amber-600">{cert.industryWeight}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cert.industryWeight}%`,
                            background:
                              cert.industryWeight >= 90
                                ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                : cert.industryWeight >= 75
                                  ? 'linear-gradient(90deg, #3b82f6, #2563eb)'
                                  : 'linear-gradient(90deg, #64748b, #475569)',
                          }}
                        />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                        {certPositions.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs font-medium text-slate-500">适用岗位</span>
                            </div>
                            <div className="space-y-2">
                              {certPositions.map((pos) => (
                                <div
                                  key={pos.id}
                                  className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-slate-700">{pos.title}</p>
                                    <p className="text-xs text-slate-400">{pos.department} · {pos.location}</p>
                                  </div>
                                  <span className="text-xs text-slate-500">{pos.salary}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {certPositions.length === 0 && (
                          <p className="text-xs text-slate-400 italic">暂无匹配的岗位要求此认证</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {selectedSkill && (
          <div className="w-96 shrink-0 sticky top-6 self-start animate-in slide-in-from-right duration-300">
            <div className="bg-white rounded-xl border border-blue-200 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-slate-50 px-5 py-4 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const cfg = categoryConfig[selectedSkill.category]
                      const Icon = cfg.icon
                      return (
                        <>
                          <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${cfg.color}`} />
                          </div>
                          <div>
                            <h2 className="font-bold text-slate-800">{selectedSkill.name}</h2>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  <button
                    onClick={handleClosePanel}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">技能描述</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedSkill.description}</p>
                </div>

                <div>
                  <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">技能等级</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-500"
                        style={{ width: `${(selectedSkill.level / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-amber-600">{selectedSkill.level}/5</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    {['入门', '基础', '熟练', '精通', '专家'].map((label, i) => (
                      <span
                        key={label}
                        className={`text-[10px] ${i < selectedSkill.level ? 'text-amber-500 font-medium' : 'text-slate-300'}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedSkill.relatedSkills.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">关联技能</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkill.relatedSkills.map((rid) => {
                        const related = getSkillById(rid)
                        if (!related) return null
                        const rCfg = categoryConfig[related.category]
                        return (
                          <button
                            key={rid}
                            onClick={() => handleRelatedSkillClick(rid)}
                            className={`text-xs px-2.5 py-1 rounded-full ${rCfg.bg} ${rCfg.color} hover:opacity-75 transition-opacity cursor-pointer`}
                          >
                            {related.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {relatedCerts.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">相关认证</h3>
                    <div className="space-y-2">
                      {relatedCerts.map((cert) => {
                        const levelCfg = certLevelConfig[cert.level]
                        return (
                          <div
                            key={cert.id}
                            className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2 border border-amber-100"
                          >
                            <div className="flex items-center gap-2">
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-sm text-slate-700">{cert.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${levelCfg.bg} ${levelCfg.color}`}>
                                {levelCfg.label}
                              </span>
                              <span className="text-xs text-amber-600 font-medium">{cert.industryWeight}%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {relatedPositions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide">相关职位</h3>
                    </div>
                    <div className="space-y-2">
                      {relatedPositions.map((pos) => {
                        const isRequired = pos.requiredSkills.includes(selectedSkill.id)
                        return (
                          <div
                            key={pos.id}
                            className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-slate-700">{pos.title}</span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  isRequired
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {isRequired ? '必备' : '优先'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {pos.department} · {pos.location} · {pos.salary}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
