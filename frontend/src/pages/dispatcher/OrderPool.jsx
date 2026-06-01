import React, { useState, useEffect } from 'react'
import { Card, Button, Tag, Row, Col, message, Input, Select, Empty } from 'antd'
import { SearchOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import request from '../../utils/request'
import { RISK_LEVEL_LABELS, RISK_LEVEL_COLORS } from '../../utils/constants'

const { Search } = Input
const { Option } = Select

const OrderPool = () => {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [searchText, setSearchText] = useState('')
  const [riskLevel, setRiskLevel] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    let filtered = orders
    if (searchText) {
      filtered = filtered.filter(o => 
        o.order_no?.toLowerCase().includes(searchText.toLowerCase()) ||
        o.patient_name?.includes(searchText)
      )
    }
    if (riskLevel) {
      filtered = filtered.filter(o => o.risk_level === riskLevel)
    }
    setFilteredOrders(filtered)
  }, [searchText, riskLevel, orders])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await request.get('/dispatch/order-pool')
      setOrders(data.list || data || [])
      setFilteredOrders(data.list || data || [])
    } catch (error) {
      message.error('获取订单池失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDispatch = (id) => {
    navigate(`/dispatch/dispatch/${id}`)
  }

  return (
    <div>
      <div className="page-header">
        <h2>订单池</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select placeholder="风险级别" style={{ width: 150 }} allowClear onChange={setRiskLevel}>
            {Object.entries(RISK_LEVEL_LABELS).map(([value, label]) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>
          <Search
            placeholder="搜索订单号/患者姓名"
            allowClear
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>加载中...</div>
      ) : filteredOrders.length > 0 ? (
        <Row gutter={[24, 24]}>
          {filteredOrders.map((order) => (
            <Col xs={24} sm={12} lg={8} key={order.id}>
              <Card
                hoverable
                actions={[
                  <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => handleDispatch(order.id)} block>
                    立即派单
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{order.service_name}</span>
                      <Tag color={RISK_LEVEL_COLORS[order.risk_level]}>
                        {RISK_LEVEL_LABELS[order.risk_level]}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <p><strong>订单号：</strong>{order.order_no}</p>
                      <p><strong>患者：</strong>{order.patient_name}（{order.patient_age}岁）</p>
                      <p><strong>地址：</strong>{order.address}</p>
                      <p><strong>预约时间：</strong>{order.scheduled_at}</p>
                      <p style={{ color: '#666' }}>{order.condition_description}</p>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="暂无待派单订单" />
      )}
    </div>
  )
}

export default OrderPool
