import { useState } from 'react'
import {
  Card,
  Input,
  Button,
  Timeline,
  Badge,
  Tag,
  Descriptions,
  Row,
  Col,
  Spin,
  message,
  Empty,
  Space,
  Typography,
} from 'antd'
import { SearchOutlined, EnvironmentOutlined, CarOutlined } from '@ant-design/icons'
import { waybillAPI, trackingAPI } from '@/api'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  formatTime,
} from '@/types'
import { Link } from 'react-router-dom'

const { Title } = Typography

export default function TrackingPage() {
  const [orderNo, setOrderNo] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [waybill, setWaybill] = useState<any>(null)
  const [tracking, setTracking] = useState<any>(null)
  const [latest, setLatest] = useState<any>(null)

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      message.warning('请输入运单号')
      return
    }
    setLoading(true)
    setOrderNo(searchInput)
    try {
      const waybillResult: any = await waybillAPI.list({ order_no: searchInput })
      const items = waybillResult?.data?.list || waybillResult?.data || []
      if (!items || items.length === 0) {
        message.warning('未找到该运单')
        setWaybill(null)
        setTracking(null)
        setLatest(null)
        return
      }
      const wb = items[0]
      setWaybill(wb)

      const [trackingResult, latestResult]: any[] = await Promise.all([
        trackingAPI.getTracking(wb.id).catch(() => ({ data: { points: [] } })),
        trackingAPI.getLatest(wb.id).catch(() => ({ data: null })),
      ])
      setTracking(trackingResult?.data || { points: [] })
      setLatest(latestResult?.data)
    } catch (error) {
      message.error('查询失败')
    } finally {
      setLoading(false)
    }
  }

  const points = tracking?.points || []

  const pathPoints = points.map((p: any) => ({
    x: ((p.lng - 121.4) / 0.2) * 100,
    y: ((31.3 - p.lat) / 0.2) * 100,
    ...p,
  }))

  const pathD = pathPoints.length > 1
    ? pathPoints.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : ''

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>实时追踪</h2>
      <Card style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%', maxWidth: 600 }}>
          <Input
            size="large"
            placeholder="请输入运单号"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            onClick={handleSearch}
            loading={loading}
          >
            追踪
          </Button>
        </Space.Compact>
      </Card>

      <Spin spinning={loading}>
        {waybill ? (
          <>
            <Card
              style={{ marginBottom: 16 }}
              title={
                <Space>
                  <span>运单追踪 - {waybill.order_no}</span>
                  <Badge color={STATUS_COLORS[waybill.status]} text={STATUS_LABELS[waybill.status]} />
                  <Link to={`/waybills/${waybill.id}`}>
                    <Button size="small">查看详情</Button>
                  </Link>
                </Space>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                  <div style={{ position: 'relative', width: '100%', height: 420, background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)', borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9' }}>
                    {pathPoints.length > 0 ? (
                      <>
                        <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#1890ff" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#52c41a" stopOpacity="1" />
                            </linearGradient>
                          </defs>
                          {pathPoints.map((p: any, i: number) => (
                            <circle key={`bg-${i}`} cx={p.x} cy={p.y} r="1.5" fill="#e6f7ff" stroke="#91d5ff" strokeWidth="0.3" />
                          ))}
                          {pathD && <path d={pathD} stroke="url(#trackGradient)" strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="3 1" />}
                          {pathPoints.map((p: any, i: number) => (
                            <g key={i}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={i === pathPoints.length - 1 ? 2.5 : i === 0 ? 2 : 1}
                                fill={i === pathPoints.length - 1 ? '#ff4d4f' : i === 0 ? '#1890ff' : '#52c41a'}
                              />
                              {i === 0 && (
                                <text x={p.x + 2} y={p.y - 2} fontSize="2.5" fill="#1890ff" fontWeight="bold">
                                  起点
                                </text>
                              )}
                              {i === pathPoints.length - 1 && (
                                <>
                                  <circle cx={p.x} cy={p.y} r="4" fill="none" stroke="#ff4d4f" strokeWidth="0.3" opacity="0.5">
                                    <animate attributeName="r" from="3" to="6" dur="1.5s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
                                  </circle>
                                  <text x={p.x + 2} y={p.y - 2} fontSize="2.5" fill="#ff4d4f" fontWeight="bold">
                                    当前
                                  </text>
                                </>
                              )}
                            </g>
                          ))}
                        </svg>
                        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.95)', padding: '8px 12px', borderRadius: 6, fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                          <EnvironmentOutlined style={{ color: '#1890ff', marginRight: 4 }} />
                          共 <strong>{pathPoints.length}</strong> 个轨迹点
                        </div>
                        {latest && (
                          <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.95)', padding: '8px 12px', borderRadius: 6, fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', maxWidth: 260 }}>
                            <div style={{ marginBottom: 4 }}>
                              <strong>
                                <CarOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                                实时位置
                              </strong>
                            </div>
                            <div>坐标: {latest.lat?.toFixed(4)}, {latest.lng?.toFixed(4)}</div>
                            <div>速度: {latest.speed || '-'} m/s</div>
                            <div>方向: {latest.heading || '-'}°</div>
                            <div style={{ color: '#8c8c8c', fontSize: 11 }}>更新于: {formatTime(latest.timestamp)}</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8c8c8c' }}>
                        <Empty description="暂无轨迹数据" />
                      </div>
                    )}
                  </div>
                </Col>
                <Col xs={24} lg={10}>
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="寄件人">
                      {waybill.sender_name} ({waybill.sender_phone})
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>{waybill.sender_address}</div>
                    </Descriptions.Item>
                    <Descriptions.Item label="收件人">
                      {waybill.receiver_name} ({waybill.receiver_phone})
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>{waybill.receiver_address}</div>
                    </Descriptions.Item>
                    <Descriptions.Item label="配送员">
                      {waybill.knight_name || '待分配'}
                      {waybill.knight_name && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>{waybill.knight_phone}</Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间">{formatTime(waybill.created_at)}</Descriptions.Item>
                  </Descriptions>

                  {pathPoints.length >= 2 && (
                    <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
                      <Title level={5} style={{ margin: '0 0 8px 0' }}>轨迹信息</Title>
                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <div style={{ color: '#8c8c8c', fontSize: 12 }}>起点坐标</div>
                          <div style={{ fontSize: 13 }}>
                            {pathPoints[0].lat?.toFixed(4)}, {pathPoints[0].lng?.toFixed(4)}
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ color: '#8c8c8c', fontSize: 12 }}>当前坐标</div>
                          <div style={{ fontSize: 13 }}>
                            {pathPoints[pathPoints.length - 1].lat?.toFixed(4)}, {pathPoints[pathPoints.length - 1].lng?.toFixed(4)}
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ color: '#8c8c8c', fontSize: 12 }}>当前速度</div>
                          <div style={{ fontSize: 13 }}>{pathPoints[pathPoints.length - 1].speed || '-'} m/s</div>
                        </Col>
                        <Col span={12}>
                          <div style={{ color: '#8c8c8c', fontSize: 12 }}>行驶方向</div>
                          <div style={{ fontSize: 13 }}>{pathPoints[pathPoints.length - 1].heading || '-'}°</div>
                        </Col>
                      </Row>
                    </div>
                  )}
                </Col>
              </Row>
            </Card>

            <Card title="状态变更时间线">
              <Timeline
                mode="left"
                items={[
                  {
                    color: 'green',
                    label: formatTime(waybill.created_at),
                    children: '运单创建',
                  },
                  waybill.accepted_at && {
                    color: 'blue',
                    label: formatTime(waybill.accepted_at),
                    children: '骑手接单',
                  },
                  waybill.picked_up_at && {
                    color: 'cyan',
                    label: formatTime(waybill.picked_up_at),
                    children: '已取件',
                  },
                  waybill.delivering_at && {
                    color: 'geekblue',
                    label: formatTime(waybill.delivering_at),
                    children: '开始配送',
                  },
                  waybill.signed_at && {
                    color: 'green',
                    label: formatTime(waybill.signed_at),
                    children: '已签收',
                  },
                  waybill.completed_at && {
                    color: 'green',
                    label: formatTime(waybill.completed_at),
                    children: '订单完成',
                  },
                  waybill.cancelled_at && {
                    color: 'red',
                    label: formatTime(waybill.cancelled_at),
                    children: '订单取消',
                  },
                ].filter(Boolean) as any}
              />
            </Card>
          </>
        ) : (
          orderNo && !loading ? (
            <Card>
              <Empty description="未找到该运单" />
            </Card>
          ) : (
            <Card style={{ textAlign: 'center', padding: '60px 0' }}>
              <EnvironmentOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
              <div style={{ fontSize: 16, color: '#595959', marginBottom: 8 }}>请输入运单号开始实时追踪</div>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>支持查看配送轨迹、实时位置、速度方向信息</div>
            </Card>
          )
        )}
      </Spin>
    </div>
  )
}
