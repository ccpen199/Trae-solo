import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, List, Tag, message, Tabs, Select, Switch, Empty, Modal, Form, Input, Radio, Progress, Alert, Space, Statistic, Timeline, Badge } from 'antd'
import {
  FireOutlined,
  ThunderboltOutlined,
  CarOutlined,
  LineChartOutlined,
  PoweroffOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  BellOutlined,
  WarningOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import api from '../utils/api'
import dayjs from 'dayjs'

const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

const Services = () => {
  const [localServices, setLocalServices] = useState([])
  const [regionInfo, setRegionInfo] = useState({})
  const [outagePlans, setOutagePlans] = useState([])
  const [warnings, setWarnings] = useState([])
  const [user, setUser] = useState(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [businessEnvReports, setBusinessEnvReports] = useState([])
  const [activeTab, setActiveTab] = useState('local')
  const [applyModalVisible, setApplyModalVisible] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [applyLoading, setApplyLoading] = useState(false)
  const [reportModalVisible, setReportModalVisible] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [reportForm] = Form.useForm()

  const serviceIcons = {
    subsidy: <FireOutlined style={{ fontSize: 36, color: '#fa8c16' }} />,
    pv_application: <ThunderboltOutlined style={{ fontSize: 36, color: '#52c41a' }} />,
    charging_pile: <CarOutlined style={{ fontSize: 36, color: '#1890ff' }} />,
    energy_diagnosis: <LineChartOutlined style={{ fontSize: 36, color: '#722ed1' }} />,
    capacity_expansion: <ThunderboltOutlined style={{ fontSize: 36, color: '#eb2f96' }} />
  }

  const getCategoryLabel = (category) => {
    const labels = {
      subsidy: { text: '补贴申领', color: 'orange' },
      grid: { text: '电网服务', color: 'blue' },
      service: { text: '增值服务', color: 'purple' }
    }
    return labels[category] || { text: '其他', color: 'default' }
  }

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchLocalServices()
    fetchOutagePlans()
    fetchWarnings()
    fetchSubscriptionStatus()
    fetchBusinessEnvReports()
  }, [])

  const fetchLocalServices = async () => {
    try {
      const data = await api.get('/services/local')
      setLocalServices(data.services || [])
      setRegionInfo({
        user_region: data.user_region,
        region_services_count: data.region_services_count,
        total_services_count: data.total_services_count
      })
    } catch (error) {
      console.error('获取属地服务失败', error)
    }
  }

  const fetchOutagePlans = async () => {
    try {
      const data = await api.get('/services/outage-plans')
      setOutagePlans(data)
    } catch (error) {
      console.error('获取停电计划失败', error)
    }
  }

  const fetchWarnings = async () => {
    try {
      const data = await api.get('/services/warnings')
      setWarnings(data)
    } catch (error) {
      console.error('获取预警信息失败', error)
    }
  }

  const fetchSubscriptionStatus = async () => {
    try {
      const data = await api.get('/services/subscriptions/status')
      setSubscriptionStatus(data)
    } catch (error) {
      console.error('获取订阅状态失败', error)
    }
  }

  const fetchBusinessEnvReports = async () => {
    try {
      const data = await api.get('/services/business-env/reports')
      setBusinessEnvReports(data.reports || [])
    } catch (error) {
      console.error('获取营商环境报告失败', error)
    }
  }

  const handleSubscribe = async (checked) => {
    try {
      await api.post('/services/outage-subscribe', {
        province: user?.province,
        city: user?.city,
        district: user?.district
      })
      message.success(checked ? '停电订阅已启用' : '停电订阅已取消')
      setSubscriptionStatus(prev => ({ ...prev, outage_subscribed: checked }))
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/services/warnings/${id}/read`)
      setWarnings(warnings.map(w => w.id === id ? { ...w, is_read: 1 } : w))
    } catch (error) {
      console.error('标记已读失败', error)
    }
  }

  const handleApplyService = (service) => {
    setSelectedService(service)
    setApplyModalVisible(true)
  }

  const handleSubmitApplication = async () => {
    setApplyLoading(true)
    try {
      message.success('申请已提交，预计 ' + (selectedService.process_days || 7) + ' 个工作日内处理')
      setApplyModalVisible(false)
    } catch (error) {
      message.error('提交失败')
    } finally {
      setApplyLoading(false)
    }
  }

  const handleOpenReport = (report) => {
    setSelectedReport(report)
    setReportModalVisible(true)
  }

  const handleSubmitReport = async (values) => {
    try {
      const data = await api.post('/services/business-env/submit', {
        report_id: selectedReport.id,
        answers: values
      })
      message.success(`报送成功，获得 ${data.points_earned} 积分`)
      setReportModalVisible(false)
      reportForm.resetFields()
      fetchBusinessEnvReports()
    } catch (error) {
      message.error('报送失败')
    }
  }

  const unreadWarnings = warnings.filter(w => !w.is_read).length

  return (
    <div style={{ padding: 24 }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        <TabPane tab="属地化服务" key="local">
          <Alert
            message={
              <Space>
                <EnvironmentOutlined />
                <span>当前定位地区：<b>{regionInfo.user_region || '北京市'}</b></span>
                <Tag color="green">已开通 {regionInfo.region_services_count || 0} 项属地服务</Tag>
                <span style={{ fontSize: 12, color: '#999' }}>
                  （共 {regionInfo.total_services_count || 0} 项，部分服务仅特定地区可用）
                </span>
              </Space>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Row gutter={[16, 16]}>
            {localServices.map(service => {
              const category = getCategoryLabel(service.category)
              return (
                <Col xs={24} sm={12} lg={8} key={service.id}>
                  <Card
                    hoverable
                    onClick={() => handleApplyService(service)}
                    actions={[
                      <Button type="link" key="apply" onClick={(e) => { e.stopPropagation(); handleApplyService(service) }}>
                        立即办理
                      </Button>
                    ]}
                  >
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 8 }}>
                        {serviceIcons[service.icon] || <LineChartOutlined style={{ fontSize: 36, color: '#999' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 'bold', fontSize: 16 }}>{service.name}</span>
                          <Tag color={category.color}>{category.text}</Tag>
                        </div>
                        <p style={{ fontSize: 12, color: '#666', margin: '4px 0' }}>{service.description}</p>
                        <Space style={{ fontSize: 12, color: '#999' }}>
                          <span><ClockCircleOutlined /> 办理周期：{service.process_days}工作日</span>
                          {service.max_amount && (
                            <span><TrophyOutlined /> 最高补贴：¥{service.max_amount}</span>
                          )}
                        </Space>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#fa8c16' }}>
                          📋 申请条件：{service.requirement}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              )
            })}
          </Row>
        </TabPane>

        <TabPane tab={
          <span>
            停电计划
            {subscriptionStatus?.outage_subscribed && <Badge status="success" style={{ marginLeft: 8 }} />}
          </span>
        } key="outage">
          <Card
            title="停电订阅管理"
            extra={
              <Space>
                <span>停电通知推送</span>
                <Switch
                  checked={subscriptionStatus?.outage_subscribed || false}
                  onChange={handleSubscribe}
                />
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message={subscriptionStatus?.outage_subscribed
                  ? '已开启停电计划订阅，所属地区计划停电将通过短信和APP推送通知'
                  : '未开启订阅，开启后可及时获取所属地区停电信息'}
                type={subscriptionStatus?.outage_subscribed ? 'success' : 'warning'}
                showIcon
                icon={<BellOutlined />}
              />
              {subscriptionStatus?.subscription_info && (
                <div style={{ fontSize: 12, color: '#666' }}>
                  订阅地区：{subscriptionStatus.subscription_info.province} {subscriptionStatus.subscription_info.city} {subscriptionStatus.subscription_info.district}
                </div>
              )}
            </Space>
          </Card>

          <Card title="近期停电计划">
            {outagePlans.length === 0 ? (
              <Empty description="近期无计划停电" />
            ) : (
              <List
                dataSource={outagePlans}
                renderItem={plan => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<PoweroffOutlined style={{ fontSize: 24, color: '#fa8c16' }} />}
                      title={
                        <Space>
                          <span>{plan.district} - {plan.location}</span>
                          <Tag color="orange">{plan.type}</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <span>停电时间：{dayjs(plan.start_time).format('YYYY-MM-DD HH:mm')} ~ {dayjs(plan.end_time).format('HH:mm')}</span>
                          <span style={{ fontSize: 12, color: '#999' }}>影响范围：{plan.scope}</span>
                        </Space>
                      }
                    />
                    <Space>
                      <Button size="small" type="link">查看详情</Button>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab={
          <span>
            用电预警
            {unreadWarnings > 0 && <Badge count={unreadWarnings} style={{ marginLeft: 8 }} />}
          </span>
        } key="warnings">
          <Card
            title="预警设置"
            extra={
              <Space>
                <span>异常用电监测</span>
                <Switch checked={subscriptionStatus?.warning_enabled || false} />
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="预警记录总数"
                  value={warnings.length}
                  valueStyle={{ color: '#fa8c16' }}
                  prefix={<WarningOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="未处理预警"
                  value={unreadWarnings}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="最近检查"
                  value={subscriptionStatus?.last_warning_check ? dayjs(subscriptionStatus.last_warning_check).format('MM-DD HH:mm') : '-'}
                  valueStyle={{ color: '#52c41a', fontSize: 16 }}
                />
              </Col>
            </Row>
          </Card>

          <Card title="预警记录">
            {warnings.length === 0 ? (
              <Empty description="暂无预警记录" />
            ) : (
              <List
                dataSource={warnings}
                renderItem={warning => (
                  <List.Item
                    style={{ opacity: warning.is_read ? 0.6 : 1 }}
                    actions={[
                      !warning.is_read && (
                        <Button size="small" type="link" onClick={() => handleMarkRead(warning.id)}>
                          标记已读
                        </Button>
                      )
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<WarningOutlined style={{ fontSize: 24, color: warning.level === 'high' ? '#ff4d4f' : '#faad14' }} />}
                      title={
                        <Space>
                          <span style={{ fontWeight: 500 }}>{warning.title}</span>
                          <Tag color={warning.level === 'high' ? 'red' : 'orange'}>
                            {warning.level === 'high' ? '高风险' : '中风险'}
                          </Tag>
                          {!warning.is_read && <Badge status="processing" />}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <span>{warning.message}</span>
                          <span style={{ fontSize: 12, color: '#999' }}>
                            {dayjs(warning.created_at).format('YYYY-MM-DD HH:mm')}
                          </span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab="营商环境报送" key="business">
          <Card
            title="报送概览"
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="待报送"
                  value={businessEnvReports.filter(r => r.status === 'not_submitted').length}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="已报送"
                  value={businessEnvReports.filter(r => r.status === 'submitted').length}
                  valueStyle={{ color: '#52c41a' }}
                  suffix={`/ ${businessEnvReports.length}`}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="完成率"
                  value={businessEnvReports.length > 0
                    ? Math.round((businessEnvReports.filter(r => r.status === 'submitted').length / businessEnvReports.length) * 100)
                    : 0}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
                <Progress
                  percent={businessEnvReports.length > 0
                    ? Math.round((businessEnvReports.filter(r => r.status === 'submitted').length / businessEnvReports.length) * 100)
                    : 0}
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Col>
            </Row>
          </Card>

          <Card title="报送列表">
            <Timeline>
              {businessEnvReports.map(report => (
                <Timeline.Item
                  key={report.id}
                  color={report.status === 'submitted' ? 'green' : 'blue'}
                  dot={report.status === 'submitted' ? <CheckCircleOutlined style={{ fontSize: 16 }} /> : <FileTextOutlined />}
                >
                  <Card
                    size="small"
                    title={
                      <Space>
                        <span style={{ fontWeight: 500 }}>{report.report_type}</span>
                        <Tag color={report.status === 'submitted' ? 'green' : 'blue'}>
                          {report.status === 'submitted' ? '已报送' : '待报送'}
                        </Tag>
                        <Tag color="purple">{report.period}</Tag>
                      </Space>
                    }
                    extra={
                      report.status === 'not_submitted' ? (
                        <Button type="primary" size="small" onClick={() => handleOpenReport(report)}>
                          立即报送
                        </Button>
                      ) : (
                        <Button size="small" type="link">查看记录</Button>
                      )
                    }
                  >
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <span>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        报送截止：{report.deadline}
                        {report.status === 'not_submitted' && (
                          <span style={{ color: '#fa8c16', marginLeft: 8 }}>
                            （还有 {dayjs(report.deadline).diff(dayjs(), 'day')} 天）
                          </span>
                        )}
                      </span>
                      {report.submitted_at && (
                        <span style={{ color: '#52c41a' }}>
                          <CheckCircleOutlined style={{ marginRight: 4 }} />
                          报送时间：{report.submitted_at}
                        </span>
                      )}
                    </Space>
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="服务申请"
        open={applyModalVisible}
        onCancel={() => setApplyModalVisible(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setApplyModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" loading={applyLoading} onClick={handleSubmitApplication}>
            提交申请
          </Button>
        ]}
      >
        {selectedService && (
          <div>
            <Alert
              message={selectedService.name}
              description={selectedService.description}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="服务类型">{getCategoryLabel(selectedService.category).text}</Descriptions.Item>
              <Descriptions.Item label="办理周期">{selectedService.process_days} 工作日</Descriptions.Item>
              <Descriptions.Item label="申请条件" span={2}>{selectedService.requirement}</Descriptions.Item>
              {selectedService.max_amount && (
                <Descriptions.Item label="最高补贴" span={2}>¥{selectedService.max_amount}</Descriptions.Item>
              )}
            </Descriptions>
            <Form layout="vertical">
              <Form.Item label="联系人" required>
                <Input placeholder="请输入联系人姓名" defaultValue={user?.name} />
              </Form.Item>
              <Form.Item label="联系电话" required>
                <Input placeholder="请输入联系电话" defaultValue={user?.phone} />
              </Form.Item>
              <Form.Item label="申请说明">
                <TextArea rows={3} placeholder="请简要说明申请事由" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="营商环境报送"
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        width={700}
        footer={null}
      >
        {selectedReport && (
          <div>
            <Alert
              message={selectedReport.report_type}
              description={`报送周期：${selectedReport.period}`}
              type="info"
              showIcon
              icon={<SafetyCertificateOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Form
              form={reportForm}
              layout="vertical"
              onFinish={handleSubmitReport}
            >
              <Form.Item
                label="1. 您对当前获得电力服务的整体满意度如何？"
                name="q1"
                rules={[{ required: true, message: '请选择' }]}
              >
                <Radio.Group>
                  <Radio value="5">非常满意</Radio>
                  <Radio value="4">满意</Radio>
                  <Radio value="3">一般</Radio>
                  <Radio value="2">不满意</Radio>
                  <Radio value="1">非常不满意</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="2. 您认为办理用电业务的便捷程度如何？"
                name="q2"
                rules={[{ required: true, message: '请选择' }]}
              >
                <Radio.Group>
                  <Radio value="5">非常便捷</Radio>
                  <Radio value="4">比较便捷</Radio>
                  <Radio value="3">一般</Radio>
                  <Radio value="2">不太便捷</Radio>
                  <Radio value="1">非常繁琐</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="3. 您对供电可靠性的满意度如何？"
                name="q3"
                rules={[{ required: true, message: '请选择' }]}
              >
                <Radio.Group>
                  <Radio value="5">非常满意</Radio>
                  <Radio value="4">满意</Radio>
                  <Radio value="3">一般</Radio>
                  <Radio value="2">不满意</Radio>
                  <Radio value="1">非常不满意</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                label="4. 其他意见或建议"
                name="feedback"
              >
                <TextArea rows={4} placeholder="请输入您的宝贵意见" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  提交报送
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Services
