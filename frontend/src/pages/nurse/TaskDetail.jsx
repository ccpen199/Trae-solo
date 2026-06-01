import React, { useState, useEffect } from 'react'
import { Card, Descriptions, Button, message, Tag, Row, Col } from 'antd'
import { ArrowLeftOutlined, EnvironmentOutlined, LogoutOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import request from '../../utils/request'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS } from '../../utils/constants'

const TaskDetail = () => {
  const [loading, setLoading] = useState(false)
  const [task, setTask] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    fetchTaskDetail()
  }, [id])

  const fetchTaskDetail = async () => {
    setLoading(true)
    try {
      const data = await request.get(`/nurse/tasks/${id}`)
      setTask(data)
    } catch (error) {
      message.error('获取任务详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setActionLoading(true)
    try {
      await request.post(`/nurse/tasks/${id}/checkin`)
      message.success('签到成功')
      fetchTaskDetail()
    } catch (error) {
      message.error('签到失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setActionLoading(true)
    try {
      await request.post(`/nurse/tasks/${id}/checkout`)
      message.success('签退成功')
      fetchTaskDetail()
    } catch (error) {
      message.error('签退失败')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48 }}>加载中...</div>
  }

  if (!task) {
    return <div style={{ textAlign: 'center', padding: 48 }}>任务不存在</div>
  }

  return (
    <div>
      <div className="page-header">
        <h2>任务详情</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {task.status === ORDER_STATUS.NURSE_ACCEPTED && (
            <Button type="primary" icon={<EnvironmentOutlined />} loading={actionLoading} onClick={handleCheckIn}>
              签到
            </Button>
          )}
          {task.status === ORDER_STATUS.IN_PROGRESS && (
            <Button type="primary" icon={<LogoutOutlined />} loading={actionLoading} onClick={handleCheckOut}>
              签退
            </Button>
          )}
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
        </div>
      </div>

      <Row gutter={24}>
        <Col span={12}>
          <Card className="detail-card" title="任务基本信息">
            <Descriptions column={1}>
              <Descriptions.Item label="订单号">{task.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={ORDER_STATUS_COLORS[task.status]}>
                  {ORDER_STATUS_LABELS[task.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="服务项目">{task.service_name}</Descriptions.Item>
              <Descriptions.Item label="预约时间">{task.scheduled_at}</Descriptions.Item>
              <Descriptions.Item label="服务时长">{task.duration}分钟</Descriptions.Item>
              <Descriptions.Item label="服务地址">{task.address}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={12}>
          <Card className="detail-card" title="患者信息">
            <Descriptions column={1}>
              <Descriptions.Item label="姓名">{task.patient_name}</Descriptions.Item>
              <Descriptions.Item label="年龄">{task.patient_age}岁</Descriptions.Item>
              <Descriptions.Item label="性别">{task.patient_gender === 'male' ? '男' : '女'}</Descriptions.Item>
              <Descriptions.Item label="紧急联系人">{task.contact_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{task.contact_phone}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card className="detail-card" title="服务要求">
        <p><strong>病情描述：</strong>{task.condition_description}</p>
        {task.medical_order && (
          <p><strong>医嘱信息：</strong>{task.medical_order}</p>
        )}
        {task.special_requirements && (
          <p><strong>特殊要求：</strong>{task.special_requirements}</p>
        )}
      </Card>

      <Card className="detail-card" title="签到签退记录">
        <Descriptions column={2}>
          <Descriptions.Item label="签到时间">{task.checkin_time || '未签到'}</Descriptions.Item>
          <Descriptions.Item label="签到位置">{task.checkin_location || '-'}</Descriptions.Item>
          <Descriptions.Item label="签退时间">{task.checkout_time || '未签退'}</Descriptions.Item>
          <Descriptions.Item label="签退位置">{task.checkout_location || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}

export default TaskDetail
