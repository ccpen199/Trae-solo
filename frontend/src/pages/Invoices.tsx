import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Typography, InputNumber, List, Divider, QRCode, Descriptions, Steps } from 'antd'
import { PlusOutlined, EyeOutlined, DollarOutlined, RollbackOutlined, DeleteOutlined, CopyOutlined, QrcodeOutlined } from '@ant-design/icons'
import { invoiceAPI, patientAPI, masterAPI } from '../api'

const { Title, Text } = Typography
const { Option } = Select

const Invoices: React.FC = () => {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [payVisible, setPayVisible] = useState(false)
  const [refundVisible, setRefundVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [currentDetail, setCurrentDetail] = useState<any>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [invoiceItems, setInvoiceItems] = useState<any[]>([])
  const [payForm] = Form.useForm()
  const [refundForm] = Form.useForm()
  const [createForm] = Form.useForm()

  useEffect(() => {
    loadData()
    loadMasterData()
  }, [page, pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const [invoiceRes, patientRes] = await Promise.all([
        invoiceAPI.list({ page, pageSize }),
        patientAPI.list({ pageSize: 100 }),
      ])
      setList(invoiceRes.data.list || [])
      setTotal(invoiceRes.data.total || 0)
      setPatients(patientRes.data.list || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadMasterData = async () => {
    try {
      const treatmentRes = await masterAPI.treatments()
      setTreatments(treatmentRes.data || [])
    } catch (error) {
      console.error(error)
    }
  }

  const handleCreate = () => {
    setInvoiceItems([])
    createForm.resetFields()
    setCreateVisible(true)
  }

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { id: Date.now(), name: '', treatment_id: null, price: 0, quantity: 1 }])
  }

  const removeInvoiceItem = (id: number) => {
    setInvoiceItems(invoiceItems.filter((item: any) => item.id !== id))
  }

  const updateInvoiceItem = (id: number, field: string, value: any) => {
    setInvoiceItems(invoiceItems.map((item: any) => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleTreatmentChange = (id: number, treatmentId: number) => {
    const treatment = treatments.find(t => t.id === treatmentId)
    if (treatment) {
      setInvoiceItems(invoiceItems.map((item: any) => 
        item.id === id ? { ...item, treatment_id: treatmentId, name: treatment.name, price: treatment.price } : item
      ))
    }
  }

  const calculateTotal = () => {
    return invoiceItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
  }

  const submitCreate = async (values: any) => {
    if (invoiceItems.length === 0) {
      message.error('至少添加一个收费项目')
      return
    }
    try {
      await invoiceAPI.create({
        ...values,
        items: invoiceItems.map((item: any) => ({
          name: item.name,
          treatment_id: item.treatment_id,
          price: item.price,
          quantity: item.quantity
        }))
      })
      message.success('创建收费单成功')
      setCreateVisible(false)
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建失败')
    }
  }

  const handleView = async (id: number) => {
    try {
      const res = await invoiceAPI.get(id)
      setCurrentDetail(res.data)
      setDetailVisible(true)
    } catch (error) {
      message.error('获取详情失败')
    }
  }

  const handlePay = (record: any) => {
    setCurrentItem(record)
    payForm.setFieldsValue({
      amount: record.total_amount - record.paid_amount - record.discount,
      payment_method: 'cash',
    })
    setPayVisible(true)
  }

  const handleRefund = (record: any) => {
    setCurrentItem(record)
    refundForm.setFieldsValue({
      amount: record.paid_amount,
      reason: '',
    })
    setRefundVisible(true)
  }

  const submitPay = async (values: any) => {
    try {
      await invoiceAPI.pay(currentItem.id, values)
      message.success('付款成功')
      setPayVisible(false)
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const submitRefund = async (values: any) => {
    try {
      await invoiceAPI.refund(currentItem.id, values)
      message.success('退款成功')
      setRefundVisible(false)
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待付款' },
      partial: { color: 'blue', text: '部分付款' },
      paid: { color: 'green', text: '已付清' },
      refunded: { color: 'red', text: '已退款' },
      cancelled: { color: 'default', text: '已取消' },
    }
    const info = statusMap[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const columns = [
    { title: '单号', dataIndex: 'id', key: 'id', width: 70, fixed: 'left' as const },
    { title: '患者', dataIndex: 'patient_name', key: 'patient_name', width: 100 },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', width: 90, render: (v: number) => `¥${v}` },
    { title: '已付', dataIndex: 'paid_amount', key: 'paid_amount', width: 80, render: (v: number) => `¥${v}` },
    { title: '状态', key: 'status', width: 90, render: (_: any, r: any) => getStatusTag(r.status) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" type="primary" ghost icon={<EyeOutlined />} onClick={() => handleView(record.id)}>查看支付</Button>
          {record.paid_amount > 0 && (
            <Button size="small" type="link" danger icon={<RollbackOutlined />} onClick={() => handleRefund(record)}>退款</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>收费管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          创建收费单
        </Button>
      </div>

      <Table
        loading={loading}
        dataSource={list}
        columns={columns}
        rowKey="id"
        scroll={{ x: 800 }}
        pagination={{
          total,
          current: page,
          pageSize,
          onChange: (p, ps) => { setPage(p); setPageSize(ps || 20) },
        }}
      />

      <Modal
        title="收费单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {currentDetail && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="收费单号" span={2}>#{currentDetail.id}</Descriptions.Item>
              <Descriptions.Item label="患者">{currentDetail.patient_name}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentDetail.status)}</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{currentDetail.total_amount}</Descriptions.Item>
              <Descriptions.Item label="优惠">¥{currentDetail.discount}</Descriptions.Item>
              <Descriptions.Item label="已付金额">¥{currentDetail.paid_amount}</Descriptions.Item>
              <Descriptions.Item label="待付金额">
                <Text type="danger" strong>¥{currentDetail.total_amount - currentDetail.discount - currentDetail.paid_amount}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{currentDetail.created_at}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">支付链路</Divider>
            <Steps
              direction="vertical"
              size="small"
              current={currentDetail.status === 'paid' || currentDetail.status === 'refunded' ? 2 : 1}
              style={{ marginBottom: 16 }}
            >
              <Steps.Step title="订单创建" description={currentDetail.created_at} status="finish" />
              <Steps.Step 
                title="等待支付" 
                description={currentDetail.status !== 'paid' && currentDetail.status !== 'refunded' ? '待支付' : '已完成'}
                status={currentDetail.status !== 'paid' && currentDetail.status !== 'refunded' ? 'process' : 'finish'}
              />
              <Steps.Step 
                title="支付完成" 
                description={currentDetail.paid_at || '待支付'}
                status={currentDetail.status === 'paid' || currentDetail.status === 'refunded' ? 'finish' : 'wait'}
              />
            </Steps>

            {currentDetail.status !== 'paid' && currentDetail.status !== 'refunded' && (
              <>
                <Divider orientation="left">
                  <span style={{ color: '#1890ff' }}>
                    <QrcodeOutlined /> 请引导患者完成支付
                  </span>
                </Divider>
                <div style={{ background: '#e6f7ff', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ⚠️ 财务端无法直接收款，请将支付二维码或链接展示给患者，由患者扫码完成支付。
                    支付成功后系统将自动更新订单状态。
                  </Text>
                </div>
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ padding: 16, border: '2px dashed #1890ff', borderRadius: 8, display: 'inline-block' }}>
                      <QRCode
                        value={`${window.location.origin}/#/pay/${currentDetail.id}`}
                        size={140}
                        level="M"
                        color="#1890ff"
                      />
                    </div>
                    <p style={{ marginTop: 8, color: '#1890ff', fontWeight: 500 }}>
                      患者扫码支付
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p><strong>支付链接（可复制发送给患者）：</strong></p>
                    <Input
                      value={`${window.location.origin}/#/pay/${currentDetail.id}`}
                      readOnly
                      addonAfter={
                        <Button
                          type="primary"
                          icon={<CopyOutlined />}
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/#/pay/${currentDetail.id}`)
                            message.success('支付链接已复制，可发送给患者')
                          }}
                        >
                          复制链接
                        </Button>
                      }
                    />
                    <Button
                      type="link"
                      onClick={() => window.open(`/#/pay/${currentDetail.id}`, '_blank')}
                      style={{ paddingLeft: 0, marginTop: 8 }}
                    >
                      预览患者支付页面 →
                    </Button>
                  </div>
                </div>
              </>
            )}

            <Divider orientation="left">收费项目</Divider>
            <List
              size="small"
              bordered
              dataSource={currentDetail.items || []}
              renderItem={(item: any) => (
                <List.Item>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span>{item.name} × {item.quantity}</span>
                    <span>¥{item.price} × {item.quantity} = <strong>¥{item.price * item.quantity}</strong></span>
                  </Space>
                </List.Item>
              )}
              style={{ marginBottom: 16 }}
            />

            <Divider orientation="left">付款记录</Divider>
            <List
              size="small"
              dataSource={currentDetail.payments || []}
              locale={{ emptyText: '暂无付款记录' }}
              renderItem={(item: any) => (
                <List.Item>
                  <Space>
                    <Tag color="green">+¥{item.amount}</Tag>
                    <span>{item.payment_method}</span>
                    {item.transaction_no && <Text code>{item.transaction_no}</Text>}
                    <Text type="secondary">{item.created_at}</Text>
                    <Text type="secondary">操作人: {item.created_by_name}</Text>
                  </Space>
                </List.Item>
              )}
            />

            {currentDetail.refunds && currentDetail.refunds.length > 0 && (
              <>
                <Divider orientation="left">退款记录</Divider>
                <List
                  size="small"
                  dataSource={currentDetail.refunds || []}
                  renderItem={(item: any) => (
                    <List.Item>
                      <Space>
                        <Tag color="red">-¥{item.amount}</Tag>
                        <span>{item.reason}</span>
                        <Text type="secondary">{item.created_at}</Text>
                      </Space>
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="收款"
        open={payVisible}
        onCancel={() => setPayVisible(false)}
        footer={null}
      >
        <Form form={payForm} layout="vertical" onFinish={submitPay}>
          <Form.Item name="amount" label="收款金额" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item name="payment_method" label="付款方式" rules={[{ required: true }]}>
            <Select>
              <Option value="cash">现金</Option>
              <Option value="wechat">微信</Option>
              <Option value="alipay">支付宝</Option>
              <Option value="card">银行卡</Option>
              <Option value="insurance">医保</Option>
            </Select>
          </Form.Item>
          <Form.Item name="transaction_no" label="交易单号">
            <Input />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setPayVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认收款</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="退款"
        open={refundVisible}
        onCancel={() => setRefundVisible(false)}
        footer={null}
      >
        <Form form={refundForm} layout="vertical" onFinish={submitRefund}>
          <Form.Item name="amount" label="退款金额" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item name="reason" label="退款原因" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setRefundVisible(false)}>取消</Button>
              <Button type="primary" danger htmlType="submit">确认退款</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建收费单"
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={createForm} layout="vertical" onFinish={submitCreate}>
          <Form.Item name="patient_id" label="选择患者" rules={[{ required: true, message: '请选择患者' }]}>
            <Select placeholder="请选择患者" showSearch optionFilterProp="children">
              {patients.map(p => (
                <Option key={p.id} value={p.id}>{p.name} - {p.phone}</Option>
              ))}
            </Select>
          </Form.Item>

          <Divider style={{ margin: '12px 0' }}>
            <span>收费项目</span>
          </Divider>

          {invoiceItems.map((item: any, index: number) => (
            <div key={item.id} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
              <Form.Item label={index === 0 ? '治疗项目' : ''} style={{ marginBottom: 0, flex: 2 }}>
                <Select
                  value={item.treatment_id}
                  onChange={(value) => handleTreatmentChange(item.id, value)}
                  placeholder="选择治疗项目"
                  allowClear
                >
                  {treatments.map(t => (
                    <Option key={t.id} value={t.id}>{t.name} (¥{t.price})</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label={index === 0 ? '项目名称' : ''} style={{ marginBottom: 0, flex: 2 }}>
                <Input
                  value={item.name}
                  onChange={(e) => updateInvoiceItem(item.id, 'name', e.target.value)}
                  placeholder="项目名称"
                />
              </Form.Item>
              <Form.Item label={index === 0 ? '单价' : ''} style={{ marginBottom: 0, flex: 1 }}>
                <InputNumber
                  value={item.price}
                  onChange={(value) => updateInvoiceItem(item.id, 'price', value || 0)}
                  min={0}
                  style={{ width: '100%' }}
                  prefix="¥"
                />
              </Form.Item>
              <Form.Item label={index === 0 ? '数量' : ''} style={{ marginBottom: 0, width: 80 }}>
                <InputNumber
                  value={item.quantity}
                  onChange={(value) => updateInvoiceItem(item.id, 'quantity', value || 1)}
                  min={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeInvoiceItem(item.id)}
                style={{ marginBottom: 3 }}
              />
            </div>
          ))}

          <Button type="dashed" onClick={addInvoiceItem} block style={{ marginBottom: 16 }}>
            <PlusOutlined /> 添加收费项目
          </Button>

          <div style={{ textAlign: 'right', marginBottom: 16, fontSize: 16 }}>
            <strong>合计：¥{calculateTotal()}</strong>
          </div>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setCreateVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建收费单</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Invoices
