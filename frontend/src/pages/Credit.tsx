import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Row,
  Col,
  Statistic,
  Space,
  Tag,
  Progress,
  Descriptions,
  Button,
  Modal,
  message,
  Input,
  Select,
  Form,
  Typography
} from 'antd'
import {
  StarOutlined,
  TrophyOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import {
  getCreditRanking,
  getDriverCredits,
  getCreditModel,
  recalculateCredit,
  type CreditRankingItem,
  type DriverCredit,
  type CreditModel,
  type CreditLevel
} from '@/api'

interface TableRankingItem extends CreditRankingItem {
  key: string
}

interface TableCreditItem extends DriverCredit {
  key: string
}

const levelColorMap: Record<CreditLevel, string> = {
  S: '#ffd700',
  A: '#52c41a',
  B: '#1890ff',
  C: '#faad14',
  D: '#ff4d4f'
}

const levelTextMap: Record<CreditLevel, string> = {
  S: '优秀',
  A: '良好',
  B: '中等',
  C: '合格',
  D: '待改进'
}

const { Text } = Typography

const Credit: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [rankingList, setRankingList] = useState<TableRankingItem[]>([])
  const [creditList, setCreditList] = useState<TableCreditItem[]>([])
  const [total, setTotal] = useState(0)
  const [creditModel, setCreditModel] = useState<CreditModel | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<TableCreditItem | null>(null)
  const [searchForm] = Form.useForm()
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })

  const fetchRanking = async () => {
    try {
      const response = await getCreditRanking(10)
      if (response.code === 0) {
        const list = response.data.map((item: CreditRankingItem) => ({ ...item, key: item.driver_id }))
        setRankingList(list)
      }
    } catch (error) {
      console.error('获取信用排名失败')
    }
  }

  const fetchCreditList = async (params?: any) => {
    setLoading(true)
    try {
      const response = await getDriverCredits(params)
      if (response.code === 0) {
        const list = response.data.list.map((item: DriverCredit) => ({ ...item, key: item.id }))
        setCreditList(list)
        setTotal(response.data.total)
      } else {
        message.error(response.message || '获取信用分列表失败')
      }
    } catch (error) {
      message.error('获取信用分列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchCreditModel = async () => {
    try {
      const response = await getCreditModel()
      if (response.code === 0) {
        setCreditModel(response.data)
      }
    } catch (error) {
      console.error('获取信用分模型失败')
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchRanking(),
      fetchCreditList({ page: 1, pageSize: 10 }),
      fetchCreditModel()
    ])
    setLoading(false)
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const handleSearch = (values: any) => {
    const params = {
      page: 1,
      pageSize: pagination.pageSize,
      ...values
    }
    setPagination({ ...pagination, page: 1 })
    fetchCreditList(params)
  }

  const handleRecalculate = async (record: TableCreditItem) => {
    try {
      const response = await recalculateCredit(record.driver_id)
      if (response.code === 0) {
        message.success('信用分重新计算成功')
        fetchCreditList({ page: pagination.page, pageSize: pagination.pageSize })
        fetchRanking()
      } else {
        message.error(response.message || '重新计算失败')
      }
    } catch (error) {
      message.error('重新计算失败')
    }
  }

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
    const values = searchForm.getFieldsValue()
    fetchCreditList({ page, pageSize, ...values })
  }

  const openDetailModal = (record: TableCreditItem) => {
    setSelectedDriver(record)
    setDetailModalOpen(true)
  }

  const scoreDistributionOption = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: 0
    },
    series: [
      {
        name: '信用等级分布',
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
          formatter: '{b}: {c}人'
        },
        data: [
          { value: rankingList.filter(item => item.level === 'S').length, name: 'S级', itemStyle: { color: levelColorMap.S } },
          { value: rankingList.filter(item => item.level === 'A').length, name: 'A级', itemStyle: { color: levelColorMap.A } },
          { value: rankingList.filter(item => item.level === 'B').length, name: 'B级', itemStyle: { color: levelColorMap.B } },
          { value: rankingList.filter(item => item.level === 'C').length, name: 'C级', itemStyle: { color: levelColorMap.C } },
          { value: rankingList.filter(item => item.level === 'D').length, name: 'D级', itemStyle: { color: levelColorMap.D } }
        ].filter(item => item.value > 0)
      }
    ]
  }

  const factorChartOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: creditModel?.factors.map(f => f.name) || []
    },
    yAxis: {
      type: 'value',
      name: '权重(%)',
      max: 100
    },
    series: [
      {
        name: '权重',
        type: 'bar',
        data: creditModel?.factors.map(f => f.weight * 100) || [],
        itemStyle: {
          color: (params: any) => {
            const colors = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2']
            return colors[params.dataIndex % colors.length]
          }
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%'
        }
      }
    ]
  }

  const rankingColumns: ColumnsType<TableRankingItem> = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 70,
      render: (rank: number) => (
        <Tag color={rank <= 3 ? 'gold' : 'default'} style={{ fontSize: 14, padding: '2px 12px' }}>
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
        </Tag>
      )
    },
    {
      title: '司机姓名',
      dataIndex: 'driver_name',
      key: 'driver_name',
      width: 100
    },
    {
      title: '信用分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score: number) => (
        <Text strong style={{ fontSize: 16, color: score >= 90 ? '#52c41a' : score >= 80 ? '#faad14' : '#ff4d4f' }}>
          {score}
        </Text>
      )
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: CreditLevel) => (
        <Tag color={levelColorMap[level]} style={{ fontSize: 14, padding: '4px 12px' }}>
          {level} - {levelTextMap[level]}
        </Tag>
      )
    },
    {
      title: '准时率',
      dataIndex: 'on_time_rate',
      key: 'on_time_rate',
      width: 100,
      render: (rate: number) => `${rate}%`
    },
    {
      title: '服务评分',
      dataIndex: 'service_rating',
      key: 'service_rating',
      width: 100
    },
    {
      title: '违规次数',
      dataIndex: 'violation_count',
      key: 'violation_count',
      width: 100,
      render: (count: number) => (
        <span style={{ color: count > 0 ? '#ff4d4f' : '#52c41a' }}>{count} 次</span>
      )
    }
  ]

  const creditColumns: ColumnsType<TableCreditItem> = [
    {
      title: '司机姓名',
      dataIndex: 'driver_name',
      key: 'driver_name',
      width: 100
    },
    {
      title: '信用分',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score: number) => (
        <Progress
          type="dashboard"
          percent={score}
          width={60}
          strokeColor={score >= 90 ? '#52c41a' : score >= 80 ? '#faad14' : '#ff4d4f'}
        />
      )
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: CreditLevel) => (
        <Tag color={levelColorMap[level]}>
          {level} - {levelTextMap[level]}
        </Tag>
      )
    },
    {
      title: '完成订单',
      dataIndex: 'completed_orders',
      key: 'completed_orders',
      width: 100
    },
    {
      title: '准时率',
      dataIndex: 'on_time_rate',
      key: 'on_time_rate',
      width: 100,
      render: (rate: number) => `${rate}%`
    },
    {
      title: '服务评分',
      dataIndex: 'service_rating',
      key: 'service_rating',
      width: 100
    },
    {
      title: '投诉次数',
      dataIndex: 'complaint_count',
      key: 'complaint_count',
      width: 100,
      render: (count: number) => (
        <span style={{ color: count > 0 ? '#ff4d4f' : '#52c41a' }}>{count} 次</span>
      )
    },
    {
      title: '违规次数',
      dataIndex: 'violation_count',
      key: 'violation_count',
      width: 100,
      render: (count: number) => (
        <span style={{ color: count > 0 ? '#ff4d4f' : '#52c41a' }}>{count} 次</span>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'last_updated',
      key: 'last_updated',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openDetailModal(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<ReloadOutlined />} onClick={() => handleRecalculate(record)}>
            重算
          </Button>
        </Space>
      )
    }
  ]

  const avgScore = rankingList.length > 0
    ? Math.round(rankingList.reduce((sum, item) => sum + item.score, 0) / rankingList.length)
    : 0

  const sLevelCount = rankingList.filter(item => item.level === 'S').length

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="司机平均信用分"
              value={avgScore}
              valueStyle={{ color: '#1890ff' }}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="S级司机数"
              value={sLevelCount}
              valueStyle={{ color: '#ffd700' }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="平均准时率"
              value={rankingList.length > 0 ? Math.round(rankingList.reduce((sum, item) => sum + item.on_time_rate, 0) / rankingList.length) : 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总司机数"
              value={total}
              valueStyle={{ color: '#722ed1' }}
              prefix={<UserOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="信用分 TOP10 排名" loading={loading}>
            <Table
              columns={rankingColumns}
              dataSource={rankingList}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="信用等级分布" loading={loading}>
            <ReactECharts option={scoreDistributionOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="信用分计算模型">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <ReactECharts option={factorChartOption} style={{ height: 300 }} />
          </Col>
          <Col span={12}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="模型说明">
                {creditModel?.description || '信用分综合考量司机的准时率、服务评分、违规次数等多个维度'}
              </Descriptions.Item>
              <Descriptions.Item label="计算公式">
                <Text code>{creditModel?.formula || '信用分 = Σ(指标得分 × 指标权重)'}</Text>
              </Descriptions.Item>
              {creditModel?.factors.map((factor, index) => (
                <Descriptions.Item key={index} label={`${factor.name} (${Math.round(factor.weight * 100)}%)`}>
                  {factor.description}
                </Descriptions.Item>
              ))}
            </Descriptions>
            <Card
              type="inner"
              title="信用等级划分"
              style={{ marginTop: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(levelTextMap).map(([level, text]) => (
                  <Space key={level}>
                    <Tag color={levelColorMap[level as CreditLevel]}>{level}级</Tag>
                    <Text>- {text}</Text>
                    <Text type="secondary">
                      {level === 'S' ? '≥ 95分' :
                       level === 'A' ? '90-94分' :
                       level === 'B' ? '80-89分' :
                       level === 'C' ? '70-79分' : '< 70分'}
                    </Text>
                  </Space>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card
        title="司机信用分列表"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => fetchCreditList({ page: pagination.page, pageSize: pagination.pageSize })}>
            刷新
          </Button>
        }
      >
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }} onFinish={handleSearch}>
          <Form.Item name="keyword">
            <Input placeholder="搜索司机姓名" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="level">
            <Select placeholder="信用等级" allowClear style={{ width: 150 }}>
              {Object.entries(levelTextMap).map(([level, text]) => (
                <Select.Option key={level} value={level}>
                  <Tag color={levelColorMap[level as CreditLevel]}>{level}级 - {text}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={() => { searchForm.resetFields(); fetchCreditList({ page: 1, pageSize: 10 }) }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          columns={creditColumns}
          dataSource={creditList}
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handleTableChange
          }}
        />
      </Card>

      <Modal
        title="司机信用分详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedDriver && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="司机姓名">{selectedDriver.driver_name}</Descriptions.Item>
            <Descriptions.Item label="司机ID">{selectedDriver.driver_id}</Descriptions.Item>
            <Descriptions.Item label="信用分" span={2}>
              <Space>
                <Progress
                  type="dashboard"
                  percent={selectedDriver.score}
                  width={80}
                  strokeColor={selectedDriver.score >= 90 ? '#52c41a' : selectedDriver.score >= 80 ? '#faad14' : '#ff4d4f'}
                />
                <Tag color={levelColorMap[selectedDriver.level]} style={{ fontSize: 16, padding: '4px 12px' }}>
                  {selectedDriver.level} - {levelTextMap[selectedDriver.level]}
                </Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="总订单数">{selectedDriver.total_orders}</Descriptions.Item>
            <Descriptions.Item label="完成订单">{selectedDriver.completed_orders}</Descriptions.Item>
            <Descriptions.Item label="准时率">
              <span style={{ color: selectedDriver.on_time_rate >= 95 ? '#52c41a' : selectedDriver.on_time_rate >= 90 ? '#faad14' : '#ff4d4f' }}>
                {selectedDriver.on_time_rate}%
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="服务评分">{selectedDriver.service_rating}</Descriptions.Item>
            <Descriptions.Item label="违规次数">
              <span style={{ color: selectedDriver.violation_count > 0 ? '#ff4d4f' : '#52c41a' }}>
                {selectedDriver.violation_count} 次
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="投诉次数">
              <span style={{ color: selectedDriver.complaint_count > 0 ? '#ff4d4f' : '#52c41a' }}>
                {selectedDriver.complaint_count} 次
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="最后更新" span={2}>{selectedDriver.last_updated}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Space>
  )
}

export default Credit
