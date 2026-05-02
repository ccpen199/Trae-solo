import React, { useState } from 'react'
import { Card, Table, Button, Tag, Modal, Descriptions, message, Avatar, Space, Statistic, Row, Col, Timeline, Tag as AntTag
} from 'antd'
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WalletOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

function OrderManagement() {
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  const mockOrders = [
    {
      key: '1',
      _id: '1',
      orderNo: 'ORD202404280001',
      user: { _id: 'u1', username: '王学员', avatar: '', email: 'student@learning.com' },
      course: { _id: 'c1', title: 'JavaScript 从入门到精通', price: 299, originalPrice: 599 },
      totalAmount: 299,
      discountAmount: 0,
      payAmount: 299,
      status: 'completed',
      paymentMethod: 'alipay',
      createdAt: '2024-04-28T10:30:00Z',
      paidAt: '2024-04-28T10:32:00Z',
      timeline: [
        { time: '2024-04-28 10:30:00', description: '订单创建' },
        { time: '2024-04-28 10:32:00', description: '支付成功' }
      ]
    },
    {
      key: '2',
      _id: '2',
      orderNo: 'ORD202404280002',
      user: { _id: 'u2', username: '李学员', avatar: '', email: 'li@example.com' },
      course: { _id: 'c2', title: 'React 实战开发', price: 399, originalPrice: 699 },
      totalAmount: 399,
      discountAmount: 50,
      payAmount: 349,
      status: 'completed',
      paymentMethod: 'wechat',
      createdAt: '2024-04-28T14:20:00Z',
      paidAt: '2024-04-28T14:23:00Z',
      timeline: [
        { time: '2024-04-28 14:20:00', description: '订单创建' },
        { time: '2024-04-28 14:23:00', description: '支付成功' }
      ]
    },
    {
      key: '3',
      _id: '3',
      orderNo: 'ORD202404270003',
      user: { _id: 'u3', username: '张学员', avatar: '', email: 'zhang@example.com' },
      course: { _id: 'c3', title: 'Python 数据分析实战', price: 349, originalPrice: 599 },
      totalAmount: 349,
      discountAmount: 0,
      payAmount: 349,
      status: 'pending',
      paymentMethod: null,
      createdAt: '2024-04-27T08:15:00Z',
      paidAt: null,
      timeline: [
        { time: '2024-04-27 08:15:00', description: '订单创建' }
      ]
    },
    {
      key: '4',
      _id: '4',
      orderNo: 'ORD202404260004',
      user: { _id: 'u4', username: '赵学员', avatar: '', email: 'zhao@example.com' },
      course: { _id: 'c1', title: 'JavaScript 从入门到精通', price: 299, originalPrice: 599 },
      totalAmount: 299,
      discountAmount: 0,
      payAmount: 299,
      status: 'cancelled',
      paymentMethod: null,
      createdAt: '2024-04-26T16:00:00Z',
      paidAt: null,
      cancelledAt: '2024-04-26T16:30:00Z',
      cancelReason: '用户取消',
      timeline: [
        { time: '2024-04-26 16:00:00', description: '订单创建' },
        { time: '2024-04-26 16:30:00', description: '订单取消' }
      ]
    }
  ]

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '用户',
      dataIndex: ['user', 'username'],
      key: 'user',
      render: (text, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={24}>{text?.charAt(0)}</Avatar>
            <span>{text}</span>
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.user?.email}</div>
        </div>
      )
    },
    {
      title: '课程',
      dataIndex: ['course', 'title'],
      key: 'course',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            原价 ¥{record.course?.originalPrice}
          </div>
        </div>
      )
    },
    {
      title: '支付金额',
      dataIndex: 'payAmount',
      key: 'payAmount',
      render: (amount, record) => (
        <div>
          <div style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 16 }}>¥{amount}</div>
          {record.discountAmount > 0 && (
            <div style={{ fontSize: 12, color: '#999' }}>
              优惠 ¥{record.discountAmount}
            </div>
          )}
        </div>
      )
    },
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => {
        if (!method) return '-';
        const methodMap = {
          alipay: { name: '支付宝', color: 'blue' },
          wechat: { name: '微信', color: 'success' }
        };
        const config = methodMap[method] || { name: method, color: 'default' };
        return <Tag color={config.color}>{config.name}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          pending: { label: '待支付', color: 'orange' },
          completed: { label: '已完成', color: 'success' },
          cancelled: { label: '已取消', color: 'default' },
          refunded: { label: '已退款', color: 'warning' }
        };
        const config = statusMap[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewOrder(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => cancelOrder(record)}
            >
              取消
            </Button>
          )}
        </Space>
      )
    }
  ];

  const viewOrder = (order) => {
    setSelectedOrder(order)
    setModalVisible(true)
  }

  const cancelOrder = (order) => {
    Modal.confirm({
      title: '确认取消订单',
      content: `确定要取消订单 ${order.orderNo} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        message.success('订单已取消')
      }
    })
  }

  const totalStats = {
    totalOrders: mockOrders.length,
    completedOrders: mockOrders.filter(o => o.status === 'completed').length,
    pendingOrders: mockOrders.filter(o => o.status === 'pending').length,
    totalRevenue: mockOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.payAmount, 0)
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>订单管理</h2>
        <p style={{ color: '#666', marginTop: 8, marginBottom: 0 }}>
          总订单：{totalStats.totalOrders} | 已完成：{totalStats.completedOrders} | 
          待支付：{totalStats.pendingOrders} | 总收入：¥{totalStats.totalRevenue.toLocaleString()}
        </p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总订单数"
              value={totalStats.totalOrders}
              prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="待支付"
              value={totalStats.pendingOrders}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已完成"
              value={totalStats.completedOrders}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总收入"
              value={totalStats.totalRevenue}
              prefix="¥"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={mockOrders}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={700}
        footer={null}
      >
        {selectedOrder && (
          <div>
            <Descriptions column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="订单号">
                <span style={{ fontFamily: 'monospace' }}>{selectedOrder.orderNo}</span>
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={
                  selectedOrder.status === 'completed' ? 'success' :
                  selectedOrder.status === 'pending' ? 'orange' : 'default'
                }>
                  {selectedOrder.status === 'completed' ? '已完成' :
                   selectedOrder.status === 'pending' ? '待支付' :
                   selectedOrder.status === 'cancelled' ? '已取消' : selectedOrder.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="用户">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar size={24}>{selectedOrder.user?.username?.charAt(0)}</Avatar>
                  <span>{selectedOrder.user?.username}</span>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">{selectedOrder.user?.email}</Descriptions.Item>
              <Descriptions.Item label="课程">{selectedOrder.course?.title}</Descriptions.Item>
              <Descriptions.Item label="支付方式">
                {selectedOrder.paymentMethod === 'alipay' ? '支付宝' :
                 selectedOrder.paymentMethod === 'wechat' ? '微信' : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="价格明细" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>课程价格</span>
                <span>¥{selectedOrder.course?.price}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#1890ff' }}>优惠金额</span>
                  <span style={{ color: '#1890ff' }}>-¥{selectedOrder.discountAmount}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                <span style={{ fontWeight: 'bold' }}>实付金额</span>
                <span style={{ fontWeight: 'bold', color: '#ff4d4f', fontSize: 18 }}>¥{selectedOrder.payAmount}</span>
              </div>
            </Card>

            <div>
              <h4 style={{ marginBottom: 16 }}>订单时间线</h4>
              <Timeline
                items={selectedOrder.timeline?.map(item => ({
                  color: 'blue',
                  children: (
                    <div>
                      <p style={{ margin: 0 }}>{item.description}</p>
                      <p style={{ margin: 0, color: '#999', fontSize: 12 }}>{item.time}</p>
                    </div>
                  )
                })) || []}
              />
            </div>

            {selectedOrder.cancelReason && (
              <div style={{ marginTop: 16, padding: 12, background: '#fff2f0', borderRadius: 4, border: '1px solid #ffccc7' }}>
                <span style={{ color: '#ff4d4f', fontWeight: 500 }}>取消原因：</span>
                {selectedOrder.cancelReason}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OrderManagement
