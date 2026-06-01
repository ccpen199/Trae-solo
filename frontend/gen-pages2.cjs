const fs = require('fs');
const path = require('path');

const basePath = './src';

const files = {
  'pages/patient-family/OrderList.jsx': `import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Card, Spin, message, Select, DatePicker } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import request from '../../utils/request'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, USER_ROLES } from '../../utils/constants'
import useAuthStore from '../../store/authStore'

const { Option } = Select
const { RangePicker } = DatePicker

const OrderList = () => {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    fetchOrders()
  }, [status, dateRange])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = {}
      if (status) params.status = status
      if (dateRange && dateRange.length === 2) {
        params.start_date = dateRange[0].format('YYYY-MM-DD')
        params.end_date = dateRange[1].format('YYYY-MM-DD')
      }
      const data = await request.get('/orders', { params })
      setOrders(data.list || data || [])
    } catch (error) {
      message.error('获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '服务项目',
      dataIndex: 'service_name',
      key: 'service_name'
    },
    {
      title: '患者姓名',
      dataIndex: 'patient_name',
      key: 'patient_name'
    },
    {
      title: '服务地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true
    },
    {
      title: '预约时间',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at'
    },
    {
      title: '护士',
      dataIndex: 'nurse_name',
      key: 'nurse_name',
      render: (text) => text || '待分配'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={ORDER_STATUS_COLORS[status]} className="status-tag">
          {ORDER_STATUS_LABELS[status]}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(\`/orders/\${record.id}\`)}>
            详情
          </Button>
          {user?.role === USER_ROLES.DISPATCHER && record.status === 'pending_dispatch' && (
            <Button type="link" onClick={() => navigate(\`/dispatch/orders/\${record.id}\`)}>
              派单
            </Button>
          )}
          {user?.role === USER_ROLES.NURSE && record.status === 'in_progress' && (
            <Button type="link" onClick={() => navigate(\`/nurse/record/\${record.id}\`)}>
              护理记录
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2>订单列表</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select placeholder="选择状态" style={{ width: 150 }} allowClear onChange={setStatus}>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <Option key={value} value={value}>{label}</Option>
            ))}
          </Select>
          <RangePicker onChange={setDateRange} />
          <Button type="primary" onClick={fetchOrders}>查询</Button>
        </div>
      </div>
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </Spin>
      </Card>
    </div>
  )
}

export default OrderList
`,

  'pages/patient-family/OrderDetail.jsx': `import React, { useState, useEffect } from 'react'
import { Card, Descriptions, Tag, Button, Spin, message, Timeline, Divider } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import request from '../../utils/request'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, RISK_LEVEL_LABELS, RISK_LEVEL_COLORS } from '../../utils/constants'

const OrderDetail = () => {
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    fetchOrderDetail()
  }, [id])

  const fetchOrderDetail = async () => {
    setLoading(true)
    try {
      const data = await request.get(\`/orders/\${id}\`)
      setOrder(data)
    } catch (error) {
      message.error('获取订单详情失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 48 }} />
  if (!order) return null

  return (
    <div>
      <div className="page-header">
        <h2>订单详情</h2>
        <Button onClick={() => navigate(-1)}>返回</Button>
      </div>

      <Card className="detail-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h3 style={{ margin: 0 }}>订单号：{order.order_no}</h3>
            <Tag color={ORDER_STATUS_COLORS[order.status]} style={{ marginTop: 8 }}>
              {ORDER_STATUS_LABELS[order.status]}
            </Tag>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#666', margin: 0 }}>下单时间</p>
            <p style={{ fontWeight: 500, margin: 0 }}>{order.created_at}</p>
          </div>
        </div>

        <Divider orientation="left">服务信息</Divider>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="服务项目">{order.service_name}</Descriptions.Item>
          <Descriptions.Item label="服务价格">¥{order.price}</Descriptions.Item>
          <Descriptions.Item label="风险等级">
            <Tag color={RISK_LEVEL_COLORS[order.risk_level]}>
              {RISK_LEVEL_LABELS[order.risk_level]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="预约时间">{order.scheduled_at}</Descriptions.Item>
          <Descriptions.Item label="服务时长" span={2}>{order.duration}分钟</Descriptions.Item>
        </Descriptions>

        <Divider orientation="left" style={{ marginTop: 24 }}>患者信息</Divider>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="患者姓名">{order.patient_name}</Descriptions.Item>
          <Descriptions.Item label="年龄性别">{order.patient_age}岁 / {order.patient_gender === 'male' ? '男' : '女'}</Descriptions.Item>
          <Descriptions.Item label="服务地址" span={2}>{order.address}</Descriptions.Item>
          <Descriptions.Item label="病情描述" span={2}>{order.condition_description}</Descriptions.Item>
          <Descriptions.Item label="医嘱信息" span={2}>{order.medical_order || '无'}</Descriptions.Item>
        </Descriptions>

        {order.nurse_name && (
          <>
            <Divider orientation="left" style={{ marginTop: 24 }}>护士信息</Divider>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="护士姓名">{order.nurse_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{order.nurse_phone || '暂无'}</Descriptions.Item>
              <Descriptions.Item label="资质">{order.nurse_qualifications || '暂无'}</Descriptions.Item>
              <Descriptions.Item label="评分">{order.nurse_rating ? \`\${order.nurse_rating}分\` : '暂无评分'}</Descriptions.Item>
            </Descriptions>
          </>
        )}

        {order.emergency_contact_name && (
          <>
            <Divider orientation="left" style={{ marginTop: 24 }}>紧急联系人</Divider>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="联系人姓名">{order.emergency_contact_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{order.emergency_contact_phone}</Descriptions.Item>
            </Descriptions>
          </>
        )}

        {order.status_timeline && order.status_timeline.length > 0 && (
          <>
            <Divider orientation="left" style={{ marginTop: 24 }}>订单进度</Divider>
            <Timeline
              items={order.status_timeline.map(item => ({
                color: item.status === 'completed' ? 'green' : 'blue',
                children: (
                  <div>
                    <p style={{ margin: 0, fontWeight: 500 }}>{ORDER_STATUS_LABELS[item.status] || item.status}</p>
                    <p style={{ margin: 0, color: '#999', fontSize: 12 }}>{item.time}</p>
                    {item.remark && <p style={{ margin: 0, color: '#666' }}>{item.remark}</p>}
                  </div>
                )
              }))}
            />
          </>
        )}
      </Card>
    </div>
  )
}

export default OrderDetail
`
};

for (const [fileName, content] of Object.entries(files)) {
  const filePath = path.join(basePath, fileName);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Created:', filePath);
}

console.log('Pages 2 created successfully!');
