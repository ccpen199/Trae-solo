import { useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Badge,
  Button,
  Modal,
  Descriptions,
  Space,
  Row,
  Col,
  Typography,
  Alert,
  Timeline,
} from 'antd'
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { serviceSessions } from '@/mock/data'
import type { ServiceSession } from '@/types'

const { Title } = Typography

const statusTagMap: Record<string, { color: string; label: string }> = {
  not_started: { color: 'default', label: '未开始' },
  in_progress: { color: 'processing', label: '进行中' },
  completed: { color: 'green', label: '已完成' },
  disputed: { color: 'red', label: '纠纷中' },
}

const getDeviation = (session: ServiceSession) => {
  if (session.actualDuration == null) return null
  return ((session.actualDuration - session.expectedDuration) / session.expectedDuration) * 100
}

const getDeviationColor = (deviation: number) => {
  const abs = Math.abs(deviation)
  if (abs < 10) return '#52c41a'
  if (abs <= 30) return '#fa8c16'
  return '#f5222d'
}

const inProgressCount = serviceSessions.filter((s) => s.status === 'in_progress').length
const completedCount = serviceSessions.filter((s) => s.status === 'completed').length
const deviationAlertCount = serviceSessions.filter((s) => s.deviationAlert).length
const disputedCount = serviceSessions.filter((s) => s.status === 'disputed').length

