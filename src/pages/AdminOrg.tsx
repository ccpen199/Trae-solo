import { useState } from "react";
import { ChevronRight, ChevronDown, Users, Plus, Pencil, Trash2, Download, Upload } from "lucide-react";

interface OrgNode {
  id: string;
  name: string;
  members: number;
  children?: OrgNode[];
}

const TREE_DATA: OrgNode[] = [
  {
    id: "1", name: "清河大学", members: 12847, children: [
      {
        id: "1-1", name: "计算机学院", members: 2400, children: [
          { id: "1-1-1", name: "软件工程系", members: 680, children: [
            { id: "1-1-1-1", name: "软件2101班", members: 35 },
            { id: "1-1-1-2", name: "软件2102班", members: 34 },
            { id: "1-1-1-3", name: "软件2201班", members: 36 },
          ]},
          { id: "1-1-2", name: "人工智能系", members: 520, children: [
            { id: "1-1-2-1", name: "智科2101班", members: 32 },
            { id: "1-1-2-2", name: "智科2201班", members: 33 },
          ]},
          { id: "1-1-3", name: "数据科学系", members: 460, children: [
            { id: "1-1-3-1", name: "大数据2101班", members: 30 },
            { id: "1-1-3-2", name: "大数据2201班", members: 31 },
          ]},
        ]
      },
      {
        id: "1-2", name: "经济管理学院", members: 3200, children: [
          { id: "1-2-1", name: "工商管理系", members: 890, children: [
            { id: "1-2-1-1", name: "工商2101班", members: 38 },
            { id: "1-2-1-2", name: "工商2201班", members: 37 },
          ]},
          { id: "1-2-2", name: "会计系", members: 760, children: [
            { id: "1-2-2-1", name: "会计2101班", members: 40 },
            { id: "1-2-2-2", name: "会计2201班", members: 39 },
          ]},
        ]
      },
      {
        id: "1-3", name: "文学院", members: 1800, children: [
          { id: "1-3-1", name: "中文系", members: 620, children: [
            { id: "1-3-1-1", name: "中文2101班", members: 28 },
          ]},
          { id: "1-3-2", name: "新闻传播系", members: 540, children: [
            { id: "1-3-2-1", name: "新闻2101班", members: 30 },
          ]},
        ]
      },
    ]
  }
];

function TreeNode({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-50 group cursor-pointer"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />
        ) : (
          <div className="w-4" />
        )}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${depth === 0 ? "bg-[#1B3A5C] text-white" : depth === 1 ? "bg-[#FF6B35] text-white" : depth === 2 ? "bg-[#2EC4B6] text-white" : "bg-[#FFC857] text-[#1B3A5C]"}`}>
          {node.name[0]}
        </div>
        <span className="font-medium text-sm text-[#1B3A5C] flex-1">{node.name}</span>
        <span className="text-xs text-gray-400 flex items-center gap-1"><Users size={12} />{node.members}</span>
        <div className="hidden group-hover:flex items-center gap-1 ml-2">
          <button className="p-1 rounded hover:bg-[#2EC4B6]/10"><Plus size={14} className="text-[#2EC4B6]" /></button>
          <button className="p-1 rounded hover:bg-[#FFC857]/10"><Pencil size={14} className="text-[#FFC857]" /></button>
          <button className="p-1 rounded hover:bg-[#E63946]/10"><Trash2 size={14} className="text-[#E63946]" /></button>
        </div>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminOrg() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1B3A5C]">院系组织架构</h1>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2EC4B6] text-white text-sm font-medium hover:bg-[#25a89d] transition-colors">
              <Download size={14} />
              导出
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3A5C] text-white text-sm font-medium hover:bg-[#142a44] transition-colors">
              <Upload size={14} />
              导入
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          {TREE_DATA.map((node) => (
            <TreeNode key={node.id} node={node} />
          ))}
        </div>
      </div>
    </div>
  );
}
