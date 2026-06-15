import React from 'react'
import { Card, Row, Col, Statistic, List } from 'antd'
import {
  DatabaseOutlined,
  RiseOutlined,
  ApiOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SafetyOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  AuditOutlined,
  ReadOutlined,
  CarOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'

const DataAssetsOverview: React.FC = () => {
  const statsCards = [
    {
      title: '累计数据资产数',
      value: 128560,
      suffix: '项',
      prefix: <DatabaseOutlined />,
      color: '#0958d9'
    },
    {
      title: '今日新增资产',
      value: 328,
      suffix: '项',
      prefix: <RiseOutlined />,
      color: '#52c41a'
    },
    {
      title: '已授权资产调用次数',
      value: 89650,
      suffix: '次',
      prefix: <ApiOutlined />,
      color: '#faad14'
    },
    {
      title: '资产类型数',
      value: 7,
      suffix: '大类',
      prefix: <AppstoreOutlined />,
      color: '#722ed1'
    }
  ]

  const assetCategories = [
    {
      name: '证照类',
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#0958d9' }} />,
      count: '12,580',
      unit: '本',
      callCount: '45,620次',
      bgColor: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)'
    },
    {
      name: '社会保障类',
      icon: <SafetyOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      count: '28,960',
      unit: '条',
      callCount: '32,180次',
      desc: '社保、养老、失业',
      bgColor: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)'
    },
    {
      name: '住房公积金类',
      icon: <HomeOutlined style={{ fontSize: 32, color: '#faad14' }} />,
      count: '15,420',
      unit: '户',
      callCount: '28,950次',
      desc: '缴存余额、提取次数',
      bgColor: 'linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)'
    },
    {
      name: '医疗保障类',
      icon: <MedicineBoxOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
      count: '35,680',
      unit: '条',
      callCount: '52,340次',
      desc: '医保账户、就医记录',
      bgColor: 'linear-gradient(135deg, #fff0f6 0%, #ffadd2 100%)'
    },
    {
      name: '税务类',
      icon: <AuditOutlined style={{ fontSize: 32, color: '#13c2c2' }} />,
      count: '8,920',
      unit: '条',
      callCount: '12,560次',
      desc: '纳税记录',
      bgColor: 'linear-gradient(135deg, #e6fffb 0%, #87e8de 100%)'
    },
    {
      name: '教育类',
      icon: <ReadOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      count: '12,360',
      unit: '条',
      callCount: '18,920次',
      desc: '学历、证书',
      bgColor: 'linear-gradient(135deg, #f9f0ff 0%, #d3adf7 100%)'
    },
    {
      name: '交通出行类',
      icon: <CarOutlined style={{ fontSize: 32, color: '#fa541c' }} />,
      count: '14,720',
      unit: '条',
      callCount: '24,680次',
      desc: '驾照、车辆',
      bgColor: 'linear-gradient(135deg, #fff2e8 0%, #ffbb96 100%)'
    }
  ]

  const growthTrendOption = {
    title: {
      text: '数据资产增长趋势',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['累计资产数', '新增资产数'],
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
      data: ['7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '累计资产数',
        type: 'line',
        smooth: true,
        data: [45200, 52800, 61200, 68500, 75200, 82600, 89800, 95600, 102300, 108900, 115600, 128560],
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
        name: '新增资产数',
        type: 'line',
        smooth: true,
        data: [2800, 3200, 3600, 2800, 3100, 3500, 3800, 2900, 3300, 3600, 3200, 328],
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
      }
    ]
  }

  const pieOption = {
    title: {
      text: '资产类型分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 }
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      type: 'scroll'
    },
    series: [
      {
        name: '资产数量',
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
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 12580, name: '证照类' },
          { value: 28960, name: '社会保障类' },
          { value: 15420, name: '住房公积金类' },
          { value: 35680, name: '医疗保障类' },
          { value: 8920, name: '税务类' },
          { value: 12360, name: '教育类' },
          { value: 14720, name: '交通出行类' }
        ],
        color: ['#0958d9', '#52c41a', '#faad14', '#eb2f96', '#13c2c2', '#722ed1', '#fa541c']
      }
    ]
  }

  const deptRankingOption = {
    title: {
      text: '各委办局数据提供量排行',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 500 }
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
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: ['卫健委', '人社局', '医保局', '住建局', '教育局', '公安局', '交通局', '税务局', '民政局', '市场监管局'],
      inverse: true
    },
    series: [
      {
        name: '数据量',
        type: 'bar',
        data: [25680, 22890, 18320, 15980, 12560, 11210, 9890, 8450, 7100, 5890],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#0958d9' },
              { offset: 1, color: '#69b1ff' }
            ]
          },
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: '60%'
      }
    ]
  }

  const recentUpdates = [
    { name: '身份证电子证照', dept: '公安局', time: '10分钟前', type: '新增' },
    { name: '社保缴费记录', dept: '人社局', time: '30分钟前', type: '更新' },
    { name: '医保账户信息', dept: '医保局', time: '1小时前', type: '更新' },
    { name: '不动产权证书', dept: '自然资源局', time: '2小时前', type: '新增' },
    { name: '驾驶证信息', dept: '交通局', time: '3小时前', type: '更新' }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statsCards.map((item, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card>
              <Statistic
                title={item.title}
                value={item.value}
                suffix={item.suffix}
                prefix={React.cloneElement(item.prefix, { style: { color: item.color } })}
                valueStyle={{ color: item.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="7大数据资产类型" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          {assetCategories.map((item, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <div
                style={{
                  padding: 20,
                  borderRadius: 8,
                  background: item.bgColor,
                  height: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  {item.icon}
                  <span style={{ marginLeft: 12, fontSize: 16, fontWeight: 500, color: '#333' }}>
                    {item.name}
                  </span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
                  {item.count}
                  <span style={{ fontSize: 14, fontWeight: 'normal', marginLeft: 4 }}>{item.unit}</span>
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  调用次数：{item.callCount}
                </div>
                {item.desc && (
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    {item.desc}
                  </div>
                )}
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card>
            <ReactECharts option={growthTrendOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <ReactECharts option={pieOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card>
            <ReactECharts option={deptRankingOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="最近更新">
            <List
              dataSource={recentUpdates}
              renderItem={(item) => (
                <List.Item key={item.name}>
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <span style={{ fontSize: 12 }}>
                        {item.dept} · {item.time}
                      </span>
                    }
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: item.type === '新增' ? '#52c41a' : '#faad14',
                      background: item.type === '新增' ? '#f6ffed' : '#fffbe6',
                      padding: '2px 8px',
                      borderRadius: 4
                    }}
                  >
                    {item.type}
                  </span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DataAssetsOverview
