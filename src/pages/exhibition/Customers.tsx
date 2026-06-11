import { useState, useMemo } from 'react'
import { Users, Tag, Link2, TrendingUp } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { customerNodes } from '@/data/mockData'

const levelColors: Record<string, { fill: string; stroke: string; text: string; bg: string }> = {
  A: { fill: '#d1fae5', stroke: '#059669', text: 'text-emerald-700', bg: 'bg-emerald-100' },
  B: { fill: '#dbeafe', stroke: '#2563eb', text: 'text-blue-700', bg: 'bg-blue-100' },
  C: { fill: '#fef3c7', stroke: '#d97706', text: 'text-amber-700', bg: 'bg-amber-100' },
  D: { fill: '#f3f4f6', stroke: '#6b7280', text: 'text-gray-700', bg: 'bg-gray-100' },
}

const levelLabels: Record<string, string> = { A: 'A级-VIP', B: 'B级-活跃', C: 'C级-新客', D: 'D级-待跟进' }

interface NodePosition {
  id: string
  name: string
  level: string
  value: number
  tags: string[]
  connections: string[]
  x: number
  y: number
}

function useGraphLayout() {
  return useMemo<NodePosition[]>(() => {
    const centerX = 300
    const centerY = 250
    const radius = 160
    const count = customerNodes.length

    return customerNodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      }
    })
  }, [])
}

export default function Customers() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const positions = useGraphLayout()
  const selected = customerNodes.find((n) => n.id === selectedId)

  const stats = {
    total: customerNodes.length,
    a: customerNodes.filter((n) => n.level === 'A').length,
    b: customerNodes.filter((n) => n.level === 'B').length,
    c: customerNodes.filter((n) => n.level === 'C').length,
    d: customerNodes.filter((n) => n.level === 'D').length,
  }

  return (
    <div className="p-6 animate-fade-in-up">
      <PageHeader title="客户关系图谱" subtitle="可视化客户网络与关系链" />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '总客户数', value: stats.total, color: 'text-gray-900', icon: <Users size={18} className="text-emerald-600" /> },
          { label: 'A级客户', value: stats.a, color: 'text-emerald-600', icon: <TrendingUp size={18} className="text-emerald-600" /> },
          { label: 'B级客户', value: stats.b, color: 'text-blue-600', icon: <Users size={18} className="text-blue-600" /> },
          { label: 'C/D级客户', value: stats.c + stats.d, color: 'text-amber-600', icon: <Users size={18} className="text-amber-600" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">{s.icon}</div>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">关系网络</h3>
          </div>
          <svg viewBox="0 0 600 500" className="w-full" style={{ minHeight: 400 }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {positions.map((node) =>
              node.connections.map((targetId) => {
                const target = positions.find((p) => p.id === targetId)
                if (!target || node.id > targetId) return null
                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={node.x}
                    y1={node.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="#e5e7eb"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                  />
                )
              })
            )}
            {positions.map((node) => {
              const colors = levelColors[node.level]
              const r = 16 + (node.value / 85) * 16
              const isSelected = selectedId === node.id
              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedId(isSelected ? null : node.id)}
                  className="cursor-pointer"
                >
                  {isSelected && (
                    <circle cx={node.x} cy={node.y} r={r + 6} fill="none" stroke={colors.stroke} strokeWidth={2} strokeDasharray="3 3" opacity={0.5} />
                  )}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth={isSelected ? 3 : 2}
                    filter={isSelected ? 'url(#glow)' : undefined}
                  />
                  <text
                    x={node.x}
                    y={node.y + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={12}
                    fontWeight={600}
                    fill={colors.stroke}
                  >
                    {node.name.slice(0, 1)}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + r + 16}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#6b7280"
                  >
                    {node.name}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <div className="space-y-4">
          {selected ? (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl ${levelColors[selected.level].bg} flex items-center justify-center`}>
                  <span className={`text-lg font-bold ${levelColors[selected.level].text}`}>
                    {selected.name.slice(0, 1)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                  <span className={`text-xs font-medium ${levelColors[selected.level].text}`}>
                    {levelLabels[selected.level]}
                  </span>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1"><TrendingUp size={14} />客户价值</span>
                  <span className="text-sm font-semibold text-gray-900">{selected.value}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1"><Link2 size={14} />关联客户</span>
                  <span className="text-sm font-semibold text-gray-900">{selected.connections.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1"><Tag size={14} />标签</span>
                  <div className="flex gap-1">
                    {selected.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">关联客户</p>
                <div className="space-y-2">
                  {selected.connections.map((cid) => {
                    const conn = customerNodes.find((n) => n.id === cid)
                    if (!conn) return null
                    return (
                      <button
                        key={cid}
                        onClick={() => setSelectedId(cid)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-7 h-7 rounded-lg ${levelColors[conn.level].bg} flex items-center justify-center`}>
                          <span className={`text-xs font-semibold ${levelColors[conn.level].text}`}>{conn.name.slice(0, 1)}</span>
                        </div>
                        <span className="text-sm text-gray-700">{conn.name}</span>
                        <span className={`text-xs ${levelColors[conn.level].text}`}>{conn.level}级</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-center py-8">
                <Users size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">点击节点查看客户详情</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-3">等级说明</h4>
            <div className="space-y-2">
              {Object.entries(levelLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md ${levelColors[key].bg} flex items-center justify-center`}>
                    <span className={`text-xs font-bold ${levelColors[key].text}`}>{key}</span>
                  </div>
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
