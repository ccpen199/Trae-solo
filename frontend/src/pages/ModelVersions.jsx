import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, message, Space } from 'antd'
import { PlusOutlined, CloudUploadOutlined } from '@ant-design/icons'
import { api } from '../utils/api'

function ModelVersions() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.getModelVersions()
      setModels(data)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values) => {
    try {
      await api.createModelVersion({ ...values, status: 'draft' })
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {
      message.error('创建失败')
    }
  }

  const handlePublish = async (id) => {
    try {
      await api.publishModel(id)
      message.success('模型已发布')
      loadData()
    } catch (e) {
      message.error('发布失败')
    }
  }

  const columns = [
    { title: '模型名称', dataIndex: 'name', key: 'name' },
    { title: '版本号', dataIndex: 'version', key: 'version' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        const colors = { draft: 'default', published: 'green', archived: 'gray' }
        const labels = { draft: '草稿', published: '已发布', archived: '已归档' }
        return <Tag color={colors[v]}>{labels[v]}</Tag>
      },
    },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) => (
        <Space>
          {r.status === 'draft' && (
            <Button
              size="small"
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => handlePublish(r.id)}
            >
              发布
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>模型版本管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建模型
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={models}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="新建模型版本"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="模型名称" rules={[{ required: true }]}>
            <Input placeholder="例如: PCB-DefectNet" />
          </Form.Item>
          <Form.Item name="version" label="版本号" rules={[{ required: true }]}>
            <Input placeholder="例如: v1.0.0" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ModelVersions
