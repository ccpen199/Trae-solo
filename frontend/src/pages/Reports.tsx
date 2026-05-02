import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Button,
  message,
  Tag,
  Descriptions,
  Divider,
  Tabs,
} from 'antd'
import {
  ReloadOutlined,
  MoneyCollectOutlined,
  HomeOutlined,
  UserOutlined,
  RiseOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { reportsApi } from '@/services/api'

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [dailyReport, setDailyReport] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [activeTab, setActiveTab] = useState('overview')

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const response = await reportsApi.getDashboard()
      if (response.data.success) {
        setDashboardData(response.data.data)
      }
    } catch (error) {
      message.error('获取仪表盘数据失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyReport = async () => {
    setLoading(true)
    try {
      const response = await reportsApi.getDailyReport(selectedDate)
      if (response.data.success) {
        setDailyReport(response.data.data)
      }
    } catch (error) {
      message.error('获取日报数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyReport()
    }
  }, [activeTab, selectedDate])

  const revenueColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '入住率',
      dataIndex: 'occupancyRate',
      key: 'occupancyRate',
      render: (val: number) => `${val?.toFixed(2) || 0}%`,
    },
    {
      title: '平均房价',
      dataIndex: 'avgDailyRate',
      key: 'avgDailyRate',
      render: (val: number) => `¥${val?.toFixed(2) || 0}`,
    },
    {
      title: 'RevPAR',
      dataIndex: 'revpar',
      key: 'revpar',
      render: (val: number) => `¥${val?.toFixed(2) || 0}`,
    },
    {
      title: '房费收入',
      dataIndex: 'roomRevenue',
      key: 'roomRevenue',
      render: (val: number) => `¥${val?.toFixed(2) || 0}`,
    },
    {
      title: '其他收入',
      dataIndex: 'otherRevenue',
      key: 'otherRevenue',
      render: (val: number) => `¥${val?.toFixed(2) || 0}`,
    },
    {
      title: '总收入',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      render: (val: number) => `¥${val?.toFixed(2) || 0}`,
    },
  ]

  const tabItems = [
    { key: 'overview', label: '经营概览' },
    { key: 'daily', label: '日报详情' },
    { key: 'revenue', label: '营收趋势' },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>报表分析</h2>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      {activeTab === 'overview' && (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic
                  title="总房间数"
                  value={dashboardData?.rooms?.total || 0}
                  prefix={<HomeOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic
                  title="在住房间"
                  value={dashboardData?.rooms?.occupied || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic
                  title="入住率"
                  value={dashboardData?.rooms?.occupancyRate || 0}
                  suffix="%"
                  precision={2}
                  prefix={<RiseOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card>
                <Statistic
                  title="今日营收"
                  value={dashboardData?.today?.revenue || 0}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          {dashboardData?.performance && (
            <Card title="经营指标" loading={loading}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="平均房价 (ADR)"
                      value={dashboardData.performance?.avgDailyRate || 0}
                      precision={2}
                      prefix="¥"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="每间可售房收入 (RevPAR)"
                      value={dashboardData.performance?.revpar || 0}
                      precision={2}
                      prefix="¥"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="总营收"
                      value={dashboardData.performance?.totalRevenue || 0}
                      precision={2}
                      prefix="¥"
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          )}

          <Card title="今日运营数据" loading={loading} style={{ marginTop: 16 }}>
            <Descriptions column={3} bordered>
              <Descriptions.Item label="今日入住">
                <Tag color="green">{dashboardData?.today?.checkIns || 0}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="今日退房">
                <Tag color="blue">{dashboardData?.today?.checkOuts || 0}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="今日预订">
                <Tag color="purple">{dashboardData?.today?.reservations || 0}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="今日营收">
                <span style={{ fontWeight: 'bold', color: '#faad14' }}>
                  ¥{(dashboardData?.today?.revenue || 0).toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="今日收款">
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                  ¥{(dashboardData?.today?.paidAmount || 0).toFixed(2)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="待清洁房间">
                <Tag color="red">{dashboardData?.today?.pendingCleaning || 0}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="房间状态统计" loading={loading} style={{ marginTop: 16 }}>
            <Descriptions column={4} bordered>
              <Descriptions.Item label="空闲房">
                <Tag color="green">{dashboardData?.rooms?.vacant || 0}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="在住房">
                <Tag color="blue">{dashboardData?.rooms?.occupied || 0}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="脏房">
                <Tag color="orange">{dashboardData?.rooms?.dirty || 0}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="维修房">
                <Tag color="red">{dashboardData?.rooms?.maintenance || 0}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}

      {activeTab === 'daily' && (
        <div>
          <Card
            title="日报详情"
            loading={loading}
            extra={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <DatePicker
                  value={dayjs(selectedDate)}
                  onChange={(date) => date && setSelectedDate(date.format('YYYY-MM-DD'))}
                />
                <Button icon={<ReloadOutlined />} onClick={fetchDailyReport}>
                  刷新
                </Button>
              </div>
            }
          >
            {dailyReport && (
              <div>
                <Card size="small" title={selectedDate} style={{ marginBottom: 16 }}>
                  <Descriptions column={3} bordered>
                    <Descriptions.Item label="日期">
                      {dayjs(dailyReport.date).format('YYYY年MM月DD日')}
                    </Descriptions.Item>
                    <Descriptions.Item label="入住率">
                      <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                        {dailyReport.occupancyRate?.toFixed(2) || 0}%
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="平均房价">
                      <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                        ¥{dailyReport.avgDailyRate?.toFixed(2) || 0}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="RevPAR">
                      <span style={{ fontWeight: 'bold', color: '#722ed1' }}>
                        ¥{dailyReport.revpar?.toFixed(2) || 0}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="入住人数">
                      {dailyReport.checkIns || 0}
                    </Descriptions.Item>
                    <Descriptions.Item label="退房人数">
                      {dailyReport.checkOuts || 0}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Divider orientation="left">营收明细</Divider>
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Descriptions column={4} bordered>
                    <Descriptions.Item label="房费收入">
                      <span style={{ fontWeight: 'bold' }}>
                        ¥{dailyReport.roomRevenue?.toFixed(2) || 0}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="餐饮收入">
                      <span style={{ fontWeight: 'bold' }}>
                        ¥{dailyReport.fbRevenue?.toFixed(2) || 0}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="其他收入">
                      <span style={{ fontWeight: 'bold' }}>
                        ¥{dailyReport.otherRevenue?.toFixed(2) || 0}
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="总收入">
                      <span style={{ fontWeight: 'bold', color: '#faad14', fontSize: 16 }}>
                        ¥{dailyReport.totalRevenue?.toFixed(2) || 0}
                      </span>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Divider orientation="left">房务数据</Divider>
                <Card size="small">
                  <Descriptions column={4} bordered>
                    <Descriptions.Item label="已清洁房间">
                      <Tag color="green">{dailyReport.cleanedRooms || 0}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="待清洁房间">
                      <Tag color="orange">{dailyReport.dirtyRooms || 0}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="维修房间">
                      <Tag color="red">{dailyReport.maintenanceRooms || 0}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="可用房间">
                      <Tag color="blue">{dailyReport.availableRooms || 0}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div>
          <Card
            title="营收趋势"
            loading={loading}
            extra={
              <Button icon={<ReloadOutlined />} onClick={fetchDashboard}>
                刷新
              </Button>
            }
          >
            <Table
              columns={revenueColumns}
              dataSource={dashboardData?.revenue || []}
              rowKey="date"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </div>
      )}
    </div>
  )
}

export default Reports
