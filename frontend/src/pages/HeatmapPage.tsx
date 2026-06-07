import { useEffect, useState } from 'react'
import {
  Card,
  Button,
  Row,
  Col,
  Statistic,
  Tag,
  Spin,
  message,
  Tooltip,
  Empty,
  Space,
} from 'antd'
import {
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HeatMapOutlined,
  UserOutlined,
  ShoppingOutlined,
} from '@ant-design/icons'
import { heatmapAPI } from '@/api'

export default function HeatmapPage() {
  const [loading, setLoading] = useState(false)
  const [heatmap, setHeatmap] = useState<any>(null)
  const [prediction, setPrediction] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    Promise.all([
      heatmapAPI.getHeatmap().catch(() => ({ data: null })),
      heatmapAPI.getPrediction().catch(() => ({ data: null })),
    ]).then(([hm, pred]) => {
      setHeatmap(hm?.data || null)
      setPrediction(pred?.data || null)
      setLoading(false)
    })
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await heatmapAPI.refresh()
      message.success('热力图已刷新')
      loadData()
    } catch {
      message.error('刷新失败')
      setLoading(false)
    }
  }

  const getCellColor = (gapScore: number) => {
    if (gapScore <= 30) return '#52c41a'
    if (gapScore <= 60) return '#faad14'
    return '#ff4d4f'
  }

  const getPredictionArrow = (areaId: string) => {
    if (!prediction || !prediction.predictions) return null
    const pred = prediction.predictions.find((p: any) => p.area_id === areaId)
    if (!pred) return null
    if (pred.gap_change > 0) {
      return <ArrowUpOutlined style={{ color: '#ff4d4f' }} />
    } else if (pred.gap_change < 0) {
      return <ArrowDownOutlined style={{ color: '#52c41a' }} />
    }
    return null
  }

  const areas = heatmap?.areas || []
  const totalKnights = heatmap?.total_active_knights || 0
  const totalOrders = heatmap?.total_pending_orders || 0
  const avgGap = heatmap?.avg_gap_score || 0

  const gridSize = 4

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>
          <HeatMapOutlined style={{ marginRight: 8 }} />
          供需热力图
        </h2>
        <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
          刷新数据
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="活跃骑手总数"
              value={totalKnights}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="待配送订单总数"
              value={totalOrders}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="平均供需缺口"
              value={avgGap}
              precision={1}
              suffix="分"
              valueStyle={{ color: avgGap > 60 ? '#ff4d4f' : avgGap > 30 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="城市区域供需热力图 (4x4 网格)"
        extra={
          <Space size={16}>
            <Space>
              <span style={{ display: 'inline-block', width: 16, height: 16, background: '#52c41a', borderRadius: 2 }} />
              <span style={{ fontSize: 12 }}>充足</span>
            </Space>
            <Space>
              <span style={{ display: 'inline-block', width: 16, height: 16, background: '#faad14', borderRadius: 2 }} />
              <span style={{ fontSize: 12 }}>紧张</span>
            </Space>
            <Space>
              <span style={{ display: 'inline-block', width: 16, height: 16, background: '#ff4d4f', borderRadius: 2 }} />
              <span style={{ fontSize: 12 }}>紧缺</span>
            </Space>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {areas.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                gap: 8,
                maxWidth: 700,
                margin: '0 auto',
              }}
            >
              {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
                const row = Math.floor(idx / gridSize)
                const col = idx % gridSize
                const areaId = `A${row + 1}${col + 1}`
                const area = areas.find((a: any) => a.area_id === areaId) || {
                  area_id: areaId,
                  name: `区域${areaId}`,
                  gap_score: 50,
                  active_knights: 0,
                  pending_orders: 0,
                }
                const gapScore = area.gap_score ?? 50
                return (
                  <Tooltip
                    key={area.area_id}
                    title={
                      <div>
                        <div><strong>{area.name}</strong></div>
                        <div>区域: {area.area_id}</div>
                        <div>活跃骑手: {area.active_knights || 0}</div>
                        <div>待配送订单: {area.pending_orders || 0}</div>
                        <div>供需缺口: {gapScore}</div>
                        <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                          {gapScore <= 30 ? '运力充足 ✅' : gapScore <= 60 ? '运力紧张 ⚠️' : '运力紧缺 🔥'}
                        </div>
                      </div>
                    }
                    mouseEnterDelay={0.3}
                  >
                    <div
                      style={{
                        aspectRatio: '1',
                        background: getCellColor(gapScore),
                        borderRadius: 8,
                        padding: 12,
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'transform 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ fontSize: 14 }}>{area.area_id}</strong>
                        {getPredictionArrow(area.area_id)}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.95 }}>
                        <div>{area.name || `区域${area.area_id}`}</div>
                        <div style={{ marginTop: 4 }}>
                          <UserOutlined style={{ marginRight: 4 }} />
                          {area.active_knights || 0}
                          <ShoppingOutlined style={{ marginLeft: 8, marginRight: 4 }} />
                          {area.pending_orders || 0}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 16 }}>
                        {gapScore}
                      </div>
                    </div>
                  </Tooltip>
                )
              })}
            </div>
          ) : (
            <Empty description="暂无热力图数据" />
          )}
        </Spin>
      </Card>

      {prediction && prediction.predictions && prediction.predictions.length > 0 && (
        <Card title="供需预测趋势 (未来30分钟)" style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            {prediction.predictions.map((p: any) => {
              const isWarn = p.gap_change !== 0
              return (
                <Col xs={24} sm={12} lg={6} key={p.area_id}>
                  <Card size="small" style={{ background: isWarn ? '#fff7e6' : '#f6ffed', border: isWarn ? '1px solid #ffd591' : '1px solid #b7eb8f' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold' }}>{p.area_id}</span>
                      {p.gap_change > 0 ? (
                        <Tag color="red">
                          <ArrowUpOutlined /> 缺口 +{p.gap_change}
                        </Tag>
                      ) : p.gap_change < 0 ? (
                        <Tag color="green">
                          <ArrowDownOutlined /> 缺口 {p.gap_change}
                        </Tag>
                      ) : (
                        <Tag>稳定</Tag>
                      )}
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                      预计缺口: {p.predicted_gap}
                    </div>
                  </Card>
                </Col>
              )
            })}
          </Row>
        </Card>
      )}
    </div>
  )
}
