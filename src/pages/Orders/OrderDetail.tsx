import { useState } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Steps,
  Button,
  Table,
  Timeline,
  Modal,
  Typography,
  Alert,
  Space,
  Row,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Checkbox,
  message,
  Result,
} from 'antd'
import {
  ArrowLeftOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  FileProtectOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { serviceOrders, workerProfiles } from '@/mock/data'
import type { OrderStatus, ServiceOrder } from '@/types'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { Title } = Typography

const statusMap: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'blue' },
  video_screening: { label: '视频初筛', color: 'cyan' },
  interview_scheduled: { label: '已排期面试', color: 'geekblue' },
  contract_signed: { label: '已签约', color: 'purple' },
  insurance_enrolled: { label: '已投保', color: 'magenta' },
  in_service: { label: '服务中', color: 'orange' },
  completed: { label: '已完成', color: 'green' },
  disputed: { label: '争议中', color: 'red' },
  cancelled: { label: '已取消', color: 'default' },
}

const stepStatuses: OrderStatus[] = [
  'pending',
  'video_screening',
  'interview_scheduled',
  'contract_signed',
  'insurance_enrolled',
  'in_service',
  'completed',
]

const stepLabels = [
  '待处理',
  '视频初筛',
  '面试排期',
  '签约',
  '投保',
  '服务中',
  '已完成',
]

const interviewTypeMap: Record<string, string> = {
  online: '线上面试',
  offline: '线下面试',
}

const contractStatusMap: Record<string, { label: string; color: string }> = {
  unsigned: { label: '未签署', color: 'default' },
  signed: { label: '已签署', color: 'green' },
  terminated: { label: '已终止', color: 'red' },
}

