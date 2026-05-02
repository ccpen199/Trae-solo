import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Space, Button, Select, message, Spin, Modal, Form, Input, Descriptions } from 'antd'
import { EyeOutlined, CheckOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { exceptionApi } from '../services/api'
import { exceptionTypeNames, statusNames } from '../stores/authStore'
import type { ColumnsType } from 'antd/es/table'

const { Option } = Select
const { TextArea } = Input

const Exceptions: React.FC = () => {
  const [exceptions, setExceptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [processModalVisible, setProcessModalVisible] = useState(false)
  const [currentException, setCurrentException] = useState<any>(null)
  const [processForm] = Form.useForm()

  const fetchExceptions = async () => {
    setLoading(true)
    try {
      const res = await exceptionApi.list()
      if (res.data.success) {
        setExceptions(res.data.data)
      }
    } catch (error) {
      message.error('获取异常列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExceptions()
  }, [])

  const handleViewDetail = (record: any) => {
    setCurrentException(record)
    setDetailModalVisible(true)
  }

  const handleProcess = (record: any) => {
    setCurrentException(record)
    setProcessModalVisible(true)
    processForm.resetFields()
  }

  const handleSubmitProcess = async (values: any) => {
    if (!currentException) return
    try {
      const res = await exceptionApi.process(currentException.id, {
        action: values.action,
        comment: values.comment
      })
      if (res.data.success) {
        message.success('处理成功')
        setProcessModalVisible(false)
        setDetailModalVisible(false)
        fetchExceptions()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '处理失败')
    }
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'orange',
      approved: 'green',
      rejected: 'red'
    }
    return colorMap[status] || 'default'
  }

  const columns: ColumnsType<any> = [
    {
      title: '异常类型',
      dataIndex: 'exception_type',
      key: 'exception_type',
      render: (type) => exceptionTypeNames[type] || type
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title'
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
      title: '上报用户',
      dataIndex: 'reporter_name',
      key: 'reporter_name'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status === 'pending' ? '待处理' : 
           status === 'approved' ? '已批准' : 
           status === 'rejected' ? '已驳回' : status}
        </Tag>
      )
    },
    {
      title: '上报时间',
      dataIndex: 'reported_at',
      key: 'reported_at'
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
            <Button type="primary" size="small" onClick={() => handleProcess(record)}>
              处理
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>异常处理</h2>
        <Button onClick={fetchExceptions}>刷新</Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={exceptions}
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
        title="异常详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={
          currentException?.status === 'pending' ? (
            <Space>
              <Button onClick={() => setDetailModalVisible(false)}>关闭</Button>
              <Button type="primary" onClick={() => {
                setDetailModalVisible(false)
                setProcessModalVisible(true)
              }}>处理</Button>
            </Space>
          ) : null
        }
        width={700}
      >
        {currentException && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="异常类型">
                {exceptionTypeNames[currentException.exception_type] || currentException.exception_type}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(currentException.status)}>
                  {currentException.status === 'pending' ? '待处理' : 
                   currentException.status === 'approved' ? '已批准' : 
                   currentException.status === 'rejected' ? '已驳回' : currentException.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单号">{currentException.order_no}</Descriptions.Item>
              <Descriptions.Item label="车辆编号">{currentException.bike_code}</Descriptions.Item>
              <Descriptions.Item label="上报用户">{currentException.reporter_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentException.reporter_phone}</Descriptions.Item>
              <Descriptions.Item label="上报时间">{currentException.reported_at}</Descriptions.Item>
              <Descriptions.Item label="解决时间">{currentException.resolved_at || '-'}</Descriptions.Item>
            </Descriptions>
            
            <Card title="描述" size="small" style={{ marginTop: 16 }}>
              <p>{currentException.description || '无'}</p>
            </Card>
            
            {currentException.resolution && (
              <Card title="处理结果" size="small" style={{ marginTop: 16 }}>
                <p>{currentException.resolution}</p>
              </Card>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="处理异常"
        open={processModalVisible}
        onCancel={() => setProcessModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={processForm}
          layout="vertical"
          onFinish={handleSubmitProcess}
        >
          <Form.Item
            name="action"
            label="处理动作"
            rules={[{ required: true, message: '请选择处理动作' }]}
          >
            <Select placeholder="请选择处理动作">
              <Option value="approve">批准（转入调度维修）</Option>
              <Option value="reject">驳回（返回骑行状态）</Option>
              <Option value="request_more_info">需要补充资料</Option>
              <Option value="reassign">转派</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comment"
            label="处理意见"
            rules={[{ required: true, message: '请输入处理意见' }]}
          >
            <TextArea rows={4} placeholder="请输入处理意见" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
              <Button onClick={() => setProcessModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Exceptions
