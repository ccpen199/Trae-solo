import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Row, Col, Button, Tag, Descriptions, Divider, List, Collapse } from 'antd'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'

const mockPackageDetail = {
  id: '1',
  name: '全面体检套餐A',
  organization: '北京协和医院体检中心',
  address: '北京市东城区帅府园一号',
  price: 1299,
  originalPrice: 1899,
  tags: ['全面检查', '肿瘤筛查', '男女通用'],
  rating: 4.9,
  sales: 12580,
  image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop',
  description: '本套餐包含全面的身体检查项目，适合30-45岁人群进行年度体检。',
  applicablePeople: '30-45岁男女通用，关注健康管理的人群',
  precautions: [
    '体检前一天请注意休息，晚上10点后禁食禁水',
    '体检当天请穿着宽松衣物，便于检查',
    '女性请避开月经期',
    '请携带身份证原件',
    '有慢性病史者请携带相关病历资料',
  ],
  examinationItems: [
    {
      category: '一般检查',
      items: ['身高', '体重', '血压', '脉搏', 'BMI指数'],
    },
    {
      category: '内科检查',
      items: ['心肺听诊', '腹部触诊', '神经系统', '甲状腺'],
    },
    {
      category: '外科检查',
      items: ['皮肤', '淋巴结', '脊柱', '四肢关节', '肛门指诊'],
    },
    {
      category: '眼科检查',
      items: ['视力', '眼压', '眼底检查', '裂隙灯检查'],
    },
    {
      category: '耳鼻喉科',
      items: ['听力', '外耳道', '鼓膜', '鼻腔', '咽喉'],
    },
    {
      category: '血常规',
      items: ['白细胞计数', '红细胞计数', '血红蛋白', '血小板计数'],
    },
    {
      category: '生化检查',
      items: ['肝功能', '肾功能', '血糖', '血脂', '尿酸'],
    },
    {
      category: '肿瘤筛查',
      items: ['AFP甲胎蛋白', 'CEA癌胚抗原', 'CA199', 'CA125'],
    },
    {
      category: '影像学检查',
      items: ['胸部CT', '腹部彩超', '甲状腺彩超', '心电图'],
    },
  ],
  organizationInfo: {
    name: '北京协和医院体检中心',
    level: '三甲医院',
    description: '北京协和医院是集医疗、教学、科研于一体的现代化综合三级甲等医院，是国家卫生健康委指定的全国疑难重症诊治指导中心。',
    workTime: '周一至周六 7:30-10:00（体检时间）',
    phone: '010-69156114',
  },
}

const HealthCheckDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading] = useState(false)

  const handleBooking = () => {
    navigate(`/health-check/booking/${id}`)
  }

  return (
    <div className="space-y-6">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/health-check')}
      >
        返回列表
      </Button>

      <Card className="shadow-sm">
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <img
              src={mockPackageDetail.image}
              alt={mockPackageDetail.name}
              className="w-full h-80 object-cover rounded-lg"
            />
          </Col>
          <Col xs={24} md={12}>
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {mockPackageDetail.name}
                </h1>
                <div className="flex items-center gap-2 mb-2">
                  {mockPackageDetail.tags.map((tag, index) => (
                    <Tag key={index} color="blue">{tag}</Tag>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-gray-500">
                  <span className="text-yellow-500">★ {mockPackageDetail.rating}</span>
                  <span>已售 {mockPackageDetail.sales}</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#f5222d]">¥{mockPackageDetail.price}</span>
                <span className="text-gray-400 line-through text-lg">¥{mockPackageDetail.originalPrice}</span>
                <Tag color="red">省¥{mockPackageDetail.originalPrice - mockPackageDetail.price}</Tag>
              </div>

              <div className="space-y-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <EnvironmentOutlined />
                  <span>{mockPackageDetail.organization}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarOutlined />
                  <span>可预约日期：明日起可约</span>
                </div>
              </div>

              <p className="text-gray-500">{mockPackageDetail.description}</p>

              <div className="pt-4">
                <Button
                  type="primary"
                  size="large"
                  icon={<CalendarOutlined />}
                  onClick={handleBooking}
                  loading={loading}
                  className="w-full md:w-auto px-8 h-12 text-base"
                >
                  立即预约
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="检查项目" className="shadow-sm">
            <Collapse
              defaultActiveKey={['0']}
              ghost
              items={mockPackageDetail.examinationItems.map((category, index) => ({
                key: String(index),
                label: (
                  <span className="font-semibold">
                    {category.category}
                    <Tag color="blue" className="ml-2">{category.items.length}项</Tag>
                  </span>
                ),
                children: (
                  <Row gutter={[8, 8]}>
                    {category.items.map((item, itemIndex) => (
                      <Col span={8} key={itemIndex}>
                        <div className="flex items-center gap-2 text-gray-600">
                          <CheckCircleOutlined className="text-[#52c41a]" />
                          <span>{item}</span>
                        </div>
                      </Col>
                    ))}
                  </Row>
                ),
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8} className="space-y-6">
          <Card title="适用人群" className="shadow-sm">
            <div className="flex items-start gap-2">
              <SafetyOutlined className="text-[#1677ff] mt-1" />
              <p className="text-gray-600">{mockPackageDetail.applicablePeople}</p>
            </div>
          </Card>

          <Card title="注意事项" className="shadow-sm">
            <List
              dataSource={mockPackageDetail.precautions}
              renderItem={(item) => (
                <List.Item className="px-0">
                  <div className="flex items-start gap-2">
                    <ExclamationCircleOutlined className="text-[#fa8c16] mt-1 flex-shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <Card title="机构信息" className="shadow-sm">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="机构名称">
                {mockPackageDetail.organizationInfo.name}
              </Descriptions.Item>
              <Descriptions.Item label="机构等级">
                <Tag color="green">{mockPackageDetail.organizationInfo.level}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="地址">
                {mockPackageDetail.address}
              </Descriptions.Item>
              <Descriptions.Item label="工作时间">
                {mockPackageDetail.organizationInfo.workTime}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {mockPackageDetail.organizationInfo.phone}
              </Descriptions.Item>
            </Descriptions>
            <Divider className="my-3" />
            <p className="text-gray-500 text-sm">
              {mockPackageDetail.organizationInfo.description}
            </p>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default HealthCheckDetail
