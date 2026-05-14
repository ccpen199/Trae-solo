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
  Pagination,
  message,
  Popconfirm
} from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import request from '../utils/request'

const { Title, Text } = Typography

const Favorites = () => {
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 })

  const conditionMap = {
    new: { text: '全新', color: 'green' },
    like_new: { text: '九成新', color: 'blue' },
    used: { text: '二手', color: 'orange' }
  }

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await request.get('/user/favorites', {
        params: {
          page: pagination.current,
          page_size: pagination.pageSize
        }
      })
      setFavorites(res.data?.list || [])
      setPagination(prev => ({
        ...prev,
        total: res.data?.total || 0
      }))
    } catch (err) {
      console.error('Load favorites error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize])

  const handleRemove = async (id) => {
    try {
      await request.delete(`/user/favorites/${id}`)
      message.success('已取消收藏')
      loadData()
    } catch (err) {
      console.error('Remove favorite error:', err)
    }
  }

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 12 }))
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="收藏列表加载失败，请点击重试"
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
      <Card>
        <Title level={3} style={{ marginBottom: 16 }}>我的收藏</Title>
        
        {(!favorites || favorites.length === 0) ? (
          <Empty description="暂无收藏商品" />
        ) : (
          <Row gutter={[16, 16]}>
            {favorites.map((item) => (
              <Col xs={12} sm={8} md={6} lg={4} key={item.favorite_id}>
                <Card
                  hoverable
                  className="appliance-card"
                  cover={
                    <img
                      alt={item.name}
                      src={item.images?.[0] || 'https://placehold.co/300x200'}
                      style={{ height: 160, objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => navigate(`/detail/${item.id}`)}
                    />
                  }
                  bodyStyle={{ padding: 12 }}
                  actions={[
                    <Popconfirm
                      title="确认取消收藏"
                      description="确定要取消收藏此商品吗？"
                      onConfirm={() => handleRemove(item.id)}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button type="text" icon={<DeleteOutlined />} danger>
                        取消收藏
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                    <Tag color={conditionMap[item.condition]?.color || 'default'}>
                      {conditionMap[item.condition]?.text || '其他'}
                    </Tag>
                  </div>
                  <div 
                    onClick={() => navigate(`/detail/${item.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Text ellipsis style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
                      {item.name}
                    </Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Text type="danger" strong style={{ fontSize: 16 }}>¥{item.daily_rent}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>/天</Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>押金:¥{item.deposit}</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {pagination.total > 0 && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              showSizeChanger
              showQuickJumper
              pageSizeOptions={['12', '24', '48']}
              onChange={handlePageChange}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default Favorites
