import { useEffect, useState, useCallback } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  DatePicker,
  Space,
  Tag,
  Popconfirm,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import request from '../utils/request'

const statusMap = {
  pending: { text: '待确认', color: 'orange' },
  confirmed: { text: '已确认', color: 'green' },
  disputed: { text: '有争议', color: 'red' },
}

const statusOptions = Object.entries(statusMap).map(([value, { text }]) => ({
  value,
  label: text,
}))

function formatAmount(val) {
  if (val == null) return '-'
  return `¥${Number(val).toFixed(2)}`
}

export default function Settlements() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState(undefined)

  const [addOpen, setAddOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addForm] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, pageSize }
      if (statusFilter) params.status = statusFilter
      const res = await request.get('/operations/settlements', { params })
      setData(res.data.list)
      setTotal(res.data.total)
    } catch {
      message.error('获取结算列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTableChange = (pagination) => {
    setPage(pagination.current)
    setPageSize(pagination.pageSize)
  }

  const handleReset = () => {
    setStatusFilter(undefined)
    setPage(1)
  }

  const handleAddOpen = () => {
    addForm.resetFields()
    setAddOpen(true)
  }

  const handleAddOk = async () => {
    try {
      const values = await addForm.validateFields()
      setAddLoading(true)
      const payload = {
        ...values,
        period_start: values.period_start.format('YYYY-MM-DD'),
        period_end: values.period_end.format('YYYY-MM-DD'),
      }
      await request.post('/operations/settlements', payload)
      message.success('新增结算记录成功')
      setAddOpen(false)
      addForm.resetFields()
      fetchData()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '新增结算记录失败')
      }
    } finally {
      setAddLoading(false)
    }
  }

  const handleStatusChange = async (record, newStatus) => {
    try {
      await request.put(`/operations/settlements/${record.id}`, { status: newStatus })
      message.success('状态更新成功')
      fetchData()
    } catch (err) {
      message.error(err.response?.data?.message || '状态更新失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '结算周期开始',
      dataIndex: 'period_start',
      key: 'period_start',
    },
    {
      title: '结算周期结束',
      dataIndex: 'period_end',
      key: 'period_end',
    },
    {
      title: '高速集团金额(¥)',
      dataIndex: 'highway_group_amount',
      key: 'highway_group_amount',
      render: (val) => formatAmount(val),
    },
    {
      title: '银行金额(¥)',
      dataIndex: 'bank_amount',
      key: 'bank_amount',
      render: (val) => formatAmount(val),
    },
    {
      title: '差额(¥)',
      dataIndex: 'difference',
      key: 'difference',
      render: (val) => (
        <span style={val != null && val !== 0 ? { color: 'red', fontWeight: 600 } : {}}>
          {formatAmount(val)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const cfg = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={cfg.color}>{cfg.text}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确认该结算记录？"
                onConfirm={() => handleStatusChange(record, 'confirmed')}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small">
                  确认
                </Button>
              </Popconfirm>
              <Popconfirm
                title="对该结算记录发起争议？"
                onConfirm={() => handleStatusChange(record, 'disputed')}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" danger>
                  争议
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 20, fontWeight: 600 }}>结算对账</h2>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="状态筛选"
          allowClear
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
          options={statusOptions}
          style={{ width: 160 }}
        />
        <Button onClick={handleReset}>重置</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddOpen}>
          新增结算
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title="新增结算记录"
        open={addOpen}
        onOk={handleAddOk}
        onCancel={() => {
          setAddOpen(false)
          addForm.resetFields()
        }}
        confirmLoading={addLoading}
        width={520}
      >
        <Form form={addForm} layout="vertical" preserve={false}>
          <Form.Item
            name="period_start"
            label="结算周期开始"
            rules={[{ required: true, message: '请选择结算周期开始日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="period_end"
            label="结算周期结束"
            rules={[{ required: true, message: '请选择结算周期结束日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="highway_group_amount" label="高速集团金额(¥)">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="bank_amount" label="银行金额(¥)">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="difference" label="差额(¥)">
            <InputNumber precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
