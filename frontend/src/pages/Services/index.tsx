import { useState, useEffect } from 'react'
import {
  Layout,
  Tree,
  Input,
  Select,
  Button,
  Row,
  Col,
  Pagination,
  Card,
  Tag,
  Space,
  Empty,
  Spin,
  Tooltip
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ServiceCard from '@/components/ServiceCard'
import { Service } from '@/types'
import dayjs from 'dayjs'

const { Sider, Content } = Layout
const { Search } = Input
const { Option } = Select

const categoryTree = [
  {
    title: '户籍证件',
    key: '户籍证件',
    children: [
      { title: '居住证办理', key: '居住证办理' },
      { title: '身份证办理', key: '身份证办理' },
      { title: '户口迁移', key: '户口迁移' }
    ]
  },
  {
    title: '社会保障',
    key: '社会保障',
    children: [
      { title: '社保查询', key: '社保查询' },
      { title: '社保转移', key: '社保转移' },
      { title: '养老金认证', key: '养老金认证' }
    ]
  },
  {
    title: '住房公积金',
    key: '住房公积金',
    children: [
      { title: '公积金提取', key: '公积金提取' },
      { title: '公积金贷款', key: '公积金贷款' },
      { title: '公积金查询', key: '公积金查询' }
    ]
  },
  {
    title: '企业开办',
    key: '企业开办',
    children: [
      { title: '营业执照办理', key: '营业执照办理' },
      { title: '税务登记', key: '税务登记' },
      { title: '公章刻制', key: '公章刻制' }
    ]
  },
  {
    title: '教育服务',
    key: '教育服务',
    children: [
      { title: '入学报名', key: '入学报名' },
      { title: '学历认证', key: '学历认证' }
    ]
  },
  {
    title: '医疗健康',
    key: '医疗健康',
    children: [
      { title: '医保报销', key: '医保报销' },
      { title: '预约挂号', key: '预约挂号' }
    ]
  }
]

const generateMockServices = (): Service[] => {
  const categories = ['户籍证件', '社会保障', '住房公积金', '企业开办', '教育服务', '医疗健康']
  const departments = ['公安局', '人社局', '住房公积金管理中心', '市场监管局', '教育局', '卫健委']
  const services: Service[] = []

  for (let i = 1; i <= 24; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)]
    services.push({
      id: String(i),
      name: `${category}服务${i}`,
      category,
      subCategory: categoryTree.find((c) => c.key === category)?.children[0]?.title,
      description: `这是${category}类的第${i}个服务，提供便捷的在线办理功能，让群众少跑腿、好办事。`,
      icon: category.charAt(0),
      department: departments[categories.indexOf(category)],
      handler: `${departments[categories.indexOf(category)]}业务窗口`,
      processingTime: ['即时办理', '3个工作日', '5个工作日', '7个工作日', '15个工作日'][Math.floor(Math.random() * 5)],
      fee: Math.random() > 0.5 ? '免费' : `${Math.floor(Math.random() * 100)}元`,
      materials: ['身份证', '户口本', '申请表'].slice(0, Math.floor(Math.random() * 3) + 1),
      process: ['提交申请', '材料审核', '办理中', '完成'].slice(0, Math.floor(Math.random() * 2) + 2),
      faq: [{ question: '办理条件是什么？', answer: '符合相关规定即可办理' }],
      online: Math.random() > 0.2,
      status: 'online',
      accessType: ['API', 'SDK', 'Webview'][Math.floor(Math.random() * 3)] as 'API' | 'SDK' | 'Webview',
      heat: Math.floor(Math.random() * 3000) + 100,
      createdAt: dayjs().subtract(Math.random() * 30, 'day').toISOString()
    })
  }
  return services
}

