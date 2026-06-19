import { Tag } from 'antd';

interface DeviceStatusBadgeProps {
  status: 'online' | 'offline' | 'fault';
  size?: 'small' | 'default' | 'large';
  showDot?: boolean;
}

const DeviceStatusBadge = ({ status, size = 'default', showDot = true }: DeviceStatusBadgeProps) => {
  const config = {
    online: {
      color: '#52c41a',
      text: '在线',
      bgColor: 'rgba(82,196,26,0.08)',
    },
    offline: {
      color: '#8c8c8c',
      text: '离线',
      bgColor: 'rgba(140,140,140,0.08)',
    },
    fault: {
      color: '#ff4d4f',
      text: '故障',
      bgColor: 'rgba(255,77,79,0.08)',
    },
  };

  const { color, text, bgColor } = config[status];

  const sizeConfig = {
    small: { fontSize: 12, padding: '0 8px', height: 20 },
    default: { fontSize: 13, padding: '2px 12px', height: 24 },
    large: { fontSize: 14, padding: '4px 16px', height: 28 },
  };

  const style = {
    ...sizeConfig[size],
    backgroundColor: bgColor,
    color,
    border: `1px solid ${color}30`,
    borderRadius: 4,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontWeight: 500,
  };

  return (
    <Tag style={style} icon={null}>
      {showDot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: color,
            display: 'inline-block',
            boxShadow: status === 'online' ? `0 0 6px ${color}` : 'none',
            animation: status === 'online' ? 'pulse 2s infinite' : 'none',
          }}
        />
      )}
      {text}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </Tag>
  );
};

export default DeviceStatusBadge;
