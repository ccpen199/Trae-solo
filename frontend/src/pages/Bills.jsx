import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Space, Tag, message, Row, Col, Card, List, Divider } from 'antd'
import { PlusOutlined, EyeOutlined, PayCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../utils/api'

const { Option } = Select
const { TextArea } = Input

const billItemTypes = [
  { value: 'rent', label: '租金' },
  { value: 'meeting_room', label: '会议室' },
  { value: 'print', label: '打印' },
  { value: 'parking', label: '停车' },
  { value: 'other', label: '其他' }
]

export default function Bills() {
  const [bills, setBills] = useState([])
  const [companies, setCompanies] = useState([])
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [payModal, setPayModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [billDetail, setBillDetail] = useState(null)
  const [form] = Form.useForm()
  const [payForm] = Form.useForm()
  const [billItems, setBillItems] = useState([{ type: 'rent', description: '', quantity: 1, unit_price: 0, amount: 0 }])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [billsData, companiesData, contractsData] = await Promise.all([
        api.bills(),
        api.companies(),
        api.contracts()
      ])
      setBills(billsData)
      setCompanies(companiesData)
      setContracts(contractsData)
    } finally {
      setLoading(false)
    }
  }

  const addBillItem = () => {
    setBillItems([...billItems, { type: 'rent', description: '', quantity: 1, unit_price: 0, amount: 0 }])
  }

  const removeBillItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index))
  }

  const updateBillItem = (index, field, value) => {
    const newItems = [...billItems]
    newItems[index][field] = value
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].unit_price
    }
    setBillItems(newItems)
  }

  const totalAmount = billItems.reduce((sum, item) => sum + item.amount, 0)

  const handleCreateBill = async (values) => {
    try {
      await api.createBill({
        ...values,
        bill_date: values.bill_date.format('YYYY-MM-DD'),
        due_date: values.due_date.format('YYYY-MM-DD'),
        items: billItems
      })
      message.success('账单创建成功')
      setCreateModal(false)
      form.resetFields()
      setBillItems([{ type: 'rent', description: '', quantity: 1, unit_price: 0, amount: 0 }])
      loadData()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const handleViewDetail = async (id) => {
    try {
      const detail = await api.getBill(id)
      setBillDetail(detail)
      setDetailModal(true)
    } catch (e) {
      message.error('加载失败')
    }
  }

  const openPayModal = (bill) => {
    setSelectedBill(bill)
    payForm.setFieldsValue({
      amount: bill.total_amount - bill.paid_amount,
      payment_method: 'bank_transfer'
    })
    setPayModal(true)
  }

  const handlePay = async (values) => {
    try {
      await api.payBill(selectedBill.id, values)
      message.success('支付成功')
      setPayModal(false)
      payForm.resetFields()
      loadData()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const statusColors = { unpaid: 'red', partial: 'orange', paid: 'green', overdue: 'red' }
  const statusLabels = { unpaid: '未支付', partial: '部分支付', paid: '已结清', overdue: '已逾期' }

  const columns = [
    { title: '账单编号', dataIndex: 'bill_no', key: 'bill_no' },
    { title: '企业名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '账单日期', dataIndex: 'bill_date', key: 'bill_date' },
    { title: '到期日期', dataIndex: 'due_date', key: 'due_date' },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', render: v => `¥${v.toFixed(2)}` },
    { title: '已支付', dataIndex: 'paid_amount', key: 'paid_amount', render: v => `¥${v.toFixed(2)}` },
    { title: '待支付', key: 'unpaid', render: (_, r) => `¥${(r.total_amount - r.paid_amount).toFixed(2)}` },
    { title: '状态', dataIndex: 'display_status', key: 'display_status', 
      render: (s, record) => <Tag color={statusColors[record.display_status || record.status]}>{statusLabels[record.display_status || record.status]}</Tag>
    },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>详情</Button>
        {record.status !== 'paid' && (
          <Button type="link" icon={<PayCircleOutlined />} onClick={() => openPayModal(record)}>支付</Button>
        )}
      </Space>
    )}
  ]

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col><h2>账单管理</h2></Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>新建账单</Button>
        </Col>
      </Row>

      <Table
        dataSource={bills}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal title="新建账单" open={createModal} onCancel={() => setCreateModal(false)} footer={null} width={700}>
        <Form form={form} layout="vertical" onFinish={handleCreateBill}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="company_id" label="企业" rules={[{ required: true }]}>
                <Select>
                  {companies.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contract_id" label="关联合同">
                <Select allowClear>
                  {contracts.map(c => <Option key={c.id} value={c.id}>{c.package_type} - {c.company_name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bill_date" label="账单日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="due_date" label="到期日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">账单明细</Divider>
          
          {billItems.map((item, index) => (
            <Row gutter={8} key={index} style={{ marginBottom: 8 }}>
              <Col span={5}>
                <Select value={item.type} onChange={v => updateBillItem(index, 'type', v)} style={{ width: '100%' }}>
                  {billItemTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                </Select>
              </Col>
              <Col span={6}>
                <Input value={item.description} onChange={e => updateBillItem(index, 'description', e.target.value)} placeholder="说明" />
              </Col>
              <Col span={4}>
                <InputNumber value={item.quantity} onChange={v => updateBillItem(index, 'quantity', v)} min={1} style={{ width: '100%' }} placeholder="数量" />
              </Col>
              <Col span={4}>
                <InputNumber value={item.unit_price} onChange={v => updateBillItem(index, 'unit_price', v)} min={0} style={{ width: '100%' }} placeholder="单价" />
              </Col>
              <Col span={4}>
                <InputNumber value={item.amount} readOnly style={{ width: '100%' }} />
              </Col>
              <Col span={1}>
                {billItems.length > 1 && <Button type="link" danger onClick={() => removeBillItem(index)}>-</Button>}
              </Col>
            </Row>
          ))}
          
          <Row justify="end" style={{ marginBottom: 16 }}>
            <Button type="dashed" onClick={addBillItem}>+ 添加明细</Button>
          </Row>

          <Row justify="end" style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Card size="small" title="合计">
                <h3 style={{ margin: 0, color: '#cf1322' }}>¥{totalAmount.toFixed(2)}</h3>
              </Card>
            </Col>
          </Row>

          <Form.Item name="remark" label="备注">
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建账单</Button>
              <Button onClick={() => setCreateModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="账单详情" open={detailModal} onCancel={() => setDetailModal(false)} footer={null} width={700}>
        {billDetail && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>账单编号:</strong> {billDetail.bill_no}</p>
                <p><strong>企业:</strong> {billDetail.company_name}</p>
                <p><strong>账单日期:</strong> {billDetail.bill_date}</p>
              </Col>
              <Col span={12}>
                <p><strong>状态:</strong> <Tag color={statusColors[billDetail.status]}>{statusLabels[billDetail.status]}</Tag></p>
                <p><strong>到期日期:</strong> {billDetail.due_date}</p>
              </Col>
            </Row>
            <Divider />
            <h4>账单明细</h4>
            <List
              dataSource={billDetail.items}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={`${billItemTypes.find(t => t.value === item.type)?.label || item.type} - ${item.description}`}
                    description={`数量: ${item.quantity} × 单价: ¥${item.unit_price}`}
                  />
                  <div>¥{item.amount.toFixed(2)}</div>
                </List.Item>
              )}
            />
            <Divider />
            <Row justify="space-between">
              <span><strong>总金额:</strong></span>
              <span><strong>¥{billDetail.total_amount.toFixed(2)}</strong></span>
            </Row>
            <Row justify="space-between">
              <span>已支付:</span>
              <span>¥{billDetail.paid_amount.toFixed(2)}</span>
            </Row>
            <Row justify="space-between" style={{ color: '#cf1322' }}>
              <span><strong>待支付:</strong></span>
              <span><strong>¥{(billDetail.total_amount - billDetail.paid_amount).toFixed(2)}</strong></span>
            </Row>
            {billDetail.payments?.length > 0 && (
              <>
                <Divider />
                <h4>支付记录</h4>
                <List
                  dataSource={billDetail.payments}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        title={`¥${item.amount.toFixed(2)} - ${item.payment_date}`}
                        description={item.transaction_no || ''}
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal title="账单支付" open={payModal} onCancel={() => setPayModal(false)} footer={null}>
        <Form form={payForm} layout="vertical" onFinish={handlePay}>
          <Form.Item label="账单信息">
            <Card size="small">
              <p>账单: {selectedBill?.bill_no}</p>
              <p>待支付: ¥{(selectedBill?.total_amount - selectedBill?.paid_amount).toFixed(2)}</p>
            </Card>
          </Form.Item>
          <Form.Item name="amount" label="支付金额" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} addonBefore="¥" />
          </Form.Item>
          <Form.Item name="payment_method" label="支付方式" rules={[{ required: true }]}>
            <Select>
              <Option value="cash">现金</Option>
              <Option value="bank_transfer">银行转账</Option>
              <Option value="wechat">微信</Option>
              <Option value="alipay">支付宝</Option>
            </Select>
          </Form.Item>
          <Form.Item name="transaction_no" label="交易单号">
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认支付</Button>
              <Button onClick={() => setPayModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
