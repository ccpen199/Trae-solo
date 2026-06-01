import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Select, Input, Modal, Form, message, Spin, Space, Switch, Avatar } from 'antd'
import { SearchOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import { getAdminUsers, updateUserStatus, createUser, deleteUser } from '../../api/admin'
import dayjs from 'dayjs'

const { Option } = Select

function AdminUsers() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [roleFilter, setRoleFilter] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()

  useEffect(() => {
    fetchUsers()
  }, [roleFilter])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = roleFilter !== 'all' ? { role: roleFilter } : {}
      const result = await getAdminUsers(params)
      setData(Array.isArray(result) ? result : result?.list || [])
    } catch (error) {
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (values) => {
    try {
      await createUser(values)
      message.success('用户创建成功')
      setAddModal(false)
      form.resetFields()
      fetchUsers()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const handleEditUser = async (values) => {
    if (!selectedUser) return
    
    try {
      await updateUserStatus(selectedUser.id, values.status)
      message.success('用户信息更新成功')
      setEditModal(false)
      fetchUsers()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    
    try {
      await deleteUser(selectedUser.id)
      message.success('用户删除成功')
      setDeleteModal(false)
      fetchUsers()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleToggleStatus = async (userId, enabled) => {
    try {
      await updateUserStatus(userId, enabled ? 'active' : 'disabled')
      message.success('状态更新成功')
      fetchUsers()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const showEditModal = (record) => {
    setSelectedUser(record)
    editForm.setFieldsValue({
      status: record.status,
      phone: record.phone,
      email: record.email,
    })
    setEditModal(true)
  }

  const showDeleteModal = (record) => {
    setSelectedUser(record)
    setDeleteModal(true)
  }

  const getRoleColor = (role) => {
    return role === 'admin' ? 'red' : role === 'staff' ? 'blue' : 'green'
  }

  const getRoleText = (role) => {
    return role === 'admin' ? '管理员' : role === 'staff' ? '员工' : '普通用户'
  }

  const getStatusColor = (status) => {
    return status === 'active' ? 'green' : status === 'disabled' ? 'default' : 'orange'
  }

  const getStatusText = (status) => {
    return status === 'active' ? '正常' : status === 'disabled' ? '禁用' : '待审核'
  }

  const mockData = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    username: `user${i + 1}`,
    nickname: ['张三', '李四', '王五', '赵六', '钱七', '孙八'][i % 6],
    email: `user${i + 1}@example.com`,
    phone: `138****${1000 + i}`,
    role: ['user', 'user', 'user', 'user', 'staff', 'admin'][i % 6],
    status: i % 5 === 0 ? 'disabled' : 'active',
    parcel_count: Math.floor(Math.random() * 50),
    points: Math.floor(Math.random() * 1000),
    created_at: dayjs().subtract(i * 10, 'day').toISOString(),
    last_login: dayjs().subtract(i, 'day').toISOString(),
  }))

  const displayData = data.length > 0 ? data : mockData

  const filteredData = displayData.filter(item => 
    item.username?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.nickname?.includes(searchText) ||
    item.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.phone?.includes(searchText)
  )

  const columns = [
    {
      title: '用户信息',
      key: 'user',
      width: 180,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar icon={<UserOutlined />} src={record.avatar} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.nickname}</div>
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>@{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => (
        <Tag color={getRoleColor(role)}>
          {getRoleText(role)}
        </Tag>
      ),
    },
    {
      title: '包裹数',
      dataIndex: 'parcel_count',
      key: 'parcel_count',
      width: 90,
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 90,
      render: (points) => <span style={{ color: '#faad14' }}>{points}</span>,
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <Space>
          <Tag color={getStatusColor(record.status)}>
            {getStatusText(record.status)}
          </Tag>
          <Switch
            size="small"
            checked={record.status === 'active'}
            onChange={(checked) => handleToggleStatus(record.id, checked)}
          />
        </Space>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '最后登录',
      dataIndex: 'last_login',
      key: 'last_login',
      width: 150,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
          {record.role !== 'admin' && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => showDeleteModal(record)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>
          添加用户
        </Button>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Select
            defaultValue="all"
            style={{ width: 150 }}
            onChange={setRoleFilter}
          >
            <Option value="all">全部角色</Option>
            <Option value="admin">管理员</Option>
            <Option value="staff">员工</Option>
            <Option value="user">普通用户</Option>
          </Select>
          <Input.Search
            placeholder="搜索用户名/昵称/邮箱/手机号"
            allowClear
            style={{ width: 280 }}
            onSearch={(value) => setSearchText(value)}
            onChange={(e) => setSearchText(e.target.value)}
            enterButton={<SearchOutlined />}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchUsers}
          >
            刷新
          </Button>
        </Space>
      </Card>

      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            scroll={{ x: 1300 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Spin>
      </Card>

      <Modal
        title="添加用户"
        open={addModal}
        onCancel={() => setAddModal(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleAddUser}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="nickname"
                label="昵称"
                rules={[{ required: true, message: '请输入昵称' }]}
              >
                <Input placeholder="请输入昵称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[{ required: true, message: '请输入手机号' }]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="password"
                label="初始密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' },
                ]}
              >
                <Input.Password placeholder="请输入初始密码" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  <Option value="user">普通用户</Option>
                  <Option value="staff">员工</Option>
                  <Option value="admin">管理员</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建用户
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑用户"
        open={editModal}
        onCancel={() => setEditModal(false)}
        footer={null}
        width={500}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditUser}>
          <Form.Item label="用户名">
            <Input value={selectedUser?.username} disabled />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">正常</Option>
              <Option value="disabled">禁用</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              保存修改
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="确认删除"
        open={deleteModal}
        onCancel={() => setDeleteModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteModal(false)}>取消</Button>,
          <Button key="confirm" danger type="primary" onClick={handleDelete}>
            确认删除
          </Button>,
        ]}
      >
        <p>确定要删除用户 <strong>{selectedUser?.nickname}</strong> 吗？此操作不可撤销。</p>
      </Modal>
    </div>
  )
}

export default AdminUsers
