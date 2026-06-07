import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Tag,
  Badge,
  Timeline,
  Button,
  Space,
  Spin,
  message,
  Table,
  Row,
  Col,
  Avatar,
  Popconfirm,
  Steps,
  Alert,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CarOutlined,
  UserOutlined,
  StopOutlined,
  EnvironmentOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import {
  waybillAPI,
  trackingAPI,
  dispatchAPI,
  exceptionAPI,
  insuranceAPI,
} from '@/api'
import { useAuthStore } from '@/store'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  formatTime,
  INSURANCE_LEVEL_COLORS,
  INSURANCE_LEVEL_LABELS,
  KNIGHT_TYPE_COLORS,
  KNIGHT_TYPE_LABELS,
  EXCEPTION_TYPE_COLORS,
  EXCEPTION_TYPE_LABELS,
  EXCEPTION_STATUS_COLORS,
  EXCEPTION_STATUS_LABELS,
} from '@/types'

const STATUS_ORDER = ['pending', 'accepted', 'picked_up', 'delivering', 'signed', 'completed']

export default function WaybillDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(true)
  const [waybill, setWaybill] = useState<any>(null)
  const [tracking, setTracking] = useState<any>(null)
  const [dispatchLogs, setDispatchLogs] = useState<any[]>([])
  const [exceptions, setExceptions] = useState<any[]>([])
  const [insurance, setInsurance] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (id) loadData(id)
  }, [id])

  const loadData = async (waybillId: string) => {
    setLoading(true)
    try {
      const [wb, tr, dl, ex, ins] = await Promise.all([
        waybillAPI.getDetail(waybillId),
        trackingAPI.getTracking(waybillId).catch(() => ({ data: { points: [] } })),
        dispatchAPI.getLogs(waybillId).catch(() => ({ data: [] })),
        exceptionAPI.list({ waybill_id: waybillId }).catch(() => ({ data: [] })),
        insuranceAPI.getStatus(waybillId).catch(() => ({ data: null })),
      ])
      setWaybill(wb?.data || wb)
      setTracking(tr?.data || { points: [] })
      setDispatchLogs(Array.isArray(dl?.data) ? dl.data : [])
      const exList = ex?.data?.list || ex?.data || []
      setExceptions(Array.isArray(exList) ? exList : [])
      setInsurance(ins?.data)
    } catch (error) {
      message.error('加载运单详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!id) return
    setActionLoading(status)
    try {
      await waybillAPI.updateStatus(id, status, user?.id)
      message.success(`状态已更新为${STATUS_LABELS[status]}`)
      await loadData(id)
    } catch (error) {
      message.error('操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async () => {
    if (!id) return
    try {
      await waybillAPI.cancel(id)
      message.success('运单已取消')
      loadData(id)
    } catch (error) {
      message.error('取消失败')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!waybill) {
    return <Alert type="error" message="运单不存在" />
  }

  const currentStepIndex = STATUS_ORDER.indexOf(waybill.status)

  const getAvailableActions = () => {
    const s = waybill.status
    const actions: { key: string; label: string; danger?: boolean }[] = []
    if (s === 'pending') {
      actions.push({ key: 'accepted', label: '接单' })
    }
    if (s === 'accepted') {
      actions.push({ key: 'picked_up', label: '取件完成' })
    }
    if (s === 'picked_up') {
      actions.push({ key: 'delivering', label: '开始配送' })
    }
    if (s === 'delivering') {
      actions.push({ key: 'signed', label: '签收' })
    }
    if (s === 'signed') {
      actions.push({ key: 'completed', label: '完成' })
    }
    if (s !== 'completed' && s !== 'cancelled') {
      actions.push({ key: 'cancel', label: '取消运单', danger: true })
    }
    return actions
  }

  const points = tracking?.points || []

  const pointsMap = points.reduce((acc: Record<string, any>, p: any) => {
    acc[p.timestamp] = p
    return acc
  }, {})

  const pathPoints = points.map((p: any) => ({
    x: ((p.lng - 121.4) / 0.2) * 100,
    y: ((31.3 - p.lat) / 0.2) * 100,
    ...p,
  }))

  const pathD = pathPoints.length > 1
    ? pathPoints.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : ''

  const timelineEvents = [
    { status: 'pending', label: '订单创建', icon: <CheckCircleOutlined /> },
    { status: 'accepted', label: '骑手接单', icon: <UserOutlined /> },
    { status: 'picked_up', label: '已取件', icon: <CarOutlined /> },
    { status: 'delivering', label: '配送中', icon: <CarOutlined /> },
    { status: 'signed', label: '已签收', icon: <CheckCircleOutlined /> },
    { status: 'completed', label: '已完成', icon: <CheckCircleOutlined /> },
  ]

  const exceptionColumns = [
    {
      title: '异常类型',
      dataIndex: 'type',
      render: (v: string) => (
        <Tag color={EXCEPTION_TYPE_COLORS[v]}>{EXCEPTION_TYPE_LABELS[v] || v}</Tag>
      ),
    },
    { title: '原骑手', dataIndex: ['original_knight', 'name'], render: (v: string) => v || '-' },
    { title: '新骑手', dataIndex: ['new_knight', 'name'], render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string, record: any) => {
        const label = EXCEPTION_STATUS_LABELS[v] || v
        const color = EXCEPTION_STATUS_COLORS[v] || 'default'
        if (v === 'auto_reassigned' && record.new_knight?.name) {
          return <Space><Badge color={color} text={label} /><Tag color="green">备用运力: {record.new_knight.name}</Tag></Space>
        }
        if (v === 'resolved') {
          return <Badge color="green" text="处理完成" />
        }
        return <Badge color={color} text={label} />
      }
    },
    { title: '创建时间', dataIndex: 'created_at', render: formatTime },
    { title: '解决时间', dataIndex: 'resolved_at', render: (v: string) => v ? formatTime(v) : '-' },
  ]

  const dispatchLogColumns = [
    { title: '操作', dataIndex: 'action', render: (v: string) => v || '-' },
    { title: '骑手', dataIndex: 'knight_name', render: (v: string, record: any) => record?.knight?.name || v || '-' },
    { title: '综合评分', dataIndex: 'score', render: (v: number) => v ? `${(v * 100).toFixed(1)}分` : '-' },
    { title: '距离分', dataIndex: 'distance_score', render: (v: number) => v ? `${(v * 100).toFixed(1)}` : '-' },
    { title: '负载分', dataIndex: 'load_score', render: (v: number) => v ? `${(v * 100).toFixed(1)}` : '-' },
    { title: '历史分', dataIndex: 'history_score', render: (v: number) => v ? `${(v * 100).toFixed(1)}` : '-' },
    { title: '保险分', dataIndex: 'insurance_score', render: (v: number) => v ? `${(v * 100).toFixed(1)}` : '-' },
    { title: '时间', dataIndex: 'created_at', render: formatTime },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h2 style={{ margin: 0 }}>运单详情 - {waybill.order_no}</h2>
          <Badge color={STATUS_COLORS[waybill.status]} text={STATUS_LABELS[waybill.status] || waybill.status} />
        </Space>
        <Space>
          {getAvailableActions().map((action) =>
            action.key === 'cancel' ? (
              <Popconfirm key={action.key} title="确认取消该运单？" onConfirm={handleCancel}>
                <Button danger icon={<StopOutlined />}>
                  {action.label}
                </Button>
              </Popconfirm>
            ) : (
              <Button
                key={action.key}
                type="primary"
                loading={actionLoading === action.key}
                onClick={() => handleStatusChange(action.key)}
              >
                {action.label}
              </Button>
            )
          )}
        </Space>
      </div>

      <Card title="状态进度" style={{ marginBottom: 16 }}>
        <Steps
          current={currentStepIndex >= 0 ? currentStepIndex + 1 : 0}
          size="small"
          items={timelineEvents.map((e) => ({
            title: e.label,
            status:
              currentStepIndex >= STATUS_ORDER.indexOf(e.status)
                ? 'finish'
                : currentStepIndex + 1 === STATUS_ORDER.indexOf(e.status)
                ? 'process'
                : 'wait',
          }))}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="寄件人信息">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="姓名">{waybill.sender_name}</Descriptions.Item>
              <Descriptions.Item label="电话">{waybill.sender_phone}</Descriptions.Item>
              <Descriptions.Item label="地址">{waybill.sender_address}</Descriptions.Item>
              <Descriptions.Item label="坐标">
                <Tag color="blue">{waybill.sender_lat?.toFixed(4)}, {waybill.sender_lng?.toFixed(4)}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="收件人信息">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="姓名">{waybill.receiver_name}</Descriptions.Item>
              <Descriptions.Item label="电话">{waybill.receiver_phone}</Descriptions.Item>
              <Descriptions.Item label="地址">{waybill.receiver_address}</Descriptions.Item>
              <Descriptions.Item label="坐标">
                <Tag color="green">{waybill.receiver_lat?.toFixed(4)}, {waybill.receiver_lng?.toFixed(4)}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="配送信息">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="品类">
                <Tag color={CATEGORY_COLORS[waybill.category]}>{CATEGORY_LABELS[waybill.category]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="费用">
                <span style={{ color: '#fa8c16', fontSize: 16, fontWeight: 'bold' }}>
                  ¥{waybill.fee?.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="保险">
                <Tag color={INSURANCE_LEVEL_COLORS[waybill.insurance_level]}>
                  {INSURANCE_LEVEL_LABELS[waybill.insurance_level]}
                </Tag>
                {insurance && (
                  <Badge
                    color={insurance.verified ? 'green' : 'orange'}
                    text={insurance.verified ? '已核验' : '核验中'}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{formatTime(waybill.created_at)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {waybill.knight_id && (
        <Card
          title="骑手信息"
          style={{ marginTop: 16 }}
          extra={
            <Link to={`/knights/${waybill.knight_id}`}>
              <Button size="small" icon={<EyeOutlined />}>
                骑手详情
              </Button>
            </Link>
          }
        >
          <Descriptions column={3} size="small">
            <Descriptions.Item label="姓名">
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                {waybill.knight_name}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="电话">{waybill.knight_phone}</Descriptions.Item>
            <Descriptions.Item label="骑手ID">{waybill.knight_id}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="配送轨迹" style={{ marginTop: 16 }}>
        {pathPoints.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', height: 360, background: '#f5f5f5', borderRadius: 8, overflow: 'hidden' }}>
            <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1890ff" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#52c41a" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              {pathD && <path d={pathD} stroke="url(#pathGradient)" strokeWidth="0.8" fill="none" strokeLinecap="round" />}
              {pathPoints.map((p: any, i: number) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={i === pathPoints.length - 1 ? 2 : 1}
                    fill={i === pathPoints.length - 1 ? '#ff4d4f' : i === 0 ? '#1890ff' : '#52c41a'}
                  />
                  {i === 0 && (
                    <text x={p.x + 1} y={p.y - 1} fontSize="3" fill="#1890ff" fontWeight="bold">
                      起点
                    </text>
                  )}
                  {i === pathPoints.length - 1 && (
                    <text x={p.x + 1} y={p.y - 1} fontSize="3" fill="#ff4d4f" fontWeight="bold">
                      当前
                    </text>
                  )}
                </g>
              ))}
            </svg>
            <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
              <EnvironmentOutlined style={{ marginRight: 4 }} />
              共 {pathPoints.length} 个轨迹点
            </div>
            {pathPoints.length > 0 && (
              <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
                当前位置: {pathPoints[pathPoints.length - 1].lat?.toFixed(4)}, {pathPoints[pathPoints.length - 1].lng?.toFixed(4)}
                <br />
                速度: {pathPoints[pathPoints.length - 1].speed || '-'} m/s | 方向: {pathPoints[pathPoints.length - 1].heading || '-'}°
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c' }}>
            暂无轨迹数据
          </div>
        )}
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="调度日志">
            <Table
              columns={dispatchLogColumns}
              dataSource={dispatchLogs}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="异常记录">
            {exceptions.length > 0 ? (
              <Table
                columns={exceptionColumns}
                dataSource={exceptions}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
                暂无异常记录
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="状态变更记录" style={{ marginTop: 16 }}>
        <Timeline
          items={[
            {
              color: 'green',
              children: (
                <span>
                  运单创建 - {formatTime(waybill.created_at)}
                </span>
              ),
            },
            ...STATUS_ORDER.slice(1).map((s) => {
              const timeKey = `${s}_at`
              const t = waybill[timeKey]
              return t ? {
                color: STATUS_COLORS[s],
                children: (
                  <span>
                    {STATUS_LABELS[s]} - {formatTime(t)}
                  </span>
                ),
              } : null
            }).filter(Boolean),
            waybill.cancelled_at && {
              color: 'red',
              children: (
                <span>
                  运单取消 - {formatTime(waybill.cancelled_at)}
                </span>
              ),
            },
          ].filter(Boolean) as any}
        />
      </Card>
    </div>
  )
}
