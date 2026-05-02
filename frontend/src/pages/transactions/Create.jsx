import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  DatePicker,
  Space,
  Row,
  Col,
  Divider,
  message,
  Alert,
} from 'antd'
import { ArrowLeftOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { transactionApi } from '../../services/api'
import { CURRENCIES } from '../../utils/constants'

const { TextArea } = Input

function TransactionCreate() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const submitData = {
        amount: values.amount,
        currency: values.currency,
        target_currency: values.target_currency,
        buyer_name: values.buyer_name,
        buyer_email: values.buyer_email,
        description: values.description,
        expected_completion_time: values.expected_completion_time?.format('YYYY-MM-DD HH:mm:ss'),
        details: values.details?.map((d, idx) => ({
          item_name: d.item_name || `项目${idx + 1}`,
          quantity: d.quantity || 1,
          unit_price: d.unit_price || d.amount || values.amount,
          amount: d.amount || values.amount,
          description: d.description,
        })),
      }

      const res = await transactionApi.create(submitData)
      if (res.data.success) {
        message.success('收款单创建成功')
        navigate('/transactions')
      }
    } catch (err) {
      console.error('Create transaction error:', err)
      message.error(err.response?.data?.error || '创建收款单失败')
    } finally {
      setLoading(false)
    }
  }

  const currencyOptions = CURRENCIES.map((c) => ({
    label: `${c.code} - ${c.name}`,
    value: c.code,
  }))

  return (
    <div>
      <div className="page-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginRight: 12 }}
        >
          返回
        </Button>
        <span className="page-title" style={{ verticalAlign: 'middle' }}>创建收款</span>
        <div className="page-desc">创建新的跨境收款单</div>
      </div>

      <Alert
        message="创建收款说明"
        description="填写收款金额、币种和买家信息。提交后将进入支付环节。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            currency: 'USD',
            target_currency: 'CNY',
          }}
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="amount"
                label="收款金额"
                rules={[
                  { required: true, message: '请输入收款金额' },
                  { type: 'number', min: 0.01, message: '金额必须大于0' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入金额"
                  min={0.01}
                  step={0.01}
                  precision={2}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="currency"
                label="源币种"
                rules={[{ required: true, message: '请选择币种' }]}
              >
                <Select placeholder="请选择币种" options={currencyOptions} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="target_currency"
                label="目标结算币种"
                rules={[{ required: true, message: '请选择目标币种' }]}
              >
                <Select placeholder="请选择目标币种" options={currencyOptions} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">买家信息</Divider>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="buyer_name" label="买家名称">
                <Input placeholder="请输入买家名称" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="buyer_email" label="买家邮箱">
                <Input placeholder="请输入买家邮箱" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="expected_completion_time" label="期望完成时间">
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder="请选择期望完成时间"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="description" label="收款描述">
                <Input placeholder="请输入收款描述" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">明细项目</Divider>

          <Form.List name="details">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Card
                    key={key}
                    size="small"
                    title={`项目 ${index + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        />
                      ) : null
                    }
                    style={{ marginBottom: 16 }}
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'item_name']}
                          label="项目名称"
                        >
                          <Input placeholder="项目名称" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label="数量"
                          initialValue={1}
                        >
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unit_price']}
                          label="单价"
                        >
                          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'amount']}
                          label="金额"
                          rules={[{ required: true, message: '请输入金额' }]}
                        >
                          <InputNumber
                            min={0.01}
                            precision={2}
                            style={{ width: '100%' }}
                            placeholder="金额"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                    添加项目
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                创建收款单
              </Button>
              <Button size="large" onClick={() => navigate('/transactions')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default TransactionCreate
