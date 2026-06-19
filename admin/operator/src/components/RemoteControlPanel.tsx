import {
  Card,
  Typography,
  Space,
  Tag,
  Button,
  Avatar,
  List,
  Empty,
  Popconfirm,
  theme,
  Tooltip
} from 'antd'
import {
  PoweroffOutlined,
  SendOutlined,
  CloseOutlined,
  DeviceTabletOutlined,
  WifiOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'

const { Title, Text } = Typography
const { useToken } = theme

interface SelectedDevice {
  id: string
  deviceId: string
  name: string
  model: string
  status: 'online' | 'offline' | 'warning'
  project?: string
  location?: string
  temperature?: number
  power?: number
}

interface RemoteControlPanelProps {
  selectedDevices: SelectedDevice[]
  onClearSelected?: () => void
  onRestart?: () => void
  onOpenParams?: () => void
  onRemoveDevice?: (deviceId: string) => void
}

const statusColorMap: Record<string, string> = {
  online: '#52c41a',
  offline: '#bfbfbf',
  warning: '#faad14'
}

const statusTextMap: Record<string, string> = {
  online: '在线',
  offline: '离线',
  warning: '告警'
}

function RemoteControlPanel({
  selectedDevices,
  onClearSelected,
  onRestart,
  onOpenParams,
  onRemoveDevice
}: RemoteControlPanelProps) {
  const { token } = useToken()

  const onlineCount = selectedDevices.filter(d => d.status !== 'offline').length
  const warningCount = selectedDevices.filter(d => d.status === 'warning').length

  return (
    <Card
      bordered={false}
      style={{ borderRadius: 12, height: '100%' }}
      title={
        <Space>
          <DeviceTabletOutlined style={{ color: '#52c41a' }} />
          <span>远程控制面板</span>
        </Space>
      }
      extra={
        selectedDevices.length > 0 && (
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClearSelected}>
            清空
          </Button>
        )
      }
    >
      {selectedDevices.length === 0 ? (
        <Empty
          description={
            <Space direction="vertical" size={8} style={{ padding: '20px 0' }}>
              <DeviceTabletOutlined style={{ fontSize: 40, color: token.colorTextTertiary }} />
              <Text type="secondary">请从右侧选择设备</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>点击设备行或选择按钮添加</Text>
            </Space>
          }
          style={{ padding: '40px 0' }}
        />
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <Card size="small" bordered={false} style={{ borderRadius: 8, background: '#1890ff10', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>{selectedDevices.length}</div>
              <Text type="secondary" style={{ fontSize: 11 }}>已选择</Text>
            </Card>
            <Card size="small" bordered={false} style={{ borderRadius: 8, background: '#52c41a10', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{onlineCount}</div>
              <Text type="secondary" style={{ fontSize: 11 }}>可操作</Text>
            </Card>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Popconfirm
              title={`确认远程重启 ${onlineCount} 台设备？`}
              description="设备重启预计需要2-5分钟"
              okText="确认重启"
              okButtonProps={{ danger: true }}
              cancelText="取消"
              onConfirm={onRestart}
              disabled={onlineCount === 0}
            >
              <Button
                type="primary"
                danger
                icon={<PoweroffOutlined />}
                block
                disabled={onlineCount === 0}
                style={{ flex: 1 }}
              >
                远程重启
              </Button>
            </Popconfirm>
            <Button
              icon={<SendOutlined />}
              onClick={onOpenParams}
              disabled={onlineCount === 0}
              style={{ flex: 1 }}
            >
              参数下发
            </Button>
          </div>

          {warningCount > 0 && (
            <div style={{
              padding: 10,
              borderRadius: 8,
              background: '#faad1410',
              border: `1px solid #faad1430`,
              fontSize: 12,
              color: '#d48806'
            }}>
              <Space size={6}>
                <WarningOutlined />
                <span>{warningCount} 台设备处于告警状态，操作请谨慎</span>
              </Space>
            </div>
          )}

          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8
            }}>
              <Text strong style={{ fontSize: 13 }}>
                已选设备列表
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {selectedDevices.length} 台
              </Text>
            </div>
            <div
              style={{
                maxHeight: 340,
                overflow: 'auto',
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 8,
                padding: 4
              }}
            >
              <List
                size="small"
                dataSource={selectedDevices}
                renderItem={(device) => (
                  <List.Item
                    style={{
                      padding: 8,
                      borderRadius: 6,
                      marginBottom: 2,
                      transition: 'background 0.2s',
                      cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = token.colorBgContainer}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Space size={8} style={{ width: '100%', minWidth: 0 }}>
                      <Badge
                        color={statusColorMap[device.status]}
                        style={{ flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Space size={4} wrap>
                          <Text strong style={{ fontSize: 13 }}>{device.deviceId}</Text>
                          {device.status === 'warning' && (
                            <Tag color="warning" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>告警</Tag>
                          )}
                          {device.status === 'offline' && (
                            <Tag style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>离线</Tag>
                          )}
                        </Space>
                        <div style={{
                          fontSize: 11,
                          color: token.colorTextSecondary,
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 240
                        }}>
                          {device.location || device.name}
                        </div>
                        {(device.temperature !== undefined || device.power !== undefined) && (
                          <Space size={8} style={{ marginTop: 2 }}>
                            {device.temperature !== undefined && (
                              <Text style={{ fontSize: 11, color: device.temperature > 45 ? '#ff4d4f' : token.colorTextTertiary }}>
                                {device.temperature}°C
                              </Text>
                            )}
                            {device.power !== undefined && (
                              <Text style={{ fontSize: 11, color: token.colorTextTertiary }}>
                                {device.power}W
                              </Text>
                            )}
                          </Space>
                        )}
                      </div>
                      {onRemoveDevice && (
                        <Tooltip title="移除">
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<CloseOutlined />}
                            onClick={(e) => { e.stopPropagation(); onRemoveDevice(device.id) }}
                            style={{ padding: '0 4px' }}
                          />
                        </Tooltip>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          </div>

          <div style={{
            padding: 12,
            borderRadius: 8,
            background: token.colorFillTertiary,
            fontSize: 11,
            color: token.colorTextSecondary,
            lineHeight: 1.6
          }}>
            <Space direction="vertical" size={2}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> 远程重启：安全重启设备，约2-5分钟恢复
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> 参数下发：支持温度/功率/水价/UV灯配置
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> 所有指令均有执行记录可查
              </Text>
            </Space>
          </div>
        </Space>
      )}
    </Card>
  )
}

export default RemoteControlPanel
