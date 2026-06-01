import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, InputNumber, Space, Tag, message, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import api from '../utils/api'

const { Option } = Select
const { TextArea } = Input

export default function Resources() {
  const [resources, setResources] = useState([])
  const [floors, setFloors] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [form] = Form.useForm()
  const [filterType, setFilterType] = useState()

  useEffect(() => {
    loadData()
  }, [filterType])

  const loadData = async () => {
    setLoading(true)
    try {
      const [resourcesData, floorsData] = await Promise.all([
        api.resources({ type: filterType }),
        api.floors()
      ])
      setResources(resourcesData)
      setFloors(floorsData)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values) => {
    try {
      if (editingResource) {
        await api.updateResource(editingResource.id, values)
        message.success('更新成功')
      } else {
        await api.createResource(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (e) {
      message.error(e.response?.data?.error || '操作失败')
    }
  }

  const openModal = (record = null) => {
    setEditingResource(record)
    form.setFieldsValue(record || {})
    setModalVisible(true)
  }

  const typeLabels = { desk: '工位', office: '办公室', meeting_room: '会议室' }
  const statusColors = { available: 'green', maintenance: 'orange', occupied: 'red' }
  const statusLabels = { available: '可用', maintenance: '维修中', occupied: '已占用' }

  const columns = [
    { title: '资源名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t) => typeLabels[t] },
    { title: '楼层', dataIndex: 'floor_name', key: 'floor_name' },
    { title: '容量', dataIndex: 'capacity', key: 'capacity' },
    { title: '时价', dataIndex: 'price_hourly', key: 'price_hourly', render: v => v ? `¥${v}` : '-' },
    { title: '日价', dataIndex: 'price_daily', key: 'price_daily', render: v => v ? `¥${v}` : '-' },
    { title: '月租', dataIndex: 'price_monthly', key: 'price_monthly', render: v => v ? `¥${v}` : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
    { title: '操作', key: 'action', render: (_, record) => (
      <Button type="link" icon={<EditOutlined />} onClick={() => openModal(record)}>编辑</Button>
    )}
  ]

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <h2>空间资源</h2>
        </Col>
        <Col>
          <Space>
            <Select value={filterType} onChange={setFilterType} style={{ width: 120 }} allowClear placeholder="资源类型">
              <Option value="desk">工位</Option>
              <Option value="office">办公室</Option>
              <Option value="meeting_room">会议室</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>添加资源</Button>
          </Space>
        </Col>
      </Row>

      <Table
        dataSource={resources}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingResource ? '编辑资源' : '添加资源'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="资源类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="desk">工位</Option>
                  <Option value="office">办公室</Option>
                  <Option value="meeting_room">会议室</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="资源名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="floor_id" label="楼层" rules={[{ required: true }]}>
                <Select>
                  {floors.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="capacity" label="容量" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="price_hourly" label="小时价格">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price_daily" label="日价格">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price_monthly" label="月价格">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select>
              <Option value="available">可用</Option>
              <Option value="maintenance">维修中</Option>
              <Option value="occupied">已占用</Option>
            </Select>
          </Form.Item>
          <Form.Item name="equipment" label="设备">
            <Input placeholder="如: 投影仪,白板,视频会议" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