const ServiceTracking: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [currentSession, setCurrentSession] = useState<ServiceSession | null>(null)

  const openTrackModal = (session: ServiceSession) => {
    setCurrentSession(session)
    setModalOpen(true)
  }

  const columns = [
    { title: '会话ID', dataIndex: 'id', key: 'id' },
    { title: '工单号', dataIndex: 'orderId', key: 'orderId' },
    { title: '劳动者', dataIndex: 'workerName', key: 'workerName' },
    { title: '雇主', dataIndex: 'employerName', key: 'employerName' },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '预计时长',
      dataIndex: 'expectedDuration',
      key: 'expectedDuration',
      render: (v: number) => `${v} min`,
    },
    {
      title: '实际时长',
      dataIndex: 'actualDuration',
      key: 'actualDuration',
      render: (v: number | undefined) => (v != null ? `${v} min` : '-'),
    },
    {
      title: '时长偏差',
      key: 'deviation',
      render: (_: unknown, record: ServiceSession) => {
        const deviation = getDeviation(record)
        if (deviation === null) return '-'
        const color = getDeviationColor(deviation)
        return <span style={{ color }}>{deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%</span>
      },
    },
    {
      title: '偏差预警',
      dataIndex: 'deviationAlert',
      key: 'deviationAlert',
      render: (v: boolean) =>
        v ? <Badge dot color="red" text="预警" /> : <Badge dot color="green" text="正常" />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const tag = statusTagMap[status] || { color: 'default', label: status }
        return <Tag color={tag.color}>{tag.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ServiceSession) => (
        <Button type="link" icon={<EnvironmentOutlined />} onClick={() => openTrackModal(record)}>
          查看轨迹
        </Button>
      ),
    },
  ]

  const renderMapSvg = (session: ServiceSession) => {
    const points = session.gpsTrack
    if (points.length === 0) return null

    const lats = points.map((p) => p.lat)
    const lngs = points.map((p) => p.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const latRange = maxLat - minLat || 0.001
    const lngRange = maxLng - minLng || 0.001

    const svgPoints = points.map((p) => {
      const x = ((p.lng - minLng) / lngRange) * 460 + 20
      const y = 280 - ((p.lat - minLat) / latRange) * 260 - 20
      return `${x},${y}`
    })

    const polylinePoints = svgPoints.join(' ')

    return (
      <svg width="100%" viewBox="0 0 500 300" style={{ background: '#f0f0f0' }}>
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#1890ff"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {points.map((p, i) => {
          const x = ((p.lng - minLng) / lngRange) * 460 + 20
          const y = 280 - ((p.lat - minLat) / latRange) * 260 - 20
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i === 0 || i === points.length - 1 ? 5 : 3}
              fill={i === 0 ? '#52c41a' : i === points.length - 1 ? '#f5222d' : '#1890ff'}
            />
          )
        })}
      </svg>
    )
  }

  const renderTimeline = (session: ServiceSession) => {
    const points = session.gpsTrack
    if (points.length <= 10) {
      return (
        <Timeline
          items={points.map((p, i) => ({
            color: i === 0 ? 'green' : i === points.length - 1 ? 'red' : 'blue',
            children: (
              <span>
                {new Date(p.timestamp).toLocaleString('zh-CN')} — ({p.lat.toFixed(4)}, {p.lng.toFixed(4)})
              </span>
            ),
          }))}
        />
      )
    }

    const first5 = points.slice(0, 5)
    const last5 = points.slice(-5)

    return (
      <Timeline
        items={[
          ...first5.map((p, i) => ({
            color: i === 0 ? 'green' : 'blue',
            children: (
              <span>
                {new Date(p.timestamp).toLocaleString('zh-CN')} — ({p.lat.toFixed(4)}, {p.lng.toFixed(4)})
              </span>
            ),
          })),
          {
            color: 'gray',
            children: <span style={{ color: '#999' }}>... 省略 {points.length - 10} 个轨迹点 ...</span>,
          },
          ...last5.map((p, i) => ({
            color: i === last5.length - 1 ? 'red' : 'blue',
            children: (
              <span>
                {new Date(p.timestamp).toLocaleString('zh-CN')} — ({p.lat.toFixed(4)}, {p.lng.toFixed(4)})
              </span>
            ),
          })),
        ]}
      />
    )
  }

  return (
    <div className="page-container">
      <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>
        GPS追踪与服务时长核验
      </Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Space>
              <ClockCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div>
                <div style={{ color: '#999', fontSize: 12 }}>服务中会话</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#1890ff' }}>{inProgressCount}</div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Space>
              <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div>
                <div style={{ color: '#999', fontSize: 12 }}>已完成会话</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{completedCount}</div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Space>
              <WarningOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              <div>
                <div style={{ color: '#999', fontSize: 12 }}>偏差预警</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>{deviationAlertCount}</div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Space>
              <ReloadOutlined style={{ fontSize: 24, color: '#f5222d' }} />
              <div>
                <div style={{ color: '#999', fontSize: 12 }}>纠纷会话</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#f5222d' }}>{disputedCount}</div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table columns={columns} dataSource={serviceSessions} rowKey="id" />
      </Card>

      <Modal
        title={`GPS轨迹 - ${currentSession?.id ?? ''}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={720}
      >
        {currentSession && (
          <>
            <div
              style={{
                height: 300,
                background: '#f5f5f5',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                overflow: 'hidden',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 8, color: '#999' }}>
                <EnvironmentOutlined style={{ fontSize: 20 }} />
                <span style={{ marginLeft: 8 }}>GPS轨迹模拟地图</span>
              </div>
              {renderMapSvg(currentSession)}
            </div>

            <Card title="轨迹时间线" size="small" style={{ marginBottom: 16 }}>
              {renderTimeline(currentSession)}
            </Card>

            <Card title="时长核验" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="开始时间">
                  {new Date(currentSession.startTime).toLocaleString('zh-CN')}
                </Descriptions.Item>
                <Descriptions.Item label="结束时间">
                  {currentSession.endTime
                    ? new Date(currentSession.endTime).toLocaleString('zh-CN')
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="预计时长">
                  {currentSession.expectedDuration} min
                </Descriptions.Item>
                <Descriptions.Item label="实际时长">
                  {currentSession.actualDuration != null
                    ? `${currentSession.actualDuration} min`
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="时长偏差">
                  {(() => {
                    const deviation = getDeviation(currentSession)
                    if (deviation === null) return '-'
                    const color = getDeviationColor(deviation)
                    return (
                      <span style={{ color }}>
                        {deviation > 0 ? '+' : ''}
                        {deviation.toFixed(1)}%
                      </span>
                    )
                  })()}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {currentSession.deviationAlert && (
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                message="偏差预警"
                description={
                  currentSession.deviationReason ||
                  `服务时长偏差超过阈值，预计${currentSession.expectedDuration}min，实际${currentSession.actualDuration ?? '-'}min，请关注服务异常情况。`
                }
              />
            )}
          </>
        )}
      </Modal>
    </div>
  )
}

export default ServiceTracking