const insuranceStatusMap: Record<string, { label: string; color: string }> = {
  active: { label: '生效中', color: 'green' },
  expired: { label: '已过期', color: 'default' },
  claimed: { label: '已理赔', color: 'orange' },
}

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [interviewModalOpen, setInterviewModalOpen] = useState(false)
  const [interviewForm] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()

  const order = serviceOrders.find((o) => o.id === id)

  if (!order) {
    return (
      <div className="page-container">
        <Result
          status="404"
          title="工单不存在"
          subTitle={`未找到工单 ${id}`}
          extra={
            <Button type="primary" onClick={() => navigate('/orders')}>
              返回工单列表
            </Button>
          }
        />
      </div>
    )
  }

  const currentStepIndex = stepStatuses.indexOf(order.status)
  const isSpecialStatus = order.status === 'disputed' || order.status === 'cancelled'

  const getStepCurrent = () => {
    if (isSpecialStatus) return currentStepIndex >= 0 ? currentStepIndex : 0
    return currentStepIndex >= 0 ? currentStepIndex : 0
  }

  const showVideoScreening = ['video_screening', 'interview_scheduled', 'contract_signed', 'insurance_enrolled', 'in_service', 'completed'].includes(order.status) || !!order.videoScreening
  const showInterview = ['interview_scheduled', 'contract_signed', 'insurance_enrolled', 'in_service', 'completed'].includes(order.status) || !!order.interviewSchedule
  const showContract = ['contract_signed', 'insurance_enrolled', 'in_service', 'completed'].includes(order.status) || !!order.contract
  const showInsurance = ['insurance_enrolled', 'in_service', 'completed'].includes(order.status) || !!order.insurance

  const handleInterviewSubmit = () => {
    interviewForm.validateFields().then(() => {
      messageApi.success('面试安排已提交')
      setInterviewModalOpen(false)
      interviewForm.resetFields()
    })
  }

  return (
    <div className="page-container">
      {contextHolder}

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
          返回
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          工单 {order.id}
        </Title>
        <Tag color={statusMap[order.status].color} style={{ fontSize: 14, padding: '2px 12px' }}>
          {statusMap[order.status].label}
        </Tag>
      </div>

      {isSpecialStatus && (
        <Alert
          style={{ marginBottom: 16 }}
          type={order.status === 'disputed' ? 'error' : 'warning'}
          showIcon
          message={order.status === 'disputed' ? '该工单存在争议' : '该工单已取消'}
          description={
            order.status === 'disputed'
              ? '工单处于争议处理中，请前往纠纷中心查看详情'
              : '该工单已被取消，无法继续后续流程'
          }
        />
      )}

      <Card style={{ marginBottom: 16 }}>
        <Steps
          current={isSpecialStatus ? currentStepIndex >= 0 ? currentStepIndex : 0 : getStepCurrent()}
          status={isSpecialStatus ? 'error' : 'process'}
          items={stepLabels.map((label, index) => ({
            title: label,
          }))}
        />
      </Card>

      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={3}>
          <Descriptions.Item label="工单号">{order.id}</Descriptions.Item>
          <Descriptions.Item label="雇主">{order.employerName}</Descriptions.Item>
          <Descriptions.Item label="劳动者">{order.workerName}</Descriptions.Item>
          <Descriptions.Item label="服务类目">{order.category}</Descriptions.Item>
          <Descriptions.Item label="金额">¥{order.price.toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="服务时长">{order.duration}小时</Descriptions.Item>
          <Descriptions.Item label="预约日期">{order.scheduledDate || '-'}</Descriptions.Item>
          <Descriptions.Item label="地址" span={2}>{order.address}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{new Date(order.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
        </Descriptions>
      </Card>

      {showVideoScreening && (
        <Card
          title={
            <Space>
              <VideoCameraOutlined />
              视频初筛
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          {order.videoScreening ? (
            <Row gutter={24}>
              <Col span={12}>
                <div
                  style={{
                    background: '#f5f5f5',
                    borderRadius: 8,
                    height: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                  }}
                >
                  <VideoCameraOutlined style={{ fontSize: 48, marginBottom: 8 }} />
                  <span>视频播放区域</span>
                </div>
              </Col>
              <Col span={12}>
                <Descriptions column={1}>
                  <Descriptions.Item label="视频时长">
                    {Math.floor(order.videoScreening.duration / 60)}分{order.videoScreening.duration % 60}秒
                  </Descriptions.Item>
                  <Descriptions.Item label="初筛结果">
                    <Tag color={order.videoScreening.passed ? 'green' : 'red'}>
                      {order.videoScreening.passed ? '通过' : '未通过'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="完成时间">
                    {new Date(order.videoScreening.completedAt).toLocaleString('zh-CN')}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          ) : (
            <div
              style={{
                background: '#f5f5f5',
                borderRadius: 8,
                height: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
              }}
            >
              <VideoCameraOutlined style={{ fontSize: 48, marginBottom: 8 }} />
              <span>等待视频初筛</span>
            </div>
          )}
        </Card>
      )}

      {showInterview && (
        <Card
          title={
            <Space>
              <CalendarOutlined />
              面试排期
            </Space>
          }
          style={{ marginBottom: 16 }}
          extra={
            order.status === 'video_screening' || (order.status === 'interview_scheduled' && order.interviewSchedule?.status === 'scheduled') ? (
              <Button type="primary" onClick={() => setInterviewModalOpen(true)}>
                安排面试
              </Button>
            ) : null
          }
        >
          {order.interviewSchedule ? (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="面试时间">
                {new Date(order.interviewSchedule.dateTime).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="时长">
                {order.interviewSchedule.duration}分钟
              </Descriptions.Item>
              <Descriptions.Item label="面试方式">
                {interviewTypeMap[order.interviewSchedule.type]}
              </Descriptions.Item>
              <Descriptions.Item label="面试地点">
                {order.interviewSchedule.location || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag
                  color={
                    order.interviewSchedule.status === 'completed'
                      ? 'green'
                      : order.interviewSchedule.status === 'cancelled'
                      ? 'red'
                      : 'blue'
                  }
                >
                  {order.interviewSchedule.status === 'scheduled'
                    ? '已排期'
                    : order.interviewSchedule.status === 'completed'
                    ? '已完成'
                    : '已取消'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <div style={{ textAlign: 'center', color: '#999', padding: '24px 0' }}>
              暂未安排面试
            </div>
          )}
        </Card>
      )}

      {showContract && (
        <Card
          title={
            <Space>
              <FileProtectOutlined />
              服务协议
            </Space>
          }
          style={{ marginBottom: 16 }}
          extra={
            order.contract?.status === 'unsigned' ? (
              <Button type="primary" icon={<FileProtectOutlined />}>
                签署协议
              </Button>
            ) : null
          }
        >
          {order.contract ? (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="签署时间">
                {order.contract.signedAt
                  ? new Date(order.contract.signedAt).toLocaleString('zh-CN')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={contractStatusMap[order.contract.status].color}>
                  {contractStatusMap[order.contract.status].label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="服务开始日期">
                {order.contract.startDate}
              </Descriptions.Item>
              <Descriptions.Item label="服务结束日期">
                {order.contract.endDate}
              </Descriptions.Item>
              <Descriptions.Item label="条款摘要" span={2}>
                {order.contract.terms}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <div style={{ textAlign: 'center', color: '#999', padding: '24px 0' }}>
              暂未签署协议
            </div>
          )}
        </Card>
      )}

      {showInsurance && (
        <Card
          title={
            <Space>
              <SafetyOutlined />
              保险投保
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          {order.insurance ? (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="保单号">{order.insurance.policyNumber}</Descriptions.Item>
              <Descriptions.Item label="保险公司">{order.insurance.provider}</Descriptions.Item>
              <Descriptions.Item label="险种">{order.insurance.type}</Descriptions.Item>
              <Descriptions.Item label="保费">¥{order.insurance.premium}</Descriptions.Item>
              <Descriptions.Item label="保险开始日期">{order.insurance.startDate}</Descriptions.Item>
              <Descriptions.Item label="保险结束日期">{order.insurance.endDate}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={insuranceStatusMap[order.insurance.status].color}>
                  {insuranceStatusMap[order.insurance.status].label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <div style={{ textAlign: 'center', color: '#999', padding: '24px 0' }}>
              暂未投保
            </div>
          )}
        </Card>
      )}

      <Modal
        title="安排面试"
        open={interviewModalOpen}
        onOk={handleInterviewSubmit}
        onCancel={() => {
          setInterviewModalOpen(false)
          interviewForm.resetFields()
        }}
        okText="确认安排"
        cancelText="取消"
      >
        <Form form={interviewForm} layout="vertical">
          <Form.Item name="dateTime" label="日期时间" rules={[{ required: true, message: '请选择日期时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="duration" label="时长（分钟）" rules={[{ required: true, message: '请输入面试时长' }]}>
            <InputNumber min={15} max={180} style={{ width: '100%' }} placeholder="请输入面试时长" />
          </Form.Item>
          <Form.Item name="type" label="面试方式" rules={[{ required: true, message: '请选择面试方式' }]}>
            <Select
              placeholder="请选择面试方式"
              options={[
                { label: '线上面试', value: 'online' },
                { label: '线下面试', value: 'offline' },
              ]}
            />
          </Form.Item>
          <Form.Item name="location" label="面试地点">
            <Input placeholder="请输入面试地点（线上面试可留空）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OrderDetail
