import React, { useState, useEffect } from 'react'
import { Card, List, Tag, Select, Button, message, Pagination } from 'antd'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const { Option } = Select

const statusMap = {
  pending: { text: '待支付', color: 'orange' },
  paid: { text: '已支付', color: 'blue' },
  confirmed: { text: '已确认', color: 'blue' },
  delivering: { text: '配送中', color: 'cyan' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: '已取消' }
}

const OrderList = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [status, setStatus] = useState('')

  useEffect(() => {
    loadOrders()
  }, [pagination.current, status])

  const loadOrders = async () => {
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize
      }
      if (status) params.status = status

      const res = await api.get('/orders/my', { params })
      setOrders(res.data.list)
      setPagination(prev => ({ ...prev, total: res.data.total }))
    } catch (error) {
      console.error('加载订单失败', error)
    }
  }

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Select
          placeholder="筛选状态"
          style={{ width: 150 }}
          value={status || undefined}
          onChange={(value) => {
            setStatus(value)
            setPagination(prev => ({ ...prev, current: 1 }))
          }}
          allowClear
        >
          <Option value="pending">待支付</Option>
          <Option value="paid">已支付</Option>
          <Option value="delivering">配送中</Option>
          <Option value="completed">已完成</Option>
          <Option value="cancelled">已取消</Option>
        </Select>
      </Card>

      {orders.length > 0 ? (
        <>
          <List
          dataSource={orders}
          renderItem={order => (
            <List.Item
              style={{ background: '#fff',
              marginBottom: '16px',
              padding: '16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
            onClick={() => navigate(`/orders/${order.id}`)}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>订单号: {order.order_no}</span>
                    <Tag color={statusMap[order.status]?.color}>
                      {statusMap[order.status]?.text}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                    {order.items?.map((item, index) => (
                      <span key={index} style={{ marginRight: '16px' }}>
                        {item.product_name} × {item.quantity}
                      </span>
                    ))}
                  </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>实付: ¥{order.pay_amount}</span>
                    <span style={{ color: '#999' }}>{order.created_at}</span>
                  </div>
                    <Button type="link" style={{ padding: 0 }}>查看详情</Button>
                  </div>
                }
              />
            </List.Item>
          )}
        />
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
            />
          </div>
        </>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            暂无订单
          </div>
        </Card>
      )}
    </div>
  )
}

export default OrderList
