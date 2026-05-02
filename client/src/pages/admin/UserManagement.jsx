import React, { useState } from 'react'
import { Card, Table, Button, Tag, Modal, Form, Input, Select, Switch, message, Avatar, Space, Descriptions } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons'

const { Option } = Select

function UserManagement() {
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const mockUsers = [
    {
      key: '1',
      _id: '1',
      username: '王学员',
      email: 'student@learning.com',
      role: 'student',
      status: 'active',
      avatar: '',
      createdAt: '2024-01-15T10:30:00Z',
      stats: {
        enrolledCourses: 3,
        completedCourses: 1,
        totalWatchTime: 36000
      }
    },
    {
      key: '2',
      _id: '2',
      username: '张教授',
      email: 'teacher@learning.com',
      role: 'teacher',
      status: 'active',
      avatar: '',
      createdAt: '2024-01-10T09:00:00Z',
      stats: {
        enrolledCourses: 0,
        completedCourses: 0,
        totalWatchTime: 0
      }
    },
    {
      key: '3',
      _id: '3',
      username: '李助教',
      email: 'ta@learning.com',
      role: 'ta',
      status: 'active',
      avatar: '',
      createdAt: '2024-02-01T14:00:00Z',
      stats: {
        enrolledCourses: 0,
        completedCourses: 0,
        totalWatchTime: 0
      }
    },
    {
      key: '4',
      _id: '4',
      username: '系统管理员',
      email: 'admin@learning.com',
      role: 'admin',
      status: 'active',
      avatar: '',
      createdAt: '2024-01-01T00:00:00Z',
      stats: {
        enrolledCourses: 0,
        completedCourses: 0,
        totalWatchTime: 0
      }
    },
    {
      key: '5',
      _id: '5',
      username: '测试用户',
      email: 'test@learning.com',
      role: 'student',
      status: 'inactive',
      avatar: '',
      createdAt: '2024-03-01T16:00:00Z',
      stats: {
        enrolledCourses: 1,
        completedCourses: 0,
        totalWatchTime: 1800
      }
    }
  ]

  const columns = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size={36} icon={<UserOutlined />} src={record.avatar}>
            {text?.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.email}</div>
          </div>
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roleConfig = {
          student: { label: '学员', color: 'blue' },
          teacher: { label: '教师', color: 'purple' },
          ta: { label: '助教', color: 'orange' },
          admin: { label: '管理员', color: 'red' }
        }
        const config = roleConfig[role] || { label: role, color: 'default' }
        return <Tag color={config.color}>{config.label}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      )
    },
    {
      title: '学习数据',
      key: 'stats',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 12 }}>
            已购课程：{record.stats?.enrolledCourses || 0} 门
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            已完成：{record.stats?.completedCourses || 0} 门
          </div>
        </div>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time) => new Date(time).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewUser(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => editUser(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => toggleStatus(record)}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
        </Space>
      )
    }
  ]

  const viewUser = (record) => {
    setSelectedUser(record)
    setModalVisible(true)
  }

  const editUser = (record) => {
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      role: record.role,
      status: record.status
    })
    setSelectedUser(record)
    setModalVisible(true)
  }

  const toggleStatus = (record) => {
    message.success(`用户已${record.status === 'active' ? '禁用' : '启用'}`)
  }

  const handleSave = async (values) => {
    setLoading(true)
    try {
      message.success('保存成功！')
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: mockUsers.length,
    students: mockUsers.filter(u => u.role === 'student').length,
    teachers: mockUsers.filter(u => u.role === 'teacher').length,
    tas: mockUsers.filter(u => u.role === 'ta').length,
    admins: mockUsers.filter(u => u.role === 'admin').length
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>用户管理</h2>
          <p style={{ color: '#666', marginTop: 8, marginBottom: 0 }}>
            总用户数：{stats.total} | 学员：{stats.students} | 教师：{stats.teachers} | 助教：{stats.tas}
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />}>
          添加用户
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={mockUsers}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={selectedUser ? '用户详情' : '编辑用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={600}
        footer={selectedUser ? null : [
          <Button key="cancel" onClick={() => setModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
            保存
          </Button>
        ]}
      >
        {selectedUser && (
          <div>
            <Descriptions column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="用户名">{selectedUser.username}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{selectedUser.email}</Descriptions.Item>
              <Descriptions.Item label="角色">
                <Tag color={
                  selectedUser.role === 'student' ? 'blue' :
                  selectedUser.role === 'teacher' ? 'purple' :
                  selectedUser.role === 'ta' ? 'orange' : 'red'
                }>
                  {selectedUser.role === 'student' ? '学员' :
                   selectedUser.role === 'teacher' ? '教师' :
                   selectedUser.role === 'ta' ? '助教' : '管理员'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedUser.status === 'active' ? 'success' : 'default'}>
                  {selectedUser.status === 'active' ? '正常' : '禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="注册时间" span={2}>
                {new Date(selectedUser.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {selectedUser.role === 'student' && (
              <div>
                <h4 style={{ marginBottom: 16 }}>学习数据</h4>
                <Card size="small">
                  <Descriptions column={3}>
                    <Descriptions.Item label="已购课程">{selectedUser.stats?.enrolledCourses || 0} 门</Descriptions.Item>
                    <Descriptions.Item label="已完成">{selectedUser.stats?.completedCourses || 0} 门</Descriptions.Item>
                    <Descriptions.Item label="学习时长">
                      {selectedUser.stats?.totalWatchTime ? Math.round(selectedUser.stats.totalWatchTime / 3600) + '小时' : '0小时'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </div>
            )}
          </div>
        )}

        {!selectedUser && (
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              name="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>

            <Form.Item
              name="role"
              label="角色"
              rules={[{ required: true, message: '请选择角色' }]}
            >
              <Select placeholder="请选择角色">
                <Option value="student">学员</Option>
                <Option value="teacher">教师</Option>
                <Option value="ta">助教</Option>
                <Option value="admin">管理员</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="状态"
              valuePropName="checked"
            >
              <Switch checkedChildren="正常" unCheckedChildren="禁用" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default UserManagement
