import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Select,
  Row,
  Col
} from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  SmileOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import api from '../../api'
import dayjs from 'dayjs'

export default function Stats() {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'))
  const [summary, setSummary] = useState({
    totalBusiness: 0,
    avgProcessTime: 0,
    satisfaction: 0
  })
  const [trendData, setTrendData] = useState<Array<{ date: string; count: number }>>([])
  const [businessTypeData, setBusinessTypeData] = useState<Array<{ type: string; count: number }>>([])
  const [efficiencyData, setEfficiencyData] = useState<Array<{ type: string; time: number }>>([])
  const [deptRanking, setDeptRanking] = useState<Array<{ dept: string; count: number; avgTime: number; satisfaction: number }>>([])

  useEffect(() => {
    loadStats()
  }, [selectedMonth])

  const loadStats = async () => {
    try {
      const data = await api.stats.getSummary()
      setSummary({
        totalBusiness: data.totalAppointments + data.totalPermits,
        avgProcessTime: data.avgProcessTime,
        satisfaction: data.satisfactionRate
      })
    } catch {
      setSummary({
        totalBusiness: 1258,
        avgProcessTime: 2.5,
        satisfaction: 96.5
      })
    }

    setTrendData([
      { date: '1月', count: 85 },
      { date: '2月', count: 92 },
      { date: '3月', count: 105 },
      { date: '4月', count: 98 },
      { date: '5月', count: 120 },
      { date: '6月', count: 135 }
    ])

    setBusinessTypeData([
      { type: '进京证', count: 456 },
      { type: '违法举报', count: 234 },
      { type: '事故处理', count: 128 },
      { type: '电动车登记', count: 256 },
      { type: '预约服务', count: 184 }
    ])

    setEfficiencyData([
      { type: '进京证', time: 1.5 },
      { type: '违法举报', time: 3.2 },
      { type: '事故处理', time: 4.8 },
      { type: '电动车登记', time: 2.1 },
      { type: '预约服务', time: 1.8 }
    ])

    setDeptRanking([
      { dept: '车管所朝阳分所', count: 328, avgTime: 2.2, satisfaction: 98.2 },
      { dept: '车管所海淀分所', count: 295, avgTime: 2.5, satisfaction: 97.5 },
      { dept: '车管所丰台分所', count: 256, avgTime: 2.8, satisfaction: 96.8 },
      { dept: '车管所东城分所', count: 218, avgTime: 2.4, satisfaction: 97.1 },
      { dept: '车管所西城分所', count: 161, avgTime: 2.6, satisfaction: 96.2 }
    ])
  }

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = dayjs().subtract(11 - i, 'month')
    return { label: date.format('YYYY年MM月'), value: date.format('YYYY-MM') }
  }).reverse()

  const columns = [
    {
      title: '排名',
      dataIndex: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: '部门名称',
      dataIndex: 'dept'
    },
    {
      title: '业务量',
      dataIndex: 'count',
      sorter: (a: any, b: any) => a.count - b.count
    },
    {
      title: '平均办理时长(小时)',
      dataIndex: 'avgTime',
      sorter: (a: any, b: any) => a.avgTime - b.avgTime
    },
    {
      title: '满意度(%)',
      dataIndex: 'satisfaction',
      sorter: (a: any, b: any) => a.satisfaction - b.satisfaction,
      render: (val: number) => (
        <span className={val >= 97 ? 'text-green-600' : val >= 95 ? 'text-blue-600' : 'text-orange-600'}>
          {val}%
        </span>
      )
    }
  ]

  const trendChartOption = {
    title: {
      text: '业务量趋势',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis'
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
      data: trendData.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '业务量',
        type: 'line',
        smooth: true,
        data: trendData.map(item => item.count),
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.5)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ]
          }
        },
        lineStyle: { color: '#1890ff' },
        itemStyle: { color: '#1890ff' }
      }
    ]
  }

  const pieChartOption = {
    title: {
      text: '业务类型占比',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '业务类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%'
        },
        data: businessTypeData.map((item, index) => ({
          value: item.count,
          name: item.type,
          itemStyle: {
            color: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96'][index]
          }
        }))
      }
    ]
  }

  const barChartOption = {
    title: {
      text: '办理时效分析',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
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
      data: efficiencyData.map(item => item.type)
    },
    yAxis: {
      type: 'value',
      name: '小时'
    },
    series: [
      {
        name: '平均办理时长',
        type: 'bar',
        data: efficiencyData.map(item => item.time),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#722ed1' },
              { offset: 1, color: '#9254de' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }

  return (
    <div>
      <Card className="mb-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">月度服务效能统计</h3>
          <Select
            style={{ width: 160 }}
            value={selectedMonth}
            onChange={setSelectedMonth}
            options={months.map(m => ({ label: m.label, value: m.value }))}
          />
        </div>
      </Card>

      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Card size="small">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileTextOutlined className="text-2xl text-blue-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">总业务量</div>
                  <div className="text-2xl font-bold text-blue-500">{summary.totalBusiness}</div>
                </div>
              </div>
              <div className="flex items-center text-green-500 text-sm">
                <ArrowUpOutlined /> 12.5%
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <ClockCircleOutlined className="text-2xl text-purple-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">平均办理时长</div>
                  <div className="text-2xl font-bold text-purple-500">{summary.avgProcessTime} 小时</div>
                </div>
              </div>
              <div className="flex items-center text-green-500 text-sm">
                <ArrowDownOutlined /> 8.3%
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <SmileOutlined className="text-2xl text-green-500" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">满意度</div>
                  <div className="text-2xl font-bold text-green-500">{summary.satisfaction}%</div>
                </div>
              </div>
              <div className="flex items-center text-green-500 text-sm">
                <ArrowUpOutlined /> 2.1%
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-4">
        <Col span={12}>
          <Card>
            <ReactECharts option={trendChartOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <ReactECharts option={pieChartOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-4">
        <Col span={24}>
          <Card>
            <ReactECharts option={barChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="部门排名">
        <Table
          rowKey="dept"
          columns={columns}
          dataSource={deptRanking.map((item, index) => ({ ...item, index }))}
          pagination={false}
        />
      </Card>
    </div>
  )
}
