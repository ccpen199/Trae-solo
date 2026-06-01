import React, { useState, useEffect } from 'react'
import { Card, Form, Input, InputNumber, Select, Button, Row, Col, Steps, Descriptions, message, Divider, Alert, List } from 'antd'
import { TruckOutlined, SafetyCertificateOutlined, CalculatorOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { calculatePrice, createLargeItemOrder, getLargeItemServices } from '../../api/shipping'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

const { Step } = Steps
const { Option } = Select
const { TextArea } = Input

function LargeItem() {
  const [currentStep, setCurrentStep] = useState(0)
  const [priceData, setPriceData] = useState(null)
  const [calculating, setCalculating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [services, setServices] = useState([])
  const [orderResult, setOrderResult] = useState(null)
  const navigate = useNavigate()

  const [form] = Form.useForm()

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const result = await getLargeItemServices()
      setServices(Array.isArray(result) ? result : [])
    } catch (error) {
      console.error('Fetch large item services error:', error)
    }
  }

  const handleCalculate = async () => {
    try {
      const values = await form.validateFields(['weight', 'length', 'width', 'height', 'fromCity', 'toCity', 'serviceType', 'hasElevator', 'floor'])
      
      setCalculating(true)
      const result = await calculatePrice({
        weight: values.weight,
        volume: values.length * values.width * values.height / 1000000,
        from_city: values.fromCity,
        to_city: values.toCity,
        service_type: values.serviceType,
        is_large: true,
        has_elevator: values.hasElevator,
        floor: values.floor,
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
        is_large: true,
      }
      
      const result = await createLargeItemOrder(orderData)
      setOrderResult(result)
      setCurrentStep(2)
      message.success('大件寄送订单提交成功！')
    } catch (error) {
      if (error.errorFields) return
      message.error('订单提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const stepItems = [
    { title: '服务选择', icon: <TruckOutlined /> },
    { title: '价格计算', icon: <CalculatorOutlined /> },
    { title: '填写订单', icon: <SafetyCertificateOutlined /> },
    { title: '完成', icon: <SafetyCertificateOutlined /> },
  ]

  const serviceSelectPage = (
    <Card title="大件寄送服务">
      <Alert
        message="大件物品寄送"
        description="针对家具、家电等大件物品提供的专业寄送服务，包含上门搬运、专业包装、送货上门等增值服务"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <List
        grid={{ gutter: 16, xs: 1, md: 2, lg: 3 }}
        dataSource={services.length > 0 ? services : [
          { code: 'standard', name: '标准大件', description: '经济型大件寄送，3-7天送达', price: '150元起' },
          { code: 'premium', name: '尊享大件', description: '优先处理，2-4天送达，含保价', price: '280元起' },
          { code: 'white_glove', name: '白手套服务', description: '上门拆装、包装、摆放就位', price: '500元起' },
        ]}
        renderItem={(item) => (
          <List.Item>
            <Card
              hoverable
              className="station-card"
              onClick={() => {
                form.setFieldsValue({ serviceType: item.code })
                handleNext()
              }}
            >
              <Card.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{item.name}</span>
                    <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{item.price}</span>
                  </div>
                }
                description={item.description}
              />
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {item.features?.map((feature, idx) => (
                  <span key={idx} style={{ fontSize: 12, color: '#1890ff', background: '#e6f7ff', padding: '2px 8px', borderRadius: 4 }}>
                    {feature}
                  </span>
                ))}
                {!item.features && (
                  <>
                    <span style={{ fontSize: 12, color: '#1890ff', background: '#e6f7ff', padding: '2px 8px', borderRadius: 4 }}>上门取件</span>
                    <span style={{ fontSize: 12, color: '#1890ff', background: '#e6f7ff', padding: '2px 8px', borderRadius: 4 }}>专业包装</span>
                    <span style={{ fontSize: 12, color: '#1890ff', background: '#e6f7ff', padding: '2px 8px', borderRadius: 4 }}>送货上门</span>
                  </>
                )}
              </div>
            </Card>
          </List.Item>
        )}
      />

      <Form form={form} style={{ display: 'none' }}>
        <Form.Item name="serviceType" />
      </Form>
    </Card>
  )

  const priceCalcPage = (
    <Card title="大件物品信息">
      <Form form={form} layout="vertical">
        <Alert
          message="大件物品说明"
          description="单件重量超过30kg或单边长度超过150cm视为大件物品"
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="weight"
              label="重量 (kg)"
              rules={[{ required: true, message: '请输入重量' }]}
            >
              <InputNumber min={30} step={1} style={{ width: '100%' }} placeholder="请输入重量" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="itemType"
              label="物品类型"
              rules={[{ required: true, message: '请选择物品类型' }]}
            >
              <Select placeholder="请选择物品类型">
                <Option value="furniture">家具</Option>
                <Option value="appliance">家电</Option>
                <Option value="exercise">健身器材</Option>
                <Option value="musical">乐器</Option>
                <Option value="other">其他大件</Option>
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

        <Divider orientation="left">搬运信息</Divider>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="hasElevator"
              label="是否有电梯"
              rules={[{ required: true, message: '请选择' }]}
            >
              <Select>
                <Option value={true}>有电梯</Option>
                <Option value={false}>无电梯</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="floor"
              label="楼层"
              rules={[{ required: true, message: '请输入楼层' }]}
            >
              <InputNumber min={1} max={60} style={{ width: '100%' }} placeholder="楼层" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="needDisassembly"
              label="是否需要拆装"
              rules={[{ required: true, message: '请选择' }]}
            >
              <Select>
                <Option value={true}>需要拆装</Option>
                <Option value={false}>不需要</Option>
              </Select>
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
                { label: '大件附加费', value: priceData.large_item_fee || 0 },
                { label: '搬运费', value: priceData.handling_fee || 0 },
                { label: '拆装费', value: priceData.disassembly_fee || 0 },
                { label: '保险费', value: priceData.insurance_fee || 0 },
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

  const orderFormPage = (
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

        <Divider orientation="left">预约上门</Divider>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="pickupDate"
              label="预约日期"
              rules={[{ required: true, message: '请选择日期' }]}
            >
              <Input type="date" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="pickupTime"
              label="时间段"
              rules={[{ required: true, message: '请选择时间段' }]}
            >
              <Select placeholder="请选择时间段">
                <Option value="morning">上午 09:00-12:00</Option>
                <Option value="afternoon">下午 14:00-18:00</Option>
                <Option value="evening">晚间 18:00-21:00</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="specialInstructions"
          label="特殊说明"
        >
          <TextArea rows={3} placeholder="如有特殊要求请在此说明，如物品需要轻放、需要多人搬运等" />
        </Form.Item>

        <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="预估运费">
            <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 18 }}>
              ¥ {priceData?.total_price?.toFixed(2) || '0.00'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="预计送达">
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
        <h3 style={{ marginBottom: 8 }}>大件寄送订单提交成功！</h3>
        <p style={{ color: 'rgba(0,0,0,0.65)', marginBottom: 24 }}>
          我们将安排专业人员上门处理
        </p>
        <p style={{ marginBottom: 16 }}>
          运单号：<strong>{orderResult?.tracking_no || 'LF1234567890'}</strong>
        </p>
        
        <Descriptions bordered column={1} style={{ maxWidth: 400, margin: '0 auto 24px' }}>
          <Descriptions.Item label="订单金额">
            ¥ {orderResult?.price?.toFixed(2) || priceData?.total_price?.toFixed(2) || '0.00'}
          </Descriptions.Item>
          <Descriptions.Item label="预约上门时间">
            {form.getFieldValue('pickupDate')} {form.getFieldValue('pickupTime') === 'morning' ? '上午' : form.getFieldValue('pickupTime') === 'afternoon' ? '下午' : '晚间'}
          </Descriptions.Item>
          <Descriptions.Item label="服务人员将在上门前联系您">
            请保持电话畅通
          </Descriptions.Item>
        </Descriptions>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button onClick={() => navigate('/dashboard')}>
            返回首页
          </Button>
          <Button type="primary" onClick={() => navigate(`/trace/${orderResult?.tracking_no || 'LF1234567890'}`)}>
            查看物流
          </Button>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/shipping')}
            style={{ marginRight: 16 }}
          />
          大件寄送
        </h2>
      </div>

      <Steps current={currentStep} items={stepItems} style={{ marginBottom: 24 }} />

      {currentStep === 0 && serviceSelectPage}
      {currentStep === 1 && priceCalcPage}
      {currentStep === 2 && orderFormPage}
      {currentStep === 3 && completePage}

      {currentStep < 3 && (
        <div style={{ marginTop: 24, display: 'flex', justifyContent: currentStep > 0 ? 'space-between' : 'flex-end' }}>
          {currentStep > 0 && (
            <Button onClick={handlePrev}>
              上一步
            </Button>
          )}
          {currentStep === 0 && (
            <Button type="primary" disabled={!form.getFieldValue('serviceType')}>
              下一步 <ArrowRightOutlined />
            </Button>
          )}
          {currentStep === 1 && (
            <Button type="primary" onClick={handleNext} disabled={!priceData}>
              下一步 <ArrowRightOutlined />
            </Button>
          )}
          {currentStep === 2 && (
            <Button type="primary" onClick={handleSubmit} loading={submitting}>
              提交订单
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default LargeItem
