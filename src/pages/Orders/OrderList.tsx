import { useState } from 'react'
import { Table, Card, Input, Select, Tag, Button, Space, Row, Col, DatePicker, Badge, Tooltip } from 'antd'
import { SearchOutlined, EyeOutlined, FilterOutlined } from '@ant-design/icons'
import { serviceOrders } from '@/mock/data'
import type { OrderStatus, ServiceOrder } from '@/types'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const statusMap: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'blue' },
  video_screening: { label: '视频初筛', color: 'cyan' },
  interview_scheduled: { label: '已排期面试', color: 'geekblue' },
  contract_signed: { label: '已签约', color: 'purple' },
  insurance_enrolled: { label: '已投保', color: 'magenta' },
  in_service: { label: '服务中', color: 'orange' },
  completed: { label: '已完成', color: 'green' },
  disputed: { label: '争议中', color: 'red' },
  cancelled: { label: '已取消', color: 'default' },
}

const categoryOptions = [
  { label: '全部', value: '' },
  { label: '月嫂', value: '月嫂' },
  { label: '育儿嫂', value: '育儿嫂' },
  { label: '保洁', value: '保洁' },
  { label: '养老护理', value: '养老护理' },
  { label: '钟点工', value: '钟点工' },
  { label: '家电清洗', value: '家电清洗' },
]

const cityOptions = [
  { label: '全部', value: '' },
  { label: '北京', value: '北京' },
  { label: '上海', value: '上海' },
  { label: '广州', value: '广州' },
  { label: '深圳', value: '深圳' },
  { label: '杭州', value: '杭州' },
  { label: '成都', value: '成都' },
]

const statusOptions = [
  { label: '全部', value: '' },
  ...Object.entries(statusMap).map(([value, { label }]) => ({ label, value })),
]

const OrderList: React.FC = () => {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [cityFilter, setCityFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)

  const filteredOrders = serviceOrders.filter((order) => {
    if (searchText) {
      const keyword = searchText.toLowerCase()
      const match =
        order.id.toLowerCase().includes(keyword) ||
        order.employerName.toLowerCase().includes(keyword) ||
        order.workerName.toLowerCase().includes(keyword)
      if (!match) return false
    }
    if (statusFilter && order.status !== statusFilter) return false
    if (categoryFilter && order.category !== categoryFilter) return false
    if (cityFilter && order.city !== cityFilter) return false
    if (dateRange && dateRange[0] && dateRange[1]) {
      const created = dayjs(order.createdAt)
      if (created.isBefore(dateRange[0], 'day') || created.isAfter(dateRange[1], 'day')) return false
    }
    return true
  })

  const handleReset = () => {
    setSearchText('')
    setStatusFilter('')
    setCategoryFilter('')
    setCityFilter('')
    setDateRange(null)
  }

  const columns = [
    {
      title: '工单号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '雇主',
      dataIndex: 'employerName',
      key: 'employerName',
      width: 100,
    },
    {
      title: '劳动者',
      dataIndex: 'workerName',
      key: 'workerName',
      width: 100,
    },
    {
      title: '服务类目',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: OrderStatus) => (
        <Tag color={statusMap[status].color}>{statusMap[status].label}</Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `¥${price.toLocaleString()}`,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration: number) => `${duration}小时`,
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 180,
      render: (address: string) =>
        address.length > 20 ? (
          <Tooltip title={address}>{address.slice(0, 20)}...</Tooltip>
        ) : (
          address
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: ServiceOrder) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/orders/${record.id}`)}>
          查看
        </Button>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <Input
              placeholder="工单号/雇主/劳动者"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="工单状态"
              value={statusFilter || undefined}
              onChange={(val) => setStatusFilter(val || '')}
              options={statusOptions}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="服务类目"
              value={categoryFilter || undefined}
              onChange={(val) => setCategoryFilter(val || '')}
              options={categoryOptions}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="城市"
              value={cityFilter || undefined}
              onChange={(val) => setCityFilter(val || '')}
              options={cityOptions}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col span={5}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => {
                setDateRange(dates)
              }}
            />
          </Col>
          <Col>
            <Button icon={<FilterOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table<ServiceOrder>
          rowKey="id"
          columns={columns}
          dataSource={filteredOrders}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default OrderList
