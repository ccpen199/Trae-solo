import { useEffect, useState, useCallback } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Popconfirm,
  DatePicker,
  Descriptions,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import request from '../utils/request'

const statusMap = {
  normal: { text: '正常', color: 'green' },
  frozen: { text: '冻结', color: 'orange' },
  closed: { text: '已关闭', color: 'red' },
}

const statusOptions = Object.entries(statusMap).map(([value, { text }]) => ({
  value,
  label: text,
}))

const editStatusOptions = [
  { value: 'normal', label: '正常' },
  { value: 'frozen', label: '冻结' },
  { value: 'closed', label: '已关闭' },
]

export default function Accounts() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState(undefined)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [form] = Form.useForm()

  const [rechargeOpen, setRechargeOpen] = useState(false)
  const [rechargeRecord, setRechargeRecord] = useState(null)
  const [rechargeLoading, setRechargeLoading] = useState(false)
  const [rechargeForm] = Form.useForm()

  const [statementOpen, setStatementOpen] = useState(false)
  const [statementRecord, setStatementRecord] = useState(null)
  const [statementData, setStatementData] = useState([])
  const [statementLoading, setStatementLoading] = useState(false)
  const [statementTotal, setStatementTotal] = useState(0)
  const [statementMonth, setStatementMonth] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, pageSize }
      if (statusFilter) params.status = statusFilter
      const res = await request.get('/accounts', { params })
      setData(res.data.list)
      setTotal(res.data.total)
    } catch {
      message.error('获取账户列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue({
      obu_id: record.obu_id,
      card_no: record.card_no,
      status: record.status,
    })
    setModalOpen(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      setConfirmLoading(true)
      if (editingRecord) {
        await request.put(`/accounts/${editingRecord.id}`, values)
        message.success('编辑账户成功')
      } else {
        await request.post('/accounts', values)
        message.success('添加账户成功')
      }
      setModalOpen(false)
      form.resetFields()
      setEditingRecord(null)
      fetchData()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '操作失败')
      }
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleModalCancel = () => {
    setModalOpen(false)
    form.resetFields()
    setEditingRecord(null)
  }

  const handleFreeze = async (record) => {
    try {
      await request.post(`/accounts/${record.id}/freeze`)
      message.success(record.status === 'frozen' ? '解冻成功' : '冻结成功')
      fetchData()
    } catch (err) {
      message.error(err.response?.data?.message || '操作失败')
    }
  }

  const handleRechargeOpen = (record) => {
    setRechargeRecord(record)
    rechargeForm.resetFields()
    setRechargeOpen(true)
  }

  const handleRechargeOk = async () => {
    try {
      const values = await rechargeForm.validateFields()
      setRechargeLoading(true)
      await request.post(`/accounts/${rechargeRecord.id}/recharge`, {
        amount: values.amount,
      })
      message.success('充值成功')
      setRechargeOpen(false)
      rechargeForm.resetFields()
      setRechargeRecord(null)
      fetchData()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '充值失败')
      }
    } finally {
      setRechargeLoading(false)
    }
  }

  const handleStatementOpen = (record) => {
    setStatementRecord(record)
    setStatementData([])
    setStatementTotal(0)
    setStatementMonth(null)
    setStatementOpen(true)
  }

  const fetchStatement = useCallback(
    async (year, month) => {
      if (!year || !month) return
      setStatementLoading(true)
      try {
        const res = await request.get(
          `/accounts/${statementRecord.id}/statement`,
          { params: { year, month } }
        )
        const records = res.data.records || res.data.list || []
        setStatementData(records.map((record) => ({
          type: '通行扣费',
          amount: record.fee,
          created_at: record.exit_time || record.created_at,
          description: `${record.vehicle_plate || '-'} ${record.road_segment || record.gantry_name || ''}`.trim(),
          ...record,
        })))
        setStatementTotal(Number(res.data.total_fee || res.data.total || 0))
      } catch {
        message.error('获取月结单失败')
      } finally {
        setStatementLoading(false)
      }
    },
    [statementRecord]
  )

  const handleMonthChange = (date) => {
    setStatementMonth(date)
    if (date) {
      fetchStatement(date.year(), date.month() + 1)
    } else {
      setStatementData([])
      setStatementTotal(0)
    }
  }

  const handleTableChange = (pagination) => {
    setPage(pagination.current)
    setPageSize(pagination.pageSize)
  }

  const handleStatusFilter = (value) => {
    setStatusFilter(value)
    setPage(1)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '账户号',
      dataIndex: 'account_no',
      key: 'account_no',
    },
    {
      title: '用户名',
      dataIndex: 'real_name',
      key: 'real_name',
    },
    {
      title: '设备SN',
      dataIndex: 'device_sn',
      key: 'device_sn',
    },
    {
      title: '卡号',
      dataIndex: 'card_no',
      key: 'card_no',
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (val) => (val != null ? `¥${Number(val).toFixed(2)}` : '-'),
    },
    {
      title: '冻结金额',
      dataIndex: 'frozen_amount',
      key: 'frozen_amount',
      render: (val) => (val != null ? `¥${Number(val).toFixed(2)}` : '-'),
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
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status !== 'closed' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleRechargeOpen(record)}
            >
              充值
            </Button>
          )}
          {record.status !== 'closed' && (
            <Popconfirm
              title={record.status === 'frozen' ? '确认解冻该账户？' : '确认冻结该账户？'}
              onConfirm={() => handleFreeze(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small">
                {record.status === 'frozen' ? '解冻' : '冻结'}
              </Button>
            </Popconfirm>
          )}
          <Button
            type="link"
            size="small"
            onClick={() => handleStatementOpen(record)}
          >
            月结单
          </Button>
        </Space>
      ),
    },
  ]

  const statementColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '交易类型', dataIndex: 'type', key: 'type' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v) => (v != null ? `¥${Number(v).toFixed(2)}` : '-') },
    { title: '交易时间', dataIndex: 'created_at', key: 'created_at' },
    { title: '描述', dataIndex: 'description', key: 'description' },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 20, fontWeight: 600 }}>ETC账户管理</h2>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="状态筛选"
          allowClear
          value={statusFilter}
          onChange={handleStatusFilter}
          options={statusOptions}
          style={{ width: 160 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加账户
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
        title={editingRecord ? '编辑账户' : '添加账户'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={confirmLoading}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {!editingRecord && (
            <>
              <Form.Item
                name="account_no"
                label="账户号"
                rules={[{ required: true, message: '请输入账户号' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="user_id"
                label="用户ID"
                rules={[{ required: true, message: '请输入用户ID' }]}
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="obu_id" label="OBU ID">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="card_no" label="卡号">
                <Input />
              </Form.Item>
              <Form.Item name="balance" label="余额">
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </>
          )}
          {editingRecord && (
            <>
              <Form.Item name="obu_id" label="OBU ID">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="card_no" label="卡号">
                <Input />
              </Form.Item>
              <Form.Item name="status" label="状态">
                <Select options={editStatusOptions} placeholder="请选择状态" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title="充值"
        open={rechargeOpen}
        onOk={handleRechargeOk}
        onCancel={() => {
          setRechargeOpen(false)
          rechargeForm.resetFields()
          setRechargeRecord(null)
        }}
        confirmLoading={rechargeLoading}
      >
        <Form form={rechargeForm} layout="vertical" preserve={false}>
          <Form.Item
            name="amount"
            label="充值金额"
            rules={[{ required: true, message: '请输入充值金额' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0.01} precision={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`月结单 - ${statementRecord?.account_no || ''}`}
        open={statementOpen}
        onCancel={() => {
          setStatementOpen(false)
          setStatementRecord(null)
          setStatementData([])
          setStatementTotal(0)
          setStatementMonth(null)
        }}
        footer={null}
        width={720}
      >
        <DatePicker
          picker="month"
          value={statementMonth}
          onChange={handleMonthChange}
          style={{ marginBottom: 16 }}
          placeholder="请选择年月"
        />
        <Table
          rowKey="id"
          columns={statementColumns}
          dataSource={statementData}
          loading={statementLoading}
          pagination={false}
          size="small"
        />
        {statementData.length > 0 && (
          <Descriptions bordered size="small" style={{ marginTop: 16 }} column={1}>
            <Descriptions.Item label="合计金额">
              ¥{statementTotal.toFixed(2)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}
