import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Card, Descriptions, Tag, Button, Space, List, Avatar, 
  Modal, Form, Input, InputNumber, Rate, message, Divider,
  Table, Select, Typography, Steps, Timeline, Image, 
  Upload, Empty, Alert, Row, Col, Statistic, Progress
} from 'antd'
import { 
  ArrowLeftOutlined, CheckOutlined, PictureOutlined,
  DollarOutlined, FileTextOutlined, ClockCircleOutlined,
  UserOutlined, SafetyCertificateOutlined, AlertOutlined,
  UploadOutlined, ToolOutlined, ShoppingOutlined
} from '@ant-design/icons'
import { ownerApi } from '../../utils/api'

const { Title, Text, Paragraph } = Typography

const statusMap = {
  pending: { text: '待指派', color: 'default' },
  negotiating: { text: '议价中', color: 'processing' },
  negotiated: { text: '待接单', color: 'blue' },
  accepted: { text: '已接单', color: 'success' },
  in_progress: { text: '服务中', color: 'warning' },
  completed: { text: '待验收', color: 'purple' },
  accepted_with_signature: { text: '已验收', color: 'purple' },
  finished: { text: '已完成', color: 'success' }
}

const stepOrder = ['pending', 'negotiating', 'negotiated', 'accepted', 'in_progress', 'completed', 'accepted_with_signature', 'finished']
const stepTitles = ['待指派', '议价中', '待接单', '已接单', '服务中', '待验收', '已验收', '已完成']

const OrderDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [masters, setMasters] = useState([])
  const [photos, setPhotos] = useState([])
  const [activeTab, setActiveTab] = useState('detail')
  const [assignModal, setAssignModal] = useState(false)
  const [negotiateModal, setNegotiateModal] = useState(false)
  const [acceptModal, setAcceptModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [signModal, setSignModal] = useState(false)
  const [form] = Form.useForm()
  const [negotiateForm] = Form.useForm()
  const [reviewForm] = Form.useForm()
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)

  useEffect(() => {
    loadOrderDetail()
    loadMasters()
  }, [id])

  useEffect(() => {
    if (signModal && canvasRef.current) {
      setTimeout(initCanvas, 100)
    }
  }, [signModal])

  const initCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const startDrawing = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const loadOrderDetail = async () => {
    try {
      const result = await ownerApi.getOrderDetail(id)
      setData(result)
      if (result.photos && result.photos.length > 0) {
        setPhotos(result.photos)
      } else {
        setPhotos([
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=air%20conditioner%20repair%20service&image_size=square',
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=home%20appliance%20maintenance&image_size=square'
        ])
      }
    } catch (error) {
      message.error('加载订单详情失败')
    }
  }

  const loadMasters = async () => {
    try {
      const result = await ownerApi.getAvailableMasters()
      setMasters(result)
    } catch (error) {
      console.error('加载师傅列表失败', error)
    }
  }

  const handleAssignMaster = async (values) => {
    setLoading(true)
    try {
      await ownerApi.assignMaster(id, values.master_id)
      message.success('师傅指派成功')
      setAssignModal(false)
      loadOrderDetail()
    } catch (error) {
      message.error(error.message || '指派失败')
    } finally {
      setLoading(false)
    }
  }

  const handleNegotiate = async (values) => {
    setLoading(true)
    try {
      await ownerApi.negotiate(id, values)
      message.success('报价已发送')
      setNegotiateModal(false)
      negotiateForm.resetFields()
      loadOrderDetail()
    } catch (error) {
      message.error(error.message || '发送失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptPrice = async (negotiationId) => {
    try {
      await ownerApi.acceptPrice(id, negotiationId)
      message.success('价格已确认')
      loadOrderDetail()
    } catch (error) {
      message.error(error.message || '确认失败')
    }
  }

  const handlePayDeposit = async () => {
    try {
      await ownerApi.payDeposit(id)
      message.success('定金支付成功，师傅可以开始服务')
      loadOrderDetail()
    } catch (error) {
      message.error(error.message || '支付失败')
    }
  }

  const handleAcceptOrder = async (values) => {
    const canvas = canvasRef.current
    const signature = canvas.toDataURL()
    setLoading(true)
    try {
      await ownerApi.acceptOrder(id, { ...values, signature })
      message.success('验收成功，电子签名已保存')
      setAcceptModal(false)
      setSignModal(false)
      form.resetFields()
      loadOrderDetail()
    } catch (error) {
      message.error(error.message || '验收失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePayBalance = async () => {
    try {
      await ownerApi.payBalance(id)
      message.success('尾款支付成功，订单已完成')
      loadOrderDetail()
    } catch (error) {
      message.error(error.message || '支付失败')
    }
  }

  const handleReview = async (values) => {
    setLoading(true)
    try {
      await ownerApi.reviewOrder(id, values)
      message.success('评价成功，感谢您的反馈')
      setReviewModal(false)
      reviewForm.resetFields()
      loadOrderDetail()
    } catch (error) {
      message.error(error.message || '评价失败')
    } finally {
      setLoading(false)
    }
  }

  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>
  }

  const { order, negotiations = [], review, photos: orderPhotos = [], reworkRecords = [], acceptance, payments = [] } = data
  const finalPrice = order.final_price || order.budget_price
  const deposit = finalPrice * 0.3
  const balance = finalPrice * 0.7
  const currentStep = stepOrder.indexOf(order.status)

  const paymentColumns = [
    { title: '款项类型', dataIndex: 'type', key: 'type', render: t => t === 'deposit' ? '定金（30%）' : '尾款（70%）' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: a => `¥${a}` },
    { title: '支付状态', dataIndex: 'status', key: 'status', render: s => s === 'paid' ? <Tag color="success">已支付</Tag> : <Tag color="default">待支付</Tag> },
    { title: '支付时间', dataIndex: 'paid_at', key: 'paid_at' },
    { title: '交易流水号', dataIndex: 'transaction_id', key: 'transaction_id' }
  ]

  const reworkColumns = [
    { title: '返工原因', dataIndex: 'reason', key: 'reason' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '处理师傅', dataIndex: 'handler_name', key: 'handler_name' },
    { title: '处理时间', dataIndex: 'created_at', key: 'created_at' },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => s === 'resolved' ? <Tag color="success">已解决</Tag> : <Tag color="processing">处理中</Tag> }
  ]

  const serviceStandards = [
    { title: '《空调加氟SOP标准流程》', type: '操作规范' },
    { title: '《家用电器维修服务标准》', type: '行业标准' },
    { title: '《高空作业安全规范》', type: '安全规范' }
  ]

  const recommendedParts = [
    { name: '空调氟利昂 R32', model: 'R32-10kg', price: 280, quantity: 1 },
    { name: '空调过滤网', model: '通用型', price: 45, quantity: 2 },
    { name: '密封胶带', model: '3M-耐高温', price: 25, quantity: 1 }
  ]

  const timelineEvents = [
    { time: order.created_at, title: '订单创建', description: '业主发布服务需求' },
    ...negotiations.map(n => ({
      time: n.created_at,
      title: n.sender_role === 'owner' ? '业主报价' : '师傅报价',
      description: `${n.sender_name} 报价 ¥${n.price}${n.message ? `：${n.message}` : ''}`,
      color: n.status === 'accepted' ? 'green' : 'blue'
    })),
    order.status !== 'pending' && { time: order.accepted_at, title: '订单确认', description: `${order.master_name} 师傅已接单` },
    order.status === 'in_progress' && { time: order.started_at, title: '开始服务', description: '师傅已到达现场开始服务' },
    order.status === 'completed' && { time: order.completed_at, title: '服务完成', description: '师傅已完成服务，等待业主验收' },
    acceptance && { time: acceptance.accepted_at, title: '验收完成', description: `业主已验收，${acceptance.feedback || '无反馈'}` },
    order.status === 'finished' && { time: order.finished_at, title: '订单完成', description: '尾款已支付，订单圆满完成' }
  ].filter(Boolean)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} style={{ marginRight: 16 }}>
          返回
        </Button>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            订单详情 - {order.order_no}
            <Tag color={statusMap[order.status]?.color} style={{ marginLeft: 12 }}>
              {statusMap[order.status]?.text}
            </Tag>
          </Title>
        </div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 24 }}>订单进度</Title>
        <Steps current={currentStep} items={stepTitles.map(title => ({ title }))} />
      </Card>

      <Card 
        style={{ marginBottom: 24 }}
        tabList={[
          { key: 'detail', tab: '基本信息' },
          { key: 'negotiation', tab: '价格协商' },
          { key: 'payment', tab: '支付记录' },
          { key: 'photos', tab: '完工照片' },
          { key: 'rework', tab: '返工记录' },
          { key: 'standards', tab: '服务标准' },
          { key: 'parts', tab: '配件推荐' }
        ]}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 'detail' && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="订单编号">{order.order_no}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={statusMap[order.status]?.color}>
                  {statusMap[order.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="服务类型">{order.service_type}</Descriptions.Item>
              <Descriptions.Item label="服务标题">{order.title}</Descriptions.Item>
              <Descriptions.Item label="故障描述" span={2}>{order.description}</Descriptions.Item>
              <Descriptions.Item label="服务地址" span={2}>{order.address}</Descriptions.Item>
              <Descriptions.Item label="联系人">{order.contact_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{order.contact_phone}</Descriptions.Item>
              <Descriptions.Item label="期望时段">{order.expected_time || '待确认'}</Descriptions.Item>
              <Descriptions.Item label="预约时间">{order.appointment_time || '-'}</Descriptions.Item>
              <Descriptions.Item label="预算金额">¥{order.budget_price}</Descriptions.Item>
              <Descriptions.Item label="最终价格">{order.final_price ? `¥${order.final_price}` : '待确认'}</Descriptions.Item>
              <Descriptions.Item label="业主">{order.owner_name}</Descriptions.Item>
              <Descriptions.Item label="服务师傅">{order.master_name || '待指派'}</Descriptions.Item>
            </Descriptions>

            {order.service_standard && (
              <Alert 
                type="info" 
                message={`关联服务标准：${order.service_standard}`}
                description="师傅将按照此标准流程进行服务，请监督执行"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            {order.is_high_risk && (
              <Alert 
                type="warning" 
                message="高危作业提醒"
                description="此服务涉及高空/水电改造等高危作业，师傅已上传相关资质，请注意施工安全"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            <Divider orientation="left">故障照片</Divider>
            {photos.length > 0 ? (
              <Image.PreviewGroup>
                <Row gutter={16}>
                  {photos.map((photo, index) => (
                    <Col span={6} key={index}>
                      <Image 
                        width="100%" 
                        height={150} 
                        src={photo} 
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                    </Col>
                  ))}
                </Row>
              </Image.PreviewGroup>
            ) : (
              <Empty description="暂无故障照片" />
            )}

            <Divider orientation="left">订单操作</Divider>
            <Space wrap>
              {order.status === 'pending' && (
                <Button type="primary" onClick={() => setAssignModal(true)}>指派师傅</Button>
              )}
              {order.status === 'negotiating' && (
                <Button onClick={() => setNegotiateModal(true)}>发送报价</Button>
              )}
              {order.status === 'accepted' && !order.deposit_paid && (
                <Button type="primary" icon={<DollarOutlined />} onClick={handlePayDeposit}>
                  支付定金 (¥{deposit.toFixed(2)})
                </Button>
              )}
              {order.status === 'completed' && (
                <Button type="primary" onClick={() => setSignModal(true)}>完工验收（电子签名）</Button>
              )}
              {order.status === 'accepted_with_signature' && !order.balance_paid && (
                <Button type="primary" icon={<DollarOutlined />} onClick={handlePayBalance}>
                  支付尾款 (¥{balance.toFixed(2)})
                </Button>
              )}
              {order.status === 'finished' && !review && (
                <Button type="primary" onClick={() => setReviewModal(true)}>评价服务</Button>
              )}
            </Space>
          </>
        )}

        {activeTab === 'negotiation' && (
          <div>
            {negotiations.length === 0 ? (
              <Empty description="暂无协商记录" />
            ) : (
              <Timeline
                items={negotiations.map((item, index) => ({
                  color: item.status === 'accepted' ? 'green' : item.sender_role === 'owner' ? 'blue' : 'orange',
                  children: (
                    <Card size="small" style={{ marginBottom: 12 }}>
                      <Space style={{ marginBottom: 8 }}>
                        <Avatar icon={<UserOutlined />} />
                        <Text strong>{item.sender_name}</Text>
                        <Tag color={item.sender_role === 'owner' ? 'blue' : 'green'}>
                          {item.sender_role === 'owner' ? '业主' : '师傅'}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.created_at}</Text>
                      </Space>
                      <Row gutter={16} align="middle">
                        <Col span={12}>
                          <Space>
                            <DollarOutlined style={{ color: '#fa8c16' }} />
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fa8c16' }}>
                              ¥{item.price}
                            </Text>
                            {item.status === 'accepted' && <Tag color="success">已接受</Tag>}
                            {item.status === 'rejected' && <Tag color="error">已拒绝</Tag>}
                          </Space>
                        </Col>
                        <Col span={12} style={{ textAlign: 'right' }}>
                          {order.status === 'negotiating' && item.sender_role === 'master' && item.status === 'pending' && (
                            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleAcceptPrice(item.id)}>
                              接受此报价
                            </Button>
                          )}
                        </Col>
                      </Row>
                      {item.message && (
                        <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>{item.message}</Paragraph>
                      )}
                    </Card>
                  )
                }))}
              />
            )}
            {order.status === 'negotiating' && (
              <Button type="dashed" block onClick={() => setNegotiateModal(true)}>
                发送新报价
              </Button>
            )}
          </div>
        )}

        {activeTab === 'payment' && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Card>
                  <Statistic title="订单总额" value={finalPrice} precision={2} prefix="¥" />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic 
                    title="定金（30%）" 
                    value={deposit} 
                    precision={2} 
                    prefix="¥" 
                    valueStyle={{ color: order.deposit_paid ? '#52c41a' : '#fa8c16' }}
                  />
                  <Progress percent={order.deposit_paid ? 100 : 0} status={order.deposit_paid ? 'success' : 'active'} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic 
                    title="尾款（70%）" 
                    value={balance} 
                    precision={2} 
                    prefix="¥" 
                    valueStyle={{ color: order.balance_paid ? '#52c41a' : '#fa8c16' }}
                  />
                  <Progress percent={order.balance_paid ? 100 : 0} status={order.balance_paid ? 'success' : 'active'} />
                </Card>
              </Col>
            </Row>
            <Table 
              columns={paymentColumns} 
              dataSource={[
                { type: 'deposit', amount: deposit, status: order.deposit_paid ? 'paid' : 'pending', paid_at: order.deposit_paid_at, transaction_id: 'TX' + order.id + 'DEP' },
                { type: 'balance', amount: balance, status: order.balance_paid ? 'paid' : 'pending', paid_at: order.balance_paid_at, transaction_id: 'TX' + order.id + 'BAL' }
              ]} 
              pagination={false}
              rowKey="type"
            />
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
            <Alert 
              type="info" 
              message="完工照片" 
              description="师傅服务完成后上传的现场照片，用于服务质量追溯"
              showIcon
              style={{ marginBottom: 16 }}
            />
            {orderPhotos && orderPhotos.length > 0 ? (
              <Image.PreviewGroup>
                <Row gutter={16}>
                  {orderPhotos.map((photo, index) => (
                    <Col span={6} key={index}>
                      <Image 
                        width="100%" 
                        height={150} 
                        src={photo.url || photo} 
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                      <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#666' }}>
                        {photo.description || `完工照片 ${index + 1}`}
                      </div>
                    </Col>
                  ))}
                </Row>
              </Image.PreviewGroup>
            ) : (
              <Empty description="师傅尚未上传完工照片" />
            )}
          </div>
        )}

        {activeTab === 'rework' && (
          <div>
            {reworkRecords.length > 0 ? (
              <>
                <Alert 
                  type="warning" 
                  message={`订单存在 ${reworkRecords.length} 条返工记录`}
                  description="请仔细查看返工原因和处理结果，作为服务质量评价参考"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table 
                  columns={reworkColumns} 
                  dataSource={reworkRecords} 
                  pagination={false}
                  rowKey="id"
                />
              </>
            ) : (
              <Empty description="该订单无返工记录，服务质量良好" />
            )}
          </div>
        )}

        {activeTab === 'standards' && (
          <div>
            <Alert 
              type="info" 
              message="服务标准库" 
              description="以下为本次服务关联的标准流程，师傅需严格按照规范作业"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <List
              dataSource={serviceStandards}
              renderItem={(item) => (
                <List.Item
                  actions={[<Button type="link" size="small">查看详情</Button>]}
                >
                  <List.Item.Meta
                    avatar={<SafetyCertificateOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={item.title}
                    description={<Tag color="blue">{item.type}</Tag>}
                  />
                </List.Item>
              )}
            />
          </div>
        )}

        {activeTab === 'parts' && (
          <div>
            <Alert 
              type="info" 
              message="配件智能推荐" 
              description="根据故障类型自动匹配的适配配件，如需更换可直接选购"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table 
              columns={[
                { title: '配件名称', dataIndex: 'name', key: 'name', icon: <ShoppingOutlined /> },
                { title: '适配型号', dataIndex: 'model', key: 'model' },
                { title: '建议数量', dataIndex: 'quantity', key: 'quantity' },
                { title: '参考单价', dataIndex: 'price', key: 'price', render: p => `¥${p}` }
              ]} 
              dataSource={recommendedParts} 
              pagination={false}
              rowKey="name"
            />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Text type="secondary">合计：¥{recommendedParts.reduce((sum, p) => sum + p.price * p.quantity, 0)}</Text>
            </div>
          </div>
        )}
      </Card>

      {acceptance && (
        <Card title="验收凭证" style={{ marginBottom: 24 }}>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="验收状态">
              <Tag color="success">已验收</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="验收时间">{acceptance.accepted_at}</Descriptions.Item>
            <Descriptions.Item label="验收人">{acceptance.accepted_by}</Descriptions.Item>
            <Descriptions.Item label="验收反馈">{acceptance.feedback || '无'}</Descriptions.Item>
            <Descriptions.Item label="问题反馈">{acceptance.issues || '无'}</Descriptions.Item>
            <Descriptions.Item label="电子签名">
              {acceptance.signature ? (
                <img src={acceptance.signature} alt="签名" style={{ maxWidth: 200, maxHeight: 80, border: '1px solid #eee' }} />
              ) : '已签名'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {review && (
        <Card title="服务评价" style={{ marginBottom: 24 }}>
          <Descriptions column={1}>
            <Descriptions.Item label="综合评分">
              <Rate disabled value={review.rating} />
              <span style={{ marginLeft: 8, color: '#faad14', fontWeight: 'bold' }}>{review.rating}分</span>
            </Descriptions.Item>
            <Descriptions.Item label="服务态度">
              <Rate disabled value={review.attitude_rating || review.rating} />
            </Descriptions.Item>
            <Descriptions.Item label="专业水平">
              <Rate disabled value={review.skill_rating || review.rating} />
            </Descriptions.Item>
            <Descriptions.Item label="准时性">
              <Rate disabled value={review.punctuality_rating || review.rating} />
            </Descriptions.Item>
            <Descriptions.Item label="评价内容">{review.content || '无'}</Descriptions.Item>
            <Descriptions.Item label="评价时间">{review.created_at}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="订单时间线">
        <Timeline
          items={timelineEvents.map(event => ({
            color: event.color,
            children: (
              <div>
                <Text strong>{event.title}</Text>
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{event.time}</Text>
                <div style={{ marginTop: 4 }}>{event.description}</div>
              </div>
            )
          }))}
        />
      </Card>

      <Modal title="指派师傅" open={assignModal} onCancel={() => setAssignModal(false)} footer={null} width={600}>
        <Form form={form} onFinish={handleAssignMaster}>
          <Form.Item name="master_id" label="选择师傅" rules={[{ required: true, message: '请选择师傅' }]}>
            <Select placeholder="请选择服务师傅">
              {masters.map(m => (
                <Select.Option key={m.id} value={m.id}>
                  {m.name} - {m.area} - 评分:{m.rating} - 完成{m.completed_orders}单
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>确认指派</Button>
              <Button onClick={() => setAssignModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="发送报价" open={negotiateModal} onCancel={() => setNegotiateModal(false)} footer={null}>
        <Form form={negotiateForm} onFinish={handleNegotiate}>
          <Form.Item name="price" label="报价金额（元）" rules={[{ required: true, message: '请输入报价金额' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入报价金额" />
          </Form.Item>
          <Form.Item name="message" label="备注说明">
            <Input.TextArea rows={3} placeholder="请输入报价说明（可选），例如：包含配件费、上门费等" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>发送报价</Button>
              <Button onClick={() => setNegotiateModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal 
        title={<><FileTextOutlined /> 完工验收 - 电子签名</>}
        open={signModal} 
        onCancel={() => { setSignModal(false); clearCanvas() }} 
        footer={null}
        width={600}
        destroyOnClose
      >
        <Alert 
          type="info" 
          message="请确认服务已完成"
          description="请仔细检查师傅的服务质量，确认无误后在下方签名区域手写签名完成验收"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={form} onFinish={handleAcceptOrder}>
          <Form.Item label="问题反馈">
            <Form.Item name="has_issues" noStyle>
              <Select defaultValue="no">
                <Select.Option value="no">服务正常，无问题</Select.Option>
                <Select.Option value="yes">存在问题，需反馈</Select.Option>
              </Select>
            </Form.Item>
          </Form.Item>
          <Form.Item name="feedback" label="验收反馈">
            <Input.TextArea rows={3} placeholder="请输入验收意见，服务满意或需要改进的地方" />
          </Form.Item>
          <Form.Item label="电子签名" required>
            <div style={{ 
              border: '2px dashed #d9d9d9', 
              borderRadius: 8, 
              padding: 8,
              background: '#fafafa'
            }}>
              <canvas
                ref={canvasRef}
                width={520}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{ 
                  cursor: 'crosshair',
                  display: 'block',
                  background: '#fff'
                }}
              />
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Button size="small" onClick={clearCanvas}>清除签名</Button>
              </div>
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>请在上方区域手写您的签名，签名将作为验收凭证永久保存</Text>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>确认验收并签名</Button>
              <Button onClick={() => { setSignModal(false); clearCanvas() }}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="服务评价" open={reviewModal} onCancel={() => setReviewModal(false)} footer={null}>
        <Form form={reviewForm} onFinish={handleReview}>
          <Form.Item name="rating" label="综合评分" rules={[{ required: true, message: '请评分' }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="attitude_rating" label="服务态度">
            <Rate />
          </Form.Item>
          <Form.Item name="skill_rating" label="专业水平">
            <Rate />
          </Form.Item>
          <Form.Item name="punctuality_rating" label="准时性">
            <Rate />
          </Form.Item>
          <Form.Item name="content" label="评价内容">
            <Input.TextArea rows={4} placeholder="请分享您的服务体验，帮助其他业主选择优质师傅" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>提交评价</Button>
              <Button onClick={() => setReviewModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OrderDetail
