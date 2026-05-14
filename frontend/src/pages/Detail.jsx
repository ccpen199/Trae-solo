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
  Tag,
  Image,
  Descriptions,
  message,
  Modal,
  Space
} from 'antd'
import { 
  HeartOutlined, 
  HeartFilled, 
  ShoppingCartOutlined, 
  MessageOutlined,
  EnvironmentOutlined,
  EyeOutlined
} from '@ant-design/icons'
import request from '../utils/request'
import useUserStore from '../store/user'
import ChatModal from '../components/ChatModal'

const { Title, Text } = Typography

const Detail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, token } = useUserStore()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [appliance, setAppliance] = useState(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [chatVisible, setChatVisible] = useState(false)

  const conditionMap = {
    new: { text: '全新', color: 'green' },
    like_new: { text: '九成新', color: 'blue' },
    used: { text: '二手', color: 'orange' }
  }

  const loadData = async () => {
    if (!id) return
    
    setLoading(true)
    setError(false)
    try {
      const res = await request.get(`/appliances/${id}`)
      setAppliance(res.data)

      if (token) {
        const favoriteRes = await request.get(`/user/favorites/check/${id}`)
        setIsFavorite(favoriteRes.data?.is_favorite || false)
      }
    } catch (err) {
      console.error('Load detail error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id, token])

  const handleFavorite = async () => {
    if (!token) {
      navigate('/login')
      return
    }

    setFavoriteLoading(true)
    try {
      if (isFavorite) {
        await request.delete(`/user/favorites/${id}`)
        setIsFavorite(false)
        message.success('已取消收藏')
      } else {
        await request.post(`/user/favorites/${id}`)
        setIsFavorite(true)
        message.success('收藏成功')
      }
    } catch (err) {
      console.error('Favorite error:', err)
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleRent = () => {
    if (!token) {
      navigate('/login')
      return
    }
    if (user?.is_verified !== 1) {
      Modal.confirm({
        title: '需要实名认证',
        content: '租借家电需要完成实名认证，是否前往实名认证？',
        okText: '去认证',
        cancelText: '取消',
        onOk: () => navigate('/settings/verify')
      })
      return
    }
    navigate(`/rent/confirm/${id}`)
  }

  const handleChat = () => {
    if (!token) {
      navigate('/login')
      return
    }
    setChatVisible(true)
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="商品详情加载失败，请点击重试"
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
        subTitle="抱歉，您访问的商品不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            返回首页
          </Button>
        }
      />
    )
  }

  const images = appliance.images || []
  const firstImage = images[0] || 'https://placehold.co/600x400'

  return (
    <div>
      <Card>
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <div style={{ marginBottom: 16 }}>
              <Image
                width="100%"
                height={400}
                src={firstImage}
                style={{ borderRadius: 8, objectFit: 'cover' }}
                preview={{ mask: '点击查看大图' }}
              />
            </div>
            {images.length > 1 && (
              <Row gutter={8}>
                {images.slice(1).map((img, idx) => (
                  <Col span={6} key={idx}>
                    <Image
                      width="100%"
                      height={80}
                      src={img}
                      style={{ borderRadius: 4, objectFit: 'cover' }}
                      preview={false}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </Col>

          <Col xs={24} md={12}>
            <div style={{ marginBottom: 16 }}>
              <Space style={{ marginBottom: 8 }}>
                {appliance.category_name && (
                  <Tag color="blue">{appliance.category_icon} {appliance.category_name}</Tag>
                )}
                <Tag color={conditionMap[appliance.condition]?.color || 'default'}>
                  {conditionMap[appliance.condition]?.text || '其他'}
                </Tag>
                <Tag color={appliance.status === 'available' ? 'green' : 'red'}>
                  {appliance.status === 'available' ? '可租借' : '已租借'}
                </Tag>
              </Space>
              <Title level={3} style={{ margin: '8px 0' }}>{appliance.name}</Title>
              <Text type="secondary">
                <EyeOutlined style={{ marginRight: 4 }} />
                {appliance.views || 0} 次浏览
              </Text>
            </div>

            <Card size="small" style={{ marginBottom: 16 }}>
              <Row align="middle">
                <Col>
                  <Text type="danger" strong style={{ fontSize: 28 }}>
                    ¥{appliance.daily_rent}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 14, marginLeft: 4 }}>/天</Text>
                </Col>
                <Col flex="auto" style={{ textAlign: 'right' }}>
                  <Text type="secondary">押金: ¥{appliance.deposit}</Text>
                </Col>
              </Row>
            </Card>

            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="位置">
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {appliance.location || '未填写'}
              </Descriptions.Item>
              {appliance.owner_name && (
                <Descriptions.Item label="租主">
                  {appliance.owner_name}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Space style={{ marginBottom: 16 }} wrap>
              <Button
                type="text"
                icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                onClick={handleFavorite}
                loading={favoriteLoading}
              >
                {isFavorite ? '已收藏' : '收藏'}
              </Button>
              <Button
                type="text"
                icon={<MessageOutlined />}
                onClick={handleChat}
              >
                联系客服
              </Button>
            </Space>

            <div style={{ position: 'sticky', bottom: 0, padding: '16px 0', background: '#fff' }}>
              <Space>
                <Button
                  type="default"
                  size="large"
                  icon={<MessageOutlined />}
                  onClick={handleChat}
                  style={{ width: 120 }}
                >
                  咨询客服
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleRent}
                  disabled={appliance.status !== 'available'}
                  style={{ width: 200 }}
                >
                  {appliance.status === 'available' ? '立即租借' : '暂不可租'}
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      <Card style={{ marginTop: 24 }} title="商品描述">
        <Text>{appliance.description || '暂无描述'}</Text>
      </Card>

      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        toUserId={appliance?.owner_id}
        toUserName={appliance?.owner_name || '客服'}
        applianceId={id}
      />
    </div>
  )
}

export default Detail
