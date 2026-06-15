import React, { useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  List,
  Avatar,
  Button,
  Space,
  Badge
} from 'antd'
import {
  AppstoreOutlined,
  FileTextOutlined,
  CustomerServiceOutlined,
  AuditOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FallOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileDoneOutlined,
  FundOutlined,
  ReadOutlined,
  StarOutlined,
  DatabaseOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { useUserStore } from '@/store/user'
import './style.css'

const { Title, Text } = Typography

const Dashboard: React.FC = () => {
  const { userInfo } = useUserStore()

  const today = dayjs().format('YYYY年MM月DD日 dddd')
  const greeting = useMemo(() => {
    const hour = dayjs().hour()
    if (hour < 6) return '凌晨好'
    if (hour < 12) return '早上好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }, [])

  const lineChartOption = {
    title: {
      text: '近7天办件量趋势',
      left: 'left',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#1f1f1f' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f1f1f' }
    },
    legend: {
      data: ['受理量', '办结量', '在办量'],
      right: 0,
      top: 0,
      icon: 'circle'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280' }
    },
    series: [
      {
        name: '受理量',
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 90, 230, 210],
        itemStyle: { color: '#0958d9' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(9, 88, 217, 0.25)' },
              { offset: 1, color: 'rgba(9, 88, 217, 0.02)' }
            ]
          }
        }
      },
      {
        name: '办结量',
        type: 'line',
        smooth: true,
        data: [100, 120, 90, 120, 80, 200, 190],
        itemStyle: { color: '#52c41a' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82, 196, 26, 0.25)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.02)' }
            ]
          }
        }
      },
      {
        name: '在办量',
        type: 'line',
        smooth: true,
        data: [20, 12, 11, 14, 10, 30, 20],
        itemStyle: { color: '#faad14' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(250, 173, 20, 0.25)' },
              { offset: 1, color: 'rgba(250, 173, 20, 0.02)' }
            ]
          }
        }
      }
    ]
  }

  const barChartOption = {
    title: {
      text: '委办局办件量排名 Top10',
      left: 'left',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#1f1f1f' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f1f1f' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280' }
    },
    yAxis: {
      type: 'category',
      data: [
        '自然资源厅',
        '市场监管厅',
        '公安厅',
        '住房城乡建设厅',
        '人力资源社会保障厅',
        '卫生健康委',
        '教育厅',
        '税务局',
        '民政厅',
        '交通运输厅'
      ].reverse(),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 12 }
    },
    series: [
      {
        name: '办件量',
        type: 'bar',
        data: [320, 450, 580, 620, 680, 720, 780, 850, 920, 1048].reverse(),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#0958d9' },
              { offset: 1, color: '#4096ff' }
            ]
          },
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: 16
      }
    ]
  }

  const pieChartOption = {
    title: {
      text: '12345工单类型分布',
      left: 'left',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#1f1f1f' }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f1f1f' }
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      icon: 'circle'
    },
    series: [
      {
        name: '工单数量',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold',
            formatter: '{b}\n{c}件'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 450, name: '投诉', itemStyle: { color: '#ff4d4f' } },
          { value: 320, name: '建议', itemStyle: { color: '#1890ff' } },
          { value: 580, name: '咨询', itemStyle: { color: '#52c41a' } },
          { value: 260, name: '求助', itemStyle: { color: '#faad14' } },
          { value: 120, name: '表扬', itemStyle: { color: '#722ed1' } }
        ]
      }
    ]
  }

  const quickEntries = [
    { key: 'services', icon: <AppstoreOutlined />, title: '事项管理', desc: '政务服务事项配置', color: '#0958d9' },
    { key: 'certificates', icon: <SafetyCertificateOutlined />, title: '证照库', desc: '电子证照管理', color: '#52c41a' },
    { key: 'tickets', icon: <CustomerServiceOutlined />, title: '工单处理', desc: '12345工单办理', color: '#faad14' },
    { key: 'audit-logs', icon: <AuditOutlined />, title: '审计查询', desc: '操作审计追溯', color: '#722ed1' },
    { key: 'departments', icon: <BankOutlined />, title: '委办局接入', desc: '部门系统对接', color: '#13c2c2' }
  ]

  const todoList = [
    { id: 1, title: '关于优化营商环境的提案', type: '投诉工单', time: '10分钟前', priority: 'high' },
    { id: 2, title: '身份证办理进度查询', type: '咨询工单', time: '30分钟前', priority: 'medium' },
    { id: 3, title: '营业执照变更申请', type: '办件事项', time: '1小时前', priority: 'normal' },
    { id: 4, title: '社保缴费证明打印', type: '办件事项', time: '2小时前', priority: 'normal' },
    { id: 5, title: '社区便民服务中心建设建议', type: '建议工单', time: '3小时前', priority: 'low' }
  ]

  const noticeList = [
    { id: 1, title: '关于2024年政务服务能力提升培训的通知', time: '今天 09:30', type: '通知' },
    { id: 2, title: '系统升级维护公告（本周五晚）', time: '昨天 16:45', type: '公告' },
    { id: 3, title: '一季度政务服务质量考核结果通报', time: '3天前', type: '通报' },
    { id: 4, title: '新版电子证照系统上线试运行通知', time: '5天前', type: '通知' }
  ]

  const recommendServices = [
    { id: 1, title: '身份证办理', count: 12580, hot: true },
    { id: 2, title: '社保查询', count: 9860, hot: true },
    { id: 3, title: '公积金提取', count: 7650, hot: false },
    { id: 4, title: '营业执照办理', count: 5420, hot: false },
    { id: 5, title: '医保报销', count: 4890, hot: false },
    { id: 6, title: '不动产登记', count: 3560, hot: false }
  ]

  const dataAssets = [
    { name: '社保', icon: <FundOutlined />, count: '1,258万', color: '#0958d9' },
    { name: '公积金', icon: <BankOutlined />, count: '896万', color: '#52c41a' },
    { name: '医保', icon: <SafetyCertificateOutlined />, count: '1,432万', color: '#eb2f96' },
    { name: '税务', icon: <FileTextOutlined />, count: '768万', color: '#fa8c16' },
    { name: '证照', icon: <FileDoneOutlined />, count: '3,256万', color: '#722ed1' },
    { name: '教育', icon: <ReadOutlined />, count: '520万', color: '#13c2c2' },
    { name: '交通', icon: <ThunderboltOutlined />, count: '680万', color: '#1890ff' }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red'
      case 'medium':
        return 'orange'
      case 'low':
        return 'green'
      default:
        return 'default'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '紧急'
      case 'medium':
        return '重要'
      case 'low':
        return '普通'
      default:
        return '一般'
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="welcome-section">
          <div className="welcome-text">
            <Title level={3} className="welcome-title">
              {greeting}，{userInfo?.name || '管理员'}
              <Tag color="blue" className="role-tag">
                超级管理员
              </Tag>
            </Title>
            <Text type="secondary" className="welcome-date">
              <ClockCircleOutlined /> {today} · 祝您工作愉快
            </Text>
          </div>
        </div>
        <div className="quick-actions">
          <Space size="small">
            <Button icon={<BellOutlined />}>消息中心</Button>
            <Button type="primary" icon={<ThunderboltOutlined />}>
              快速办件
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-1" bordered={false}>
            <div className="stat-card-header">
              <div className="stat-info">
                <Text type="secondary" className="stat-title">
                  今日办件量
                </Text>
                <div className="stat-value">
                  <span className="stat-number">128</span>
                  <span className="stat-unit">件</span>
                </div>
              </div>
              <div className="stat-icon">
                <AppstoreOutlined />
              </div>
            </div>
            <div className="stat-detail">
              <div className="detail-item">
                <Text type="secondary">受理</Text>
                <Text strong className="detail-value">
                  156
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">办结</Text>
                <Text strong className="detail-value success">
                  105
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">在办</Text>
                <Text strong className="detail-value warning">
                  23
                </Text>
              </div>
            </div>
            <div className="stat-trend">
              <span className="trend-up">
                <RiseOutlined /> 较昨日 +12.5%
              </span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-2" bordered={false}>
            <div className="stat-card-header">
              <div className="stat-info">
                <Text type="secondary" className="stat-title">
                  电子证照调用量
                </Text>
                <div className="stat-value">
                  <span className="stat-number">3,846</span>
                  <span className="stat-unit">次</span>
                </div>
              </div>
              <div className="stat-icon">
                <SafetyCertificateOutlined />
              </div>
            </div>
            <div className="stat-detail">
              <div className="detail-item">
                <Text type="secondary">今日</Text>
                <Text strong className="detail-value">
                  3,846
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">累计</Text>
                <Text strong className="detail-value">
                  125.8万
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">证照类</Text>
                <Text strong className="detail-value info">
                  32类
                </Text>
              </div>
            </div>
            <div className="stat-trend">
              <span className="trend-up">
                <RiseOutlined /> 较上周 +8.3%
              </span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-3" bordered={false}>
            <div className="stat-card-header">
              <div className="stat-info">
                <Text type="secondary" className="stat-title">
                  12345工单满意度
                </Text>
                <div className="stat-value">
                  <span className="stat-number">98.6</span>
                  <span className="stat-unit">%</span>
                </div>
              </div>
              <div className="stat-icon">
                <CustomerServiceOutlined />
              </div>
            </div>
            <div className="stat-detail">
              <div className="detail-item">
                <Text type="secondary">待办工单</Text>
                <Text strong className="detail-value warning">
                  47
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">已办工单</Text>
                <Text strong className="detail-value success">
                  1,256
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">按时办结率</Text>
                <Text strong className="detail-value info">
                  99.2%
                </Text>
              </div>
            </div>
            <div className="stat-trend">
              <span className="trend-up">
                <RiseOutlined /> 较上月 +1.2%
              </span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-4" bordered={false}>
            <div className="stat-card-header">
              <div className="stat-info">
                <Text type="secondary" className="stat-title">
                  90天审计告警
                </Text>
                <div className="stat-value">
                  <span className="stat-number">23</span>
                  <span className="stat-unit">条</span>
                </div>
              </div>
              <div className="stat-icon">
                <AuditOutlined />
              </div>
            </div>
            <div className="stat-detail">
              <div className="detail-item">
                <Text type="secondary">异常操作</Text>
                <Text strong className="detail-value danger">
                  23
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">总操作数</Text>
                <Text strong className="detail-value">
                  45,860
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">风险等级</Text>
                <Tag color="green" className="risk-tag">
                  低风险
                </Tag>
              </div>
            </div>
            <div className="stat-trend">
              <span className="trend-down">
                <FallOutlined /> 较上周期 -15.3%
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="quick-entry-card" bordered={false} style={{ marginBottom: 16 }}>
        <div className="card-header">
          <Title level={5} className="card-title">
            <ThunderboltOutlined className="title-icon" /> 快捷入口
          </Title>
          <a className="more-link">
            更多 <ArrowRightOutlined />
          </a>
        </div>
        <div className="quick-entry-grid">
          {quickEntries.map((item) => (
            <div key={item.key} className="quick-entry-item">
              <div className="entry-icon" style={{ background: `${item.color}15`, color: item.color }}>
                {item.icon}
              </div>
              <div className="entry-info">
                <Text strong className="entry-title">
                  {item.title}
                </Text>
                <Text type="secondary" className="entry-desc">
                  {item.desc}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card className="chart-card" bordered={false} style={{ marginBottom: 16 }}>
            <ReactECharts option={lineChartOption} style={{ height: 320 }} />
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card className="chart-card" bordered={false}>
                <ReactECharts option={barChartOption} style={{ height: 320 }} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card className="chart-card" bordered={false}>
                <ReactECharts option={pieChartOption} style={{ height: 320 }} />
              </Card>
            </Col>
          </Row>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="side-card" bordered={false} style={{ marginBottom: 16 }}>
            <div className="card-header">
              <Title level={5} className="card-title">
                <ClockCircleOutlined className="title-icon" /> 我的待办
                <Badge count={5} size="small" style={{ marginLeft: 8 }} />
              </Title>
              <a className="more-link">
                全部 <ArrowRightOutlined />
              </a>
            </div>
            <List
              dataSource={todoList}
              renderItem={(item) => (
                <List.Item className="todo-item">
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={
                          item.priority === 'high' ? (
                            <WarningOutlined />
                          ) : (
                            <FileTextOutlined />
                          )
                        }
                        style={{
                          backgroundColor:
                            item.priority === 'high' ? '#fff1f0' : '#e6f7ff',
                          color: item.priority === 'high' ? '#ff4d4f' : '#1890ff'
                        }}
                      />
                    }
                    title={
                      <div className="todo-title">
                        <span className="todo-text">{item.title}</span>
                        <Tag color={getPriorityColor(item.priority)} className="todo-priority">
                          {getPriorityText(item.priority)}
                        </Tag>
                      </div>
                    }
                    description={
                      <div className="todo-meta">
                        <Text type="secondary">{item.type}</Text>
                        <Text type="secondary">{item.time}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card className="side-card" bordered={false} style={{ marginBottom: 16 }}>
            <div className="card-header">
              <Title level={5} className="card-title">
                <BellOutlined className="title-icon" /> 最新公告
              </Title>
              <a className="more-link">
                更多 <ArrowRightOutlined />
              </a>
            </div>
            <List
              dataSource={noticeList}
              renderItem={(item) => (
                <List.Item className="notice-item">
                  <List.Item.Meta
                    title={
                      <div className="notice-title">
                        <Tag color={item.type === '公告' ? 'red' : item.type === '通报' ? 'orange' : 'blue'}>
                          {item.type}
                        </Tag>
                        <span className="notice-text">{item.title}</span>
                      </div>
                    }
                    description={<Text type="secondary">{item.time}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card className="side-card" bordered={false} style={{ marginBottom: 16 }}>
            <div className="card-header">
              <Title level={5} className="card-title">
                <StarOutlined className="title-icon" /> 热门服务推荐
              </Title>
            </div>
            <div className="recommend-grid">
              {recommendServices.map((item) => (
                <div key={item.id} className="recommend-item">
                  <div className="recommend-icon">
                    <AppstoreOutlined />
                  </div>
                  <div className="recommend-info">
                    <Text className="recommend-title">
                      {item.title}
                      {item.hot && <span className="hot-tag">HOT</span>}
                    </Text>
                    <Text type="secondary" className="recommend-count">
                      {item.count}人已办
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="data-assets-card" bordered={false}>
        <div className="card-header">
          <Title level={5} className="card-title">
            <DatabaseOutlined className="title-icon" /> 数据资产概览
          </Title>
        </div>
        <div className="data-assets-grid">
          {dataAssets.map((asset, index) => (
            <div key={index} className="data-asset-item">
              <div className="asset-icon" style={{ background: `${asset.color}15`, color: asset.color }}>
                {asset.icon}
              </div>
              <div className="asset-info">
                <Text strong className="asset-name">
                  {asset.name}
                </Text>
                <Text className="asset-count" style={{ color: asset.color }}>
                  {asset.count}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
