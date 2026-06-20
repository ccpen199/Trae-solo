import { useState } from 'react';
import {
  Building2,
  ChevronRight,
  ChevronDown,
  Home,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Link as LinkIcon,
  Unlink,
} from 'lucide-react';
import { Tooltip } from 'antd';
import { cn } from '@/utils/cn';

export type NodeBindingStatus = 'bound' | 'unbound';
export type NodePaymentStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';

export interface HouseholdInfo {
  id: string;
  name: string;
  phone: string;
  residents: number;
  lastPaymentDate?: string;
}

export interface CommunityTreeNode {
  key: string;
  label: string;
  type: 'community' | 'building' | 'unit' | 'floor' | 'house';
  children?: CommunityTreeNode[];
  bindingStatus?: NodeBindingStatus;
  paymentStatus?: NodePaymentStatus;
  householdInfo?: HouseholdInfo;
  count?: {
    total: number;
    bound: number;
    paid: number;
  };
}

interface CommunityTreeProps {
  data: CommunityTreeNode[];
  defaultExpandAll?: boolean;
  onNodeClick?: (node: CommunityTreeNode) => void;
  className?: string;
}

const statusIconConfig: Record<NodePaymentStatus, {
  icon: typeof CheckCircle2;
  color: string;
  label: string;
}> = {
  paid: {
    icon: CheckCircle2,
    color: 'text-success-400',
    label: '已缴费',
  },
  partial: {
    icon: Clock,
    color: 'text-primary-400',
    label: '部分缴费',
  },
  unpaid: {
    icon: Clock,
    color: 'text-warning-400',
    label: '待缴费',
  },
  overdue: {
    icon: AlertCircle,
    color: 'text-danger-400',
    label: '已逾期',
  },
};

interface TreeNodeProps {
  node: CommunityTreeNode;
  level: number;
  expanded: Record<string, boolean>;
  onToggle: (key: string) => void;
  onNodeClick?: (node: CommunityTreeNode) => void;
}

function TreeNode({ node, level, expanded, onToggle, onNodeClick }: TreeNodeProps) {
  const [hovered, setHovered] = useState(false);
  const isExpanded = expanded[node.key] ?? false;
  const hasChildren = node.children && node.children.length > 0;

  const typeIcon = {
    community: Building2,
    building: Building2,
    unit: Building2,
    floor: Home,
    house: Home,
  }[node.type];

  const TypeIcon = typeIcon;

  const paymentConfig = node.paymentStatus ? statusIconConfig[node.paymentStatus] : null;
  const PaymentIcon = paymentConfig?.icon;

  const handleClick = () => {
    if (hasChildren) {
      onToggle(node.key);
    }
    onNodeClick?.(node);
  };

  const tooltipContent = node.householdInfo ? (
    <div className="text-sm space-y-1.5">
      <div className="font-medium text-white">{node.householdInfo.name} 的住户信息</div>
      <div className="flex justify-between gap-4">
        <span className="text-neutral-400">联系电话</span>
        <span className="text-white font-mono">{node.householdInfo.phone}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-neutral-400">居住人数</span>
        <span className="text-white">{node.householdInfo.residents} 人</span>
      </div>
      {node.householdInfo.lastPaymentDate && (
        <div className="flex justify-between gap-4">
          <span className="text-neutral-400">上次缴费</span>
          <span className="text-white">{node.householdInfo.lastPaymentDate}</span>
        </div>
      )}
      {node.bindingStatus && (
        <div className="flex justify-between gap-4">
          <span className="text-neutral-400">绑定状态</span>
          <span className={cn(
            node.bindingStatus === 'bound' ? 'text-success-400' : 'text-neutral-400'
          )}>
            {node.bindingStatus === 'bound' ? '已绑定' : '未绑定'}
          </span>
        </div>
      )}
    </div>
  ) : node.type === 'community' || node.type === 'building' ? (
    <div className="text-sm space-y-1.5">
      <div className="font-medium text-white">{node.label} 统计</div>
      {node.count && (
        <>
          <div className="flex justify-between gap-4">
            <span className="text-neutral-400">总户数</span>
            <span className="text-white">{node.count.total}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-neutral-400">已绑定</span>
            <span className="text-success-400">{node.count.bound}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-neutral-400">已缴费</span>
            <span className="text-primary-400">{node.count.paid}</span>
          </div>
        </>
      )}
    </div>
  ) : null;

  const nodeContent = (
    <div
      className="group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/5"
      style={{ paddingLeft: `${level * 16 + 12}px` }}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hasChildren ? (
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-neutral-500">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      ) : (
        <div className="w-4 h-4 flex-shrink-0" />
      )}

      <div
        className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
          hovered ? 'bg-primary-500/15' : 'bg-white/5'
        )}
      >
        <TypeIcon
          className={cn(
            'w-3.5 h-3.5 transition-colors',
            hovered ? 'text-primary-400' : 'text-neutral-400'
          )}
        />
      </div>

      <span className="flex-1 text-sm text-neutral-200 truncate">{node.label}</span>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {node.bindingStatus && (
          <Tooltip title={node.bindingStatus === 'bound' ? '已绑定微信' : '未绑定'}>
            {node.bindingStatus === 'bound' ? (
              <LinkIcon className="w-3.5 h-3.5 text-success-400" />
            ) : (
              <Unlink className="w-3.5 h-3.5 text-neutral-600" />
            )}
          </Tooltip>
        )}

        {PaymentIcon && node.paymentStatus && (
          <Tooltip title={paymentConfig!.label}>
            <PaymentIcon className={cn('w-3.5 h-3.5', paymentConfig!.color)} />
          </Tooltip>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {tooltipContent ? (
        <Tooltip
          placement="right"
          overlayClassName="!bg-neutral-900 !border !border-white/10 !rounded-xl !p-3 !shadow-2xl"
          title={tooltipContent}
        >
          {nodeContent}
        </Tooltip>
      ) : (
        nodeContent
      )}

      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {node.children!.map((child) => (
            <TreeNode
              key={child.key}
              node={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
              onNodeClick={onNodeClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getAllKeys(nodes: CommunityTreeNode[]): string[] {
  const keys: string[] = [];
  nodes.forEach((node) => {
    if (node.children && node.children.length > 0) {
      keys.push(node.key);
      keys.push(...getAllKeys(node.children));
    }
  });
  return keys;
}

export function CommunityTree({
  data,
  defaultExpandAll = true,
  onNodeClick,
  className,
}: CommunityTreeProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    if (defaultExpandAll) {
      const keys = getAllKeys(data);
      return keys.reduce((acc, key) => ({ ...acc, [key]: true }), {});
    }
    return {};
  });

  const handleToggle = (key: string) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className={cn('glass-card p-3', className)}>
      {data.map((node) => (
        <TreeNode
          key={node.key}
          node={node}
          level={0}
          expanded={expanded}
          onToggle={handleToggle}
          onNodeClick={onNodeClick}
        />
      ))}
    </div>
  );
}
