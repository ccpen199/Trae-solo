import React, { useState, useEffect } from 'react'
import {
  Card, List, Tag, Button, Steps, message, Input, Select, Form,
  Modal, Timeline, Row, Col, Statistic, Progress, Space, Descriptions,
  Divider, Table, Empty
} from 'antd'
import {
  EnvironmentOutlined, ClockCircleOutlined, PhoneOutlined,
  UserOutlined, CarOutlined, CheckCircleOutlined,
  ShoppingCartOutlined, GiftOutlined, SafetyOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'

const { Step } = Steps
const { Option } = Select
const { TextArea } = Input

const statusFlow = [
  { key: 'pending', title: '待支付', description: '订单已创建，等待支付', icon: '💳' },
  { key: 'paid', title: '已支付', description: '支付成功，等待商家确认', icon: '✅' },
  { key: 'confirmed', title: '已确认', description: '商家已接单，正在准备', icon: '👨‍🍳' },
  { key: 'delivering', title: '配送中', description: '骑手正在配送', icon: '🏃' },
  { key: 'completed', title: '已完成', description: '订单已完成', icon: '🎉' }
]

const statusMap = {
  pending: { text: '待支付', color: 'orange' },
  paid: { text: '已支付', color: 'blue' },
  confirmed: { text: '已确认', color: 'blue' },
  delivering: { text: '配送中', color: 'cyan' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' }
}

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [tracks, setTracks] = useState([])
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [trackModalVisible, setTrackModalVisible] = useState(false)
  const [user, setUser] = useState(null)
  const [form] = Form.useForm()
  const [trackForm] = Form.useForm()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) setUser(JSON.parse(savedUser))
    loadOrder()
    loadTracks()
  }, [id])

  const loadOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data)
    } catch (error) {
      message.error('加载订单失败')
    }
  }

  const loadTracks = async () => {
    try {
      const res = await api.get(`/orders/${id}/track`)
      setTracks(res.data)
    } catch (error) {
      console.error('加载轨迹失败', error)
    }
  }

  const getCurrentStepIndex = () => {
    if (!order) return 0
    if (order.status === 'cancelled') return -1
    return statusFlow.findIndex(s => s.key === order.status)
  }

  const getNextStatus = () => {
    if (!order) return null
    const currentIndex = getCurrentStepIndex()
    if (currentIndex < 0 || currentIndex >= statusFlow.length - 1) return null
    return statusFlow[currentIndex + 1]
  }

  const handleUpdateStatus = async (values) => {
    try {
      await api.post(`/orders/${id}/status`, values)
      message.success('状态更新成功')
      setStatusModalVisible(false)
      form.resetFields()
      loadOrder()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleAddTrack = async (values) => {
    try {
      await api.post(`/orders/${id}/track`, values)
      message.success('轨迹同步成功')
      setTrackModalVisible(false)
      trackForm.resetFields()
      loadTracks()
    } catch (error) {
      message.error('同步失败')
    }
  }

  const handleQuickStatusChange = async (newStatus) => {
    try {
      await api.post(`/orders/${id}/status`, { status: newStatus, remark: '快捷操作' })
      message.success('状态更新成功')
      loadOrder()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const getDeliveryTimeEstimate = () => {
    if (!order) return null
    if (order.status === 'delivering') {
      return { text: '预计15-30分钟送达', color: '#1890ff' }
    }
    if (order.status === 'confirmed') {
      return { text: '商家正在准备，预计30分钟后送达', color: '#fa8c16' }
    }
    if (order.status === 'paid') {
      return { text: '等待商家确认', color: '#faad14' }
    }
    return null
  }

  if (!order) {
    return <Card loading />
  }

  const currentStepIndex = getCurrentStepIndex()
  const nextStatus = getNextStatus()
  const deliveryEstimate = getDeliveryTimeEstimate()
  const orderItems = order.items || []
  const statusLogs = order.status_logs || []

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16}>
          <Col span={16}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0 }}>订单详情</h2>
                <div style={{ color: '#999', marginTop: '4px' }}>订单号: {order.order_no}</div>
              </div>
              <Tag color={statusMap[order.status]?.color} style={{ fontSize: '16px', padding: '4px 16px' }}>
                {statusMap[order.status]?.text}
              </Tag>
            </div>

            {deliveryEstimate && (
              <div style={{
                padding: '12px 16px',
                background: '#e6f7ff',
                borderRadius: '8px',
                marginBottom: '16px',
                color: deliveryEstimate.color
              }}>
                <ClockCircleOutlined /> {deliveryEstimate.text}
              </div>
            )}

            {order.status !== 'cancelled' && (
              <Card type="inner" title="订单进度" style={{ marginBottom: '16px' }}>
                <Steps
                  current={currentStepIndex}
                  status={order.status === 'cancelled' ? 'error' : 'process'}
                  size="small"
                >
                  {statusFlow.map((step, index) => (
                    <Step
                      key={step.key}
                      title={step.title}
                      description={step.description}
                      icon={<span style={{ fontSize: '20px' }}>{step.icon}</span>}
                    />
                  ))}
                </Steps>
              </Card>
            )}

            {order.status === 'delivering' && (
              <Card type="inner" title="实时配送轨迹" style={{ marginBottom: '16px' }}>
                <Row gutter={16}>
                  <Col span={16}>
                    <div style={{
                      height: 200,
                      background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ textAlign: 'center', zIndex: 10 }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🚴</div>
                        <div style={{ fontWeight: 'bold' }}>骑手正在配送中</div>
                        <div style={{ color: '#999', fontSize: '12px' }}>距离您约 1.2 公里</div>
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: '#1890ff'
                      }}>
                        <div style={{
                          position: 'absolute',
                          right: '20%',
                          top: '-6px',
                          width: '12px',
                          height: '12px',
                          background: '#1890ff',
                          borderRadius: '50%'
                        }} />
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="骑手">张师傅</Descriptions.Item>
                      <Descriptions.Item label="电话">138****8888</Descriptions.Item>
                      <Descriptions.Item label="预计到达">15分钟</Descriptions.Item>
                      <Descriptions.Item label="配送箱温">4°C</Descriptions.Item>
                    </Descriptions>
                    <Space style={{ marginTop: '16px', width: '100%' }} direction="vertical">
                      <Button type="primary" size="small" block icon={<PhoneOutlined />}>
                        联系骑手
                      </Button>
                      <Button size="small" block onClick={() => setTrackModalVisible(true)}>
                        查看完整轨迹
                      </Button>
                    </Space>
                  </Col>
                </Row>

                {tracks.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>配送轨迹记录</div>
                    <Timeline
                      size="small"
                      items={tracks.slice(0, 5).map((track, index) => ({
                        color: index === 0 ? 'blue' : 'gray',
                        children: (
                          <div>
                            <span><EnvironmentOutlined /> {track.latitude.toFixed(4)}, {track.longitude.toFixed(4)}</span>
                            <span style={{ marginLeft: '8px', color: '#999', fontSize: '12px' }}>{track.created_at}</span>
                          </div>
                        )
                      }))}
                    />
                  </div>
                )}
              </Card>
            )}

            <Card type="inner" title="商品清单" style={{ marginBottom: '16px' }}>
              <Table
                dataSource={orderItems}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: '商品',
                    dataIndex: 'product_name',
                    key: 'product_name',
                    render: (text, record) => (
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{text}</div>
                        <div style={{ color: '#999', fontSize: '12px' }}>单价: ¥{record.price}</div>
                      </div>
                    )
                  },
                  {
                    title: '数量',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 80,
                    align: 'center'
                  },
                  {
                    title: '小计',
                    dataIndex: 'total',
                    key: 'total',
                    width: 100,
                    align: 'right',
                    render: (_, record) => `¥${(record.price * record.quantity).toFixed(2)}`
                  }
                ]}
              />
            </Card>

            <Card type="inner" title="配送信息" style={{ marginBottom: '16px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong><EnvironmentOutlined /> 配送地址:</strong> {order.address}</p>
                  <p><strong><PhoneOutlined /> 联系电话:</strong> {order.phone}</p>
                </Col>
                <Col span={12}>
                  <p><strong>配送方式:</strong> 外卖配送</p>
                  <p><strong>配送费:</strong> ¥5.00</p>
                </Col>
              </Row>
              {order.remark && (
                <div style={{ marginTop: '8px', color: '#666' }}>
                  <strong>备注:</strong> {order.remark}
                </div>
              )}
            </Card>

            <Card type="inner" title="订单状态变更记录">
              {statusLogs.length > 0 ? (
                <Timeline
                  items={statusLogs.map(log => ({
                    color: log.status === 'cancelled' ? 'red' : log.status === 'completed' ? 'green' : 'blue',
                    children: (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Tag color={statusMap[log.status]?.color} style={{ marginRight: '8px' }}>
                              {statusMap[log.status]?.text}
                            </Tag>
                            <span style={{ color: '#666' }}>
                              操作人: {log.operator === 'user' ? '用户' : log.operator === 'admin' ? '管理员' : log.operator || '系统'}
                            </span>
                            {log.remark && (
                              <span style={{ marginLeft: '16px', color: '#999' }}>
                                备注: {log.remark}
                              </span>
                            )}
                          </div>
                          <span style={{ color: '#999', fontSize: '12px' }}>{log.created_at}</span>
                        </div>
                      </div>
                    )
                  }))}
                />
              ) : (
                <Empty description="暂无状态变更记录" />
              )}
            </Card>
          </Col>

          <Col span={8}>
            <Card title="订单信息" style={{ marginBottom: '16px' }}>
              <Statistic
                title="实付金额"
                value={order.pay_amount}
                prefix="¥"
                valueStyle={{ color: '#ff4d4f', fontSize: '28px' }}
              />
              <Divider style={{ margin: '16px 0' }} />
              <div style={{ fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>商品总价</span>
                  <span>¥{order.total_amount?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>配送费</span>
                  <span>¥5.00</span>
                </div>
                {order.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#52c41a' }}>
                    <span><GiftOutlined /> 优惠抵扣</span>
                    <span>-¥{order.discount_amount?.toFixed(2)}</span>
                  </div>
                )}
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
                  <span>实付金额</span>
                  <span style={{ color: '#ff4d4f' }}>¥{order.pay_amount?.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {user && (
              <Card title="快捷操作" style={{ marginBottom: '16px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {nextStatus && (
                    <Button type="primary" block onClick={() => handleQuickStatusChange(nextStatus.key)}>
                      {nextStatus.icon} 更新为「{nextStatus.title}」
                    </Button>
                  )}
                  <Button block onClick={() => setStatusModalVisible(true)}>
                    自定义更新状态
                  </Button>
                  {(user.role === 'admin' || user.role === 'rider') && order.status === 'delivering' && (
                    <Button block onClick={() => setTrackModalVisible(true)}>
                      同步配送轨迹
                    </Button>
                  )}
                  {order.status === 'pending' && (
                    <Button block danger>
                      取消订单
                    </Button>
                  )}
                </Space>
              </Card>
            )}

            <Card title="权益信息">
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏷️</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>优惠券</div>
                    <div style={{ color: '#52c41a', fontWeight: 'bold' }}>
                      {order.coupon_id ? '已使用' : '未使用'}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>⭐</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>可获积分</div>
                    <div style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                      {Math.floor(order.pay_amount)}
                    </div>
                  </div>
                </Col>
              </Row>
              <div style={{ marginTop: '16px', padding: '12px', background: '#f6ffed', borderRadius: '8px' }}>
                <div style={{ color: '#52c41a', fontSize: '12px' }}>
                  <SafetyOutlined /> 该订单已投保食品安全险
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        title="更新订单状态"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleUpdateStatus} layout="vertical">
          <Form.Item name="status" label="订单状态" rules={[{ required: true }]}>
            <Select>
              <Option value="pending">待支付</Option>
              <Option value="paid">已支付</Option>
              <Option value="confirmed">已确认</Option>
              <Option value="delivering">配送中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认更新</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="同步配送轨迹"
        open={trackModalVisible}
        onCancel={() => setTrackModalVisible(false)}
        footer={null}
      >
        <Form form={trackForm} onFinish={handleAddTrack} layout="vertical">
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="latitude" label="纬度" rules={[{ required: true }]}>
                <Input placeholder="例如: 39.9042" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="longitude" label="经度" rules={[{ required: true }]}>
                <Input placeholder="例如: 116.4074" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="rider_id" label="骑手ID">
            <Input placeholder="骑手用户ID" />
          </Form.Item>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>快速选择位置:</div>
            <Space>
              <Button size="small" onClick={() => {
                trackForm.setFieldsValue({ latitude: 39.9100, longitude: 116.4050 })
              }}>当前位置</Button>
              <Button size="small" onClick={() => {
                trackForm.setFieldsValue({ latitude: 39.9080, longitude: 116.4060 })
              }}>商家门口</Button>
              <Button size="small" onClick={() => {
                trackForm.setFieldsValue({ latitude: 39.9050, longitude: 116.4070 })
              }}>中途</Button>
            </Space>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>同步轨迹</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OrderDetail
