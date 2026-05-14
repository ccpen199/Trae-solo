import { useState, useEffect } from 'react'
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
  Select,
  InputNumber,
  Space,
  Pagination,
  Input
} from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import request from '../utils/request'

const { Title, Text } = Typography
const { Option } = Select
const { Search } = Input

const Category = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [categories, setCategories] = useState([])
  const [appliances, setAppliances] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12, total: 0 })
  
  const [filters, setFilters] = useState({
    keyword: '',
    category_id: id || undefined,
    condition: undefined,
    min_price: undefined,
    max_price: undefined,
    location: '',
    sort_by: 'views',
    sort_order: 'desc'
  })

  const conditionMap = {
    new: { text: '全新', color: 'green' },
    like_new: { text: '九成新', color: 'blue' },
    used: { text: '二手', color: 'orange' }
  }

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const categoriesRes = await request.get('/categories')
      setCategories(categoriesRes.data || [])

      const params = {
        page: pagination.current,
        page_size: pagination.pageSize,
        ...filters
      }
      
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === null || params[key] === '') {
          delete params[key]
        }
      })

      const appliancesRes = await request.get('/appliances', { params })
      setAppliances(appliancesRes.data?.list || [])
      setPagination(prev => ({
        ...prev,
        total: appliancesRes.data?.total || 0
      }))
    } catch (err) {
      console.error('Load category error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      setFilters(prev => ({ ...prev, category_id: id }))
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [filters, pagination.current, pagination.pageSize])

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 12 }))
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="商品列表加载失败，请点击重试"
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
      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 16 }}>商品分类</Title>
        <Space wrap size={[8, 8]}>
          <Button 
            type={!filters.category_id ? 'primary' : 'default'}
            onClick={() => handleFilterChange('category_id', undefined)}
          >
            全部
          </Button>
          {(categories || []).map(cat => (
            <Button 
              key={cat.id}
              type={filters.category_id == cat.id ? 'primary' : 'default'}
              onClick={() => handleFilterChange('category_id', cat.id)}
            >
              {cat.icon} {cat.name}
            </Button>
          ))}
        </Space>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Title level={4} style={{ marginBottom: 16 }}>筛选条件</Title>
        <Space wrap size={[16, 16]}>
          <Search
            placeholder="搜索商品"
            allowClear
            style={{ width: 200 }}
            onSearch={(value) => handleFilterChange('keyword', value)}
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
          />

          <Select
            placeholder="新旧程度"
            allowClear
            style={{ width: 120 }}
            value={filters.condition}
            onChange={(value) => handleFilterChange('condition', value)}
          >
            <Option value="new">全新</Option>
            <Option value="like_new">九成新</Option>
            <Option value="used">二手</Option>
          </Select>

          <InputNumber
            placeholder="最低价"
            min={0}
            style={{ width: 100 }}
            value={filters.min_price}
            onChange={(value) => handleFilterChange('min_price', value)}
          />
          <Text>-</Text>
          <InputNumber
            placeholder="最高价"
            min={0}
            style={{ width: 100 }}
            value={filters.max_price}
            onChange={(value) => handleFilterChange('max_price', value)}
          />

          <Select
            placeholder="排序方式"
            style={{ width: 140 }}
            value={`${filters.sort_by}-${filters.sort_order}`}
            onChange={(value) => {
              const [sort_by, sort_order] = value.split('-')
              setFilters(prev => ({ ...prev, sort_by, sort_order }))
              setPagination(prev => ({ ...prev, current: 1 }))
            }}
          >
            <Option value="views-desc">浏览最多</Option>
            <Option value="created_at-desc">最新上架</Option>
            <Option value="daily_rent-asc">价格从低到高</Option>
            <Option value="daily_rent-desc">价格从高到低</Option>
          </Select>

          <Button onClick={() => {
            setFilters({
              keyword: '',
              category_id: id || undefined,
              condition: undefined,
              min_price: undefined,
              max_price: undefined,
              location: '',
              sort_by: 'views',
              sort_order: 'desc'
            })
            setPagination(prev => ({ ...prev, current: 1 }))
          }}>
            重置筛选
          </Button>
        </Space>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            商品列表
            <Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>
              共 {pagination.total} 件
            </Text>
          </Title>
        </div>
        
        {(!appliances || appliances.length === 0) ? (
          <Empty description="暂无商品" />
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
    </div>
  )
}

export default Category
