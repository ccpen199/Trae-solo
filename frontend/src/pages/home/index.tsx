import { Card, Row, Col, Button, Tag, Statistic } from 'antd'
import {
  HeartOutlined,
  SafetyOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
  BuildOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'

const mockHealthPackages = [
  {
    id: '1',
    name: '全面体检套餐A',
    organization: '北京协和医院体检中心',
    price: 1299,
    originalPrice: 1899,
    tags: ['全面检查', '肿瘤筛查'],
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=250&fit=crop',
  },
  {
    id: '2',
    name: '精英体检套餐',
    organization: '上海瑞金医院体检中心',
    price: 2599,
    originalPrice: 3299,
    tags: ['高端体检', '心脑血管'],
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&h=250&fit=crop',
  },
  {
    id: '3',
    name: '女性专属体检',
    organization: '广州中山医院体检中心',
    price: 1599,
    originalPrice: 2199,
    tags: ['妇科检查', '乳腺筛查'],
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=250&fit=crop',
  },
  {
    id: '4',
    name: '老年健康体检',
    organization: '深圳北大医院体检中心',
    price: 1899,
    originalPrice: 2499,
    tags: ['老年专属', '骨质疏松'],
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=250&fit=crop',
  },
  {
    id: '5',
    name: '入职体检套餐',
    organization: '杭州邵逸夫医院体检中心',
    price: 399,
    originalPrice: 599,
    tags: ['快速出报告', '入职必备'],
    image: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=400&h=250&fit=crop',
  },
  {
    id: '6',
    name: '心血管专项检查',
    organization: '成都华西医院体检中心',
    price: 2299,
    originalPrice: 2999,
    tags: ['心脏检查', '血管造影'],
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop',
  },
]

const mockInsuranceProducts = [
  {
    id: '1',
    name: '百万医疗险',
    company: '平安保险',
    price: 299,
    period: '每年',
    coverage: '400万',
    tags: ['住院医疗', '门诊手术'],
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop',
  },
  {
    id: '2',
    name: '重疾保障计划',
    company: '中国人寿',
    price: 3599,
    period: '每年',
    coverage: '50万',
    tags: ['120种重疾', '多次赔付'],
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&h=250&fit=crop',
  },
  {
    id: '3',
    name: '综合意外险',
    company: '太平洋保险',
    price: 199,
    period: '每年',
    coverage: '100万',
    tags: ['意外身故', '医疗报销'],
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop',
  },
  {
    id: '4',
    name: '终身寿险',
    company: '泰康人寿',
    price: 5999,
    period: '每年',
    coverage: '100万',
    tags: ['终身保障', '财富传承'],
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop',
  },
]

const Home = () => {
  const navigate = useNavigate()

  const trendChartOption = {
    title: {
      text: '健康趋势分析',
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['血压', '血糖', 'BMI'],
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '血压',
        type: 'line',
        data: [120, 118, 122, 119, 121, 118],
        itemStyle: { color: '#1677ff' },
        smooth: true,
      },
      {
        name: '血糖',
        type: 'line',
        data: [5.6, 5.8, 5.5, 5.7, 5.4, 5.6],
        itemStyle: { color: '#52c41a' },
        smooth: true,
      },
      {
        name: 'BMI',
        type: 'line',
        data: [23.5, 23.8, 23.6, 23.4, 23.7, 23.5],
        itemStyle: { color: '#fa8c16' },
        smooth: true,
      },
    ],
  }

  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#1677ff] via-[#1890ff] to-[#52c41a] p-12 text-white">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            一站式健康保障服务平台
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            体检预约 · 保险商城 · 健康档案 · 风险预警
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              type="primary"
              size="large"
              icon={<CalendarOutlined />}
              onClick={() => navigate('/health-check')}
              className="bg-white text-[#1677ff] hover:bg-gray-100 border-none"
            >
              立即预约体检
            </Button>
            <Button
              size="large"
              icon={<SafetyOutlined />}
              onClick={() => navigate('/insurance')}
              className="bg-transparent text-white border-white hover:bg-white/20"
            >
              浏览保险产品
            </Button>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-20">
          <div className="absolute right-10 top-10 w-32 h-32 rounded-full bg-white" />
          <div className="absolute right-20 top-40 w-20 h-20 rounded-full bg-white" />
          <div className="absolute right-40 top-20 w-16 h-16 rounded-full bg-white" />
        </div>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card
            hoverable
            className="text-center h-full cursor-pointer"
            onClick={() => navigate('/health-check')}
            bodyStyle={{ padding: '32px 24px' }}
          >
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <HeartOutlined className="text-3xl text-[#1677ff]" />
            </div>
            <h3 className="text-xl font-bold mb-2">体检预约</h3>
            <p className="text-gray-500 mb-4">全国4000+体检机构，在线预约省时省心</p>
            <span className="text-[#1677ff] flex items-center justify-center gap-1">
              立即预约 <ArrowRightOutlined />
            </span>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            hoverable
            className="text-center h-full cursor-pointer"
            onClick={() => navigate('/insurance')}
            bodyStyle={{ padding: '32px 24px' }}
          >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <SafetyOutlined className="text-3xl text-[#52c41a]" />
            </div>
            <h3 className="text-xl font-bold mb-2">保险商城</h3>
            <p className="text-gray-500 mb-4">30+保险公司，精选优质保险产品</p>
            <span className="text-[#52c41a] flex items-center justify-center gap-1">
              了解更多 <ArrowRightOutlined />
            </span>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            hoverable
            className="text-center h-full cursor-pointer"
            onClick={() => navigate('/health-archive')}
            bodyStyle={{ padding: '32px 24px' }}
          >
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <FileTextOutlined className="text-3xl text-[#fa8c16]" />
            </div>
            <h3 className="text-xl font-bold mb-2">健康档案</h3>
            <p className="text-gray-500 mb-4">终身健康档案管理，智能分析健康风险</p>
            <span className="text-[#fa8c16] flex items-center justify-center gap-1">
              查看档案 <ArrowRightOutlined />
            </span>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="合作体检机构"
              value={4000}
              suffix="+"
              prefix={<BuildOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="合作保险公司"
              value={30}
              suffix="+"
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="服务用户"
              value={100}
              suffix="万+"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="text-center">
            <Statistic
              title="体检预约"
              value={50}
              suffix="万+"
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">热门体检套餐</h2>
          <Button type="link" onClick={() => navigate('/health-check')}>
            查看全部 <ArrowRightOutlined />
          </Button>
        </div>
        <Row gutter={[16, 16]}>
          {mockHealthPackages.map((pkg) => (
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
                  title={pkg.name}
                  description={
                    <div className="space-y-2">
                      <p className="text-gray-500 text-sm">{pkg.organization}</p>
                      <div className="flex flex-wrap gap-1">
                        {pkg.tags.map((tag, index) => (
                          <Tag key={index} color="blue">{tag}</Tag>
                        ))}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#f5222d]">¥{pkg.price}</span>
                        <span className="text-gray-400 line-through">¥{pkg.originalPrice}</span>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">精选保险产品</h2>
          <Button type="link" onClick={() => navigate('/insurance')}>
            查看全部 <ArrowRightOutlined />
          </Button>
        </div>
        <Row gutter={[16, 16]}>
          {mockInsuranceProducts.map((product) => (
            <Col xs={24} sm={12} lg={6} key={product.id}>
              <Card
                hoverable
                cover={
                  <img
                    alt={product.name}
                    src={product.image}
                    className="h-40 object-cover"
                  />
                }
                className="cursor-pointer"
                onClick={() => navigate(`/insurance/${product.id}`)}
              >
                <Card.Meta
                  title={product.name}
                  description={
                    <div className="space-y-2">
                      <p className="text-gray-500 text-sm">{product.company}</p>
                      <div className="flex flex-wrap gap-1">
                        {product.tags.map((tag, index) => (
                          <Tag key={index} color="green">{tag}</Tag>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold text-[#f5222d]">¥{product.price}</span>
                          <span className="text-gray-500 text-sm">/{product.period}</span>
                        </div>
                        <span className="text-sm text-gray-500">保额 {product.coverage}</span>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={trendChartOption} style={{ height: '350px' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="平台优势" className="h-full">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#1677ff] font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">专业权威</h4>
                  <p className="text-gray-500 text-sm">与全国知名三甲医院及正规保险公司合作，服务有保障</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#52c41a] font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">价格透明</h4>
                  <p className="text-gray-500 text-sm">明码标价，无隐形消费，让您的每一分钱都花得明白</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#fa8c16] font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">隐私保护</h4>
                  <p className="text-gray-500 text-sm">严格遵守医疗隐私保护法规，您的健康数据安全无忧</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#722ed1] font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold">智能分析</h4>
                  <p className="text-gray-500 text-sm">AI健康风险评估，提前预警潜在健康风险</p>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Home
