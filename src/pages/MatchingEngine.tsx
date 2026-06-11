import { useState } from 'react'
import {
  Cpu,
  ChevronDown,
  ChevronUp,
  Search,
  Brain,
  Users,
  MapPin,
  GraduationCap,
  Building2,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { matchResults, industryClusters } from '../data/mockData'
import { usePositionStore } from '../store/PositionStore'

const candidateMap: Record<string, string[]> = {
  j1: ['r1', 'r3', 'r2'],
  j2: ['r2', 'r1', 'r3'],
  j3: ['r3', 'r1', 'r2'],
}

const candidateDetails: Record<string, { title: string; tags: string[] }> = {
  r1: { title: '高级功能安全工程师', tags: ['同济大学', '理想汽车', '比亚迪'] },
  r2: { title: 'BMS算法工程师', tags: ['清华大学', '蔚来汽车', '宁德时代'] },
  r3: { title: '底盘悬架CAE工程师', tags: ['吉林大学', '吉利汽车', '一汽轿车'] },
}

const semanticDetails: Record<string, { keyword: string; source: string; match: boolean }[]> = {
  r1: [
    { keyword: '功能安全 ISO 26262', source: '项目: L3级自动驾驶功能安全开发', match: true },
    { keyword: 'ASPICE流程', source: '项目: L3级自动驾驶功能安全开发', match: true },
    { keyword: 'AUTOSAR架构', source: '项目: 整车电子电气架构升级', match: true },
    { keyword: '车型量产经验', source: '理想L9 + 比亚迪汉EV项目', match: true },
    { keyword: 'CATIA V5', source: '简历未提及', match: false },
  ],
  r2: [
    { keyword: 'BMS算法开发', source: '项目: CTP电池包BMS开发', match: true },
    { keyword: 'MATLAB/Simulink', source: '项目: CTP电池包BMS开发', match: true },
    { keyword: '功能安全 ISO 26262', source: '简历未提及', match: false },
    { keyword: 'AUTOSAR', source: '简历未提及', match: false },
  ],
  r3: [
    { keyword: 'ADAMS仿真', source: '项目: 多连杆悬架优化', match: true },
    { keyword: 'CATIA设计', source: '项目: 电动车平台底盘开发', match: true },
    { keyword: 'FMEA分析', source: '项目: 多连杆悬架优化', match: true },
    { keyword: 'ASPICE', source: '简历未提及', match: false },
  ],
}

const networkDetails: Record<string, { type: string; name: string; company: string; overlap: string }[]> = {
  r1: [
    { type: '校友', name: '陈某某', company: '目标企业-自动驾驶部', overlap: '同济大学车辆工程2014届' },
    { type: '校友', name: '刘某某', company: '目标企业-系统架构组', overlap: '同济大学车辆工程2015届' },
    { type: '前同事', name: '赵某某', company: '目标企业-功能安全组', overlap: '理想汽车(2022-2023)' },
  ],
  r2: [
    { type: '校友', name: '王某某', company: '目标企业-电池部', overlap: '清华大学电气工程2017届' },
    { type: '前同事', name: '张某某', company: '目标企业-电池研发组', overlap: '蔚来汽车(2021-2023)' },
    { type: '前同事', name: '李某某', company: '目标企业-BMS组', overlap: '宁德时代(2019-2021)' },
  ],
  r3: [
    { type: '校友', name: '孙某某', company: '目标企业-底盘部', overlap: '吉林大学车辆工程2012届' },
    { type: '前同事', name: '周某某', company: '目标企业-CAE组', overlap: '一汽轿车(2015-2018)' },
  ],
}

const regionalDetails: Record<string, { city: string; reason: string; companies: string; fit: string }[]> = {
  r1: [
    { city: '北京', reason: '候选人当前所在城市，理想汽车总部', companies: '理想/小米汽车/北汽', fit: '高度匹配' },
    { city: '上海', reason: '自动驾驶研发聚集地', companies: '上汽/蔚来R&D', fit: '推荐' },
  ],
  r2: [
    { city: '上海', reason: '候选人当前城市，新能源核心城市', companies: '蔚来/上汽/特斯拉', fit: '高度匹配' },
    { city: '合肥', reason: '蔚来生产基地，新能源产业链完善', companies: '蔚来/大众安徽/江淮', fit: '推荐' },
  ],
  r3: [
    { city: '长春', reason: '候选人当前城市，一汽集团核心基地', companies: '一汽集团/一汽大众', fit: '高度匹配' },
    { city: '武汉', reason: '东风集团总部，传统+新能源转型', companies: '东风/路特斯/小鹏', fit: '推荐' },
  ],
}

const clusterData = [
  { city: '上海', weight: 96, enterprises: '上汽、特斯拉、蔚来R&D', field: '全产业链' },
  { city: '长春', weight: 95, enterprises: '一汽集团、一汽大众、一汽解放', field: '传统制造' },
  { city: '合肥', weight: 92, enterprises: '蔚来、大众安徽、江淮', field: '新能源' },
  { city: '深圳', weight: 91, enterprises: '比亚迪、华为车BU、元戎启行', field: '新能源+智驾' },
  { city: '北京', weight: 90, enterprises: '理想、小米汽车、北汽', field: '智能驾驶' },
]

const highlightIcons = {
  semantic: Brain,
  network: Users,
  regional: MapPin,
}

const dimensionConfig = [
  { key: 'semantic' as const, label: '语义相似度', color: 'bg-blue-500', barColor: '#3b82f6' },
  { key: 'network' as const, label: '行业人脉热度', color: 'bg-purple-500', barColor: '#a855f7' },
  { key: 'regional' as const, label: '地域产业聚集度', color: 'bg-emerald-500', barColor: '#10b981' },
]

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-700 w-10 text-right">{value}</span>
    </div>
  )
}

