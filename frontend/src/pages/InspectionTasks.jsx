import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Switch, Space, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { api } from '../utils/api'

function InspectionTasks() {
  const [tasks, setTasks] = useState([])
  const [products, setProducts] = useState([])
  const [stations, setStations] = useState([])
  const [cameras, setCameras] = useState([])
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [itemsModalVisible, setItemsModalVisible] = useState(false)
  const [currentTask, setCurrentTask] = useState(null)
  const [items, setItems] = useState([])
  const [form] = Form.useForm()
  const [itemForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksData, productsData, stationsData, camerasData, modelsData] = await Promise.all([
        api.getInspectionTasks(),
        api.getProducts(),
        api.getStations(),
        api.getCameras(),
        api.getModelVersions(),
      ])
      setTasks(tasksData)
      setProducts(productsData)
      setStations(stationsData)
      setCameras(camerasData)
      setModels(modelsData.filter(m => m.status === 'published'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values) => {
    try {
      await api.createInspectionTask(values)
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {
      message.error('创建失败: ' + (e.error || e.message))
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await api.updateTaskStatus(id, status ? 'enabled' : 'disabled')
      message.success('状态已更新')
      loadData()
    } catch (e) {
      message.error('更新失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteInspectionTask(id)
      message.success('删除成功')
      loadData()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const handleViewItems = async (task) => {
    setCurrentTask(task)
    const data = await api.getInspectionTask(task.id)
    setItems(data.items || [])
    setItemsModalVisible(true)
  }

  const handleAddItem = async (values) => {
    try {
      await api.createInspectionItem({ ...values, task_id: currentTask.id })
      message.success('添加成功')
      itemForm.resetFields()
      const data = await api.getInspectionTask(currentTask.id)
      setItems(data.items || [])
    } catch (e) {
      message.error('添加失败')
    }
  }

  const columns = [
    { title: '任务编号', dataIndex: 'code', key: 'code' },
    { title: '任务名称', dataIndex: 'name', key: 'name' },
    { title: '产品', dataIndex: 'product_name', key: 'product_name' },
    { title: '工位', dataIndex: 'station_name', key: 'station_name' },
    { title: '相机', dataIndex: 'camera_name', key: 'camera_name' },
    { 
      title: '模型版本', 
      dataIndex: 'model_version', 
      key: 'model_version',
      render: (v, r) => `${r.model_name} ${v}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v, r) => (
        <Switch
          checked={v === 'enabled'}
          onChange={(checked) => handleStatusChange(r.id, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleViewItems(r)}>
            检测项
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const itemColumns = [
    { title: '检测项名称', dataIndex: 'name', key: 'name' },
    { title: '缺陷类型', dataIndex: 'defect_type', key: 'defect_type' },
    { title: '阈值', dataIndex: 'threshold', key: 'threshold' },
    {
      title: '启用',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (v) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>,
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>检测任务管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建任务
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="新建检测任务"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="code" label="任务编号" rules={[{ required: true }]}>
            <Input placeholder="例如: TASK-A1-001" />
          </Form.Item>
          <Form.Item name="name" label="任务名称" rules={[{ required: true }]}>
            <Input placeholder="例如: A1站PCB正面检测" />
          </Form.Item>
          <Form.Item name="product_id" label="产品" rules={[{ required: true }]}>
            <Select>
              {products.map(p => (
                <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="station_id" label="工位" rules={[{ required: true }]}>
            <Select>
              {stations.map(s => (
                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="camera_id" label="相机" rules={[{ required: true }]}>
            <Select>
              {cameras.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="model_version_id" label="模型版本" rules={[{ required: true }]}>
            <Select>
              {models.map(m => (
                <Select.Option key={m.id} value={m.id}>{m.name} {m.version}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`检测项 - ${currentTask?.name}`}
        open={itemsModalVisible}
        onCancel={() => setItemsModalVisible(false)}
        width={800}
        footer={null}
      >
        <Form form={itemForm} layout="inline" onFinish={handleAddItem} style={{ marginBottom: 16 }}>
          <Form.Item name="name" rules={[{ required: true }]}>
            <Input placeholder="检测项名称" />
          </Form.Item>
          <Form.Item name="defect_type" rules={[{ required: true }]}>
            <Input placeholder="缺陷类型" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="threshold" rules={[{ required: true }]}>
            <Input type="number" step="0.01" min="0" max="1" placeholder="阈值" style={{ width: 100 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">添加</Button>
          </Form.Item>
        </Form>
        <Table columns={itemColumns} dataSource={items} rowKey="id" size="small" />
      </Modal>
    </div>
  )
}

export default InspectionTasks
