import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Tag,
  Badge,
  Progress,
  Select,
  Modal,
  Form,
  Input,
  InputNumber,
  Card,
  Spin,
  message,
  Space,
  Rate,
  Switch,
} from 'antd'
import { PlusOutlined, EyeOutlined, PhoneOutlined } from '@ant-design/icons'
import { knightAPI } from '@/api'
import {
  KNIGHT_TYPE_COLORS,
  KNIGHT_TYPE_LABELS,
  KNIGHT_STATUS_COLORS,
  KNIGHT_STATUS_LABELS,
  formatTime,
} from '@/types'
import { Link } from 'react-router-dom'

const { Option } = Select

export default function KnightList() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<any>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [page, pageSize, filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize, ...filters }
      const result: any = await knightAPI.list(params)
      const items = result?.data?.list || result?.data || result || []
      const totalCount = result?.data?.total || items.length || 0
      setData(Array.isArray(items) ? items : [])
      setTotal(totalCount)
    } catch (error) {
      console.error('Failed to load knights', error)
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values: any) => {
    setSubmitting(true)
    try {
      await knightAPI.create({
        name: values.name,
        phone: values.phone,
        type: values.type,
        capacity: values.capacity || 10,
        credit_score: 100,
        lat: 31.2304,
        lng: 121.4737,
        current_load: 0,
      })
      message.success('骑手添加成功')
      setModalOpen(false)
      form.resetFields()
      loadData()
    } catch (error) {
      message.error('添加骑手失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusToggle = async (record: any, checked: boolean) => {
    try {
      await knightAPI.updateStatus(record.id, checked ? 'online' : 'offline')
      message.success('状态已更新')
      loadData()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const columns = [
    {
      title: '骑手',
      key: 'knight',
      render: (_: any, record: any) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{record.name}</span>
          <Tag color={KNIGHT_TYPE_COLORS[record.type]}>
            {KNIGHT_TYPE_LABELS[record.type]}
          </Tag>
        </Space>
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (v: string) => (
        <Space>
          <PhoneOutlined />
          {v}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string, record: any) => (
        <Space>
          <Badge color={KNIGHT_STATUS_COLORS[v]} text={KNIGHT_STATUS_LABELS[v]} />
          <Switch
            checked={v === 'online'}
            onChange={(checked) => handleStatusToggle(record, checked)}
            size="small"
          />
        </Space>
      ),
    },
    {
      title: '信用分',
      dataIndex: 'credit_score',
      key: 'credit_score',
      render: (v: number) => (
        <Progress
          percent={v || 0}
          size="small"
          strokeColor={v >= 80 ? '#52c41a' : v >= 60 ? '#faad14' : '#ff4d4f'}
          style={{ width: 100 }}
        />
      ),
    },
    {
      title: '当前负载',
      dataIndex: 'current_load',
      key: 'current_load',
      render: (v: number) => `${v || 0} 单`,
    },
    {
      title: '平均评分',
      dataIndex: 'avg_rating',
      key: 'avg_rating',
      render: (v: number) => (
        <Space>
          <Rate disabled value={v || 0} allowHalf style={{ fontSize: 12 }} />
          <span>{(v || 0).toFixed(1)}</span>
        </Space>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: formatTime,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Link to={`/knights/${record.id}`}>
          <Button size="small" icon={<EyeOutlined />}>
            详情
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>骑手管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          添加骑手
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size={16}>
          <Select
            placeholder="类型筛选"
            allowClear
            style={{ width: 160 }}
            onChange={(value) => {
              setFilters({ ...filters, type: value || undefined })
              setPage(1)
            }}
          >
            <Option value="certified">认证骑手</Option>
            <Option value="crowdsourced">众包骑手</Option>
          </Select>
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 160 }}
            onChange={(value) => {
              setFilters({ ...filters, status: value || undefined })
              setPage(1)
            }}
          >
            <Option value="online">在线</Option>
            <Option value="offline">离线</Option>
            <Option value="busy">忙碌</Option>
          </Select>
        </Space>
      </Card>

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

      <Modal
        title="添加骑手"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ type: 'crowdsourced', capacity: 10 }}
        >
          <Form.Item
            name="name"
            label="骑手姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入电话' }]}
          >
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item
            name="type"
            label="骑手类型"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="certified">
                <Tag color="gold">认证骑手</Tag>
              </Option>
              <Option value="crowdsourced">
                <Tag>众包骑手</Tag>
              </Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="capacity"
            label="配送容量"
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={50} style={{ width: '100%' }} placeholder="请输入配送容量" />
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                添加
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
