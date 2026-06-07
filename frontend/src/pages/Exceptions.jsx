import { useEffect, useState, useCallback } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Space,
  Tag,
  Descriptions,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import request from '../utils/request'

const { RangePicker } = DatePicker

const typeMap = {
  deduction_failed: { text: '扣费失败', color: 'red' },
  path_missing: { text: '路径缺失', color: 'orange' },
  duplicate_billing: { text: '重复计费', color: 'volcano' },
}

const typeOptions = Object.entries(typeMap).map(([value, { text }]) => ({
  value,
  label: text,
}))

const statusMap = {
  pending: { text: '待处理', color: 'orange' },
  processing: { text: '处理中', color: 'blue' },
  resolved: { text: '已解决', color: 'green' },
}

const statusOptions = Object.entries(statusMap).map(([value, { text }]) => ({
  value,
  label: text,
}))

export default function Exceptions() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [typeFilter, setTypeFilter] = useState(undefined)
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [dateRange, setDateRange] = useState(null)

  const [addOpen, setAddOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addForm] = Form.useForm()

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, pageSize }
      if (typeFilter) params.type = typeFilter
      if (statusFilter) params.status = statusFilter
      if (dateRange && dateRange[0]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      const res = await request.get('/exceptions', { params })
      setData(res.data.list)
      setTotal(res.data.total)
    } catch {
      message.error('获取异常事件失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, typeFilter, statusFilter, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleTableChange = (pagination) => {
    setPage(pagination.current)
    setPageSize(pagination.pageSize)
  }

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleReset = () => {
    setTypeFilter(undefined)
    setStatusFilter(undefined)
    setDateRange(null)
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
      await request.post('/exceptions', values)
      message.success('新建异常成功')
      setAddOpen(false)
      addForm.resetFields()
      fetchData()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '新建异常失败')
      }
    } finally {
      setAddLoading(false)
    }
  }

  const handleDetail = async (record) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailRecord(null)
    try {
      const res = await request.get(`/exceptions/${record.id}`)
      setDetailRecord(res.data)
    } catch {
      message.error('获取详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleUpdateStatus = async (record, newStatus) => {
    try {
      await request.put(`/exceptions/${record.id}`, { status: newStatus })
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
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const cfg = typeMap[type] || { text: type, color: 'default' }
        return <Tag color={cfg.color}>{cfg.text}</Tag>
      },
    },
    {
      title: '关联通行记录ID',
      dataIndex: 'toll_record_id',
      key: 'toll_record_id',
      width: 140,
    },
    {
      title: '关联账户号',
      dataIndex: 'account_no',
      key: 'account_no',
    },
    {
      title: '车牌号',
      dataIndex: 'vehicle_plate',
      key: 'vehicle_plate',
      render: (val) => val && <Tag color="blue">{val}</Tag>,
    },
    {
      title: '门架名称',
      dataIndex: 'gantry_name',
      key: 'gantry_name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
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
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => handleUpdateStatus(record, 'processing')}>
              处理
            </Button>
          )}
          {record.status === 'processing' && (
            <Button type="link" size="small" onClick={() => handleUpdateStatus(record, 'resolved')}>
              解决
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 20, fontWeight: 600 }}>异常事件管理</h2>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="类型筛选"
          allowClear
          value={typeFilter}
          onChange={(value) => {
            setTypeFilter(value)
            setPage(1)
          }}
          options={typeOptions}
          style={{ width: 160 }}
        />
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
        <RangePicker
          value={dateRange}
          onChange={(dates) => {
            setDateRange(dates)
            setPage(1)
          }}
          placeholder={['开始日期', '结束日期']}
        />
        <Button type="primary" onClick={handleSearch}>
          查询
        </Button>
        <Button onClick={handleReset}>重置</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddOpen}>
          新建异常
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
        title="新建异常"
        open={addOpen}
        onOk={handleAddOk}
        onCancel={() => {
          setAddOpen(false)
          addForm.resetFields()
        }}
        confirmLoading={addLoading}
        width={600}
      >
        <Form form={addForm} layout="vertical" preserve={false}>
          <Form.Item
            name="type"
            label="类型"
            rules={[{ required: true, message: '请选择类型' }]}
          >
            <Select options={typeOptions} placeholder="请选择异常类型" />
          </Form.Item>
          <Form.Item
            name="toll_record_id"
            label="关联通行记录ID"
            rules={[{ required: true, message: '请输入关联通行记录ID' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="account_id"
            label="关联账户ID"
            rules={[{ required: true, message: '请输入关联账户ID' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="异常详情"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false)
          setDetailRecord(null)
        }}
        footer={null}
        width={640}
        loading={detailLoading}
      >
        {detailRecord && (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="ID">{detailRecord.id}</Descriptions.Item>
            <Descriptions.Item label="类型">
              <Tag color={(typeMap[detailRecord.type] || {}).color || 'default'}>
                {(typeMap[detailRecord.type] || {}).text || detailRecord.type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="关联通行记录ID">{detailRecord.toll_record_id}</Descriptions.Item>
            <Descriptions.Item label="关联账户号">{detailRecord.account_no}</Descriptions.Item>
            <Descriptions.Item label="车牌号">{detailRecord.vehicle_plate}</Descriptions.Item>
            <Descriptions.Item label="门架名称">{detailRecord.gantry_name}</Descriptions.Item>
            <Descriptions.Item label="描述">{detailRecord.description}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={(statusMap[detailRecord.status] || {}).color || 'default'}>
                {(statusMap[detailRecord.status] || {}).text || detailRecord.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="账户余额">
              {detailRecord.account_balance != null
                ? `¥${Number(detailRecord.account_balance).toFixed(2)}`
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{detailRecord.created_at}</Descriptions.Item>
            {detailRecord.toll_record && (
              <>
                <Descriptions.Item label="通行记录-入口时间">
                  {detailRecord.toll_record.entry_time}
                </Descriptions.Item>
                <Descriptions.Item label="通行记录-出口时间">
                  {detailRecord.toll_record.exit_time}
                </Descriptions.Item>
                <Descriptions.Item label="通行记录-费用">
                  {detailRecord.toll_record.fee != null
                    ? `¥${Number(detailRecord.toll_record.fee).toFixed(2)}`
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="通行记录-路段">
                  {detailRecord.toll_record.road_segment}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
