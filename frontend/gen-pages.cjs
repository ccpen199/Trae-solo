const fs = require('fs');
const path = require('path');

const basePath = './src';

const files = {
  'index.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}

.ant-layout {
  min-height: 100vh;
}

.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-title {
  text-align: center;
  margin-bottom: 32px;
}

.login-title h1 {
  font-size: 24px;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.login-title p {
  color: #666;
  font-size: 14px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1a1a2e;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.status-tag {
  font-weight: 500;
}

.detail-card {
  margin-bottom: 24px;
}

.detail-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.detail-value {
  color: #1a1a2e;
  font-size: 16px;
  font-weight: 500;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section {
  background: #fafafa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.form-section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-card .stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.stat-card .stat-label {
  color: #666;
  font-size: 14px;
}

.chart-container {
  width: 100%;
  height: 400px;
}

@media (max-width: 768px) {
  .login-card {
    width: 90%;
    padding: 24px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
`,

  'pages/patient-family/ServiceList.jsx': `import React, { useState, useEffect } from 'react'
import { Card, Button, Tag, Row, Col, Spin, message, Input, Select } from 'antd'
import { ShoppingCartOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import request from '../../utils/request'
import { RISK_LEVEL_LABELS, RISK_LEVEL_COLORS, SERVICE_CATEGORIES } from '../../utils/constants'

const { Search } = Input
const { Option } = Select

const ServiceList = () => {
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState([])
  const [filteredServices, setFilteredServices] = useState([])
  const [searchText, setSearchText] = useState('')
  const [category, setCategory] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    let filtered = services
    if (searchText) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchText.toLowerCase()) ||
        s.description.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    if (category) {
      filtered = filtered.filter(s => s.category === category)
    }
    setFilteredServices(filtered)
  }, [searchText, category, services])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const data = await request.get('/services')
      setServices(data.list || data || [])
      setFilteredServices(data.list || data || [])
    } catch (error) {
      message.error('获取服务列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOrder = (service) => {
    navigate('/order/create', { state: { service } })
  }

  return (
    <div>
      <div className="page-header">
        <h2>服务项目</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select placeholder="选择分类" style={{ width: 150 }} allowClear onChange={setCategory}>
            {SERVICE_CATEGORIES.map(cat => (
              <Option key={cat.value} value={cat.value}>{cat.label}</Option>
            ))}
          </Select>
          <Search placeholder="搜索服务" allowClear style={{ width: 250 }} prefix={<SearchOutlined />} onSearch={setSearchText} onChange={(e) => setSearchText(e.target.value)} />
        </div>
      </div>
      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          {filteredServices.map((service) => (
            <Col xs={24} sm={12} lg={8} key={service.id}>
              <Card
                hoverable
                cover={<div style={{ height: 160, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 48 }}>{service.name?.charAt(0) || '服'}</div>}
                actions={[
                  <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => handleOrder(service)} block>立即下单</Button>
                ]}
              >
                <Card.Meta
                  title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{service.name}</span><Tag color={RISK_LEVEL_COLORS[service.risk_level]}>{RISK_LEVEL_LABELS[service.risk_level]}</Tag></div>}
                  description={<div><p style={{ color: '#666', marginBottom: 8 }}>{service.description}</p><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>时长: {service.duration}分钟</span><span style={{ color: '#f5222d', fontWeight: 'bold', fontSize: 18 }}>¥{service.price}</span></div></div>}
                />
              </Card>
            </Col>
          ))}
        </Row>
        {!loading && filteredServices.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>暂无服务项目</div>
        )}
      </Spin>
    </div>
  )
}

export default ServiceList
`,

  'pages/patient-family/OrderCreate.jsx': `import React, { useState } from 'react'
import { Form, Input, Button, DatePicker, InputNumber, message, Card, Steps } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import request from '../../utils/request'

const { TextArea } = Input
const { Step } = Steps

const OrderCreate = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const selectedService = location.state?.service

  const steps = [
    { title: '服务信息' },
    { title: '患者信息' },
    { title: '确认下单' }
  ]

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const orderData = {
        ...values,
        service_id: selectedService?.id,
        scheduled_at: values.scheduled_at?.toISOString()
      }
      await request.post('/orders', orderData)
      message.success('订单提交成功，等待审核')
      navigate('/orders')
    } catch (error) {
      message.error('下单失败')
    } finally {
      setLoading(false)
    }
  }

  const next = () => setCurrent(current + 1)
  const prev = () => setCurrent(current - 1)

  return (
    <div>
      <div className="page-header">
        <h2>创建订单</h2>
      </div>
      
      <Card className="detail-card">
        <Steps current={current} style={{ marginBottom: 32 }}>
          {steps.map((step) => (
            <Step key={step.title} title={step.title} />
          ))}
        </Steps>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          {current === 0 && (
            <div className="form-section">
              <h3 className="form-section-title">服务信息</h3>
              {selectedService && (
                <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                  <p><strong>已选服务：</strong>{selectedService.name}</p>
                  <p><strong>服务价格：</strong>¥{selectedService.price}</p>
                  <p><strong>服务时长：</strong>{selectedService.duration}分钟</p>
                </Card>
              )}
              <Form.Item name="scheduled_at" label="期望服务时间" rules={[{ required: true, message: '请选择服务时间' }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="medical_order" label="医嘱信息">
                <TextArea rows={4} placeholder="请上传医嘱或填写相关医疗信息" />
              </Form.Item>
            </div>
          )}

          {current === 1 && (
            <div className="form-section">
              <h3 className="form-section-title">患者与联系人信息</h3>
              <Form.Item name="patient_name" label="患者姓名" rules={[{ required: true, message: '请输入患者姓名' }]}>
                <Input placeholder="请输入患者姓名" />
              </Form.Item>
              <Form.Item name="patient_age" label="患者年龄" rules={[{ required: true, message: '请输入患者年龄' }]}>
                <InputNumber min={0} max={150} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="patient_gender" label="患者性别" rules={[{ required: true, message: '请选择性别' }]}>
                <Select placeholder="请选择性别">
                  <Option value="male">男</Option>
                  <Option value="female">女</Option>
                </Select>
              </Form.Item>
              <Form.Item name="address" label="服务地址" rules={[{ required: true, message: '请输入服务地址' }]}>
                <TextArea rows={3} placeholder="请输入详细地址" />
              </Form.Item>
              <Form.Item name="condition_description" label="病情描述" rules={[{ required: true, message: '请描述病情' }]}>
                <TextArea rows={4} placeholder="请简要描述患者病情和护理需求" />
              </Form.Item>
              <Form.Item name="contact_name" label="紧急联系人姓名" rules={[{ required: true, message: '请输入联系人姓名' }]}>
                <Input placeholder="请输入紧急联系人姓名" />
              </Form.Item>
              <Form.Item name="contact_phone" label="紧急联系人电话" rules={[{ required: true, message: '请输入联系电话' }, { pattern: /^1[3-9]\\d{9}$/, message: '请输入正确的手机号' }]}>
                <Input placeholder="请输入紧急联系人电话" />
              </Form.Item>
            </div>
          )}

          {current === 2 && (
            <div className="form-section">
              <h3 className="form-section-title">确认订单信息</h3>
              <Form.Item noStyle shouldUpdate>
                {() => {
                  const values = form.getFieldsValue()
                  return (
                    <Card size="small">
                      <p><strong>服务项目：</strong>{selectedService?.name}</p>
                      <p><strong>服务时间：</strong>{values.scheduled_at?.format('YYYY-MM-DD HH:mm')}</p>
                      <p><strong>患者姓名：</strong>{values.patient_name}</p>
                      <p><strong>患者年龄：</strong>{values.patient_age}岁</p>
                      <p><strong>服务地址：</strong>{values.address}</p>
                      <p><strong>紧急联系人：</strong>{values.contact_name} ({values.contact_phone})</p>
                    </Card>
                  )
                }}
              </Form.Item>
              <Form.Item name="agreement" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('请同意服务协议')) }]}>
                <Checkbox>我已阅读并同意《服务协议》和《隐私政策》</Checkbox>
              </Form.Item>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            {current > 0 && <Button onClick={prev}>上一步</Button>}
            <div>
              {current < steps.length - 1 && <Button type="primary" onClick={next}>下一步</Button>}
              {current === steps.length - 1 && <Button type="primary" htmlType="submit" loading={loading}>提交订单</Button>}
            </div>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default OrderCreate
`
};

for (const [fileName, content] of Object.entries(files)) {
  const filePath = path.join(basePath, fileName);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Created:', filePath);
}

console.log('Pages created successfully!');
