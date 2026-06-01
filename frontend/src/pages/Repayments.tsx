import { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker, 
  Tag, 
  Card,
  App,
  Descriptions,
  Row,
  Col,
  Divider,
  Timeline,
  Alert
} from 'antd'
import { PlusOutlined, EyeOutlined, PayCircleOutlined, ReloadOutlined, MinusCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { repaymentApi, orderApi } from '../services/api'
import type { Repayment } from '../types'

const { Option } = Select

const Repayments = () => {
  const [repayments, setRepayments] = useState<Repayment[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [overdueFilter, setOverdueFilter] = useState<string>('')
  const [payModalVisible, setPayModalVisible] = useState(false)
  const [extendModalVisible, setExtendModalVisible] = useState(false)
  const [reduceModalVisible, setReduceModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentRepayment, setCurrentRepayment] = useState<Repayment | null>(null)
  const [payForm] = Form.useForm()
  const [extendForm] = Form.useForm()
  const [reduceForm] = Form.useForm()
  const { message, confirm } = App.useApp()

  useEffect(() => {
    loadData()
  }, [page, pageSize, statusFilter, overdueFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (statusFilter) params.status = statusFilter
      if (overdueFilter !== '') params.is_overdue = parseInt(overdueFilter)
      const res = await repaymentApi.list(params)
      if (res.data.success) {
        setRepayments(res.data.data)
        setTotal(res.data.total || 0)
      }
    } catch (error) {
      message.error('加载还款列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckOverdue = async () => {
    try {
      const res = await repaymentApi.checkOverdue()
      if (res.data.success) {
        message.success(res.data.message)
        loadData()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '检测失败')
    }
  }

  const handlePay = (repayment: Repayment) => {
    setCurrentRepayment(repayment)
    payForm.resetFields()
    payForm.setFieldsValue({ payment_date: dayjs() })
    setPayModalVisible(true)
  }

  const handleExtend = (repayment: Repayment) => {
    setCurrentRepayment(repayment)
    extendForm.resetFields()
    setExtendModalVisible(true)
  }

  const handleReduce = (repayment: Repayment) => {
    setCurrentRepayment(repayment)
    reduceForm.resetFields()
    setReduceModalVisible(true)
  }

  const handleView = (repayment: Repayment) => {
    setCurrentRepayment(repayment)
    setDetailVisible(true)
  }

  const handlePaySubmit = async () => {
    try {
      const values = await payForm.validateFields()
      
      const data = {
        amount: values.amount,
        payment_method: values.payment_method,
        payment_date: values.payment_date?.format('YYYY-MM-DD'),
        operator: values.operator || '',
        notes: values.notes || ''
      }
      
      const res = await repaymentApi.pay(currentRepayment!.id!, data)
      if (res.data.success) {
        message.success('还款成功')
        setPayModalVisible(false)
        loadData()
      }
    } catch (error: any) {
      if (error.errorFields) return
      message.error(error.response?.data?.message || '还款失败')
    }
  }

  const handleExtendSubmit = async () => {
    try {
      const values = await extendForm.validateFields()
      
      const res = await repaymentApi.extend(currentRepayment!.id!, {
        extension_days: values.extension_days,
        extension_reason: values.extension_reason
      })
      if (res.data.success) {
        message.success('展期成功')
        setExtendModalVisible(false)
        loadData()
      }
    } catch (error: any) {
      if (error.errorFields) return
      message.error(error.response?.data?.message || '展期失败')
    }
  }

  const handleReduceSubmit = async () => {
    try {
      const values = await reduceForm.validateFields()
      
      const res = await repaymentApi.reduce(currentRepayment!.id!, {
        reduction_amount: values.reduction_amount,
        reduction_reason: values.reduction_reason
      })
      if (res.data.success) {
        message.success('减免成功')
        setReduceModalVisible(false)
        loadData()
      }
    } catch (error: any) {
      if (error.errorFields) return
      message.error(error.response?.data?.message || '减免失败')
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending': return <Tag color="orange">待还款</Tag>
      case 'partial': return <Tag color="blue">部分还款</Tag>
      case 'paid': return <Tag color="green">已结清</Tag>
      case 'overdue': return <Tag color="red">已逾期</Tag>
      case 'cancelled': return <Tag color="default">已取消</Tag>
      default: return <Tag>{status}</Tag>
    }
  }

  const columns = [
    { title: '还款单号', dataIndex: 'repayment_no', key: 'repayment_no', width: 160 },
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 140 },
    { title: '农户', dataIndex: 'farmer_name', key: 'farmer_name', width: 100 },
    { 
      title: '总金额', 
      dataIndex: 'total_amount', 
      key: 'total_amount',
      width: 120,
      render: (v: number) => `¥${v.toFixed(2)}`
    },
    { 
      title: '已还金额', 
      dataIndex: 'paid_amount', 
      key: 'paid_amount',
      width: 120,
      render: (v: number) => `¥${v.toFixed(2)}`
    },
    { 
      title: '剩余金额', 
      dataIndex: 'remaining_amount', 
      key: 'remaining_amount',
      width: 120,
      render: (v: number, record: Repayment) => record.is_overdue ? <span style={{ color: '#ff4d4f' }}>¥{v.toFixed(2)}</span> : `¥${v.toFixed(2)}`
    },
    { title: '到期日', dataIndex: 'due_date', key: 'due_date', width: 120 },
    { 
      title: '逾期', 
      dataIndex: 'is_overdue', 
      key: 'is_overdue',
      width: 100,
      render: (v: number, record: Repayment) => v ? <Tag color="red">逾期{record.overdue_days}天</Tag> : <Tag color="green">正常</Tag>
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: getStatusTag },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Repayment) => (
        <Space>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>详情</Button>
          {record.status !== 'paid' && record.status !== 'cancelled' && (
            <Button size="small" type="link" icon={<PayCircleOutlined />} onClick={() => handlePay(record)}>还款</Button>
          )}
          {record.status !== 'paid' && record.status !== 'cancelled' && (
            <Button size="small" type="link" icon={<ReloadOutlined />} onClick={() => handleExtend(record)}>展期</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card 
        title="还款管理" 
        size="small"
        extra={
          <Space>
            <Select
              placeholder="状态筛选"
              style={{ width: 120 }}
              allowClear
              value={statusFilter || undefined}
              onChange={(value) => { setStatusFilter(value); setPage(1) }}
            >
              <Option value="pending">待还款</Option>
              <Option value="partial">部分还款</Option>
              <Option value="paid">已结清</Option>
              <Option value="overdue">已逾期</Option>
            </Select>
            <Select
              placeholder="逾期筛选"
              style={{ width: 120 }}
              allowClear
              value={overdueFilter || undefined}
              onChange={(value) => { setOverdueFilter(value); setPage(1) }}
            >
              <Option value="1">已逾期</Option>
              <Option value="0">未逾期</Option>
            </Select>
            <Button icon={<MinusCircleOutlined />} onClick={() => {
              if (currentRepayment) handleReduce(currentRepayment)
            }}>
              减免
            </Button>
            <Button type="primary" icon={<PayCircleOutlined />} onClick={handleCheckOverdue}>
              检测逾期
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={repayments}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
        />
      </Card>

      <Modal
        title="还款"
        open={payModalVisible}
        onCancel={() => setPayModalVisible(false)}
        onOk={handlePaySubmit}
        width={500}
        destroyOnClose
      >
        {currentRepayment && (
          <Alert
            message={`剩余待还金额：¥${currentRepayment.remaining_amount.toFixed(2)}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={payForm} layout="vertical">
          <Form.Item name="amount" label="还款金额" rules={[{ required: true, message: '请输入还款金额' }]}>
            <InputNumber 
              min={0} 
              style={{ width: '100%' }} 
              max={currentRepayment?.remaining_amount}
              formatter={(value) => `¥ ${value}`}
              parser={(value) => value?.replace(/[^\d.]/g, '') as any}
            />
          </Form.Item>
          <Form.Item name="payment_method" label="还款方式" rules={[{ required: true, message: '请选择还款方式' }]}>
            <Select>
              <Option value="现金">现金</Option>
              <Option value="银行转账">银行转账</Option>
              <Option value="微信">微信</Option>
              <Option value="支付宝">支付宝</Option>
            </Select>
          </Form.Item>
          <Form.Item name="payment_date" label="还款日期" rules={[{ required: true, message: '请选择还款日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="operator" label="经办人">
            <Input placeholder="请输入经办人" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="展期"
        open={extendModalVisible}
        onCancel={() => setExtendModalVisible(false)}
        onOk={handleExtendSubmit}
        width={500}
        destroyOnClose
      >
        {currentRepayment && (
          <Alert
            message={`当前到期日：${currentRepayment.due_date}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={extendForm} layout="vertical">
          <Form.Item name="extension_days" label="展期天数" rules={[{ required: true, message: '请输入展期天数' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="extension_reason" label="展期原因" rules={[{ required: true, message: '请输入展期原因' }]}>
            <Input.TextArea rows={3} placeholder="请输入展期原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="减免"
        open={reduceModalVisible}
        onCancel={() => setReduceModalVisible(false)}
        onOk={handleReduceSubmit}
        width={500}
        destroyOnClose
      >
        {currentRepayment && (
          <Alert
            message={`剩余待还金额：¥${currentRepayment.remaining_amount.toFixed(2)}`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={reduceForm} layout="vertical">
          <Form.Item name="reduction_amount" label="减免金额" rules={[{ required: true, message: '请输入减免金额' }]}>
            <InputNumber 
              min={0} 
              style={{ width: '100%' }} 
              max={currentRepayment?.remaining_amount}
              formatter={(value) => `¥ ${value}`}
              parser={(value) => value?.replace(/[^\d.]/g, '') as any}
            />
          </Form.Item>
          <Form.Item name="reduction_reason" label="减免原因" rules={[{ required: true, message: '请输入减免原因' }]}>
            <Input.TextArea rows={3} placeholder="请输入减免原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="还款详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentRepayment && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="还款单号">{currentRepayment.repayment_no}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentRepayment.status)}</Descriptions.Item>
              <Descriptions.Item label="订单号">{currentRepayment.order_no}</Descriptions.Item>
              <Descriptions.Item label="农户">{currentRepayment.farmer_name}</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{currentRepayment.total_amount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="已还金额">¥{currentRepayment.paid_amount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="剩余金额">¥{currentRepayment.remaining_amount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="到期日">{currentRepayment.due_date}</Descriptions.Item>
              <Descriptions.Item label="是否逾期">
                {currentRepayment.is_overdue ? <Tag color="red">逾期{currentRepayment.overdue_days}天</Tag> : '否'}
              </Descriptions.Item>
              <Descriptions.Item label="展期天数">{currentRepayment.extension_days || 0}天</Descriptions.Item>
              <Descriptions.Item label="减免金额">¥{currentRepayment.reduction_amount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="实际结清日">{currentRepayment.actual_paid_date || '-'}</Descriptions.Item>
            </Descriptions>

            {currentRepayment.extension_reason && (
              <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="展期原因">{currentRepayment.extension_reason}</Descriptions.Item>
              </Descriptions>
            )}

            {currentRepayment.reduction_reason && (
              <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="减免原因">{currentRepayment.reduction_reason}</Descriptions.Item>
              </Descriptions>
            )}

            {currentRepayment.records && currentRepayment.records.length > 0 && (
              <>
                <Divider orientation="left">还款记录</Divider>
                <Timeline
                  items={currentRepayment.records.map(record => ({
                    color: 'green',
                    children: (
                      <div>
                        <div><strong>¥{record.amount.toFixed(2)}</strong> - {record.payment_method}</div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {record.payment_date} {record.operator && `| 经办人: ${record.operator}`}
                        </div>
                        {record.notes && <div style={{ fontSize: 12 }}>{record.notes}</div>}
                      </div>
                    )
                  }))}
                />
              </>
            )}

            {currentRepayment.notes && (
              <>
                <Divider orientation="left">备注</Divider>
                <p>{currentRepayment.notes}</p>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Repayments
