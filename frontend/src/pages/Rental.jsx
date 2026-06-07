import { useState, useEffect } from 'react'
import { Table, Card, Button, Space, Select, Tag, Modal, Form, InputNumber, Switch, message, Popconfirm } from 'antd'
import { PlusOutlined, ReloadOutlined, SyncOutlined, StopOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { rentalApi, cabinetApi } from '../api'
import dayjs from 'dayjs'

const { Option } = Select

const statusMap = {
  active: { text: '进行中', color: 'success' },
  expired: { text: '已到期', color: 'warning' },
  ended: { text: '已结束', color: 'default' },
  cancelled: { text: '已取消', color: 'default' }
}

const hourlyRateMap = { S: 1.5, M: 2.5, L: 3.5 }

export default function Rental() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [cabinets, setCabinets] = useState([])
  const [form] = Form.useForm()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const boxSize = Form.useWatch('boxSize', form)
  const durationHours = Form.useWatch('durationHours', form)

  useEffect(() => {
    loadOrders()
    loadCabinets()
  }, [pagination.current, pagination.pageSize, statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const response = await rentalApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        courierId: user.id,
        status: statusFilter
      })
      setOrders(response.data.list)
      setPagination(prev => ({ ...prev, total: response.data.total }))
    } catch (error) {
      message.error('加载订单列表失败')
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
      await rentalApi.create({
        courierId: user.id,
        cabinetId: values.cabinetId,
        boxSize: values.boxSize,
        durationHours: values.durationHours,
        autoRenew: values.autoRenew
      })
      message.success('租用成功')
      setCreateModalVisible(false)
      form.resetFields()
      loadOrders()
    } catch (error) {
      message.error('租用失败')
    }
  }

  const handleToggleRenew = async (id) => {
    try {
      await rentalApi.toggleRenew(id)
      message.success('自动续费状态已切换')
      loadOrders()
    } catch (error) {
      message.error('切换自动续费失败')
    }
  }

  const handleEndRental = async (id) => {
    try {
      await rentalApi.endRental(id)
      message.success('租用已结束')
      loadOrders()
    } catch (error) {
      message.error('结束租用失败')
    }
  }

  const estimatedCost = (durationHours && boxSize) ? (durationHours * (hourlyRateMap[boxSize] || 0)).toFixed(2) : null

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
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
      title: '租用时长',
      dataIndex: 'duration_hours',
      key: 'duration_hours',
      width: 100,
      render: (hours) => `${hours} 小时`
    },
    {
      title: '已用/剩余',
      key: 'time_progress',
      width: 130,
      render: (_, record) => {
        if (record.status !== 'active') return '-'
        const elapsed = record.elapsedHours != null ? record.elapsedHours.toFixed(1) : '-'
        const remaining = record.remainingHours != null ? record.remainingHours.toFixed(1) : '-'
        return (
          <div>
            <div>已用: {elapsed}h</div>
            <div>剩余: {remaining}h</div>
          </div>
        )
      }
    },
    {
      title: '费率',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      width: 90,
      render: (rate) => rate != null ? <span>¥{rate}/h</span> : '-'
    },
    {
      title: '续费费用',
      dataIndex: 'renewalCost',
      key: 'renewalCost',
      width: 100,
      render: (cost) => cost != null ? (
        <span style={{ color: '#fa8c16' }}>¥{cost}/12h</span>
      ) : '-'
    },
    {
      title: '费用',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => <span style={{ color: '#ff6b35', fontWeight: 500 }}>¥{amount}</span>
    },
    {
      title: '自动续费',
      key: 'auto_renew',
      width: 120,
      render: (_, record) => {
        if (record.status !== 'active') {
          return record.auto_renew ? <Tag color="green">开启</Tag> : <Tag>关闭</Tag>
        }
        return record.autoRenewEnabled ? (
          <Space>
            <Tag color="green" icon={<SyncOutlined />}>开启</Tag>
            <Button type="link" size="small" onClick={() => handleToggleRenew(record.id)}>关闭</Button>
          </Space>
        ) : (
          <Space>
            <Tag>关闭</Tag>
            <Button type="link" size="small" onClick={() => handleToggleRenew(record.id)}>开启</Button>
          </Space>
        )
      }
    },
    {
      title: '开始时间',
      dataIndex: 'start_time',
      key: 'start_time',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '到期时间',
      dataIndex: 'end_time',
      key: 'end_time',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
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
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        record.status === 'active' ? (
          <Popconfirm
            title="确认结束租用？结束后将结算费用。"
            onConfirm={() => handleEndRental(record.id)}
          >
            <Button type="link" size="small" danger icon={<StopOutlined />}>
              结束租用
            </Button>
          </Popconfirm>
        ) : null
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
              <Option value="active">进行中</Option>
              <Option value="expired">已到期</Option>
              <Option value="ended">已结束</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadOrders}>刷新</Button>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            新建租用
          </Button>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条订单`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
          }}
        />
      </Card>

      <Modal
        title="新建箱格租用"
        open={createModalVisible}
        onCancel={() => { setCreateModalVisible(false); form.resetFields() }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ durationHours: 24, autoRenew: false }}>
          <Form.Item
            name="cabinetId"
            label="选择柜机"
            rules={[{ required: true, message: '请选择柜机' }]}
          >
            <Select placeholder="请选择柜机">
              {cabinets.map(cabinet => (
                <Option key={cabinet.id} value={cabinet.id}>
                  {cabinet.name}
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
              <Option value="S">小号 (S) - ¥1.5/h</Option>
              <Option value="M">中号 (M) - ¥2.5/h</Option>
              <Option value="L">大号 (L) - ¥3.5/h</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="durationHours"
            label="租用时长（小时）"
            rules={[{ required: true, message: '请输入租用时长' }]}
          >
            <InputNumber min={1} max={720} style={{ width: '100%' }} placeholder="请输入租用时长" />
          </Form.Item>
          <Form.Item
            name="autoRenew"
            label="自动续费"
            valuePropName="checked"
          >
            <Switch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>
          {estimatedCost && (
            <div style={{ padding: '12px', background: '#f6ffed', borderRadius: 4, marginBottom: 16, border: '1px solid #b7eb8f' }}>
              <div style={{ color: '#52c41a', fontWeight: 500, marginBottom: 4 }}>费用预估</div>
              <div style={{ color: '#333', fontSize: 14 }}>
                {durationHours}h × ¥{hourlyRateMap[boxSize]}/h = <span style={{ color: '#ff6b35', fontWeight: 600, fontSize: 16 }}>¥{estimatedCost}</span>
              </div>
              <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                续费费用：¥{(12 * (hourlyRateMap[boxSize] || 0)).toFixed(2)}/12h
              </div>
            </div>
          )}
          <div style={{ padding: '12px', background: '#fff7e6', borderRadius: 4, marginBottom: 16 }}>
            <div style={{ color: '#fa8c16', fontWeight: 500, marginBottom: 4 }}>费用说明</div>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#666', fontSize: 12 }}>
              <li>收费标准：S=1.5元/小时，M=2.5元/小时，L=3.5元/小时</li>
              <li>自动续费到期后自动续期12小时</li>
              <li>可随时提前结束租用</li>
            </ul>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认租用</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