const Services = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string[]>([])
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('keyword') || '')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterOnline, setFilterOnline] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadServices()
  }, [])

  useEffect(() => {
    filterServices()
  }, [services, selectedCategory, searchKeyword, filterStatus, filterOnline, currentPage])

  const loadServices = () => {
    setLoading(true)
    setTimeout(() => {
      const mockData = generateMockServices()
      setServices(mockData)
      setLoading(false)
    }, 600)
  }

  const filterServices = () => {
    let result = [...services]

    if (selectedCategory.length > 0) {
      const cats = selectedCategory.filter((c) => !categoryTree.find((t) => t.key === c)?.children)
      if (cats.length > 0) {
        result = result.filter((s) => cats.includes(s.category) || cats.includes(s.name))
      } else {
        result = result.filter((s) => selectedCategory.includes(s.category))
      }
    }

    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(keyword) ||
          s.description.toLowerCase().includes(keyword) ||
          s.department.toLowerCase().includes(keyword)
      )
    }

    if (filterOnline !== 'all') {
      result = result.filter((s) => (filterOnline === 'online' ? s.online : !s.online))
    }

    setFilteredServices(result)
  }

  const handleReset = () => {
    setSelectedCategory([])
    setSearchKeyword('')
    setFilterStatus('all')
    setFilterOnline('all')
    setCurrentPage(1)
    setSearchParams({})
    loadServices()
  }

  const handleSearch = (value: string) => {
    setSearchKeyword(value)
    setCurrentPage(1)
    if (value) {
      setSearchParams({ keyword: value })
    } else {
      setSearchParams({})
    }
  }

  const handleCategorySelect = (keys: any[]) => {
    setSelectedCategory(keys as string[])
    setCurrentPage(1)
  }

  const paginatedServices = filteredServices.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="page-wrapper">
      <div className="container">
        <Card className="card-shadow" style={{ marginBottom: 16 }}>
          <Space size="middle" style={{ width: '100%' }} wrap>
            <Search
              placeholder="搜索服务名称、描述、部门..."
              allowClear
              enterButton
              size="large"
              style={{ width: 400 }}
              onSearch={handleSearch}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="办理状态"
              style={{ width: 150 }}
              value={filterStatus}
              onChange={setFilterStatus}
              allowClear
            >
              <Option value="all">全部</Option>
              <Option value="online">可在线办理</Option>
              <Option value="offline">仅线下办理</Option>
            </Select>
            <Select
              placeholder="服务类型"
              style={{ width: 150 }}
              value={filterOnline}
              onChange={setFilterOnline}
              allowClear
            >
              <Option value="all">全部</Option>
              <Option value="online">热门服务</Option>
              <Option value="offline">最新上线</Option>
            </Select>
            <Tooltip title="重置筛选并重新加载">
              <Button icon={<ReloadOutlined />} onClick={handleReset} size="large">
                重置筛选
              </Button>
            </Tooltip>
            <Space style={{ marginLeft: 'auto' }}>
              <Button
                type={viewMode === 'grid' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('grid')}
              >
                网格
              </Button>
              <Button
                type={viewMode === 'list' ? 'primary' : 'default'}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode('list')}
              >
                列表
              </Button>
            </Space>
          </Space>
        </Card>

        <Layout style={{ background: 'transparent', gap: 16 }}>
          <Sider
            width={240}
            theme="light"
            style={{ background: '#fff', borderRadius: 8, padding: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <FilterOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: 600, fontSize: 16 }}>服务分类</span>
            </div>
            <Tree
              checkable
              showLine={{ showLeafIcon: false }}
              treeData={categoryTree}
              checkedKeys={selectedCategory}
              onCheck={handleCategorySelect}
              defaultExpandAll
            />
          </Sider>

          <Content style={{ background: 'transparent' }}>
            <Card
              className="card-shadow"
              title={
                <Space>
                  <span>服务列表</span>
                  <Tag color="blue">共 {filteredServices.length} 条</Tag>
                </Space>
              }
            >
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                  <Spin size="large" />
                </div>
              ) : paginatedServices.length > 0 ? (
                <>
                  {viewMode === 'grid' ? (
                    <Row gutter={[16, 16]}>
                      {paginatedServices.map((service) => (
                        <Col span={6} key={service.id}>
                          <ServiceCard service={service} />
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      {paginatedServices.map((service) => (
                        <div
                          key={service.id}
                          className="hover-card"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: 16,
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            cursor: 'pointer'
                          }}
                          onClick={() => navigate(`/services/${service.id}`)}
                        >
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 8,
                              background: '#1890ff',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 20,
                              fontWeight: 600
                            }}
                          >
                            {service.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 4px', fontSize: 16 }}>
                              {service.name}
                              <Tag color={service.online ? 'green' : 'default'} style={{ marginLeft: 8 }}>
                                {service.online ? '可在线办理' : '仅线下办理'}
                              </Tag>
                            </h4>
                            <p style={{ margin: 0, color: '#8c8c8c', fontSize: 13 }}>
                              {service.description}
                            </p>
                            <Space style={{ marginTop: 8 }}>
                              <Tag color="blue">{service.department}</Tag>
                              <Tag color="orange">{service.processingTime}</Tag>
                              <Tag color={service.fee === '免费' ? 'green' : 'red'}>{service.fee}</Tag>
                            </Space>
                          </div>
                        </div>
                      ))}
                    </Space>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={filteredServices.length}
                      onChange={setCurrentPage}
                      showSizeChanger={false}
                      showQuickJumper
                      showTotal={(total) => `共 ${total} 条`}
                    />
                  </div>
                </>
              ) : (
                <Empty description="暂无符合条件的服务" style={{ padding: 60 }} />
              )}
            </Card>
          </Content>
        </Layout>
      </div>
    </div>
  )
}

export default Services
