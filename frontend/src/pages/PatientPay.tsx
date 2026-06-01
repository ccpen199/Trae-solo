import React, { useState, useEffect } from 'react'
import { Card, Button, message, Space, Typography, Tag, Divider, QRCode, Statistic, Steps, Spin, Avatar, Radio, Descriptions } from 'antd'
import { CheckCircleOutlined, QrcodeOutlined, DollarOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { invoiceAPI } from '../api'

const { Title, Text } = Typography

const PatientPay: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<any>(null)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)
  const [payMethod, setPayMethod] = useState('wechat')

  useEffect(() => {
    loadInvoice()
  }, [id])

  const loadInvoice = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await invoiceAPI.get(Number(id))
      setInvoice(res.data)
    } catch (error) {
      message.error('收费单不存在')
    } finally {
      setLoading(false)
    }
  }

  const handleMockPay = async (method: string) => {
    if (!invoice) return
    setPaying(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const remaining = invoice.total_amount - invoice.discount - invoice.paid_amount
      const methodName = method === 'wechat' ? '微信支付' : method === 'alipay' ? '支付宝' : '银行卡'
      await invoiceAPI.pay(invoice.id, {
        amount: remaining,
        payment_method: method,
        transaction_no: `${method.toUpperCase()}${Date.now()}`,
        notes: `患者通过${methodName}完成支付`
      })
      setPaid(true)
      message.success('支付成功！')
      loadInvoice()
    } catch (error: any) {
      message.error(error.response?.data?.error || '支付失败')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>加载中...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Title level={4} type="danger">收费单不存在</Title>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </div>
    )
  }

  const remaining = invoice.total_amount - invoice.discount - invoice.paid_amount
  const isPaid = invoice.status === 'paid' || invoice.status === 'refunded' || remaining <= 0

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', minHeight: '100vh', background: '#f5f5f5', paddingBottom: 40 }}>
      <div style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', padding: '24px 20px', color: '#fff', textAlign: 'center' }}>
        <Title level={4} style={{ color: '#fff', margin: 0 }}>🦷 牙科诊所</Title>
        <Text style={{ color: 'rgba(255,255,255,0.8)' }}>患者支付平台</Text>
      </div>
      <div style={{ padding: '0 16px', marginTop: -20 }}>
      <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Avatar size={64} style={{ background: '#e6f7ff', marginBottom: 12 }}>
            <UserOutlined style={{ color: '#1890ff', fontSize: 32 }} />
          </Avatar>
          <Title level={4} style={{ marginBottom: 4 }}>{invoice.patient_name}</Title>
          <Text type="secondary">订单号：{invoice.id}</Text>
        </div>

        <Steps
          direction="vertical"
          size="small"
          current={paid || isPaid ? 2 : 1}
          style={{ marginBottom: 24 }}
        >
          <Steps.Step title="生成订单" icon={<ClockCircleOutlined />} />
          <Steps.Step title="等待支付" icon={<QrcodeOutlined />} />
          <Steps.Step title="支付完成" icon={<CheckCircleOutlined />} />
        </Steps>

        <Divider />

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Statistic
            title="应付金额"
            value={remaining}
            prefix="¥"
            valueStyle={{ color: '#ff4d4f', fontSize: 36 }}
          />
          {invoice.discount > 0 && (
            <Text type="secondary" delete>原价 ¥{invoice.total_amount}</Text>
          )}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Text strong>患者：{invoice.patient_name}</Text>
          <br />
          <Text type="secondary">{invoice.patient_phone}</Text>
        </div>

        {!isPaid && !paid ? (
          <>
            <Divider>选择支付方式</Divider>
            <Radio.Group
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              style={{ width: '100%', marginBottom: 24 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="wechat" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e8e8e8', borderRadius: 8, marginBottom: 8 }}>
                  <Space>
                    <span style={{ fontSize: 20, color: '#07c160' }}>💚</span>
                    <span><strong>微信支付</strong></span>
                  </Space>
                </Radio>
                <Radio value="alipay" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e8e8e8', borderRadius: 8, marginBottom: 8 }}>
                  <Space>
                    <span style={{ fontSize: 20, color: '#1677ff' }}>💙</span>
                    <span><strong>支付宝</strong></span>
                  </Space>
                </Radio>
                <Radio value="card" style={{ width: '100%', padding: '12px 16px', border: '1px solid #e8e8e8', borderRadius: 8, marginBottom: 8 }}>
                  <Space>
                    <span style={{ fontSize: 20 }}>💳</span>
                    <span><strong>银行卡</strong></span>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'inline-block', padding: 20, border: '2px dashed #1890ff', borderRadius: 12 }}>
                <QRCode
                  value={`${window.location.origin}/#/pay/${invoice.id}`}
                  size={160}
                  level="M"
                  color="#1890ff"
                />
              </div>
              <p style={{ marginTop: 12, color: '#666' }}>
                <QrcodeOutlined /> 打开{payMethod === 'wechat' ? '微信' : payMethod === 'alipay' ? '支付宝' : '手机银行'}扫一扫
              </p>
            </div>

            <Divider>演示支付</Divider>
            <div style={{ background: '#fffbe6', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 演示环境：点击下方按钮模拟患者完成支付，系统将自动同步支付结果到财务端。
              </Text>
            </div>
            <Button
              type="primary"
              size="large"
              block
              icon={<DollarOutlined />}
              loading={paying}
              onClick={() => handleMockPay(payMethod)}
              style={{ marginBottom: 16, height: 48, fontSize: 16 }}
            >
              确认支付 ¥{remaining}
            </Button>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
            <Title level={4} type="success" style={{ marginBottom: 24 }}>支付成功</Title>
            
            <div style={{ textAlign: 'left', background: '#f6ffed', padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="支付金额">
                  <Tag color="success" style={{ fontSize: 16 }}>¥{remaining}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="支付方式">
                  {payMethod === 'wechat' ? '微信支付' : payMethod === 'alipay' ? '支付宝' : '银行卡'}
                </Descriptions.Item>
                <Descriptions.Item label="订单状态">
                  <Tag color="green">已支付</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="支付时间">
                  {new Date().toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div style={{ textAlign: 'center', color: '#999', marginBottom: 24 }}>
              <Text type="secondary">
                支付结果已同步至诊所系统，请注意查收就诊提醒。
              </Text>
            </div>

            <Button block onClick={() => window.close()}>
              关闭页面
            </Button>
          </div>
        )}
      </Card>
      </div>
    </div>
  )
}

export default PatientPay
