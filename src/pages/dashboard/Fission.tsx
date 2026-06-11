import { useState } from 'react'
import { Network, Users, TrendingUp, DollarSign } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { fissionData } from '@/data/mockData'

interface FissionNode {
  id: string
  name: string
  level: number
  parent?: string
  metrics: {
    members: number
    sales: number
    growth: number
  }
}

type SelectedNode = FissionNode & { children: FissionNode[] }

const allNodes: FissionNode[] = [fissionData.root, ...fissionData.nodes]

function getChildren(nodeId: string): FissionNode[] {
  return fissionData.nodes.filter((n) => n.parent === nodeId)
}

function buildSelectedNode(node: FissionNode): SelectedNode {
  return { ...node, children: getChildren(node.id) }
}

const LEVEL_X = [400, 200, 500, 350]
const LEVEL_Y = [60, 180, 300]
const NODE_Y_GAP = 160

function getPositions() {
  const positions: Record<string, { x: number; y: number }> = {}
  positions['D000'] = { x: LEVEL_X[0], y: LEVEL_Y[0] }

  const level1 = getChildren('D000')
  const l1Spacing = 280
  const l1StartX = LEVEL_X[0] - ((level1.length - 1) * l1Spacing) / 2
  level1.forEach((n, i) => {
    positions[n.id] = { x: l1StartX + i * l1Spacing, y: LEVEL_Y[1] }
  })

  level1.forEach((parent) => {
    const children = getChildren(parent.id)
    const spacing = 140
    const startX = positions[parent.id].x - ((children.length - 1) * spacing) / 2
    children.forEach((child, i) => {
      positions[child.id] = { x: startX + i * spacing, y: LEVEL_Y[2] }
    })
  })

  return positions
}

const positions = getPositions()
const SVG_W = 800
const SVG_H = 380

export default function Fission() {
  const [selectedId, setSelectedId] = useState<string>('D000')
  const selectedNode = buildSelectedNode(allNodes.find((n) => n.id === selectedId) || fissionData.root)

  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="团队裂变图" subtitle="团队层级结构与增长分析" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Network size={18} className="text-emerald-600" />
            <h3 className="text-base font-semibold text-gray-800">层级结构</h3>
          </div>
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ maxHeight: '420px' }}>
            {allNodes.map((node) => {
              if (!node.parent) return null
              const parentPos = positions[node.parent]
              const childPos = positions[node.id]
              if (!parentPos || !childPos) return null
              const midY = (parentPos.y + childPos.y) / 2
              return (
                <path
                  key={`line-${node.id}`}
                  d={`M${parentPos.x},${parentPos.y + 30} C${parentPos.x},${midY} ${childPos.x},${midY} ${childPos.x},${childPos.y - 30}`}
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth={1.5}
                />
              )
            })}
            {allNodes.map((node) => {
              const pos = positions[node.id]
              if (!pos) return null
              const isSelected = selectedId === node.id
              const r = node.level === 0 ? 30 : node.level === 1 ? 26 : 22
              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedId(node.id)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r + 4}
                    fill={isSelected ? '#059669' : 'transparent'}
                    opacity={isSelected ? 0.15 : 0}
                  />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={r}
                    fill={isSelected ? '#059669' : '#F3F4F6'}
                    stroke={isSelected ? '#059669' : '#D1D5DB'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 4}
                    textAnchor="middle"
                    className="text-xs font-medium"
                    fill={isSelected ? '#FFFFFF' : '#374151'}
                    fontSize={11}
                  >
                    {node.name}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 10}
                    textAnchor="middle"
                    className="text-xs"
                    fill={isSelected ? '#D1FAE5' : '#9CA3AF'}
                    fontSize={9}
                  >
                    {node.metrics.members}人
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-5">节点详情</h3>
          <div className="space-y-5">
            <div className="text-center pb-4 border-b border-gray-100">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-2">
                <Users size={28} className="text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">{selectedNode.name}</p>
              <p className="text-xs text-gray-500 mt-1">层级 {selectedNode.level}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Users size={16} className="text-emerald-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{selectedNode.metrics.members}</p>
                <p className="text-xs text-gray-500">团队人数</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <DollarSign size={16} className="text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{(selectedNode.metrics.sales / 10000).toFixed(1)}</p>
                <p className="text-xs text-gray-500">销售额(万)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <TrendingUp size={16} className="text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{selectedNode.metrics.growth}%</p>
                <p className="text-xs text-gray-500">增长率</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Network size={16} className="text-purple-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{selectedNode.children.length}</p>
                <p className="text-xs text-gray-500">下级团队</p>
              </div>
            </div>

            {selectedNode.children.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">下级团队</p>
                <div className="space-y-2">
                  {selectedNode.children.map((child) => (
                    <div
                      key={child.id}
                      onClick={() => setSelectedId(child.id)}
                      className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg cursor-pointer hover:bg-emerald-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{child.name}</p>
                        <p className="text-xs text-gray-500">{child.metrics.members}人</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600">{(child.metrics.sales / 10000).toFixed(1)}万</p>
                        <p className="text-xs text-gray-500">+{child.metrics.growth}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
