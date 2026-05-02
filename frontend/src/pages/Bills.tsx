import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Tag,
  Space,
  Descriptions,
  Row,
  Col,
  Tabs,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  MoneyCollectOutlined,
  CreditCardOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { billsApi, checkInsApi } from '@/services/api'

const Bills: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [bills, setBills] = useState<any[]>([])
  const [checkIns, setCheckIns] = useState<any[]>([])
  const [selectedBill, setSelectedBill] = useState<any>(null)
  const [billModalVisible, setBillModalVisible] = useState(false)
  const [chargeModalVisible, setChargeModalVisible] = useState(false)
  const [paymentModalVisible, setPaymentModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('open')
  const [chargeForm] = Form.useForm()
  const [paymentForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [billsResponse, ciResponse] = await Promise.all([
        billsApi.getAll(),
        checkInsApi.getInHouse(),
      ])
      if (billsResponse.data.success) {
        setBills(billsResponse.data.data.bills || [])
      }
      if (ciResponse.data.success) {
        setCheckIns(ciResponse.data.data || [])
      }
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusLabel = (status: string): { text: string; color: string } => {
    const statusMap: Record<string, { text: string; color: string }> = {
      OPEN: { text: '进行中', color: 'processing' },
      SETTLED: { text: '已结算', color: 'success' },
      PARTIALLY_PAID: { text: '部分付款', color: 'warning' },
      CANCELLED: { text: '已取消', color: 'default' },
    }
    return statusMap[status] || { text: status, color: 'default' }
  }

  const handleViewBill = (bill: any) => {
    setSelectedBill(bill)
    setBillModalVisible(true)
  }

  const handleAddCharge = (bill: any) => {
    setSelectedBill(bill)
    chargeForm.resetFields()
    chargeForm.setFieldsValue({
      quantity: 1,
    })
    setChargeModalVisible(true)
  }

  const handleAddPayment = (bill: any) => {
    setSelectedBill(bill)
    paymentForm.resetFields()
    const remaining = (bill.totalAmount || 0) - (bill.paidAmount || 0)
    paymentForm.setFieldsValue({
      paymentMethod: 'CASH',
      amount: Math.max(0, remaining),
    })
    setPaymentModalVisible(true)
  }

  const handleChargeSubmit = async (values: any) => {
    try {
      const submitData = {
        itemType: values.category,
        description: values.description,
        quantity: values.quantity,
        unitPrice: values.price,
        remark: values.notes,
      }

      const response = await billsApi.addItem(selectedBill.id, submitData)
      if (response.data.success) {
        message.success('消费记账成功')
        setChargeModalVisible(false)
        fetchData()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '记账失败')
    }
  }

  const handlePaymentSubmit = async (values: any) => {
    try {
      const submitData = {
        paymentMethod: values.method,
        amount: values.amount,
        remark: values.notes,
      }

      const response = await billsApi.addPayment(selectedBill.id, submitData)
      if (response.data.success) {
        message.success('收款成功')
        setPaymentModalVisible(false)
        fetchData()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '收款失败')
    }
  }

  const openBills = bills.filter((b) => b.status === 'OPEN' || b.status === 'PARTIALLY_PAID')
  const settledBills = bills.filter((b) => b.status === 'SETTLED')

  const columns = [
    {
      title: '账单编号',
      dataIndex: 'billNo',
      key: 'billNo',
      render: (val: string) => val || '-',
    },
    {
      title: '房号',
      dataIndex: ['checkIn', 'room', 'roomNumber'],
      key: 'roomNumber',
      render: (val: string) => val || '-',
    },
    {
      title: '客人',
      dataIndex: ['guest', 'name'],
      key: 'guestName',
      render: (val: string) => val || '-',
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `¥${amount?.toFixed(2) || 0}`,
    },
    {
      title: '已付',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (amount: number) => `¥${amount?.toFixed(2) || 0}`,
    },
    {
      title: '余额',
      key: 'balance',
      render: (_: any, record: any) => {
        const balance = (record.totalAmount || 0) - (record.paidAmount || 0)
        const color = balance > 0 ? 'red' : 'green'
        return <span style={{ color, fontWeight: 'bold' }}>¥{balance.toFixed(2)}</span>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const { text, color } = getStatusLabel(status)
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => handleViewBill(record)}>
            详情
          </Button>
          <Button size="small" type="primary" onClick={() => handleAddCharge(record)}>
            记账
          </Button>
          <Button size="small" type="primary" onClick={() => handleAddPayment(record)}>
            收款
          </Button>
        </Space>
      ),
    },
  ]

  const billItemsColumns = [
    {
      title: '项目',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '类型',
      dataIndex: 'itemType',
      key: 'itemType',
      render: (cat: string) => {
        const typeMap: Record<string, string> = {
          ROOM: '房费',
          MINI_BAR: '迷你吧',
          RESTAURANT: '餐饮',
          LAUNDRY: '洗衣',
          SPA: '水疗',
          OTHER: '其他',
        }
        return typeMap[cat] || cat
      },
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price: number) => `¥${price?.toFixed(2) || 0}`,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (total: number) => `¥${total?.toFixed(2) || 0}`,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => date ? dayjs(date).format('MM-DD HH:mm') : '-',
    },
  ]

  const paymentsColumns = [
    {
      title: '支付方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method: string) => {
        const methodMap: Record<string, string> = {
          CASH: '现金',
          WECHAT: '微信',
          ALIPAY: '支付宝',
          CARD: '银行卡',
          DEPOSIT: '押金',
        }
        return methodMap[method] || method
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount?.toFixed(2) || 0}`,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (notes: string) => notes || '-',
    },
    {
      title: '时间',
      dataIndex: 'paymentTime',
      key: 'paymentTime',
      render: (date: string) => date ? dayjs(date).format('MM-DD HH:mm') : '-',
    },
  ]

  const tabItems = [
    { key: 'open', label: `当前账单 (${openBills.length})` },
    { key: 'settled', label: `历史账单 (${settledBills.length})` },
  ]

  const displayData = activeTab === 'open' ? openBills : settledBills

  const getBalance = (bill: any) => {
    return ((bill.totalAmount || 0) - (bill.paidAmount || 0)).toFixed(2)
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>账务管理</h2>

      <Card
        loading={loading}
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />

        <Table
          columns={columns}
          dataSource={displayData}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="账单详情"
        open={billModalVisible}
        onCancel={() => setBillModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setBillModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
      >
        {selectedBill && (
          <div>
            <Descriptions size="small" column={3} bordered>
              <Descriptions.Item label="房号">
                {selectedBill.checkIn?.room?.roomNumber || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="客人">
                {selectedBill.guest?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusLabel(selectedBill.status).color}>
                  {getStatusLabel(selectedBill.status).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="总金额">
                <strong>¥{(selectedBill.totalAmount || 0).toFixed(2)}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="已付">
                ¥{(selectedBill.paidAmount || 0).toFixed(2)}
              </Descriptions.Item>
              <Descriptions.Item label="余额">
                <span style={{ color: 'red', fontWeight: 'bold' }}>
                  ¥{getBalance(selectedBill)}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">消费明细</Divider>
            <Table
              columns={billItemsColumns}
              dataSource={selectedBill.items || []}
              rowKey="id"
              pagination={false}
              size="small"
            />

            <Divider orientation="left">支付记录</Divider>
            <Table
              columns={paymentsColumns}
              dataSource={selectedBill.payments || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>

      <Modal
        title="消费记账"
        open={chargeModalVisible}
        onCancel={() => setChargeModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={chargeForm}
          layout="vertical"
          onFinish={handleChargeSubmit}
        >
          <Form.Item
            name="category"
            label="消费类型"
            rules={[{ required: true, message: '请选择消费类型' }]}
          >
            <Select placeholder="请选择消费类型">
              <Select.Option value="ROOM">房费</Select.Option>
              <Select.Option value="MINI_BAR">迷你吧</Select.Option>
              <Select.Option value="RESTAURANT">餐饮</Select.Option>
              <Select.Option value="LAUNDRY">洗衣</Select.Option>
              <Select.Option value="SPA">水疗</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="项目描述"
            rules={[{ required: true, message: '请输入项目描述' }]}
          >
            <Input placeholder="例如：矿泉水、小吃" />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="数量"
                rules={[{ required: true, message: '请输入数量' }]}
                initialValue={1}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="单价"
                rules={[{ required: true, message: '请输入单价' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} prefix="¥" precision={2} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea rows={2} placeholder="备注（可选）" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认记账
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="收款"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedBill && (
          <Form
            form={paymentForm}
            layout="vertical"
            onFinish={handlePaymentSubmit}
          >
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ color: '#999', fontSize: 12 }}>总金额</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                    ¥{(selectedBill.totalAmount || 0).toFixed(2)}
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#999', fontSize: 12 }}>已付</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                    ¥{(selectedBill.paidAmount || 0).toFixed(2)}
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#999', fontSize: 12 }}>待收</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: 'red' }}>
                    ¥{getBalance(selectedBill)}
                  </div>
                </Col>
              </Row>
            </Card>

            <Form.Item
              name="method"
              label="支付方式"
              rules={[{ required: true, message: '请选择支付方式' }]}
              initialValue="CASH"
            >
              <Select>
                <Select.Option value="CASH">现金</Select.Option>
                <Select.Option value="WECHAT">微信</Select.Option>
                <Select.Option value="ALIPAY">支付宝</Select.Option>
                <Select.Option value="CARD">银行卡</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="amount"
              label="收款金额"
              rules={[{ required: true, message: '请输入收款金额' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} prefix="¥" precision={2} />
            </Form.Item>

            <Form.Item
              name="notes"
              label="备注"
            >
              <Input.TextArea rows={2} placeholder="备注（可选）" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                确认收款
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default Bills
