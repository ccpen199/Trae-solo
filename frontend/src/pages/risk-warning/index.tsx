import { useState } from 'react'
import { Card, Row, Col, List, Tag, Button, Progress, Empty, Tabs, Alert } from 'antd'
import {
  WarningOutlined,
  BellOutlined,
  CheckCircleOutlined,
  HeartOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
  SafetyOutlined,
} from '@ant-design/icons'

const mockWarnings = [
  {
    id: '1',
    type: 'high',
    title: '胆固醇偏高风险预警',
    description: '您最近两次体检胆固醇指标均高于正常值，建议调整饮食结构并增加运动',
    category: '心血管',
    date: '2024-05-20',
    read: false,
    suggestions: [
      '减少高脂肪、高胆固醇食物摄入',
      '每周至少3次有氧运动，每次30分钟',
      '3个月后复查血脂',
      '必要时咨询心内科医生',
    ],
  },
  {
    id: '2',
    type: 'medium',
    title: '脂肪肝健康提醒',
    description: '腹部彩超显示轻度脂肪肝，建议控制体重并戒酒',
    category: '消化系统',
    date: '2024-05-18',
    read: false,
    suggestions: [
      '控制体重，BMI保持在18.5-23.9',
      '戒酒或限制饮酒',
      '低脂低糖饮食',
      '定期复查肝功能和肝脏彩超',
    ],
  },
  {
    id: '3',
    type: 'low',
    title: '甲状腺结节随访提醒',
    description: '甲状腺超声发现结节，TI-RADS 3类，建议6个月后复查',
    category: '内分泌',
    date: '2024-05-10',
    read: true,
    suggestions: [
      '每6个月复查甲状腺彩超',
      '检查甲状腺功能',
      '如结节增大或形态改变及时就医',
    ],
  },
  {
    id: '4',
    type: 'medium',
    title: '血压波动注意事项',
    description: '近期血压监测显示波动较大，建议每日定时测量并记录',
    category: '心血管',
    date: '2024-05-05',
    read: true,
    suggestions: [
      '每日早中晚各测量一次血压',
      '保持低盐饮食',
      '避免情绪激动和过度劳累',
      '如持续偏高请及时就医',
    ],
  },
]

const mockRiskAssessment = {
  overallRisk: 'medium',
  overallScore: 65,
  categories: [
    { name: '心血管风险', score: 70, level: 'medium' },
    { name: '代谢风险', score: 60, level: 'medium' },
    { name: '肿瘤风险', score: 30, level: 'low' },
    { name: '糖尿病风险', score: 45, level: 'low' },
  ],
}

