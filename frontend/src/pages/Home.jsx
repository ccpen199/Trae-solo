import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Input, Select, Space, message } from 'antd'
import { SearchOutlined, ShopOutlined, CarOutlined, HomeOutlined, CoffeeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const { Search } = Input
const { Option } = Select

const businessDomains = [
  { key: 'takeout', name: '美食外卖', icon: <CoffeeOutlined />, color: '#ff4d4f' },
  { key: 'instore', name: '到店消费', icon: <ShopOutlined />, color: '#52c41a' },
  { key: 'travel', name: '出行服务', icon: <CarOutlined />, color: '#1890ff' },
  { key: 'tourism', name: '旅游酒店', icon: <HomeOutlined />, color: '#fa8c16' }
]

const Home = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [recommendMerchants, setRecommendMerchants] = useState([])

  useEffect(() => {
    loadCategories()
    loadRecommendMerchants()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories/tree')
      setCategories(res.data)
    } catch (error) {
      console.error('加载类目失败', error)
    }
  }

  const loadRecommendMerchants = async () => {
    try {
      const res = await api.get('/merchants', { params: { pageSize: 8 } })
      setRecommendMerchants(res.data.list)
    } catch (error) {
      console.error('加载推荐商户失败', error)
    }
  }

  const handleSearch = (value) => {
    navigate(`/merchants?keyword=${encodeURIComponent(value)}`)
  }

  const handleDomainClick = (domain) => {
    navigate(`/merchants?business_domain=${domain}`)
  }

  return (
    <div>
      <Card style={{ marginBottom: '24px', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <h1 style={{ color: '#fff', marginBottom: '16px', fontSize: '32px' }}>
          🏪 一站式本地生活服务平台
        </h1>
        <p style={{ color: '#fff', marginBottom: '24px', opacity: 0.9 }}>
          外卖 | 到店 | 出行 | 旅游 - 满足您的所有生活需求
        </p>
        <Search
          placeholder="搜索商户、商品..."
          allowClear
          enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
          size="large"
          onSearch={handleSearch}
          style={{ maxWidth: 600, margin: '0 auto' }}
        />
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {businessDomains.map(domain => (
          <Col span={6} key={domain.key}>
            <Card
              hoverable
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onClick={() => handleDomainClick(domain.key)}
            >
              <div style={{ fontSize: '48px', color: domain.color, marginBottom: '12px' }}>
                {domain.icon}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{domain.name}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ marginBottom: '16px' }}>🔥 热门推荐商户</h2>
      </div>
      
      {recommendMerchants.length > 0 ? (
        <Row gutter={[16, 16]}>
          {recommendMerchants.map(merchant => (
            <Col span={6} key={merchant.id}>
              <Card
                hoverable
                cover={
                  <div style={{ height: 150, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                    🏪
                  </div>
                }
                actions={[
                  <Button type="link" onClick={() => navigate(`/merchants/${merchant.id}`)}>
                    进入店铺
                  </Button>
                ]}
              >
                <Card.Meta
                  title={merchant.name}
                  description={
                    <div>
                      <div>{merchant.description || '暂无描述'}</div>
                      <div style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                        {merchant.address || '地址待更新'}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <p>暂无推荐商户</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              提示：请先登录管理后台审核商户入驻申请
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default Home
