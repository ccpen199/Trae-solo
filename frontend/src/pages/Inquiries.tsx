import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm, Tag, Space, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { inquiriesApi } from '../api'

const { TextArea } = Input

function Inquiries() {
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
      const res = await inquiriesApi.list({ page: pagination.current, pageSize: pagination.pageSize })
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
        valid_until: values.valid_until?.format('YYYY-MM-DD'),
        sailing_date: values.sailing_date?.format('YYYY-MM-DD'),
      }
      if (editingItem) {
        await inquiriesApi.update(editingItem.id, data)
        message.success('更新成功')
      } else {
        await inquiriesApi.create(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleEdit = (record: any) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      valid_until: dayjs(record.valid_until),
      sailing_date: record.sailing_date ? dayjs(record.sailing_date) : null,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await inquiriesApi.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: '询价单号', dataIndex: 'inquiry_no', key: 'inquiry_no' },
    { title: '客户', dataIndex: 'customer', key: 'customer' },
    { title: '起运港', dataIndex: 'origin_port', key: 'origin_port' },
    { title: '目的港', dataIndex: 'destination_port', key: 'destination_port' },
    { title: '箱型', dataIndex: 'container_type', key: 'container_type' },
    { title: '箱量', dataIndex: 'container_count', key: 'container_count' },
    { title: '货物类型', dataIndex: 'cargo_type', key: 'cargo_type' },
    {
      title: '危险品',
      dataIndex: 'is_dangerous',
      key: 'is_dangerous',
      render: (v: boolean) => v ? <Tag color="red">是</Tag> : '否',
    },
    {
      title: '冷藏货',
      dataIndex: 'is_refrigerated',
      key: 'is_refrigerated',
      render: (v: boolean) => v ? <Tag color="blue">是</Tag> : '否',
    },
    { title: '有效期', dataIndex: 'valid_until', key: 'valid_until' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'confirmed' ? 'green' : 'orange'}>{status}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
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
        <h2>询价管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setModalVisible(true); }}>
          新增询价
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
        title={editingItem ? '编辑询价单' : '新增询价单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer" label="客户" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cargo_type" label="货物类型" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="普货">普货</Select.Option>
                  <Select.Option value="危险品">危险品</Select.Option>
                  <Select.Option value="冷藏货">冷藏货</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="origin_port" label="起运港" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="destination_port" label="目的港" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="container_type" label="箱型" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="20GP">20GP</Select.Option>
                  <Select.Option value="40GP">40GP</Select.Option>
                  <Select.Option value="40HQ">40HQ</Select.Option>
                  <Select.Option value="45HQ">45HQ</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="container_count" label="箱量" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sailing_date" label="船期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="is_dangerous" label="是否危险品" valuePropName="checked">
                <Select>
                  <Select.Option value={false}>否</Select.Option>
                  <Select.Option value={true}>是</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dangerous_details" label="危险品详情">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="is_refrigerated" label="是否冷藏货" valuePropName="checked">
                <Select>
                  <Select.Option value={false}>否</Select.Option>
                  <Select.Option value={true}>是</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="refrigerated_details" label="冷藏要求">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="valid_until" label="有效期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Select.Option value="pending">待处理</Select.Option>
                  <Select.Option value="quoted">已报价</Select.Option>
                  <Select.Option value="confirmed">已确认</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="cargo_attributes" label="货物属性">
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

export default Inquiries
