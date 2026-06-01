import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Tag, Space, Row, Col, Collapse } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import { blApi } from '../api'

const { TextArea } = Input
const { Panel } = Collapse

function BLPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [revisions, setRevisions] = useState([])
  const [showRevisions, setShowRevisions] = useState(false)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await blApi.list({ page: pagination.current, pageSize: pagination.pageSize })
      setData(res.data?.data || [])
      setPagination(prev => ({ ...prev, total: res.data?.pagination?.total || 0 }))
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingItem) {
        await blApi.update(editingItem.id, values)
        message.success('更新成功')
      } else {
        await blApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleConfirm = async (id: number) => {
    try {
      await blApi.confirm(id, { confirmed_by: 'customer' })
      message.success('确认成功')
      loadData()
    } catch (error) {
      message.error('确认失败')
    }
  }

  const handleEdit = (record: any) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleViewRevisions = async (id: number) => {
    try {
      const res = await blApi.revisions(id)
      setRevisions(res.data?.data || [])
      setShowRevisions(true)
    } catch (error) {
      message.error('加载历史失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await blApi.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: '提单号', dataIndex: 'bl_no', key: 'bl_no' },
    { title: '发货人', dataIndex: 'shipper', key: 'shipper', ellipsis: true },
    { title: '收货人', dataIndex: 'consignee', key: 'consignee', ellipsis: true },
    { title: '通知方', dataIndex: 'notify_party', key: 'notify_party', ellipsis: true },
    { title: '放单方式', dataIndex: 'release_type', key: 'release_type' },
    {
      title: '客户已确认',
      dataIndex: 'customer_confirmed',
      key: 'customer_confirmed',
      render: (v: boolean) => v ? <Tag color="green">是</Tag> : '否',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          draft: 'default',
          pending: 'orange',
          confirmed: 'green',
        }
        return <Tag color={colorMap[status]}>{status}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" onClick={() => handleViewRevisions(record.id)}>历史</Button>
          {!record.customer_confirmed && (
            <Button type="link" icon={<CheckOutlined />} onClick={() => handleConfirm(record.id)}>确认</Button>
          )}
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>提单资料</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setModalVisible(true); }}>
          新增提单
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
        }}
      />
      <Modal
        title={editingItem ? '编辑提单' : '新增提单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="booking_id" label="关联订舱单ID">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="release_type" label="放单方式">
                <Select>
                  <Select.Option value="正本提单">正本提单</Select.Option>
                  <Select.Option value="电放">电放</Select.Option>
                  <Select.Option value="Sea Waybill">Sea Waybill</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="shipper" label="发货人" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="consignee" label="收货人" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="notify_party" label="通知方">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="marks" label="唛头">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="description" label="货物描述">
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Select.Option value="draft">草稿</Select.Option>
                  <Select.Option value="pending">待确认</Select.Option>
                  <Select.Option value="confirmed">已确认</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remarks" label="备注">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提单修改历史"
        open={showRevisions}
        onCancel={() => setShowRevisions(false)}
        footer={null}
        width={900}
      >
        <Collapse accordion>
          {revisions.map((rev: any, idx: number) => (
            <Panel header={`版本 ${rev.version} - ${new Date(rev.created_at).toLocaleString()}`} key={idx}>
              <p><strong>修改人:</strong> {rev.changed_by || 'system'}</p>
              <p><strong>变更原因:</strong> {rev.reason || '-'}</p>
              <p><strong>内容快照:</strong></p>
              <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4 }}>{rev.content}</pre>
            </Panel>
          ))}
          {revisions.length === 0 && <p style={{ textAlign: 'center', padding: 20 }}>暂无修改历史</p>}
        </Collapse>
      </Modal>
    </div>
  )
}

export default BLPage
