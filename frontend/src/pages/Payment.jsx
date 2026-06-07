import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Form, Select, Input, Radio, Switch, InputNumber, message, Alert, Modal, Descriptions, Tag, Divider } from 'antd'
import { ThunderboltOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined, LinkOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import dayjs from 'dayjs'

const Payment = () => {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [isAgent, setIsAgent] = useState(false)
  const [voucherVisible, setVoucherVisible] = useState(false)
  const [lastPayment, setLastPayment] = useState(null)

  const amountOptions = [50, 100, 200, 500, 1000]

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const data = await api.get('/accounts')
      setAccounts(data)
      if (data.length > 0) {
        const defaultAccount = data.find(a => a.is_default) || data[0]
        setSelectedAccount(defaultAccount)
        form.setFieldsValue({ account_id: defaultAccount.id, amount: 100 })
      }
    } catch (error) {
      message.error('获取户号列表失败')
    }
  }

  const handleAccountChange = (accountId) => {
    const account = accounts.find(a => a.id === accountId)
    setSelectedAccount(account)
  }

  const handleSubmit = async (values) => {
    if (!values.amount || values.amount <= 0) {
      message.error('请输入充值金额')
      return
    }

    setLoading(true)
    try {
      const data = await api.post('/payment/recharge', { ...values, is_agent: isAgent })
      setLastPayment(data)
      setVoucherVisible(true)
      fetchAccounts()
    } catch (error) {
      message.error(error.response?.data?.error || '充值失败')
    } finally {
      setLoading(false)
    }
  }

  const getArrivalStatusTag = (status) => {
    switch (status) {
      case 'success': return <Tag icon={<CheckCircleOutlined />} color="success">已到账</Tag>
      case 'processing': return <Tag icon={<ClockCircleOutlined />} color="processing">到账中</Tag>
      case 'failed': return <Tag color="error">到账失败</Tag>
      default: return <Tag>{status}</Tag>
    }
  }

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card title="电费缴纳">
            {accounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                暂无绑定户号，请先绑定户号
              </div>
            ) : (
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                  name="account_id"
                  label="选择户号"
                  rules={[{ required: true, message: '请选择户号' }]}
                >
                  <Select
                    placeholder="请选择缴费户号"
                    onChange={handleAccountChange}
                    optionLabelProp="label"
                  >
                    {accounts.map(account => (
                      <Select.Option
                        key={account.id}
                        value={account.id}
                        label={account.account_name}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{account.account_name}</div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            {account.account_number} | 余额：¥{account.balance}
                            {account.arrears > 0 && <span style={{ color: '#ff4d4f', marginLeft: 8 }}>欠费：¥{account.arrears}</span>}
                          </div>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {selectedAccount && selectedAccount.arrears > 0 && (
                  <Alert
                    message={`该户号当前欠费：¥${selectedAccount.arrears}，缴费将优先抵扣欠费金额`}
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Form.Item
                  name="amount"
                  label="充值金额"
                  rules={[{ required: true, message: '请选择或输入充值金额' }]}
                >
                  <div>
                    <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                      {amountOptions.map(amount => (
                        <Col span={6} key={amount}>
                          <Button
                            onClick={() => form.setFieldsValue({ amount })}
                            style={{
                              width: '100%',
                              height: 50,
                              background: form.getFieldValue('amount') === amount ? '#1890ff' : '#fff',
                              color: form.getFieldValue('amount') === amount ? '#fff' : '#333',
                              borderColor: form.getFieldValue('amount') === amount ? '#1890ff' : '#d9d9d9',
                            }}
                          >
                            ¥{amount}
                          </Button>
                        </Col>
                      ))}
                    </Row>
                    <InputNumber
                      style={{ width: '100%' }}
                      min={1}
                      max={10000}
                      placeholder="自定义金额"
                      addonBefore="¥"
                    />
                  </div>
                </Form.Item>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span>代缴模式</span>
                    <Switch checked={isAgent} onChange={setIsAgent} />
                  </div>
                  {isAgent && (
                    <Alert
                      message="代缴模式说明"
                      description="您正在为他人代缴电费。代缴关系将被记录，可在交费记录中追溯。请确保与户主关系选择正确。"
                      type="info"
                      showIcon
                      style={{ marginBottom: 12 }}
                    />
                  )}
                  {isAgent && (
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item name="agent_relation" label="与户主关系" rules={[{ required: true, message: '请选择关系' }]}>
                          <Select placeholder="选择关系">
                            <Select.Option value="parent">父母</Select.Option>
                            <Select.Option value="child">子女</Select.Option>
                            <Select.Option value="spouse">配偶</Select.Option>
                            <Select.Option value="friend">朋友</Select.Option>
                            <Select.Option value="landlord">房东</Select.Option>
                            <Select.Option value="tenant">租客</Select.Option>
                            <Select.Option value="other">其他</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="payee_name" label="户主姓名" rules={[{ required: true, message: '请输入户主姓名' }]}>
                          <Input placeholder="请输入户主姓名" />
                        </Form.Item>
                      </Col>
                    </Row>
                  )}
                </div>

                <Form.Item
                  name="payment_method"
                  label="支付方式"
                  initialValue="alipay"
                >
                  <Radio.Group>
                    <Radio value="alipay">支付宝</Radio>
                    <Radio value="wechat">微信支付</Radio>
                    <Radio value="bank">银行卡</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    style={{ width: '100%', height: 48, fontSize: 16 }}
                    loading={loading}
                    icon={<ThunderboltOutlined />}
                  >
                    立即缴费 ¥{form.getFieldValue('amount') || 0}
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
                  <p>缴费成功后预计1-5分钟到账</p>
                  <p>每缴费1元可获得1积分</p>
                </div>
              </Form>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="缴费提示">
            <div style={{ lineHeight: 2 }}>
              <p><strong>1. 缴费时间</strong></p>
              <p style={{ textIndent: 24 }}>全天24小时均可缴费，实时到账</p>

              <p><strong>2. 发票说明</strong></p>
              <p style={{ textIndent: 24 }}>可在"交费记录"中申请电子发票</p>

              <p><strong>3. 退款规则</strong></p>
              <p style={{ textIndent: 24 }}>缴费成功后不支持退款，请核对户号信息</p>

              <p><strong>4. 欠费说明</strong></p>
              <p style={{ textIndent: 24 }}>如存在欠费，缴费将优先抵扣欠费金额</p>

              <p><strong>5. 代缴说明</strong></p>
              <p style={{ textIndent: 24 }}>开启代缴模式后，代缴关系和户主信息将记录在缴费凭证中</p>
            </div>
          </Card>

          {selectedAccount && (
            <Card title="户号信息" style={{ marginTop: 16 }}>
              <p>户名：{selectedAccount.account_name}</p>
              <p>户号：{selectedAccount.account_number}</p>
              <p>电表编号：{selectedAccount.meter_number || '-'}</p>
              <p>地址：{selectedAccount.address}</p>
              <p>当前余额：<strong style={{ color: selectedAccount.balance >= 0 ? '#52c41a' : '#ff4d4f' }}>¥{selectedAccount.balance}</strong></p>
              {selectedAccount.arrears > 0 && (
                <p>当前欠费：<strong style={{ color: '#ff4d4f' }}>¥{selectedAccount.arrears}</strong></p>
              )}
              <p>本月用电：{selectedAccount.monthly_usage}kWh</p>
            </Card>
          )}

          <Card
            title="最近缴费记录"
            style={{ marginTop: 16 }}
            extra={<Button type="link" icon={<LinkOutlined />} onClick={() => navigate('/payment-records')}>查看全部</Button>}
          >
            <RecentPayments accountId={selectedAccount?.id} />
          </Card>
        </Col>
      </Row>

      <Modal
        title={<span><FileTextOutlined /> 缴费凭证</span>}
        open={voucherVisible}
        onCancel={() => setVoucherVisible(false)}
        width={520}
        footer={[
          <Button key="records" icon={<LinkOutlined />} onClick={() => { setVoucherVisible(false); navigate('/payment-records') }}>
            查看交费记录
          </Button>,
          <Button key="close" type="primary" onClick={() => setVoucherVisible(false)}>
            完成
          </Button>,
        ]}
      >
        {lastPayment && (
          <div>
            <Alert
              message="缴费成功"
              description={`已成功缴纳 ¥${lastPayment.amount}，获得 ${lastPayment.points_earned} 积分`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="订单编号">{lastPayment.order_no}</Descriptions.Item>
              <Descriptions.Item label="缴费金额">
                <strong style={{ color: '#1890ff', fontSize: 16 }}>¥{lastPayment.amount}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="到账状态">
                {getArrivalStatusTag(lastPayment.status || 'success')}
              </Descriptions.Item>
              <Descriptions.Item label="缴费户号">{lastPayment.account_number || selectedAccount?.account_number}</Descriptions.Item>
              <Descriptions.Item label="户名">{lastPayment.account_name || selectedAccount?.account_name}</Descriptions.Item>
              <Descriptions.Item label="支付方式">
                {lastPayment.payment_method === 'alipay' ? '支付宝' :
                 lastPayment.payment_method === 'wechat' ? '微信支付' : '银行卡'}
              </Descriptions.Item>
              <Descriptions.Item label="缴费时间">{dayjs().format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="获得积分">
                <Tag color="orange">{lastPayment.points_earned} 积分</Tag>
              </Descriptions.Item>
            </Descriptions>

            {lastPayment.is_agent && (
              <>
                <Divider orientation="left" plain>代缴关系追溯</Divider>
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="代缴模式"><Tag color="blue">代缴</Tag></Descriptions.Item>
                  <Descriptions.Item label="缴费人">{lastPayment.payer_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="户主（收款人）">{lastPayment.payee_name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="与户主关系">
                    {{ parent: '父母', child: '子女', spouse: '配偶', friend: '朋友', landlord: '房东', tenant: '租客', other: '其他' }[lastPayment.agent_relation] || lastPayment.agent_relation || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 4, fontSize: 12, color: '#666' }}>
              <p style={{ margin: 0 }}>📌 凭证说明：</p>
              <p style={{ margin: '4px 0 0' }}>• 订单编号可用于在交费记录中查询本次缴费详情</p>
              <p style={{ margin: '4px 0 0' }}>• 如代缴，代缴关系已记录，可在交费记录中追溯</p>
              <p style={{ margin: '4px 0 0' }}>• 如未到账，请5分钟后刷新查看</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

const RecentPayments = ({ accountId }) => {
  const [records, setRecords] = useState([])

  useEffect(() => {
    if (accountId) {
      fetchRecords()
    }
  }, [accountId])

  const fetchRecords = async () => {
    try {
      const data = await api.get('/payment/records?page=1&page_size=5')
      setRecords(data.records || [])
    } catch (error) {
      console.error('获取缴费记录失败', error)
    }
  }

  if (records.length === 0) {
    return <div style={{ textAlign: 'center', color: '#999', padding: '20px 0' }}>暂无缴费记录</div>
  }

  return (
    <div>
      {records.map(record => (
        <div key={record.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 'bold' }}>¥{record.amount}</span>
              {record.is_agent && <Tag color="blue" style={{ marginLeft: 4 }}>代缴</Tag>}
            </div>
            <Tag color={record.status === 'success' ? 'green' : 'orange'}>
              {record.status === 'success' ? '已到账' : '处理中'}
            </Tag>
          </div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            {record.account_name} | {record.order_no} | {dayjs(record.created_at).format('MM-DD HH:mm')}
          </div>
          {record.is_agent && record.agent_relation && (
            <div style={{ fontSize: 12, color: '#1890ff', marginTop: 2 }}>
              代缴关系：{{ parent: '父母', child: '子女', spouse: '配偶', friend: '朋友', landlord: '房东', tenant: '租客', other: '其他' }[record.agent_relation] || record.agent_relation}
              {record.payee_name && ` → ${record.payee_name}`}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default Payment
