import { useState, useEffect, useMemo } from 'react'
import { Network, Award, X, Briefcase } from 'lucide-react'
import { LoadingSpinner } from '@/components/Shared'
import { fetchApi } from '@/utils/api'
import type { SkillNode, CertMapping } from '@/types'

const categoryColors: Record<string, string> = {
  '设计工具': '#38BDF8',
  '仿真分析': '#A855F7',
  '开发工具': '#22C55E',
  '过程标准': '#F59E0B',
  '测试验证': '#EF4444',
}

const categoryBg: Record<string, string> = {
  '设计工具': 'bg-ice-500/20 text-ice-400 border-ice-500/30',
  '仿真分析': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  '开发工具': 'bg-green-500/20 text-green-400 border-green-500/30',
  '过程标准': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  '测试验证': 'bg-red-500/20 text-red-400 border-red-500/30',
}

interface NodePos {
  id: string
  x: number
  y: number
  r: number
  name: string
  category: string
  hotJobs: number
}

function computePositions(nodes: SkillNode[], cx: number, cy: number): NodePos[] {
  const categories = [...new Set(nodes.map((n) => n.category))]
  const catCount = categories.length
  const sectorAngle = (2 * Math.PI) / catCount
  const baseRadius = Math.min(cx, cy) * 0.65

  return nodes.map((node) => {
    const catIdx = categories.indexOf(node.category)
    const catNodes = nodes.filter((n) => n.category === node.category)
    const nodeIdx = catNodes.indexOf(node)
    const totalInCat = catNodes.length
    const startAngle = catIdx * sectorAngle - Math.PI / 2
    const angleStep = sectorAngle / (totalInCat + 1)
    const angle = startAngle + angleStep * (nodeIdx + 1)
    const rOffset = (nodeIdx % 2 === 0 ? 0 : 0.15) * baseRadius
    const r = baseRadius * 0.6 + rOffset
    const maxHot = Math.max(...nodes.map((n) => n.hotJobs), 1)
    const nr = 8 + (node.hotJobs / maxHot) * 18

    return {
      id: node.id,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      r: nr,
      name: node.name,
      category: node.category,
      hotJobs: node.hotJobs,
    }
  })
}

function SkillGraphTab({ nodes, onSelect }: { nodes: SkillNode[]; onSelect: (n: SkillNode) => void }) {
  const svgW = 700
  const svgH = 500
  const positions = useMemo(() => computePositions(nodes, svgW / 2, svgH / 2), [nodes])

  const edges = useMemo(() => {
    const pairs: { from: NodePos; to: NodePos }[] = []
    const posByName = new Map(positions.map((p) => [p.name, p]))
    for (const node of nodes) {
      for (const relName of node.relatedSkills) {
        const from = posByName.get(node.name)
        const to = posByName.get(relName)
        if (from && to && from.id < to.id) {
          pairs.push({ from, to })
        }
      }
    }
    return pairs
  }, [nodes, positions])

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full">
      {edges.map((e, i) => (
        <line
          key={i}
          x1={e.from.x} y1={e.from.y}
          x2={e.to.x} y2={e.to.y}
          stroke="#1E3A68" strokeWidth={1} opacity={0.5}
        />
      ))}
      {positions.map((p) => (
        <g key={p.id} className="cursor-pointer" onClick={() => {
          const node = nodes.find((n) => n.id === p.id)
          if (node) onSelect(node)
        }}>
          <circle
            cx={p.x} cy={p.y} r={p.r}
            fill={categoryColors[p.category] || '#5A7FB3'}
            fillOpacity={0.3}
            stroke={categoryColors[p.category] || '#5A7FB3'}
            strokeWidth={1.5}
            className="transition-all duration-200 hover:fill-opacity-50 hover:stroke-[3px]"
          />
          <text
            x={p.x} y={p.y + p.r + 14}
            textAnchor="middle"
            fill="#ADC3E0"
            fontSize={10}
          >
            {p.name}
          </text>
          <text
            x={p.x} y={p.y + 4}
            textAnchor="middle"
            fill={categoryColors[p.category] || '#5A7FB3'}
            fontSize={9}
            fontWeight={600}
          >
            {p.hotJobs}
          </text>
        </g>
      ))}
    </svg>
  )
}

