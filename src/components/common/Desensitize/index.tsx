import React from 'react';
import { Tooltip, Button } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import useDesensitize from '@/hooks/useDesensitize';

export type DesensitizeType = 'idCard' | 'phone' | 'name' | 'email' | 'bankCard' | 'address' | 'ip' | 'licensePlate';

export interface DesensitizeProps {
  value: string;
  type: DesensitizeType;
  allowToggle?: boolean;
  className?: string;
  tooltip?: string;
}

const Desensitize: React.FC<DesensitizeProps> = ({
  value,
  type,
  allowToggle = false,
  className,
  tooltip,
}) => {
  const [visible, setVisible] = useState(false);
  const { desensitize, hasPermission } = useDesensitize();

  const displayValue = visible || !allowToggle ? value : desensitize(value, type);
  const canToggle = allowToggle && hasPermission();

  const content = (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span>{displayValue}</span>
      {canToggle && (
        <Button
          type="text"
          size="small"
          icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          onClick={() => setVisible(!visible)}
          className="!p-0 !h-auto !text-xs !text-neutral-400 hover:!text-primary-500"
        />
      )}
    </span>
  );

  if (tooltip) {
    return <Tooltip title={tooltip}>{content}</Tooltip>;
  }

  return content;
};

export default Desensitize;
