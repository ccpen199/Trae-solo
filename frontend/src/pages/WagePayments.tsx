填写表单 → 点击预览 → 校验通过 → 展示预览Modal(Descriptions结构化展示) → 确认发布 → 
调用创建API → 成功提示 → 后台自动触发AI审核 → 1.5秒后跳转到招工详情页填写表单 → 点击预览 → 校验通过 → 展示预览Modal(Descriptions结构化展示) → 确认发布 → 
调用创建API → 成功提示 → 后台自动触发AI审核 → 1.5秒后跳转到招工详情页填写表单 → 点击预览 → 校验通过 → 展示预览Modal(Descriptions结构化展示) → 确认发布 → 
调用创建API → 成功提示 → 后台自动触发AI审核 → 1.5秒后跳转到招工详情页填写表单 → 点击预览 → 校验通过 → 展示预览Modal(Descriptions结构化展示) → 确认发布 → 
调用创建API → 成功提示 → 后台自动触发AI审核 → 1.5秒后跳转到招工详情页填写表单 → 点击预览 → 校验通过 → 展示预览Modal(Descriptions结构化展示) → 确认发布 → 
调用创建API → 成功提示 → 后台自动触发AI审核 → 1.5秒后跳转到招工详情页填写表单 → 点击预览 → 校验通过 → 展示预览Modal(Descriptions结构化展示) → 确认发布 → 
调用创建API → 成功提示 → 后台自动触发AI审核 → 1.5秒后跳转到招工详情页填写表单 → 点击预览 → 校验通过 → 展示预览Modal(Descriptions结构化展示) → 确认发布 → 
调用创建API → 成功提示 → 后台自动触发AI审核 → 1.5秒后跳转到招工详情页填写表单 → 点击预览 → 校验通过 → 展示预览Modal(Descriptions结构化展示) → 确认发布 → 
调用创建API → 成功提示 → 后台自动触发AI审核 → 1.5秒后跳转到招工详情页填写表单 → 点击预览 → 校验通过 → 展示预览Modal(Descriptions结构化展示) → 确认发布 → 
调用创建API → 成功提示 → 后台自动触发AI审核 → 1.5秒后跳转到招工详情页填写表单 → 点击预览 → 校验通过 → 展示预览Modal(Descriptions结构化展示) → 确认发布 → 
调用创建API → 成功提示 → 后台自动触发AI审核 → 1.5秒后跳转到招工详情页填写表单 → 点击预览 → 校验通过 → 展示预览Modal(Descriptions结构化展示) → 确认发布 → 
调用创建API → 成功提示 → 后台自动触发AI审核 → 1.5秒后跳转到招工详情页填写表单 → 点击预览 → 校验通过 → 展示预览Modal(Descriptions结构化展示) → 确认发布 → 
调用创建API → 成功提示 → 后台自动触发AI审核 → 1.5秒后跳转到招工详情页import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Table,
  Tag,
  Button,
  Select,
  Modal,
  Form,
  InputNumber,
  Input,
  DatePicker,
  message,
  Spin,
  Alert,
  Row,
  Col,
  Tooltip,
} from 'antd'
import { PlusOutlined, CheckCircleOutlined, CheckCircleFilled, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { api } from '@/api'
import type { WagePayment, Contract, Worker, Employer } from '@/types'

const { Option } = Select
const { TextArea } = Input

interface WagePaymentListItem extends Omit<WagePayment, 'contractId' | 'workerId' | 'employerId' | 'paymentDate' | 'paymentMethod' | 'workDays' | 'supervisoryRecorded'> {
  contract_id: number
  worker_id: number
  employer_id: number
  payment_date: string
  payment_method: string
  work_days: number
  supervisory_recorded: number
  worker_name: string
  employer_name: string
  contract_number: string
}

export default function WagePayments() {
  const [searchParams] = useSearchParams()
  const isMyView = searchParams.get('filter') === 'my'
  const currentEmployerId = 1

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payments, setPayments] = useState<WagePaymentListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [contractId, setContractId] = useState<number | null>(null)
  const [workerId, setWorkerId] = useState<number | null>(null)
  const [employerId, setEmployerId] = useState<number | null>(isMyView ? currentEmployerId : null)
  const [status, setStatus] = useState<string | null>(null)
  const [supervisoryRecorded, setSupervisoryRecorded] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [employers, setEmployers] = useState<Employer[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    fetchContracts()
    fetchWorkers()
    fetchEmployers()
  }, [])

  useEffect(() => {
    setEmployerId(isMyView ? currentEmployerId : null)
    setPage(1)
  }, [isMyView])

  useEffect(() => {
    fetchPayments()
  }, [page, contractId, workerId, employerId, status, supervisoryRecorded])

  const fetchContracts = async () => {
    try {
      const res = await api.getContracts({ pageSize: 100 })
      if (res.code === 0) {
        setContracts(res.data.list || [])
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err)
    }
  }

  const fetchWorkers = async () => {
    try {
      const res = await api.getWorkers({ pageSize: 100 })
      if (res.code === 0) {
        setWorkers(res.data.list || [])
      }
    } catch (err) {
      console.error('Failed to fetch workers:', err)
    }
  }

  const fetchEmployers = async () => {
    try {
      const res = await api.getEmployers({ pageSize: 100 })
      if (res.code === 0) {
        setEmployers(res.data.list || [])
      }
    } catch (err) {
      console.error('Failed to fetch employers:', err)
    }
  }

  const fetchPayments = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = { page, pageSize }
      if (contractId) params.contractId = contractId
      if (workerId) params.workerId = workerId
      if (employerId) params.employerId = employerId
      if (status) params.status = status
      if (supervisoryRecorded !== null) params.supervisoryRecorded = supervisoryRecorded

      const res = await api.getWagePayments(params)
      if (res.code === 0) {
        setPayments(res.data.list || [])
        setTotal(res.data.total || 0)
      } else {
        setError(res.message || '获取支付记录失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        paymentDate: values.paymentDate ? values.paymentDate.format('YYYY-MM-DD') : undefined,
      }
      const res = await api.createWagePayment(submitData)
      if (res.code === 0) {
        message.success('登记支付成功')
        setModalVisible(false)
        fetchPayments()
      } else {
        message.error(res.message || '登记失败')
      }
    } catch (err: any) {
      if (err.errorFields) return
      message.error(err.message || '提交失败')
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await api.updateWagePaymentStatus(id, newStatus)
      if (res.code === 0) {
        message.success('状态更新成功')
        fetchPayments()
      } else {
        message.error(res.message || '更新失败')
      }
    } catch (err: any) {
      message.error(err.message || '更新失败')
    }
  }

  const handleMarkSupervisory = async (id: number) => {
    try {
      const payment = payments.find(p => p.id === id)
      if (!payment) return
      const res = await api.updateWagePaymentStatus(id, payment.status)
      if (res.code === 0) {
        message.success('标记监管成功')
        fetchPayments()
      } else {
        message.error(res.message || '标记失败')
      }
    } catch (err: any) {
      message.error(err.message || '标记失败')
    }
  }

  const getPaymentNumber = (id: number) => {
    return `ZF${String(id).padStart(8, '0')}`
  }

  const statusMap: Record<string, { color: string; text: string }> = {
    pending: { color: 'orange', text: '待支付' },
    paid: { color: 'green', text: '已支付' },
    overdue: { color: 'red', text: '已逾期' },
    disputed: { color: 'gold', text: '有争议' },
  }

  const paymentMethodMap: Record<string, string> = {
    bank_transfer: '银行转账',
    cash: '现金',
    alipay: '支付宝',
    wechat: '微信支付',
    other: '其他',
  }

  const renderSupervisoryIcon = (val: number) => {
    if (val === 1) {
      return (
        <Tooltip title="已监管">
          <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />
        </Tooltip>
      )
    }
    return (
      <Tooltip title="未监管">
        <ClockCircleOutlined style={{ color: '#bfbfbf', fontSize: 18 }} />
      </Tooltip>
    )
  }

  const columns = [
    { title: '支付单号', dataIndex: 'payment_number', key: 'payment_number', width: 140, render: (_: unknown, record: WagePaymentListItem) => getPaymentNumber(record.id) },
    { title: '工人', dataIndex: 'worker_name', key: 'worker_name', width: 100 },
    { title: '雇主', dataIndex: 'employer_name', key: 'employer_name', width: 150, ellipsis: true },
    { title: '合同号', dataIndex: 'contract_number', key: 'contract_number', width: 180 },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 120, render: (val: number) => `¥${val.toLocaleString()}` },
    { title: '工天', dataIndex: 'work_days', key: 'work_days', width: 80 },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 120,
      render: (val: string) => paymentMethodMap[val] || val,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => {
        const info = statusMap[s] || statusMap.pending
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '是否监管',
      dataIndex: 'supervisory_recorded',
      key: 'supervisory_recorded',
      width: 100,
      align: 'center' as const,
      render: (val: number) => renderSupervisoryIcon(val),
    },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 150, ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_: unknown, record: WagePaymentListItem) => (
        <>
          {record.supervisory_recorded !== 1 && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleMarkSupervisory(record.id)}
            >
              标记监管
            </Button>
          )}
          {record.status === 'pending' && (
            <Button
              type="link"
              onClick={() => handleUpdateStatus(record.id, 'paid')}
            >
              标记已支付
            </Button>
          )}
          {record.status === 'pending' && (
            <Button
              type="link"
              danger
              onClick={() => handleUpdateStatus(record.id, 'overdue')}
            >
              标记逾期
            </Button>
          )}
        </>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{isMyView ? '我的工资支付' : '工资支付监管'}</h2>
        {isMyView && (
          <span style={{ color: '#8c8c8c', marginLeft: 12 }}>
            查看工资支付、购买/支付确认和欠薪风险预警。
          </span>
        )}
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          登记支付
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Select
            placeholder="选择合同"
            allowClear
            style={{ width: '100%' }}
            value={contractId}
            onChange={(v) => { setContractId(v); setPage(1) }}
            showSearch
            optionFilterProp="children"
          >
            {contracts.map(c => (
              <Option key={c.id} value={c.id}>
                {(c as any).contract_number || c.contractNumber || `合同#${c.id}`}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="选择工人"
            allowClear
            style={{ width: '100%' }}
            value={workerId}
            onChange={(v) => { setWorkerId(v); setPage(1) }}
            showSearch
            optionFilterProp="children"
          >
            {workers.map(w => (
              <Option key={w.id} value={w.id}>{w.name}</Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="选择状态"
            allowClear
            style={{ width: '100%' }}
            value={status}
            onChange={(v) => { setStatus(v); setPage(1) }}
          >
            <Option value="pending">待支付</Option>
            <Option value="paid">已支付</Option>
            <Option value="overdue">已逾期</Option>
            <Option value="disputed">有争议</Option>
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="是否监管"
            allowClear
            style={{ width: '100%' }}
            value={supervisoryRecorded}
            onChange={(v) => { setSupervisoryRecorded(v); setPage(1) }}
          >
            <Option value="1">已监管</Option>
            <Option value="0">未监管</Option>
          </Select>
        </Col>
      </Row>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={payments}
          rowKey="id"
          scroll={{ x: 1500 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => setPage(p),
          }}
        />
      </Spin>

      <Modal
        title="登记支付"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText="提交"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contractId"
                label="合同"
                rules={[{ required: true, message: '请选择合同' }]}
              >
                <Select placeholder="请选择合同" showSearch optionFilterProp="children">
                  {contracts.map(c => (
                    <Option key={c.id} value={c.id}>
                      {(c as any).contract_number || c.contractNumber || `合同#${c.id}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="workerId"
                label="工人"
                rules={[{ required: true, message: '请选择工人' }]}
              >
                <Select placeholder="请选择工人" showSearch optionFilterProp="children">
                  {workers.map(w => (
                    <Option key={w.id} value={w.id}>{w.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="employerId"
                label="雇主"
                rules={[{ required: true, message: '请选择雇主' }]}
              >
                <Select placeholder="请选择雇主" showSearch optionFilterProp="children">
                  {employers.map(e => (
                    <Option key={e.id} value={e.id}>{e.companyName}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="金额"
                rules={[{ required: true, message: '请输入金额' }]}
              >
                <InputNumber min={0} placeholder="请输入金额" style={{ width: '100%' }} prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="paymentDate"
                label="支付日期"
                initialValue={dayjs()}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="paymentMethod"
                label="支付方式"
                initialValue="bank_transfer"
              >
                <Select placeholder="请选择支付方式">
                  <Option value="bank_transfer">银行转账</Option>
                  <Option value="cash">现金</Option>
                  <Option value="alipay">支付宝</Option>
                  <Option value="wechat">微信支付</Option>
                  <Option value="other">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="workDays"
                label="工天"
                initialValue={0}
              >
                <InputNumber min={0} placeholder="工天" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                initialValue="pending"
              >
                <Select placeholder="请选择状态">
                  <Option value="pending">待支付</Option>
                  <Option value="paid">已支付</Option>
                  <Option value="overdue">已逾期</Option>
                  <Option value="disputed">有争议</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="remark"
                label="备注"
              >
                <TextArea placeholder="请输入备注" rows={1} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