function CertMappingTab({ certs }: { certs: CertMapping[] }) {
  return (
    <div className="space-y-3">
      {certs.map((cert) => (
        <div key={cert.id} className="card-glass p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-steel-100">{cert.certification}</span>
          </div>
          <div className="ml-6 space-y-2">
            <div>
              <span className="text-xs text-steel-400">映射职级:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {cert.jobLevels.map((level) => (
                  <span key={level} className="badge-hard">{level}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-xs text-steel-400">关联岗位:</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {cert.requiredFor.map((pos) => (
                  <span key={pos} className="badge-cert">{pos}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SkillDetailPanel({ node, onClose }: { node: SkillNode; onClose: () => void }) {
  const [talents, setTalents] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])

  useEffect(() => {
    fetchApi<any>(`/api/graph/skills/${node.id}/related`)
      .then((data) => {
        setTalents(data?.talents_with_skill || [])
        setJobs(data?.jobs_requiring_skill || [])
      })
      .catch(() => {})
  }, [node.id])

  return (
    <div className="card-glass p-5 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-steel-100">{node.name}</h3>
        <button onClick={onClose} className="text-steel-400 hover:text-steel-200 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-steel-400">类别:</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryBg[node.category] || 'badge-soft'}`}>
            {node.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Briefcase className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-steel-400">热门岗位:</span>
          <span className="font-mono text-sm text-amber-400">{node.hotJobs}</span>
        </div>
        <div>
          <span className="text-xs text-steel-400">关联技能:</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {node.relatedSkills.map((s) => (
              <span key={s} className="badge-soft">{s}</span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs text-steel-400">关联认证:</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {node.relatedCerts.map((c) => (
              <span key={c} className="badge-cert">{c}</span>
            ))}
          </div>
        </div>
        {talents.length > 0 && (
          <div>
            <span className="text-xs text-steel-400">拥有该技能的人才:</span>
            <div className="mt-1.5 space-y-1">
              {talents.slice(0, 5).map((t: any) => (
                <div key={t.id} className="text-xs text-steel-200">{t.name} - {t.current_company} ({t.level})</div>
              ))}
            </div>
          </div>
        )}
        {jobs.length > 0 && (
          <div>
            <span className="text-xs text-steel-400">需要该技能的岗位:</span>
            <div className="mt-1.5 space-y-1">
              {jobs.slice(0, 5).map((j: any) => (
                <div key={j.id} className="text-xs text-steel-200">{j.title} - {j.company}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function GraphPage() {
  const [tab, setTab] = useState<'skills' | 'certs'>('skills')
  const [skills, setSkills] = useState<SkillNode[]>([])
  const [certs, setCerts] = useState<CertMapping[]>([])
  const [selected, setSelected] = useState<SkillNode | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchApi<any>('/api/graph/skills'),
      fetchApi<any>('/api/graph/certifications'),
    ])
      .then(([s, c]) => {
        setSkills(s?.nodes || [])
        setCerts(c?.mappings || [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Network className="w-5 h-5 text-amber-500" />
        <h1 className="section-title mb-0">知识图谱</h1>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('skills')}
          className={tab === 'skills' ? 'btn-primary text-xs' : 'btn-secondary text-xs'}
        >
          技能图谱
        </button>
        <button
          onClick={() => setTab('certs')}
          className={tab === 'certs' ? 'btn-primary text-xs' : 'btn-secondary text-xs'}
        >
          认证映射
        </button>
      </div>

      {tab === 'skills' ? (
        <div className="flex gap-4">
          <div className="card-glass card-hover flex-1 p-4 overflow-hidden" style={{ minHeight: 520 }}>
            <SkillGraphTab nodes={skills} onSelect={setSelected} />
          </div>
          {selected && (
            <div className="w-72 flex-shrink-0">
              <SkillDetailPanel node={selected} onClose={() => setSelected(null)} />
            </div>
          )}
        </div>
      ) : (
        <div className="card-glass card-hover p-5">
          <CertMappingTab certs={certs} />
        </div>
      )}
    </div>
  )
}
