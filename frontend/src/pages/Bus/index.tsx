import { useState, useEffect } from 'react'
import {
  Card,
  Input,
  Button,
  List,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Empty,
  Spin,
  Descriptions,
  Badge,
  Alert
} from 'antd'
import {
  SearchOutlined,
  CarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { BusRoute } from '@/types'
import dayjs from 'dayjs'

const { Search } = Input

const mockBusRoutes: BusRoute[] = [
  {
    id: '1',
    routeNo: '1路',
    startStation: '常州北站',
    endStation: '常州火车站',
    firstBus: '05:30',
    lastBus: '22:30',
    price: '2元',
    stations: [
      { name: '常州北站', index: 1 },
      { name: '新北区政府', index: 2 },
      { name: '通江路黄河路', index: 3 },
      { name: '通江路龙城大道', index: 4 },
      { name: '万福桥', index: 5 },
      { name: '西新桥', index: 6 },
      { name: '江南商场', index: 7 },
      { name: '南大街', index: 8 },
      { name: '文化宫', index: 9 },
      { name: '常州火车站', index: 10 }
    ],
    realTimeData: {
      currentStation: '万福桥',
      nextStation: '西新桥',
      arrivalMinutes: 3,
      busCount: 2
    }
  },
  {
    id: '2',
    routeNo: '2路',
    startStation: '花园汽车站',
    endStation: '常州客运中心',
    firstBus: '05:40',
    lastBus: '22:00',
    price: '2元',
    stations: [
      { name: '花园汽车站', index: 1 },
      { name: '怀德路龙江路', index: 2 },
      { name: '怀德路勤业路', index: 3 },
      { name: '怀德桥', index: 4 },
      { name: '江南商场', index: 5 },
      { name: '南大街', index: 6 },
      { name: '文化宫', index: 7 },
      { name: '常州客运中心', index: 8 }
    ],
    realTimeData: {
      currentStation: '怀德桥',
      nextStation: '江南商场',
      arrivalMinutes: 5,
      busCount: 1
    }
  },
  {
    id: '3',
    routeNo: 'B1路',
    startStation: '常州北站',
    endStation: '武进公交中心站',
    firstBus: '05:00',
    lastBus: '23:00',
    price: '1元',
    stations: [
      { name: '常州北站', index: 1 },
      { name: '通江路黄河路', index: 2 },
      { name: '通江路龙城大道', index: 3 },
      { name: '怀德桥', index: 4 },
      { name: '兰陵路光华路', index: 5 },
      { name: '兰陵路中吴大道', index: 6 },
      { name: '武进汽车站', index: 7 },
      { name: '武进公交中心站', index: 8 }
    ],
    realTimeData: {
      currentStation: '通江路龙城大道',
      nextStation: '怀德桥',
      arrivalMinutes: 2,
      busCount: 3
    }
  },
  {
    id: '4',
    routeNo: '11路',
    startStation: '龙虎塘',
    endStation: '红梅公园',
    firstBus: '06:00',
    lastBus: '21:00',
    price: '2元',
    stations: [
      { name: '龙虎塘', index: 1 },
      { name: '新北区政府', index: 2 },
      { name: '河海大学', index: 3 },
      { name: '体育中心', index: 4 },
      { name: '市民广场', index: 5 },
      { name: '红梅公园', index: 6 }
    ],
    realTimeData: {
      currentStation: '河海大学',
      nextStation: '体育中心',
      arrivalMinutes: 8,
      busCount: 1
    }
  }
]

const Bus = () => {
  const [loading, setLoading] = useState(true)
  const [routes, setRoutes] = useState<BusRoute[]>([])
  const [filteredRoutes, setFilteredRoutes] = useState<BusRoute[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null)
  const [lastUpdate, setLastUpdate] = useState('')

  useEffect(() => {
    loadRoutes()
    const timer = setInterval(() => {
      if (selectedRoute) {
        refreshRealTimeData()
      }
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    filterRoutes()
  }, [routes, searchKeyword])

  const loadRoutes = () => {
    setLoading(true)
    setTimeout(() => {
      setRoutes(mockBusRoutes)
      setFilteredRoutes(mockBusRoutes)
      setLoading(false)
      setLastUpdate(dayjs().format('HH:mm:ss'))
    }, 500)
  }

  const refreshRealTimeData = () => {
    setRoutes((prev) =>
      prev.map((route) => ({
        ...route,
        realTimeData: route.realTimeData
          ? {
              ...route.realTimeData,
              arrivalMinutes: Math.max(1, route.realTimeData.arrivalMinutes - 1),
              busCount: Math.floor(Math.random() * 5) + 1
            }
          : undefined
      }))
    )
    setLastUpdate(dayjs().format('HH:mm:ss'))
  }

  const filterRoutes = () => {
    if (!searchKeyword) {
      setFilteredRoutes(routes)
      return
    }
    const keyword = searchKeyword.toLowerCase()
    const filtered = routes.filter(
      (r) =>
        r.routeNo.toLowerCase().includes(keyword) ||
        r.startStation.toLowerCase().includes(keyword) ||
        r.endStation.toLowerCase().includes(keyword) ||
        r.stations.some((s) => s.name.toLowerCase().includes(keyword))
    )
    setFilteredRoutes(filtered)
  }

  const handleSearch = (value: string) => {
    setSearchKeyword(value)
    setSelectedRoute(null)
  }

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>
              <CarOutlined style={{ color: '#1890ff', marginRight: 12 }} />
              公交查询
            </h1>
            <p style={{ color: '#8c8c8c', marginTop: 8, marginBottom: 0 }}>
              实时查询公交线路信息和车辆到站情况
            </p>
          </div>
          <Space>
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>
              最后更新：{lastUpdate}
            </span>
            <Button icon={<ReloadOutlined />} onClick={loadRoutes}>
              刷新数据
            </Button>
          </Space>
        </div>

        <Card className="card-shadow" style={{ marginBottom: 16 }}>
          <Row gutter={24} align="middle">
            <Col span={18}>
              <Search
                placeholder="输入线路号、站点名称搜索..."
                allowClear
                enterButton
                size="large"
                onSearch={handleSearch}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Space>
                <Alert
                  message="实时数据"
                  type="success"
                  showIcon
                  size="small"
                />
              </Space>
            </Col>
          </Row>
        </Card>

        <Row gutter={24}>
          <Col span={selectedRoute ? 10 : 24}>
            <Card className="card-shadow" title="线路列表">
              {filteredRoutes.length > 0 ? (
                <List
                  dataSource={filteredRoutes}
                  renderItem={(route) => (
                    <List.Item
                      className="hover-card"
                      onClick={() => setSelectedRoute(route)}
                      style={{
                        cursor: 'pointer',
                        padding: '16px 0',
                        borderBottom: '1px solid #f0f0f0'
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 60,
                              height: 40,
                              borderRadius: 8,
                              background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600
                            }}
                          >
                            {route.routeNo}
                          </div>
                        }
                        title={
                          <Space>
                            <span style={{ fontWeight: 500 }}>{route.routeNo}</span>
                            <Tag color="blue">{route.price}</Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <EnvironmentOutlined style={{ color: '#52c41a' }} />
                              <span>{route.startStation}</span>
                              <ArrowRightOutlined style={{ color: '#8c8c8c' }} />
                              <EnvironmentOutlined style={{ color: '#ff4d4f' }} />
                              <span>{route.endStation}</span>
                            </div>
                            <Space size={16} style={{ color: '#8c8c8c', fontSize: 12 }}>
                              <span>
                                <ClockCircleOutlined /> 首班 {route.firstBus} 末班 {route.lastBus}
                              </span>
                              <span>共 {route.stations.length} 站</span>
                            </Space>
                          </div>
                        }
                      />
                      {route.realTimeData && (
                        <div style={{ textAlign: 'right' }}>
                          <Badge
                            status="processing"
                            text={`${route.realTimeData.arrivalMinutes}分钟到达`}
                          />
                          <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                            {route.realTimeData.busCount} 辆车运行中
                          </div>
                        </div>
                      )}
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="未找到相关线路" />
              )}
            </Card>
          </Col>

          {selectedRoute && (
            <Col span={14}>
              <Card
                className="card-shadow"
                title={
                  <Space>
                    <span>{selectedRoute.routeNo}</span>
                    <Tag color="blue">{selectedRoute.price}</Tag>
                    <Button
                      type="text"
                      icon={<ReloadOutlined />}
                      onClick={refreshRealTimeData}
                      size="small"
                    >
                      刷新
                    </Button>
                  </Space>
                }
                extra={
                  <Button type="text" onClick={() => setSelectedRoute(null)}>
                    关闭
                  </Button>
                }
              >
                <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="起点站">{selectedRoute.startStation}</Descriptions.Item>
                  <Descriptions.Item label="终点站">{selectedRoute.endStation}</Descriptions.Item>
                  <Descriptions.Item label="首班车">{selectedRoute.firstBus}</Descriptions.Item>
                  <Descriptions.Item label="末班车">{selectedRoute.lastBus}</Descriptions.Item>
                  <Descriptions.Item label="票价">{selectedRoute.price}</Descriptions.Item>
                  <Descriptions.Item label="站点数">{selectedRoute.stations.length} 站</Descriptions.Item>
                </Descriptions>

                {selectedRoute.realTimeData && (
                  <Alert
                    message="实时到站信息"
                    description={
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Statistic
                              title="当前位置"
                              value={selectedRoute.realTimeData.currentStation}
                              valueStyle={{ fontSize: 16 }}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title="下一站"
                              value={selectedRoute.realTimeData.nextStation}
                              valueStyle={{ fontSize: 16 }}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title="预计到达"
                              value={selectedRoute.realTimeData.arrivalMinutes}
                              suffix="分钟"
                              valueStyle={{ fontSize: 16, color: '#52c41a' }}
                            />
                          </Col>
                        </Row>
                        <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                          共 {selectedRoute.realTimeData.busCount} 辆车运行中，数据每30秒自动刷新
                        </div>
                      </Space>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Card size="small" title="站点列表">
                  <List
                    dataSource={selectedRoute.stations}
                    renderItem={(station) => (
                      <List.Item
                        style={{
                          background:
                            selectedRoute.realTimeData?.currentStation === station.name
                              ? '#e6f7ff'
                              : selectedRoute.realTimeData?.nextStation === station.name
                              ? '#fff7e6'
                              : 'transparent',
                          padding: '8px 12px',
                          borderRadius: 4
                        }}
                      >
                        <Space>
                          <div
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background:
                                selectedRoute.realTimeData?.currentStation === station.name
                                  ? '#1890ff'
                                  : '#d9d9d9',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 600
                            }}
                          >
                            {station.index}
                          </div>
                          <span
                            style={{
                              fontWeight:
                                selectedRoute.realTimeData?.currentStation === station.name ||
                                selectedRoute.realTimeData?.nextStation === station.name
                                  ? 600
                                  : 400
                            }}
                          >
                            {station.name}
                          </span>
                          {selectedRoute.realTimeData?.currentStation === station.name && (
                            <Tag color="blue" size="small">
                              当前位置
                            </Tag>
                          )}
                          {selectedRoute.realTimeData?.nextStation === station.name && (
                            <Tag color="orange" size="small">
                              下一站
                            </Tag>
                          )}
                        </Space>
                      </List.Item>
                    )}
                  />
                </Card>
              </Card>
            </Col>
          )}
        </Row>
      </div>
    </div>
  )
}

export default Bus
