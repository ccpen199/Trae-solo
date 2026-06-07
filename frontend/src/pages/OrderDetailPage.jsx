import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, Typography, Spin, Modal, Input, message, Alert, Steps, Avatar, Divider, Statistic, Row, Col, Timeline, List } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  SafetyCertificateOutlined,
  MessageOutlined,
  DollarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CustomerServiceOutlined,
  AuditOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import request from '../utils/request'
import { getUserRole } from '../utils/auth'

const { TextArea } = Input
const { Title, Text } = Typography

const statusMap = {
  applied: { color: 'blue', text: '已申请' },
  accepted: { color: 'cyan', text: '已接受' },
  working: { color: 'green', text: '工作中' },
  completed: { color: 'success', text: '已完成' },
  disputed: { color: 'red', text: '争议中' },
  cancelled: { color: 'volcano', text: '已取消' }
}

const getStepStatus = (status) => {
  switch (status) {
    case 'applied': return 1
    case 'accepted': return 2
    case 'working': return 3
    case 'completed': return 4
    case 'disputed': return 5
    default: return 0
  }
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [disputeModalOpen, setDisputeModalOpen] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [guaranteeModalOpen, setGuaranteeModalOpen] = useState(false)
  const [guaranteeReason, setGuaranteeReason] = useState('')
  const [taxVoucherOpen, setTaxVoucherOpen] = useState(false)
  const role = getUserRole()

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const res = await request.get(`/orders/${id}`)
      setOrder(res.data || res)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

  const handleAccept = async () => {
    try {
      await request.put(`/orders/${id}/accept`)
      message.success('已接受申请')
      fetchOrder()
    } catch (e) {
    }
  }

  const handleConfirmCompletion = async () => {
    try {
      await request.put(`/orders/${id}/confirm`)
      message.success('已确认完成，T+0结算已自动触发')
      fetchOrder()
    } catch (e) {
    }
  }

  const handleCheckIn = async () => {
    setCheckInLoading(true)
    try {
      let location = null
      if (navigator.geolocation) {
        location = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null)
          )
        })
      }
      await request.put(`/orders/${id}/checkin`, { location })
      message.success('签到成功')
      fetchOrder()
    } catch (e) {
    } finally {
      setCheckInLoading(false)
    }
  }

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      message.warning('请填写争议原因')
      return
    }
    try {
      await request.post(`/orders/${id}/dispute`, { reason: disputeReason })
      message.success('争议已提交，平台将在24小时内安排专属客服介入仲裁')
      setDisputeModalOpen(false)
      setDisputeReason('')
      fetchOrder()
    } catch (e) {
    }
  }

  const handleGuarantee = async () => {
    if (!guaranteeReason.trim()) {
      message.warning('请填写申请原因')
      return
    }
    try {
      await request.post('/guarantees', { order_id: parseInt(id), reason: guaranteeReason, type: 'advance_compensation' })
      message.success('保障申请已提交，专属客服将在24小时内介入')
      setGuaranteeModalOpen(false)
      setGuaranteeReason('')
      fetchOrder()
    } catch (e) {
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
  if (!order) return <div>订单不存在</div>

  const status = statusMap[order.status] || { color: 'default', text: order.status }
  const settlement = order.settlement
  const isSettled = settlement && settlement.status === 'completed'

  const formatTime = (t) => {
    if (!t) return '-'
    return new Date(t).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const buildTimeline = () => {
    const items = []
    items.push({ color: 'blue', children: <><Text strong>提交申请</Text><br /><Text type="secondary">{formatTime(order.created_at)}</Text></> })
    if (order.status === 'accepted' || order.status === 'working' || order.status === 'completed' || order.status === 'disputed') {
      items.push({ color: 'cyan', children: <><Text strong>雇主接受</Text><br /><Text type="secondary">雇主已确认接受申请</Text></> })
    }
    if (order.check_in_time) {
      items.push({ color: 'green', children: <><Text strong>地理围栏签到</Text><br /><Text type="secondary">{formatTime(order.check_in_time)} · {order.check_in_geofence ? '围栏验证通过' : '围栏验证未通过'}</Text></> })
    }
    if (order.employer_confirm_time) {
      items.push({ color: 'success', children: <><Text strong>雇主确认完工</Text><br /><Text type="secondary">{formatTime(order.employer_confirm_time)} · 雇主一键确认，自动触发T+0结算</Text></> })
    }
    if (isSettled) {
      items.push({ color: 'gold', children: <><Text strong>T+0结算完成</Text><br /><Text type="secondary">流水号: {settlement.transaction_id}<br />实际到账: {settlement.actual_amount}元 · {formatTime(settlement.completed_at)}</Text></> })
    }
    if (order.dispute_status && order.dispute_status !== 'none') {
      items.push({ color: 'red', children: <><Text strong>发起争议仲裁</Text><br /><Text type="secondary">原因: {order.dispute_reason || '-'}</Text></> })
    }
    return items
  }

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>
            订单详情 #{order.id}
          </Title>
          <Tag color={status.color} style={{ fontSize: 14, padding: '4px 12px' }}>
            {status.text}
          </Tag>
        </div>

        <Steps current={getStepStatus(order.status)} size="small" style={{ marginBottom: 24 }}>
          <Steps.Step title="申请" />
          <Steps.Step title="已接受" />
          <Steps.Step title="工作中" />
          <Steps.Step title="已完成" />
          <Steps.Step title="结算完成" />
        </Steps>

        <Descriptions bordered column={{ xs: 1, sm: 2 }} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="岗位名称">
            {order.job_title || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="时薪">
            {order.hourly_wage ? `${order.hourly_wage}元/时` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label={role === 'employer' ? '求职者' : '雇主'}>
            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              {role === 'employer'
                ? (order.worker_name || '-')
                : (order.employer_name || '-')
              }
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="工作地点">
            <EnvironmentOutlined /> {order.work_location || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="工作时间">
            <ClockCircleOutlined /> {order.work_time || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {formatTime(order.created_at)}
          </Descriptions.Item>
        </Descriptions>

        <Card title={<><ClockCircleOutlined /> 订单时间线</>} type="inner" style={{ marginBottom: 24 }}>
          <Timeline items={buildTimeline()} />
        </Card>

        {order.check_in_time && (
          <Card title={<><EnvironmentOutlined /> 签到信息</>} type="inner" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="签到时间" value={formatTime(order.check_in_time)} valueStyle={{ fontSize: 14 }} />
              </Col>
              <Col span={8}>
                <Statistic
                  title="签到位置"
                  value={order.check_in_lat && order.check_in_lng ? `${order.check_in_lat.toFixed(4)}, ${order.check_in_lng.toFixed(4)}` : '-'}
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="地理围栏验证"
                  value={order.check_in_geofence ? '已通过' : '未通过'}
                  valueStyle={{ color: order.check_in_geofence ? '#3f8600' : '#cf1322', fontSize: 14 }}
                />
              </Col>
            </Row>
          </Card>
        )}

        {order.employer_confirm_time && (
          <Card title={<><CheckCircleOutlined /> 雇主确认记录</>} type="inner" style={{ marginBottom: 24 }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="确认时间">
                {formatTime(order.employer_confirm_time)}
              </Descriptions.Item>
              <Descriptions.Item label="确认人">
                <Space><Avatar size="small" icon={<UserOutlined />} />{order.employer_name || '雇主'}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="确认操作">
                <Tag color="green">一键确认完工</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="结算触发">
                <Tag color="blue">T+0即时结算已自动触发</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {settlement && (
          <Card title={<><DollarOutlined /> 结算信息</>} type="inner" style={{ marginBottom: 24 }}>
            <Alert
              message={isSettled ? 'T+0 结算已完成' : 'T+0 结算处理中'}
              description={isSettled
                ? `结算已通过斗米T+0即时通道完成，流水号: ${settlement.transaction_id}`
                : '结算正在处理中，预计即时到账'
              }
              type={isSettled ? 'success' : 'warning'}
              showIcon
              icon={<DollarOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Descriptions column={4} bordered size="small">
              <Descriptions.Item label="结算金额">
                <Text strong>{settlement.amount}元</Text>
              </Descriptions.Item>
              <Descriptions.Item label="平台服务费(5%)">
                <Text type="danger">-{settlement.fee}元</Text>
              </Descriptions.Item>
              <Descriptions.Item label="代扣个税(3%)">
                <Text type="danger">-{settlement.tax}元</Text>
              </Descriptions.Item>
              <Descriptions.Item label="实际到账">
                <Text type="success" strong style={{ fontSize: 16 }}>{settlement.actual_amount}元</Text>
              </Descriptions.Item>
              <Descriptions.Item label="结算状态">
                <Tag color={isSettled ? 'green' : 'orange'}>
                  {isSettled ? '已完成' : '处理中'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="结算通道">
                <Tag color="blue">{settlement.channel === 'T0' ? 'T+0 即时到账' : settlement.channel}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="交易流水号">
                {settlement.transaction_id ? (
                  <Text copyable style={{ fontSize: 12 }}>{settlement.transaction_id}</Text>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {formatTime(settlement.completed_at)}
              </Descriptions.Item>
            </Descriptions>
            {isSettled && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Space>
                  <Button
                    type="primary"
                    ghost
                    icon={<FileTextOutlined />}
                    onClick={() => setTaxVoucherOpen(true)}
                  >
                    查看税务代缴凭证
                  </Button>
                  <Button icon={<DollarOutlined />}>
                    下载结算明细
                  </Button>
                </Space>
              </div>
            )}
          </Card>
        )}

        {(order.arbitrate_records && order.arbitrate_records.length > 0) && (
          <Card title={<><AuditOutlined /> 争议仲裁记录</>} type="inner" style={{ marginBottom: 24 }}>
            <List
              dataSource={order.arbitrate_records}
              renderItem={(record) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<CustomerServiceOutlined />} style={{ backgroundColor: record.status === 'resolved' ? '#52c41a' : '#faad14' }} />}
                    title={
                      <Space>
                        <Tag color={record.status === 'resolved' ? 'green' : record.status === 'pending' ? 'orange' : 'blue'}>
                          {record.status === 'resolved' ? '已解决' : record.status === 'pending' ? '待处理' : '处理中'}
                        </Tag>
                        <Text strong>仲裁#{record.id}</Text>
                      </Space>
                    }
                    description={
                      <div>
                        <div><Text type="secondary">申请人: {record.plaintiff_name} → 被申请人: {record.defendant_name}</Text></div>
                        <div><Text>原因: {record.reason}</Text></div>
                        <div style={{ marginTop: 8 }}>
                          <Timeline
                            items={[
                              { color: 'blue', children: <><Text strong>提交仲裁</Text><br /><Text type="secondary">{formatTime(record.created_at)}</Text></> },
                              { color: 'gold', children: <><Text strong>专属客服介入</Text><br /><Text type="secondary">平台已分配专属客服审核双方证据</Text></> },
                              record.status === 'resolved'
                                ? { color: 'green', children: <><Text strong>仲裁完成</Text><br /><Text type="secondary">结果: {record.result || '已调解'} · {formatTime(record.resolved_at)}</Text></> }
                                : { color: 'orange', children: <><Text strong>仲裁处理中</Text><br /><Text type="secondary">预计24小时内完成</Text></> }
                            ]}
                          />
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {(order.guarantees && order.guarantees.length > 0) && (
          <Card title={<><SafetyCertificateOutlined /> 自营保障记录</>} type="inner" style={{ marginBottom: 24 }}>
            <List
              dataSource={order.guarantees}
              renderItem={(g) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<ThunderboltOutlined />} style={{ backgroundColor: g.status === 'resolved' ? '#52c41a' : '#faad14' }} />}
                    title={
                      <Space>
                        <Tag color={g.status === 'resolved' ? 'green' : g.status === 'active' ? 'blue' : 'orange'}>
                          {g.status === 'resolved' ? '已赔付' : g.status === 'active' ? '处理中' : '已关闭'}
                        </Tag>
                        <Text strong>{g.type === 'advance_compensation' ? '先行赔付' : '自营保障'}</Text>
                      </Space>
                    }
                    description={
                      <div>
                        <div><Text type="secondary">原因: {g.reason}</Text></div>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary">
                            先行赔付规则: 雇主逾期未确认或争议判定兼职者胜诉时，平台先行垫付工资
                          </Text>
                        </div>
                        {g.compensation_amount && (
                          <div style={{ marginTop: 4 }}>
                            <Tag color="green">赔付金额: {g.compensation_amount}元</Tag>
                          </div>
                        )}
                        {g.result && <div style={{ marginTop: 4 }}><Text>处理结果: {g.result}</Text></div>}
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary">申请时间: {formatTime(g.created_at)}</Text>
                          {g.resolved_at && <Text type="secondary"> · 处理时间: {formatTime(g.resolved_at)}</Text>}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        <Divider>操作区</Divider>

        <Space wrap size="middle">
          {role === 'employer' && order.status === 'applied' && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleAccept}>
              接受申请
            </Button>
          )}
          {role === 'employer' && order.status === 'working' && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleConfirmCompletion}>
              一键确认完工（触发T+0结算）
            </Button>
          )}
          {role === 'worker' && order.status === 'accepted' && (
            <Button icon={<EnvironmentOutlined />} loading={checkInLoading} onClick={handleCheckIn}>
              地理围栏签到
            </Button>
          )}
          {role === 'worker' && order.status === 'working' && (
            <Button icon={<EnvironmentOutlined />} loading={checkInLoading} onClick={handleCheckIn}>
              重新签到
            </Button>
          )}
          {(order.status === 'working' || order.status === 'completed') && order.dispute_status === 'none' && (
            <>
              <Button danger icon={<FlagOutlined />} onClick={() => setDisputeModalOpen(true)}>
                发起争议仲裁
              </Button>
              <Button icon={<SafetyCertificateOutlined />} onClick={() => setGuaranteeModalOpen(true)}>
                申请自营保障
              </Button>
            </>
          )}
          <Button onClick={() => navigate('/orders')}>返回列表</Button>
        </Space>
      </Card>

      <Modal
        title="查看税务代缴凭证"
        open={taxVoucherOpen}
        onCancel={() => setTaxVoucherOpen(false)}
        footer={[
          <Button key="download" type="primary" icon={<FileTextOutlined />}>下载PDF凭证</Button>,
          <Button key="close" onClick={() => setTaxVoucherOpen(false)}>关闭</Button>
        ]}
        width={600}
      >
        {settlement && (
          <Card size="small" style={{ border: '2px solid #1890ff', borderRadius: 8 }}>
            <div style={{ textAlign: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e8e8e8' }}>
              <Title level={4} style={{ margin: 0 }}>个人所得税代扣代缴凭证</Title>
              <Text type="secondary">国家税务总局电子凭证</Text>
            </div>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="凭证编号" span={2}>
                <Text copyable>TAX-{settlement.transaction_id?.substring(0, 8) || 'N/A'}-{new Date(settlement.completed_at || Date.now()).getFullYear()}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="纳税人">兼职者</Descriptions.Item>
              <Descriptions.Item label="所得项目">劳务报酬所得</Descriptions.Item>
              <Descriptions.Item label="收入额">{settlement.amount}元</Descriptions.Item>
              <Descriptions.Item label="应纳税额">{settlement.tax}元</Descriptions.Item>
              <Descriptions.Item label="代扣代缴单位" span={2}>斗米兼职平台（代扣代缴义务人）</Descriptions.Item>
              <Descriptions.Item label="税款所属期">{formatTime(settlement.completed_at).split(' ')[0] || '-'}</Descriptions.Item>
              <Descriptions.Item label="入库时间">{formatTime(settlement.completed_at)}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Text type="secondary">本凭证由系统自动生成，与纸质凭证具有同等效力</Text>
            </div>
          </Card>
        )}
      </Modal>

      <Modal
        title="发起争议仲裁"
        open={disputeModalOpen}
        onOk={handleDispute}
        onCancel={() => setDisputeModalOpen(false)}
        okText="提交"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="争议仲裁流程"
          description={
            <Timeline
              items={[
                { color: 'blue', children: '提交争议申请' },
                { color: 'gold', children: '专属客服24小时内介入' },
                { color: 'cyan', children: '审核双方证据材料' },
                { color: 'green', children: '中立仲裁并出具结果' }
              ]}
            />
          }
          type="warning"
          style={{ marginBottom: 16 }}
        />
        <TextArea
          rows={4}
          placeholder="请详细描述争议原因，以便专属客服快速介入处理"
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
        />
      </Modal>

      <Modal
        title="申请斗米自营保障"
        open={guaranteeModalOpen}
        onOk={handleGuarantee}
        onCancel={() => setGuaranteeModalOpen(false)}
        okText="提交申请"
        cancelText="取消"
      >
        <Alert
          message="先行赔付规则"
          description={
            <Timeline
              items={[
                { color: 'blue', children: <><Text strong>申请保障</Text><br />提交保障申请和问题描述</> },
                { color: 'gold', children: <><Text strong>专属客服介入</Text><br />24小时内分配专属客服审核</> },
                { color: 'cyan', children: <><Text strong>规则命中判定</Text><br />雇主逾期未确认或争议判定兼职者胜诉</> },
                { color: 'green', children: <><Text strong>先行赔付</Text><br />平台先行垫付工资至兼职者账户</> }
              ]}
            />
          }
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <TextArea
          rows={4}
          placeholder="请描述您遇到的问题"
          value={guaranteeReason}
          onChange={(e) => setGuaranteeReason(e.target.value)}
        />
      </Modal>
    </div>
  )
}
