import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, message } from 'antd'
import { userAPI } from '../utils/api'
import dayjs from 'dayjs'

const roleNames = {
  business_owner: '业务负责人',
  model_operator: '模型运营',
  reviewer: '审核人员',
  frontline_user: '一线使用者'
}

function UserList({ user }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await userAPI.list()
      setUsers(response.data)
    } catch (error) {
      message.error('加载用户列表失败')
    } finally {
      setLoading(false)
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
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '姓名',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 120
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role) => {
        const colorMap = {
          business_owner: 'purple',
          model_operator: 'blue',
          reviewer: 'orange',
          frontline_user: 'green'
        }
        return <Tag color={colorMap[role] || 'default'}>{roleNames[role] || role}</Tag>
      }
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (active) => active ? <Tag color="success">启用</Tag> : <Tag color="error">禁用</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>用户管理</h2>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default UserList
