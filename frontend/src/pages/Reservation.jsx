import { useState, useEffect } from 'react'
import { Table, Card, Button, Space, Select, Tag, Modal, Form, DatePicker, message, Popconfirm } from 'antd'
import { PlusOutlined, ReloadOutlined, ClockCircleOutlined, CloseOutlined, LockOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { reservationApi, cabinetApi } from '../api'
import dayjs from 'dayjs'

const { Option } = Select

const statusMap = {
  pending: { text: '待使用', color: 'blue' },
  locked: { text: '已锁定', color: 'purple' },
  used: { text: '已使用', color: 'success' },
  cancelled: { text: '已取消', color: 'default' },
  expired: { text: '已过期', color: 'warning' }
}

const sizeOptions = [
  { value: 'S', label: '小号 (S)' },
  { value: 'M', label: '中号 (M)' },
  { value: 'L', label: '大号 (L)' }
]

export default function Reservation() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [cabinets, setCabinets] = useState([])
  const [form] = Form.useForm()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadReservations()
    loadCabinets()
  }, [pagination.current, pagination.pageSize, statusFilter])

  const loadReservations = async () => {
    setLoading(true)
    try {
      const response = await reservationApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        courierId: user.id,
        status: statusFilter
      })
      setReservations(response.data.list)
      setPagination(prev => ({ ...prev, total: response.data.total }))
    } catch (error) {
      message.error('加载预约列表失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCabinets = async () => {
    try {
      const response = await cabinetApi.getList({ pageSize: 100, status: 'online' })
      setCabinets(response.data.list)
    } catch (error) {
      console.error('加载柜机列表失败', error)
    }
  }

  const handleCreate = async (values) => {
    try {
      await reservationApi.create({
        courierId: user.id,
        cabinetId: values.cabinetId,
        boxSize: values.boxSize,
        reservedTime: values.reservedTime.toISOString()
      })
      message.success('预约成功')
      setCreateModalVisible(false)
      form.resetFields()
      loadReservations()
    } catch (error) {
      message.error('预约失败')
    }
  }

  const handleCancel = async (id) => {
    try {
      await reservationApi.cancel(id)
      message.success('已取消预约')
      loadReservations()
    } catch (error) {
      message.error('取消失败')
    }
  }

  const handleLock = async (id) => {
    try {
      await reservationApi.lock(id)
      message.success('已锁定格口')
      loadReservations()
    } catch (error) {
      message.error('锁定失败')
    }
  }

  const handleReleaseExpired = async () => {
    try {
      const response = await reservationApi.releaseExpired()
      const count = response.data?.count ?? 0
      message.success(`已释放 ${count} 条过期预约`)
      loadReservations()
    } catch (error) {
      message.error('释放过期预约失败')
    }
  }

  const disabledDate = (current) => {
    const now = dayjs()
    const maxDate = now.add(24, 'hour')
    return current && (current < now.startOf('minute') || current > maxDate)
  }

  const columns = [
    {
      title: '预约编号',
      dataIndex: 'reservation_no',
      key: 'reservation_no',
      width: 150,
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '柜机',
      dataIndex: 'cabinet_name',
      key: 'cabinet_name',
      width: 150
    },
    {
      title: '格口大小',
      dataIndex: 'box_size',
      key: 'box_size',
      width: 100,
      render: (size) => <Tag color="blue">{size}</Tag>
    },
    {
      title: '预约时间',
      dataIndex: 'reserved_time',
      key: 'reserved_time',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '过期时间',
      dataIndex: 'expires_at',
      key: 'expires_at',
      width: 170,
      render: (time) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#faad14' }} />
          <span>{time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'}</span>
        </Space>
      )
    },
    {
      title: '剩余时间',
      dataIndex: 'remainingMinutes',
      key: 'remainingMinutes',
      width: 120,
      render: (minutes, record) => {
        if (record.status !== 'pending' && record.status !== 'locked') return '-'
        if (minutes == null) return '-'
        if (minutes <= 0) return <Tag color="red">已超时</Tag>
        if (minutes <= 5) return <Tag color="red">{minutes} 分钟</Tag>
        if (minutes <= 15) return <Tag color="orange">{minutes} 分钟</Tag>
        return <Tag color="blue">{minutes} 分钟</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status, record) => (
        <Space>
          <Tag color={(statusMap[status] || { color: 'default' }).color}>
            {(statusMap[status] || { text: status }).text}
          </Tag>
          {record.isExpired && <Tag color="error" icon={<ExclamationCircleOutlined />}>已超时</Tag>}
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <Popconfirm
              title="确认锁定该格口？"
              onConfirm={() => handleLock(record.id)}
            >
              <Button type="link" size="small" icon={<LockOutlined />}>
                锁定格口
              </Button>
            </Popconfirm>
          )}
          {(record.status === 'pending' || record.status === 'locked') && (
            <Popconfirm
              title="确认取消预约？"
              onConfirm={() => handleCancel(record.id)}
            >
              <Button type="link" size="small" danger icon={<CloseOutlined />}>
                取消预约
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Select
              placeholder="状态筛选"
              style={{ width: 130 }}
              allowClear
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter(v)}
            >
              <Option value="pending">待使用</Option>
              <Option value="locked">已锁定</Option>
              <Option value="used">已使用</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="expired">已过期</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadReservations}>刷新</Button>
            <Popconfirm
              title="确认释放所有过期预约？"
              onConfirm={handleReleaseExpired}
            >
              <Button icon={<DeleteOutlined />} danger>释放过期</Button>
            </Popconfirm>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            新建预约
          </Button>
        </div>

        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fff7e6', borderRadius: 4, border: '1px solid #ffe58f' }}>
          <ClockCircleOutlined style={{ color: '#fa8c16', marginRight: 6 }} />
          <span style={{ color: '#d46b08' }}>预约保留30分钟，超时自动释放</span>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={reservations}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条预约记录`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
          }}
        />
      </Card>

      <Modal
        title="新建空箱预约"
        open={createModalVisible}
        onCancel={() => { setCreateModalVisible(false); form.resetFields() }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="cabinetId"
            label="选择柜机"
            rules={[{ required: true, message: '请选择柜机' }]}
          >
            <Select placeholder="请选择柜机">
              {cabinets.map(cabinet => (
                <Option key={cabinet.id} value={cabinet.id}>
                  {cabinet.name} (可用: {cabinet.available_boxes} 格)
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="boxSize"
            label="格口大小"
            rules={[{ required: true, message: '请选择格口大小' }]}
          >
            <Select placeholder="请选择格口大小">
              {sizeOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="reservedTime"
            label="预约时间"
            rules={[{ required: true, message: '请选择预约时间' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              disabledDate={disabledDate}
              placeholder="请选择预约时间（未来24小时内）"
              format="YYYY-MM-DD HH:mm"
              minuteStep={30}
            />
          </Form.Item>
          <div style={{ padding: '12px', background: '#e6f7ff', borderRadius: 4, marginBottom: 16 }}>
            <div style={{ color: '#1890ff', fontWeight: 500, marginBottom: 4 }}>预约须知</div>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 12 }}>
              <li>预约保留30分钟，超时自动释放</li>
              <li>支持未来24小时内预约</li>
              <li>如需取消请提前操作</li>
            </ul>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认预约</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
