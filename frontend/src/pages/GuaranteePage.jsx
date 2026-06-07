import { useState, useEffect } from 'react'
import { Card, Form, Input, Select, Button, Table, Tag, Modal, message } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import request from '../utils/request'

const { TextArea } = Input

const typeOptions = [
  { value: 'wage_arrears', label: '欠薪' },
  { value: 'unsafe_condition', label: '不安全工作环境' },
  { value: 'contract_violation', label: '合同违约' },
  { value: 'discrimination', label: '歧视' },
  { value: 'other', label: '其他' }
]

const statusMap = {
  pending: { color: 'orange', text: '待处理' },
  processing: { color: 'blue', text: '处理中' },
  resolved: { color: 'green', text: '已解决' },
  rejected: { color: 'red', text: '已驳回' }
}

export default function GuaranteePage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formVisible, setFormVisible] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [form] = Form.useForm()

  const fetchRecords = async (page = 1) => {
    setLoading(true)
    try {
      const res = await request.get('/guarantees', { params: { page, pageSize: pagination.pageSize } })
      const data = res.data || res
      setRecords(data.list || data.guarantees || data.items || [])
      setPagination((prev) => ({ ...prev, current: page, total: data.total || 0 }))
    } catch (e) {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords(1)
  }, [])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await request.post('/guarantees', values)
      message.success('保障申请已提交')
      setFormVisible(false)
      form.resetFields()
      fetchRecords(1)
    } catch (e) {
      // handled by interceptor
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      title: '编号',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const opt = typeOptions.find((o) => o.value === type)
        return opt ? opt.label : type
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const s = statusMap[status] || { color: 'default', text: status }
        return <Tag color={s.color}>{s.text}</Tag>
      }
    },
    {
      title: '处理结果',
      dataIndex: 'result',
      key: 'result',
      ellipsis: true,
      render: (val) => val || '-'
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val) => val ? new Date(val).toLocaleString('zh-CN') : '-'
    }
  ]

  return (
    <div>
      <Card
        title={<><SafetyCertificateOutlined /> 权益保障</>}
        extra={
          <Button type="primary" onClick={() => setFormVisible(true)}>
            提交保障申请
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={records}
          loading={loading}
          pagination={{
            ...pagination,
            onChange: fetchRecords,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      <Modal
        title="提交保障申请"
        open={formVisible}
        onOk={handleSubmit}
        onCancel={() => { setFormVisible(false); form.resetFields() }}
        okText="提交"
        cancelText="取消"
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="问题类型" rules={[{ required: true, message: '请选择问题类型' }]}>
            <Select options={typeOptions} placeholder="请选择问题类型" />
          </Form.Item>
          <Form.Item name="order_id" label="关联订单编号">
            <Input placeholder="请输入订单编号（可选）" />
          </Form.Item>
          <Form.Item name="description" label="问题描述" rules={[{ required: true, message: '请输入问题描述' }]}>
            <TextArea rows={4} placeholder="请详细描述您遇到的问题" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
