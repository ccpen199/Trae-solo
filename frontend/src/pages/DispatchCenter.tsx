import { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Tag,
  List,
  Avatar,
  Space,
  Spin,
  message,
  Progress,
  Descriptions,
  Divider,
  Empty,
} from 'antd'
import {
  RobotOutlined,
  UserOutlined,
  CarOutlined,
  EnvironmentOutlined,
  StarOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { waybillAPI, dispatchAPI } from '@/api'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  KNIGHT_TYPE_COLORS,
  KNIGHT_TYPE_LABELS,
  formatTime,
} from '@/types'
import { Link } from 'react-router-dom'

export default function DispatchCenter() {
  const [loading, setLoading] = useState(false)
  const [candidatesLoading, setCandidatesLoading] = useState(false)
  const [pendingWaybills, setPendingWaybills] = useState<any[]>([])
  const [selectedWaybill, setSelectedWaybill] = useState<any>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadPendingWaybills()
  }, [])

  const loadPendingWaybills = async () => {
    setLoading(true)
    try {
      const result: any = await waybillAPI.list({ status: 'pending', pageSize: 50 })
      const items = result?.data?.list || result?.data || result || []
      setPendingWaybills(Array.isArray(items) ? items : [])
    } catch (error) {
      setPendingWaybills([])
    } finally {
      setLoading(false)
    }
  }

  const loadCandidates = async (waybillId: string) => {
    setCandidatesLoading(true)
    try {
      const result: any = await dispatchAPI.getCandidates(waybillId)
      const data = Array.isArray(result?.data) ? result.data : (result?.data?.candidates || result?.data?.list || [])
      setCandidates(Array.isArray(data) ? data : [])
    } catch (error) {
      setCandidates([])
    } finally {
      setCandidatesLoading(false)
    }
  }

  const handleSelectWaybill = (record: any) => {
    setSelectedWaybill(record)
    loadCandidates(record.id)
  }

  const handleAutoDispatch = async () => {
    if (!selectedWaybill) return
    setActionLoading(true)
    try {
      await dispatchAPI.autoDispatch(selectedWaybill.id)
      message.success('自动调度成功')
      loadPendingWaybills()
      setSelectedWaybill(null)
      setCandidates([])
    } catch (error) {
      message.error('自动调度失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleManualDispatch = async (knightId: string) => {
    if (!selectedWaybill) return
    setActionLoading(true)
    try {
      await dispatchAPI.manualDispatch(selectedWaybill.id, knightId)
      message.success('手动派单成功')
      loadPendingWaybills()
      setSelectedWaybill(null)
      setCandidates([])
    } catch (error) {
      message.error('派单失败')
    } finally {
      setActionLoading(false)
    }
  }

  const waybillColumns = [
    {
      title: '运单号',
      dataIndex: 'order_no',
      render: (v: string, record: any) => (
        <Link to={`/waybills/${record.id}`}>{v}</Link>
      ),
    },
    {
      title: '寄件人',
      dataIndex: 'sender_name',
    },
    {
      title: '收件人',
      dataIndex: 'receiver_name',
    },
    {
      title: '品类',
      dataIndex: 'category',
      render: (v: string) => (
        <Tag color={CATEGORY_COLORS[v]}>{CATEGORY_LABELS[v] || v}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => (
        <Badge color={STATUS_COLORS[v]} text={STATUS_LABELS[v] || v} />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: formatTime,
    },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <Button
          type={selectedWaybill?.id === record.id ? 'primary' : 'default'}
          size="small"
          onClick={() => handleSelectWaybill(record)}
          icon={<CarOutlined />}
        >
          {selectedWaybill?.id === record.id ? '已选择' : '调度'}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>调度中心</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined />
                待调度运单
                <Badge count={pendingWaybills.length} color="orange" />
              </Space>
            }
            extra={
              <Button onClick={loadPendingWaybills} loading={loading}>
                刷新
              </Button>
            }
          >
            <Spin spinning={loading}>
              {pendingWaybills.length > 0 ? (
                <Table
                  columns={waybillColumns}
                  dataSource={pendingWaybills}
                  rowKey="id"
                  pagination={{ pageSize: 8 }}
                  size="small"
                  rowClassName={(record) =>
                    selectedWaybill?.id === record.id ? 'ant-table-row-selected' : ''
                  }
                />
              ) : (
                <Empty description="暂无待调度运单" />
              )}
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <UserOutlined />
                候选骑手
                {selectedWaybill && (
                  <Tag color="blue">
                    运单: {selectedWaybill.order_no}
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<RobotOutlined />}
                  onClick={handleAutoDispatch}
                  loading={actionLoading}
                  disabled={!selectedWaybill}
                >
                  自动调度
                </Button>
              </Space>
            }
          >
            {selectedWaybill ? (
              <Spin spinning={candidatesLoading}>
                {candidates.length > 0 ? (
                  <>
                    {selectedWaybill && (
                      <Card size="small" style={{ marginBottom: 12, background: '#f5f5f5' }}>
                        <Descriptions column={2} size="small">
                          <Descriptions.Item label="寄件地址">
                            {selectedWaybill.sender_address}
                          </Descriptions.Item>
                          <Descriptions.Item label="收件地址">
                            {selectedWaybill.receiver_address}
                          </Descriptions.Item>
                          <Descriptions.Item label="寄件坐标">
                            {selectedWaybill.sender_lat?.toFixed(4)}, {selectedWaybill.sender_lng?.toFixed(4)}
                          </Descriptions.Item>
                          <Descriptions.Item label="物品品类">
                            <Tag color={CATEGORY_COLORS[selectedWaybill.category]}>
                              {CATEGORY_LABELS[selectedWaybill.category]}
                            </Tag>
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    )}
                    <List
                      itemLayout="vertical"
                      dataSource={candidates}
                      renderItem={(item, index) => (
                        <List.Item
                          key={item.id || index}
                          style={{
                            padding: '16px',
                            marginBottom: 8,
                            background: index === 0 ? '#f6ffed' : '#fff',
                            border: '1px solid #d9d9d9',
                            borderRadius: 8,
                          }}
                          extra={
                            <Button
                              type="primary"
                              icon={<CarOutlined />}
                              onClick={() => handleManualDispatch(item.id)}
                              loading={actionLoading}
                            >
                              手动派单
                            </Button>
                          }
                        >
                          <List.Item.Meta
                            avatar={
                              <Avatar
                                size="large"
                                icon={<UserOutlined />}
                                style={{
                                  background: index === 0 ? '#52c41a' : '#1890ff',
                                }}
                              />
                            }
                            title={
                              <Space>
                                {index === 0 && (
                                  <Tag color="gold" icon={<TrophyOutlined />}>
                                    最优匹配
                                  </Tag>
                                )}
                                <span style={{ fontWeight: 'bold', fontSize: 16 }}>
                                  {item.name}
                                </span>
                              </Space>
                            }
                            description={
                              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                <Space size={16}>
                                  <span>
                                    <EnvironmentOutlined style={{ marginRight: 4 }} />
                                    距离: {item.distance?.toFixed(2)} km
                                  </span>
                                  <span>
                                    <CarOutlined style={{ marginRight: 4 }} />
                                    负载分: {item.load_score?.toFixed(2) || 0}
                                  </span>
                                  <span>
                                    <StarOutlined style={{ marginRight: 4, color: '#faad14' }} />
                                    历史分: {item.history_score?.toFixed(2) || '5.0'}
                                  </span>
                                </Space>
                                <div>
                                  <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                                    综合评分: {item.score ? (item.score * 100).toFixed(1) : 0}
                                  </span>
                                  <Progress
                                    percent={Math.min(100, Math.max(0, (item.score || 0) * 100))}
                                    size="small"
                                    showInfo={false}
                                    style={{ width: 200, marginLeft: 8, verticalAlign: 'middle' }}
                                    strokeColor="#1890ff"
                                  />
                                </div>
                                <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                                  评分构成: 距离分 {item.distance_score?.toFixed(2) || 0} + 负载分 {item.load_score?.toFixed(2) || 0} + 历史分 {item.history_score?.toFixed(2) || 0} + 保险分 {item.insurance_score?.toFixed(2) || 0}
                                </div>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </>
                ) : (
                  <Empty description="暂无可用候选骑手" />
                )}
              </Spin>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c' }}>
                <RobotOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                <div>请从左侧选择待调度运单</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
