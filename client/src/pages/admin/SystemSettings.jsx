import React, { useState } from 'react'
import { Card, Form, Input, Switch, Button, Select, message, Row, Col, Divider, Tabs, Tag } from 'antd'
import {
  SaveOutlined,
  SettingOutlined,
  LockOutlined,
  BellOutlined,
  GlobalOutlined,
  DatabaseOutlined
} from '@ant-design/icons'

const { Option } = Select
const { TabPane } = Tabs

function SystemSettings() {
  const [loading, setLoading] = useState(false)
  const [siteForm] = Form.useForm()
  const [securityForm] = Form.useForm()
  const [notificationForm] = Form.useForm()

  const handleSiteSave = async (values) => {
    setLoading(true)
    try {
      message.success('网站设置保存成功！')
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSecuritySave = async (values) => {
    setLoading(true)
    try {
      message.success('安全设置保存成功！')
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationSave = async (values) => {
    setLoading(true)
    try {
      message.success('通知设置保存成功！')
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>系统设置</h2>
        <p style={{ color: '#666', marginTop: 8, marginBottom: 0 }}>
          管理平台系统配置和参数
        </p>
      </div>

      <Card>
        <Tabs defaultActiveKey="site">
          <TabPane
            tab={
              <span>
                <GlobalOutlined /> 网站设置
              </span>
            }
            key="site"
          >
            <Form
              form={siteForm}
              layout="vertical"
              onFinish={handleSiteSave}
              initialValues={{
                siteName: '在线课程学习平台',
                siteDescription: '专注于在线教育的B2C学习平台',
                siteKeywords: '在线教育,课程学习,视频课程,作业批改',
                contactEmail: 'support@learning.com',
                contactPhone: '400-888-8888',
                registrationEnabled: true,
                enableSearch: true,
                language: 'zh-CN'
              }}
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="siteName"
                    label="网站名称"
                    rules={[{ required: true, message: '请输入网站名称' }]}
                  >
                    <Input placeholder="请输入网站名称" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="language"
                    label="默认语言"
                  >
                    <Select>
                      <Option value="zh-CN">简体中文</Option>
                      <Option value="en-US">English</Option>
                      <Option value="ja-JP">日本語</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="siteDescription"
                label="网站描述"
              >
                <Input.TextArea rows={3} placeholder="请输入网站描述" />
              </Form.Item>

              <Form.Item
                name="siteKeywords"
                label="网站关键词"
                help="多个关键词用逗号分隔"
              >
                <Input placeholder="例如：在线教育,课程学习,视频课程" />
              </Form.Item>

              <Divider />

              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="contactEmail"
                    label="联系邮箱"
                    rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
                  >
                    <Input placeholder="请输入联系邮箱" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="contactPhone"
                    label="联系电话"
                  >
                    <Input placeholder="请输入联系电话" />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Form.Item
                name="registrationEnabled"
                label="用户注册"
                valuePropName="checked"
                help="开启后，新用户可以自行注册账号"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Form.Item
                name="enableSearch"
                label="全站搜索"
                valuePropName="checked"
                help="开启后，用户可以在全站范围内搜索课程"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <LockOutlined /> 安全设置
              </span>
            }
            key="security"
          >
            <Form
              form={securityForm}
              layout="vertical"
              onFinish={handleSecuritySave}
              initialValues={{
                sessionTimeout: 30,
                maxLoginAttempts: 5,
                lockDuration: 30,
                passwordMinLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSymbols: false,
                enableTwoFactor: false,
                emailVerification: true,
                ipWhitelistEnabled: false,
                concurrentLoginLimit: 2
              }}
            >
              <h4 style={{ marginBottom: 16 }}>会话管理</h4>
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="sessionTimeout"
                    label="会话超时（分钟）"
                    help="用户无操作多久后自动登出"
                  >
                    <Input.Number min={5} max={480} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="concurrentLoginLimit"
                    label="并发登录限制"
                    help="同一账号允许同时登录的设备数（0表示不限制）"
                  >
                    <Input.Number min={0} max={10} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <h4 style={{ marginBottom: 16 }}>登录防护</h4>
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="maxLoginAttempts"
                    label="最大登录尝试次数"
                    help="连续失败多少次后锁定账号"
                  >
                    <Input.Number min={1} max={20} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="lockDuration"
                    label="锁定时长（分钟）"
                    help="账号被锁定的时长"
                  >
                    <Input.Number min={1} max={1440} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <h4 style={{ marginBottom: 16 }}>密码策略</h4>
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="passwordMinLength"
                    label="最小密码长度"
                  >
                    <Input.Number min={6} max={32} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="enableTwoFactor"
                    label="双因素认证"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="requireUppercase"
                label="需要大写字母"
                valuePropName="checked"
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>

              <Form.Item
                name="requireLowercase"
                label="需要小写字母"
                valuePropName="checked"
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>

              <Form.Item
                name="requireNumbers"
                label="需要数字"
                valuePropName="checked"
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>

              <Form.Item
                name="requireSymbols"
                label="需要特殊符号"
                valuePropName="checked"
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>

              <Divider />

              <h4 style={{ marginBottom: 16 }}>其他设置</h4>
              <Form.Item
                name="emailVerification"
                label="邮箱验证"
                valuePropName="checked"
                help="新用户注册时需要验证邮箱"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Form.Item
                name="ipWhitelistEnabled"
                label="IP白名单"
                valuePropName="checked"
                help="仅允许白名单IP访问后台管理"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane
            tab={
              <span>
                <BellOutlined /> 通知设置
              </span>
            }
            key="notification"
          >
            <Form
              form={notificationForm}
              layout="vertical"
              onFinish={handleNotificationSave}
              initialValues={{
                emailNotifications: {
                  orderSuccess: true,
                  courseStart: true,
                  assignmentDeadline: true,
                  courseCompletion: true,
                  certificateIssue: true,
                  commentReply: true
                },
                smsNotifications: {
                  orderSuccess: false,
                  assignmentDeadline: false
                },
                platformNotifications: {
                  courseStart: true,
                  assignmentDeadline: true,
                  commentReply: true
                }
              }}
            >
              <h4 style={{ marginBottom: 16 }}>邮件通知</h4>
              <Form.Item
                name={['emailNotifications', 'orderSuccess']}
                label="订单成功通知"
                valuePropName="checked"
                help="用户购买课程成功后发送邮件"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Form.Item
                name={['emailNotifications', 'courseStart']}
                label="课程开课提醒"
                valuePropName="checked"
                help="课程即将开始时发送提醒"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Form.Item
                name={['emailNotifications', 'assignmentDeadline']}
                label="作业截止提醒"
                valuePropName="checked"
                help="作业截止前发送提醒"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Form.Item
                name={['emailNotifications', 'courseCompletion']}
                label="课程完成祝贺"
                valuePropName="checked"
                help="学员完成课程后发送祝贺邮件"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Form.Item
                name={['emailNotifications', 'certificateIssue']}
                label="证书颁发通知"
                valuePropName="checked"
                help="证书颁发时发送邮件"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Form.Item
                name={['emailNotifications', 'commentReply']}
                label="评论回复通知"
                valuePropName="checked"
                help="收到评论回复时发送通知"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Divider />

              <h4 style={{ marginBottom: 16 }}>短信通知</h4>
              <Form.Item
                name={['smsNotifications', 'orderSuccess']}
                label="订单成功通知"
                valuePropName="checked"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Form.Item
                name={['smsNotifications', 'assignmentDeadline']}
                label="作业截止提醒"
                valuePropName="checked"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Divider />

              <h4 style={{ marginBottom: 16 }}>站内消息</h4>
              <Form.Item
                name={['platformNotifications', 'courseStart']}
                label="课程开课提醒"
                valuePropName="checked"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Form.Item
                name={['platformNotifications', 'assignmentDeadline']}
                label="作业截止提醒"
                valuePropName="checked"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Form.Item
                name={['platformNotifications', 'commentReply']}
                label="评论回复通知"
                valuePropName="checked"
              >
                <Switch checkedChildren="开启" unCheckedChildren="关闭" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default SystemSettings
