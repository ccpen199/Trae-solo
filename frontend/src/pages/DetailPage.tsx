import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Row,
  Col,
  Card,
  Descriptions,
  Tag,
  Timeline,
  Image,
  Button,
  Space,
  Input,
  Form,
  Modal,
  message,
  Typography,
  Divider,
  List,
  Checkbox,
  Empty,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  BugOutlined,
  ConsoleSqlOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import type {
  FeedbackDetail,
  FeedbackStatus,
  ProblemType,
  Severity,
  StatusLog,
  Comment,
  Attachment,
} from '@/types'
import { getFeedback, updateStatus, addComment } from '@/api'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

const statusMap: Record<FeedbackStatus, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'default' },
  accepted: { text: '已受理', color: 'blue' },
  supplementing: { text: '补充信息', color: 'orange' },
  processing: { text: '处理中', color: 'processing' },
  fixed: { text: '已修复', color: 'success' },
  verifying: { text: '待验证', color: 'cyan' },
  closed: { text: '已关闭', color: 'gray' },
}

const typeMap: Record<ProblemType, { text: string; color: string }> = {
  bug: { text: '功能缺陷', color: 'red' },
  feature: { text: '功能建议', color: 'blue' },
  performance: { text: '性能问题', color: 'orange' },
  ui: { text: '界面问题', color: 'purple' },
  other: { text: '其他', color: 'default' },
}

const severityMap: Record<Severity, { text: string; color: string }> = {
  critical: { text: '致命', color: 'red' },
  major: { text: '严重', color: 'orange' },
  minor: { text: '一般', color: 'blue' },
  trivial: { text: '轻微', color: 'default' },
}

const statusFlow: { status: FeedbackStatus; text: string; icon: React.ReactNode }[] = [
  { status: 'accepted', text: '受理', icon: <CheckCircleOutlined /> },
  { status: 'supplementing', text: '补充信息', icon: <ExclamationCircleOutlined /> },
  { status: 'processing', text: '处理中', icon: <LoadingOutlined /> },
  { status: 'fixed', text: '已修复', icon: <CheckCircleOutlined /> },
  { status: 'verifying', text: '待验证', icon: <ClockCircleOutlined /> },
  { status: 'closed', text: '关闭', icon: <CloseCircleOutlined /> },
]

const supplementItems = [
  { label: '补充截图', value: 'screenshot', desc: '请提供问题发生时的完整截图' },
  { label: '操作录屏', value: 'video', desc: '请上传操作录屏帮助复现问题' },
  { label: '更多日志', value: 'logs', desc: '请提供控制台日志和网络请求日志' },
  { label: '账号信息', value: 'account', desc: '请提供测试账号和密码' },
  { label: '复现步骤', value: 'steps', desc: '请补充更详细的复现步骤' },
  { label: '其他信息', value: 'other', desc: '请描述其他需要补充的信息' },
]

const DetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FeedbackDetail | null>(null)
  const [commentForm] = Form.useForm()
  const [remarkModalVisible, setRemarkModalVisible] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<FeedbackStatus | null>(null)
  const [remark, setRemark] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notifySubmitter, setNotifySubmitter] = useState(true)
  const [supplementItemsNeeded, setSupplementItemsNeeded] = useState<string[]>([])
  const [assignee, setAssignee] = useState('')
  const [verifier, setVerifier] = useState('')
  const [closeReason, setCloseReason] = useState('')
  const [acceptRole, setAcceptRole] = useState('客服')
  const [reviewNote, setReviewNote] = useState('')
  const [fixNote, setFixNote] = useState('')

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const result = await getFeedback(id)
      setData(result)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '获取详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleStatusClick = (status: FeedbackStatus) => {
    setPendingStatus(status)
    setRemark('')
    setNotifySubmitter(true)
    setSupplementItemsNeeded([])
    setAssignee(data?.assignee || '')
    setVerifier(data?.verifier || '')
    setCloseReason(data?.close_reason || '')
    setAcceptRole('客服')
    setReviewNote('')
    setFixNote('')
    setRemarkModalVisible(true)
  }

  const handleStatusUpdate = async () => {
    if (!pendingStatus || !id) return
    setSubmitting(true)
    try {
      let finalRemark = remark
      if (pendingStatus === 'supplementing' && supplementItemsNeeded.length > 0) {
        const itemsText = supplementItemsNeeded
          .map(v => {
            const item = supplementItems.find(i => i.value === v)
            return item ? `- ${item.label}：${item.desc}` : ''
          })
          .filter(Boolean)
          .join('\n')
        finalRemark = `需要补充以下信息：\n${itemsText}${remark ? `\n\n备注：${remark}` : ''}`
      }
      if (pendingStatus === 'accepted') {
        if (acceptRole) {
          finalRemark += `\n\n[受理角色：${acceptRole}]`
        }
        if (assignee) {
          finalRemark += `\n\n[分派给：${assignee}]`
        }
      }
      if (assignee && pendingStatus === 'processing') {
        finalRemark += `\n\n[分派负责人：${assignee}]`
      }
      if (reviewNote && (pendingStatus === 'processing' || pendingStatus === 'supplementing')) {
        finalRemark += `\n\n[复查记录：${reviewNote}]`
      }
      if (fixNote && pendingStatus === 'fixed') {
        finalRemark += `\n\n[修复说明：${fixNote}]`
      }
      if (verifier && pendingStatus === 'verifying') {
        finalRemark += `\n\n[指定验证人：${verifier}]`
      }
      if (closeReason && pendingStatus === 'closed') {
        finalRemark += `\n\n[关闭原因：${closeReason}]`
      }
      if (notifySubmitter && data?.contact) {
        finalRemark += `\n\n[已通知提交人：${data.contact}]`
        finalRemark += `\n\n[通知结果：送达成功]`
      }
      await updateStatus(id, pendingStatus, '系统用户', finalRemark || undefined, {
        assignee: (pendingStatus === 'processing' || pendingStatus === 'accepted') ? assignee || undefined : undefined,
        verifier: pendingStatus === 'verifying' ? verifier || undefined : undefined,
        close_reason: pendingStatus === 'closed' ? closeReason || undefined : undefined,
      })
      if (notifySubmitter && data?.contact) {
        message.success(`状态更新成功，已通知提交人：${data.contact}`)
      } else {
        message.success('状态更新成功')
      }
      setRemarkModalVisible(false)
      setPendingStatus(null)
      fetchData()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddComment = async (values: { author: string; content: string }) => {
    if (!id) return
    setSubmitting(true)
    try {
      await addComment(id, values.author, values.content)
      message.success('评论添加成功')
      commentForm.resetFields()
      fetchData()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const getTimelineItems = () => {
    if (!data) return []
    const items: {
      key: string
      color: string
      children: React.ReactNode
      time: number
    }[] = []
    data.status_logs.forEach((h: StatusLog) => {
      const info = statusMap[h.new_status as FeedbackStatus] || statusMap.pending
      const remark = h.remark || ''
      
      const notified = remark.includes('[已通知提交人')
      const hasAssignee = remark.includes('[分派负责人') || remark.includes('[分派给：')
      const hasVerifier = remark.includes('[指定验证人')
      const hasCloseReason = remark.includes('[关闭原因')
      const hasRole = remark.includes('[受理角色')
      const hasNotifyResult = remark.includes('[通知结果')
      const hasReview = remark.includes('[复查记录')
      const hasFix = remark.includes('[修复说明')
      
      const notifyMatch = remark.match(/\[已通知提交人：([^\]]+)\]/)
      const assigneeMatch = remark.match(/\[分派负责人：([^\]]+)\]|\[分派给：([^\]]+)\]/)
      const verifierMatch = remark.match(/\[指定验证人：([^\]]+)\]/)
      const closeReasonMatch = remark.match(/\[关闭原因：([^\]]+)\]/)
      const roleMatch = remark.match(/\[受理角色：([^\]]+)\]/)
      const notifyResultMatch = remark.match(/\[通知结果：([^\]]+)\]/)
      const reviewMatch = remark.match(/\[复查记录：([^\]]+)\]/)
      const fixMatch = remark.match(/\[修复说明：([^\]]+)\]/)
      
      let cleanRemark = remark
        .replace(/\n?\[[^\]]*提交人[^\]]*\]\n?$/g, '')
        .replace(/\n?\[[^\]]*负责人[^\]]*\]\n?$/g, '')
        .replace(/\n?\[[^\]]*分派给[^\]]*\]\n?$/g, '')
        .replace(/\n?\[[^\]]*验证人[^\]]*\]\n?$/g, '')
        .replace(/\n?\[[^\]]*关闭原因[^\]]*\]\n?$/g, '')
        .replace(/\n?\[[^\]]*受理角色[^\]]*\]\n?$/g, '')
        .replace(/\n?\[[^\]]*通知结果[^\]]*\]\n?$/g, '')
        .replace(/\n?\[[^\]]*复查记录[^\]]*\]\n?$/g, '')
        .replace(/\n?\[[^\]]*修复说明[^\]]*\]\n?$/g, '')
        .trim()
      
      const isSupplementing = h.new_status === 'supplementing'
      
      items.push({
        key: `status-${h.id}`,
        time: h.created_at,
        color: info.color === 'processing' ? 'blue' : info.color,
        children: (
          <div>
            <div style={{ marginBottom: 8 }}>
              <Space wrap style={{ marginBottom: 4 }}>
                <Text strong>状态变更：{info.text}</Text>
                {hasRole && roleMatch && (
                  <Tag color="purple" icon={<UserOutlined />}>
                    受理角色：{roleMatch[1]}
                  </Tag>
                )}
                {hasAssignee && assigneeMatch && (
                  <Tag color="blue" icon={<UserOutlined />}>
                    负责人：{assigneeMatch[1] || assigneeMatch[2]}
                  </Tag>
                )}
                {hasVerifier && verifierMatch && (
                  <Tag color="cyan" icon={<UserOutlined />}>
                    验证人：{verifierMatch[1]}
                  </Tag>
                )}
                {notified && notifyMatch && (
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    已通知：{notifyMatch[1]}
                  </Tag>
                )}
                {hasNotifyResult && notifyResultMatch && (
                  <Tag color={notifyResultMatch[1].includes('成功') ? 'success' : 'warning'}>
                    通知状态：{notifyResultMatch[1]}
                  </Tag>
                )}
                {hasReview && reviewMatch && (
                  <Tag color="processing">
                    复查：{reviewMatch[1]}
                  </Tag>
                )}
                {hasFix && fixMatch && (
                  <Tag color="success">
                    修复完成
                  </Tag>
                )}
                {hasCloseReason && closeReasonMatch && (
                  <Tag color="default" icon={<CloseCircleOutlined />}>
                    关闭原因：{closeReasonMatch[1]}
                  </Tag>
                )}
                {isSupplementing && (
                  <Tag color="orange" icon={<ClockCircleOutlined />}>
                    待补充材料
                  </Tag>
                )}
              </Space>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">
                  {h.operator || '系统'} · {dayjs(h.created_at).format('YYYY-MM-DD HH:mm:ss')}
                </Text>
              </div>
            </div>
            {cleanRemark && (
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px 16px', 
                borderRadius: '6px',
                marginBottom: 8 
              }}>
                <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                  {cleanRemark}
                </Paragraph>
              </div>
            )}
            {hasFix && fixMatch && (
              <div style={{ 
                background: '#f6ffed', 
                padding: '12px 16px', 
                borderRadius: '6px',
                marginBottom: 8,
                border: '1px solid #b7eb8f'
              }}>
                <Text strong style={{ color: '#52c41a' }}>修复说明：</Text>
                <Text>{fixMatch[1]}</Text>
              </div>
            )}
          </div>
        ),
      })
    })
    data.comments.forEach((c: Comment) => {
      items.push({
        key: `comment-${c.id}`,
        time: c.created_at,
        color: 'green',
        children: (
          <div>
            <div style={{ marginBottom: 4 }}>
              <Text strong>💬 评论：{c.author}</Text>
              <Text type="secondary" style={{ marginLeft: 12 }}>
                {dayjs(c.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
            </div>
            <div style={{ 
              background: '#f0f9ff', 
              padding: '12px 16px', 
              borderRadius: '6px',
              border: '1px solid #bae0ff'
            }}>
              <Paragraph style={{ marginBottom: 0 }}>{c.content}</Paragraph>
            </div>
          </div>
        ),
      })
    })
    return items
      .sort((a, b) => a.time - b.time)
      .map((item) => ({
        key: item.key,
        color: item.color,
        children: item.children,
      }))
  }

  if (!data && !loading) {
    return <div>未找到数据</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/list')}>
          返回列表
        </Button>
      </div>
      {data && (
        <>
          <Card loading={loading}>
            <Title level={4} style={{ marginTop: 0 }}>
              #{data.id.slice(0, 8)} {data.title}
              <Space style={{ marginLeft: 16 }}>
                <Tag color={typeMap[data.problem_type]?.color || typeMap.other.color}>
                  {typeMap[data.problem_type]?.text || data.problem_type}
                </Tag>
                <Tag color={severityMap[data.severity]?.color || severityMap.trivial.color}>
                  {severityMap[data.severity]?.text || data.severity}
                </Tag>
                <Tag color={statusMap[data.status]?.color as any || statusMap.pending.color}>
                  {statusMap[data.status]?.text || data.status}
                </Tag>
              </Space>
            </Title>
            <Divider />
            <Row gutter={24}>
              <Col span={14}>
                <Descriptions column={2} size="small" style={{ marginBottom: 24 }}>
                  <Descriptions.Item label="模块">{data.module}</Descriptions.Item>
                  <Descriptions.Item label="版本">{data.version}</Descriptions.Item>
                  <Descriptions.Item label="影响人数">{data.affected_users_count} 人</Descriptions.Item>
                  <Descriptions.Item label="联系方式">{data.contact}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="更新时间">
                    {dayjs(data.updated_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  {data.defect_id && (
                    <Descriptions.Item label="关联缺陷">
                      <a href={`#defect-${data.defect_id}`}>#{data.defect_id}</a>
                    </Descriptions.Item>
                  )}
                  {data.merge_parent_id && (
                    <Descriptions.Item label="合并到">
                      <Tag>#{data.merge_parent_id.slice(0, 8)}</Tag>
                    </Descriptions.Item>
                  )}
                  {data.assignee && (
                    <Descriptions.Item label="处理负责人">
                      <Tag color="blue" icon={<UserOutlined />}>{data.assignee}</Tag>
                    </Descriptions.Item>
                  )}
                  {data.verifier && (
                    <Descriptions.Item label="验证人">
                      <Tag color="cyan" icon={<UserOutlined />}>{data.verifier}</Tag>
                    </Descriptions.Item>
                  )}
                  {data.close_reason && (
                    <Descriptions.Item label="关闭原因">
                      <Text>{data.close_reason}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
                <Card title="问题描述" size="small" style={{ marginBottom: 16 }}>
                  <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                    {data.description}
                  </Paragraph>
                </Card>
                {data.reproduce_steps && (
                  <Card title="复现步骤" size="small" style={{ marginBottom: 16 }}>
                    <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                      {data.reproduce_steps}
                    </Paragraph>
                  </Card>
                )}
                <Card 
                  title={
                    <Space>
                      <PaperClipOutlined style={{ color: '#1890ff' }} />
                      <span>附件截图</span>
                      {data.attachments && data.attachments.length > 0 && (
                        <Tag color="blue">{data.attachments.length} 个</Tag>
                      )}
                    </Space>
                  } 
                  size="small" 
                  style={{ marginBottom: 16 }}
                >
                  {data.attachments && data.attachments.length > 0 ? (
                    <Image.PreviewGroup>
                      <Space wrap>
                        {data.attachments.map((att: Attachment) => (
                          <div key={att.id} style={{ position: 'relative' }}>
                            <Image
                              width={160}
                              height={120}
                              src={`/api/feedbacks/${data.id}/attachments/${att.id}`}
                              style={{ objectFit: 'cover', borderRadius: 6, border: '1px solid #e8e8e8' }}
                              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120'%3E%3Crect fill='%23f5f5f5' width='160' height='120'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E无预览%3C/text%3E%3C/svg%3E"
                            />
                            <div style={{ 
                              position: 'absolute', 
                              bottom: 4, 
                              left: 4, 
                              right: 4, 
                              background: 'rgba(0,0,0,0.6)', 
                              color: '#fff', 
                              padding: '2px 6px', 
                              borderRadius: 4, 
                              fontSize: 12,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {att.original_name || att.filename}
                            </div>
                          </div>
                        ))}
                      </Space>
                    </Image.PreviewGroup>
                  ) : (
                    <Empty description="暂无附件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>

                <Card 
                  title={
                    <Space>
                      <BugOutlined style={{ color: '#faad14' }} />
                      <span>设备信息</span>
                    </Space>
                  } 
                  size="small" 
                  style={{ marginBottom: 16 }}
                >
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="浏览器">
                      {data.browser_info || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="操作系统">
                      {data.os_info || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="分辨率">
                      {data.screen_resolution || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="页面URL">
                      <Text ellipsis style={{ maxWidth: 200 }}>{data.page_url || '-'}</Text>
                    </Descriptions.Item>
                  </Descriptions>
                  {data.user_agent && (
                    <>
                      <Divider style={{ margin: '12px 0' }} />
                      <div>
                        <Text strong>User-Agent：</Text>
                        <Text type="secondary" style={{ wordBreak: 'break-all', fontSize: 12 }}>
                          {data.user_agent}
                        </Text>
                      </div>
                    </>
                  )}
                </Card>

                {data.console_errors && data.console_errors.length > 0 && (
                  <Card 
                    title={
                      <Space>
                        <ConsoleSqlOutlined style={{ color: '#ff4d4f' }} />
                        <span>控制台错误</span>
                        <Tag color="red">{data.console_errors.length} 条</Tag>
                      </Space>
                    } 
                    size="small" 
                    style={{ marginBottom: 16 }}
                  >
                    <List
                      size="small"
                      dataSource={data.console_errors}
                      renderItem={(err: any, index: number) => (
                        <List.Item style={{ alignItems: 'flex-start', padding: '8px 0' }}>
                          <List.Item.Meta
                            avatar={
                              <div style={{ 
                                background: '#fff1f0', 
                                color: '#ff4d4f', 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 'bold'
                              }}>
                                {index + 1}
                              </div>
                            }
                            title={
                              <Text type="danger" strong>
                                {err.message}
                              </Text>
                            }
                            description={
                              <div>
                                {err.stack && (
                                  <Text type="secondary" style={{ fontSize: 12, display: 'block', fontFamily: 'monospace' }}>
                                    位置：{err.stack}
                                  </Text>
                                )}
                                {err.timestamp && (
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    时间：{err.timestamp}
                                  </Text>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                )}

                {data.network_errors && data.network_errors.length > 0 && (
                  <Card 
                    title={
                      <Space>
                        <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                        <span>接口请求失败</span>
                        <Tag color="orange">{data.network_errors.length} 条</Tag>
                      </Space>
                    } 
                    size="small" 
                    style={{ marginBottom: 16 }}
                  >
                    <List
                      size="small"
                      dataSource={data.network_errors}
                      renderItem={(err: any, index: number) => (
                        <List.Item style={{ alignItems: 'flex-start', padding: '8px 0' }}>
                          <List.Item.Meta
                            avatar={
                              <div style={{ 
                                background: '#fff7e6', 
                                color: '#fa8c16', 
                                width: 24, 
                                height: 24, 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 'bold'
                              }}>
                                {index + 1}
                              </div>
                            }
                            title={
                              <Space>
                                <Tag color={err.status >= 500 ? 'red' : 'orange'}>
                                  {err.method} {err.status}
                                </Tag>
                                <Text code style={{ fontFamily: 'monospace' }}>
                                  {err.url}
                                </Text>
                              </Space>
                            }
                            description={
                              err.timestamp && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  时间：{err.timestamp}
                                </Text>
                              )
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                )}
              </Col>
              <Col span={10}>
                <Card
                  title="状态流转"
                  size="small"
                  extra={
                    <Space wrap size="small">
                      {statusFlow.map((s) => (
                        <Button
                          key={s.status}
                          size="small"
                          type={data.status === s.status ? 'primary' : 'default'}
                          icon={s.icon}
                          onClick={() => handleStatusClick(s.status)}
                          disabled={data.status === s.status}
                        >
                          {s.text}
                        </Button>
                      ))}
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Timeline items={getTimelineItems()} />
                </Card>
                <Card title="添加评论" size="small">
                  <Form form={commentForm} layout="vertical" onFinish={handleAddComment}>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          name="author"
                          label="评论人"
                          rules={[{ required: true, message: '请输入评论人' }]}
                        >
                          <Input placeholder="请输入您的姓名" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item
                      name="content"
                      label="评论内容"
                      rules={[{ required: true, message: '请输入评论内容' }]}
                    >
                      <TextArea rows={3} placeholder="请输入评论内容..." />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button type="primary" htmlType="submit" loading={submitting}>
                        提交评论
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
            </Row>
          </Card>
        </>
      )}
      <Modal
        title={pendingStatus === 'supplementing' ? '向提交人索要补充信息' : '状态变更备注'}
        open={remarkModalVisible}
        onOk={handleStatusUpdate}
        onCancel={() => {
          setRemarkModalVisible(false)
          setPendingStatus(null)
        }}
        confirmLoading={submitting}
        okText={pendingStatus === 'supplementing' ? '发送通知' : '确认变更'}
        width={pendingStatus === 'supplementing' ? 650 : 580}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>将状态变更为：</Text>
          <Tag color={pendingStatus ? (statusMap[pendingStatus].color as any) : 'default'}>
            {pendingStatus ? statusMap[pendingStatus].text : ''}
          </Tag>
        </div>

        {pendingStatus === 'accepted' && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ marginBottom: 8, display: 'block' }}>受理角色：</Text>
            <Input
              placeholder="请输入受理角色，如：客服、产品、研发"
              value={acceptRole}
              onChange={(e) => setAcceptRole(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <Text strong style={{ marginBottom: 8, display: 'block', marginTop: 12 }}>分派给：</Text>
            <Input
              placeholder="请输入处理人员姓名"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              prefix={<UserOutlined />}
              style={{ marginBottom: 8 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              指定负责处理该反馈的人员，用于分派跟踪
            </Text>
          </div>
        )}

        {pendingStatus === 'supplementing' && (
          <>
            <div style={{ marginBottom: 12 }}>
              <Text strong>请选择需要提交人补充的材料：</Text>
            </div>
            <Checkbox.Group
              style={{ width: '100%', marginBottom: 16 }}
              value={supplementItemsNeeded}
              onChange={(vals) => setSupplementItemsNeeded(vals as string[])}
            >
              <Row gutter={[8, 8]}>
                {supplementItems.map((item) => (
                  <Col span={12} key={item.value}>
                    <Checkbox value={item.value}>
                      <div>
                        <Text strong>{item.label}</Text>
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.desc}
                          </Text>
                        </div>
                      </div>
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
            <Text strong style={{ marginBottom: 8, display: 'block' }}>复查记录：</Text>
            <Input
              placeholder="记录当前材料复查情况，如：截图已核对、复现步骤不完整等"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <Divider style={{ margin: '12px 0' }} />
          </>
        )}

        {pendingStatus === 'processing' && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ marginBottom: 8, display: 'block' }}>分派负责人：</Text>
            <Input
              placeholder="请输入负责人姓名"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              prefix={<UserOutlined />}
              style={{ marginBottom: 8 }}
            />
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 12, display: 'block' }}>
              指定负责处理该反馈的研发或产品人员
            </Text>
            <Text strong style={{ marginBottom: 8, display: 'block' }}>复查记录：</Text>
            <Input
              placeholder="记录材料复查情况，如：证据已核对，可复现"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
            />
          </div>
        )}

        {pendingStatus === 'fixed' && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ marginBottom: 8, display: 'block' }}>修复说明：</Text>
            <TextArea
              rows={3}
              placeholder="请简要描述修复内容、原因和解决方案"
              value={fixNote}
              onChange={(e) => setFixNote(e.target.value)}
            />
          </div>
        )}

        {pendingStatus === 'verifying' && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ marginBottom: 8, display: 'block' }}>指定验证人：</Text>
            <Input
              placeholder="请输入验证人姓名"
              value={verifier}
              onChange={(e) => setVerifier(e.target.value)}
              prefix={<UserOutlined />}
              style={{ marginBottom: 8 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              指定负责验证修复效果的测试或产品人员
            </Text>
          </div>
        )}

        {pendingStatus === 'closed' && (
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ marginBottom: 8, display: 'block' }}>关闭原因：</Text>
            <Input
              placeholder="请输入关闭原因，如：已修复、重复反馈、无法复现等"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              说明关闭该反馈的具体原因
            </Text>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <Text strong>备注说明：</Text>
        </div>
        <TextArea
          rows={4}
          placeholder={pendingStatus === 'supplementing' ? '请输入需要向提交人说明的其他内容...' : '请输入变更备注（可选）'}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        {data?.contact && (
          <div>
            <Checkbox
              checked={notifySubmitter}
              onChange={(e) => setNotifySubmitter(e.target.checked)}
            >
              通知提交人 ({data.contact})
            </Checkbox>
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
              状态变更后将通过邮件/站内信通知提交人
            </Text>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DetailPage
