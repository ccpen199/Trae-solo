import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Progress, List, Tag } from 'antd'
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { deviceAPI, alertAPI, analyticsAPI } from '../../utils/api.js'

function AdminDashboard() {
  const [deviceStats, setDeviceStats] = useState(null)
  const [alertStats, setAlertStats] = useState(null)
  const [energyOverview, setEnergyOverview] = useState(null)
  const [recentAlerts, setRecentAlerts] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [deviceRes, alertRes, energyRes, alertsRes] = await Promise.all([
        deviceAPI.getDeviceStats(),
        alertAPI.getAlertStats(),
        analyticsAPI.getEnergyOverview(),
        alertAPI.getAlerts({ pageSize: 5 }),
      ])
      setDeviceStats(deviceRes.data)
      setAlertStats(alertRes.data)
      setEnergyOverview(energyRes.data)
      setRecentAlerts(alertsRes.data.alerts || [])
    } catch (error) {
      console.error('加载数据失败', error)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>运营看板</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="设备总数"
              value={deviceStats?.total || 0}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card green">
            <Statistic
              title="在线设备"
              value={deviceStats?.online || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: 'white' }}
            />
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8 }}>
              离线率: {deviceStats?.offlineRate || 0}%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card orange">
            <Statistic
              title="今日告警"
              value={alertStats?.today || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: 'white' }}
            />
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8 }}>
              未处理: {alertStats?.unread || 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card blue">
            <Statistic
              title="累计用水量"
              value={energyOverview?.totalWater || 0}
              suffix="L"
              valueStyle={{ color: 'white' }}
            />
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8 }}>
              总营收: ¥{energyOverview?.totalAmount?.toFixed(2) || 0}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="楼宇设备状态" style={{ marginBottom: 16 }}>
            {deviceStats?.buildingStats?.map((building, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{building.building}</span>
                  <span>{building.online}/{building.total} 在线</span>
                </div>
                <Progress 
                  percent={Math.round(building.online / building.total * 100)} 
                  status="active"
                  strokeColor="#52c41a"
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近告警">
            <List
              dataSource={recentAlerts}
              renderItem={item => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<WarningOutlined style={{ color: item.severity === 'critical' ? '#ff4d4f' : '#faad14' }} />}
                    title={
                      <span>
                        <Tag color={item.severity === 'critical' ? 'red' : 'orange'}>
                          {item.severity === 'critical' ? '严重' : '警告'}
                        </Tag>
                        {item.type}
                      </span>
                    }
                    description={item.message}
                  />
                  <Tag color={item.status === 'unread' ? 'blue' : 'default'}>
                    {item.status === 'unread' ? '未处理' : '已处理'}
                  </Tag>
                </List.Item>
              )}
            />
            {recentAlerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                暂无告警
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {deviceStats?.faultDistribution?.length > 0 && (
        <Card title="故障码分布" style={{ marginTop: 16 }}>
          <Row gutter={[16, 16]}>
            {deviceStats.faultDistribution.map((fault, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card size="small">
                  <Statistic
                    title={fault.fault_code}
                    value={fault.count}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  )
}

export default AdminDashboard
