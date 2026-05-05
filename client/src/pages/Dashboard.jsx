import React, { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Space,
  Table,
  Tag,
  Button,
  message
} from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  SafetyOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { getUserList } from '../api/user'
import { getRoleList } from '../api/role'
import useAuthStore from '../store/authStore'

const Dashboard = () => {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    userCount: 0,
    roleCount: 0,
    onlineUsers: 1,
    todayLogins: 0
  })
  const [recentUsers, setRecentUsers] = useState([])
  const { user } = useAuthStore()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [userResult, roleResult] = await Promise.all([
        getUserList({ page: 1, pageSize: 10 }),
        getRoleList({ page: 1, pageSize: 100 })
      ])

      setStats({
        userCount: userResult.data.total || 0,
        roleCount: roleResult.data.total || 0,
        onlineUsers: 1,
        todayLogins: 0
      })

      setRecentUsers(userResult.data.list || [])
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchStats()
    message.success('数据已刷新')
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
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles) => (
        <Space>
          {roles?.slice(0, 2).map(role => (
            <Tag key={role.id} color="blue">{role.name}</Tag>
          ))}
          {roles?.length > 2 && <Tag>...</Tag>}
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
      render: (time) => time ? new Date(time).toLocaleString() : '-',
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>欢迎回来，{user?.realName || user?.username}</h2>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
          刷新数据
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={stats.userCount}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="角色总数"
              value={stats.roleCount}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="在线用户"
              value={stats.onlineUsers}
              prefix={<EyeOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="权限模块"
              value={8}
              prefix={<SafetyOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>最近用户</span>
          </Space>
        }
        extra={
          <Button type="link" href="/user">
            查看全部
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={recentUsers}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="权限模块说明" size="small">
            <div style={{ lineHeight: 2 }}>
              <p><strong>终端管理：</strong>终端查看、维护和全见权限</p>
              <p><strong>素材管理：</strong>素材查看、审核、上传、删除、全见和组内共享</p>
              <p><strong>布局管理：</strong>布局查看、管理、全见和组内共享</p>
              <p><strong>节目管理：</strong>节目查看预览、制作、修改、删除、全见和组内共享</p>
              <p><strong>播放计划：</strong>播放计划查看、制作、修改、删除、审核、全见和组内共享</p>
              <p><strong>用户管理：</strong>用户和用户组管理</p>
              <p><strong>角色管理：</strong>角色创建和权限分配</p>
              <p><strong>日志管理：</strong>操作日志查看和导出</p>
              <p><strong>系统管理：</strong>系统设置、FTP服务器、布局分辨率、在线用户管理</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="系统信息" size="small">
            <div style={{ lineHeight: 2.5 }}>
              <p><strong>系统版本：</strong> v1.0.0</p>
              <p><strong>后端端口：</strong> 12251</p>
              <p><strong>前端端口：</strong> 22251</p>
              <p><strong>当前用户：</strong> {user?.username}</p>
              <p><strong>是否超级管理员：</strong> {user?.isRoot ? '是' : '否'}</p>
              <p><strong>角色：</strong> {user?.roleNames?.join(', ') || '-'}</p>
              <p><strong>权限数量：</strong> {user?.permissions?.length || 0}</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
