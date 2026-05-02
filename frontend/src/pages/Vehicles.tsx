import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Space, Button, Select, message, Spin, Statistic, Row, Col } from 'antd'
import { CarOutlined, CheckCircleOutlined, ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { dispatchApi } from '../services/api'
import type { ColumnsType } from 'antd/es/table'

const { Option } = Select

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const fetchVehicles = async (status?: string) => {
    setLoading(true)
    try {
      const params: any = {}
      if (status) params.status = status
      const res = await dispatchApi.getVehicles(params)
      if (res.data.success) {
        setVehicles(res.data.data)
      }
    } catch (error) {
      message.error('获取车辆列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehicles(statusFilter)
  }, [statusFilter])

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      available: 'green',
      in_use: 'blue',
      maintenance: 'orange'
    }
    return colorMap[status] || 'default'
  }

  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      available: '可用',
      in_use: '使用中',
      maintenance: '维护中'
    }
    return textMap[status] || status
  }

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'green'
    if (level > 20) return 'orange'
    return 'red'
  }

  const columns: ColumnsType<any> = [
    {
      title: '车辆编号',
      dataIndex: 'bike_code',
      key: 'bike_code',
      render: (text) => <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{text}</span>
    },
    {
      title: '锁编号',
      dataIndex: 'lock_code',
      key: 'lock_code',
      render: (text) => text || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '锁状态',
      dataIndex: 'lock_status',
      key: 'lock_status',
      render: (status) => (
        <Tag color={status === 'unlocked' ? 'blue' : 'default'}>
          {status === 'unlocked' ? '已开锁' : '已关锁'}
        </Tag>
      )
    },
    {
      title: '电量',
      dataIndex: 'battery_level',
      key: 'battery_level',
      render: (level) => (
        <Tag color={getBatteryColor(level)}>
          {level}%
        </Tag>
      )
    },
    {
      title: '位置',
      key: 'location',
      render: (_, record) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
          ({record.location_lat?.toFixed(4)}, {record.location_lng?.toFixed(4)})
        </span>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (time) => time || '-'
    }
  ]

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'available').length,
    inUse: vehicles.filter(v => v.status === 'in_use').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    lowBattery: vehicles.filter(v => v.battery_level < 30).length
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>车辆管理</h2>
        <Space>
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            allowClear
            value={statusFilter || undefined}
            onChange={setStatusFilter}
          >
            <Option value="available">可用</Option>
            <Option value="in_use">使用中</Option>
            <Option value="maintenance">维护中</Option>
          </Select>
          <Button onClick={() => fetchVehicles(statusFilter)}>刷新</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="总车辆"
              value={stats.total}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="可用"
              value={stats.available}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="使用中"
              value={stats.inUse}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="低电量"
              value={stats.lowBattery}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={vehicles}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>
    </div>
  )
}

export default Vehicles
