import { useState } from 'react'
import { Card, Row, Col, Button, Tag, Select, Slider, Pagination, Input } from 'antd'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { CITIES, PACKAGE_TYPES, AGE_GROUPS } from '@/utils/constants'

const mockPackages = [
  {
    id: '1',
    name: '全面体检套餐A',
    organization: '北京协和医院体检中心',
    price: 1299,
    originalPrice: 1899,
    tags: ['全面检查', '肿瘤筛查'],
    city: 'beijing',
    type: 'comprehensive',
    ageGroup: '31-45',
    rating: 4.9,
    sales: 12580,
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=250&fit=crop',
  },
  {
    id: '2',
    name: '精英体检套餐',
    organization: '上海瑞金医院体检中心',
    price: 2599,
    originalPrice: 3299,
    tags: ['高端体检', '心脑血管'],
    city: 'shanghai',
    type: 'comprehensive',
    ageGroup: '46-60',
    rating: 4.8,
    sales: 8920,
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=250&fit=crop',
  },
  {
    id: '3',
    name: '女性专属体检',
    organization: '广州中山医院体检中心',
    price: 1599,
    originalPrice: 2199,
    tags: ['妇科检查', '乳腺筛查'],
    city: 'guangzhou',
    type: 'special',
    ageGroup: '18-30',
    rating: 4.9,
    sales: 15680,
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=250&fit=crop',
  },
  {
    id: '4',
    name: '老年健康体检',
    organization: '深圳北大医院体检中心',
    price: 1899,
    originalPrice: 2499,
    tags: ['老年专属', '骨质疏松'],
    city: 'shenzhen',
    type: 'elderly',
    ageGroup: '60+',
    rating: 4.7,
    sales: 6540,
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=250&fit=crop',
  },
  {
    id: '5',
    name: '入职体检套餐',
    organization: '杭州邵逸夫医院体检中心',
    price: 399,
    originalPrice: 599,
    tags: ['快速出报告', '入职必备'],
    city: 'hangzhou',
    type: 'employment',
    ageGroup: '18-30',
    rating: 4.8,
    sales: 25680,
    image: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&h=250&fit=crop',
  },
  {
    id: '6',
    name: '心血管专项检查',
    organization: '成都华西医院体检中心',
    price: 2299,
    originalPrice: 2999,
    tags: ['心脏检查', '血管造影'],
    city: 'chengdu',
    type: 'special',
    ageGroup: '46-60',
    rating: 4.9,
    sales: 7890,
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop',
  },
  {
    id: '7',
    name: '常规体检套餐',
    organization: '北京301医院体检中心',
    price: 699,
    originalPrice: 999,
    tags: ['基础检查', '性价比高'],
    city: 'beijing',
    type: 'regular',
    ageGroup: '31-45',
    rating: 4.6,
    sales: 18920,
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=250&fit=crop',
  },
  {
    id: '8',
    name: '肿瘤筛查专项',
    organization: '上海肿瘤医院体检中心',
    price: 3299,
    originalPrice: 4299,
    tags: ['肿瘤筛查', '基因检测'],
    city: 'shanghai',
    type: 'special',
    ageGroup: '46-60',
    rating: 4.9,
    sales: 4560,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=250&fit=crop',
  },
]

const { Search } = Input

const HealthCheck = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(6)
  const [filters, setFilters] = useState({
    city: undefined,
    type: undefined,
    ageGroup: undefined,
    priceRange: [0, 5000],
    keyword: '',
  })

  const filteredPackages = mockPackages.filter((pkg) => {
    if (filters.city && pkg.city !== filters.city) return false
    if (filters.type && pkg.type !== filters.type) return false
    if (filters.ageGroup && pkg.ageGroup !== filters.ageGroup) return false
    if (pkg.price < filters.priceRange[0] || pkg.price > filters.priceRange[1]) return false
    if (filters.keyword && !pkg.name.includes(filters.keyword) && !pkg.organization.includes(filters.keyword)) return false
    return true
  })

  const paginatedPackages = filteredPackages.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleReset = () => {
    setFilters({
      city: undefined,
      type: undefined,
      ageGroup: undefined,
      priceRange: [0, 5000],
      keyword: '',
    })
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">体检套餐列表</h2>
        <Search
          placeholder="搜索体检套餐或机构"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          style={{ width: 400 }}
          onSearch={(value) => handleFilterChange('keyword', value)}
        />
      </div>

      <Card className="shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FilterOutlined className="text-[#1677ff]" />
          <span className="font-semibold">筛选条件</span>
          <Button type="text" size="small" onClick={handleReset}>
            重置
          </Button>
        </div>
        <Row gutter={[24, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div className="text-gray-500 mb-2">城市</div>
            <Select
              placeholder="请选择城市"
              allowClear
              style={{ width: '100%' }}
              options={CITIES}
              value={filters.city}
              onChange={(value) => handleFilterChange('city', value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-gray-500 mb-2">套餐类型</div>
            <Select
              placeholder="请选择类型"
              allowClear
              style={{ width: '100%' }}
              options={PACKAGE_TYPES}
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-gray-500 mb-2">年龄适配</div>
            <Select
              placeholder="请选择年龄段"
              allowClear
              style={{ width: '100%' }}
              options={AGE_GROUPS}
              value={filters.ageGroup}
              onChange={(value) => handleFilterChange('ageGroup', value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-gray-500 mb-2">
              价格区间：¥{filters.priceRange[0]} - ¥{filters.priceRange[1]}
            </div>
            <Slider
              range
              min={0}
              max={5000}
              step={100}
              value={filters.priceRange}
              onChange={(value) => handleFilterChange('priceRange', value)}
            />
          </Col>
        </Row>
      </Card>

      <div className="text-gray-500">
        共找到 <span className="text-[#1677ff] font-semibold">{filteredPackages.length}</span> 个套餐
      </div>

      <Row gutter={[16, 16]}>
        {paginatedPackages.map((pkg) => (
          <Col xs={24} sm={12} lg={8} key={pkg.id}>
            <Card
              hoverable
              cover={
                <img
                  alt={pkg.name}
                  src={pkg.image}
                  className="h-48 object-cover"
                />
              }
              className="cursor-pointer"
              onClick={() => navigate(`/health-check/${pkg.id}`)}
            >
              <Card.Meta
                title={
                  <div className="flex items-start justify-between">
                    <span className="font-semibold">{pkg.name}</span>
                    <span className="text-sm text-yellow-500">★ {pkg.rating}</span>
                  </div>
                }
                description={
                  <div className="space-y-2 mt-2">
                    <p className="text-gray-500 text-sm">{pkg.organization}</p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.tags.map((tag, index) => (
                        <Tag key={index} color="blue">{tag}</Tag>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#f5222d]">¥{pkg.price}</span>
                        <span className="text-gray-400 line-through text-sm">¥{pkg.originalPrice}</span>
                      </div>
                      <span className="text-gray-400 text-sm">已售 {pkg.sales}</span>
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {paginatedPackages.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">暂无符合条件的体检套餐</p>
          <p className="text-sm mt-2">请尝试调整筛选条件</p>
        </div>
      )}

      <div className="flex justify-center">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredPackages.length}
          onChange={setCurrentPage}
          showSizeChanger={false}
        />
      </div>
    </div>
  )
}

export default HealthCheck
