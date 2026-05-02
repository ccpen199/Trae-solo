import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Space, Button, message, Spin, Modal, Form, Input, Select, Descriptions } from 'antd'
import { EyeOutlined, CheckOutlined, UserOutlined } from '@ant-design/icons'
import { dispatchApi } from '../services/api'
import { dispatchTypeNames } from '../stores/authStore'
import type { ColumnsType } from 'antd/es/table'

const { Option } = Select
const { TextArea } = Input

const Dispatches: React.FC = () => {
  const [dispatches, setDispatches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [currentDispatch, setCurrentDispatch] = useState<any>(null)
  const [assignForm] = Form.useForm()

  const fetchDispatches = async () => {
    setLoading(true)
    try {
      const res = await dispatchApi.list()
      if (res.data.success) {
        setDispatches(res.data.data)
      }
    } catch (error) {
      message.error('获取调度列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDispatches()
  }, [])

  const handleViewDetail = (record: any) => {
    setCurrentDispatch(record)
    setDetailModalVisible(true)
  }

  const handleAssign = (record: any) => {
    setCurrentDispatch(record)
    setAssignModalVisible(true)
    assignForm.resetFields()
  }

  const handleSubmitAssign = async (values: any) => {
    if (!currentDispatch) return
    try {
      const res = await dispatchApi.assign(currentDispatch.id, {
        operatorId: values.operatorId
      })
      if (res.data.success) {
        message.success('派单成功')
        setAssignModalVisible(false)
        fetchDispatches()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '派单失败')
    }
  }

  const handleComplete = async (record: any) => {
    Modal.confirm({
      title: '确认完成',
      content: '确认该调度任务已完成？',
      onOk: async () => {
        try {
          const res = await dispatchApi.complete(record.id, { result: '任务已完成' })
          if (res.data.success) {
            message.success('任务已完成')
            fetchDispatches()
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '操作失败')
        }
      }
    })
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'orange',
      assigned: 'blue',
      completed: 'green'
    }
    return colorMap[status] || 'default'
  }

  const columns: ColumnsType<any> = [
    {
      title: '调度单号',
      dataIndex: 'dispatch_no',
      key: 'dispatch_no',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '调度类型',
      dataIndex: 'dispatch_type',
      key: 'dispatch_type',
      render: (type) => dispatchTypeNames[type] || type
    },
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no'
    },
    {
      title: '车辆编号',
      dataIndex: 'bike_code',
      key: 'bike_code'
    },
    {
      title: '调度员',
      dataIndex: 'dispatcher_name',
      key: 'dispatcher_name'
    },
    {
      title: '运维员',
      dataIndex: 'operator_name',
      key: 'operator_name',
      render: (name) => name || '-'
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priority === 'high' ? 'red' : priority === 'normal' ? 'blue' : 'default'}>
          {priority === 'high' ? '高' : priority === 'normal' ? '普通' : priority}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status === 'pending' ? '待派单' : 
           status === 'assigned' ? '已派单' : 
           status === 'completed' ? '已完成' : status}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="primary" size="small" icon={<UserOutlined />} onClick={() => handleAssign(record)}>
              派单
            </Button>
          )}
          {record.status === 'assigned' && (
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleComplete(record)}>
              完成
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>调度管理</h2>
        <Button onClick={fetchDispatches}>刷新</Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={dispatches}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title="调度详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {currentDispatch && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="调度单号">{currentDispatch.dispatch_no}</Descriptions.Item>
              <Descriptions.Item label="调度类型">
                {dispatchTypeNames[currentDispatch.dispatch_type] || currentDispatch.dispatch_type}
              </Descriptions.Item>
              <Descriptions.Item label="订单号">{currentDispatch.order_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="车辆编号">{currentDispatch.bike_code || '-'}</Descriptions.Item>
              <Descriptions.Item label="调度员">{currentDispatch.dispatcher_name}</Descriptions.Item>
              <Descriptions.Item label="运维员">{currentDispatch.operator_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={currentDispatch.priority === 'high' ? 'red' : 'blue'}>
                  {currentDispatch.priority === 'high' ? '高' : '普通'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(currentDispatch.status)}>
                  {currentDispatch.status === 'pending' ? '待派单' : 
                   currentDispatch.status === 'assigned' ? '已派单' : 
                   currentDispatch.status === 'completed' ? '已完成' : currentDispatch.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentDispatch.created_at}</Descriptions.Item>
              <Descriptions.Item label="完成时间">{currentDispatch.completed_at || '-'}</Descriptions.Item>
            </Descriptions>
            
            {currentDispatch.description && (
              <Card title="描述" size="small" style={{ marginTop: 16 }}>
                <p>{currentDispatch.description}</p>
              </Card>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="派单"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleSubmitAssign}
        >
          <Form.Item
            name="operatorId"
            label="选择运维员"
            rules={[{ required: true, message: '请选择运维员' }]}
          >
            <Select placeholder="请选择运维员">
              <Option value="user_002">运维员1 (maintainer1)</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认派单
              </Button>
              <Button onClick={() => setAssignModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Dispatches
