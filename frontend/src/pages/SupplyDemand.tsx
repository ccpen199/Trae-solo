import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Space,
  Tag,
  Button,
  Alert,
  List,
  message,
  Typography,
  Badge,
  Modal,
  Descriptions
} from 'antd'
import {
  WarningOutlined,
  CarOutlined,
  ShoppingOutlined,
  FallOutlined,
  RiseOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  EyeOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import {
  getSupplyDemand,
  getEarlyWarnings,
  type SupplyDemandItem,
  type EarlyWarning
} from '@/api'

const { Text } = Typography

interface TableSupplyItem extends SupplyDemandItem {
  key: string
}

interface TableWarningItem extends EarlyWarning {
  key: string
}

const warningLevelMap: Record<string, { color: string; bgColor: string; text: string }> = {
  red: { color: '#ff4d4f', bgColor: '#fff1f0', text: '红色预警' },
  orange: { color: '#fa8c16', bgColor: '#fff7e6', text: '橙色预警' },
  yellow: { color: '#fadb14', bgColor: '#feffe6', text: '黄色预警' }
}

const warningTypeMap: Record<string, { icon: React.ReactNode; text: string }> = {
  supply_shortage: { icon: <FallOutlined />, text: '运力不足' },
  demand_surge: { icon: <RiseOutlined />, text: '需求激增' },
  imbalance: { icon: <WarningOutlined />, text: '供需失衡' },
  driver_shortage: { icon: <CarOutlined />, text: '司机短缺' }
}

const SupplyDemand: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [supplyDemandData, setSupplyDemandData] = useState<TableSupplyItem[]>([])
  const [warnings, setWarnings] = useState<TableWarningItem[]>([])
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedWarning, setSelectedWarning] = useState<TableWarningItem | null>(null)

  const fetchSupplyDemand = async (): Promise<TableSupplyItem[]> => {
    try {
      const response = await getSupplyDemand()
      if (response.code === 0 && Array.isArray(response.data)) {
        const list = response.data.map((item: SupplyDemandItem, index: number) => ({
          ...item,
          key: String(item.area ?? index),
          area: item.area ?? `区域${index + 1}`,
          supply: Number(item.supply ?? 0),
          demand: Number(item.demand ?? 0),
          gap: Number(item.gap ?? 0)
        }))
        setSupplyDemandData(list)
        return list
      } else if (response.code !== 0) {
        console.error('获取供需数据失败:', response.message)
      }
    } catch (error) {
      console.error('获取供需数据失败', error)
    }
    return []
  }

  const generateMockWarnings = (supplyData: TableSupplyItem[]): TableWarningItem[] => {
    const warnings: TableWarningItem[] = []
    let warningId = 1
    const now = new Date().toLocaleString('zh-CN')

    supplyData.forEach((item) => {
      const ratio = item.demand > 0 ? (item.supply / item.demand) * 100 : 100
      if (ratio < 50) {
        warnings.push({
          key: String(warningId),
          id: String(warningId++),
          type: 'supply_shortage',
          level: 'red',
          message: `${item.area}运力严重不足，缺口${item.gap}单`,
          time: now
        })
      } else if (ratio < 80) {
        warnings.push({
          key: String(warningId),
          id: String(warningId++),
          type: 'imbalance',
          level: 'orange',
          message: `${item.area}供需失衡，缺口${item.gap}单`,
          time: now
        })
      } else if (ratio < 100 && item.gap > 5) {
        warnings.push({
          key: String(warningId),
          id: String(warningId++),
          type: 'demand_surge',
          level: 'yellow',
          message: `${item.area}需求增长，缺口${item.gap}单`,
          time: now
        })
      }
    })

    return warnings
  }

  const fetchEarlyWarnings = async (supplyData: TableSupplyItem[]) => {
    try {
      const response = await getEarlyWarnings()
      if (response.code === 0 && Array.isArray(response.data) && response.data.length > 0) {
        const list = response.data.map((item: EarlyWarning, index: number) => ({
          ...item,
          key: String(item.id ?? index),
          id: String(item.id ?? index),
          type: item.type ?? 'imbalance',
          level: item.level ?? 'yellow',
          message: item.message ?? '预警信息',
          time: item.time ?? new Date().toLocaleString('zh-CN')
        }))
        setWarnings(list)
      } else {
        const mockWarnings = generateMockWarnings(supplyData)
        setWarnings(mockWarnings)
      }
    } catch (error) {
      console.error('获取预警列表失败', error)
      const mockWarnings = generateMockWarnings(supplyData)
      setWarnings(mockWarnings)
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    const results = await Promise.allSettled([
      fetchSupplyDemand()
    ])
    let currentSupplyData: TableSupplyItem[] = []
    if (results[0].status === 'fulfilled') {
      currentSupplyData = results[0].value
    } else {
      console.error('SupplyDemand 数据加载失败:', results[0].reason)
    }
    await fetchEarlyWarnings(currentSupplyData)
    setLoading(false)
  }

  useEffect(() => {
    fetchAllData()
    const interval = setInterval(fetchAllData, 60000)
    return () => clearInterval(interval)
  }, [])

  const barChartOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['运力', '订单量', '缺口']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: supplyDemandData.map(item => item.area),
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '数量'
    },
    series: [
      {
        name: '运力',
        type: 'bar',
        data: supplyDemandData.map(item => item.supply),
        itemStyle: { color: '#52c41a' },
        barWidth: '20%'
      },
      {
        name: '订单量',
        type: 'bar',
        data: supplyDemandData.map(item => item.demand),
        itemStyle: { color: '#1890ff' },
        barWidth: '20%'
      },
      {
        name: '缺口',
        type: 'bar',
        data: supplyDemandData.map(item => Math.max(0, item.gap)),
        itemStyle: {
          color: (params: any) => {
            const gap = params.value
            if (gap > 30) return '#ff4d4f'
            if (gap > 15) return '#fa8c16'
            if (gap > 0) return '#fadb14'
            return '#52c41a'
          }
        },
        barWidth: '20%'
      }
    ]
  }

  const trendChartOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['运力充足率']
    },
    xAxis: {
      type: 'category',
      data: supplyDemandData.map(item => item.area),
      axisLabel: {
        rotate: 45,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '充足率(%)',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '运力充足率',
        type: 'line',
        smooth: true,
        data: supplyDemandData.map(item => {
          const rate = item.demand > 0 ? Math.round((item.supply / item.demand) * 100) : 100
          return Math.min(rate, 100)
        }),
        itemStyle: { color: '#722ed1' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(114, 46, 209, 0.3)' },
              { offset: 1, color: 'rgba(114, 46, 209, 0.05)' }
            ]
          }
        },
        markLine: {
          silent: true,
          data: [
            { yAxis: 80, lineStyle: { color: '#fa8c16', type: 'dashed' } },
            { yAxis: 50, lineStyle: { color: '#ff4d4f', type: 'dashed' } }
          ]
        }
      }
    ]
  }

  const gapChartOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      bottom: 0
    },
    series: [
      {
        name: '缺口分布',
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
          formatter: '{b}\n{c}单'
        },
        data: supplyDemandData
          .filter(item => item.gap > 0)
          .map(item => ({
            value: item.gap,
            name: item.area,
            itemStyle: {
              color: item.gap > 30 ? '#ff4d4f' : item.gap > 15 ? '#fa8c16' : '#fadb14'
            }
          }))
      }
    ]
  }

  const columns: ColumnsType<TableSupplyItem> = [
    {
      title: '区域',
      dataIndex: 'area',
      key: 'area',
      width: 120,
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '运力',
      dataIndex: 'supply',
      key: 'supply',
      width: 100,
      render: (value: number) => (
        <Space>
          <CarOutlined style={{ color: '#52c41a' }} />
          <span>{value} 人</span>
        </Space>
      )
    },
    {
      title: '订单量',
      dataIndex: 'demand',
      key: 'demand',
      width: 100,
      render: (value: number) => (
        <Space>
          <ShoppingOutlined style={{ color: '#1890ff' }} />
          <span>{value} 单</span>
        </Space>
      )
    },
    {
      title: '缺口',
      dataIndex: 'gap',
      key: 'gap',
      width: 120,
      render: (value: number) => {
        const absValue = Math.abs(value)
        const isShortage = value > 0
        return (
          <Tag
            color={isShortage ? (absValue > 30 ? 'red' : absValue > 15 ? 'orange' : 'gold') : 'green'}
            style={{ fontSize: 14, padding: '4px 12px' }}
          >
            {isShortage ? <FallOutlined /> : <RiseOutlined />}
            {isShortage ? `缺口 ${absValue}` : `盈余 ${absValue}`}
          </Tag>
        )
      }
    },
    {
      title: '供需比',
      key: 'ratio',
      width: 120,
      render: (_, record) => {
        const ratio = record.demand > 0 ? (record.supply / record.demand) * 100 : 100
        return (
          <Text style={{ color: ratio >= 100 ? '#52c41a' : ratio >= 80 ? '#faad14' : '#ff4d4f' }}>
            {Math.min(ratio, 100).toFixed(1)}%
          </Text>
        )
      }
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const ratio = record.demand > 0 ? (record.supply / record.demand) * 100 : 100
        if (ratio < 50) return <Badge status="error" text="严重不足" />
        if (ratio < 80) return <Badge status="warning" text="轻微不足" />
        if (ratio < 100) return <Badge status="processing" text="基本平衡" />
        return <Badge status="success" text="运力充足" />
      }
    }
  ]

  const totalSupply = supplyDemandData.reduce((sum, item) => sum + item.supply, 0)
  const totalDemand = supplyDemandData.reduce((sum, item) => sum + item.demand, 0)
  const totalGap = supplyDemandData.reduce((sum, item) => sum + Math.max(0, item.gap), 0)
  const avgRatio = totalDemand > 0 ? Math.min((totalSupply / totalDemand) * 100, 100) : 100

  const redWarnings = warnings.filter(w => w.level === 'red')
  const orangeWarnings = warnings.filter(w => w.level === 'orange')
  const yellowWarnings = warnings.filter(w => w.level === 'yellow')

  const openDetailModal = (record: TableWarningItem) => {
    setSelectedWarning(record)
    setDetailModalOpen(true)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {redWarnings.length > 0 && (
        <Alert
          message={`${redWarnings.length} 个红色预警`}
          description={redWarnings[0].message}
          type="error"
          showIcon
          action={
            <Button size="small" danger onClick={() => message.info('正在处理...')}>
              立即处理
            </Button>
          }
          closable
        />
      )}

      {orangeWarnings.length > 0 && (
        <Alert
          message={`${orangeWarnings.length} 个橙色预警`}
          description={orangeWarnings[0].message}
          type="warning"
          showIcon
          closable
        />
      )}

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总运力"
              value={totalSupply}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CarOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总订单量"
              value={totalDemand}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ShoppingOutlined />}
              suffix="单"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总缺口"
              value={totalGap}
              valueStyle={{ color: totalGap > 20 ? '#ff4d4f' : totalGap > 10 ? '#faad14' : '#52c41a' }}
              prefix={<FallOutlined />}
              suffix="单"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="平均供需比"
              value={avgRatio}
              precision={1}
              valueStyle={{ color: avgRatio >= 80 ? '#52c41a' : '#ff4d4f' }}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card
            title="各区域运力/订单量/缺口分析"
            extra={
              <Button icon={<ReloadOutlined />} size="small" onClick={fetchAllData} loading={loading}>
                刷新数据
              </Button>
            }
          >
            <ReactECharts option={barChartOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="缺口区域分布">
            <ReactECharts option={gapChartOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="各区域运力充足率趋势">
            <ReactECharts option={trendChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="各区域供需详情">
        <Table
          columns={columns}
          dataSource={supplyDemandData}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个区域`
          }}
        />
      </Card>

      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: '#ff4d4f' }} />
            <span>预警列表</span>
            {warnings.length > 0 && (
              <Tag color="red">{warnings.length} 条预警</Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            {redWarnings.length > 0 && <Tag color="red">红色 {redWarnings.length}</Tag>}
            {orangeWarnings.length > 0 && <Tag color="orange">橙色 {orangeWarnings.length}</Tag>}
            {yellowWarnings.length > 0 && <Tag color="gold">黄色 {yellowWarnings.length}</Tag>}
          </Space>
        }
      >
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={warnings}
          locale={{ emptyText: '暂无预警信息' }}
          renderItem={(item) => {
            const levelInfo = warningLevelMap[item.level] || warningLevelMap.yellow
            const typeInfo = warningTypeMap[item.type] || warningTypeMap.imbalance
            return (
              <List.Item
                key={item.id}
                style={{
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: levelInfo.bgColor,
                  borderLeft: `4px solid ${levelInfo.color}`,
                  marginBottom: 12
                }}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: levelInfo.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 20
                      }}
                    >
                      <ExclamationCircleOutlined />
                    </div>
                  }
                  title={
                    <Space>
                      <Tag color={levelInfo.color} style={{ fontSize: 14, padding: '2px 10px' }}>
                        {levelInfo.text}
                      </Tag>
                      <Tag color="blue">{typeInfo.icon} {typeInfo.text}</Tag>
                      <Text strong>{item.message}</Text>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text type="secondary">预警时间：{item.time}</Text>
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => openDetailModal(item)}
                        >
                          查看详情
                        </Button>
                        <Button
                          size="small"
                          onClick={() => message.success('已标记为已读')}
                        >
                          标记已读
                        </Button>
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )
          }}
        />
      </Card>

      <Modal
        title="预警详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedWarning && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="预警级别">
              <Tag color={warningLevelMap[selectedWarning.level]?.color}>
                {warningLevelMap[selectedWarning.level]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="预警类型">
              {warningTypeMap[selectedWarning.type]?.text}
            </Descriptions.Item>
            <Descriptions.Item label="预警内容">{selectedWarning.message}</Descriptions.Item>
            <Descriptions.Item label="预警时间">{selectedWarning.time}</Descriptions.Item>
            <Descriptions.Item label="建议措施">
              <List size="small">
                <List.Item>1. 立即调度周边空闲司机前往该区域</List.Item>
                <List.Item>2. 提高该区域派单优先级</List.Item>
                <List.Item>3. 通知备用司机待命</List.Item>
                <List.Item>4. 必要时启动应急运力储备</List.Item>
              </List>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Space>
  )
}

export default SupplyDemand
