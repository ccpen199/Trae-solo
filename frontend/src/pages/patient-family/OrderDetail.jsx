import React, { useState, useEffect } from 'react'
import { Card, Descriptions, Button, Rate, Input, message, List, Tag, Row, Col } from 'antd'
import { ArrowLeftOutlined, StarOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import request from '../../utils/request'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS } from '../../utils/constants'

const { TextArea } = Input

const OrderDetail = () => {
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [records, setRecords] = useState([])
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    fetchOrderDetail()
    fetchNursingRecords()
  }, [id])

  const fetchOrderDetail = async () => {
    setLoading(true)
    try {
      const data = await request.get(`/orders/${id}`)
      setOrder(data)
    } catch (error) {
      message.error('获取订单详情失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchNursingRecords = async () => {
    try {
      const data = await request.get(`/orders/${id}/nursing-records`)
      setRecords(data.list || data || [])
    } catch (error) {
      console.error('获取护理记录失败')
    }
  }

  const handleSubmitReview = async () => {
    if (rating === 0) {
      message.warning('请选择评分')
      return
    }
    setSubmitLoading(true)
    try {
      await request.post(`/orders/${id}/review`, { rating, comment })
      message.success('评价提交成功')
      fetchOrderDetail()
    } catch (error) {
      message.error('评价提交失败')
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48 }}>加载中...</div>
  }

  if (!order) {
    return <div style={{ textAlign: 'center', padding: 48 }}>订单不存在</div>
  }

  return (
    <div>
      <div className="page-header">
        <h2>订单详情</h2>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
      </div>

      <Card className="detail-card" title="订单基本信息">
        <Descriptions column={2}>
          <Descriptions.Item label="订单号">{order.order_no}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={ORDER_STATUS_COLORS[order.status]}>
              {ORDER_STATUS_LABELS[order.status]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="服务项目">{order.service_name}</Descriptions.Item>
          <Descriptions.Item label="预约时间">{order.scheduled_at}</Descriptions.Item>
          <Descriptions.Item label="患者姓名">{order.patient_name}</Descriptions.Item>
          <Descriptions.Item label="患者年龄">{order.patient_age}岁</Descriptions.Item>
          <Descriptions.Item label="服务地址">{order.address}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{order.contact_phone}</Descriptions.Item>
          <Descriptions.Item label="订单金额">¥{order.price}</Descriptions.Item>
          <Descriptions.Item label="下单时间">{order.created_at}</Descriptions.Item>
          {order.rating && (
            <Descriptions.Item label="我的评价">
              <Rate disabled value={order.rating} />
              {order.comment && <div style={{ marginTop: 8 }}>{order.comment}</div>}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card className="detail-card" title="护理记录">
        {records.length > 0 ? (
          <List
            dataSource={records}
            renderItem={(record) => (
              <List.Item key={record.id}>
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>记录时间：{record.created_at}</span>
                      <span>护士：{record.nurse_name}</span>
                    </div>
                  }
                  description={
                    <div>
                      <p><strong>生命体征：</strong>体温 {record.temperature}°C，脉搏 {record.pulse} 次/分，呼吸 {record.breathing} 次/分，血压 {record.blood_pressure} mmHg</p>
                      <p><strong>操作描述：</strong>{record.description}</p>
                      {record.abnormal && <p style={{ color: 'red' }}><strong>异常情况：</strong>{record.abnormal}</p>}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>暂无护理记录</div>
        )}
      </Card>

      {order.status === ORDER_STATUS.COMPLETED && !order.rating && (
        <Card className="detail-card" title="服务评价">
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 12 }}>服务评分：</span>
            <Rate value={rating} onChange={setRating} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <TextArea
              rows={4}
              placeholder="请输入您的评价内容"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <Button type="primary" loading={submitLoading} onClick={handleSubmitReview}>
            提交评价
          </Button>
        </Card>
      )}
    </div>
  )
}

export default OrderDetail
