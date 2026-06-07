import { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Modal, Form, Input, Select, Typography, Spin, message } from 'antd'
import { SoundOutlined } from '@ant-design/icons'
import request from '../../utils/request'

const { Title } = Typography
const { TextArea } = Input

const statusMap = {
  pending: { color: 'orange', text: '待仲裁' },
  processing: { color: 'blue', text: '仲裁中' },
  resolved: { color: 'green', text: '已解决' },
  rejected: { color: 'red', text: '已驳回' }
}

const resultOptions = [
  { value: 'worker_win', label: '求职者胜诉' },
  { value: 'employer_win', label: '雇主胜诉' },
  { value: 'compromise', label: '协商解决' },
  { value: 'rejected', label: '驳回' }
]

export default function ArbitratePage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [resolving, setResolving] = useState(false)
  const [resolveForm] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const fetchRecords = async (page = 1) => {
    setLoading(true)
    try {
      const res = await request.get('/admin/arbitrate', { params: { page, pageSize: pagination.pageSize } })
      const data = res.data || res
      setRecords(data.list || data.records || data.items || [])
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

  const handleResolve = async () => {
    try {
      const values = await resolveForm.validateFields()
      setResolving(true)
      await request.put(`/admin/arbitrate/${currentRecord.id}`, values)
      message.success('仲裁结果已提交')
      setResolveModalOpen(false)
      resolveForm.resetFields()
      setCurrentRecord(null)
      fetchRecords(pagination.current)
    } catch (e) {
      // handled by interceptor
    } finally {
      setResolving(false)
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
      title: '订单编号',
      dataIndex: 'order_id',
      key: 'order_id',
      width: 100
    },
    {
      title: '争议原因',
      dataIndex: 'reason',
      key: 'reason',
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
      title: '仲裁结果',
      dataIndex: 'result',
      key: 'result',
      width: 120,
      render: (val) => {
        const opt = resultOptions.find((o) => o.value === val)
        return opt ? opt.label : (val || '-')
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val) => val ? new Date(val).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) =>
        record.status === 'pending' || record.status === 'processing' ? (
          <Button
            size="small"
            type="primary"
            onClick={() => { setCurrentRecord(record); setResolveModalOpen(true) }}
          >
            仲裁
          </Button>
        ) : (
          <Tag color="default">已处理</Tag>
        )
    }
  ]

  return (
    <div>
      <Card title={<><SoundOutlined /> 仲裁管理</>}>
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
        title="仲裁处理"
        open={resolveModalOpen}
        onOk={handleResolve}
        onCancel={() => { setResolveModalOpen(false); resolveForm.resetFields(); setCurrentRecord(null) }}
        okText="提交结果"
        cancelText="取消"
        confirmLoading={resolving}
      >
        <Form form={resolveForm} layout="vertical">
          <Form.Item name="result" label="仲裁结果" rules={[{ required: true, message: '请选择仲裁结果' }]}>
            <Select options={resultOptions} placeholder="请选择仲裁结果" />
          </Form.Item>
          <Form.Item name="remark" label="仲裁说明" rules={[{ required: true, message: '请输入仲裁说明' }]}>
            <TextArea rows={4} placeholder="请输入仲裁说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
