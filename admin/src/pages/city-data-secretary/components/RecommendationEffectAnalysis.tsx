import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  List,
  Progress,
  Tag,
  Select,
  DatePicker,
  Space
} from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  LikeOutlined,
  MehOutlined,
  DislikeOutlined,
  StarOutlined,
  FireOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

const RecommendationEffectAnalysis: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d')

  const statsCards = [
    {
      title: '总曝光量',
      value: 1285600,
      suffix: '次',
      trend: '+12.5%',
      trendUp: true,
      color: '#0958d9',
      icon: <FireOutlined />
    },
    {
      title: '点击率',
      value: 12.8,
      suffix: '%',
      trend: '+2.3%',
      trendUp: true,
      color: '#52c41a',
      precision: 1,
      icon: <StarOutlined />
    },
    {
      title: '转化率',
      value: 8.6,
      suffix: '%',
      trend: '+1.5%',
      trendUp: true,
      color: '#faad14',
      precision: 1,
      icon: <StarOutlined />
    },
    {
      title: '收藏率',
      value: 5.2,
      suffix: '%',
      trend: '-0.8%',
      trendUp: false,
      color: '#722ed1',
      precision: 1,
      icon: <StarOutlined />
    }
  ]

  const effectTrendOption = {
    title: {
      text: '推荐效果趋势',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['曝光量', '点击量', '转化量'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['6/9', '6/10', '6/11', '6/12', '6/13', '6/14', '6/15']
    },
    yAxis: [
      {
        type: 'value',
        name: '数量',
        position: 'left'
      },
      {
        type: 'value',
        name: '比率(%)',
        position: 'right',
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '曝光量',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        data: [156800, 168500, 175200, 182600, 169800, 195600, 218500],
        itemStyle: { color: '#0958d9' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(9, 88, 217, 0.3)' },
              { offset: 1, color: 'rgba(9, 88, 217, 0.05)' }
            ]
          }
        }
      },
      {
        name: '点击量',
        type: 'line',
        smooth: true,
        yAxisIndex: 0,
        data: [18200, 20500, 22800, 24200, 21500, 25800, 28900],
        itemStyle: { color: '#52c41a' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }
            ]
          }
        }
      },
      {
        name: '转化率',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: [7.2, 7.8, 8.2, 8.5, 7.9, 8.8, 9.2],
        itemStyle: { color: '#faad14' },
        lineStyle: {
          type: 'dashed'
        }
      }
    ]
  }

  const hotRecommendations = [
    { rank: 1, name: '社保缴费查询', category: '社会保障', clicks: 25680, ctr: '18.5%', conversion: '12.3%' },
    { rank: 2, name: '公积金提取办理', category: '住房公积金', clicks: 22340, ctr: '16.8%', conversion: '15.2%' },
    { rank: 3, name: '医保账户查询', category: '医疗保障', clicks: 19860, ctr: '15.2%', conversion: '8.6%' },
    { rank: 4, name: '身份证补办申请', category: '证照类', clicks: 18520, ctr: '14.8%', conversion: '10.2%' },
    { rank: 5, name: '驾驶证换证', category: '交通出行', clicks: 16280, ctr: '13.5%', conversion: '9.8%' },
    { rank: 6, name: '营业执照办理', category: '市场监管', clicks: 14560, ctr: '12.2%', conversion: '7.5%' },
    { rank: 7, name: '不动产登记查询', category: '自然资源', clicks: 12890, ctr: '11.6%', conversion: '6.8%' },
    { rank: 8, name: '子女教育补贴', category: '教育', clicks: 11230, ctr: '10.8%', conversion: '5.2%' },
    { rank: 9, name: '个人所得税申报', category: '税务', clicks: 10560, ctr: '9.8%', conversion: '4.5%' },
    { rank: 10, name: '养老资格认证', category: '社会保障', clicks: 9820, ctr: '8.5%', conversion: '6.2%' },
    { rank: 11, name: '交通违法处理', category: '交通出行', clicks: 8960, ctr: '7.8%', conversion: '8.9%' },
    { rank: 12, name: '居住证办理', category: '公安', clicks: 8230, ctr: '7.2%', conversion: '5.8%' },
    { rank: 13, name: '医保报销申请', category: '医疗保障', clicks: 7560, ctr: '6.5%', conversion: '4.2%' },
    { rank: 14, name: '公积金贷款查询', category: '住房公积金', clicks: 6890, ctr: '5.8%', conversion: '3.5%' },
    { rank: 15, name: '学历认证', category: '教育', clicks: 6230, ctr: '5.2%', conversion: '2.8%' },
    { rank: 16, name: '企业注册登记', category: '市场监管', clicks: 5860, ctr: '4.8%', conversion: '3.2%' },
    { rank: 17, name: '护照办理', category: '出入境', clicks: 5230, ctr: '4.2%', conversion: '2.5%' },
    { rank: 18, name: '低保申请', category: '民政', clicks: 4860, ctr: '3.8%', conversion: '5.5%' },
    { rank: 19, name: '车辆年检预约', category: '交通出行', clicks: 4520, ctr: '3.5%', conversion: '4.8%' },
    { rank: 20, name: '人才引进补贴', category: '人社', clicks: 4180, ctr: '3.2%', conversion: '2.1%' }
  ]

  const feedbackDistribution = {
    satisfied: 65,
    average: 25,
    dissatisfied: 10
  }

  const feedbackOption = {
    title: {
      text: '用户反馈分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}% ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0
    },
    series: [
      {
        name: '反馈分布',
        type: 'pie',
        radius: ['40%', '60%'],
        center: ['50%', '45%'],
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
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 65, name: '满意' },
          { value: 25, name: '一般' },
          { value: 10, name: '不满意' }
        ],
        color: ['#52c41a', '#faad14', '#ff4d4f']
      }
    ]
  }

  const sceneEffectData = [
    { name: '首页推荐', exposure: '128,560', click: '15,620', ctr: '12.1%', conversion: '8.5%' },
    { name: '事项推荐', exposure: '86,320', click: '12,850', ctr: '14.9%', conversion: '10.2%' },
    { name: '证照提醒', exposure: '32,180', click: '8,250', ctr: '25.6%', conversion: '15.8%' },
    { name: '政策推送', exposure: '0', click: '0', ctr: '0%', conversion: '0%' }
  ]

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank: number) => (
        <span
          style={{
            display: 'inline-block',
            width: 24,
            height: 24,
            lineHeight: '24px',
            textAlign: 'center',
            borderRadius: '50%',
            background: rank <= 3 ? '#0958d9' : '#f0f0f0',
            color: rank <= 3 ? '#fff' : '#666',
            fontWeight: rank <= 3 ? 'bold' : 'normal',
            fontSize: 12
          }}
        >
          {rank}
        </span>
      )
    },
    {
      title: '推荐事项',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>
    },
    {
      title: '点击量',
      dataIndex: 'clicks',
      key: 'clicks',
      sorter: (a: any, b: any) => a.clicks - b.clicks
    },
    {
      title: '点击率',
      dataIndex: 'ctr',
      key: 'ctr',
      sorter: (a: any, b: any) => parseFloat(a.ctr) - parseFloat(b.ctr)
    },
    {
      title: '转化率',
      dataIndex: 'conversion',
      key: 'conversion',
      sorter: (a: any, b: any) => parseFloat(a.conversion) - parseFloat(b.conversion)
    }
  ]

  const categoryEffectOption = {
    title: {
      text: '各分类推荐效果',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['点击率', '转化率'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['证照类', '社会保障', '住房公积金', '医疗保障', '税务', '教育', '交通出行']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '点击率',
        type: 'bar',
        data: [14.8, 18.5, 16.8, 15.2, 9.8, 10.8, 13.5],
        itemStyle: {
          color: '#0958d9',
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '30%'
      },
      {
        name: '转化率',
        type: 'bar',
        data: [10.2, 12.3, 15.2, 8.6, 4.5, 5.2, 9.8],
        itemStyle: {
          color: '#52c41a',
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '30%'
      }
    ]
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 120 }}
            >
              <Option value="7d">近7天</Option>
              <Option value="30d">近30天</Option>
              <Option value="90d">近90天</Option>
            </Select>
            <RangePicker
              defaultValue={[dayjs().subtract(7, 'day'), dayjs()]}
            />
          </Space>
          <Space>
            <a>导出报表</a>
            <a>刷新数据</a>
          </Space>
        </div>

        <Row gutter={16}>
          {statsCards.map((item, index) => (
            <Col xs={12} sm={12} md={6} key={index}>
              <Statistic
                title={item.title}
                value={item.value}
                suffix={item.suffix}
                precision={(item as any).precision}
                valueStyle={{ color: item.color }}
                prefix={React.cloneElement(item.icon, { style: { color: item.color } })}
              />
              <div style={{ marginTop: 8, fontSize: 12 }}>
                {item.trendUp ? (
                  <span style={{ color: '#52c41a' }}>
                    <ArrowUpOutlined /> {item.trend}
                  </span>
                ) : (
                  <span style={{ color: '#ff4d4f' }}>
                    <ArrowDownOutlined /> {item.trend}
                  </span>
                )}
                <span style={{ color: '#999', marginLeft: 8 }}>较上期</span>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card>
            <ReactECharts option={effectTrendOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <ReactECharts option={feedbackOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="热门推荐事项TOP20">
            <Table
              columns={columns}
              dataSource={hotRecommendations}
              rowKey="rank"
              pagination={{ pageSize: 10, size: 'small' }}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="各场景推荐效果" style={{ marginBottom: 16 }}>
            <List
              dataSource={sceneEffectData}
              renderItem={(item) => (
                <List.Item key={item.name}>
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <div style={{ fontSize: 12, color: '#999' }}>
                        曝光：{item.exposure} · 点击：{item.click}
                      </div>
                    }
                  />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#0958d9' }}>CTR {item.ctr}</div>
                    <div style={{ fontSize: 12, color: '#52c41a' }}>转化 {item.conversion}</div>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <Card title="用户满意度">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LikeOutlined style={{ color: '#52c41a' }} />
                  <span>满意</span>
                </span>
                <span style={{ color: '#52c41a', fontWeight: 500 }}>{feedbackDistribution.satisfied}%</span>
              </div>
              <Progress percent={feedbackDistribution.satisfied} strokeColor="#52c41a" showInfo={false} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MehOutlined style={{ color: '#faad14' }} />
                  <span>一般</span>
                </span>
                <span style={{ color: '#faad14', fontWeight: 500 }}>{feedbackDistribution.average}%</span>
              </div>
              <Progress percent={feedbackDistribution.average} strokeColor="#faad14" showInfo={false} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DislikeOutlined style={{ color: '#ff4d4f' }} />
                  <span>不满意</span>
                </span>
                <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{feedbackDistribution.dissatisfied}%</span>
              </div>
              <Progress percent={feedbackDistribution.dissatisfied} strokeColor="#ff4d4f" showInfo={false} />
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <ReactECharts option={categoryEffectOption} style={{ height: 320 }} />
      </Card>
    </div>
  )
}

export default RecommendationEffectAnalysis
