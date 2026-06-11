import React, { useState, useEffect } from 'react'
import { 
  Card, Form, Input, Select, Button, List, Tag, message, Space, Typography, 
  Modal, Tabs, Empty, Rate, Timeline, Descriptions, Upload
} from 'antd'
import { 
  EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined, UserOutlined, 
  SendOutlined, CheckCircleOutlined, FileTextOutlined, UploadOutlined,
  MessageOutlined, ExclamationCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import request from '@/utils/request'
import type { Feedback, FeedbackLog } from '@/types'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

const FeedbackPage: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useUserStore()
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [currentFeedback, setCurrentFeedback] = useState<Feedback | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processing' | 'completed'>('all')

  useEffect(() => {
    if (isLoggedIn) {
      loadFeedbackList()
    }
  }, [isLoggedIn, activeTab])

  const loadFeedbackList = async () => {
    setLoading(true)
    try {
      const mockData: Feedback[] = [
        {
          id: 'FB20240101001',
          userId: user?.id || '',
          title: '关于翠竹公园健身设施增设的建议',
          type: 'suggestion',
          category: 'urban_construction',
          description: '翠竹公园目前健身器材较少，建议在公园东南角增设一些中老年健身设施，方便周边居民锻炼。',
          address: '天宁区翠竹公园',
          contactName: user?.name || '张先生',
          contactPhone: user?.phone || '138****1234',
          status: 'processing',
          priority: 'medium',
          isAnonymous: false,
          createdAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
          handler: '市园林局 王科长',
          handlerPhone: '12345',
          logs: [
            {
              id: '1',
              feedbackId: 'FB20240101001',
              operator: '系统',
              action: 'submit',
              description: '反馈已提交成功，我们将尽快处理',
              createdAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss')
            },
            {
              id: '2',
              feedbackId: 'FB20240101001',
              operator: '平台管理员',
              action: 'assign',
              description: '已分派至市园林局处理',
              createdAt: dayjs().subtract(4, 'day').add(8, 'hour').format('YYYY-MM-DD HH:mm:ss')
            },
            {
              id: '3',
              feedbackId: 'FB20240101001',
              operator: '市园林局 王科长',
              action: 'process',
              description: '已收悉您的建议，我们正在进行现场勘察和规划设计，预计30个工作日内给出具体方案。',
              createdAt: dayjs().subtract(2, 'day').add(14, 'hour').format('YYYY-MM-DD HH:mm:ss')
            }
          ]
        },
        {
          id: 'FB20240101002',
          userId: user?.id || '',
          title: '新北区河海路非机动车道破损问题',
          type: 'complaint',
          category: 'transportation',
          description: '新北区河海路与通江大道交叉口东侧，非机动车道有多处破损，存在安全隐患，希望尽快修复。',
          address: '新北区河海路与通江大道交叉口',
          contactName: user?.name || '张先生',
          contactPhone: user?.phone || '138****1234',
          status: 'completed',
          priority: 'high',
          isAnonymous: false,
          createdAt: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
          handler: '市住建局 李工',
          handlerPhone: '12345',
          logs: [
            {
              id: '1',
              feedbackId: 'FB20240101002',
              operator: '系统',
              action: 'submit',
              description: '反馈已提交成功，我们将尽快处理',
              createdAt: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss')
            },
            {
              id: '2',
              feedbackId: 'FB20240101002',
              operator: '平台管理员',
              action: 'assign',
              description: '已分派至市住建局处理',
              createdAt: dayjs().subtract(10, 'day').add(6, 'hour').format('YYYY-MM-DD HH:mm:ss')
            },
            {
              id: '3',
              feedbackId: 'FB20240101002',
              operator: '市住建局 李工',
              action: 'process',
              description: '已安排工作人员现场核查，确有破损情况，已列入本周维修计划。',
              createdAt: dayjs().subtract(8, 'day').add(10, 'hour').format('YYYY-MM-DD HH:mm:ss')
            },
            {
              id: '4',
              feedbackId: 'FB20240101002',
              operator: '市住建局 李工',
              action: 'reply',
              description: '该路段非机动车道破损已于昨日修复完成，请您查看。感谢您对城市建设的关心！',
              createdAt: dayjs().subtract(3, 'day').add(15, 'hour').format('YYYY-MM-DD HH:mm:ss')
            }
          ],
          rating: 5,
          comment: '处理速度快，修复质量好，非常满意！'
        },
        {
          id: 'FB20240101003',
          userId: user?.id || '',
          title: '咨询灵活就业人员社保补贴政策',
          type: 'consultation',
          category: 'social_security',
          description: '我是一名灵活就业人员，想咨询一下今年的社保补贴政策，需要满足什么条件，如何申请？',
          address: '',
          contactName: user?.name || '张先生',
          contactPhone: user?.phone || '138****1234',
          status: 'completed',
          priority: 'low',
          isAnonymous: false,
          createdAt: dayjs().subtract(15, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(14, 'day').format('YYYY-MM-DD HH:mm:ss'),
          handler: '市人社局 张小姐',
          handlerPhone: '12345',
          logs: [
            {
              id: '1',
              feedbackId: 'FB20240101003',
              operator: '系统',
              action: 'submit',
              description: '反馈已提交成功，我们将尽快处理',
              createdAt: dayjs().subtract(15, 'day').format('YYYY-MM-DD HH:mm:ss')
            },
            {
              id: '2',
              feedbackId: 'FB20240101003',
              operator: '平台管理员',
              action: 'assign',
              description: '已分派至市人社局处理',
              createdAt: dayjs().subtract(15, 'day').add(4, 'hour').format('YYYY-MM-DD HH:mm:ss')
            },
            {
              id: '3',
              feedbackId: 'FB20240101003',
              operator: '市人社局 张小姐',
              action: 'reply',
              description: '您好！灵活就业人员社保补贴申请条件：1. 具有常州市户籍；2. 以灵活就业形式缴纳社会保险；3. 女性年满40周岁、男性年满50周岁的就业困难人员。申请材料：身份证、户口簿、就业失业登记证、社保缴费凭证。您可携带材料到户籍所在地社区服务中心办理，或通过\"我的常州\"APP在线申请。如有疑问，可拨打12333咨询。',
              createdAt: dayjs().subtract(14, 'day').add(9, 'hour').format('YYYY-MM-DD HH:mm:ss')
            }
          ],
          rating: 5,
          comment: '回复详细专业，解决了我的疑问，非常感谢！'
        }
      ]

      let filtered = mockData
      if (activeTab !== 'all') {
        filtered = mockData.filter(item => item.status === activeTab)
      }
      setFeedbackList(filtered)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: any) => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }

    setSubmitting(true)
    try {
      const newFeedback: Feedback = {
        id: `FB${dayjs().format('YYYYMMDD')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        userId: user?.id || '',
        title: values.title,
        type: values.type,
        category: values.category,
        description: values.description,
        address: values.address,
        contactName: values.isAnonymous ? '匿名用户' : values.contactName,
        contactPhone: values.isAnonymous ? '' : values.contactPhone,
        status: 'pending',
        priority: 'medium',
        isAnonymous: values.isAnonymous,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        logs: [
          {
            id: '1',
            feedbackId: '',
            operator: '系统',
            action: 'submit',
            description: '反馈已提交成功，我们将尽快处理',
            createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
          }
        ]
      }
      newFeedback.logs[0].feedbackId = newFeedback.id

      setFeedbackList([newFeedback, ...feedbackList])
      form.resetFields()
      message.success('反馈提交成功！我们会尽快处理，请耐心等待。')
    } catch (error) {
      message.error('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRate = async (feedbackId: string, rating: number, comment: string) => {
    try {
      setFeedbackList(feedbackList.map(item =>
        item.id === feedbackId
          ? { ...item, rating, comment, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') }
          : item
      ))
      setDetailModal(false)
      message.success('评价提交成功，感谢您的反馈！')
    } catch (error) {
      message.error('评价失败，请重试')
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'warning', text: '待受理' },
      processing: { color: 'processing', text: '处理中' },
      completed: { color: 'success', text: '已办结' },
      cancelled: { color: 'error', text: '已取消' }
    }
    const info = statusMap[status] || statusMap.pending
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      complaint: { color: 'red', text: '投诉' },
      suggestion: { color: 'blue', text: '建议' },
      consultation: { color: 'purple', text: '咨询' },
      praise: { color: 'green', text: '表扬' },
      other: { color: 'default', text: '其他' }
    }
    const info = typeMap[type] || typeMap.other
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const getCategoryText = (category: string) => {
    const categoryMap: Record<string, string> = {
      urban_construction: '城市建设',
      transportation: '交通运输',
      environmental: '环境保护',
      social_security: '社会保障',
      education: '教育文化',
      medical: '医疗卫生',
      market_regulation: '市场监管',
      public_security: '公共安全',
      other: '其他'
    }
    return categoryMap[category] || '其他'
  }

  const getActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      submit: '提交反馈',
      assign: '分派处理',
      process: '处理中',
      reply: '回复反馈',
      complete: '办结',
      cancel: '取消'
    }
    return actionMap[action] || action
  }

  const viewDetail = (item: Feedback) => {
    setCurrentFeedback(item)
    setDetailModal(true)
  }

  if (!isLoggedIn) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Card>
          <Title level={4}>请先登录后提交反馈</Title>
          <Space>
            <Button type="primary" onClick={() => navigate('/login')}>去登录</Button>
            <Button onClick={() => navigate('/')}>返回首页</Button>
          </Space>
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Card 
        className="card-shadow"
        title={
          <Space>
            <MessageOutlined />
            <span>市民反馈</span>
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
              您的声音，我们倾听；您的诉求，我们回应
            </Text>
          </Space>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>
          <div>
            <Card 
              size="small" 
              title={
                <Space>
                  <SendOutlined />
                  <span>提交反馈</span>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                  type: 'suggestion',
                  category: 'urban_construction',
                  isAnonymous: false,
                  contactName: user?.name,
                  contactPhone: user?.phone
                }}
              >
                <Form.Item
                  name="type"
                  label="反馈类型"
                  rules={[{ required: true, message: '请选择反馈类型' }]}
                >
                  <Select>
                    <Option value="complaint">投诉</Option>
                    <Option value="suggestion">建议</Option>
                    <Option value="consultation">咨询</Option>
                    <Option value="praise">表扬</Option>
                    <Option value="other">其他</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="category"
                  label="问题分类"
                  rules={[{ required: true, message: '请选择问题分类' }]}
                >
                  <Select>
                    <Option value="urban_construction">城市建设</Option>
                    <Option value="transportation">交通运输</Option>
                    <Option value="environmental">环境保护</Option>
                    <Option value="social_security">社会保障</Option>
                    <Option value="education">教育文化</Option>
                    <Option value="medical">医疗卫生</Option>
                    <Option value="market_regulation">市场监管</Option>
                    <Option value="public_security">公共安全</Option>
                    <Option value="other">其他</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="title"
                  label="标题"
                  rules={[{ required: true, message: '请输入标题' }]}
                >
                  <Input placeholder="请简要描述问题" maxLength={100} />
                </Form.Item>

                <Form.Item
                  name="description"
                  label="详细描述"
                  rules={[{ required: true, message: '请输入详细描述' }]}
                >
                  <TextArea 
                    rows={5} 
                    placeholder="请详细描述具体情况，以便我们更好地处理" 
                    maxLength={1000}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  name="address"
                  label="相关地址（选填）"
                >
                  <Input 
                    prefix={<EnvironmentOutlined />} 
                    placeholder="请输入具体地址" 
                  />
                </Form.Item>

                <Form.Item
                  name="isAnonymous"
                  valuePropName="checked"
                >
                  <Select>
                    <Option value={false}>实名提交</Option>
                    <Option value={true}>匿名提交</Option>
                  </Select>
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Form.Item
                    name="contactName"
                    label="联系人"
                    rules={[{ required: true, message: '请输入联系人' }]}
                  >
                    <Input placeholder="请输入联系人" />
                  </Form.Item>
                  <Form.Item
                    name="contactPhone"
                    label="联系电话"
                    rules={[
                      { required: true, message: '请输入联系电话' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                    ]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
                  </Form.Item>
                </div>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={submitting}
                    icon={<SendOutlined />}
                    style={{ width: '100%' }}
                  >
                    提交反馈
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            <Card size="small" title="办理时限说明">
              <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
                <p style={{ margin: 0 }}><ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 4 }} />
                  <strong>承诺办结时限：</strong></p>
                <ul style={{ paddingLeft: 20, margin: '4px 0' }}>
                  <li>咨询类：3个工作日内答复</li>
                  <li>建议类：5个工作日内答复</li>
                  <li>投诉类：7-15个工作日内处理</li>
                  <li>紧急事项：24小时内响应</li>
                </ul>
                <p style={{ margin: 0 }}>服务热线：<Text type="primary">12345</Text></p>
              </div>
            </Card>
          </div>

          <div>
            <Tabs 
              activeKey={activeTab} 
              onChange={(key) => setActiveTab(key as any)}
              style={{ marginBottom: 16 }}
            >
              <TabPane tab="全部" key="all" />
              <TabPane tab="待受理" key="pending" />
              <TabPane tab="处理中" key="processing" />
              <TabPane tab="已办结" key="completed" />
            </Tabs>

            <List
              loading={loading}
              dataSource={feedbackList}
              locale={{ emptyText: <Empty description="暂无反馈记录" /> }}
              renderItem={(item) => (
                <List.Item 
                  key={item.id} 
                  className="hover-card"
                  style={{ cursor: 'pointer', padding: 16, borderRadius: 8, marginBottom: 12, border: '1px solid #f0f0f0' }}
                  onClick={() => viewDetail(item)}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: 28, color: '#1890ff' }} />}
                    title={
                      <Space style={{ marginBottom: 8 }}>
                        <Text strong>{item.title}</Text>
                        {getTypeTag(item.type)}
                        {getStatusTag(item.status)}
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          <Text type="secondary">单号：</Text>
                          <Text code>{item.id}</Text>
                          <Text type="secondary" style={{ marginLeft: 12 }}>分类：</Text>
                          {getCategoryText(item.category)}
                        </div>
                        <div style={{ marginBottom: 4, color: '#666' }}>
                          {item.description.length > 80 
                            ? item.description.substring(0, 80) + '...' 
                            : item.description}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <ClockCircleOutlined style={{ marginRight: 4 }} />
                            {item.createdAt}
                          </div>
                          {item.rating && (
                            <div style={{ color: '#faad14' }}>
                              <Rate disabled value={item.rating} style={{ fontSize: 12 }} />
                            </div>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      </Card>

      <Modal
        title="反馈详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={800}
      >
        {currentFeedback && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>{currentFeedback.title}</Title>
              {getTypeTag(currentFeedback.type)}
              {getStatusTag(currentFeedback.status)}
            </Space>

            <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="反馈单号">{currentFeedback.id}</Descriptions.Item>
              <Descriptions.Item label="问题分类">{getCategoryText(currentFeedback.category)}</Descriptions.Item>
              <Descriptions.Item label="提交时间">{currentFeedback.createdAt}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{currentFeedback.updatedAt}</Descriptions.Item>
              {currentFeedback.address && (
                <Descriptions.Item label="相关地址" span={2}>{currentFeedback.address}</Descriptions.Item>
              )}
              {currentFeedback.handler && (
                <Descriptions.Item label="处理人">{currentFeedback.handler}</Descriptions.Item>
              )}
              {currentFeedback.contactName && (
                <Descriptions.Item label="联系人">{currentFeedback.contactName}</Descriptions.Item>
              )}
            </Descriptions>

            <Card size="small" title="反馈内容" style={{ marginBottom: 16 }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{currentFeedback.description}</p>
            </Card>

            <Card size="small" title="处理进度" style={{ marginBottom: 16 }}>
              <Timeline
                items={currentFeedback.logs?.map((log: FeedbackLog) => ({
                  color: log.action === 'reply' || log.action === 'complete' ? 'success' : 
                         log.action === 'assign' ? 'blue' : 
                         log.action === 'process' ? 'processing' : 'default',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>{getActionText(log.action)}</div>
                      <div style={{ color: '#666', fontSize: 13 }}>{log.description}</div>
                      <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                        {log.operator} · {log.createdAt}
                      </div>
                    </div>
                  )
                })) || []}
              />
            </Card>

            {currentFeedback.status === 'completed' && !currentFeedback.rating && (
              <Card size="small" title="服务评价">
                <Form
                  layout="vertical"
                  onFinish={(values) => handleRate(currentFeedback.id, values.rating, values.comment)}
                >
                  <Form.Item
                    name="rating"
                    label="请对本次服务进行评分"
                    rules={[{ required: true, message: '请选择评分' }]}
                  >
                    <Rate />
                  </Form.Item>
                  <Form.Item name="comment" label="评价内容（选填）">
                    <TextArea rows={3} placeholder="请输入您的评价" />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit">提交评价</Button>
                  </Form.Item>
                </Form>
              </Card>
            )}

            {currentFeedback.rating && (
              <Card size="small" title="我的评价">
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Text>评分：</Text>
                    <Rate disabled value={currentFeedback.rating} />
                  </div>
                  {currentFeedback.comment && (
                    <p style={{ margin: 0 }}>{currentFeedback.comment}</p>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default FeedbackPage
