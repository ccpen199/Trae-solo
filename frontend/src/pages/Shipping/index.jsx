import React, { useState, useEffect } from 'react'
import { Card, Form, Input, InputNumber, Select, Button, Row, Col, Steps, Descriptions, message, Divider, Tabs, List, Tag } from 'antd'
import { CalculatorOutlined, SendOutlined, ClockCircleOutlined, SafetyCertificateOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { calculatePrice, createOrder, schedulePickup, getServiceTypes } from '../../api/shipping'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

const { Step } = Steps
const { Option } = Select
const { TextArea } = Input

function Shipping() {
  const [currentStep, setCurrentStep] = useState(0)
  const [priceData, setPriceData] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serviceTypes, setServiceTypes] = useState([])
  const [orderResult, setOrderResult] = useState(null)
  const navigate = useNavigate()

  const [form] = Form.useForm()

  useEffect(() => {
    fetchServiceTypes()
  }, [])

  const fetchServiceTypes = async () => {
    try {
      const result = await getServiceTypes()
      setServiceTypes(Array.isArray(result) ? result : [])
    } catch (error) {
      console.error('Fetch service types error:', error)
    }
  }

  const handleCalculate = async () => {
    try {
      const values = await form.validateFields(['weight', 'length', 'width', 'height', 'fromCity', 'toCity', 'serviceType', 'timeline', 'insuredValue'])
      
      setCalculating(true)
      const result = await calculatePrice({
        weight: values.weight,
        volume: values.length * values.width * values.height / 1000000,
        from_city: values.fromCity,
        to_city: values.toCity,
        service_type: values.serviceType,
        timeline: values.timeline,
        insured_value: values.insuredValue || 0,
      })
      
      setPriceData(result)
      message.success('价格计算完成')
    } catch (error) {
      if (error.errorFields) return
      message.error('价格计算失败')
    } finally {
      setCalculating(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 0 && !priceData) {
      message.warning('请先计算价格')
      return
    }
    setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      setSubmitting(true)
      const orderData = {
        ...values,
        price: priceData?.total_price || 0,
      }
      
      const result = await createOrder(orderData)
      setOrderResult(result)
      setCurrentStep(2)
      message.success('订单提交成功！')
    } catch (error) {
      if (error.errorFields) return
      message.error('订单提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSchedulePickup = async (values) => {
    try {
      if (!orderResult?.order_id) return
      await schedulePickup(orderResult.order_id, values)
      message.success('揽收预约成功！')
    } catch (error) {
      message.error('预约失败')
    }
  }

  const stepItems = [
    { title: '价格计算', icon: <CalculatorOutlined /> },
    { title: '填写订单', icon: <SendOutlined /> },
    { title: '完成', icon: <SafetyCertificateOutlined /> },
  ]

  const priceCalcForm = (
    <Card title="阶梯报价计算器">
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="weight"
              label="重量 (kg)"
              rules={[{ required: true, message: '请输入重量' }]}
            >
              <InputNumber min={0.1} step={0.1} style={{ width: '100%' }} placeholder="请输入重量" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="serviceType"
              label="服务类型"
              rules={[{ required: true, message: '请选择服务类型' }]}
            >
              <Select placeholder="请选择服务类型">
                {serviceTypes.map(type => (
                  <Option key={type.code} value={type.code}>
                    {type.name} - {type.description}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">尺寸信息 (cm)</Divider>
        <Row gutter={16}>
          <Col xs={8}>
            <Form.Item
              name="length"
              label="长"
              rules={[{ required: true, message: '请输入长度' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="长" />
            </Form.Item>
          </Col>
          <Col xs={8}>
            <Form.Item
              name="width"
              label="宽"
              rules={[{ required: true, message: '请输入宽度' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="宽" />
            </Form.Item>
          </Col>
          <Col xs={8}>
            <Form.Item
              name="height"
              label="高"
              rules={[{ required: true, message: '请输入高度' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="高" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">地址信息</Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="fromCity"
              label="寄件城市"
              rules={[{ required: true, message: '请输入寄件城市' }]}
            >
              <Input placeholder="请输入寄件城市" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="toCity"
              label="收件城市"
              rules={[{ required: true, message: '请输入收件城市' }]}
            >
              <Input placeholder="请输入收件城市" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="timeline"
              label="时效要求"
              rules={[{ required: true, message: '请选择时效' }]}
            >
              <Select placeholder="请选择时效">
                <Option value="standard">标准快递（3-5天）</Option>
                <Option value="fast">快速（2-3天）</Option>
                <Option value="next_day">次日达</Option>
                <Option value="same_day">当日达</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="insuredValue"
              label="保价金额 (元)"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入保价金额" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button
            type="primary"
            icon={<CalculatorOutlined />}
            loading={calculating}
            onClick={handleCalculate}
            size="large"
          >
            计算价格
          </Button>
        </Form.Item>
      </Form>

      {priceData && (
        <Card style={{ marginTop: 24, background: '#fafafa' }}>
          <div className="price-display">
            ¥ {priceData.total_price?.toFixed(2) || '0.00'}
          </div>
          <div className="price-breakdown">
            <List
              size="small"
              dataSource={[
                { label: '基础运费', value: priceData.base_price || 0 },
                { label: '重量附加费', value: priceData.weight_fee || 0 },
                { label: '体积附加费', value: priceData.volume_fee || 0 },
                { label: '时效附加费', value: priceData.timeline_fee || 0 },
                { label: '保价费', value: priceData.insurance_fee || 0 },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <span>{item.label}</span>
                  <span>¥ {item.value.toFixed(2)}</span>
                </List.Item>
              )}
            />
          </div>
        </Card>
      )}
    </Card>
  )

  const orderForm = (
    <Card title="填写订单信息">
      <Form form={form} layout="vertical">
        <Divider orientation="left">寄件人信息</Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="senderName"
              label="寄件人姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="senderPhone"
              label="寄件人电话"
              rules={[{ required: true, message: '请输入电话' }]}
            >
              <Input placeholder="请输入电话" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="senderAddress"
          label="寄件人详细地址"
          rules={[{ required: true, message: '请输入详细地址' }]}
        >
          <TextArea rows={2} placeholder="请输入详细地址" />
        </Form.Item>

        <Divider orientation="left">收件人信息</Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="receiverName"
              label="收件人姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="receiverPhone"
              label="收件人电话"
              rules={[{ required: true, message: '请输入电话' }]}
            >
              <Input placeholder="请输入电话" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="receiverAddress"
          label="收件人详细地址"
          rules={[{ required: true, message: '请输入详细地址' }]}
        >
          <TextArea rows={2} placeholder="请输入详细地址" />
        </Form.Item>

        <Divider orientation="left">物品信息</Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="itemDescription"
              label="物品描述"
              rules={[{ required: true, message: '请输入物品描述' }]}
            >
              <Input placeholder="如：衣物、电子产品等" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="itemQuantity"
              label="件数"
              rules={[{ required: true, message: '请输入件数' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="件数" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="remark"
          label="备注"
        >
          <TextArea rows={2} placeholder="其他需要说明的信息" />
        </Form.Item>

        <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="预估运费">
            <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 18 }}>
              ¥ {priceData?.total_price?.toFixed(2) || '0.00'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="预计送达">
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {priceData?.estimated_delivery 
              ? dayjs(priceData.estimated_delivery).format('YYYY-MM-DD')
              : '---'}
          </Descriptions.Item>
        </Descriptions>
      </Form>
    </Card>
  )

  const completePage = (
    <Card>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <SafetyCertificateOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
        <h3 style={{ marginBottom: 8 }}>订单提交成功！</h3>
        <p style={{ color: 'rgba(0,0,0,0.65)', marginBottom: 24 }}>
          运单号：{orderResult?.tracking_no || 'SF1234567890'}
        </p>
        
        <Descriptions bordered column={1} style={{ maxWidth: 400, margin: '0 auto 24px' }}>
          <Descriptions.Item label="订单金额">
            ¥ {orderResult?.price?.toFixed(2) || priceData?.total_price?.toFixed(2) || '0.00'}
          </Descriptions.Item>
          <Descriptions.Item label="预计送达">
            {orderResult?.estimated_delivery 
              ? dayjs(orderResult.estimated_delivery).format('YYYY-MM-DD')
              : '---'}
          </Descriptions.Item>
          <Descriptions.Item label="服务类型">
            {serviceTypes.find(t => t.code === form.getFieldValue('serviceType'))?.name || '标准快递'}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button onClick={() => navigate('/shipping')}>
            继续寄件
          </Button>
          <Button type="primary" onClick={() => navigate(`/trace/${orderResult?.tracking_no || 'SF1234567890'}`)}>
            查看物流 <ArrowRightOutlined />
          </Button>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>寄件服务</h2>
        <Button onClick={() => navigate('/shipping/large')}>
          大件寄送通道
        </Button>
      </div>

      <Steps current={currentStep} items={stepItems} style={{ marginBottom: 24 }} />

      {currentStep === 0 && priceCalcForm}
      {currentStep === 1 && orderForm}
      {currentStep === 2 && completePage}

      {currentStep < 2 && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: currentStep > 0 ? 'space-between' : 'flex-end' }}>
          {currentStep > 0 && (
            <Button onClick={handlePrev}>
              上一步
            </Button>
          )}
          {currentStep === 0 && (
            <Button type="primary" onClick={handleNext} disabled={!priceData}>
              下一步 <ArrowRightOutlined />
            </Button>
          )}
          {currentStep === 1 && (
            <Button type="primary" onClick={handleSubmit} loading={submitting}>
              提交订单
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default Shipping
