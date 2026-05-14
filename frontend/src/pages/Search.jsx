import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
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
  Input
} from 'antd'
import request from '../utils/request'

const { Title, Text } = Typography
const { Search } = Input

const SearchPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') || ''
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [appliances, setAppliances] = useState([])
  const [searchText, setSearchText] = useState(keyword)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 })

  const conditionMap = {
    new: { text: '全新', color: 'green' },
    like_new: { text: '九成新', color: 'blue' },
    used: { text: '二手', color: 'orange' }
  }

  const loadData = async () => {
    if (!keyword) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(false)
    try {
      const res = await request.get('/appliances', {
        params: {
          keyword,
          page: pagination.current,
          page_size: pagination.pageSize
        }
      })
      setAppliances(res.data?.list || [])
      setPagination(prev => ({
        ...prev,
        total: res.data?.total || 0
      }))
    } catch (err) {
      console.error('Search error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSearchText(keyword)
    loadData()
  }, [keyword, pagination.current, pagination.pageSize])

  const handleSearch = (value) => {
    if (value?.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(value.trim())}`)
    }
  }

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 12 }))
  }

  if (error) {
    return (
      <Result
        status="error"
        title="搜索失败"
        subTitle="搜索结果加载失败，请点击重试"
        extra={
          <Button type="primary" onClick={loadData}>
            重新搜索
          </Button>
        }
      />
    )
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spin size="large" tip="搜索中..." />
      </div>
    )
  }

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 16 }}>搜索</Title>
        <Search
          placeholder="输入关键词搜索家电"
          allowClear
          enterButton="搜索"
          size="large"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={handleSearch}
        />
      </Card>

      {keyword && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              搜索结果："{keyword}"
              <Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>
                共 {pagination.total} 条
              </Text>
            </Title>
          </div>
          
          {(!appliances || appliances.length === 0) ? (
            <Empty description={`没有找到与"${keyword}"相关的商品`} />
          ) : (
            <Row gutter={[16, 16]}>
              {appliances.map((item) => (
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
                      {item.category_name && <Tag color="blue">{item.category_name}</Tag>}
                    </div>
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
      )}

      {!keyword && (
        <Card>
          <Empty description="请输入关键词进行搜索" />
        </Card>
      )}
    </div>
  )
}

export default SearchPage
