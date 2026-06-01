import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, message, Modal, Descriptions } from 'antd'
import { EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import request from '../../utils/request'
import { RISK_LEVEL_LABELS, RISK_LEVEL_COLORS } from '../../utils/constants'

const OrderAudit = () => {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await request.get('/dispatch/pending-audit')
      setOrders(data.list || data || [])
    } catch (error) {
      message.error('获取待审核订单失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (record) => {
    setSelectedOrder(record)
    setDetailVisible(true)
  }

  const handleApprove = async (id) => {
    setActionLoading(true)
    try {
      await request.post(`/dispatch/orders/${id}/approve`)
      message.success('审核通过')
      fetchOrders()
    } catch (error) {
      message.error('操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (id) => {
    setActionLoading(true)
    try {
      await request.post(`/dispatch/orders/${id}/reject`)
      message.success('已拒绝')
      fetchOrders()
    } catch (error) {
      message.error('操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160
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
      title: '风险级别',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (level) => (
        <Tag color={RISK_LEVEL_COLORS[level]}>
          {RISK_LEVEL_LABELS[level]}
        </Tag>
      )
    },
    {
      title: '风险评估',
      dataIndex: 'risk_assessment',
      key: 'risk_assessment',
      ellipsis: true
    },
    {
      title: '预约时间',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space className="table-actions">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="primary" size="small" icon={<CheckOutlined />} loading={actionLoading} onClick={() => handleApprove(record.id)}>
            通过
          </Button>
          <Button size="small" danger icon={<CloseOutlined />} loading={actionLoading} onClick={() => handleReject(record.id)}>
            拒绝
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2>风险订单审核</h2>
      </div>
      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="订单详情"
        open={detailVisible}
        width={800}
        footer={null}
        onCancel={() => setDetailVisible(false)}
      >
        {selectedOrder && (
          <Descriptions column={2}>
            <Descriptions.Item label="订单号">{selectedOrder.order_no}</Descriptions.Item>
            <Descriptions.Item label="风险级别">
              <Tag color={RISK_LEVEL_COLORS[selectedOrder.risk_level]}>
                {RISK_LEVEL_LABELS[selectedOrder.risk_level]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="服务项目">{selectedOrder.service_name}</Descriptions.Item>
            <Descriptions.Item label="预约时间">{selectedOrder.scheduled_at}</Descriptions.Item>
            <Descriptions.Item label="患者姓名">{selectedOrder.patient_name}</Descriptions.Item>
            <Descriptions.Item label="年龄">{selectedOrder.patient_age}岁</Descriptions.Item>
            <Descriptions.Item label="服务地址" span={2}>{selectedOrder.address}</Descriptions.Item>
            <Descriptions.Item label="病情描述" span={2}>{selectedOrder.condition_description}</Descriptions.Item>
            <Descriptions.Item label="风险评估" span={2}>
              <div style={{ background: '#fff7e6', padding: 12, borderRadius: 4, color: '#d46b08' }}>
                {selectedOrder.risk_assessment || '暂无详细评估'}
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default OrderAudit
