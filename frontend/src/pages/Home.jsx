import { useState, useEffect } from 'react'
import { 
  Carousel, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Spin, 
  Result,
  Empty,
  Tag,
  Badge
} from 'antd'
import { 
  ShoppingOutlined, 
  HistoryOutlined, 
  StarOutlined, 
  SettingOutlined,
  ArrowRightOutlined 
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import request from '../utils/request'

const { Title, Text } = Typography

const Home = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [banners, setBanners] = useState([])
  const [categories, setCategories] = useState([])
  const [recommendations, setRecommendations] = useState([])

  const conditionMap = {
    new: { text: '全新', color: 'green' },
    like_new: { text: '九成新', color: 'blue' },
    used: { text: '二手', color: 'orange' }
  }

  const quickActions = [
    { icon: <ShoppingOutlined style={{ fontSize: 24 }} />, title: '租借家电', desc: '海量家电随心租', action: () => navigate('/category') },
    { icon: <HistoryOutlined style={{ fontSize: 24 }} />, title: '我的租借', desc: '查看租借记录', action: () => navigate('/rentals') },
    { icon: <StarOutlined style={{ fontSize: 24 }} />, title: '我的收藏', desc: '收藏心仪商品', action: () => navigate('/favorites') },
    { icon: <SettingOutlined style={{ fontSize: 24 }} />, title: '设置中心', desc: '个人设置管理', action: () => navigate('/settings') }
  ]

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const [bannersRes, categoriesRes, recommendationsRes] = await Promise.all([
        request.get('/banners'),
        request.get('/categories'),
        request.get('/recommendations', { params: { limit: 6 } })
      ])

      setBanners(bannersRes.data || [])
      setCategories(categoriesRes.data || [])
      setRecommendations(recommendationsRes.data || [])
    } catch (err) {
      console.error('Load home data error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="首页数据加载失败，请点击重试"
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

  return (
    <div>
      {(banners && banners.length > 0) && (
        <Carousel autoplay style={{ marginBottom: 24, borderRadius: 8, overflow: 'hidden' }}>
          {(banners || []).map((banner) => (
            <div key={banner.id} style={{ cursor: 'pointer' }} onClick={() => banner.link && navigate(banner.link)}>
              <img
                src={banner.image}
                alt={banner.title || 'banner'}
                className="banner-image"
              />
            </div>
          ))}
        </Carousel>
      )}

      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 16 }}>常用功能</Title>
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={12} sm={6} key={index}>
              <div 
                className="category-item"
                onClick={action.action}
                style={{ background: '#fafafa', borderRadius: 8 }}
              >
                {action.icon}
                <div style={{ fontWeight: 500, marginTop: 8 }}>{action.title}</div>
                <Text type="secondary" style={{ fontSize: 12 }}>{action.desc}</Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>家电分类</Title>
          <Button type="link" onClick={() => navigate('/category')}>
            查看更多 <ArrowRightOutlined />
          </Button>
        </div>
        <Row gutter={[16, 16]}>
          {(categories || []).map((category) => (
            <Col xs={8} sm={6} md={4} lg={3} key={category.id}>
              <div 
                className="category-item"
                onClick={() => navigate(`/category/${category.id}`)}
              >
                <span className="category-icon">{category.icon || '📦'}</span>
                <span>{category.name}</span>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>为你推荐</Title>
          <Button type="link" onClick={() => navigate('/category')}>
            更多推荐 <ArrowRightOutlined />
          </Button>
        </div>
        {(!recommendations || recommendations.length === 0) ? (
          <Empty description="暂无推荐商品" />
        ) : (
          <Row gutter={[16, 16]}>
            {recommendations.map((item) => (
              <Col xs={12} sm={8} md={6} lg={4} key={item.id}>
                <Card
                  hoverable
                  className="appliance-card"
                  cover={
                    <img
                      alt={item.name}
                      src={item.images?.[0] || 'https://placehold.co/300x200'}
                      style={{ height: 160, objectFit: 'cover' }}
                    />
                  }
                  onClick={() => navigate(`/detail/${item.id}`)}
                  bodyStyle={{ padding: 12 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                    <Tag color={conditionMap[item.condition]?.color || 'default'}>
                      {conditionMap[item.condition]?.text || '其他'}
                    </Tag>
                  </div>
                  <Text ellipsis style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
                    {item.name}
                  </Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text type="danger" strong style={{ fontSize: 16 }}>¥{item.daily_rent}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>/天</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.views}次浏览</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  )
}

export default Home
