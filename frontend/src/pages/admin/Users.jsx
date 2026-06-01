import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Modal, Form, Select, message, Input, Space } from 'antd'
import api from '../../utils/api'

const { Option } = Select

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [tagModalVisible, setTagModalVisible] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadUsers()
  }, [pagination.current])

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users', {
        params: {
          page: pagination.current,
          pageSize: pagination.pageSize
        }
      })
      setUsers(res.data.list.map(u => ({
        ...u,
        tags: JSON.parse(u.tags || '[]')
      })))
      setPagination(prev => ({ ...prev, total: res.data.total }))
    } catch (error) {
      message.error('加载用户列表失败')
    }
  }

  const handleEditTags = (user) => {
    setCurrentUser(user)
    form.setFieldsValue({ tags: user.tags })
    setTagModalVisible(true)
  }

  const handleSubmitTags = async (values) => {
    try {
      await api.post(`/admin/users/${currentUser.id}/tags`, values)
      message.success('标签更新成功')
      setTagModalVisible(false)
      loadUsers()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'blue' : 'default'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      )
    },
    {
      title: '信用分',
      dataIndex: 'credit_score',
      key: 'credit_score',
      render: (score) => (
        <Tag color={score >= 700 ? 'green' : score >= 600 ? 'orange' : 'red'}>
          {score}
        </Tag>
      )
    },
    {
      title: '用户标签',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) => (
        <>
          {tags.map((tag, index) => (
            <Tag key={index}>{tag}</Tag>
          ))}
        </>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button size="small" onClick={() => handleEditTags(record)}>
          编辑标签
        </Button>
      )
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>👥 用户管理</h2>
      
      <Card>
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page) => setPagination(prev => ({ ...prev, current: page }))
          }}
        />
      </Card>

      <Modal
        title="编辑用户标签"
        open={tagModalVisible}
        onCancel={() => setTagModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmitTags} layout="vertical">
          <Form.Item name="tags" label="用户标签">
            <Select
              mode="tags"
              placeholder="输入标签"
              style={{ width: '100%' }}
              tokenSeparators={[',']}
            >
              <Option value="新用户">新用户</Option>
              <Option value="活跃用户">活跃用户</Option>
              <Option value="高价值">高价值</Option>
              <Option value="风险用户">风险用户</Option>
              <Option value="优质客户">优质客户</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminUsers
