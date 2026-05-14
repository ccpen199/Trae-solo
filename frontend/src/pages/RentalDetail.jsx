import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Spin, 
  Result,
  Descriptions,
  Tag,
  Modal,
  InputNumber,
  Select,
  DatePicker,
  Input,
  message,
  Space,
  Image,
  Divider,
  Statistic
} from 'antd'
import { 
  ReloadOutlined, 
  ArrowLeftOutlined,
  RollbackOutlined,
  ShareAltOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../utils/request'

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const RentalDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [rental, setRental] = useState(null)
  const [renewModalVisible, setRenewModalVisible] = useState(false)
  const [returnModalVisible, setReturnModalVisible] = useState(false)
  const [subletModalVisible, setSubletModalVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [renewDays, setRenewDays] = useState(7)
  const [renewMethod, setRenewMethod] = useState('one_time')
  const [subletForm, setSubletForm] = useState({
    start_date: null,
    end_date: null,
    price: 0,
    description: ''
  })

  const statusMap = {
    pending: { text: '待支付', color: 'orange' },
    active: { text: '租借中', color: 'green' },
    completed: { text: '已完成', color: 'blue' },
    cancelled: { text: '已取消', color: 'default' },
    sublet: { text: '已转租', color: 'purple' }
  }

  const loadData = async () => {
    if (!id) return
    
    setLoading(true)
    setError(false)
    try {
      const res = await request.get(`/rental/${id}`)
      setRental(res.data)
    } catch (err) {
      console.error('Load rental detail error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleRenew = async () => {
    if (renewDays <= 0) {
      message.warning('请选择续租天数')
      return
    }

    setSubmitting(true)
    try {
      const res = await request.post(`/rental/renew/${id}`, {
        extend_days: renewDays,
        payment_method: renewMethod
      })
      message.success('续租成功')
      setRenewModalVisible(false)
      loadData()
    } catch (err) {
      console.error('Renew error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReturn = async () => {
    Modal.confirm({
      title: '确认退租',
      content: '确认要退租吗？提前退租可能会产生违约金。',
      okText: '确认退租',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setSubmitting(true)
        try {
          const res = await request.post(`/rental/return/${id}`)
          message.success('退租成功')
          setReturnModalVisible(false)
          loadData()
          if (res.data) {
            Modal.success({
              title: '退租成功',
              content: (
                <div>
                  <p>剩余租金退还: ¥{res.data.rent_refund?.toFixed(2) || '0.00'}</p>
                  <p>押金退还: ¥{res.data.deposit_refund?.toFixed(2) || '0.00'}</p>
                  {res.data.penalty > 0 && (
                    <p>违约金: ¥{res.data.penalty?.toFixed(2) || '0.00'}</p>
                  )}
                  <p><strong>总计退还: ¥{res.data.total_refund?.toFixed(2) || '0.00'}</strong></p>
                  <p>实际使用天数: {res.data.actual_days}天 / {res.data.total_days}天</p>
                </div>
              )
            })
          }
        } catch (err) {
          console.error('Return error:', err)
        } finally {
          setSubmitting(false)
        }
      }
    })
  }

  const handleSublet = async () => {
    if (!subletForm.start_date || !subletForm.end_date || !subletForm.price) {
      message.warning('请填写完整转租信息')
      return
    }

    setSubmitting(true)
    try {
      const res = await request.post('/rental/sublet/create', {
        rental_id: id,
        start_date: subletForm.start_date.format('YYYY-MM-DD'),
        end_date: subletForm.end_date.format('YYYY-MM-DD'),
        price: subletForm.price,
        description: subletForm.description
      })
      message.success('转租信息发布成功')
      setSubletModalVisible(false)
    } catch (err) {
      console.error('Sublet error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="租借详情加载失败，请点击重试"
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/rentals')}>
              返回列表
            </Button>
            <Button type="primary" onClick={loadData}>
              重新加载
            </Button>
          </Space>
        }
      />
    )
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!rental) {
    return (
      <Result
        status="404"
        title="租借记录不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/rentals')}>
            返回列表
          </Button>
        }
      />
    )
  }

  const firstImage = rental.appliance_images?.[0] || 'https://placehold.co/200x200'
  const statusInfo = statusMap[rental.status] || { text: '未知', color: 'default' }
  const isActive = rental.status === 'active'

  const today = dayjs().startOf('day')
  const endDate = dayjs(rental.end_date).startOf('day')
  const startDate = dayjs(rental.start_date).startOf('day')
  const totalDays = endDate.diff(startDate, 'day') + 1
  const actualDays = Math.max(1, Math.min(today.diff(startDate, 'day') + 1, totalDays))
  const remainingDays = Math.max(0, endDate.diff(today, 'day'))

  const totalRent = totalDays * rental.daily_rent
  const usedRent = actualDays * rental.daily_rent
  const remainingRent = Math.max(0, totalRent - usedRent)

  const calculatePenalty = () => {
    if (!isActive) return 0
    if (today.isBefore(endDate)) {
      return Math.min(remainingDays * rental.daily_rent * 0.3, rental.deposit * 0.5)
    }
    return 0
  }

  const penalty = calculatePenalty()
  const totalRefund = remainingRent + (rental.deposit - penalty)

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        style={{ marginBottom: 16 }}
        onClick={() => navigate('/rentals')}
      >
        返回列表
      </Button>

      <Card>
        <Row gutter={24}>
          <Col xs={24} md={6}>
            <Image
              width="100%"
              src={firstImage}
              style={{ borderRadius: 8 }}
              preview={false}
            />
          </Col>
          <Col xs={24} md={18}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Title level={3} style={{ marginBottom: 8 }}>
                  {rental.appliance_name}
                  <Tag color={statusInfo.color} style={{ marginLeft: 8 }}>
                    {statusInfo.text}
                  </Tag>
                </Title>
                <Text type="secondary">
                  订单号: {rental.id}
                </Text>
              </div>
            </div>

            <Divider />

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={8}>
                <Statistic 
                  title="剩余天数" 
                  value={rental.remaining_days || 0} 
                  suffix="天"
                  valueStyle={{ color: isActive ? '#52c41a' : '#999' }}
                />
              </Col>
              <Col xs={12} sm={8}>
                <Statistic 
                  title="总租期" 
                  value={rental.total_days || 0} 
                  suffix="天"
                />
              </Col>
              <Col xs={12} sm={8}>
                <Statistic 
                  title="支付金额" 
                  value={rental.total_amount} 
                  prefix="¥"
                  precision={2}
                />
              </Col>
            </Row>

            <Descriptions column={2} size="small">
              <Descriptions.Item label="开始日期">
                {rental.start_date}
              </Descriptions.Item>
              <Descriptions.Item label="结束日期">
                {rental.end_date}
              </Descriptions.Item>
              <Descriptions.Item label="日租金">
                ¥{rental.daily_rent}/天
              </Descriptions.Item>
              <Descriptions.Item label="押金">
                ¥{rental.deposit}
              </Descriptions.Item>
              <Descriptions.Item label="支付方式">
                {rental.payment_method === 'one_time' ? '一次性付清' : '月付'}
              </Descriptions.Item>
              <Descriptions.Item label="下单时间">
                {rental.created_at}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {isActive && (
        <Card title="操作" style={{ marginTop: 24 }}>
          <Space wrap>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => setRenewModalVisible(true)}
            >
              续租
            </Button>
            <Button
              icon={<RollbackOutlined />}
              onClick={() => setReturnModalVisible(true)}
              danger
            >
              退租
            </Button>
            <Button
              icon={<ShareAltOutlined />}
              onClick={() => setSubletModalVisible(true)}
            >
              转租
            </Button>
          </Space>
        </Card>
      )}

      <Modal
        title="续租"
        open={renewModalVisible}
        onOk={handleRenew}
        onCancel={() => setRenewModalVisible(false)}
        confirmLoading={submitting}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            选择续租天数 (当前结束日期: {rental.end_date})
          </Text>
          <Select
            value={renewDays}
            onChange={setRenewDays}
            style={{ width: '100%' }}
            size="large"
          >
            <Option value={7}>7天 (¥{(7 * rental.daily_rent).toFixed(2)})</Option>
            <Option value={14}>14天 (¥{(14 * rental.daily_rent).toFixed(2)})</Option>
            <Option value={30}>30天 (¥{(30 * rental.daily_rent).toFixed(2)})</Option>
            <Option value={60}>60天 (¥{(60 * rental.daily_rent).toFixed(2)})</Option>
          </Select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            支付方式
          </Text>
          <Select
            value={renewMethod}
            onChange={setRenewMethod}
            style={{ width: '100%' }}
            size="large"
          >
            <Option value="one_time">一次性付清</Option>
            <Option value="monthly" disabled>月付 (开发中)</Option>
          </Select>
        </div>
        <Card size="small" style={{ background: '#fafafa' }}>
          <div style={{ textAlign: 'right' }}>
            <Text type="secondary">续租费用: </Text>
            <Text type="danger" strong style={{ fontSize: 18 }}>
              ¥{(renewDays * rental.daily_rent).toFixed(2)}
            </Text>
          </div>
        </Card>
      </Modal>

      <Modal
        title="退租确认"
        open={returnModalVisible}
        onOk={handleReturn}
        onCancel={() => setReturnModalVisible(false)}
        confirmLoading={submitting}
        okText="确认退租"
        okType="danger"
      >
        <div style={{ padding: 16, background: '#fff7e6', borderRadius: 8 }}>
          <Title level={5} style={{ marginBottom: 8 }}>退租费用计算</Title>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="总租金">
              ¥{totalRent.toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="已使用租金 ({actualDays}天)">
              <Text type="danger">-¥{usedRent.toFixed(2)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="剩余租金退还">
              <Text type="success">+¥{remainingRent.toFixed(2)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="押金">
              ¥{rental.deposit}
            </Descriptions.Item>
            {penalty > 0 && (
              <Descriptions.Item label="违约金 (提前退租)">
                <Text type="danger">-¥{penalty.toFixed(2)}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="预计退还总额">
              <Text type="success" strong style={{ fontSize: 18 }}>¥{totalRefund.toFixed(2)}</Text>
            </Descriptions.Item>
          </Descriptions>
        </div>
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            退款将原路返还至您的账户余额
          </Text>
        </div>
      </Modal>

      <Modal
        title="发布转租"
        open={subletModalVisible}
        onOk={handleSublet}
        onCancel={() => setSubletModalVisible(false)}
        confirmLoading={submitting}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            转租日期范围 (不超过 {rental.end_date})
          </Text>
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            size="large"
            value={subletForm.start_date && subletForm.end_date ? [subletForm.start_date, subletForm.end_date] : null}
            onChange={(dates) => {
              setSubletForm(prev => ({
                ...prev,
                start_date: dates?.[0] || null,
                end_date: dates?.[1] || null
              }))
            }}
            disabledDate={(current) => {
              if (!current) return false
              if (current < dayjs().startOf('day')) return true
              if (current > dayjs(rental.end_date)) return true
              return false
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            转租价格 (元/天)
          </Text>
          <InputNumber
            min={0}
            value={subletForm.price}
            onChange={(value) => setSubletForm(prev => ({ ...prev, price: value || 0 }))}
            style={{ width: '100%' }}
            size="large"
            placeholder="请输入转租价格"
            addonAfter="元/天"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            转租说明 (选填)
          </Text>
          <TextArea
            value={subletForm.description}
            onChange={(e) => setSubletForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="描述转租原因、使用情况等信息"
            rows={4}
            maxLength={200}
            showCount
          />
        </div>
      </Modal>
    </div>
  )
}

export default RentalDetail
