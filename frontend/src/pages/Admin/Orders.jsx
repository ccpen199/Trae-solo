import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Select, Input, Modal, message, Spin, Space, Descriptions } from 'antd'
import { SearchOutlined, ReloadOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { getAdminOrders, updateOrderStatus } from '../../api/admin'
import dayjs from 'dayjs'

const { Option } = Select

function AdminOrders() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [detailModal, setDetailModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {}
      const result = await getAdminOrders(params)
      setData(Array.isArray(result) ? result : result?.list || [])
    } catch (error) {
      message.error('获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (record) => {
    setSelectedOrder(record)
    setDetailModal(true)
  }

  const handleUpdateStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status)
      message.success('订单状态更新成功')
      fetchOrders()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'pending_payment': 'orange',
      'paid': 'cyan',
      'pending_pickup': 'blue',
      'picked': 'geekblue',
      'in_transit': 'purple',
      'delivered': 'green',
      'completed': 'green',
      'cancelled': 'default',
      'refunded': 'red'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = {
      'pending_payment': '待支付',
      'paid': '已支付',
      'pending_pickup': '待揽收',
      'picked': '已揽收',
      'in_transit': '运输中',
      'delivered': '已送达',
      'completed': '已完成',
      'cancelled': '已取消',
      'refunded': '已退款'
    }
    return texts[status] || status
  }

  const mockData = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    order_no: `ORD${2024000 + i}`,
    tracking_no: `SF${200000 + i}`,
    sender_name: `寄件人${i + 1}`,
    receiver_name: `收件人${i + 1}`,
    receiver_phone: `138****${1000 + i}`,
    from_address: ['北京市朝阳区xxx路1号', '上海市浦东新区xxx路2号', '广州市天河区xxx路3号'][i % 3],
    to_address: ['杭州市西湖区xxx路100号', '深圳市南山区xxx路200号', '成都市武侯区xxx路300号'][i % 3],
    service_type: ['标准快递', '快速', '次日达'][i % 3],
    weight: (Math.random() * 8 + 0.5).toFixed(2),
    price: (Math.random() * 50 + 10).toFixed(2),
    status: ['pending_payment', 'paid', 'pending_pickup', 'in_transit', 'delivered', 'completed'][i % 6],
    item_description: ['衣物', '电子产品', '食品', '书籍', '日用品'][i % 5],
    created_at: dayjs().subtract(i, 'day').toISOString(),
    paid_at: i > 0 ? dayjs().subtract(i, 'day').add(10, 'minute').toISOString() : null,
  }))

  const displayData = data.length > 0 ? data : mockData

  const filteredData = displayData.filter(item => 
    item.order_no?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.tracking_no?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.receiver_name?.includes(searchText) ||
    item.sender_name?.includes(searchText)
  )

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 140,
    },
    {
      title: '运单号',
      dataIndex: 'tracking_no',
      key: 'tracking_no',
      width: 120,
    },
    {
      title: '寄件人',
      dataIndex: 'sender_name',
      key: 'sender_name',
    },
    {
      title: '收件人',
      dataIndex: 'receiver_name',
      key: 'receiver_name',
    },
    {
      title: '服务类型',
      dataIndex: 'service_type',
      key: 'service_type',
    },
    {
      title: '金额 (元)',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>¥{price}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending_payment' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleUpdateStatus(record.id, 'paid')}
            >
              确认支付
            </Button>
          )}
          {record.status === 'paid' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleUpdateStatus(record.id, 'pending_pickup')}
            >
              待揽收
            </Button>
          )}
          {record.status === 'pending_pickup' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleUpdateStatus(record.id, 'picked')}
            >
              已揽收
            </Button>
          )}
          {['pending_payment', 'paid'].includes(record.status) && (
            <Button
              type="link"
              danger
              icon={<CloseOutlined />}
              onClick={() => handleUpdateStatus(record.id, 'cancelled')}
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <h2 className="page-title">订单管理</h2>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Select
            defaultValue="all"
            style={{ width: 150 }}
            onChange={setStatusFilter}
          >
            <Option value="all">全部状态</Option>
            <Option value="pending_payment">待支付</Option>
            <Option value="paid">已支付</Option>
            <Option value="pending_pickup">待揽收</Option>
            <Option value="picked">已揽收</Option>
            <Option value="in_transit">运输中</Option>
            <Option value="delivered">已送达</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
          <Input.Search
            placeholder="搜索订单号/运单号/收件人"
            allowClear
            style={{ width: 280 }}
            onSearch={(value) => setSearchText(value)}
            onChange={(e) => setSearchText(e.target.value)}
            enterButton={<SearchOutlined />}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchOrders}
          >
            刷新
          </Button>
        </Space>
      </Card>

      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="order_no"
            scroll={{ x: 1300 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Spin>
      </Card>

      <Modal
        title="订单详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>关闭</Button>,
        ]}
        width={700}
      >
        {selectedOrder && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号" span={2}>
                {selectedOrder.order_no}
              </Descriptions.Item>
              <Descriptions.Item label="运单号">
                {selectedOrder.tracking_no || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={getStatusColor(selectedOrder.status)}>
                  {getStatusText(selectedOrder.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="服务类型">
                {selectedOrder.service_type}
              </Descriptions.Item>
              <Descriptions.Item label="物品描述">
                {selectedOrder.item_description}
              </Descriptions.Item>
              <Descriptions.Item label="重量">
                {selectedOrder.weight} kg
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 18 }}>¥{selectedOrder.price}</span>
              </Descriptions.Item>
            </Descriptions>

            <Card title="寄件人信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="姓名">{selectedOrder.sender_name}</Descriptions.Item>
                <Descriptions.Item label="地址">{selectedOrder.from_address}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="收件人信息" size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="姓名">{selectedOrder.receiver_name}</Descriptions.Item>
                <Descriptions.Item label="电话">{selectedOrder.receiver_phone}</Descriptions.Item>
                <Descriptions.Item label="地址">{selectedOrder.to_address}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="创建时间">
                {dayjs(selectedOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="支付时间">
                {selectedOrder.paid_at ? dayjs(selectedOrder.paid_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  )
}

export default AdminOrders
