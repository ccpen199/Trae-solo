import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Select, message, Space, Card, Row, Col, Statistic } from 'antd'
import { CheckCircleOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { alertAPI } from '../../utils/api.js'

function AdminAlerts() {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [alertsRes, statsRes] = await Promise.all([
        alertAPI.getAlerts({
          page: pagination.current,
          pageSize: pagination.pageSize,
          status: statusFilter || undefined,
        }),
        alertAPI.getAlertStats(),
      ])
      setAlerts(alertsRes.data.alerts)
      setPagination(p => ({ ...p, total: alertsRes.data.total }))
      setStats(statsRes.data)
    } catch (error) {
      message.error('加载告警数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (id) => {
    try {
      await alertAPI.resolveAlert(id)
      message.success('已处理')
      loadData()
    } catch (error) {
      message.error('处理失败')
    }
  }

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap = {
          water_anomaly: '用水异常',
          device_offline: '设备离线',
          device_fault: '设备故障',
          balance_warning: '余额预警',
          system: '系统通知',
        }
        return <Tag color="blue">{typeMap[type] || type}</Tag>
      },
    },
    {
      title: '设备ID',
      dataIndex: 'device_id',
      key: 'device_id',
      render: (text) => text || '-',
    },
    {
      title: '学生ID',
      dataIndex: 'student_id',
      key: 'student_id',
      render: (text) => text || '-',
    },
    {
      title: '告警内容',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => {
        const colorMap = {
          critical: 'red',
          warning: 'orange',
          info: 'blue',
        }
        const textMap = {
          critical: '严重',
          warning: '警告',
          info: '提示',
        }
        return <Tag color={colorMap[severity]}>{textMap[severity] || severity}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          unread: 'processing',
          resolved: 'success',
        }
        const textMap = {
          unread: '未处理',
          resolved: '已处理',
        }
        return <Tag color={colorMap[status]}>{textMap[status] || status}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'unread' && (
            <Button type="link" icon={<CheckCircleOutlined />} onClick={() => handleResolve(record.id)}>
              标记已处理
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>告警中心</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="未处理告警"
              value={stats?.unread || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card orange">
            <Statistic
              title="严重告警"
              value={stats?.critical || 0}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card green">
            <Statistic
              title="警告"
              value={stats?.warning || 0}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card blue">
            <Statistic
              title="今日告警"
              value={stats?.today || 0}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 150 }}
          placeholder="状态筛选"
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
        >
          <Select.Option value="unread">未处理</Select.Option>
          <Select.Option value="resolved">已处理</Select.Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={alerts}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize })),
        }}
      />
    </div>
  )
}

export default AdminAlerts
