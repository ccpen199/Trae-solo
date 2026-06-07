import { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Select,
  Modal,
  Form,
  InputNumber,
  Spin,
  message,
  Row,
  Col,
  Statistic,
  Progress,
  Input,
  Space,
  Radio,
} from 'antd'
import {
  CreditCardOutlined,
  PlusOutlined,
  MinusOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Column } from '@ant-design/charts'
import { knightAPI } from '@/api'
import {
  KNIGHT_TYPE_COLORS,
  KNIGHT_TYPE_LABELS,
  formatTime,
} from '@/types'
import { Link } from 'react-router-dom'

const { Option } = Select

export default function CreditSystem() {
  const [loading, setLoading] = useState(false)
  const [knights, setKnights] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [filter, setFilter] = useState<any>({})
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [selectedKnight, setSelectedKnight] = useState<any>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [knightsResult, historyResult]: any[] = await Promise.all([
        knightAPI.list({ pageSize: 100, ...filter }),
        knightAPI.list({ pageSize: 100 }).catch(() => ({ data: { list: [] } })),
      ])

      const knightList = Array.isArray(knightsResult?.data)
        ? knightsResult.data
        : knightsResult?.data?.list || []
      setKnights(knightList)

      const allHistory: any[] = []
      const historyKnights = Array.isArray(historyResult?.data)
        ? historyResult.data
        : historyResult?.data?.list || []
      for (const k of historyKnights.slice(0, 5)) {
        try {
          const h: any = await knightAPI.creditHistory(k.id, { pageSize: 5 })
          const items = Array.isArray(h?.data) ? h.data : h?.data?.list || []
          items.forEach((item: any) => {
            allHistory.push({
              ...item,
              knight_name: k.name,
              knight_id: k.id,
            })
          })
        } catch (e) {
          // ignore
        }
      }
      allHistory.sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setHistory(allHistory.slice(0, 30))
    } catch (error) {
      console.error('Failed to load credit data', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdjust = async (values: any) => {
    if (!selectedKnight) return
    setSubmitting(true)
    try {
      const change = values.direction === 'plus' ? values.amount : -values.amount
      await knightAPI.creditHistory(selectedKnight.id, {
        score_change: change,
        reason: values.reason,
      })
      message.success('信用分调整成功')
      setAdjustModalOpen(false)
      form.resetFields()
      loadData()
    } catch (error) {
      message.error('调整失败')
    } finally {
      setSubmitting(false)
    }
  }

  const openAdjustModal = (knight: any) => {
    setSelectedKnight(knight)
    form.resetFields()
    setAdjustModalOpen(true)
  }

  const sortedKnights = [...knights].sort(
    (a: any, b: any) => (b.credit_score || 0) - (a.credit_score || 0)
  )

  const rankingColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, idx: number) => {
        if (idx === 0) return <TrophyOutlined style={{ color: '#faad14', fontSize: 18 }} />
        if (idx === 1) return <TrophyOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />
        if (idx === 2) return <TrophyOutlined style={{ color: '#d48806', fontSize: 16 }} />
        return <span style={{ color: '#8c8c8c' }}>{idx + 1}</span>
      },
    },
    {
      title: '骑手',
      key: 'knight',
      render: (_: any, record: any) => (
        <Space>
          <UserOutlined />
          <Link to={`/knights/${record.id}`}>{record.name}</Link>
          <Tag color={KNIGHT_TYPE_COLORS[record.type]}>
            {KNIGHT_TYPE_LABELS[record.type]}
          </Tag>
        </Space>
      ),
    },
    {
      title: '信用分',
      dataIndex: 'credit_score',
      key: 'credit_score',
      render: (v: number) => (
        <Space>
          <Progress
            percent={v || 0}
            size="small"
            showInfo={false}
            style={{ width: 100 }}
            strokeColor={v >= 80 ? '#52c41a' : v >= 60 ? '#faad14' : '#ff4d4f'}
          />
          <strong style={{ color: v >= 80 ? '#52c41a' : v >= 60 ? '#faad14' : '#ff4d4f' }}>
            {v || 0}
          </strong>
        </Space>
      ),
      sorter: (a: any, b: any) => (a.credit_score || 0) - (b.credit_score || 0),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '完成订单',
      dataIndex: 'completed_orders',
      key: 'completed_orders',
      render: (v: number) => v || 0,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button size="small" icon={<CreditCardOutlined />} onClick={() => openAdjustModal(record)}>
          调整分数
        </Button>
      ),
    },
  ]

  const historyColumns = [
    {
      title: '骑手',
      dataIndex: 'knight_name',
      key: 'knight_name',
      render: (v: string, record: any) => <Link to={`/knights/${record.knight_id}`}>{v}</Link>,
    },
    {
      title: '变动原因',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '分数变动',
      dataIndex: 'score_change',
      key: 'score_change',
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#52c41a' : v < 0 ? '#ff4d4f' : '#8c8c8c', fontWeight: 'bold' }}>
          {v > 0 ? `+${v}` : v}
        </span>
      ),
    },
    {
      title: '变动后',
      dataIndex: 'score_after',
      key: 'score_after',
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: formatTime,
    },
  ]

  const scoreDistributionData = [
    { range: '90-100', count: knights.filter((k) => (k.credit_score || 0) >= 90).length },
    { range: '80-89', count: knights.filter((k) => (k.credit_score || 0) >= 80 && (k.credit_score || 0) < 90).length },
    { range: '70-79', count: knights.filter((k) => (k.credit_score || 0) >= 70 && (k.credit_score || 0) < 80).length },
    { range: '60-69', count: knights.filter((k) => (k.credit_score || 0) >= 60 && (k.credit_score || 0) < 70).length },
    { range: '< 60', count: knights.filter((k) => (k.credit_score || 0) < 60).length },
  ]

  const columnConfig = {
    data: scoreDistributionData,
    xField: 'range',
    yField: 'count',
    colorField: 'range',
    color: ['#52c41a', '#73d13d', '#faad14', '#ff7a45', '#ff4d4f'],
    label: {
      position: 'middle' as const,
      style: { fill: '#fff', opacity: 0.8 },
    },
    style: { radius: [4, 4, 0, 0] },
    tooltip: { formatter: (d: any) => ({ name: d.range, value: `${d.count} 人` }) },
  }

  const avgScore = knights.length > 0
    ? knights.reduce((sum, k) => sum + (k.credit_score || 0), 0) / knights.length
    : 0

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>信用体系</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="骑手总数"
              value={knights.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="平均信用分"
              value={avgScore}
              precision={1}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: avgScore >= 80 ? '#52c41a' : avgScore >= 60 ? '#faad14' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="优秀骑手 (≥90分)"
              value={knights.filter((k) => (k.credit_score || 0) >= 90).length}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="骑手信用分排行榜"
        extra={
          <Space>
            <Select
              placeholder="类型筛选"
              allowClear
              style={{ width: 140 }}
              onChange={(v) => setFilter({ ...filter, type: v || undefined })}
            >
              <Option value="certified">认证骑手</Option>
              <Option value="crowdsourced">众包骑手</Option>
            </Select>
            <Input.Search
              placeholder="搜索骑手姓名"
              allowClear
              style={{ width: 160 }}
              onSearch={(v) => setFilter({ ...filter, name: v || undefined })}
            />
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Spin spinning={loading}>
          <Table
            columns={rankingColumns}
            dataSource={sortedKnights}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Spin>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card title="信用分分布">
            <div style={{ height: 320 }}>
              <Column {...columnConfig} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="信用变动记录">
            <Table
              columns={historyColumns}
              dataSource={history}
              rowKey="id"
              pagination={{ pageSize: 8 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={`调整信用分 - ${selectedKnight?.name || ''}`}
        open={adjustModalOpen}
        onCancel={() => setAdjustModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        {selectedKnight && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
            <div>当前信用分: <strong style={{ color: selectedKnight.credit_score >= 80 ? '#52c41a' : '#ff4d4f' }}>{selectedKnight.credit_score}</strong></div>
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAdjust}
          initialValues={{ direction: 'plus', amount: 5 }}
        >
          <Form.Item
            name="direction"
            label="调整方向"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio.Button value="plus">
                <PlusOutlined style={{ color: '#52c41a' }} /> 加分
              </Radio.Button>
              <Radio.Button value="minus">
                <MinusOutlined style={{ color: '#ff4d4f' }} /> 减分
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="amount"
            label="调整分数"
            rules={[{ required: true, message: '请输入分数' }]}
          >
            <InputNumber min={1} max={50} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="reason"
            label="调整原因"
            rules={[{ required: true, message: '请输入原因' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入调整原因" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAdjustModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                确认调整
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
