import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Progress, Table, Tag, Space, message } from 'antd'
import { ThunderboltOutlined, HeartOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { dashboardApi } from '../api'
import ReactECharts from 'echarts-for-react'

export default function CabinetHealth() {
  const [healthData, setHealthData] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadHealthData()
  }, [])

  const loadHealthData = async () => {
    setLoading(true)
    try {
      const response = await dashboardApi.getCabinetHealth()
      setHealthData(response.data || {})
    } catch (error) {
      message.error('加载健康度数据失败')
    } finally {
      setLoading(false)
    }
  }

  const cabinetDetails = healthData.cabinetDetails || []
  const gridVacancyRates = healthData.gridVacancyRates || []

  const columns = [
    {
      title: '柜机编号',
      dataIndex: 'cabinet_code',
      key: 'cabinet_code',
      width: 120
    },
    {
      title: '柜机名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '负载率',
      key: 'loadRate',
      width: 120,
      render: (_, record) => (
        <span>{record.loadRate != null ? `${record.loadRate}%` : '-'}</span>
      )
    },
    {
      title: '周转率',
      key: 'turnoverRate',
      width: 120,
      render: (_, record) => (
        <span>{record.turnoverRate != null ? `${record.turnoverRate}%` : '-'}</span>
      )
    },
    {
      title: '空置率',
      key: 'vacancyRate',
      width: 200,
      render: (_, record) => (
        record.vacancyRate != null
          ? <Progress percent={record.vacancyRate} size="small" strokeColor="#1890ff" />
          : '-'
      )
    },
    {
      title: '平均修复时长',
      dataIndex: 'avgRepairHours',
      key: 'avgRepairHours',
      width: 120,
      render: (val) => (val != null ? `${val}h` : '-')
    },
    {
      title: '故障状态',
      key: 'has_fault',
      width: 100,
      render: (_, record) => (
        record.has_fault
          ? <Tag color="error"><WarningOutlined /> 故障</Tag>
          : <Tag color="success"><CheckCircleOutlined /> 正常</Tag>
      )
    },
    {
      title: '格口',
      key: 'boxes',
      width: 120,
      render: (_, record) => (
        <span>{record.availableBoxes != null && record.total_boxes != null
          ? `${record.availableBoxes}/${record.total_boxes}`
          : '-'}</span>
      )
    }
  ]

  const turnoverChart = {
    title: { text: '柜机格口周转率', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: cabinetDetails.map(c => c.cabinet_code || c.name),
      axisLabel: { rotate: cabinetDetails.length > 8 ? 45 : 0, fontSize: 11 }
    },
    yAxis: { type: 'value', max: 100 },
    series: [{
      data: cabinetDetails.map(c => c.turnoverRate ?? 0),
      type: 'bar',
      itemStyle: { color: '#52c41a' },
      barWidth: cabinetDetails.length > 10 ? 20 : 40
    }]
  }

  const faultChart = {
    title: { text: '故障类型分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 12, name: '格口故障' },
        { value: 8, name: '系统异常' },
        { value: 5, name: '网络问题' },
        { value: 3, name: '电源问题' },
        { value: 2, name: '其他' }
      ],
      itemStyle: {
        colors: ['#ff6b35', '#1890ff', '#52c41a', '#faad14', '#722ed1']
      }
    }]
  }

  const getVacancyColor = (rate) => {
    if (rate >= 60) return '#52c41a'
    if (rate >= 40) return '#faad14'
    return '#ff6b35'
  }

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="柜机总数"
              value={healthData.totalCabinets ?? 0}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="在线率"
              value={healthData.onlineRate ?? 0}
              suffix="%"
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress percent={healthData.onlineRate ?? 0} size="small" strokeColor="#52c41a" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="格口周转率"
              value={healthData.turnoverRate ?? 0}
              suffix="%"
              valueStyle={{ color: '#faad14' }}
            />
            <Progress percent={healthData.turnoverRate ?? 0} size="small" strokeColor="#faad14" />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="平均故障修复"
              value={healthData.avgRepairTime ?? 0}
              suffix="小时"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={turnoverChart} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={faultChart} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="网格空置率" style={{ marginBottom: 16 }}>
        {gridVacancyRates.length > 0 ? (
          <Row gutter={[16, 16]}>
            {gridVacancyRates.map(grid => (
              <Col xs={24} sm={12} lg={6} key={grid.gridId}>
                <Card size="small" title={`网格 ${grid.gridId}`} type="inner">
                  <Progress
                    percent={grid.vacancyRate ?? 0}
                    strokeColor={getVacancyColor(grid.vacancyRate ?? 0)}
                  />
                  <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                    {grid.vacancyRate ?? 0}% 空置 · {grid.availableBoxes}/{grid.totalBoxes} 可用格口 · {grid.cabinetCount} 台柜机
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>暂无网格空置率数据</div>
        )}
      </Card>

      <Card title="柜机健康列表">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={cabinetDetails}
          loading={loading}
          pagination={cabinetDetails.length > 10 ? { pageSize: 10 } : false}
          size="small"
        />
      </Card>
    </div>
  )
}
