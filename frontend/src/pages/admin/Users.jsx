import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, message } from 'antd'
import api from '../../utils/api'
import dayjs from 'dayjs'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const data = await api.get(`/admin/users?page=${page}&page_size=${pageSize}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
      })
      setUsers(data.users)
      setPagination({
        current: data.page,
        pageSize: data.page_size,
        total: data.total
      })
    } catch (error) {
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'real_name', key: 'real_name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '积分', dataIndex: 'points', key: 'points', render: (v) => <Tag color="orange">{v}</Tag> },
    { 
      title: '用户类型', 
      dataIndex: 'user_type', 
      key: 'user_type',
      render: (v) => v === 'resident' ? '居民' : '企业'
    },
    { title: '地区', dataIndex: 'province', key: 'province', render: (v, r) => `${v || ''} ${r.city || ''}` },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (v) => {
        const colors = { 1: 'green', 2: 'orange', 3: 'red' }
        const names = { 1: '保守型', 2: '稳健型', 3: '进取型' }
        return <Tag color={colors[v]}>{names[v]}</Tag>
      }
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    }
  ]

  return (
    <Card title="用户管理">
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (page, pageSize) => fetchUsers(page, pageSize)
        }}
      />
    </Card>
  )
}

export default Users
