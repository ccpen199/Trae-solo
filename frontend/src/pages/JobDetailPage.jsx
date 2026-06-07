import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Tag, Typography, Space, Modal, Input, message, Spin, Alert, Steps, Avatar, Divider } from 'antd'
import { EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, UserOutlined, FlagOutlined, EditOutlined, SafetyCertificateOutlined, MessageOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, AlertOutlined, PhoneOutlined } from '@ant-design/icons'
import request from '../utils/request'
import { getUserRole, getUser, isLoggedIn } from '../utils/auth'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Step } = Steps

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [applying, setApplying] = useState(false)
  const [guaranteeModalOpen, setGuaranteeModalOpen] = useState(false)
  const [guaranteeReason, setGuaranteeReason] = useState('')

  const fetchJob = async () => {
    setLoading(true)
    try {
      const res = await request.get(`/jobs/${id}`)
      setJob(res.data || res)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJob()
  }, [id])

  const handleApply = async () => {
    setApplying(true)
    try {
      await request.post('/orders', { job_id: parseInt(id) })
      message.success('申请成功，请等待雇主确认')
      navigate('/orders')
    } catch (e) {
    } finally {
      setApplying(false)
    }
  }

  const handleReport = async () => {
    if (!reportReason.trim()) {
      message.warning('请填写举报原因')
      return
    }
    try {
      await request.post(`/jobs/${id}/report`, { reason: reportReason })
      message.success('举报已提交，平台将在24小时内审核')
      setReportModalOpen(false)
      setReportReason('')
      fetchJob()
    } catch (e) {
    }
  }

  const handleGuarantee = async () => {
    if (!guaranteeReason.trim()) {
      message.warning('请填写保障申请原因')
      return
    }
    try {
      await request.post('/guarantees', { order_id: parseInt(id), reason: guaranteeReason, type: 'customer_service' })
      message.success('保障申请已提交，专属客服将尽快联系您')
      setGuaranteeModalOpen(false)
      setGuaranteeReason('')
    } catch (e) {
    }
  }

  const handleContact = async () => {
    try {
      const res = await request.post('/messages/sessions', { job_id: parseInt(id) })
      const session = res.data || res
      navigate(`/messages/${session.id}`)
    } catch (e) {
    }
  }

  const isOwner = isLoggedIn() && getUser()?.id === job?.employer_id

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
  if (!job) return <div>岗位不存在</div>

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
              {job.title}
            </Title>
            <Space size={8} wrap>
              <Tag color="blue">{job.category || '其他'}</Tag>
              {job.status === 'open' && <Tag color="green">招聘中</Tag>}
              {job.status === 'closed' && <Tag color="red">已关闭</Tag>}
              {job.status === 'pending' && <Tag color="orange">审核中</Tag>}
              {job.employer_verified === 1 ? (
                <Tag color="gold" icon={<SafetyCertificateOutlined />}>营业执照已核验</Tag>
              ) : (
                <Tag color="default" icon={<AlertOutlined />}>营业执照未核验</Tag>
              )}
              {job.audit_status === 'approved' && <Tag color="success" icon={<CheckCircleOutlined />}>平台已审核</Tag>}
              {job.report_count > 0 && (
                <Tag color="red" icon={<FlagOutlined />}>被举报{job.report_count}次</Tag>
              )}
            </Space>
          </div>
          <Space>
            {isLoggedIn() && getUserRole() === 'worker' && (
              <>
                <Button type="primary" size="large" loading={applying} onClick={handleApply}>
                  立即申请
                </Button>
                <Button icon={<MessageOutlined />} size="large" onClick={handleContact}>
                  在线沟通
                </Button>
                <Button icon={<FlagOutlined />} size="large" onClick={() => setReportModalOpen(true)}>
                  举报岗位
                </Button>
              </>
            )}
            {isOwner && (
              <Button icon={<EditOutlined />} onClick={() => navigate(`/employer/jobs`)}>
                编辑
              </Button>
            )}
          </Space>
        </div>

        <Alert
          message="斗米自营保障"
          description="本岗位已加入斗米自营保障计划：专属客服介入、先行赔付、争议仲裁三重保障，让您安心工作！"
          type="success"
          showIcon
          icon={<SafetyCertificateOutlined />}
          style={{ marginBottom: 24 }}
          action={
            isLoggedIn() && getUserRole() === 'worker' ? (
              <Button size="small" type="primary" onClick={() => setGuaranteeModalOpen(true)}>
                申请保障
              </Button>
            ) : null
          }
        />

        <Descriptions bordered column={{ xs: 1, sm: 2 }} style={{ marginBottom: 24 }}>
          <Descriptions.Item label={<><DollarOutlined /> 时薪</>}>
            <Text type="success" strong style={{ fontSize: 18 }}>{job.hourly_wage}元/时</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<><EnvironmentOutlined /> 工作地点</>}>
            {job.work_location || '未指定'}
          </Descriptions.Item>
          <Descriptions.Item label={<><ClockCircleOutlined /> 工作时间</>}>
            {job.work_time || '未指定'}
          </Descriptions.Item>
          <Descriptions.Item label={<><UserOutlined /> 雇主企业</>}>
            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{job.company_name || job.employer_name || '未知'}</span>
              {job.employer_verified === 1 ? (
                <Tag color="gold" icon={<SafetyCertificateOutlined />}>已核验</Tag>
              ) : (
                <Tag color="default">未核验</Tag>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={<><EyeOutlined /> 浏览量</>}>
            {job.view_count || 0} 次
          </Descriptions.Item>
          <Descriptions.Item label="结算方式">
            <Tag color="blue">T+0 即时到账</Tag>
            <Text type="secondary" style={{ marginLeft: 8 }}>完工确认后立即结算</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">完工确认流程</Divider>
        <Steps current={0} style={{ marginBottom: 24, background: '#f9f9f9', padding: 20, borderRadius: 8 }}>
          <Step title="在线申请" description="筛选岗位并提交申请" />
          <Step title="雇主确认" description="雇主审核并确认录用" />
          <Step title="围栏签到" description="到达工作地点，通过地理围栏签到打卡" icon={<EnvironmentOutlined />} />
          <Step title="完工确认" description="工作完成，雇主一键确认" icon={<CheckCircleOutlined />} />
          <Step title="T+0结算" description="立即结算到账，费用透明" />
        </Steps>
        <Alert
          message="完工即时确认流程说明"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li><strong>地理位置围栏签到</strong>：到达工作地点后，通过GPS定位完成签到，确保工作真实性</li>
              <li><strong>雇主端一键确认</strong>：工作完成后雇主可一键确认完工，系统自动触发结算</li>
              <li><strong>争议仲裁入口</strong>：如有争议，可随时发起仲裁申请，平台专属客服介入处理</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <div style={{ marginTop: 24 }}>
          <Title level={5}>岗位描述</Title>
          <Paragraph style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            {job.description || '暂无描述'}
          </Paragraph>
        </div>

        <Card title="费用透明展示" type="inner" style={{ marginTop: 24 }}>
          <Descriptions column={4}>
            <Descriptions.Item label="时薪">{job.hourly_wage}元</Descriptions.Item>
            <Descriptions.Item label="平台服务费(5%)">{(job.hourly_wage * 0.05).toFixed(2)}元</Descriptions.Item>
            <Descriptions.Item label="代扣个税(3%)">{(job.hourly_wage * 0.03).toFixed(2)}元</Descriptions.Item>
            <Descriptions.Item label="实际收入">
              <Text type="success" strong>{(job.hourly_wage * 0.92).toFixed(2)}元</Text>
            </Descriptions.Item>
          </Descriptions>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <PhoneOutlined /> 温馨提示：平台提供税务代缴凭证，可在结算中心查看下载
          </Text>
        </Card>
      </Card>

      <Modal
        title="举报岗位"
        open={reportModalOpen}
        onOk={handleReport}
        onCancel={() => setReportModalOpen(false)}
        okText="提交举报"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Alert
          message="举报说明"
          description="平台将对您的举报信息严格保密，24小时内完成审核。累计3次举报属实的岗位将自动下架。"
          type="warning"
          style={{ marginBottom: 16 }}
        />
        <TextArea
          rows={4}
          placeholder="请详细描述举报原因（如：虚假信息、收费诈骗、联系方式违规等）"
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
        />
        <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
          <FlagOutlined /> 举报加权机制：举报次数达到3次的岗位将自动下架进入人工复核
        </div>
      </Modal>

      <Modal
        title="申请斗米自营保障"
        open={guaranteeModalOpen}
        onOk={handleGuarantee}
        onCancel={() => setGuaranteeModalOpen(false)}
        okText="提交申请"
        cancelText="取消"
      >
        <Alert
          message="保障内容"
          description={
            <ul>
              <li>专属客服24小时内介入处理</li>
              <li>符合条件可申请先行赔付</li>
              <li>平台中立争议仲裁</li>
            </ul>
          }
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <TextArea
          rows={4}
          placeholder="请描述您遇到的问题"
          value={guaranteeReason}
          onChange={(e) => setGuaranteeReason(e.target.value)}
        />
      </Modal>
    </div>
  )
}