const RiskWarning = () => {
  const [activeTab, setActiveTab] = useState('all')

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return '#f5222d'
      case 'medium':
        return '#fa8c16'
      case 'low':
        return '#faad14'
      default:
        return '#999'
    }
  }

  const getRiskText = (level: string) => {
    switch (level) {
      case 'high':
        return '高风险'
      case 'medium':
        return '中风险'
      case 'low':
        return '低风险'
      default:
        return '未知'
    }
  }

  const filteredWarnings = activeTab === 'all'
    ? mockWarnings
    : activeTab === 'unread'
    ? mockWarnings.filter((w) => !w.read)
    : mockWarnings.filter((w) => w.read)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">风险预警</h2>
        <div className="flex items-center gap-2">
          <Tag color="red">
            <WarningOutlined /> {mockWarnings.filter((w) => !w.read).length} 条未读
          </Tag>
        </div>
      </div>

      {mockWarnings.filter((w) => !w.read).length > 0 && (
        <Alert
          message={`您有 ${mockWarnings.filter((w) => !w.read).length} 条新的健康风险预警，请及时查看`}
          type="warning"
          showIcon
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="整体风险评估" className="h-full">
            <div className="text-center mb-6">
              <Progress
                type="dashboard"
                percent={mockRiskAssessment.overallScore}
                strokeColor={getRiskColor(mockRiskAssessment.overallRisk)}
                width={160}
                format={(percent) => (
                  <div className="text-center">
                    <div className="text-3xl font-bold" style={{ color: getRiskColor(mockRiskAssessment.overallRisk) }}>
                      {percent}
                    </div>
                    <div className="text-sm text-gray-500">风险指数</div>
                  </div>
                )}
              />
              <Tag color={getRiskColor(mockRiskAssessment.overallRisk)} className="mt-4">
                <ExclamationCircleOutlined /> {getRiskText(mockRiskAssessment.overallRisk)}
              </Tag>
            </div>
            <div className="space-y-4">
              {mockRiskAssessment.categories.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">{item.name}</span>
                    <span style={{ color: getRiskColor(item.level) }}>
                      {item.score}分 · {getRiskText(item.level)}
                    </span>
                  </div>
                  <Progress
                    percent={item.score}
                    strokeColor={getRiskColor(item.level)}
                    showInfo={false}
                    size="small"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                size="small"
                items={[
                  { key: 'all', label: `全部 (${mockWarnings.length})` },
                  { key: 'unread', label: `未读 (${mockWarnings.filter((w) => !w.read).length})` },
                  { key: 'read', label: `已读 (${mockWarnings.filter((w) => w.read).length})` },
                ]}
              />
            }
            bodyStyle={{ paddingTop: 0 }}
          >
            {filteredWarnings.length === 0 ? (
              <Empty description="暂无预警信息" />
            ) : (
              <List
                dataSource={filteredWarnings}
                renderItem={(item) => (
                  <List.Item
                    className={`p-4 rounded-lg mb-3 ${!item.read ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}
                    actions={[
                      <Button type="link" size="small">
                        查看详情 <ArrowRightOutlined />
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${getRiskColor(item.type)}20` }}
                        >
                          <WarningOutlined style={{ color: getRiskColor(item.type) }} />
                        </div>
                      }
                      title={
                        <div className="flex items-center gap-2">
                          {!item.read && <BellOutlined className="text-[#1677ff]" />}
                          <span className="font-semibold">{item.title}</span>
                          <Tag color={getRiskColor(item.type)}>
                            {getRiskText(item.type)}
                          </Tag>
                          <Tag color="blue">{item.category}</Tag>
                        </div>
                      }
                      description={
                        <div className="space-y-2">
                          <p className="text-gray-600">{item.description}</p>
                          <p className="text-gray-400 text-sm">{item.date}</p>
                          <div className="flex flex-wrap gap-2">
                            {item.suggestions.slice(0, 2).map((s, i) => (
                              <Tag key={i} color="green" icon={<CheckCircleOutlined />}>
                                {s}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card title="健康建议">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div className="p-4 bg-blue-50 rounded-lg h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <HeartOutlined className="text-[#1677ff] text-xl" />
                </div>
                <h4 className="font-semibold">心血管健康</h4>
              </div>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• 每周至少150分钟中等强度有氧运动</li>
                <li>• 戒烟限酒，避免被动吸烟</li>
                <li>• 低盐低脂饮食，每日盐摄入不超过5g</li>
                <li>• 定期监测血压、血脂、血糖</li>
              </ul>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="p-4 bg-green-50 rounded-lg h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <SafetyOutlined className="text-[#52c41a] text-xl" />
                </div>
                <h4 className="font-semibold">营养管理</h4>
              </div>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• 每日蔬菜摄入300-500g，水果200-350g</li>
                <li>• 主食粗细搭配，全谷物占1/3以上</li>
                <li>• 每日饮水1500-1700ml</li>
                <li>• 控制添加糖摄入，每日不超过50g</li>
              </ul>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="p-4 bg-orange-50 rounded-lg h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <CheckCircleOutlined className="text-[#fa8c16] text-xl" />
                </div>
                <h4 className="font-semibold">生活方式</h4>
              </div>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• 每日睡眠7-8小时，避免熬夜</li>
                <li>• 避免久坐，每小时起身活动5分钟</li>
                <li>• 保持良好心态，及时调节压力</li>
                <li>• 定期健康体检，建议每年一次</li>
              </ul>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default RiskWarning
