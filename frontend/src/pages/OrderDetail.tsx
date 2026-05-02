import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Space, message, Spin, Timeline, Modal, Form, Input, Select, Divider, Result } from 'antd'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CreditCardOutlined
} from '@ant-design/icons'
import { orderApi, exceptionApi } from '../services/api'
import { statusNames, exceptionTypeNames, useAuthStore } from '../stores/authStore'

const { TextArea } = Input
const { Option } = Select

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [statusFlows, setStatusFlows] = useState<any[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [exceptionModalVisible, setExceptionModalVisible] = useState(false)
  const [exceptionForm] = Form.useForm()
  const { user } = useAuthStore()

  const fetchOrderDetail = async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const res = await orderApi.get(orderId)
      if (res.data.success) {
        setOrder(res.data.data.order)
        setStatusFlows(res.data.data.statusFlows || [])
      }
    } catch (error) {
      message.error('获取订单详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderDetail()
  }, [orderId])

  const handleStartRide = async () => {
    if (!orderId) return
    setActionLoading(true)
    try {
      const res = await orderApi.startRide(orderId)
      if (res.data.success) {
        message.success('开始骑行')
        fetchOrderDetail()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEndRide = async () => {
    if (!orderId) return
    setActionLoading(true)
    try {
      const res = await orderApi.endRide(orderId)
      if (res.data.success) {
        message.success('结束骑行，已生成计费')
        fetchOrderDetail()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmBilling = async () => {
    if (!orderId) return
    setActionLoading(true)
    try {
      const res = await orderApi.confirmBilling(orderId)
      if (res.data.success) {
        message.success('计费已确认')
        fetchOrderDetail()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePay = async () => {
    if (!orderId) return
    setActionLoading(true)
    try {
      const res = await orderApi.pay(orderId)
      if (res.data.success) {
        message.success('支付成功')
        fetchOrderDetail()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReportException = async (values: any) => {
    if (!orderId) return
    setActionLoading(true)
    try {
      const res = await exceptionApi.report({
        orderId,
        exceptionType: values.exceptionType,
        title: values.title,
        description: values.description
      })
      if (res.data.success) {
        message.success('异常已上报，等待客服处理')
        setExceptionModalVisible(false)
        exceptionForm.resetFields()
        fetchOrderDetail()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '上报失败')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending_scan: 'blue',
      pending_ride: 'cyan',
      riding: 'green',
      pending_billing: 'orange',
      billing_confirmed: 'gold',
      pending_exception: 'red',
      pending_dispatch: 'purple',
      completed: 'default',
      cancelled: 'default'
    }
    return colorMap[status] || 'default'
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!order) {
    return (
      <Result
        status="warning"
        title="订单不存在"
        extra={
          <Button type="primary" onClick={() => navigate('/orders')}>
            返回订单列表
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
          返回
        </Button>
        <h2 style={{ margin: '0 16px' }}>订单详情</h2>
        <Tag color={getStatusColor(order.status)} style={{ fontSize: 16 }}>
          {statusNames[order.status] || order.status}
        </Tag>
      </div>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={3}>
          <Descriptions.Item label="订单号">{order.order_no}</Descriptions.Item>
          <Descriptions.Item label="车辆编号">{order.bike_code}</Descriptions.Item>
          <Descriptions.Item label="锁编号">{order.lock_code}</Descriptions.Item>
          <Descriptions.Item label="用户">{order.user_name}</Descriptions.Item>
          <Descriptions.Item label="用户电话">{order.user_phone}</Descriptions.Item>
          <Descriptions.Item label="支付状态">
            <Tag color={order.payment_status === 'paid' ? 'green' : 'orange'}>
              {order.payment_status === 'paid' ? '已支付' : '未支付'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="开始时间">{order.start_time || '-'}</Descriptions.Item>
          <Descriptions.Item label="结束时间">{order.end_time || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{order.created_at}</Descriptions.Item>
          {order.duration_minutes > 0 && (
            <Descriptions.Item label="骑行时长">{order.duration_minutes} 分钟</Descriptions.Item>
          )}
          {order.distance_km > 0 && (
            <Descriptions.Item label="骑行距离">{order.distance_km.toFixed(2)} 公里</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {(order.amount > 0 || order.actual_amount > 0) && (
        <Card title="费用信息" style={{ marginBottom: 16 }}>
          <Descriptions bordered column={3}>
            <Descriptions.Item label="应付金额">
              <span style={{ fontSize: 24, color: '#ff4d4f', fontWeight: 'bold' }}>
                ¥{order.amount || 0}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="优惠金额">
              <span style={{ fontSize: 24, color: '#52c41a', fontWeight: 'bold' }}>
                ¥{order.discount_amount || 0}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="实付金额">
              <span style={{ fontSize: 24, color: '#ff4d4f', fontWeight: 'bold' }}>
                ¥{order.actual_amount || 0}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="可用操作" style={{ marginBottom: 16 }}>
        <Space size="middle">
          {order.availableActions?.includes('start_ride') && (
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={handleStartRide}
              loading={actionLoading}
            >
              开始骑行
            </Button>
          )}
          
          {order.availableActions?.includes('end_ride') && (
            <Button
              type="primary"
              size="large"
              danger
              icon={<PauseCircleOutlined />}
              onClick={handleEndRide}
              loading={actionLoading}
            >
              结束骑行
            </Button>
          )}
          
          {order.availableActions?.includes('confirm_billing') && (
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={handleConfirmBilling}
              loading={actionLoading}
            >
              确认计费
            </Button>
          )}
          
          {order.availableActions?.includes('pay') && (
            <Button
              type="primary"
              size="large"
              icon={<CreditCardOutlined />}
              onClick={handlePay}
              loading={actionLoading}
            >
              支付
            </Button>
          )}
          
          {order.availableActions?.includes('report_exception') && (
            <Button
              size="large"
              icon={<ExclamationCircleOutlined />}
              onClick={() => setExceptionModalVisible(true)}
            >
              上报异常
            </Button>
          )}
        </Space>
      </Card>

      {statusFlows.length > 0 && (
        <Card title="状态流水（时间轴）">
          <Timeline mode="left">
            {[...statusFlows].reverse().map((flow, index) => (
              <Timeline.Item
                key={flow.id}
                color={flow.to_status === 'completed' ? 'green' : 
                       flow.to_status === 'cancelled' ? 'red' : 'blue'}
              >
                <p>
                  <strong>{statusNames[flow.to_status] || flow.to_status}</strong>
                  {flow.from_status && ` (从 ${statusNames[flow.from_status] || flow.from_status})`}
                </p>
                <p>{flow.action} - {flow.reason}</p>
                <p style={{ color: '#999', fontSize: 12 }}>
                  {flow.operator_name || '系统'} | {flow.created_at}
                </p>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      )}

      <Modal
        title="上报异常"
        open={exceptionModalVisible}
        onCancel={() => setExceptionModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={exceptionForm}
          layout="vertical"
          onFinish={handleReportException}
        >
          <Form.Item
            name="exceptionType"
            label="异常类型"
            rules={[{ required: true, message: '请选择异常类型' }]}
          >
            <Select placeholder="请选择异常类型">
              {Object.entries(exceptionTypeNames).map(([key, value]) => (
                <Option key={key} value={key}>{value}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="异常标题"
            rules={[{ required: true, message: '请输入异常标题' }]}
          >
            <Input placeholder="简要描述异常" />
          </Form.Item>

          <Form.Item
            name="description"
            label="详细描述"
          >
            <TextArea rows={4} placeholder="详细描述异常情况" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={actionLoading}>
                提交
              </Button>
              <Button onClick={() => setExceptionModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OrderDetail
