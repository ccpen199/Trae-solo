import React from 'react'
import { Card, Tag, Button, Space } from 'antd'
import dayjs from 'dayjs'
import {
  ThunderboltOutlined,
  BulbOutlined,
  VideoCameraOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'

const deviceTypeIcons = {
  tv: <VideoCameraOutlined style={{ fontSize: '32px', color: '#1890ff' }} />,
  ac: <ThunderboltOutlined style={{ fontSize: '32px', color: '#52c41a' }} />,
  light: <BulbOutlined style={{ fontSize: '32px', color: '#faad14' }} />,
  projector: <VideoCameraOutlined style={{ fontSize: '32px', color: '#722ed1' }} />,
  default: <VideoCameraOutlined style={{ fontSize: '32px', color: '#8c8c8c' }} />
}

const deviceTypeNames = {
  tv: '电视',
  ac: '空调',
  light: '灯光',
  projector: '投影仪',
  default: '其他'
}

function DeviceCard({ device, onClick, onEdit, onDelete, onControl }) {
  const isOnline = device?.status === 'online'
  const type = device?.type || 'default'

  return (
    <Card
      className={`device-card ${isOnline ? 'online' : 'offline'}`}
      onClick={() => onClick?.(device)}
      actions={[
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            onEdit?.(device)
          }}
        >
          编辑
        </Button>,
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(device)
          }}
        >
          删除
        </Button>,
        <Button
          type="primary"
          onClick={(e) => {
            e.stopPropagation()
            onControl?.(device)
          }}
        >
          控制
        </Button>
      ]}
    >
      <Card.Meta
        avatar={deviceTypeIcons[type] || deviceTypeIcons.default}
        title={
          <Space>
            {device?.name || '未知设备'}
            <Tag color={isOnline ? 'success' : 'error'}>
              {isOnline ? '在线' : '离线'}
            </Tag>
          </Space>
        }
        description={
          <div>
            <div>类型: {deviceTypeNames[type] || deviceTypeNames.default}</div>
            <div>品牌: {device?.brand || '-'}</div>
            <div>型号: {device?.model || '-'}</div>
            {device?.lastUsed && (
              <div>上次使用: {dayjs(device.lastUsed).format('YYYY-MM-DD HH:mm')}</div>
            )}
          </div>
        }
      />
    </Card>
  )
}

export default DeviceCard
