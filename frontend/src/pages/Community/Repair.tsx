import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Select, Button, List, Tag, message, Space, Typography, Modal } from 'antd'
import { EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import request from '@/utils/request'
import type { CommunityRepair } from '@/types'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

const RepairPage: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useUserStore()
  const [repairs, setRepairs] = useState<CommunityRepair[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [currentRepair, setCurrentRepair] = useState<CommunityRepair | null>(null)

  useEffect(() => {
    if (isLoggedIn) {
      loadRepairs()
    }
  }, [isLoggedIn])

  const loadRepairs = async () => {
    setLoading(true)
    try {
      const mockRepairs: CommunityRepair[] = [
        {
          id: '1',
          userId: user?.id || '',
          title: '楼道灯损坏',
          type: 'public_facility',
          description: '3单元2楼的楼道灯不亮了，晚上上下楼很不方便，存在安全隐患。',
          address: '天宁区红梅街道翠竹新村3单元2楼',
          contactName: user?.name || '张先生',
          contactPhone: user?.phone || '138****1234',
          status: 'processing',
          priority: 'high',
          createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          handler: '李师傅',
          handlerPhone: '139****5678',
          repairLogs: [
            {
              id: '1',
              repairId: '1',
              operator: '系统',
              action: 'submit',
              description: '报修已提交，等待受理',
              createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss')
            },
            {
              id: '2',
              repairId: '1',
              operator: '王管理员',
              action: 'assign',
              description: '已分派给李师傅处理',
              createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss')
            },
            {
              id: '3',
              repairId: '1',
              operator: '李师傅',
              action: 'process',
              description: '已到达现场检查，需要更换灯泡',
              createdAt: dayjs().subtract(12, 'hour').format('YYYY-MM-DD HH:mm:ss')
            }
          ]
        },
        {
          id: '2',
          userId: user?.id || '',
          title: '下水道堵塞',
          type: 'plumbing',
          description: '厨房下水道排水不畅，有异味。',
          address: '钟楼区南大街街道荷花池小区5号楼101',
          contactName: user?.name || '张先生',
          contactPhone: user?.phone || '138****1234',
          status: 'completed',
          priority: 'medium',
          createdAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss'),
          handler: '赵师傅',
          handlerPhone: '137****9012',
          repairLogs: [
            {
              id: '1',
              repairId: '2',
              operator: '系统',
              action: 'submit',
              description: '报修已提交，等待受理',
              createdAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss')
            },
            {
              id: '2',
              repairId: '2',
              operator: '刘管理员',
              action: 'assign',
              description: '已分派给赵师傅处理',
              createdAt: dayjs().subtract(5, 'day').add(2, 'hour').format('YYYY-MM-DD HH:mm:ss')
            },
            {
              id: '3',
              repairId: '2',
              operator: '赵师傅',
              action: 'process',
              description: '已疏通下水道，清理杂物',
              createdAt: dayjs().subtract(4, 'day').add(4, 'hour').format('YYYY-MM-DD HH:mm:ss')
            },
            {
              id: '4',
              repairId: '2',
              operator: '赵师傅',
              action: 'complete',
              description: '维修完成，请确认',
              createdAt: dayjs().subtract(4, 'day').format('YYYY-MM-DD HH:mm:ss')
            }
          ],
          rating: 5,
          comment: '师傅很专业，处理速度快，服务态度好！'
        }
      ]
      setRepairs(mockRepairs)
    } catch (error) {
      message.error('加载报修记录失败')
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
      const newRepair: CommunityRepair = {
        id: Date.now().toString(),
        userId: user?.id || '',
        title: values.title,
        type: values.type,
        description: values.description,
        address: values.address,
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        status: 'pending',
        priority: values.priority,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        repairLogs: [
          {
            id: '1',
            repairId: Date.now().toString(),
            operator: '系统',
            action: 'submit',
            description: '报修已提交，等待受理',
            createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
          }
        ]
      }

      setRepairs([newRepair, ...repairs])
      form.resetFields()
      message.success('报修提交成功，我们会尽快处理！')
    } catch (error) {
      message.error('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: '待受理' },
      processing: { color: 'processing', text: '处理中' },
      completed: { color: 'success', text: '已完成' },
      cancelled: { color: 'error', text: '已取消' }
    }
    const info = statusMap[status] || statusMap.pending
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const getTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      public_facility: '公共设施',
      plumbing: '水电维修',
      electrical: '电器维修',
      structural: '房屋结构',
      other: '其他'
    }
    return typeMap[type] || '其他'
  }

  const getPriorityText = (priority: string) => {
    const priorityMap: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急'
    }
    return priorityMap[priority] || '中'
  }

  const viewDetail = (repair: CommunityRepair) => {
    setCurrentRepair(repair)
    setDetailModal(true)
  }

  const handleRate = async (repairId: string, rating: number, comment: string) => {
    try {
      setRepairs(repairs.map(r => 
        r.id === repairId 
          ? { ...r, status: 'completed', rating, comment, updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') }
          : r
      ))
      message.success('评价提交成功，感谢您的反馈！')
    } catch (error) {
      message.error('评价失败，请重试')
    }
  }

  if (!isLoggedIn) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Card>
          <Title level={4}>请先登录后再提交报修</Title>
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
      <Card title="社区报修" className="card-shadow">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <Title level={4} style={{ marginTop: 0 }}>提交报修</Title>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                priority: 'medium',
                contactName: user?.name,
                contactPhone: user?.phone
              }}
            >
              <Form.Item
                name="title"
                label="报修标题"
                rules={[{ required: true, message: '请输入报修标题' }]}
              >
                <Input placeholder="请简要描述问题" maxLength={50} />
              </Form.Item>

              <Form.Item
                name="type"
                label="报修类型"
                rules={[{ required: true, message: '请选择报修类型' }]}
              >
                <Select placeholder="请选择报修类型">
                  <Option value="public_facility">公共设施损坏</Option>
                  <Option value="plumbing">水电维修</Option>
                  <Option value="electrical">电器维修</Option>
                  <Option value="structural">房屋结构问题</Option>
                  <Option value="other">其他问题</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="priority"
                label="紧急程度"
                rules={[{ required: true, message: '请选择紧急程度' }]}
              >
                <Select placeholder="请选择紧急程度">
                  <Option value="low">低</Option>
                  <Option value="medium">中</Option>
                  <Option value="high">高</Option>
                  <Option value="urgent">紧急</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="address"
                label="详细地址"
                rules={[{ required: true, message: '请输入详细地址' }]}
              >
                <Input 
                  prefix={<EnvironmentOutlined />} 
                  placeholder="请输入详细地址，如：天宁区XX街道XX小区X号楼X单元X室" 
                />
              </Form.Item>

              <Form.Item
                name="description"
                label="问题描述"
                rules={[{ required: true, message: '请描述具体问题' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="请详细描述问题情况，便于我们安排维修人员" 
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Form.Item
                  name="contactName"
                  label="联系人"
                  rules={[{ required: true, message: '请输入联系人' }]}
                >
                  <Input placeholder="请输入联系人姓名" />
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

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting}
                  style={{ width: '100%' }}
                >
                  {submitting ? '提交中...' : '提交报修'}
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div>
            <Title level={4} style={{ marginTop: 0 }}>我的报修记录</Title>
            <List
              loading={loading}
              dataSource={repairs}
              renderItem={(item) => (
                <List.Item 
                  key={item.id} 
                  className="hover-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => viewDetail(item)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Text strong>{item.title}</Text>
                        {getStatusTag(item.status)}
                        <Tag color={item.priority === 'urgent' ? 'red' : item.priority === 'high' ? 'orange' : 'blue'}>
                          {getPriorityText(item.priority)}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          <EnvironmentOutlined style={{ marginRight: 4 }} />
                          {item.address}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {item.createdAt}
                        </div>
                        {item.handler && (
                          <div>
                            <CheckCircleOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                            处理人：{item.handler}
                          </div>
                        )}
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
        title="报修详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={700}
      >
        {currentRepair && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>{currentRepair.title}</Title>
              {getStatusTag(currentRepair.status)}
              <Tag>{getTypeText(currentRepair.type)}</Tag>
            </Space>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">问题描述：</Text>
              <p>{currentRepair.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <Text type="secondary">详细地址：</Text>
                <p style={{ margin: 0 }}>{currentRepair.address}</p>
              </div>
              <div>
                <Text type="secondary">紧急程度：</Text>
                <p style={{ margin: 0 }}>{getPriorityText(currentRepair.priority)}</p>
              </div>
              <div>
                <Text type="secondary">联系人：</Text>
                <p style={{ margin: 0 }}>{currentRepair.contactName}</p>
              </div>
              <div>
                <Text type="secondary">联系电话：</Text>
                <p style={{ margin: 0 }}>{currentRepair.contactPhone}</p>
              </div>
            </div>

            {currentRepair.handler && (
              <Card size="small" title="处理信息" style={{ marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <Text type="secondary">处理人：</Text>
                    <span>{currentRepair.handler}</span>
                  </div>
                  <div>
                    <Text type="secondary">联系电话：</Text>
                    <span>{currentRepair.handlerPhone}</span>
                  </div>
                </div>
              </Card>
            )}

            <Card size="small" title="处理进度" style={{ marginBottom: 16 }}>
              <List
                size="small"
                dataSource={currentRepair.repairLogs}
                renderItem={(log) => (
                  <List.Item>
                    <List.Item.Meta
                      title={log.description}
                      description={`${log.operator} · ${log.createdAt}`}
                    />
                  </List.Item>
                )}
              />
            </Card>

            {currentRepair.status === 'completed' && !currentRepair.rating && (
              <Card size="small" title="服务评价">
                <Form
                  layout="vertical"
                  onFinish={(values) => handleRate(currentRepair.id, values.rating, values.comment)}
                >
                  <Form.Item
                    name="rating"
                    label="服务评分"
                    rules={[{ required: true, message: '请选择评分' }]}
                  >
                    <Select placeholder="请选择评分">
                      <Option value={1}>1星 - 非常不满意</Option>
                      <Option value={2}>2星 - 不满意</Option>
                      <Option value={3}>3星 - 一般</Option>
                      <Option value={4}>4星 - 满意</Option>
                      <Option value={5}>5星 - 非常满意</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item name="comment" label="评价内容">
                    <TextArea rows={3} placeholder="请输入您的评价（选填）" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit">提交评价</Button>
                  </Form.Item>
                </Form>
              </Card>
            )}

            {currentRepair.rating && (
              <Card size="small" title="我的评价">
                <div>
                  <Text>评分：{currentRepair.rating}星</Text>
                  {currentRepair.comment && (
                    <p style={{ marginTop: 8, marginBottom: 0 }}>{currentRepair.comment}</p>
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

export default RepairPage
