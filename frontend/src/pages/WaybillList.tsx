import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Tag,
  Badge,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  Row,
  Col,
  Card,
  Spin,
  message,
  Space,
  Descriptions,
} from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined, StopOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { waybillAPI } from '@/api'
import { useAuthStore } from '@/store'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  formatTime,
  INSURANCE_LEVEL_COLORS,
  INSURANCE_LEVEL_LABELS,
} from '@/types'
import { Link } from 'react-router-dom'

const { RangePicker } = DatePicker
const { Option } = Select
const { Search } = Input

const CATEGORIES = ['food', 'fresh', 'document', 'gift']
const STATUSES = ['pending', 'accepted', 'picked_up', 'delivering', 'signed', 'completed', 'cancelled']
const INSURANCE_LEVELS = ['basic', 'standard', 'premium']

export default function WaybillList() {
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<any>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [calculatedFee, setCalculatedFee] = useState<number>(0)

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
      const result: any = await waybillAPI.list(params)
      const items = result?.data?.list || result?.data || result || []
      const totalCount = result?.data?.total || items.length || 0
      setData(Array.isArray(items) ? items : [])
      setTotal(totalCount)
    } catch (error) {
      console.error('Failed to load waybills', error)
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values: any) => {
    setSubmitting(true)
    try {
      const requiredFields = ['sender_name', 'sender_phone', 'sender_address', 'receiver_name', 'receiver_phone', 'receiver_address', 'category', 'insurance_level']
      const missing = requiredFields.filter(f => !values[f])
      if (missing.length > 0) {
        const fieldLabels: Record<string, string> = {
          sender_name: '寄件人姓名',
          sender_phone: '寄件人电话',
          sender_address: '寄件人地址',
          receiver_name: '收件人姓名',
          receiver_phone: '收件人电话',
          receiver_address: '收件人地址',
          category: '物品品类',
          insurance_level: '保险等级',
        }
        const missingLabels = missing.map(f => fieldLabels[f] || f).join('、')
        message.error(`创建失败：请完善必填信息 - ${missingLabels}`)
        return
      }

      const insuranceValue = values.insurance_level === 'premium' ? 1000 : values.insurance_level === 'standard' ? 500 : 100
      const payload = {
        merchant_id: user?.id,
        sender_name: values.sender_name,
        sender_phone: values.sender_phone,
        sender_address: values.sender_address,
        sender_lat: 31.2304 + Math.random() * 0.01,
        sender_lng: 121.4737 + Math.random() * 0.01,
        receiver_name: values.receiver_name,
        receiver_phone: values.receiver_phone,
        receiver_address: values.receiver_address,
        receiver_lat: 31.2304 + Math.random() * 0.02,
        receiver_lng: 121.4737 + Math.random() * 0.02,
        category: values.category,
        insurance_level: values.insurance_level,
        insurance_value: insuranceValue,
        fee: calculatedFee,
      }
      await waybillAPI.create(payload)
      message.success('运单创建成功')
      setModalOpen(false)
      form.resetFields()
      setCalculatedFee(0)
      loadData()
    } catch (error: any) {
      message.error(`创建失败：${error?.message || '服务器异常，请重试'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    Modal.confirm({
      title: '确认取消运单',
      content: '取消后运单将无法恢复，是否继续？',
      onOk: async () => {
        try {
          await waybillAPI.cancel(id)
          message.success('运单已取消')
          loadData()
        } catch (error) {
          message.error('取消失败')
        }
      },
    })
  }

  const calculateFee = () => {
    const baseFee = 8
    const categoryFee: Record<string, number> = { food: 2, fresh: 5, document: 1, gift: 3 }
    const insuranceFee: Record<string, number> = { basic: 0, standard: 2, premium: 5 }
    const category = form.getFieldValue('category') || 'food'
    const insurance = form.getFieldValue('insurance_level') || 'basic'
    const distance = 3 + Math.random() * 5
    const fee = baseFee + distance * 1.5 + categoryFee[category] + insuranceFee[insurance]
    setCalculatedFee(Math.round(fee * 100) / 100)
  }

  const getSLADeadlines = () => {
    const insurance = form.getFieldValue('insurance_level') || 'basic'
    const now = new Date()
    const responseDeadline = new Date(now.getTime() + 1 * 60 * 1000)
    const pickupDeadline = new Date(now.getTime() + 8 * 60 * 1000)
    let deliverMinutes = 60
    if (insurance === 'standard') deliverMinutes = 45
    if (insurance === 'premium') deliverMinutes = 30
    const deliverDeadline = new Date(now.getTime() + deliverMinutes * 60 * 1000)
    return { responseDeadline, pickupDeadline, deliverDeadline, deliverMinutes }
  }

  const columns = [
    {
      title: '运单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (v: string, record: any) => <Link to={`/waybills/${record.id}`}>{v}</Link>,
    },
    {
      title: '寄件人',
      dataIndex: 'sender_name',
      key: 'sender',
    },
    {
      title: '收件人',
      dataIndex: 'receiver_name',
      key: 'receiver',
    },
    {
      title: '品类',
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => (
        <Tag color={CATEGORY_COLORS[v]}>{CATEGORY_LABELS[v] || v}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Badge color={STATUS_COLORS[v]} text={STATUS_LABELS[v] || v} />
      ),
    },
    {
      title: '骑手',
      dataIndex: 'knight_name',
      key: 'knight',
      render: (v: string) => v || '-',
    },
    {
      title: '费用',
      dataIndex: 'fee',
      key: 'fee',
      render: (v: number) => `¥${v?.toFixed(2) || '0.00'}`,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => formatTime(v),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Link to={`/waybills/${record.id}`}>
            <Button size="small" icon={<EyeOutlined />}>
              详情
            </Button>
          </Link>
          {record.status !== 'completed' && record.status !== 'cancelled' && (
            <Button
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleCancel(record.id)}
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 16 },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>运单管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          新建运单
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索运单号"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={(value) => {
                setFilters({ ...filters, order_no: value || undefined })
                setPage(1)
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => {
                setFilters({ ...filters, status: value || undefined })
                setPage(1)
              }}
            >
              {STATUSES.map((s) => (
                <Option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5}>
            <Select
              placeholder="品类筛选"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => {
                setFilters({ ...filters, category: value || undefined })
                setPage(1)
              }}
            >
              {CATEGORIES.map((c) => (
                <Option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => {
                setFilters({ ...filters, dateRange: dates || undefined })
                setPage(1)
              }}
            />
          </Col>
        </Row>
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
        title="新建运单"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        footer={null}
        width={700}
        destroyOnClose
        afterOpenChange={(open) => {
          if (open) {
            setTimeout(() => calculateFee(), 100)
          }
        }}
      >
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleCreate}
          onFinishFailed={(errorInfo) => {
            const errors = errorInfo.errorFields.map((f) => f.errors.join(', ')).join('; ')
            message.error(`创建失败：${errors || '请完善必填信息'}`)
          }}
          initialValues={{ category: 'food', insurance_level: 'basic' }}
          onValuesChange={() => calculateFee()}
        >
          <Card title="寄件人信息" size="small" style={{ marginBottom: 12 }}>
            <Row gutter={[8, 8]}>
              <Col span={8}>
                <Form.Item
                  name="sender_name"
                  label="姓名"
                  rules={[{ required: true, message: '请输入姓名' }]}
                  {...formItemLayout}
                >
                  <Input placeholder="请输入姓名" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="sender_phone"
                  label="电话"
                  rules={[{ required: true, message: '请输入电话' }]}
                  {...formItemLayout}
                >
                  <Input placeholder="请输入电话" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="sender_address"
                  label="地址"
                  rules={[{ required: true, message: '请输入地址' }]}
                  {...formItemLayout}
                >
                  <Input placeholder="请输入地址" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="收件人信息" size="small" style={{ marginBottom: 12 }}>
            <Row gutter={[8, 8]}>
              <Col span={8}>
                <Form.Item
                  name="receiver_name"
                  label="姓名"
                  rules={[{ required: true, message: '请输入姓名' }]}
                  {...formItemLayout}
                >
                  <Input placeholder="请输入姓名" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="receiver_phone"
                  label="电话"
                  rules={[{ required: true, message: '请输入电话' }]}
                  {...formItemLayout}
                >
                  <Input placeholder="请输入电话" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="receiver_address"
                  label="地址"
                  rules={[{ required: true, message: '请输入地址' }]}
                  {...formItemLayout}
                >
                  <Input placeholder="请输入地址" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="配送信息" size="small">
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="物品品类"
                  rules={[{ required: true }]}
                  {...formItemLayout}
                >
                  <Select>
                    {CATEGORIES.map((c) => (
                      <Option key={c} value={c}>
                        <Tag color={CATEGORY_COLORS[c]}>{CATEGORY_LABELS[c]}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="insurance_level"
                  label="保险等级"
                  rules={[{ required: true }]}
                  {...formItemLayout}
                >
                  <Select>
                    {INSURANCE_LEVELS.map((l) => (
                      <Option key={l} value={l}>
                        <Tag color={INSURANCE_LEVEL_COLORS[l]}>
                          {INSURANCE_LEVEL_LABELS[l]}
                        </Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Descriptions column={1} size="small" bordered style={{ marginTop: 8 }}>
              <Descriptions.Item label="预估费用">
                <span style={{ color: '#fa8c16', fontSize: 18, fontWeight: 'bold' }}>
                  ¥{calculatedFee.toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="SLA 承诺">
                <Space direction="vertical" size={2}>
                  <div>
                    <Tag color="blue">1分钟响应</Tag>
                    <Tag color="orange">8分钟取件</Tag>
                    <Tag color="green">{getSLADeadlines().deliverMinutes}分钟送达</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                    超时自动转派，超时必赔
                  </div>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                创建运单
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
