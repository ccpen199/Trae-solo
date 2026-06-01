import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, List, Tag, Spin, Empty, Button, Typography, Divider, Space, Steps, Timeline, Alert, Progress, Table } from 'antd'
import {
  InboxOutlined, WarningOutlined, ClockCircleOutlined, GiftOutlined,
  ArrowUpOutlined, ArrowDownOutlined, SearchOutlined, SendOutlined,
  QrcodeOutlined, ShopOutlined, TeamOutlined, DatabaseOutlined,
  BarChartOutlined, SafetyOutlined, AuditOutlined, FileTextOutlined,
  CheckCircleOutlined, SyncOutlined, CloseCircleOutlined, UserOutlined,
  EnvironmentOutlined, FundOutlined, DollarOutlined, RiseOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

const roleConfig = {
  platform: {
    title: '平台管理员工作台',
    subtitle: '全局数据管控、系统配置、商家管理',
    color: 'magenta',
    icon: <BarChartOutlined />,
  },
  ops: {
    title: '运营管理员工作台',
    subtitle: '运营数据分析、活动管理、客服支持',
    color: 'geekblue',
    icon: <FundOutlined />,
  },
  admin: {
    title: '系统管理员工作台',
    subtitle: '用户管理、内容审核、权限分配',
    color: 'red',
    icon: <SafetyOutlined />,
  },
  station_master: {
    title: '驿站站长工作台',
    subtitle: '驿站运营管理、包裹代收、快递员对接',
    color: 'green',
    icon: <ShopOutlined />,
  },
  user: {
    title: '个人工作台',
    subtitle: '查件、取件、寄件、社区互动',
    color: 'blue',
    icon: <UserOutlined />,
  },
}

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const { user, roleLabel } = useAuth()
  const navigate = useNavigate()
  const role = user?.role || 'user'
  const config = roleConfig[role] || roleConfig.user

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="加载工作台..." />
      </div>
    )
  }

  const renderUserDashboard = () => (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/parcels')} style={{ cursor: 'pointer' }}>
            <Statistic title="我的包裹" value={4} prefix={<InboxOutlined />} valueStyle={{ color: '#1890ff' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}><ArrowUpOutlined style={{ color: '#52c41a' }} /> 本周新增 2 件</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/anomaly')} style={{ cursor: 'pointer' }}>
            <Statistic title="异常件" value={1} prefix={<WarningOutlined />} valueStyle={{ color: '#ff4d4f' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>滞留超48h，请及时处理</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/pickup')} style={{ cursor: 'pointer' }}>
            <Statistic title="待取件" value={2} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>请及时取件，避免超时转驿站</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/community/recycling')} style={{ cursor: 'pointer' }}>
            <Statistic title="绿色积分" value={155} prefix={<GiftOutlined />} valueStyle={{ color: '#52c41a' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>参与回收可获得更多积分</p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="快捷操作" size="small">
            <Row gutter={[8, 8]}>
              {[
                { icon: <SearchOutlined style={{ fontSize: 24, color: '#1890ff' }} />, title: '查询包裹', desc: '输入单号追踪物流', path: '/track' },
                { icon: <SendOutlined style={{ fontSize: 24, color: '#52c41a' }} />, title: '我要寄件', desc: '在线下单，上门揽收', path: '/shipping/regular' },
                { icon: <QrcodeOutlined style={{ fontSize: 24, color: '#722ed1' }} />, title: '取件服务', desc: '动态取件码，柜机取件', path: '/pickup' },
                { icon: <ShopOutlined style={{ fontSize: 24, color: '#fa8c16' }} />, title: '附近驿站', desc: '查找周边合作驿站', path: '/community/stations' },
                { icon: <TeamOutlined style={{ fontSize: 24, color: '#13c2c2' }} />, title: '邻里互助', desc: '代取快递、跑腿服务', path: '/community/posts' },
                { icon: <GiftOutlined style={{ fontSize: 24, color: '#eb2f96' }} />, title: '绿色回收', desc: '纸箱回收换积分', path: '/community/recycling' },
              ].map(item => (
                <Col span={8} key={item.title}>
                  <Card hoverable size="small" onClick={() => navigate(item.path)} style={{ textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ marginBottom: 8 }}>{item.icon}</div>
                    <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
                    <div><Text type="secondary" style={{ fontSize: 11 }}>{item.desc}</Text></div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="最近包裹动态" size="small">
            <Timeline
              items={[
                { color: 'blue', children: <><Text strong>SF1234567890001</Text> 运输中 — 杭州市中转站 <Text type="secondary">{dayjs().subtract(2, 'hour').format('HH:mm')}</Text></> },
                { color: 'green', children: <><Text strong>ZT1234567890002</Text> 已签收 — 签收人：本人 <Text type="secondary">{dayjs().subtract(1, 'day').format('MM-DD')}</Text></> },
                { color: 'orange', children: <><Text strong>YT1234567890003</Text> 正在派送 — 快递员李师傅 <Text type="secondary">{dayjs().subtract(3, 'hour').format('HH:mm')}</Text></> },
                { color: 'red', children: <><Text strong>YD1234567890005</Text> 异常 — 滞留超48h <Tag color="red" style={{ marginLeft: 4 }}>需处理</Tag></> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  )

  const renderStationMasterDashboard = () => (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/parcels')}>
            <Statistic title="代收包裹" value={28} prefix={<InboxOutlined />} valueStyle={{ color: '#1890ff' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>今日入库 6 件</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/pickup')}>
            <Statistic title="待取件" value={12} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>3件即将超时</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/community/stations')}>
            <Statistic title="驿站收入" value={356} prefix={<DollarOutlined />} valueStyle={{ color: '#52c41a' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>本月代收服务费</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/community/recycling')}>
            <Statistic title="回收量" value={45} prefix={<GiftOutlined />} valueStyle={{ color: '#722ed1' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>纸箱回收 45kg</p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="驿站快捷操作" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Button type="primary" icon={<InboxOutlined />} block onClick={() => navigate('/parcels')}>包裹入库登记</Button>
              <Button icon={<QrcodeOutlined />} block onClick={() => navigate('/pickup')}>取件码管理</Button>
              <Button icon={<TeamOutlined />} block onClick={() => navigate('/community/posts')}>社区互助管理</Button>
              <Button icon={<GiftOutlined />} block onClick={() => navigate('/community/recycling')}>回收积分管理</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="今日取件待办" size="small">
            <Timeline
              items={[
                { color: 'orange', children: <>SF1234567890001 — 张三，丰巢A01柜 <Tag color="orange">即将超时</Tag></> },
                { color: 'blue', children: <>ZT1234567890002 — 李四，驿站暂存 <Tag color="blue">待取</Tag></> },
                { color: 'green', children: <>YT1234567890003 — 王五，已取件 <Tag color="green">完成</Tag></> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  )

  const renderAdminDashboard = () => (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/admin/parcels')}>
            <Statistic title="全局包裹" value={1247} prefix={<DatabaseOutlined />} valueStyle={{ color: '#1890ff' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>今日新增 58 件</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/admin/users')}>
            <Statistic title="注册用户" value={386} prefix={<TeamOutlined />} valueStyle={{ color: '#52c41a' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>今日注册 12 人</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/admin/orders')}>
            <Statistic title="寄件订单" value={523} prefix={<FileTextOutlined />} valueStyle={{ color: '#faad14' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>待揽收 8 单</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/community/stations')}>
            <Statistic title="合作驿站" value={24} prefix={<ShopOutlined />} valueStyle={{ color: '#722ed1' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>2家待审核</p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Card title="管理快捷入口" size="small">
            <Row gutter={[8, 8]}>
              {[
                { icon: <DatabaseOutlined />, title: '包裹管理', desc: '查看所有包裹', path: '/admin/parcels', color: '#1890ff' },
                { icon: <FileTextOutlined />, title: '订单管理', desc: '寄件订单列表', path: '/admin/orders', color: '#faad14' },
                { icon: <TeamOutlined />, title: '用户管理', desc: '用户角色权限', path: '/admin/users', color: '#52c41a' },
                { icon: <FundOutlined />, title: '数据统计', desc: '全局数据分析', path: '/admin/stats', color: '#722ed1' },
                { icon: <AuditOutlined />, title: '溯源复查', desc: '哈希链验证', path: '/track', color: '#13c2c2' },
                { icon: <ShopOutlined />, title: '驿站审核', desc: '入驻审核管理', path: '/community/stations', color: '#eb2f96' },
              ].map(item => (
                <Col span={8} key={item.title}>
                  <Card hoverable size="small" onClick={() => navigate(item.path)} style={{ textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 28, color: item.color, marginBottom: 8 }}>{item.icon}</div>
                    <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
                    <div><Text type="secondary" style={{ fontSize: 11 }}>{item.desc}</Text></div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="异常告警" size="small">
            <Timeline
              items={[
                { color: 'red', children: <>3个包裹滞留超48h <Tag color="red">紧急</Tag></> },
                { color: 'orange', children: <>5个取件码即将过期 <Tag color="orange">提醒</Tag></> },
                { color: 'blue', children: <>2家驿站申请入驻 <Tag color="blue">待审</Tag></> },
              ]}
            />
            <Button type="link" onClick={() => navigate('/anomaly')}>查看全部异常</Button>
          </Card>
        </Col>
      </Row>
    </>
  )

  const renderOpsDashboard = () => (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/admin/stats')}>
            <Statistic title="今日单量" value={158} prefix={<RiseOutlined />} valueStyle={{ color: '#1890ff' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}><ArrowUpOutlined style={{ color: '#52c41a' }} /> 较昨日 +12%</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/admin/parcels')}>
            <Statistic title="在途包裹" value={843} prefix={<InboxOutlined />} valueStyle={{ color: '#52c41a' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>准时率 96.8%</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/anomaly')}>
            <Statistic title="异常率" value={2.3} suffix="%" prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>3件需人工介入</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/community/posts')}>
            <Statistic title="社区活跃度" value={67} prefix={<TeamOutlined />} valueStyle={{ color: '#722ed1' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>今日互助帖 12 条</p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="运营快捷入口" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Button type="primary" icon={<FundOutlined />} block onClick={() => navigate('/admin/stats')}>运营数据大盘</Button>
              <Button icon={<DatabaseOutlined />} block onClick={() => navigate('/admin/parcels')}>包裹监控</Button>
              <Button icon={<WarningOutlined />} block onClick={() => navigate('/anomaly')}>异常处理</Button>
              <Button icon={<TeamOutlined />} block onClick={() => navigate('/community/posts')}>社区运营</Button>
              <Button icon={<AuditOutlined />} block onClick={() => navigate('/track')}>溯源复查</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="运营数据概览" size="small">
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">配送准时率</Text>
              <Progress percent={96.8} status="active" strokeColor="#52c41a" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">客户满意度</Text>
              <Progress percent={92} status="active" strokeColor="#1890ff" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">异常处理及时率</Text>
              <Progress percent={88} status="active" strokeColor="#faad14" />
            </div>
            <div>
              <Text type="secondary">回收参与率</Text>
              <Progress percent={73} status="active" strokeColor="#722ed1" />
            </div>
          </Card>
        </Col>
      </Row>
    </>
  )

  const renderPlatformDashboard = () => (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/admin/stats')}>
            <Statistic title="平台总单量" value={52847} prefix={<BarChartOutlined />} valueStyle={{ color: '#1890ff' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}><ArrowUpOutlined style={{ color: '#52c41a' }} /> 月环比 +18%</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/admin/users')}>
            <Statistic title="平台用户" value={12583} prefix={<TeamOutlined />} valueStyle={{ color: '#52c41a' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>活跃用户 8,234</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable onClick={() => navigate('/community/stations')}>
            <Statistic title="合作网点" value={156} prefix={<EnvironmentOutlined />} valueStyle={{ color: '#faad14' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>覆盖 28 个城市</p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic title="平台营收(万)" value={284.5} prefix={<DollarOutlined />} valueStyle={{ color: '#722ed1' }} />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>本月目标完成 87%</p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Card title="平台管理入口" size="small">
            <Row gutter={[8, 8]}>
              {[
                { icon: <BarChartOutlined />, title: '数据中心', desc: '全局数据分析', path: '/admin/stats', color: '#1890ff' },
                { icon: <DatabaseOutlined />, title: '全局包裹', desc: '全量包裹追踪', path: '/admin/parcels', color: '#52c41a' },
                { icon: <FileTextOutlined />, title: '全局订单', desc: '所有寄件订单', path: '/admin/orders', color: '#faad14' },
                { icon: <TeamOutlined />, title: '用户管理', desc: '角色权限管理', path: '/admin/users', color: '#722ed1' },
                { icon: <ShopOutlined />, title: '驿站管理', desc: '网点入驻审核', path: '/community/stations', color: '#eb2f96' },
                { icon: <AuditOutlined />, title: '溯源审计', desc: '哈希链复查', path: '/track', color: '#13c2c2' },
              ].map(item => (
                <Col span={8} key={item.title}>
                  <Card hoverable size="small" onClick={() => navigate(item.path)} style={{ textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: 28, color: item.color, marginBottom: 8 }}>{item.icon}</div>
                    <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
                    <div><Text type="secondary" style={{ fontSize: 11 }}>{item.desc}</Text></div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="系统健康" size="small">
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">API 可用性</Text>
              <Progress percent={99.9} status="active" strokeColor="#52c41a" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">数据库连接池</Text>
              <Progress percent={34} status="active" strokeColor="#1890ff" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">溯源链完整性</Text>
              <Progress percent={100} status="active" strokeColor="#52c41a" />
            </div>
            <div>
              <Text type="secondary">快递商接口在线率</Text>
              <Progress percent={97.2} status="active" strokeColor="#faad14" />
            </div>
          </Card>
        </Col>
      </Row>
    </>
  )

  const dashboardRenderer = {
    user: renderUserDashboard,
    station_master: renderStationMasterDashboard,
    admin: renderAdminDashboard,
    ops: renderOpsDashboard,
    platform: renderPlatformDashboard,
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {config.icon} {config.title}
        </Title>
        <Space style={{ marginTop: 4 }}>
          <Tag color={config.color}>{roleLabel}</Tag>
          <Text type="secondary">{config.subtitle}</Text>
        </Space>
        <Divider style={{ margin: '12px 0' }} />
      </div>

      {(dashboardRenderer[role] || renderUserDashboard)()}
    </div>
  )
}

export default Dashboard
