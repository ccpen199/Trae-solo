import { useState, useEffect } from 'react'
import { Table, Card, Button, Space, Input, Tag, Row, Col, Statistic, Progress, Drawer, List, message, Tabs, Descriptions, Alert, Timeline, Badge } from 'antd'
import { SearchOutlined, ReloadOutlined, EnvironmentOutlined, ThunderboltOutlined, LockOutlined, WarningOutlined, CheckCircleOutlined, HeatMapOutlined } from '@ant-design/icons'
import { cabinetApi } from '../api'
import dayjs from 'dayjs'

const statusMap = {
  online: { text: '在线', color: 'success' },
  offline: { text: '离线', color: 'error' },
  maintenance: { text: '维护中', color: 'warning' }
}

export default function CabinetList() {
  const [cabinets, setCabinets] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [searchText, setSearchText] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentCabinet, setCurrentCabinet] = useState(null)

  useEffect(() => {
    loadCabinets()
  }, [pagination.current, pagination.pageSize])

  const loadCabinets = async () => {
    setLoading(true)
    try {
      const response = await cabinetApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize
      })
      setCabinets(response.data.list)
      setPagination(prev => ({ ...prev, total: response.data.total }))
    } catch (error) {
      message.error('加载柜机列表失败')
    } finally {
      setLoading(false)
    }
  }

  const showDetail = async (record) => {
    try {
      const response = await cabinetApi.getDetail(record.id)
      setCurrentCabinet(response.data)
      setDetailVisible(true)
    } catch (error) {
      message.error('加载柜机详情失败')
    }
  }

  const columns = [
    {
      title: '柜机编号',
      dataIndex: 'cabinet_code',
      key: 'cabinet_code',
      width: 120,
      render: (text) => <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{text}</span>
    },
    {
      title: '柜机名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (text) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#999' }} />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '格口使用',
      key: 'boxes',
      width: 180,
      render: (_, record) => {
        const used = record.total_boxes - record.available_boxes
        const percent = record.total_boxes > 0 ? (used / record.total_boxes * 100) : 0
        return (
          <div>
            <Progress 
              percent={percent.toFixed(0)} 
              size="small"
              strokeColor={percent > 80 ? '#ff4d4f' : percent > 60 ? '#faad14' : '#52c41a'}
            />
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {used} / {record.total_boxes} 格口
            </div>
          </div>
        )
      }
    },
    {
      title: '温控',
      dataIndex: 'temperature_control',
      key: 'temperature_control',
      width: 80,
      render: (val) => val ? <Tag color="blue">支持</Tag> : <Tag>不支持</Tag>
    },
    {
      title: '故障',
      dataIndex: 'has_fault',
      key: 'has_fault',
      width: 80,
      render: (val) => val ? (
        <Tag color="error">有故障</Tag>
      ) : (
        <Tag color="success">正常</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '最后心跳',
      dataIndex: 'last_heartbeat',
      key: 'last_heartbeat',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => showDetail(record)}>查看详情</Button>
      )
    }
  ]

  const onlineCount = cabinets.filter(c => c.status === 'online').length
  const faultCount = cabinets.filter(c => c.has_fault).length
  const totalBoxes = cabinets.reduce((sum, c) => sum + c.total_boxes, 0)
  const availableBoxes = cabinets.reduce((sum, c) => sum + c.available_boxes, 0)

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="柜机总数"
              value={pagination.total || 0}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="在线柜机"
              value={onlineCount}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${pagination.total || 0}`}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="故障柜机"
              value={faultCount}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="可用格口"
              value={availableBoxes}
              suffix={`/ ${totalBoxes}`}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="搜索柜机名称/编号"
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={loadCabinets}>刷新</Button>
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={cabinets.filter(c => 
            !searchText || 
            c.name.includes(searchText) || 
            c.cabinet_code.includes(searchText)
          )}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 台柜机`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Drawer
        title="柜机详情"
        placement="right"
        width={700}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentCabinet && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>柜机编号</div>
                <div style={{ fontSize: 18, fontWeight: 500 }}>{currentCabinet.cabinet_code}</div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>状态</div>
                <Tag color={statusMap[currentCabinet.status]?.color} style={{ fontSize: 14, padding: '2px 12px' }}>
                  {statusMap[currentCabinet.status]?.text}
                </Tag>
              </Col>
            </Row>

            {(currentCabinet.has_fault || currentCabinet.stats?.tempAnomalyBoxes > 0 || currentCabinet.stats?.lockedBoxes > 0) && (
              <Alert
                message="柜机异常提示"
                description={
                  <Space direction="vertical" size="small">
                    {currentCabinet.has_fault && <div><WarningOutlined style={{ color: '#faad14' }} /> 存在故障: {currentCabinet.fault_description}</div>}
                    {currentCabinet.stats?.tempAnomalyBoxes > 0 && <div><HeatMapOutlined style={{ color: '#ff4d4f' }} /> {currentCabinet.stats.tempAnomalyBoxes} 个格口温控异常</div>}
                    {currentCabinet.stats?.lockedBoxes > 0 && <div><LockOutlined style={{ color: '#1890ff' }} /> {currentCabinet.stats.lockedBoxes} 个格口已锁定/预约</div>}
                  </Space>
                }
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Tabs defaultActiveKey="basic" size="small">
              <Tabs.TabPane tab="基本信息" key="basic">
                <Card size="small" types="inner">
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="柜机名称" span={2}>{currentCabinet.name}</Descriptions.Item>
                    <Descriptions.Item label="地址" span={2}>{currentCabinet.address}</Descriptions.Item>
                    <Descriptions.Item label="温控功能">{currentCabinet.temperature_control ? '支持' : '不支持'}</Descriptions.Item>
                    <Descriptions.Item label="故障状态">
                      {currentCabinet.has_fault ? (
                        <Badge status="error" text={currentCabinet.fault_description || '有故障'} />
                      ) : (
                        <Badge status="success" text="正常" />
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="总格口">{currentCabinet.total_boxes || currentCabinet.stats?.totalBoxes || 0}</Descriptions.Item>
                    <Descriptions.Item label="可用格口">{currentCabinet.available_boxes || currentCabinet.stats?.availableBoxes || 0}</Descriptions.Item>
                    <Descriptions.Item label="已占用">{currentCabinet.stats?.occupiedBoxes || 0}</Descriptions.Item>
                    <Descriptions.Item label="已锁定">{currentCabinet.stats?.lockedBoxes || 0}</Descriptions.Item>
                    <Descriptions.Item label="最后心跳" span={2}>
                      {currentCabinet.last_heartbeat ? dayjs(currentCabinet.last_heartbeat).format('YYYY-MM-DD HH:mm:ss') : '-'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Tabs.TabPane>

              <Tabs.TabPane tab="格口状态" key="boxes">
                <Card size="small" types="inner">
                  <div style={{ marginBottom: 12 }}>
                    <Space wrap>
                      <Tag color="success">空闲</Tag>
                      <Tag color="blue">占用</Tag>
                      <Tag color="orange">锁定/预约</Tag>
                      <Tag color="error">温控异常</Tag>
                    </Space>
                  </div>
                  <Row gutter={[8, 8]}>
                    {(currentCabinet.boxes || []).map((box) => {
                      let boxColor = box.status === 'empty' ? 'success' : 'default'
                      if (box.status === 'occupied') boxColor = 'blue'
                      if (box.reservation_id || box.status === 'locked') boxColor = 'orange'
                      const isTempAnomaly = box.temperature_control && (box.current_temp < 2 || box.current_temp > 8)
                      return (
                        <Col xs={6} sm={4} key={box.id}>
                          <Tag 
                            color={isTempAnomaly ? 'error' : boxColor}
                            style={{ width: '100%', textAlign: 'center', margin: 0 }}
                          >
                            {box.box_code}
                            {box.reservation_id && <LockOutlined style={{ marginLeft: 4 }} />}
                          </Tag>
                          {box.temperature_control && (
                            <div style={{ fontSize: 10, color: '#999', textAlign: 'center', marginTop: 2 }}>
                              {box.current_temp !== undefined ? `${box.current_temp}°C` : '温控'}
                            </div>
                          )}
                        </Col>
                      )
                    })}
                  </Row>
                </Card>
              </Tabs.TabPane>

              <Tabs.TabPane tab="故障处理记录" key="faults">
                <Card size="small" types="inner">
                  {currentCabinet.faultLogs && currentCabinet.faultLogs.length > 0 ? (
                    <Timeline size="small">
                      {currentCabinet.faultLogs.map((log, index) => (
                        <Timeline.Item 
                          key={index}
                          color={log.status === 'resolved' ? 'green' : 'red'}
                          dot={log.status === 'resolved' ? <CheckCircleOutlined /> : <WarningOutlined />}
                        >
                          <div style={{ fontWeight: 500 }}>{log.description}</div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            {dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}
                            {log.resolved_at && ` · 修复于 ${dayjs(log.resolved_at).format('MM-DD HH:mm')}`}
                          </div>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                      <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                      <div style={{ marginTop: 8 }}>暂无故障记录</div>
                    </div>
                  )}
                </Card>
              </Tabs.TabPane>

              <Tabs.TabPane tab="健康复查记录" key="health">
                <Card size="small" types="inner">
                  {currentCabinet.healthLogs && currentCabinet.healthLogs.length > 0 ? (
                    <List
                      dataSource={currentCabinet.healthLogs}
                      size="small"
                      renderItem={(log) => (
                        <List.Item>
                          <Space>
                            <Badge status={log.status === 'normal' ? 'success' : 'warning'} />
                            <span>{log.description}</span>
                            <span style={{ color: '#999', fontSize: 12 }}>
                              {dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}
                            </span>
                          </Space>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                      暂无健康记录
                    </div>
                  )}
                </Card>
              </Tabs.TabPane>

              <Tabs.TabPane tab="温控异常记录" key="temp">
                <Card size="small" types="inner">
                  {currentCabinet.tempAlerts && currentCabinet.tempAlerts.length > 0 ? (
                    <List
                      dataSource={currentCabinet.tempAlerts}
                      size="small"
                      renderItem={(alert) => (
                        <List.Item>
                          <Space>
                            <HeatMapOutlined style={{ color: '#ff4d4f' }} />
                            <span>{alert.message}</span>
                            <span style={{ color: '#999', fontSize: 12 }}>
                              {dayjs(alert.created_at).format('YYYY-MM-DD HH:mm')}
                            </span>
                            {alert.resolved && <Tag color="success">已处理</Tag>}
                          </Space>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                      <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                      <div style={{ marginTop: 8 }}>暂无温控异常记录</div>
                    </div>
                  )}
                </Card>
              </Tabs.TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>
    </div>
  )
}
