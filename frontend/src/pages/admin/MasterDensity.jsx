import React, { useState, useEffect } from 'react'
import { Typography, Card, Row, Col, Statistic, List, Tag, Rate } from 'antd'
import { TeamOutlined, EnvironmentOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { adminApi } from '../../utils/api'

const { Title } = Typography

const MasterDensity = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await adminApi.getMasterDensity()
      setData(result)
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const chartData = data.map(item => ({
    name: item.area || '未知区域',
    value: item.count
  }))

  const totalMasters = data.reduce((sum, item) => sum + item.count, 0)
  const avgRating = data.length > 0 
    ? (data.reduce((sum, item) => sum + (item.avg_rating || 0), 0) / data.length).toFixed(1)
    : 0

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 位师傅'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.name),
      axisLabel: {
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: '师傅数量'
    },
    series: [
      {
        data: chartData.map(d => d.value),
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#722ed1' }
            ]
          }
        },
        barWidth: '50%'
      }
    ]
  }

  const pieOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '师傅分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
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
        data: chartData
      }
    ]
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>区域师傅密度热力图</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="认证师傅总数"
              value={totalMasters}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="覆盖区域数"
              value={data.length}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均评分"
              value={avgRating}
              suffix="/ 5.0"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={14}>
          <Card title="各区域师傅数量分布">
            <ReactECharts option={option} style={{ height: 400 }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="区域分布占比">
            <ReactECharts option={pieOption} style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>

      <Card title="区域详情列表">
        <List
          dataSource={data}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Tag color="blue">{item.count} 位师傅</Tag>,
                <Rate disabled value={item.avg_rating || 0} style={{ fontSize: 14 }} />
              ]}
            >
              <List.Item.Meta
                avatar={<EnvironmentOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                title={item.area || '未知区域'}
                description={`平均评分: ${(item.avg_rating || 0).toFixed(1)} / 5.0`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default MasterDensity