function getScoreColor(score: number) {
  if (score >= 85) return 'text-emerald-600'
  if (score >= 75) return 'text-amber-500'
  return 'text-red-500'
}

function getScoreBg(score: number) {
  if (score >= 85) return 'from-emerald-50 to-emerald-100/50 border-emerald-200'
  if (score >= 75) return 'from-amber-50 to-amber-100/50 border-amber-200'
  return 'from-red-50 to-red-100/50 border-red-200'
}

export default function MatchingEngine() {
  const { positions: storePositions } = usePositionStore()
  const positions = storePositions.map((p) => ({
    id: p.id,
    label: `${p.title} (${p.department})`,
  }))
  const [selectedPosition, setSelectedPosition] = useState(storePositions[0]?.id ?? 'j1')
  const [semanticWeight, setSemanticWeight] = useState(40)
  const [networkWeight, setNetworkWeight] = useState(30)
  const [regionalWeight, setRegionalWeight] = useState(30)
  const [matched, setMatched] = useState(true)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({ r1: true, r2: true, r3: true })

  const totalWeight = semanticWeight + networkWeight + regionalWeight

  const handleMatch = () => {
    setMatched(true)
  }

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const orderedCandidateIds = candidateMap[selectedPosition] || ['r1', 'r2', 'r3']
  const orderedResults = orderedCandidateIds
    .map((cid) => matchResults.find((r) => r.candidateId === cid))
    .filter(Boolean)

  const recalcScores = orderedResults.map((r) => {
    if (!r) return r
    const semantic = (r.semanticScore * semanticWeight) / 100
    const network = (r.networkScore * networkWeight) / 100
    const regional = (r.regionalScore * regionalWeight) / 100
    const total = semantic + network + regional
    return { ...r, totalScore: Math.round(total * 10) / 10 }
  })

  const sortedResults = [...recalcScores].sort((a, b) => (b?.totalScore || 0) - (a?.totalScore || 0))
  const selectedPositionDetail = storePositions.find((p) => p.id === selectedPosition)

  const chartData = industryClusters
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8)
    .map((c) => ({ city: c.city, weight: c.weight }))

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-600 rounded-xl">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">多维匹配引擎</h1>
          <p className="text-sm text-slate-500">语义相似度 × 行业人脉热度 × 地域产业聚集度 融合匹配</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-800">匹配配置</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">选择目标岗位</label>
            <div className="relative">
              <select
                value={selectedPosition}
                onChange={(e) => {
                  setSelectedPosition(e.target.value)
                  setMatched(false)
                }}
                className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              >
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-sm font-medium text-slate-600">权重调节</h3>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-slate-700">语义相似度</span>
                </div>
                <span className="text-sm font-bold text-blue-600">{semanticWeight}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={semanticWeight}
                onChange={(e) => {
                  setSemanticWeight(Number(e.target.value))
                  setMatched(false)
                }}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-slate-700">行业人脉热度</span>
                </div>
                <span className="text-sm font-bold text-purple-600">{networkWeight}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={networkWeight}
                onChange={(e) => {
                  setNetworkWeight(Number(e.target.value))
                  setMatched(false)
                }}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700">地域产业聚集度</span>
                </div>
                <span className="text-sm font-bold text-emerald-600">{regionalWeight}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={regionalWeight}
                onChange={(e) => {
                  setRegionalWeight(Number(e.target.value))
                  setMatched(false)
                }}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {totalWeight !== 100 && (
              <p className="text-xs text-amber-600 font-medium">
                ⚠ 当前权重总和为 {totalWeight}%，建议调整至 100%
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleMatch}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 active:scale-95"
          >
            <Search className="w-4 h-4" />
            开始匹配
          </button>
        </div>
      </div>

      {matched && (
        <div className="space-y-4">
          {selectedPositionDetail && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">岗位语义依据 · {selectedPositionDetail.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedPositionDetail.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedPositionDetail.requiredSkills.map((skill) => (
                      <span key={skill} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{skill}</span>
                    ))}
                    {selectedPositionDetail.constraints.map((constraint, index) => (
                      <span key={`${constraint.label}-${index}`} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        {constraint.label}: {constraint.value}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-slate-400">语义权重</p>
                    <p className="mt-1 font-bold text-blue-600">{semanticWeight}%</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-slate-400">人脉权重</p>
                    <p className="mt-1 font-bold text-purple-600">{networkWeight}%</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-slate-400">地域权重</p>
                    <p className="mt-1 font-bold text-emerald-600">{regionalWeight}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-800">匹配结果</h2>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              {sortedResults.length} 位候选人
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {sortedResults.map((result, idx) => {
              if (!result) return null
              const details = candidateDetails[result.candidateId]
              const isExpanded = expandedCards[result.candidateId]

              return (
                <div
                  key={result.candidateId}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md`}
                >
                  <div className={`bg-gradient-to-r ${getScoreBg(result.totalScore)} p-5 border-b`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-800">{result.candidateName}</span>
                          <span className="text-xs bg-white/80 text-slate-600 px-2 py-0.5 rounded-full">
                            #{idx + 1}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5">{details?.title}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(result.totalScore)}`}>
                          {result.totalScore}
                        </div>
                        <p className="text-xs text-slate-400">综合得分</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="space-y-3">
                      {dimensionConfig.map((dim) => {
                        const scoreKey = `${dim.key}Score` as 'semanticScore' | 'networkScore' | 'regionalScore'
                        return (
                          <div key={dim.key}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-xs font-medium text-slate-500">{dim.label}</span>
                            </div>
                            <ScoreBar value={result[scoreKey]} color={dim.color} />
                          </div>
                        )
                      })}
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <button
                        onClick={() => toggleExpand(result.candidateId)}
                        className="flex items-center justify-between w-full text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
                      >
                        <span>匹配亮点</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-4">
                          <div className="space-y-2.5">
                            <p className="text-xs font-semibold text-slate-600">匹配亮点</p>
                            {result.highlights.map((h, i) => {
                              const Icon = highlightIcons[h.type]
                              return (
                                <div
                                  key={i}
                                  className="flex gap-2.5 p-2.5 bg-slate-50 rounded-lg"
                                >
                                  <Icon className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700">{h.description}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{h.detail}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          {semanticDetails[result.candidateId] && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5">
                                <Brain className="w-3.5 h-3.5 text-blue-500" />
                                <p className="text-xs font-semibold text-slate-600">语义匹配依据</p>
                              </div>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-slate-200">
                                    <th className="text-left py-1.5 px-2 font-semibold text-slate-500">JD关键词</th>
                                    <th className="text-left py-1.5 px-2 font-semibold text-slate-500">来源</th>
                                    <th className="text-center py-1.5 px-2 font-semibold text-slate-500 w-12">匹配</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {semanticDetails[result.candidateId].map((s, si) => (
                                    <tr key={si} className="border-b border-slate-50">
                                      <td className="py-1.5 px-2 text-slate-700 font-medium">{s.keyword}</td>
                                      <td className={`py-1.5 px-2 ${s.match ? 'text-slate-600' : 'text-slate-400'}`}>{s.source}</td>
                                      <td className="py-1.5 px-2 text-center">
                                        {s.match ? (
                                          <span className="text-emerald-500 font-bold">✓</span>
                                        ) : (
                                          <span className="text-red-400 font-bold">✗</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {networkDetails[result.candidateId] && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-purple-500" />
                                <p className="text-xs font-semibold text-slate-600">人脉溯源</p>
                              </div>
                              <div className="space-y-2">
                                {networkDetails[result.candidateId].map((n, ni) => (
                                  <div key={ni} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                                    <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
                                      n.type === '校友' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                    }`}>
                                      {n.type}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-slate-700">{n.name} · <span className="font-normal text-slate-500">{n.company}</span></p>
                                      <p className="text-[11px] text-slate-400 mt-0.5">{n.overlap}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {regionalDetails[result.candidateId] && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                <p className="text-xs font-semibold text-slate-600">地域推荐依据</p>
                              </div>
                              <div className="space-y-2">
                                {regionalDetails[result.candidateId].map((r, ri) => (
                                  <div key={ri} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                                    <span className={`inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 ${
                                      r.fit === '高度匹配' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {r.fit}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-slate-700">{r.city} · <span className="font-normal text-slate-500">{r.reason}</span></p>
                                      <p className="text-[11px] text-slate-400 mt-0.5">代表企业: {r.companies}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {details?.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium"
                        >
                          {tag.includes('大学') ? (
                            <GraduationCap className="w-3 h-3" />
                          ) : (
                            <Building2 className="w-3 h-3" />
                          )}
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-800">地域产业聚集度分布</h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">城市</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">产业聚集度</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">代表企业</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">优先领域</th>
                </tr>
              </thead>
              <tbody>
                {clusterData.map((c) => (
                  <tr key={c.city} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 text-sm">{c.city}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              c.weight >= 95
                                ? 'bg-emerald-500'
                                : c.weight >= 90
                                  ? 'bg-blue-500'
                                  : 'bg-amber-400'
                            }`}
                            style={{ width: `${c.weight}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{c.weight}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-slate-600">{c.enterprises}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {c.field}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="city" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#334155', fontWeight: 600 }} width={50} />
                <Tooltip
                  formatter={(value: number) => [`${value}`, '聚集度']}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="weight" radius={[0, 6, 6, 0]} barSize={20}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.city}
                      fill={
                        entry.weight >= 95
                          ? '#10b981'
                          : entry.weight >= 90
                            ? '#3b82f6'
                            : '#f59e0b'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
