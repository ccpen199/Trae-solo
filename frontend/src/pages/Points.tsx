import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Table,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
  Spin,
  Empty,
  Tag,
} from 'antd'
import {
  TrophyOutlined,
  GiftOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useUserStore } from '../stores/userStore'
import { pointsApi } from '../services/api'
import dayjs from 'dayjs'

const { Title } = Typography

interface PointsInfo {
  totalBalance: number
  availableBalance: number
  frozenBalance: number
  pendingBalance: number
  totalEarned: number
  totalSpent: number
  totalExpired: number
}

const Points: React.FC = () => {
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [pointsInfo, setPointsInfo] = useState<PointsInfo | null>(null)
  const [awardModalVisible, setAwardModalVisible] = useState(false)
  const [form] = Form.useForm()

  const isStaff = ['manager', 'employee', 'admin'].includes(user?.role || '')

  useEffect(() => {
    fetchPointsInfo()
  }, [user])

  const fetchPointsInfo = async () => {
    setLoading(true)
    try {
      const response = await pointsApi.getPointsInfo()
      setPointsInfo(response.data.data)
    } catch (error: any) {
      message.error(error.message || '获取积分信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAwardPoints = async (values: any) => {
    try {
      const data = {
        memberId: values.memberId,
        points: values.points,
        businessType: values.businessType || 'manual_award',
        businessNo: values.businessNo || `MANUAL-${Date.now()}`,
        description: values.description,
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : undefined,
      }

      await pointsApi.awardPoints(data)
      message.success('积分发放成功')
      setAwardModalVisible(false)
      form.resetFields()
      fetchPointsInfo()
    } catch (error: any) {
      message.error(error.message || '积分发放失败')
    }
  }

  const getTransactionTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      earn: '获得积分',
      spend: '消费积分',
      freeze: '冻结积分',
      unfreeze: '解冻积分',
      expire: '积分过期',
      adjust: '积分调整',
      rollback: '积分回滚',
    }
    return typeMap[type] || type
  }

  const getTransactionTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      earn: 'success',
      spend: 'error',
      freeze: 'warning',
      unfreeze: 'processing',
      expire: 'default',
      adjust: 'blue',
      rollback: 'purple',
    }
    return colorMap[type] || 'default'
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待入账',
      confirmed: '已确认',
      cancelled: '已取消',
      failed: '失败',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'warning',
      confirmed: 'success',
      cancelled: 'default',
      failed: 'error',
    }
    return colorMap[status] || 'default'
  }

  return (
    <Spin spinning={loading}>
      <Title level={4} style={{ marginBottom: 24 }}>
        积分管理
      </Title>

      {pointsInfo && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总积分"
                value={pointsInfo.totalBalance}
                prefix={<TrophyOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="可用积分"
                value={pointsInfo.availableBalance}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="冻结积分"
                value={pointsInfo.frozenBalance}
                prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="待入账积分"
                value={pointsInfo.pendingBalance}
                prefix={<HistoryOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {pointsInfo && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="累计获得积分"
                value={pointsInfo.totalEarned}
                prefix={<GiftOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="累计消费积分"
                value={pointsInfo.totalSpent}
                prefix={<HistoryOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic
                title="累计过期积分"
                value={pointsInfo.totalExpired}
                prefix={<ClockCircleOutlined style={{ color: '#999' }} />}
                valueStyle={{ color: '#999' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {isStaff && (
        <Card title="操作">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAwardModalVisible(true)}
          >
            发放积分
          </Button>
        </Card>
      )}

      <Modal
        title="发放积分"
        open={awardModalVisible}
        onCancel={() => setAwardModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAwardPoints}
        >
          <Form.Item
            name="memberId"
            label="会员ID"
            rules={[{ required: true, message: '请输入会员ID' }]}
          >
            <Input placeholder="请输入会员ID" />
          </Form.Item>

          <Form.Item
            name="points"
            label="积分数量"
            rules={[{ required: true, message: '请输入积分数量' }]}
          >
            <InputNumber
              min={0.01}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入积分数量"
            />
          </Form.Item>

          <Form.Item
            name="businessType"
            label="业务类型"
          >
            <Input placeholder="如：消费奖励、活动奖励、签到奖励等" />
          </Form.Item>

          <Form.Item
            name="businessNo"
            label="业务单号"
          >
            <Input placeholder="可选，如订单号、活动编号等" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="可选，积分发放描述" rows={3} />
          </Form.Item>

          <Form.Item
            name="expiryDate"
            label="过期日期"
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="可选，不填则使用默认有效期"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button
              onClick={() => setAwardModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              确认发放
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Spin>
  )
}

export default Points
