import { useState } from 'react'
import { Card, Row, Col, Progress, List, Tag, Button, Modal } from 'antd'
import {
  HeartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileTextOutlined,
  EyeOutlined,
  BellOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'

const mockHealthData = {
  healthScore: 85,
  scoreLevel: '良好',
  keyIndicators: [
    {
      id: 'bloodPressure',
      name: '血压',
      value: '118/78 mmHg',
      normal: '正常',
      status: 'normal',
      trend: 'down',
      icon: '❤️',
    },
    {
      id: 'bloodSugar',
      name: '血糖',
      value: '5.6 mmol/L',
      normal: '正常',
      status: 'normal',
      trend: 'stable',
      icon: '🩸',
    },
    {
      id: 'bmi',
      name: 'BMI',
      value: '23.5',
      normal: '正常',
      status: 'normal',
      trend: 'stable',
      icon: '⚖️',
    },
    {
      id: 'heartRate',
      name: '心率',
      value: '72 次/分',
      normal: '正常',
      status: 'normal',
      trend: 'stable',
      icon: '💓',
    },
    {
      id: 'cholesterol',
      name: '胆固醇',
      value: '5.2 mmol/L',
      normal: '偏高',
      status: 'warning',
      trend: 'up',
      icon: '🧪',
    },
    {
      id: 'liver',
      name: '肝功能',
      value: '正常',
      normal: '正常',
      status: 'normal',
      trend: 'stable',
      icon: '🫀',
    },
  ],
  healthTrend: {
    months: ['1月', '2月', '3月', '4月', '5月', '6月'],
    bloodPressure: [125, 122, 120, 119, 118, 118],
    bloodSugar: [5.8, 5.7, 5.6, 5.7, 5.5, 5.6],
    bmi: [24.0, 23.8, 23.6, 23.5, 23.6, 23.5],
  },
  reports: [
    {
      id: '1',
      date: '2024-05-15',
      name: '2024年度体检报告',
      hospital: '北京协和医院',
      type: '全面体检',
      abnormalItems: ['胆固醇偏高', '轻度脂肪肝'],
      status: '有异常',
    },
    {
      id: '2',
      date: '2023-12-20',
      name: '2023年度体检报告',
      hospital: '北京协和医院',
      type: '全面体检',
      abnormalItems: [],
      status: '全部正常',
    },
    {
      id: '3',
      date: '2023-06-10',
      name: '入职体检报告',
      hospital: '北京301医院',
      type: '入职体检',
      abnormalItems: ['甲状腺结节（建议复查）'],
      status: '有异常',
    },
  ],
}

const HealthArchive = () => {
  const [viewingReport, setViewingReport] = useState<string | null>(null)

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a'
    if (score >= 80) return '#1677ff'
    if (score >= 60) return '#fa8c16'
    return '#f5222d'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return '#52c41a'
      case 'warning':
        return '#fa8c16'
      case 'danger':
        return '#f5222d'
      default:
        return '#999'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpOutlined className="text-[#f5222d]" />
      case 'down':
        return <ArrowDownOutlined className="text-[#52c41a]" />
      default:
        return <span className="text-gray-400">—</span>
    }
  }

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
      data: ['血压(收缩压)', '血糖', 'BMI'],
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: mockHealthData.healthTrend.months,
    },
    yAxis: [
      {
        type: 'value',
        name: '血压/血糖',
        position: 'left',
      },
      {
        type: 'value',
        name: 'BMI',
        position: 'right',
      },
    ],
    series: [
      {
        name: '血压(收缩压)',
        type: 'line',
        data: mockHealthData.healthTrend.bloodPressure,
        itemStyle: { color: '#1677ff' },
        smooth: true,
        yAxisIndex: 0,
      },
      {
        name: '血糖',
        type: 'line',
        data: mockHealthData.healthTrend.bloodSugar,
        itemStyle: { color: '#52c41a' },
        smooth: true,
        yAxisIndex: 0,
      },
      {
        name: 'BMI',
        type: 'line',
        data: mockHealthData.healthTrend.bmi,
        itemStyle: { color: '#fa8c16' },
        smooth: true,
        yAxisIndex: 1,
      },
    ],
  }

  const handleViewReport = (reportId: string) => {
    setViewingReport(reportId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">健康档案</h2>
        <Button type="primary" icon={<FileTextOutlined />}>
          上传体检报告
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card className="text-center h-full">
            <div className="mb-4">
              <div className="relative inline-block">
                <Progress
                  type="dashboard"
                  percent={mockHealthData.healthScore}
                  width={160}
                  strokeColor={getScoreColor(mockHealthData.healthScore)}
                  format={(percent) => (
                    <div className="text-center">
                      <div className="text-4xl font-bold" style={{ color: getScoreColor(percent || 0) }}>
                        {percent}
                      </div>
                      <div className="text-sm text-gray-500">分</div>
                    </div>
                  )}
                />
              </div>
              <h3 className="text-xl font-bold mt-4" style={{ color: getScoreColor(mockHealthData.healthScore) }}>
                {mockHealthData.scoreLevel}
              </h3>
              <p className="text-gray-500 mt-2">您的整体健康状况良好，请继续保持</p>
            </div>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#52c41a]">12</div>
                <div className="text-sm text-gray-500">正常指标</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#fa8c16]">2</div>
                <div className="text-sm text-gray-500">异常指标</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#1677ff]">3</div>
                <div className="text-sm text-gray-500">体检报告</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="关键指标" className="h-full">
            <Row gutter={[16, 16]}>
              {mockHealthData.keyIndicators.map((indicator) => (
                <Col xs={12} md={8} key={indicator.id}>
                  <div className="p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{indicator.icon}</span>
                      {getTrendIcon(indicator.trend)}
                    </div>
                    <div className="text-gray-500 text-sm mb-1">{indicator.name}</div>
                    <div className="text-xl font-bold text-gray-800 mb-1">{indicator.value}</div>
                    <Tag color={getStatusColor(indicator.status)}>
                      {indicator.normal}
                    </Tag>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Card>
        <ReactECharts option={trendChartOption} style={{ height: '400px' }} />
      </Card>

      <Card
        title={
          <div className="flex items-center justify-between">
            <span>历史体检报告</span>
            <Button type="link" size="small">
              查看全部 <ArrowRightOutlined />
            </Button>
          </div>
        }
      >
        <List
          dataSource={mockHealthData.reports}
          renderItem={(report) => (
            <List.Item
              actions={[
              <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewReport(report.id)}>
                查看详情
              </Button>,
            ]}
            >
              <List.Item.Meta
                avatar={<HeartOutlined className="text-2xl text-[#1677ff]" />}
                title={
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{report.name}</span>
                    <Tag color={report.abnormalItems.length > 0 ? 'orange' : 'green'}>
                      {report.status}
                    </Tag>
                  </div>
                }
                description={
                  <div className="space-y-1">
                    <div className="text-gray-500">
                      {report.hospital} · {report.type} · {report.date}
                    </div>
                    {report.abnormalItems.length > 0 && (
                      <div className="flex items-center gap-2">
                      <BellOutlined className="text-[#fa8c16]" />
                        <span className="text-[#fa8c16] text-sm">
                          异常项：{report.abnormalItems.join('、')}
                        </span>
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="体检报告详情"
        open={!!viewingReport}
        onCancel={() => setViewingReport(null)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setViewingReport(null)}>
            关闭
          </Button>,
        ]}
      >
        {viewingReport && (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-bold text-[#1677ff]">2024年度体检报告</h4>
              <p className="text-gray-500">北京协和医院 · 2024-05-15</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="text-gray-500 text-sm">一般检查</div>
                <div className="font-semibold">全部正常</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-gray-500 text-sm">血常规</div>
                <div className="font-semibold">全部正常</div>
              </div>
              <div className="p-3 border rounded-lg border-orange-200 bg-orange-50">
                <div className="text-gray-500 text-sm">生化检查</div>
                <div className="font-semibold text-[#fa8c16]">胆固醇偏高</div>
              </div>
              <div className="p-3 border rounded-lg border-orange-200 bg-orange-50">
                <div className="text-gray-500 text-sm">腹部彩超</div>
                <div className="font-semibold text-[#fa8c16]">轻度脂肪肝</div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h5 className="font-semibold mb-2">医生建议</h5>
              <ul className="space-y-1 text-gray-600">
                <li>• 建议控制饮食，减少高脂肪、高胆固醇食物摄入</li>
                <li>• 增加有氧运动，每周至少3次，每次30分钟以上</li>
                <li>• 定期复查血脂和肝脏彩超</li>
                <li>• 保持规律作息，避免熬夜</li>
              </ul>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default HealthArchive
