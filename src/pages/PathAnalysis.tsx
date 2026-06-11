import { useMemo } from 'react'
import { useStore } from '@/store'
import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import StatusBadge from '@/components/StatusBadge'
import { GitBranch, AlertCircle, Network } from 'lucide-react'

interface NodeInfo {
  id: string
  label: string
  type: 'citizen' | 'merchant'
  x: number
  y: number
  risk?: boolean
}

interface LinkInfo {
  source: string
  target: string
  abnormal: boolean
}

const WIDTH = 800
const HEIGHT = 400

export default function PathAnalysis() {
  const { riskEvents } = useStore()

  const pathEvents = useMemo(
    () => riskEvents.filter((e) => e.type === 'abnormal_path'),
    [riskEvents]
  )

  const { nodes, links } = useMemo(() => {
    const citizenSet = new Map<string, boolean>()
    const merchantSet = new Map<string, boolean>()
    const linkList: LinkInfo[] = []

    const merchantPool = ['中兴商厦', '万达广场', '老边饺子馆', '中街大悦城', '华润万家']

    pathEvents.forEach((event, idx) => {
      const mId = `m_${idx}`
      merchantSet.set(mId, event.level === 'high' || event.level === 'critical')
      event.accounts.forEach((acc) => {
        citizenSet.set(acc, true)
        linkList.push({ source: acc, target: mId, abnormal: event.status === 'pending' || event.level === 'high' || event.level === 'critical' })
      })
    })

    const citizens = Array.from(citizenSet.keys())
    const merchants = Array.from(merchantSet.keys())

    const citizenNodes: NodeInfo[] = citizens.map((id, i) => ({
      id,
      label: id.replace('user_', '市民'),
      type: 'citizen',
      x: 120,
      y: 60 + i * (HEIGHT - 120) / Math.max(citizens.length - 1, 1),
      risk: linkList.some((l) => l.source === id && l.abnormal),
    }))

    const merchantNodes: NodeInfo[] = merchants.map((id, i) => ({
      id,
      label: merchantPool[i % merchantPool.length],
      type: 'merchant',
      x: WIDTH - 120,
      y: 80 + i * (HEIGHT - 160) / Math.max(merchants.length - 1, 1),
      risk: merchantSet.get(id) || false,
    }))

    return { nodes: [...citizenNodes, ...merchantNodes], links: linkList }
  }, [pathEvents])

  const pendingCount = pathEvents.filter((e) => e.status === 'pending').length

  return (
    <div>
      <PageHeader title="异常核销路径分析" description="分析市民与商户间异常核销关联路径" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Network className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">异常路径事件</p>
              <p className="text-xl font-bold text-primary">{pathEvents.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">待处理</p>
              <p className="text-xl font-bold text-primary">{pendingCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-[#6B7A99]">关联节点数</p>
              <p className="text-xl font-bold text-primary">{nodes.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-base font-bold text-primary mb-4">核销路径关系图</h3>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto border border-border rounded-lg bg-gray-50/30">
          {links.map((link, i) => {
            const src = nodes.find((n) => n.id === link.source)
            const tgt = nodes.find((n) => n.id === link.target)
            if (!src || !tgt) return null
            return (
              <line
                key={i}
                x1={src.x} y1={src.y}
                x2={tgt.x} y2={tgt.y}
                stroke={link.abnormal ? '#E74C3C' : '#CBD5E1'}
                strokeWidth={link.abnormal ? 2.5 : 1.5}
                strokeDasharray={link.abnormal ? '6 3' : 'none'}
                opacity={0.8}
              />
            )
          })}

          {nodes.map((node) => {
            if (node.type === 'citizen') {
              return (
                <g key={node.id}>
                  <circle cx={node.x} cy={node.y} r={20} fill={node.risk ? '#FEE2E2' : '#DBEAFE'} stroke={node.risk ? '#E74C3C' : '#3B82F6'} strokeWidth={2} />
                  <text x={node.x} y={node.y + 4} textAnchor="middle" className="text-[10px] fill-gray-700 font-medium">{node.label}</text>
                  {node.risk && (
                    <circle cx={node.x + 14} cy={node.y - 14} r={6} fill="#EF4444" stroke="white" strokeWidth={1.5} />
                  )}
                </g>
              )
            }
            return (
              <g key={node.id}>
                <rect x={node.x - 30} y={node.y - 16} width={60} height={32} rx={6} fill={node.risk ? '#FEE2E2' : '#D1FAE5'} stroke={node.risk ? '#E74C3C' : '#10B981'} strokeWidth={2} />
                <text x={node.x} y={node.y + 4} textAnchor="middle" className="text-[10px] fill-gray-700 font-medium">{node.label}</text>
                {node.risk && (
                  <circle cx={node.x + 24} cy={node.y - 12} r={6} fill="#EF4444" stroke="white" strokeWidth={1.5} />
                )}
              </g>
            )
          })}
        </svg>

        <div className="flex items-center justify-center gap-8 mt-4 text-xs text-[#6B7A99]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-200 border border-blue-400" />
            市民节点
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-3 rounded bg-green-200 border border-green-400" />
            商户节点
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-[#E74C3C]" style={{ borderTop: '2px dashed #E74C3C' }} />
            异常路径
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-0.5 bg-gray-300" />
            正常路径
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
            风险标记
          </span>
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="text-base font-bold text-primary mb-4">异常路径事件列表</h3>
        <div className="space-y-3">
          {pathEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-gray-50/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={event.type} />
                  <StatusBadge status={event.level} />
                </div>
                <p className="text-sm text-[#6B7A99]">{event.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-[#6B7A99]">{event.detectedAt}</p>
                <div className="mt-1"><StatusBadge status={event.status} /></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
