import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Select, Typography, message, Modal } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { adminApi } from '../../utils/api'

const { Title } = Typography

const statusMap = {
  pending: { text: '待审核', color: 'processing' },
  approved: { text: '已通过', color: 'success' },
  rejected: { text: '已拒绝', color: 'error' }
}

const Verifications = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await adminApi.getVerifications(statusFilter || undefined)
      setData(result)
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    Modal.confirm({
      title: '确认通过认证',
      content: '确认通过该师傅的实名认证？',
      onOk: async () => {
        try {
          await adminApi.approveVerification(id)
          message.success('认证已通过')
          loadData()
        } catch (error) {
          message.error(error.message || '操作失败')
        }
      }
    })
  }

  const handleReject = async (id) => {
    Modal.confirm({
      title: '确认拒绝认证',
      content: '确认拒绝该师傅的实名认证？',
      okType: 'danger',
      onOk: async () => {
        try {
          await adminApi.rejectVerification(id)
          message.success('已拒绝认证')
          loadData()
        } catch (error) {
          message.error(error.message || '操作失败')
        }
      }
    })
  }

  const columns = [
    {
      title: '师傅姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '真实姓名',
      dataIndex: 'real_name',
      key: 'real_name'
    },
    {
      title: '身份证号',
      dataIndex: 'id_card',
      key: 'id_card'
    },
    {
      title: '技能',
      dataIndex: 'skills',
      key: 'skills',
      render: (val) => val || '-'
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
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                通过
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleReject(record.id)}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>认证审核</Title>
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
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}

export default Verifications
