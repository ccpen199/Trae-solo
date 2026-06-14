import { useState } from 'react';
import { ChevronRight, ChevronDown, Building2 } from 'lucide-react';

interface OrgNode {
  id: string;
  name: string;
  children?: OrgNode[];
}

interface OrgTreeProps {
  data: OrgNode[];
  selectedId?: string;
  onSelect: (node: OrgNode) => void;
}

function TreeNode({ node, depth = 0, selectedId, onSelect }: {
  node: OrgNode;
  depth?: number;
  selectedId?: string;
  onSelect: (node: OrgNode) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1 cursor-pointer rounded px-2 py-1.5 text-sm transition-colors ${
          isSelected ? 'bg-primary/10 text-primary' : 'text-gray-300 hover:bg-surface-light hover:text-white'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          onSelect(node);
          if (hasChildren) setExpanded(!expanded);
        }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={14} className="shrink-0 text-gray-500" /> : <ChevronRight size={14} className="shrink-0 text-gray-500" />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <Building2 size={14} className="shrink-0 text-gray-500" />
        <span className="truncate">{node.name}</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgTree({ data, selectedId, onSelect }: OrgTreeProps) {
  return (
    <div className="space-y-0.5">
      {data.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export type { OrgNode };
