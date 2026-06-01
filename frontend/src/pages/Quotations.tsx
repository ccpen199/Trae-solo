import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm, Tag, Space, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { quotationsApi } from '../api'

const { TextArea } = Input

function Quotations() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await quotationsApi.list({ page: pagination.current, pageSize: pagination.pageSize })
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
      const data = {
        ...values,
        valid_from: values.valid_from?.format('YYYY-MM-DD'),
        valid_until: values.valid_until?.format('YYYY-MM-DD'),
      }
      if (editingItem) {
        await quotationsApi.update(editingItem.id, data)
        message.success('更新成功')
      } else {
        await quotationsApi.create(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleLock = async (id: number) => {
    try {
      await quotationsApi.lock(id, { locked_by: 'system' })
      message.success('锁定成功')
      loadData()
    } catch (error) {
      message.error('锁定失败')
    }
  }

  const handleEdit = (record: any) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      valid_from: dayjs(record.valid_from),
      valid_until: dayjs(record.valid_until),
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await quotationsApi.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: '报价单号', dataIndex: 'quotation_no', key: 'quotation_no' },
    { title: '船公司', dataIndex: 'shipping_line', key: 'shipping_line' },
    { title: '运价', dataIndex: 'freight_rate', key: 'freight_rate' },
    { title: '币种', dataIndex: 'currency', key: 'currency' },
    { title: '有效期起', dataIndex: 'valid_from', key: 'valid_from' },
    { title: '有效期止', dataIndex: 'valid_until', key: 'valid_until' },
    {
      title: '已锁定',
      dataIndex: 'is_locked',
      key: 'is_locked',
      render: (v: boolean) => v ? <Tag color="green">是</Tag> : '否',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'confirmed' ? 'green' : status === 'draft' ? 'default' : 'blue'}>{status}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {!record.is_locked && (
            <>
              <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
              <Button type="link" icon={<LockOutlined />} onClick={() => handleLock(record.id)}>锁定</Button>
              <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
                <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>报价管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setModalVisible(true); }}>
          新增报价
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
        title={editingItem ? '编辑报价单' : '新增报价单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="shipping_line" label="船公司" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currency" label="币种" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="USD">USD</Select.Option>
                  <Select.Option value="RMB">RMB</Select.Option>
                  <Select.Option value="EUR">EUR</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="freight_rate" label="运价" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="inquiry_id" label="关联询价单">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="valid_from" label="有效期起" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valid_until" label="有效期止" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
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
          <Form.Item name="surcharges" label="附加费">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="local_charges" label="本地费用">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Quotations
