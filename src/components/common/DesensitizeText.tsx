import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Tooltip } from 'antd';
import { cn } from '@/utils/cn';

export type DesensitizeType = 'phone' | 'name' | 'idCard' | 'bankCard';

interface DesensitizeTextProps {
  value: string;
  type?: DesensitizeType;
  hasPermission?: boolean;
  className?: string;
}

function desensitize(value: string, type: DesensitizeType): string {
  if (!value) return '-';

  switch (type) {
    case 'phone': {
      if (value.length < 7) return value;
      return value.slice(0, 3) + '****' + value.slice(-4);
    }
    case 'name': {
      if (value.length <= 1) return value;
      if (value.length === 2) return value[0] + '*';
      return value[0] + '*'.repeat(value.length - 2) + value.slice(-1);
    }
    case 'idCard': {
      if (value.length < 8) return value;
      return value.slice(0, 4) + '**********' + value.slice(-4);
    }
    case 'bankCard': {
      if (value.length < 8) return value;
      return value.slice(0, 4) + ' **** **** ' + value.slice(-4);
    }
    default:
      return value;
  }
}

export function DesensitizeText({
  value,
  type = 'phone',
  hasPermission = false,
  className,
}: DesensitizeTextProps) {
  const [visible, setVisible] = useState(false);

  const displayText = visible && hasPermission ? value : desensitize(value, type);

  const canToggle = hasPermission;

  if (!canToggle) {
    return (
      <Tooltip title="无权限查看完整信息">
        <span className={cn('inline-flex items-center gap-1.5 text-neutral-300', className)}>
          <span className="font-mono tracking-wide">{displayText}</span>
          <Lock className="w-3 h-3 text-neutral-500" />
        </span>
      </Tooltip>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-neutral-300', className)}>
      <span className="font-mono tracking-wide">{displayText}</span>
      <button
        onClick={() => setVisible(!visible)}
        className="p-0.5 rounded text-neutral-500 hover:text-primary-400 hover:bg-primary-500/10 transition-colors"
        title={visible ? '隐藏' : '查看完整信息'}
      >
        {visible ? (
          <EyeOff className="w-3.5 h-3.5" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
      </button>
    </span>
  );
}
