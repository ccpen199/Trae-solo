import { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Badge,
  DatePicker,
  Select,
  Spin,
  message,
  Row,
  Col,
  Statistic,
  Space,
  Typography,
} from 'antd'
import {
  MoneyCollectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { dashboardAPI } from '@/api'
import { formatTime } from '@/types'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

export default function SettlementList() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [stats, setStats] = useState<any>({})
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    loadData()
  }, [page, pageSize, filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize, ...filters }
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.start_date = filters.dateRange[0].format('YYYY-MM-DD')
        params.end_date = filters.dateRange[1].format('YYYY-MM-DD')
      }
      const result: any = await dashboardAPI.settlements(params)
      const items = result?.data?.list || result?.data || []
      const totalCount = result?.data?.total || items.length || 0
      setData(Array.isArray(items) ? items : [])
      setTotal(totalCount)

      const totalAmount = items.reduce((sum: number, s: any) => sum + (s.amount || 0), 0)
      const paid = items.filter((s: any) => s.status === 'paid').reduce((sum: number, s: any) => sum + (s.amount || 0), 0)
      const pending = items.filter((s: any) => s.status === 'pending').length
      setStats({
        total: totalAmount,
        paid,
        pending_count: pending,
        count: items.length,
      })
    } catch (error) {
      console.error('Failed to load settlements', error)
      setData([])
      setTotal(0)
      setStats({})
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '结算单号',
      dataIndex: 'id',
      key: 'id',
      render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: '商家',
      dataIndex: ['merchant', 'name'],
      key: 'merchant',
      render: (v: string, record: any) => v || record.merchant_id || '-',
    },
    {
      title: '骑手',
      dataIndex: ['knight', 'name'],
      key: 'knight',
      render: (v: string, record: any) => {
        if (v) return <Link to={`/knights/${record.knight?.id}`}>{v}</Link>
        return record.knight_id ? <Link to={`/knights/${record.knight_id}`}>{record.knight_id}</Link> : '-'
      },
    },
    {
      title: '运单号',
      dataIndex: ['waybill', 'order_no'],
      key: 'waybill',
      render: (v: string, record: any) => {
        if (v) return <Link to={`/waybills/${record.waybill?.id}`}>{v}</Link>
        return record.waybill_id ? <Link to={`/waybills/${record.waybill_id}`}>{record.waybill_id}</Link> : '-'
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => (
        <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>
          ¥{v?.toFixed(2) || '0.00'}
        </span>
      ),
      sorter: (a: any, b: any) => (a.amount || 0) - (b.amount || 0),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        if (v === 'paid') return <Badge color="green" text="已结算" />
        if (v === 'pending') return <Badge color="orange" text="待结算" />
        if (v === 'failed') return <Badge color="red" text="失败" />
        return <Badge text={v} />
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: formatTime,
    },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>
        <MoneyCollectOutlined style={{ marginRight: 8 }} />
        结算管理
      </h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总金额"
              value={stats.total || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已结算金额"
              value={stats.paid || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待结算笔数"
              value={stats.pending_count || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总笔数"
              value={stats.count || 0}
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space size={16} wrap>
          <span style={{ color: '#8c8c8c' }}>筛选:</span>
          <RangePicker
            onChange={(dates) => {
              setFilters({ ...filters, dateRange: dates || undefined })
              setPage(1)
            }}
          />
          <Select
            placeholder="结算状态"
            allowClear
            style={{ width: 140 }}
            onChange={(value) => {
              setFilters({ ...filters, status: value || undefined })
              setPage(1)
            }}
          >
            <Option value="pending">待结算</Option>
            <Option value="paid">已结算</Option>
            <Option value="failed">失败</Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => {
                setPage(p)
                setPageSize(ps)
              },
            }}
          />
        </Spin>
      </Card>
    </div>
  )
}
