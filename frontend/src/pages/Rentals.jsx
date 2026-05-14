import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Spin, 
  Result,
  Empty,
  Tag,
  Tabs,
  List,
  Image,
  Space,
  Badge
} from 'antd'
import { 
  ClockCircleOutlined, 
  ReloadOutlined, 
  EyeOutlined,
  EnvironmentOutlined
} from '@ant-design/icons'
import request from '../utils/request'

const { Title, Text } = Typography

const Rentals = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeKey, setActiveKey] = useState('all')
  const [rentals, setRentals] = useState([])

  const statusMap = {
    pending: { text: '待支付', color: 'orange' },
    active: { text: '租借中', color: 'green' },
    completed: { text: '已完成', color: 'blue' },
    cancelled: { text: '已取消', color: 'default' },
    sublet: { text: '已转租', color: 'purple' }
  }

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '租借中' },
    { key: 'completed', label: '已完成' }
  ]

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const params = activeKey === 'all' ? {} : { status: activeKey }
      const res = await request.get('/rental/list', { params })
      setRentals(res.data?.list || [])
    } catch (err) {
      console.error('Load rentals error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeKey])

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="租借记录加载失败，请点击重试"
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

  const renderRentalItem = (rental) => {
    const firstImage = rental.appliance_images?.[0] || 'https://placehold.co/100x100'
    const statusInfo = statusMap[rental.status] || { text: '未知', color: 'default' }

    return (
      <Card 
        key={rental.id}
        style={{ marginBottom: 16 }}
        hoverable
        onClick={() => navigate(`/rentals/${rental.id}`)}
      >
        <Row gutter={16}>
          <Col span={4}>
            <Image
              width="100%"
              src={firstImage}
              style={{ borderRadius: 4 }}
              preview={false}
            />
          </Col>
          <Col span={16}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Title level={5} style={{ marginBottom: 8 }}>
                  {rental.appliance_name}
                </Title>
                <Space wrap style={{ marginBottom: 8 }}>
                  <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                  <Text type="secondary">
                    租期: {rental.start_date} 至 {rental.end_date}
                  </Text>
                </Space>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">
                    <EnvironmentOutlined style={{ marginRight: 4 }} />
                    日租金: ¥{rental.daily_rent}/天
                  </Text>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="danger" strong>¥{rental.total_amount}</Text>
                </div>
                {rental.status === 'active' && rental.remaining_days !== undefined && (
                  <Badge 
                    count={`剩余${rental.remaining_days}天`}
                    style={{ backgroundColor: '#52c41a' }}
                  />
                )}
              </div>
            </div>
          </Col>
          <Col span={4} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Button type="link" icon={<EyeOutlined />}>
              查看详情
            </Button>
          </Col>
        </Row>
      </Card>
    )
  }

  return (
    <div>
      <Card>
        <Title level={3} style={{ marginBottom: 16 }}>我的租借</Title>
        
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={tabItems}
        />

        {(!rentals || rentals.length === 0) ? (
          <Empty description="暂无租借记录" />
        ) : (
          <div>
            {rentals.map(renderRentalItem)}
          </div>
        )}
      </Card>
    </div>
  )
}

export default Rentals
