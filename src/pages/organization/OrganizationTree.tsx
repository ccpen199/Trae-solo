import { useState } from 'react'
import { ChevronRight, ChevronDown, Building2, Users, Plus, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { cn } from '@/lib/utils'

interface TreeNode {
  id: string
  name: string
  type: 'community' | 'building' | 'unit' | 'department'
  memberCount: number
  children?: TreeNode[]
}

const mockTree: TreeNode[] = [
  {
    id: '1', name: '阳光花园社区', type: 'community', memberCount: 1280,
    children: [
      {
        id: '2', name: '1号楼', type: 'building', memberCount: 180,
        children: [
          { id: '5', name: '1单元', type: 'unit', memberCount: 60 },
          { id: '6', name: '2单元', type: 'unit', memberCount: 60 },
          { id: '7', name: '3单元', type: 'unit', memberCount: 60 },
        ],
      },
      {
        id: '3', name: '2号楼', type: 'building', memberCount: 160,
        children: [
          { id: '8', name: '1单元', type: 'unit', memberCount: 80 },
          { id: '9', name: '2单元', type: 'unit', memberCount: 80 },
        ],
      },
      {
        id: '4', name: '物业服务中心', type: 'department', memberCount: 25,
      },
    ],
  },
]

const mockMembers = [
  { id: '1', name: '张三', role: '业主', phone: '138****1234', unit: '1号楼1单元501' },
  { id: '2', name: '李四', role: '业主', phone: '139****5678', unit: '1号楼1单元502' },
  { id: '3', name: '王五', role: '租户', phone: '137****9012', unit: '1号楼1单元601' },
  { id: '4', name: '赵六', role: '业主', phone: '136****3456', unit: '1号楼1单元602' },
]

const typeIcons: Record<string, React.ElementType> = {
  community: Building2, building: Building2, unit: Building2, department: Users,
}

function TreeNodeItem({ node, depth, selectedId, onSelect }: {
  node: TreeNode; depth: number; selectedId: string; onSelect: (n: TreeNode) => void
}) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children && node.children.length > 0
  const Icon = typeIcons[node.type]

  return (
    <div>
      <div
        onClick={() => { onSelect(node); if (hasChildren) setExpanded(!expanded) }}
        className={cn(
          'flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-slate-50 transition-colors rounded-lg mx-1',
          selectedId === node.id && 'bg-emerald-50 text-emerald-700'
        )}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={14} className="text-slate-400 shrink-0" /> : <ChevronRight size={14} className="text-slate-400 shrink-0" />
        ) : <span className="w-3.5" />}
        <Icon size={16} className="text-slate-400 shrink-0" />
        <span className="text-sm text-slate-700 flex-1 truncate">{node.name}</span>
        <span className="text-xs text-slate-400 shrink-0">{node.memberCount}人</span>
      </div>
      {hasChildren && expanded && node.children!.map((child) => (
        <TreeNodeItem key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
}

export default function OrganizationTree() {
  const [selectedId, setSelectedId] = useState('1')
  const [selectedNode, setSelectedNode] = useState<TreeNode>(mockTree[0])

  const handleSelect = (node: TreeNode) => {
    setSelectedId(node.id)
    setSelectedNode(node)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="组织架构" subtitle="管理社区组织与人员" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">组织树</h3>
            <button className="p-1 text-emerald-500 hover:bg-emerald-50 rounded transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="py-2 max-h-[600px] overflow-y-auto custom-scrollbar">
            {mockTree.map((node) => (
              <TreeNodeItem key={node.id} node={node} depth={0} selectedId={selectedId} onSelect={handleSelect} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">{selectedNode.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedNode.memberCount} 名成员</p>
            </div>
            <button className="h-8 px-3 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1">
              <Plus size={14} />添加成员
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">姓名</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">角色</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">电话</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">住址</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {mockMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-slate-800 font-medium">{m.name}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{m.role}</td>
                    <td className="px-5 py-3 text-sm text-slate-600 font-mono">{m.phone}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{m.unit}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-slate-400 hover:text-blue-500 transition-colors"><Pencil size={14} /></button>
                        <button className="p-1 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
