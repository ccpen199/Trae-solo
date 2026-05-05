import React, { useState } from 'react'
import { 
  Card, Form, Input, Button, Table, Space, Tag, 
  message, Descriptions, Divider, Modal, Popconfirm
} from 'antd'
import { 
  SearchOutlined, UndoOutlined, ReloadOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons'
import { refundApi, orderApi } from '../services/api'

const Refund = () => {
  const [searchForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [refunds, setRefunds] = useState([])
  const [activeTab, setActiveTab] = useState('search')
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const handleSearchOrders = async (values) => {
    if (!values.orderNo && !values.passengerName) {
      message.warning('请输入订单号或旅客姓名')
      return
    }

    setLoading(true)
    try {
      const params = {}
      if (values.orderNo) {
        params.orderNo = values.orderNo
      }
      if (values.passengerName) {
        params.passengerName = values.passengerName
      }
      if (values.passengerIdCard) {
        params.passengerIdCard = values.passengerIdCard
      }

      const result = await refundApi.searchOrders(params)
      
      if (result.success) {
        setOrders(result.data)
        message.success('查询到 ' + result.total + ' 个可退票订单')
      } else {
        message.error('查询失败')
      }
    } catch (error) {
      message.error('查询失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadRefunds = async () => {
    setLoading(true)
    try {
      const result = await refundApi.list({})
      
      if (result.success) {
        setRefunds(result.data)
      } else {
        message.error('查询失败')
      }
    } catch (error) {
      message.error('查询失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmRefund = async () => {
    if (!selectedOrder) return

    setLoading(true)
    try {
      const result = await refundApi.apply({
        orderId: selectedOrder.id,
        orderNo: selectedOrder.order_no,
        refundReason: '用户申请退票'
      })
      
      if (result.success) {
        message.success('退票成功！座位已释放回库存')
        setShowRefundModal(false)
        setSelectedOrder(null)
        handleSearchOrders(searchForm.getFieldsValue())
      } else {
        message.error(result.message || '退票失败')
      }
    } catch (error) {
      message.error('退票失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text) => (
        <Tag color="blue" style={{ fontSize: 12 }}>{text}</Tag>
      ),
    },
    {
      title: '车次',
      dataIndex: 'train_number',
      key: 'train_number',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong>{text}</strong>
          <Tag style={{ margin: 0 }}>{record.train_type}</Tag>
        </Space>
      ),
    },
    {
      title: '旅客',
      dataIndex: 'passenger_name',
      key: 'passenger_name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.passenger_id_card && record.passenger_id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')}
          </div>
        </div>
      ),
    },
    {
      title: '行程',
      key: 'route',
      render: (_, record) => (
        <div>
          <div>
            {record.from_station + ' → ' + record.to_station}
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {String(record.departure_time).substring(0, 5) + ' - ' + String(record.arrival_time).substring(0, 5)}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {String(record.travel_date)}
          </div>
        </div>
      ),
    },
    {
      title: '座位信息',
      key: 'seat',
      render: (_, record) => (
        <div>
          <div>{record.seat_type}</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {record.carriage_number + ' ' + record.seat_number}
          </div>
        </div>
      ),
    },
    {
      title: '票价',
      dataIndex: 'price',
      key: 'price',
      render: (price) => (
        <span style={{ color: '#ff4d4f', fontSize: 16, fontWeight: 'bold' }}>
          {'¥' + price}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default'
        let text = status
        if (status === 'paid') { color = 'green'; text = '已支付' }
        else if (status === 'refunded') { color = 'orange'; text = '已退票' }
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="确认退票"
          description={
            <div>
              <p>确定要为以下订单办理退票吗？</p>
              <p>订单号: {record.order_no}</p>
              <p>旅客: {record.passenger_name}</p>
              <p>票价: {'¥' + record.price}</p>
              <p style={{ color: '#faad14' }}>退票后座位将自动释放回库存</p>
            </div>
          }
          icon={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
          onConfirm={() => {
            setSelectedOrder(record)
            handleConfirmRefund()
          }}
          okText="确认退票"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <Button type="primary" danger size="small" icon={<UndoOutlined />}>
            退票
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const refundColumns = [
    {
      title: '退款单号',
      dataIndex: 'refund_no',
      key: 'refund_no',
      render: (text) => (
        <Tag color="purple" style={{ fontSize: 12 }}>{text}</Tag>
      ),
    },
    {
      title: '原订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text) => (
        <Tag color="blue" style={{ fontSize: 12 }}>{text}</Tag>
      ),
    },
    {
      title: '旅客',
      dataIndex: 'passenger_name',
      key: 'passenger_name',
    },
    {
      title: '行程',
      key: 'route',
      render: (_, record) => (
        <div>
          <div>{record.from_station + ' → ' + record.to_station}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {String(record.travel_date)}
          </div>
        </div>
      ),
    },
    {
      title: '退款金额',
      dataIndex: 'refund_amount',
      key: 'refund_amount',
      render: (amount) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          {'¥' + amount}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'completed' ? 'green' : 'processing'
        const text = status === 'completed' ? '已完成' : '处理中'
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '退票时间',
      dataIndex: 'processed_at',
      key: 'processed_at',
      render: (time) => String(time || ''),
    },
  ]

  const tabList = [
    { key: 'search', label: '查询订单并退票' },
    { key: 'history', label: '退票记录' },
  ]

  return (
    <div>
      <Card 
        title="退票处理"
        tabList={tabList}
        activeTabKey={activeTab}
        onTabChange={(key) => {
          setActiveTab(key)
          if (key === 'history') {
            handleLoadRefunds()
          }
        }}
        style={{ marginBottom: 24 }}
      >
        {activeTab === 'search' && (
          <Form
            form={searchForm}
            layout="inline"
            onFinish={handleSearchOrders}
          >
            <Form.Item name="orderNo" label="订单号">
              <Input placeholder="输入订单号" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="passengerName" label="旅客姓名">
              <Input placeholder="输入姓名" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="passengerIdCard" label="身份证号">
              <Input placeholder="输入身份证号" style={{ width: 180 }} maxLength={18} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
                  查询
                </Button>
                <Button onClick={() => {
                  searchForm.resetFields()
                  setOrders([])
                }} icon={<ReloadOutlined />}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}

        {activeTab === 'history' && (
          <div style={{ textAlign: 'right' }}>
            <Button onClick={handleLoadRefunds} loading={loading} icon={<ReloadOutlined />}>
              刷新
            </Button>
          </div>
        )}
      </Card>

      {activeTab === 'search' && orders.length > 0 && (
        <Card title={'可退票订单 (共 ' + orders.length + ' 个)'}>
          <Table
            columns={orderColumns}
            dataSource={orders}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => '共 ' + total + ' 条',
            }}
          />
        </Card>
      )}

      {activeTab === 'history' && (
        <Card title="退票记录">
          <Table
            columns={refundColumns}
            dataSource={refunds}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => '共 ' + total + ' 条',
            }}
          />
        </Card>
      )}

      <Modal
        title="确认退票"
        open={showRefundModal}
        onCancel={() => {
          setShowRefundModal(false)
          setSelectedOrder(null)
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setShowRefundModal(false)
            setSelectedOrder(null)
          }}>
            取消
          </Button>,
          <Button 
            key="confirm" 
            type="primary" 
            danger
            loading={loading}
            onClick={handleConfirmRefund}
          >
            确认退票
          </Button>,
        ]}
      >
        {selectedOrder && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="订单号">
              <Tag color="blue">{selectedOrder.order_no}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="旅客姓名">
              {selectedOrder.passenger_name}
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">
              {selectedOrder.passenger_id_card && selectedOrder.passenger_id_card.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')}
            </Descriptions.Item>
            <Descriptions.Item label="车次">
              {selectedOrder.train_number}
            </Descriptions.Item>
            <Descriptions.Item label="行程">
              {selectedOrder.from_station + ' → ' + selectedOrder.to_station}
            </Descriptions.Item>
            <Descriptions.Item label="出发日期">
              {String(selectedOrder.travel_date)}
            </Descriptions.Item>
            <Descriptions.Item label="座位">
              {selectedOrder.seat_type + ' - ' + selectedOrder.carriage_number + ' ' + selectedOrder.seat_number}
            </Descriptions.Item>
            <Descriptions.Item label="票价">
              <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 18 }}>
                {'¥' + selectedOrder.price}
              </span>
            </Descriptions.Item>
          </Descriptions>
        )}
        <Divider />
        <div style={{ color: '#faad14', textAlign: 'center' }}>
          <ExclamationCircleOutlined style={{ marginRight: 8 }} />
          退票后座位将自动释放回库存，可继续被其他旅客购买
        </div>
      </Modal>
    </div>
  )
}

export default Refund
