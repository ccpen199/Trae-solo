import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Space, Tag, Modal, Form, Input, Select, message, Typography, Popconfirm } from 'antd'
import { PlusOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { pathwayAPI } from '../api'

const { Title } = Typography
const { Option } = Select

function PathwayList() {
  const navigate = useNavigate()
  const [pathways, setPathways] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadPathways()
  }, [])

  const loadPathways = async () => {
    setLoading(true)
    try {
      const data = await pathwayAPI.getAll()
      setPathways(data)
    } catch (error) {
      message.error('加载路径列表失败')
    }
    setLoading(false)
  }

  const handleCreate = async (values) => {
    try {
      await pathwayAPI.create(values)
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      loadPathways()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handlePublish = async (id) => {
    try {
      await pathwayAPI.publish(id, { reviewed_by: 'admin' })
      message.success('发布成功')
      loadPathways()
    } catch (error) {
      message.error('发布失败')
    }
  }

  const columns = [
    { title: '路径名称', dataIndex: 'name', key: 'name' },
    { title: '疾病', dataIndex: 'disease', key: 'disease' },
    { title: '分期', dataIndex: 'stage', key: 'stage' },
    { title: '版本', dataIndex: 'version', key: 'version' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = { draft: 'default', pending: 'orange', published: 'green' }
        const textMap = { draft: '草稿', pending: '待审核', published: '已发布' }
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>
      },
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/pathways/${record.id}`)}>
            查看
          </Button>
          {record.status !== 'published' && (
            <Popconfirm title="确认发布此路径？" onConfirm={() => handlePublish(record.id)}>
              <Button type="link" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}>
                发布
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>路径库管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建路径
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={pathways}
        rowKey="id"
        loading={loading}
        className="card-shadow"
      />

      <Modal
        title="新建用药路径"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="路径名称" rules={[{ required: true }]}>
            <Input placeholder="请输入路径名称" />
          </Form.Item>
          <Form.Item name="disease" label="疾病名称" rules={[{ required: true }]}>
            <Input placeholder="请输入疾病名称" />
          </Form.Item>
          <Form.Item name="stage" label="分期">
            <Select placeholder="请选择分期">
              <Option value="轻度">轻度</Option>
              <Option value="中度">中度</Option>
              <Option value="重度">重度</Option>
              <Option value="普通型">普通型</Option>
            </Select>
          </Form.Item>
          <Form.Item name="version" label="版本号" rules={[{ required: true }]}>
            <Input placeholder="例如: v1.0" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} placeholder="请输入路径描述" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PathwayList
