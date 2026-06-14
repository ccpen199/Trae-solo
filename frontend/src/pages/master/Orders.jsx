import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Select, Typography, message, Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import { masterApi } from '../../utils/api'

const { Title } = Typography

const statusMap = {
  negotiated: { text: '待接单', color: 'blue' },
  accepted: { text: '已接单', color: 'success' },
  in_progress: { text: '服务中', color: 'warning' },
  completed: { text: '待验收', color: 'purple' },
  finished: { text: '已完成', color: 'success' }
}

const MasterOrders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await masterApi.getOrders(statusFilter || undefined)
      setOrders(data)
    } catch (error) {
      console.error('加载订单失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (id) => {
    try {
      await masterApi.acceptOrder(id)
      message.success('接单成功')
      loadOrders()
    } catch (error) {
      message.error(error.message || '接单失败')
    }
  }

  const handleStart = async (id) => {
    try {
      await masterApi.startOrder(id)
      message.success('服务已开始')
      loadOrders()
    } catch (error) {
      message.error(error.message || '操作失败')
    }
  }

  const handleComplete = async (id) => {
    Modal.confirm({
      title: '确认完成服务',
      content: '确认已完成该订单服务？',
      onOk: async () => {
        try {
          await masterApi.completeOrder(id, { photos: [] })
          message.success('服务已完成')
          loadOrders()
        } catch (error) {
          message.error(error.message || '操作失败')
        }
      }
    })
  }

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160
    },
    {
      title: '服务标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.service_type}</div>
        </div>
      )
    },
    {
      title: '服务地址',
      dataIndex: 'address',
      key: 'address'
    },
    {
      title: '业主',
      dataIndex: 'owner_name',
      key: 'owner_name'
    },
    {
      title: '最终价格',
      dataIndex: 'final_price',
      key: 'final_price',
      render: (val) => val ? `¥${val}` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusMap[status]?.color}>
          {statusMap[status]?.text}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'negotiated' && (
            <Button type="primary" size="small" onClick={() => handleAccept(record.id)}>
              接单
            </Button>
          )}
          {record.status === 'accepted' && (
            <Button type="primary" size="small" onClick={() => handleStart(record.id)}>
            开始服务
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button type="primary" size="small" onClick={() => handleComplete(record.id)}>
            完成服务
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>订单管理</Title>
        <Space>
          <Select
            style={{ width: 150 }}
            placeholder="筛选状态"
            allowClear
            value={statusFilter || undefined}
            onChange={setStatusFilter}
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.text}</Select.Option>
            ))}
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}

export default MasterOrders
