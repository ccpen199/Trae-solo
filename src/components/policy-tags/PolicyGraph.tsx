import { FileText, Tag, Users } from 'lucide-react'

const centerPolicy = {
  id: 1,
  title: '关于2026年调整退休人员基本养老金的通知',
  shortTitle: '养老金调整通知',
}

const relatedPolicies = [
  { id: 2, title: '完善灵活就业人员养老保险政策', shortTitle: '灵活就业养老' },
  { id: 3, title: '城乡居民基本医疗保险工作', shortTitle: '居民医保' },
  { id: 4, title: '失业保险金标准调整', shortTitle: '失业保险调整' },
]

const relatedTags = ['养老保险', '养老待遇', '待遇调整', '退休人员', '基础养老金']

const targetCrowds = ['企业职工', '灵活就业', '城乡居民', '退休人员', '失业人员', '工伤人员']

const policyColor = '#165DFF'
const tagColor = '#00B42A'
const crowdColor = '#FF7D00'

export default function PolicyGraph() {
  const cx = 280
  const cy = 220
  const r1 = 100
  const r2 = 170

  const policyNodes = relatedPolicies.map((p, i) => {
    const angle = (Math.PI * 2 * i) / relatedPolicies.length - Math.PI / 2
    return {
      ...p,
      x: cx + r1 * Math.cos(angle),
      y: cy + r1 * Math.sin(angle) - 40,
    }
  })

  const tagNodes = relatedTags.map((t, i) => {
    const angle = (Math.PI * 2 * i) / relatedTags.length + Math.PI / 6
    return {
      name: t,
      x: cx + r2 * Math.cos(angle),
      y: cy + r2 * Math.sin(angle),
    }
  })

  const crowdNodes = targetCrowds.map((c, i) => {
    const angle = (Math.PI * 2 * i) / targetCrowds.length + Math.PI / 2
    return {
      name: c,
      x: cx + r1 * Math.cos(angle) + 50,
      y: cy + r1 * Math.sin(angle) + 50,
    }
  })

  return (
    <div className="border border-gray-100 rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-900">政策图谱</h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-gray-500">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: policyColor }} />
            政策
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tagColor }} />
            标签
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: crowdColor }} />
            人群
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-3">中心节点: {centerPolicy.shortTitle}</p>

      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 560 460" className="w-full h-full max-h-[360px]">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {policyNodes.map((n) => (
            <line key={`line-p-${n.id}`} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={policyColor} strokeOpacity={0.25} strokeWidth={1.5} />
          ))}
          {tagNodes.map((n, i) => (
            <line key={`line-t-${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={tagColor} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="3 3" />
          ))}
          {crowdNodes.map((n, i) => (
            <line key={`line-c-${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke={crowdColor} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="2 2" />
          ))}

          {policyNodes.map((n) => (
            <g key={`node-p-${n.id}`}>
              <circle cx={n.x} cy={n.y} r={30} fill={policyColor} fillOpacity={0.08} stroke={policyColor} strokeWidth={1.5} />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={11} fill={policyColor} fontWeight={500}>
                {n.shortTitle}
              </text>
            </g>
          ))}

          {tagNodes.map((n, i) => (
            <g key={`node-t-${i}`}>
              <rect
                x={n.x - 36}
                y={n.y - 12}
                width={72}
                height={24}
                rx={12}
                fill={tagColor}
                fillOpacity={0.08}
                stroke={tagColor}
                strokeWidth={1.2}
              />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={10} fill={tagColor} fontWeight={500}>
                {n.name}
              </text>
            </g>
          ))}

          {crowdNodes.map((n, i) => (
            <g key={`node-c-${i}`}>
              <circle cx={n.x} cy={n.y} r={22} fill={crowdColor} fillOpacity={0.08} stroke={crowdColor} strokeWidth={1.2} />
              <text x={n.x} y={n.y + 3} textAnchor="middle" fontSize={9} fill={crowdColor} fontWeight={500}>
                {n.name.length > 4 ? n.name.slice(0, 4) : n.name}
              </text>
            </g>
          ))}

          <g filter="url(#glow)">
            <circle cx={cx} cy={cy} r={48} fill={policyColor} fillOpacity={0.12} stroke={policyColor} strokeWidth={2.5} />
            <circle cx={cx} cy={cy} r={40} fill={policyColor} />
            <text x={cx} y={cy - 10} textAnchor="middle" fontSize={12} fill="#fff" fontWeight={600}>
              中心政策
            </text>
            <text x={cx} y={cy + 8} textAnchor="middle" fontSize={10} fill="#fff" fillOpacity={0.9}>
              养老金调整
            </text>
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 mt-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50">
          <div className="w-7 h-7 rounded flex items-center justify-center bg-blue-50">
            <FileText size={14} className="text-primary" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-900">{relatedPolicies.length + 1}</div>
            <div className="text-[10px] text-gray-400">关联政策</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50/50">
          <div className="w-7 h-7 rounded flex items-center justify-center bg-green-50">
            <Tag size={14} className="text-green-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-900">{relatedTags.length}</div>
            <div className="text-[10px] text-gray-400">关联标签</div>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50/50">
          <div className="w-7 h-7 rounded flex items-center justify-center bg-orange-50">
            <Users size={14} className="text-orange-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-900">{targetCrowds.length}</div>
            <div className="text-[10px] text-gray-400">适用人群</div>
          </div>
        </div>
      </div>
    </div>
  )
}
