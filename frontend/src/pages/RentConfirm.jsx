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
  DatePicker, 
  Select,
  Descriptions,
  message,
  Space,
  Image,
  Divider
} from 'antd'
import { 
  ShoppingCartOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../utils/request'
import useUserStore from '../store/user'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const RentConfirm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, updateUser } = useUserStore()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)
  const [appliance, setAppliance] = useState(null)
  const [dates, setDates] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('one_time')
  const [userBalance, setUserBalance] = useState(0)

  const loadData = async () => {
    if (!id) return
    
    setLoading(true)
    setError(false)
    try {
      const [applianceRes, depositRes] = await Promise.all([
        request.get(`/appliances/${id}`),
        request.get('/user/deposit')
      ])
      setAppliance(applianceRes.data)
      setUserBalance(depositRes.data?.balance || 0)
    } catch (err) {
      console.error('Load rent confirm error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const calculateDays = () => {
    if (!dates || dates.length < 2) return 0
    const start = dates[0]
    const end = dates[1]
    if (!start || !end) return 0
    return end.diff(start, 'day') + 1
  }

  const calculateAmount = () => {
    if (!appliance) return { rent: 0, deposit: 0, total: 0 }
    const days = calculateDays()
    const rent = days * appliance.daily_rent
    const deposit = appliance.deposit
    return { rent, deposit, total: rent + deposit }
  }

  const disabledDate = (current) => {
    return current && current < dayjs().startOf('day')
  }

  const handleSubmit = async () => {
    if (!dates || dates.length < 2) {
      message.warning('请选择租借日期')
      return
    }

    const { total } = calculateAmount()
    if (userBalance < total) {
      message.warning('余额不足，请先充值')
      navigate('/settings/deposit')
      return
    }

    setSubmitting(true)
    try {
      const res = await request.post('/rental/create', {
        appliance_id: id,
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD'),
        payment_method: paymentMethod
      })

      message.success('租借成功')
      if (res.data) {
        updateUser({ ...user, balance: user.balance - total })
      }
      navigate('/rentals')
    } catch (err) {
      console.error('Create rental error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="数据加载失败，请点击重试"
        extra={
          <Button type="primary" onClick={loadData}>
            重新加载
          </Button>
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

  if (!appliance) {
    return (
      <Result
        status="404"
        title="商品不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    )
  }

  const days = calculateDays()
  const { rent, deposit, total } = calculateAmount()
  const firstImage = appliance.images?.[0] || 'https://placehold.co/300x300'

  return (
    <div>
      <Card>
        <Title level={3} style={{ marginBottom: 24 }}>确认租借</Title>
        
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Image
                    width="100%"
                    src={firstImage}
                    style={{ borderRadius: 8 }}
                    preview={false}
                  />
                </Col>
                <Col span={18}>
                  <Title level={5} style={{ marginBottom: 8 }}>{appliance.name}</Title>
                  <Space wrap>
                    <Text type="secondary">日租金: </Text>
                    <Text type="danger" strong>¥{appliance.daily_rent}/天</Text>
                    <Text type="secondary">押金: </Text>
                    <Text>¥{appliance.deposit}</Text>
                  </Space>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">位置: {appliance.location || '未填写'}</Text>
                  </div>
                </Col>
              </Row>
            </Card>

            <Card title="租借日期" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>选择租借起止日期</Text>
                <RangePicker
                  style={{ width: '100%' }}
                  size="large"
                  value={dates}
                  onChange={setDates}
                  disabledDate={disabledDate}
                  placeholder={['开始日期', '结束日期']}
                />
              </div>
              
              <div>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>支付方式</Text>
                <Select
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  style={{ width: 200 }}
                  size="large"
                >
                  <Option value="one_time">一次性付清</Option>
                  <Option value="monthly">月付 (开发中)</Option>
                </Select>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card title="费用明细" style={{ position: 'sticky', top: 100 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="账户余额">
                  <Text strong>¥{userBalance?.toFixed(2) || '0.00'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="租借天数">
                  {days > 0 ? `${days} 天` : <Text type="secondary">请选择日期</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="租金">
                  <Text>¥{rent?.toFixed(2) || '0.00'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="押金">
                  <Text>¥{deposit?.toFixed(2) || '0.00'}</Text>
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <div style={{ textAlign: 'right', marginBottom: 16 }}>
                <Text type="secondary">合计: </Text>
                <Text type="danger" strong style={{ fontSize: 24 }}>
                  ¥{total?.toFixed(2) || '0.00'}
                </Text>
              </div>

              {userBalance < total && (
                <div style={{ 
                  padding: 12, 
                  background: '#fffbe6',
                  border: '1px solid #ffe58f',
                  borderRadius: 4,
                  marginBottom: 16
                }}>
                  <Text type="warning">
                    余额不足，还差 ¥{(total - userBalance).toFixed(2)}
                  </Text>
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => navigate('/settings/deposit')}
                  >
                    去充值
                  </Button>
                </div>
              )}

              <Button
                type="primary"
                size="large"
                block
                icon={<ShoppingCartOutlined />}
                onClick={handleSubmit}
                loading={submitting}
                disabled={days <= 0 || userBalance < total}
              >
                {days > 0 ? `确认支付 ¥${total?.toFixed(2)}` : '请选择日期'}
              </Button>

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <CheckCircleOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                  押金将在退租后原路退还
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default RentConfirm
