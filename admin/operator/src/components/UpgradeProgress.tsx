import { useMemo } from 'react'
import {
  Card,
  Progress,
  Row,
  Col,
  Space,
  Typography,
  List,
  Tag,
  Badge,
  Descriptions,
  Table,
  Statistic,
  theme,
  Tooltip,
  Divider,
  Empty
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  DownloadOutlined,
  CloudUploadOutlined,
  DeviceTabletOutlined,
  CalendarOutlined,
  HistoryOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  UserOutlined,
  FileZipOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { useToken } = theme

interface UpgradeDevice {
  id: string
  deviceId: string
  deviceName: string
  status: 'pending' | 'downloading' | 'upgrading' | 'success' | 'failed'
  progress: number
  message?: string
  startTime?: string
  endTime?: string
}

interface UpgradeTask {
  taskId: string
  taskName: string
  firmwareId: string
  firmwareVersion: string
  firmwareModel: string
  totalDevices: number
  successCount: number
  failedCount: number
  inProgressCount: number
  pendingCount: number
  scheduledTime?: string
  status: 'pending' | 'running' | 'completed' | 'cancelled'
  createTime: string
  createBy: string
  devices: UpgradeDevice[]
}

interface UpgradeProgressProps {
  task: UpgradeTask
}

const deviceStatusConfig: Record<UpgradeDevice['status'], { label: string; color: string; icon: React.ReactNode; spin?: boolean }> = {
  pending: { label: '等待中', color: 'default', icon: <ClockCircleOutlined /> },
  downloading: { label: '下载中', color: 'processing', icon: <DownloadOutlined />, spin: true },
  upgrading: { label: '升级中', color: 'processing', icon: <SyncOutlined />, spin: true },
  success: { label: '成功', color: 'success', icon: <CheckCircleOutlined /> },
  failed: { label: '失败', color: 'error', icon: <CloseCircleOutlined /> }
}

const taskStatusConfig: Record<UpgradeTask['status'], { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待执行', color: 'default', icon: <ClockCircleOutlined /> },
  running: { label: '进行中', color: 'processing', icon: <PlayCircleOutlined /> },
  completed: { label: '已完成', color: 'success', icon: <CheckCircleOutlined /> },
  cancelled: { label: '已取消', color: 'default', icon: <CloseCircleOutlined /> }
}

function UpgradeProgress({ task }: UpgradeProgressProps) {
  const { token } = useToken()

  const overallPercent = task.totalDevices > 0
    ? Math.round(((task.successCount + task.failedCount) / task.totalDevices) * 100)
    : 0

  const successPercent = task.totalDevices > 0
    ? Math.round((task.successCount / task.totalDevices) * 100)
    : 0

  const taskStatus = taskStatusConfig[task.status]

  const deviceColumns: ColumnsType<UpgradeDevice> = [
    {
      title: '设备编号',
      dataIndex: 'deviceId',
      key: 'deviceId',
      width: 120,
      render: (t) => (
        <Space>
          <DeviceTabletOutlined style={{ color: token.colorTextSecondary }} />
          <Text strong style={{ fontSize: 13 }}>{t}</Text>
        </Space>
      )
    },
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      key: 'deviceName',
      ellipsis: true,
      render: (t) => <Tooltip title={t}><Text type="secondary" style={{ fontSize: 12 }}>{t}</Text></Tooltip>
    },
    {
      title: '升级进度',
      key: 'progress',
      width: 200,
      render: (_, r) => {
        const cfg = deviceStatusConfig[r.status]
        const strokeColor =
          r.status === 'success' ? '#52c41a' :
          r.status === 'failed' ? '#ff4d4f' :
          r.status === 'downloading' ? '#1890ff' :
          r.status === 'upgrading' ? '#722ed1' : '#d9d9d9'
        return (
          <Progress
            percent={r.progress}
            size="small"
            status={r.status === 'success' ? 'success' : r.status === 'failed' ? 'exception' : ['downloading', 'upgrading'].includes(r.status) ? 'active' : undefined}
            strokeColor={strokeColor}
            style={{ marginBottom: 0 }}
          />
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: UpgradeDevice['status']) => {
        const cfg = deviceStatusConfig[s]
        return (
          <Tag color={cfg.color} icon={cfg.icon} style={{ marginInlineEnd: 0 }}>
            {cfg.label}
          </Tag>
        )
      },
      filters: [
        { text: '等待中', value: 'pending' },
        { text: '下载中', value: 'downloading' },
        { text: '升级中', value: 'upgrading' },
        { text: '成功', value: 'success' },
        { text: '失败', value: 'failed' }
      ],
      onFilter: (v, r) => r.status === v
    },
    {
      title: '信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (t, r) => (
        <Tooltip title={t}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t || (r.status === 'pending' ? '等待开始...' : '-')}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '耗时',
      key: 'duration',
      width: 100,
      render: (_, r) => {
        if (!r.startTime) return '-'
        const start = dayjs(r.startTime)
        const end = r.endTime ? dayjs(r.endTime) : dayjs()
        const diff = end.diff(start, 'second')
        if (diff < 60) return `${diff}秒`
        return `${Math.floor(diff / 60)}分${diff % 60}秒`
      }
    }
  ]

  const sortedDevices = useMemo(() => {
    const order: Record<UpgradeDevice['status'], number> = {
      upgrading: 0,
      downloading: 1,
      failed: 2,
      pending: 3,
      success: 4
    }
    return [...task.devices].sort((a, b) => order[a.status] - order[b.status])
  }, [task.devices])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        bordered={false}
        size="small"
        style={{
          borderRadius: 10,
          background: task.status === 'completed' && task.failedCount === 0
            ? '#f6ffed'
            : task.status === 'completed' && task.failedCount > 0
            ? '#fff2e8'
            : task.status === 'running'
            ? '#e6f4ff'
            : '#fafafa',
          border: `1px solid ${task.status === 'completed' ? '#52c41a30' : task.status === 'running' ? '#1890ff30' : '#d9d9d930'}`
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={14}>
            <Space direction="vertical" size={6}>
              <Space>
                <Title level={5} style={{ margin: 0 }}>{task.taskName}</Title>
                <Tag color={taskStatus.color} icon={taskStatus.icon}>
                  {taskStatus.label}
                </Tag>
              </Space>
              <Space direction="vertical" size={2}>
                <Space wrap size={[12, 4]}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <FileZipOutlined /> {task.firmwareModel} - {task.firmwareVersion}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <UserOutlined /> {task.createBy}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <CalendarOutlined /> {task.createTime}
                  </Text>
                </Space>
                {task.scheduledTime && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <HistoryOutlined /> 计划执行：{task.scheduledTime}
                  </Text>
                )}
              </Space>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={10}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Progress
                type="dashboard"
                percent={overallPercent}
                size={88}
                strokeColor={task.status === 'completed' && task.failedCount === 0 ? '#52c41a' : task.status === 'running' ? '#1890ff' : task.failedCount > 0 ? '#faad14' : undefined}
                format={(p) => <span style={{ fontSize: 16, fontWeight: 600 }}>{p}%</span>}
                style={{ marginBottom: 0, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Row gutter={8}>
                  <Col span={12} style={{ textAlign: 'center' }}>
                    <Statistic
                      title={<Text type="secondary" style={{ fontSize: 11 }}>成功</Text>}
                      value={task.successCount}
                      valueStyle={{ fontSize: 18, color: '#52c41a', fontWeight: 600 }}
                      suffix={<Text type="secondary" style={{ fontSize: 11 }}>/{task.totalDevices}</Text>}
                    />
                  </Col>
                  <Col span={12} style={{ textAlign: 'center' }}>
                    <Statistic
                      title={<Text type="secondary" style={{ fontSize: 11 }}>失败</Text>}
                      value={task.failedCount}
                      valueStyle={{ fontSize: 18, color: task.failedCount > 0 ? '#ff4d4f' : '#bfbfbf', fontWeight: 600 }}
                      suffix={<Text type="secondary" style={{ fontSize: 11 }}>/{task.totalDevices}</Text>}
                    />
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[12, 12]}>
        {[
          { label: '总设备数', value: task.totalDevices, color: '#1890ff', icon: <DeviceTabletOutlined /> },
          { label: '升级成功', value: task.successCount, color: '#52c41a', icon: <CheckCircleOutlined />, percent: successPercent },
          { label: '升级失败', value: task.failedCount, color: '#ff4d4f', icon: <CloseCircleOutlined /> },
          { label: '进行中', value: task.inProgressCount, color: '#722ed1', icon: <SyncOutlined spin={task.inProgressCount > 0} /> },
          { label: '等待中', value: task.pendingCount, color: '#faad14', icon: <ClockCircleOutlined /> }
        ].map((s, i) => (
          <Col xs={12} sm={24/5} key={i}>
            <Card size="small" bordered={false} style={{ borderRadius: 8, background: `${s.color}08`, textAlign: 'center' }} bodyStyle={{ padding: 10 }}>
              <div style={{ color: s.color, fontSize: 16, marginBottom: 4 }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: s.color, lineHeight: 1.2 }}>
                {s.value}
                {s.percent !== undefined && (
                  <Text type="secondary" style={{ fontSize: 11, fontWeight: 400 }}> ({s.percent}%)</Text>
                )}
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>{s.label}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      <Descriptions title="任务信息" column={2} bordered size="small" labelStyle={{ width: 110, background: '#fafafa' }}>
        <Descriptions.Item label="任务ID">{task.taskId}</Descriptions.Item>
        <Descriptions.Item label="任务名称">{task.taskName}</Descriptions.Item>
        <Descriptions.Item label="固件信息">
          <Space>
            <Tag color="blue">{task.firmwareModel}</Tag>
            <Text code style={{ fontSize: 12 }}>{task.firmwareVersion}</Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="任务状态">
          <Tag color={taskStatus.color} icon={taskStatus.icon}>{taskStatus.label}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="创建人">{task.createBy}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{task.createTime}</Descriptions.Item>
        {task.scheduledTime && (
          <Descriptions.Item label="计划时间" span={2}>
            <Tag color="orange" icon={<CalendarOutlined />}>{task.scheduledTime}</Tag>
          </Descriptions.Item>
        )}
      </Descriptions>

      <Divider orientation="left" orientationMargin={0} plain style={{ marginTop: 0 }}>
        <Space>
          <CloudUploadOutlined />
          设备升级进度明细
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
            （共 {task.devices.length} 台）
          </Text>
        </Space>
      </Divider>

      {task.devices.length === 0 ? (
        <Empty description="暂无升级设备" style={{ padding: 20 }} />
      ) : (
        <Table<UpgradeDevice>
          columns={deviceColumns}
          dataSource={sortedDevices}
          rowKey="id"
          size="small"
          scroll={{ y: 360 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (t, range) => `${range[0]}-${range[1]}/共 ${t} 台`
          }}
        />
      )}

      {task.failedCount > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`有 ${task.failedCount} 台设备升级失败`}
          description="建议检查设备网络连接状态和电源，确认无误后可重新发起升级任务。失败的设备不会影响已成功的设备。"
        />
      )}

      {task.status === 'completed' && task.failedCount === 0 && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="所有设备升级完成！"
          description={`${task.successCount} 台设备全部成功升级到 ${task.firmwareVersion} 版本，建议后续关注设备运行状态。`}
        />
      )}
    </Space>
  )
}

export default UpgradeProgress
