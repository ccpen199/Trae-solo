import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Space, Tag, Button } from 'antd'
import { CarOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import { getHeatmapData, type HeatmapData, type AreaDetail } from '@/api'

interface TableAreaDetail extends AreaDetail {
  key: string
}

const Heatmap: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [areaDetails, setAreaDetails] = useState<TableAreaDetail[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await getHeatmapData()
      if (response.code === 0 && response.data) {
        const data: any = response.data
        const points = data.points || data.points_list || []
        const rawAreas = data.areas || data.areaList || []
        const areas = rawAreas.map((item: any, index: number) => ({
          ...item,
          key: String(item.id ?? index),
          id: String(item.id ?? index),
          areaName: item.areaName ?? item.area_name ?? `区域${index + 1}`,
          driverCount: Number(item.driverCount ?? item.driver_count ?? item.available_drivers ?? 0),
          averageResponseTime: Number(item.averageResponseTime ?? item.average_response_time ?? 0),
          orderCount: Number(item.orderCount ?? item.order_count ?? 0),
          saturation: Number(item.saturation ?? 0),
          lng: Number(item.lng ?? item.longitude ?? 0),
          lat: Number(item.lat ?? item.latitude ?? 0)
        }))
        setAreaDetails(areas)
        setHeatmapData({
          points: points.map((p: any) => ({
            lng: Number(p.lng ?? p.longitude ?? 0),
            lat: Number(p.lat ?? p.latitude ?? 0),
            count: Number(p.count ?? p.driverCount ?? 0),
            areaName: p.areaName ?? p.area_name ?? ''
          })),
          areas: [],
          totalDrivers: Number(data.totalDrivers ?? data.total_drivers ?? 0),
          totalAreas: Number(data.totalAreas ?? data.total_areas ?? areas.length),
          averageResponseTime: Number(data.averageResponseTime ?? data.average_response_time ?? 0),
          updateTime: data.updateTime ?? data.update_time ?? '-'
        })
      } else if (response.code !== 0) {
        console.error('获取热力图数据失败:', response.message)
      }
    } catch (error) {
      console.error('获取热力图数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const scatterOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.data[2] || params.name}<br/>
                司机数量: ${params.value[2]}<br/>
                经纬度: ${params.value[0]}, ${params.value[1]}`
      }
    },
    xAxis: {
      type: 'value',
      name: '经度',
      min: 116.0,
      max: 116.8
    },
    yAxis: {
      type: 'value',
      name: '纬度',
      min: 39.6,
      max: 40.2
    },
    series: [
      {
        name: '司机分布',
        type: 'scatter',
        symbolSize: (val: number[]) => Math.sqrt(val[2]) * 3,
        data: heatmapData?.points?.map(p => [p.lng, p.lat, p.count, p.areaName]) || [],
        itemStyle: {
          color: (params: any) => {
            const count = params.data[2]
            if (count > 30) return '#ff4d4f'
            if (count > 15) return '#faad14'
            return '#52c41a'
          }
        },
        emphasis: {
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2
          }
        }
      }
    ]
  }

  const heatmapOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: areaDetails.map(item => item.areaName),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '司机密度'
    },
    visualMap: {
      min: 0,
      max: 50,
      left: 'right',
      top: 'center',
      text: ['高', '低'],
      calculable: true,
      inRange: {
        color: ['#52c41a', '#faad14', '#ff4d4f']
      }
    },
    series: [
      {
        name: '司机密度',
        type: 'bar',
        data: areaDetails.map(item => item.driverCount),
        itemStyle: {
          color: (params: any) => {
            const count = params.value
            if (count > 30) return '#ff4d4f'
            if (count > 15) return '#faad14'
            return '#52c41a'
          }
        }
      }
    ]
  }

  const responseTimeOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: areaDetails.map(item => item.areaName),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '平均响应时长(分钟)'
    },
    series: [
      {
        name: '平均响应时长',
        type: 'line',
        smooth: true,
        data: areaDetails.map(item => item.averageResponseTime),
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ]
          }
        }
      }
    ]
  }

  const columns: ColumnsType<TableAreaDetail> = [
    {
      title: '区域名称',
      dataIndex: 'areaName',
      key: 'areaName',
      width: 120
    },
    {
      title: '待命司机数',
      dataIndex: 'driverCount',
      key: 'driverCount',
      width: 100,
      render: (count: number) => (
        <Tag color={count > 30 ? 'red' : count > 15 ? 'orange' : 'green'}>
          {count} 人
        </Tag>
      )
    },
    {
      title: '平均响应时长',
      dataIndex: 'averageResponseTime',
      key: 'averageResponseTime',
      width: 120,
      render: (time: number) => (
        <span style={{ color: time > 20 ? '#ff4d4f' : time > 10 ? '#faad14' : '#52c41a' }}>
          {time} 分钟
        </span>
      )
    },
    {
      title: '今日订单数',
      dataIndex: 'orderCount',
      key: 'orderCount',
      width: 100
    },
    {
      title: '运力饱和度',
      dataIndex: 'saturation',
      key: 'saturation',
      width: 120,
      render: (saturation: number) => {
        const percent = Math.round(saturation * 100)
        return (
          <Tag color={percent > 80 ? 'red' : percent > 50 ? 'orange' : 'green'}>
            {percent}%
          </Tag>
        )
      }
    },
    {
      title: '经纬度',
      key: 'location',
      width: 180,
      render: (_, record) => `${record.lng.toFixed(4)}, ${record.lat.toFixed(4)}`
    }
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="待命司机总数"
              value={heatmapData?.totalDrivers || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="覆盖区域数"
              value={heatmapData?.totalAreas || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="平均响应时长"
              value={heatmapData?.averageResponseTime || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
              suffix="分钟"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="数据更新时间"
              value={heatmapData?.updateTime || '-'}
              valueStyle={{ color: '#722ed1' }}
              formatter={(value) => <span style={{ fontSize: 14 }}>{value}</span>}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card
            title="司机分布散点图"
            extra={
              <Button icon={<ReloadOutlined />} size="small" onClick={fetchData} loading={loading}>
                刷新
              </Button>
            }
          >
            <ReactECharts option={scatterOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="各区域司机密度热力图">
            <ReactECharts option={heatmapOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="各区域平均响应时长">
            <ReactECharts option={responseTimeOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="区域详细数据">
        <Table
          columns={columns}
          dataSource={areaDetails}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>
    </Space>
  )
}

export default Heatmap
