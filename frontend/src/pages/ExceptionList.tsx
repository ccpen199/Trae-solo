import { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Badge,
  Select,
  Modal,
  Spin,
  message,
  Space,
  Popconfirm,
} from 'antd'
import {
  WarningOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { exceptionAPI, waybillAPI } from '@/api'
import {
  EXCEPTION_TYPE_COLORS,
  EXCEPTION_TYPE_LABELS,
  formatTime,
} from '@/types'
import { Link } from 'react-router-dom'

const { Option } = Select

export default function ExceptionList() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    loadData()
  }, [page, pageSize, filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize, ...filters }
      const result: any = await exceptionAPI.list(params)
      const items = result?.data?.list || result?.data || result || []
      const totalCount = result?.data?.total || items.length || 0
      setData(Array.isArray(items) ? items : [])
      setTotal(totalCount)
    } catch (error) {
      console.error('Failed to load exceptions', error)
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const handleCheck = async (record: any) => {
    try {
      await exceptionAPI.check(record.id)
      message.success('已触发人工核验')
      loadData()
    } catch (error) {
      message.error('核验失败')
    }
  }

  const handleResolve = async (record: any) => {
    try {
      await exceptionAPI.resolve(record.id, { reassign: true })
      message.success('已重新分配骑手')
      loadData()
    } catch (error) {
      message.error('处理失败')
    }
  }

  const columns = [
    {
      title: '运单号',
      dataIndex: ['waybill', 'order_no'],
      key: 'order_no',
      render: (v: string, record: any) => (
        <Link to={`/waybills/${record.waybill?.id || record.waybill_id}`}>
          {v || record.waybill_id}
        </Link>
      ),
    },
    {
      title: '异常类型',
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => (
        <Tag color={EXCEPTION_TYPE_COLORS[v]}>
          <WarningOutlined style={{ marginRight: 4 }} />
          {EXCEPTION_TYPE_LABELS[v] || v}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'resolved',
      key: 'status',
      render: (v: boolean) => (
        v ? <Badge color="green" text="已解决" /> : <Badge color="orange" text="处理中" />
      ),
    },
    {
      title: '原骑手',
      dataIndex: ['original_knight', 'name'],
      key: 'original_knight',
      render: (v: string, record: any) => {
        if (v) return <Link to={`/knights/${record.original_knight?.id}`}>{v}</Link>
        return record.original_knight_id ? (
          <Link to={`/knights/${record.original_knight_id}`}>{record.original_knight_id}</Link>
        ) : '-'
      },
    },
    {
      title: '新骑手',
      dataIndex: ['new_knight', 'name'],
      key: 'new_knight',
      render: (v: string, record: any) => {
        if (v) return <Link to={`/knights/${record.new_knight?.id}`}>{v}</Link>
        if (record.new_knight_id) return <Link to={`/knights/${record.new_knight_id}`}>{record.new_knight_id}</Link>
        return <Tag color="orange">待分配</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: formatTime,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Link to={`/waybills/${record.waybill?.id || record.waybill_id}`}>
            <Button size="small" icon={<EyeOutlined />}>
              运单详情
            </Button>
          </Link>
          {!record.checked && (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCheck(record)}
            >
              人工核验
            </Button>
          )}
          {!record.resolved && (
            <Popconfirm
              title="确认重新分配骑手？"
              description="系统将自动寻找新的骑手完成配送"
              onConfirm={() => handleResolve(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button size="small" type="primary" icon={<SyncOutlined />}>
                重新分配
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const unresolvedCount = data.filter((d) => !d.resolved).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <Space>
          <h2 style={{ margin: 0 }}>异常处理</h2>
          <Badge count={unresolvedCount} color="red" offset={[4, 0]} />
        </Space>
        <Space>
          <Select
            placeholder="类型筛选"
            allowClear
            style={{ width: 140 }}
            onChange={(value) => {
              setFilters({ ...filters, type: value || undefined })
              setPage(1)
            }}
          >
            <Option value="pickup_timeout">取件超时</Option>
            <Option value="knight_offline">骑手离线</Option>
            <Option value="delivery_timeout">配送超时</Option>
          </Select>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 140 }}
            onChange={(value) => {
              setFilters({ ...filters, resolved: value !== undefined ? value : undefined })
              setPage(1)
            }}
          >
            <Option value={false}>处理中</Option>
            <Option value={true}>已解决</Option>
          </Select>
        </Space>
      </div>

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
