import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  User,
  FileText,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FlowNodeType } from '../../../shared/types';

export interface FlowTimelineItem {
  id: string;
  nodeType: FlowNodeType;
  title: string;
  operator: string;
  operatorRole?: string;
  timestamp: string;
  content: string;
  remark?: string;
  attachments?: string[];
}

export interface FlowTimelineProps {
  items: FlowTimelineItem[];
  className?: string;
  compact?: boolean;
}

const getNodeStyles = (type: FlowNodeType) => {
  switch (type) {
    case 'success':
      return {
        icon: CheckCircle2,
        iconBg: 'bg-success-500/20',
        iconColor: 'text-success-400',
        iconBorder: 'border-success-500/50',
        lineColor: 'bg-success-500/30',
        dotColor: 'bg-success-500',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        iconBg: 'bg-warning-500/20',
        iconColor: 'text-warning-400',
        iconBorder: 'border-warning-500/50',
        lineColor: 'bg-warning-500/30',
        dotColor: 'bg-warning-500',
      };
    case 'error':
      return {
        icon: XCircle,
        iconBg: 'bg-danger-500/20',
        iconColor: 'text-danger-400',
        iconBorder: 'border-danger-500/50',
        lineColor: 'bg-danger-500/30',
        dotColor: 'bg-danger-500',
      };
    case 'info':
    default:
      return {
        icon: Info,
        iconBg: 'bg-info-500/20',
        iconColor: 'text-info-400',
        iconBorder: 'border-info-500/50',
        lineColor: 'bg-info-500/30',
        dotColor: 'bg-info-500',
      };
  }
};

const formatTimestamp = (ts: string) => {
  try {
    const date = new Date(ts);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return ts;
  }
};

export const FlowTimeline: React.FC<FlowTimelineProps> = ({
  items,
  className,
  compact = false,
}) => {
  if (!items || items.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-8 text-gray-500', className)}>
        <Clock className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-sm">暂无流转记录</span>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-5 top-2 bottom-2 w-px bg-space-blue-600" />

      <div className="space-y-1">
        {items.map((item, index) => {
          const styles = getNodeStyles(item.nodeType);
          const Icon = styles.icon;
          const isLast = index === items.length - 1;

          return (
            <div
              key={item.id}
              className={cn(
                'relative pl-14',
                compact ? 'py-2' : 'py-3'
              )}
            >
              {!isLast && (
                <div
                  className={cn(
                    'absolute left-[22px] top-10 w-px',
                    styles.lineColor,
                    compact ? 'bottom-0' : 'bottom-[-12px]'
                  )}
                />
              )}

              <div
                className={cn(
                  'absolute left-2 top-0.5 w-7 h-7 rounded-full flex items-center justify-center border-2',
                  styles.iconBg,
                  styles.iconBorder
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', styles.iconColor)} />
              </div>

              <div className={cn(
                'bg-space-blue-700/40 border border-space-blue-600 rounded-lg',
                compact ? 'p-3' : 'p-4'
              )}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={cn(
                      'font-medium text-gray-100',
                      compact ? 'text-sm' : 'text-base'
                    )}>
                      {item.title}
                    </h4>
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                      styles.iconBg,
                      styles.iconColor
                    )}>
                      {item.nodeType === 'success' && '已完成'}
                      {item.nodeType === 'warning' && '待关注'}
                      {item.nodeType === 'error' && '异常'}
                      {item.nodeType === 'info' && '进行中'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono-code whitespace-nowrap shrink-0">
                    <Clock className="w-3 h-3" />
                    {formatTimestamp(item.timestamp)}
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <User className="w-3 h-3" />
                    <span>{item.operator}</span>
                    {item.operatorRole && (
                      <span className="text-gray-600">({item.operatorRole})</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-sm text-gray-300 mb-2">
                  <FileText className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                  <p className="leading-relaxed">{item.content}</p>
                </div>

                {item.remark && (
                  <div className="mt-2 pt-2 border-t border-space-blue-600/50">
                    <div className="text-xs text-gray-500 mb-1">处理备注</div>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.remark}</p>
                  </div>
                )}

                {item.attachments && item.attachments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-space-blue-600/50">
                    <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      附件 ({item.attachments.length})
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.attachments.map((att, attIdx) => (
                        <span
                          key={attIdx}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-space-blue-600/50 rounded text-xs text-gray-400 hover:text-gray-200 hover:bg-space-blue-600 cursor-pointer transition-colors"
                        >
                          <Paperclip className="w-3 h-3" />
                          {att}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FlowTimeline;
