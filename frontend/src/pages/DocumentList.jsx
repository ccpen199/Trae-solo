import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Button, Input, Select, Tag, Space, Modal, Form, message } from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons'
import { documentAPI } from '../utils/api'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

function DocumentList({ user }) {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const canEdit = ['business_owner', 'model_operator'].includes(user.role)
  const canApprove = ['business_owner', 'reviewer'].includes(user.role)

  useEffect(() => {
    loadDocuments()
  }, [searchText, statusFilter, categoryFilter])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const response = await documentAPI.list({
        search: searchText || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined
      })
      setDocuments(response.data)
    } catch (error) {
      message.error('加载文档列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values) => {
    try {
      await documentAPI.create(values)
      message.success('文档创建成功，等待审核')
      setModalVisible(false)
      form.resetFields()
      loadDocuments()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleApprove = async (id) => {
    try {
      await documentAPI.approve(id)
      message.success('审核通过')
      loadDocuments()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => navigate(`/documents/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80
    },
    {
      title: '权限范围',
      dataIndex: 'permission_scope',
      key: 'permission_scope',
      width: 100,
      render: (scope) => scope === 'public' ? <Tag color="green">公开</Tag> : <Tag color="orange">内部</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          pending: { color: 'default', text: '待审核' },
          approved: { color: 'success', text: '已发布' },
          rejected: { color: 'error', text: '已拒绝' }
        }
        const info = statusMap[status] || { color: 'default', text: status }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/documents/${record.id}`)}>
            查看
          </Button>
          {canEdit && <Button size="small" icon={<EditOutlined />}>编辑</Button>}
          {canApprove && record.status === 'pending' && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)}>
              通过
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>文档管理</h2>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            新建文档
          </Button>
        )}
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索文档"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="pending">待审核</Option>
            <Option value="approved">已发布</Option>
            <Option value="rejected">已拒绝</Option>
          </Select>
          <Select
            placeholder="分类筛选"
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 120 }}
            allowClear
          >
            <Option value="售后政策">售后政策</Option>
            <Option value="技术支持">技术支持</Option>
            <Option value="VIP服务">VIP服务</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={documents}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新建文档"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="title" label="文档标题" rules={[{ required: true }]}>
            <Input placeholder="请输入文档标题" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select>
              <Option value="售后政策">售后政策</Option>
              <Option value="技术支持">技术支持</Option>
              <Option value="VIP服务">VIP服务</Option>
            </Select>
          </Form.Item>
          <Form.Item name="permission_scope" label="权限范围" rules={[{ required: true }]}>
            <Select>
              <Option value="public">公开</Option>
              <Option value="internal">内部</Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="文档内容" rules={[{ required: true }]}>
            <TextArea rows={8} placeholder="请输入文档内容" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DocumentList
