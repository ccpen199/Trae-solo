import React, { useState } from 'react'
import { Form, Input, Button, DatePicker, InputNumber, message, Card, Steps, Select, Checkbox } from 'antd'
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
              <Form.Item name="contact_phone" label="紧急联系人电话" rules={[{ required: true, message: '请输入联系电话' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }]}>
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
