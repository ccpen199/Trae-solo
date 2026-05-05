import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  InputNumber,
  Card
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  KeyOutlined
} from '@ant-design/icons'
import { getUserList, createUser, updateUser, deleteUser, resetPassword } from '../../api/user'
import { getAllRoles } from '../../api/role'
import useAuthStore from '../../store/authStore'

const { Option } = Select

const UserList = () => {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchForm] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [modalType, setModalType] = useState('create')
  const [currentUser, setCurrentUser] = useState(null)
  const [form] = Form.useForm()
  const [roles, setRoles] = useState([])
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [passwordForm] = Form.useForm()
  const hasPermission = useAuthStore(state => state.hasPermission)

  useEffect(() => {
    fetchRoles()
    fetchUsers()
  }, [current, pageSize])

  const fetchRoles = async () => {
    try {
      const result = await getAllRoles()
      setRoles(result.data.filter(r => !r.isSystem))
    } catch (error) {
      console.error('获取角色列表失败:', error)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const values = searchForm.getFieldsValue()
      const params = {
        page: current,
        pageSize,
        ...values
      }
      const result = await getUserList(params)
      setUsers(result.data.list)
      setTotal(result.data.total)
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrent(1)
    fetchUsers()
  }

  const handleReset = () => {
    searchForm.resetFields()
    setCurrent(1)
    fetchUsers()
  }

  const handleCreate = () => {
    setModalType('create')
    setCurrentUser(null)
    form.resetFields()
    form.setFieldsValue({ status: 1 })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setModalType('edit')
    setCurrentUser(record)
    form.setFieldsValue({
      username: record.username,
      realName: record.realName,
      email: record.email,
      phone: record.phone,
      status: record.status,
      roleIds: record.roles?.map(r => r.id) || []
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteUser(id)
      message.success('删除成功')
      fetchUsers()
    } catch (error) {
      console.error('删除用户失败:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (modalType === 'create') {
        await createUser(values)
        message.success('创建成功')
      } else {
        const { password, ...rest } = values
        await updateUser(currentUser.id, rest)
        message.success('更新成功')
      }
      
      setModalVisible(false)
      fetchUsers()
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const handleResetPassword = (record) => {
    setCurrentUser(record)
    passwordForm.resetFields()
    setPasswordModalVisible(true)
  }

  const handlePasswordSubmit = async () => {
    try {
      const values = await passwordForm.validateFields()
      await resetPassword(currentUser.id, values.password)
      message.success('密码重置成功')
      setPasswordModalVisible(false)
    } catch (error) {
      console.error('重置密码失败:', error)
    }
  }

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles) => (
        <Space>
          {roles?.map(role => (
            <Tag key={role.id} color="blue">{role.name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.username === 'root'}
          >
            编辑
          </Button>
          <Button
            type="link"
            icon={<KeyOutlined />}
            onClick={() => handleResetPassword(record)}
          >
            重置密码
          </Button>
          <Popconfirm
            title="确定要删除该用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={record.username === 'root'}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const paginationConfig = {
    current,
    pageSize,
    total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条记录`,
    onChange: (page, size) => {
      setCurrent(page)
      setPageSize(size)
    },
  }

  return (
    <div>
      <div className="page-header">
        <h2>用户管理</h2>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline">
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="用户名/真实姓名" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" style={{ width: 120 }} allowClear>
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <div className="table-toolbar">
          <div></div>
          <Space>
            {hasPermission('user:manage') && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                新增用户
              </Button>
            )}
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={paginationConfig}
        />
      </Card>

      <Modal
        title={modalType === 'create' ? '新增用户' : '编辑用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="确定"
        cancelText="取消"
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input placeholder="请输入用户名" disabled={modalType === 'edit'} />
          </Form.Item>
          {modalType === 'create' && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item name="realName" label="真实姓名">
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '邮箱格式不正确' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item
            name="roleIds"
            label="角色"
          >
            <Select
              mode="multiple"
              placeholder="请选择角色"
              optionFilterProp="children"
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>{role.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="重置密码"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        onOk={handlePasswordSubmit}
        okText="确定"
        cancelText="取消"
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="password"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserList
