import React from 'react';
import { Card, Space, Typography } from 'antd';
import { EnvironmentOutlined, RiseOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { Device } from '@/types';
import { DEVICE_TYPE_MAP, DEVICE_TYPE_ICONS, DEVICE_TYPE_COLORS, WORKING_STATUS_MAP } from '@/utils/constants';
import StatusBadge from './StatusBadge';

const { Text, Title } = Typography;

interface DeviceCardProps {
  device: Device;
  onClick?: (device: Device) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onClick }) => {
  const icon = DEVICE_TYPE_ICONS[device.deviceType];
  const color = DEVICE_TYPE_COLORS[device.deviceType];

  return (
    <Card
      className="device-card"
      onClick={() => onClick?.(device)}
      style={{ borderLeft: `4px solid ${color}` }}
      hoverable
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space align="center">
            <span style={{ fontSize: '32px' }}>{icon}</span>
            <div>
              <Title level={5} style={{ margin: 0 }}>{device.name}</Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {DEVICE_TYPE_MAP[device.deviceType]} · {device.deviceCode}
              </Text>
            </div>
          </Space>
          <StatusBadge type="working" status={device.workingStatus} />
        </Space>

        <Space split={<Text type="secondary">|</Text>} style={{ fontSize: '12px' }}>
          <Space align="center">
            <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary">
              {device.location?.building || ''} {device.location?.floor || ''} {device.location?.room || ''}
            </Text>
          </Space>
          <Space align="center">
            <RiseOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary">使用 {device.totalUsage} 次</Text>
          </Space>
          <Space align="center">
            <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary">累计 {device.totalDuration || 0} 分钟</Text>
          </Space>
        </Space>

        {device.status !== 'online' && (
          <StatusBadge type="device" status={device.status} />
        )}
      </Space>
    </Card>
  );
};

export default DeviceCard;
