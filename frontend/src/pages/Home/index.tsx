import { useState, useEffect } from 'react'
import {
  Carousel,
  Card,
  Row,
  Col,
  Tabs,
  Statistic,
  Space,
  Tag,
  Button,
  Empty,
  Spin
} from 'antd'
import {
  AppstoreOutlined,
  CarOutlined,
  BulbOutlined,
  CalendarOutlined,
  ToolOutlined,
  TeamOutlined,
  MessageOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import ServiceCard from '@/components/ServiceCard'
import { Service, SceneTemplate } from '@/types'
import dayjs from 'dayjs'

const mockServices: Service[] = [
  {
    id: '1',
    name: '居住证办理',
    category: '户籍证件',
    description: '常州市居住证申领、换领、补领服务',
    icon: '居',
    department: '公安局',
    handler: '人口管理支队',
    processingTime: '15个工作日',
    fee: '免费',
    materials: ['身份证', '户口本', '居住证明'],
    process: ['提交申请', '材料审核', '制证', '领证'],
    faq: [{ question: '办理条件?', answer: '在常州居住满半年以上' }],
    online: true,
    status: 'online',
    accessType: 'API',
    heat: 1256,
    createdAt: dayjs().subtract(30, 'day').toISOString()
  },
  {
    id: '2',
    name: '社保查询',
    category: '社会保障',
    description: '查询个人社会保险缴纳情况和待遇信息',
    icon: '社',
    department: '人社局',
    handler: '社保中心',
    processingTime: '即时办理',
    fee: '免费',
    materials: ['身份证'],
    process: ['身份验证', '查询信息'],
    faq: [],
    online: true,
    status: 'online',
    accessType: 'API',
    heat: 2341,
    createdAt: dayjs().subtract(30, 'day').toISOString()
  },
  {
    id: '3',
    name: '公积金提取',
    category: '住房公积金',
    description: '住房公积金提取申请和办理',
    icon: '公',
    department: '住房公积金管理中心',
    handler: '业务大厅',
    processingTime: '3个工作日',
    fee: '免费',
    materials: ['身份证', '购房合同', '提取申请表'],
    process: ['提交申请', '审核', '资金划转'],
    faq: [],
    online: true,
    status: 'online',
    accessType: 'Webview',
    heat: 1876,
    createdAt: dayjs().subtract(30, 'day').toISOString()
  },
  {
    id: '4',
    name: '营业执照办理',
    category: '企业开办',
    description: '个体工商户和企业营业执照注册登记',
    icon: '营',
    department: '市场监管局',
    handler: '行政审批处',
    processingTime: '3个工作日',
    fee: '免费',
    materials: ['身份证', '经营场所证明', '名称核准通知书'],
    process: ['名称核准', '提交材料', '审核', '发照'],
    faq: [],
    online: true,
    status: 'online',
    accessType: 'API',
    heat: 987,
    createdAt: dayjs().subtract(30, 'day').toISOString()
  }
]

const mockScenes: SceneTemplate[] = [
  {
    id: '1',
    name: '我要开餐馆',
    description: '开办餐馆一站式服务，包含营业执照、食品经营许可证等',
    icon: '餐',
    category: '企业开办',
    services: [
      { serviceId: '1', serviceName: '营业执照办理', order: 1 },
      { serviceId: '2', serviceName: '食品经营许可证', order: 2 },
      { serviceId: '3', serviceName: '消防验收', order: 3 }
    ],
    materials: [
      { step: 1, name: '身份证', required: true, description: '经营者身份证原件' },
      { step: 1, name: '经营场所证明', required: true, description: '房产证或租赁合同' },
      { step: 2, name: '健康证', required: true, description: '从业人员健康证明' }
    ],
    steps: [
      { order: 1, title: '工商注册', description: '办理营业执照', services: ['营业执照办理'] },
      { order: 2, title: '资质办理', description: '办理食品经营许可证', services: ['食品经营许可证'] },
      { order: 3, title: '开业检查', description: '消防和卫生验收', services: ['消防验收'] }
    ],
    createdAt: dayjs().subtract(30, 'day').toISOString()
  },
  {
    id: '2',
    name: '新生儿入户',
    description: '新生儿出生登记、户口申报一站式办理',
    icon: '新',
    category: '户籍证件',
    services: [
      { serviceId: '4', serviceName: '出生医学证明', order: 1 },
      { serviceId: '5', serviceName: '户口申报', order: 2 },
      { serviceId: '6', serviceName: '医保参保', order: 3 }
    ],
    materials: [
      { step: 1, name: '父母身份证', required: true, description: '父母双方身份证' },
      { step: 1, name: '结婚证', required: true, description: '父母结婚证' }
    ],
    steps: [
      { order: 1, title: '办理出生证明', description: '医院出具出生医学证明', services: ['出生医学证明'] },
      { order: 2, title: '户口登记', description: '派出所办理户口申报', services: ['户口申报'] },
      { order: 3, title: '医保参保', description: '办理居民医疗保险', services: ['医保参保'] }
    ],
    createdAt: dayjs().subtract(30, 'day').toISOString()
  }
]

const quickEntries = [
  { icon: <CarOutlined />, title: '公交查询', path: '/bus', color: '#1890ff' },
  { icon: <CalendarOutlined />, title: '场馆预约', path: '/venues', color: '#52c41a' },
  { icon: <ToolOutlined />, title: '社区报修', path: '/community/repair', color: '#faad14' },
  { icon: <TeamOutlined />, title: '邻里互助', path: '/community/help', color: '#722ed1' },
  { icon: <MessageOutlined />, title: '市民反馈', path: '/feedback', color: '#eb2f96' },
  { icon: <BulbOutlined />, title: '一件事专区', path: '/scenes', color: '#13c2c2' }
]

const announcements = [
  { id: 1, title: '关于2024年度城乡居民医疗保险参保缴费的通知', time: '2024-01-15' },
  { id: 2, title: '常州市政务服务中心春节放假安排', time: '2024-01-10' },
  { id: 3, title: '不动产登记"一窗受理"服务升级公告', time: '2024-01-05' }
]

const Home = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const chartOption = {
    title: { text: '近7天办件趋势', left: 'center', textStyle: { fontSize: 16 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['受理量', '办结量'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '受理量',
        type: 'line',
        smooth: true,
        data: [1200, 1320, 1010, 1340, 900, 2300, 2100],
        lineStyle: { color: '#1890ff' },
        itemStyle: { color: '#1890ff' },
        areaStyle: { color: 'rgba(24, 144, 255, 0.1)' }
      },
      {
        name: '办结量',
        type: 'line',
        smooth: true,
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        lineStyle: { color: '#52c41a' },
        itemStyle: { color: '#52c41a' },
        areaStyle: { color: 'rgba(82, 196, 26, 0.1)' }
      }
    ]
  }

  const categoryTabs = [
    { key: 'all', label: '全部服务' },
    { key: '户籍证件', label: '户籍证件' },
    { key: '社会保障', label: '社会保障' },
    { key: '住房公积金', label: '住房公积金' },
    { key: '企业开办', label: '企业开办' }
  ]

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <Row gutter={24} style={{ marginBottom: 24 }}>
          <Col span={16}>
            <Card className="card-shadow" bodyStyle={{ padding: 0 }}>
              <Carousel autoplay dots style={{ borderRadius: 8, overflow: 'hidden' }}>
                {announcements.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      height: 300,
                      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: '#fff',
                      padding: '0 48px'
                    }}
                  >
                    <h2 style={{ color: '#fff', fontSize: 28, marginBottom: 16 }}>{item.title}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.85)' }}>{item.time}</p>
                  </div>
                ))}
              </Carousel>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="公告通知" className="card-shadow" extra={<a>更多</a>}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {announcements.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer'
                    }}
                  >
                    <span className="text-ellipsis" style={{ flex: 1 }}>
                      <Tag color="red">公告</Tag>
                      {item.title}
                    </span>
                    <span style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 12 }}>
                      {item.time}
                    </span>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>

        <Card title="快捷入口" className="card-shadow" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            {quickEntries.map((entry, index) => (
              <Col span={4} key={index}>
                <div
                  className="hover-card"
                  style={{
                    textAlign: 'center',
                    padding: '24px 16px',
                    background: '#fff',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: '1px solid #f0f0f0'
                  }}
                  onClick={() => navigate(entry.path)}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: entry.color + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      fontSize: 28,
                      color: entry.color
                    }}
                  >
                    {entry.icon}
                  </div>
                  <span style={{ fontWeight: 500 }}>{entry.title}</span>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        <Card
          className="card-shadow"
          style={{ marginBottom: 24 }}
          tabList={categoryTabs}
          tabBarExtraContent={
            <Button type="link" onClick={() => navigate('/services')}>
              查看更多 <ArrowRightOutlined />
            </Button>
          }
        >
          {mockServices.length > 0 ? (
            <Row gutter={[16, 16]}>
              {mockServices.map((service) => (
                <Col span={6} key={service.id}>
                  <ServiceCard service={service} />
                </Col>
              ))}
            </Row>
          ) : (
            <Empty description="暂无服务" />
          )}
        </Card>

        <Row gutter={24} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card
              title="一件事专区"
              className="card-shadow"
              extra={
                <Button type="link" onClick={() => navigate('/scenes')}>
                  更多场景 <ArrowRightOutlined />
                </Button>
              }
            >
              {mockScenes.length > 0 ? (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {mockScenes.map((scene) => (
                    <div
                      key={scene.id}
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
                      onClick={() => navigate(`/scenes/${scene.id}`)}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          fontWeight: 600
                        }}
                      >
                        {scene.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: 16 }}>{scene.name}</h4>
                        <p style={{ margin: 0, color: '#8c8c8c', fontSize: 13 }}>{scene.description}</p>
                        <div style={{ marginTop: 8 }}>
                          <Tag color="blue">{scene.services.length} 个事项</Tag>
                          <Tag color="green">{scene.materials.length} 份材料</Tag>
                        </div>
                      </div>
                      <ArrowRightOutlined style={{ color: '#1890ff' }} />
                    </div>
                  ))}
                </Space>
              ) : (
                <Empty description="暂无场景" />
              )}
            </Card>
          </Col>

          <Col span={12}>
            <Card title="数据看板" className="card-shadow">
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
                    <Statistic title="累计办件" value={125860} suffix="件" />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                    <Statistic title="今日办件" value={328} suffix="件" />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
                    <Statistic title="办结率" value={98.5} suffix="%" />
                  </Card>
                </Col>
              </Row>
              <ReactECharts option={chartOption} style={{ height: 280 }} />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default Home
