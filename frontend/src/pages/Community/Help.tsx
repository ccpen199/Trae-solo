import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Select, Button, List, Tag, message, Space, Typography, Modal, Tabs, Empty } from 'antd'
import { EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined, UserOutlined, HeartOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import request from '@/utils/request'
import type { NeighborhoodHelp } from '@/types'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select
const { TabPane } = Tabs

const HelpPage: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useUserStore()
  const [helpList, setHelpList] = useState<NeighborhoodHelp[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [publishModal, setPublishModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [currentHelp, setCurrentHelp] = useState<NeighborhoodHelp | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'help' | 'offer'>('all')

  useEffect(() => {
    loadHelpList()
  }, [activeTab])

  const loadHelpList = async () => {
    setLoading(true)
    try {
      const mockData: NeighborhoodHelp[] = [
        {
          id: '1',
          userId: '1001',
          userName: '李阿姨',
          type: 'help',
          title: '求帮忙代买药品',
          description: '因为腿脚不便，无法出门，需要帮忙到附近药店代买降压药，有处方单。可以支付代购费用。',
          address: '新北区河海街道阳光花园12栋301',
          contactName: '李阿姨',
          contactPhone: '136****7890',
          status: 'pending',
          reward: '20元',
          deadline: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          createdAt: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss')
        },
        {
          id: '2',
          userId: '1002',
          userName: '王师傅',
          type: 'offer',
          title: '提供家电维修服务',
          description: '本人从事家电维修20年，可免费为小区老人提供家电维修服务，包括电视、冰箱、洗衣机等。',
          address: '武进区湖塘镇花园小区5栋202',
          contactName: '王师傅',
          contactPhone: '139****4567',
          status: 'active',
          reward: '免费',
          createdAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          helperId: '1002',
          helperName: '王师傅'
        },
        {
          id: '3',
          userId: '1003',
          userName: '张女士',
          type: 'help',
          title: '寻求临时照看小孩',
          description: '下周一下午有急事需要出门，需要帮忙照看3岁小孩2小时，有经验者优先，可付报酬。',
          address: '天宁区兰陵街道浦南小区8栋103',
          contactName: '张女士',
          contactPhone: '138****1234',
          status: 'accepted',
          reward: '50元',
          deadline: dayjs().add(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
          createdAt: dayjs().subtract(5, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          helperId: '1004',
          helperName: '陈阿姨'
        },
        {
          id: '4',
          userId: '1005',
          userName: '刘大爷',
          type: 'help',
          title: '求帮忙搬运重物',
          description: '新买了一台洗衣机，需要从楼下搬到5楼，没有电梯，求2位年轻人帮忙，每人50元。',
          address: '钟楼区南大街街道荷花池小区3栋501',
          contactName: '刘大爷',
          contactPhone: '137****8901',
          status: 'completed',
          reward: '100元',
          deadline: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          createdAt: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
          helperId: '1006',
          helperName: '小赵、小钱'
        },
        {
          id: '5',
          userId: '1007',
          userName: '周老师',
          type: 'offer',
          title: '免费提供课业辅导',
          description: '退休教师，可免费为小区内中小学生提供语文、数学课业辅导，每周六下午2小时。',
          address: '金坛区西城街道文化新村15栋402',
          contactName: '周老师',
          contactPhone: '135****2345',
          status: 'active',
          reward: '免费',
          createdAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'),
          helperId: '1007',
          helperName: '周老师'
        }
      ]

      let filtered = mockData
      if (activeTab === 'help') {
        filtered = mockData.filter(item => item.type === 'help')
      } else if (activeTab === 'offer') {
        filtered = mockData.filter(item => item.type === 'offer')
      }
      setHelpList(filtered)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (values: any) => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }

    setSubmitting(true)
    try {
      const newHelp: NeighborhoodHelp = {
        id: Date.now().toString(),
        userId: user?.id || '',
        userName: user?.name || '',
        type: values.type,
        title: values.title,
        description: values.description,
        address: values.address,
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        status: values.type === 'help' ? 'pending' : 'active',
        reward: values.reward,
        deadline: values.deadline,
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }

      setHelpList([newHelp, ...helpList])
      form.resetFields()
      setPublishModal(false)
      message.success('发布成功！')
    } catch (error) {
      message.error('发布失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAccept = async (helpId: string) => {
    if (!isLoggedIn) {
      message.warning('请先登录')
      navigate('/login')
      return
    }

    try {
      setHelpList(helpList.map(item =>
        item.id === helpId
          ? {
              ...item,
              status: 'accepted',
              helperId: user?.id,
              helperName: user?.name,
              updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
            }
          : item
      ))
      message.success('接单成功，请尽快联系求助人！')
    } catch (error) {
      message.error('操作失败，请重试')
    }
  }

  const handleComplete = async (helpId: string) => {
    try {
      setHelpList(helpList.map(item =>
        item.id === helpId
          ? {
              ...item,
              status: 'completed',
              updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
            }
          : item
      ))
      message.success('已确认完成！')
    } catch (error) {
      message.error('操作失败，请重试')
    }
  }

  const getStatusTag = (status: string, type: string) => {
    if (type === 'offer') {
      return status === 'active' ? <Tag color="success">进行中</Tag> : <Tag color="default">已结束</Tag>
    }
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'warning', text: '待接单' },
      accepted: { color: 'processing', text: '已接单' },
      completed: { color: 'success', text: '已完成' },
      cancelled: { color: 'error', text: '已取消' },
      expired: { color: 'default', text: '已过期' }
    }
    const info = statusMap[status] || statusMap.pending
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const getTypeTag = (type: string) => {
    return type === 'help'
      ? <Tag color="red"><HeartOutlined /> 求助</Tag>
      : <Tag color="green"><CheckCircleOutlined /> 帮忙</Tag>
  }

  const viewDetail = (item: NeighborhoodHelp) => {
    setCurrentHelp(item)
    setDetailModal(true)
  }

  if (!isLoggedIn) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Card>
          <Title level={4}>请先登录后使用邻里互助功能</Title>
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
            <span>邻里互助</span>
            <Text type="secondary" style={{ fontSize: 14, fontWeight: 'normal' }}>
              远亲不如近邻，互帮互助共建和谐社区
            </Text>
          </Space>
        }
        extra={
          <Button type="primary" onClick={() => setPublishModal(true)}>
            发布信息
          </Button>
        }
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={(key) => setActiveTab(key as any)}
          style={{ marginBottom: 16 }}
        >
          <TabPane tab="全部" key="all" />
          <TabPane tab="求助信息" key="help" />
          <TabPane tab="帮忙信息" key="offer" />
        </Tabs>

        <List
          loading={loading}
          dataSource={helpList}
          locale={{ emptyText: <Empty description="暂无信息" /> }}
          renderItem={(item) => (
            <List.Item 
              key={item.id} 
              className="hover-card"
              style={{ cursor: 'pointer', padding: 16, borderRadius: 8 }}
              onClick={() => viewDetail(item)}
            >
              <List.Item.Meta
                avatar={<UserOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
                title={
                  <Space style={{ marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
                    {getTypeTag(item.type)}
                    {getStatusTag(item.status, item.type)}
                    {item.reward && <Tag color="gold">{item.reward}</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 4 }}>
                      <UserOutlined style={{ marginRight: 4 }} />
                      {item.userName}
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <EnvironmentOutlined style={{ marginRight: 4 }} />
                      {item.address}
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      发布于 {item.createdAt}
                    </div>
                    <div style={{ color: '#666', marginTop: 8 }}>
                      {item.description.length > 100 
                        ? item.description.substring(0, 100) + '...' 
                        : item.description}
                    </div>
                    {item.helperName && (
                      <div style={{ marginTop: 8, color: '#52c41a' }}>
                        <CheckCircleOutlined /> 帮忙人：{item.helperName}
                      </div>
                    )}
                  </div>
                }
              />
              <div style={{ textAlign: 'right' }}>
                {item.type === 'help' && item.status === 'pending' && item.userId !== user?.id && (
                  <Button type="primary" onClick={(e) => { e.stopPropagation(); handleAccept(item.id); }}>
                    我来帮忙
                  </Button>
                )}
                {item.status === 'accepted' && (item.userId === user?.id || item.helperId === user?.id) && (
                  <Button type="primary" onClick={(e) => { e.stopPropagation(); handleComplete(item.id); }}>
                    确认完成
                  </Button>
                )}
              </div>
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="发布信息"
        open={publishModal}
        onCancel={() => setPublishModal(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePublish}
          initialValues={{
            type: 'help',
            contactName: user?.name,
            contactPhone: user?.phone
          }}
        >
          <Form.Item
            name="type"
            label="信息类型"
            rules={[{ required: true, message: '请选择信息类型' }]}
          >
            <Select>
              <Option value="help">我要求助</Option>
              <Option value="offer">我能帮忙</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请简要描述" maxLength={50} />
          </Form.Item>

          <Form.Item
            name="description"
            label="详细描述"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请详细描述具体情况" 
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="address"
            label="详细地址"
            rules={[{ required: true, message: '请输入详细地址' }]}
          >
            <Input 
              prefix={<EnvironmentOutlined />} 
              placeholder="请输入详细地址" 
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="reward"
              label="报酬"
              rules={[{ required: true, message: '请输入报酬' }]}
            >
              <Input placeholder="如：50元、免费" />
            </Form.Item>

            <Form.Item
              name="deadline"
              label="截止时间（选填）"
            >
              <Input placeholder="如：2024-01-15 18:00" />
            </Form.Item>
          </div>

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

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setPublishModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                发布
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={650}
      >
        {currentHelp && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>{currentHelp.title}</Title>
              {getTypeTag(currentHelp.type)}
              {getStatusTag(currentHelp.status, currentHelp.type)}
              {currentHelp.reward && <Tag color="gold">{currentHelp.reward}</Tag>}
            </Space>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">详细描述：</Text>
              <p style={{ marginTop: 4 }}>{currentHelp.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <Text type="secondary">发布人：</Text>
                <span>{currentHelp.userName}</span>
              </div>
              <div>
                <Text type="secondary">发布时间：</Text>
                <span>{currentHelp.createdAt}</span>
              </div>
              <div>
                <Text type="secondary">详细地址：</Text>
                <span>{currentHelp.address}</span>
              </div>
              <div>
                <Text type="secondary">联系方式：</Text>
                <span>{currentHelp.contactPhone}</span>
              </div>
              {currentHelp.deadline && (
                <div>
                  <Text type="secondary">截止时间：</Text>
                  <span>{currentHelp.deadline}</span>
                </div>
              )}
              {currentHelp.helperName && (
                <div>
                  <Text type="secondary">帮忙人：</Text>
                  <span style={{ color: '#52c41a' }}>{currentHelp.helperName}</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'right', marginTop: 24 }}>
              {currentHelp.type === 'help' && currentHelp.status === 'pending' && currentHelp.userId !== user?.id && (
                <Button type="primary" onClick={() => handleAccept(currentHelp.id)}>
                  我来帮忙
                </Button>
              )}
              {currentHelp.status === 'accepted' && (currentHelp.userId === user?.id || currentHelp.helperId === user?.id) && (
                <Button type="primary" onClick={() => handleComplete(currentHelp.id)}>
                  确认完成
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default HelpPage
