import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  Row,
  Col,
  Statistic,
  Badge,
  Progress,
  Space,
  Typography,
  Tooltip,
  List,
} from 'antd'
import {
  DashboardOutlined,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../store/appStore'

const { Text } = Typography

interface ProvinceVolume {
  rank: number
  name: string
  volume: number
}

interface AlertItem {
  id: string
  severity: '紧急' | '警告' | '提示'
  message: string
  time: string
}

interface ApiCallItem {
  key: string
  name: string
  calls: number
  successRate: number
  avgTime: number
}

const provinceData: ProvinceVolume[] = [
  { rank: 1, name: '广东省', volume: 28456 },
  { rank: 2, name: '江苏省', volume: 24123 },
  { rank: 3, name: '浙江省', volume: 22891 },
  { rank: 4, name: '山东省', volume: 19567 },
  { rank: 5, name: '河南省', volume: 17234 },
  { rank: 6, name: '四川省', volume: 16892 },
  { rank: 7, name: '湖北省', volume: 15432 },
  { rank: 8, name: '湖南省', volume: 14567 },
  { rank: 9, name: '福建省', volume: 12891 },
  { rank: 10, name: '安徽省', volume: 11234 },
]

const alertData: AlertItem[] = [
  { id: '1', severity: '紧急', message: '浙江省身份认证接口响应超时 (>5s)', time: '10:23:45' },
  { id: '2', severity: '警告', message: '湖南省电子证照服务调用量异常增长', time: '10:18:32' },
  { id: '3', severity: '提示', message: '上海市印章验章服务将于今日18:00维护', time: '10:12:07' },
  { id: '4', severity: '紧急', message: '北京市统一支付平台连接池耗尽', time: '09:56:21' },
  { id: '5', severity: '警告', message: '四川省人口信息查询接口错误率上升至2.3%', time: '09:45:18' },
  { id: '6', severity: '提示', message: '山东省社保数据同步任务延迟执行', time: '09:33:50' },
  { id: '7', severity: '警告', message: '湖北省不动产登记服务响应时间超过阈值', time: '09:21:44' },
  { id: '8', severity: '提示', message: '江苏省企业信用报告接口版本升级通知', time: '09:10:15' },
]

const apiCallData: ApiCallItem[] = [
  { key: '1', name: '统一身份认证', calls: 523867, successRate: 99.97, avgTime: 28 },
  { key: '2', name: '电子证照验证', calls: 412356, successRate: 99.92, avgTime: 35 },
  { key: '3', name: '人口信息查询', calls: 389124, successRate: 99.98, avgTime: 22 },
  { key: '4', name: '社保缴纳记录', calls: 345678, successRate: 99.85, avgTime: 41 },
  { key: '5', name: '企业工商登记', calls: 298765, successRate: 99.91, avgTime: 31 },
  { key: '6', name: '电子印章签章', calls: 267432, successRate: 99.96, avgTime: 48 },
  { key: '7', name: '不动产权属查询', calls: 234567, successRate: 99.88, avgTime: 52 },
  { key: '8', name: '医保结算交换', calls: 198765, successRate: 99.82, avgTime: 56 },
  { key: '9', name: '企业信用报告', calls: 167890, successRate: 99.94, avgTime: 38 },
  { key: '10', name: '流动人口同步', calls: 145678, successRate: 99.79, avgTime: 67 },
]

const severityColorMap: Record<string, string> = {
  '紧急': 'red',
  '警告': 'orange',
  '提示': 'blue',
}

const apiColumns = [
  { title: '接口名称', dataIndex: 'name', key: 'name', width: 140 },
  {
    title: '调用次数',
    dataIndex: 'calls',
    key: 'calls',
    width: 110,
    render: (v: number) => v.toLocaleString(),
  },
  {
    title: '成功率',
    dataIndex: 'successRate',
    key: 'successRate',
    width: 90,
    render: (v: number) => (
      <Text style={{ color: v >= 99.9 ? '#52c41a' : v >= 99.5 ? '#faad14' : '#ff4d4f' }}>
        {v}%
      </Text>
    ),
  },
  {
    title: '平均耗时',
    dataIndex: 'avgTime',
    key: 'avgTime',
    width: 90,
    render: (v: number) => (
      <Text style={{ color: v <= 30 ? '#52c41a' : v <= 50 ? '#faad14' : '#ff4d4f' }}>
        {v}ms
      </Text>
    ),
  },
]

export default function MonitorDashboard() {
  useAppStore((s) => s.auditLog)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const maxVolume = provinceData[0].volume

  const darkCardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(123, 47, 247, 0.08))',
    border: '1px solid rgba(0, 212, 255, 0.2)',
    borderRadius: 12,
  }

  const sectionTitleStyle: React.CSSProperties = {
    color: '#00d4ff',
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 16,
    borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
    paddingBottom: 8,
  }

  return (
    <div className="monitor-dashboard">
      <div className="monitor-title">
        <DashboardOutlined style={{ marginRight: 12 }} />
        国家级政务服务平台 · 运行监测中心
        <div style={{ fontSize: 14, letterSpacing: 1, marginTop: 4 }}>
          {currentTime.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'long',
          })}{' '}
          {currentTime.toLocaleTimeString('zh-CN')}
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={4}>
          <div className="monitor-stat-box">
            <div className="monitor-value">158,392</div>
            <div className="monitor-label">
              今日办件量
              <Tag color="green" style={{ marginLeft: 6, fontSize: 11 }}>
                <RiseOutlined /> 12.3%
              </Tag>
            </div>
          </div>
        </Col>
        <Col span={4}>
          <div className="monitor-stat-box">
            <div className="monitor-value">2.87亿</div>
            <div className="monitor-label">累计办件量</div>
          </div>
        </Col>
        <Col span={4}>
          <div className="monitor-stat-box">
            <div className="monitor-value">2.3h</div>
            <div className="monitor-label">
              平均办理时长
              <ClockCircleOutlined style={{ marginLeft: 6, color: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
        </Col>
        <Col span={4}>
          <div className="monitor-stat-box">
            <div className="monitor-value">0.87%</div>
            <div className="monitor-label">
              超时率
              <Tag color="green" style={{ marginLeft: 6, fontSize: 11 }}>
                <FallOutlined /> 0.15%
              </Tag>
            </div>
          </div>
        </Col>
        <Col span={4}>
          <div className="monitor-stat-box">
            <div className="monitor-value" style={{ background: 'linear-gradient(180deg, #ff4d4f, #faad14)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>127</div>
            <div className="monitor-label">
              差评工单
              <WarningOutlined style={{ marginLeft: 6, color: '#faad14' }} />
            </div>
          </div>
        </Col>
        <Col span={4}>
          <div className="monitor-stat-box">
            <div className="monitor-value">3,285,671</div>
            <div className="monitor-label">
              接口调用量
              <ApiOutlined style={{ marginLeft: 6, color: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card
            size="small"
            style={darkCardStyle}
            styles={{ header: { color: '#00d4ff', borderBottom: '1px solid rgba(0, 212, 255, 0.2)', background: 'transparent' }, body: { color: '#fff' } }}
            title={
              <span style={{ color: '#00d4ff' }}>
                <ThunderboltOutlined style={{ marginRight: 6 }} />
                各省市办件量排名
              </span>
            }
          >
            <List
              size="small"
              dataSource={provinceData}
              renderItem={(item) => (
                <List.Item style={{ borderBlockEnd: '1px solid rgba(0, 212, 255, 0.08)', padding: '6px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        background:
                          item.rank <= 3
                            ? 'linear-gradient(135deg, #00d4ff, #7b2ff7)'
                            : 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {item.rank}
                    </span>
                    <span style={{ width: 60, color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>{item.name}</span>
                    <Progress
                      percent={Math.round((item.volume / maxVolume) * 100)}
                      showInfo={false}
                      strokeColor={{ from: '#00d4ff', to: '#7b2ff7' }}
                      trailColor="rgba(255,255,255,0.06)"
                      size="small"
                      style={{ flex: 1 }}
                    />
                    <span style={{ width: 60, textAlign: 'right', color: '#00d4ff', fontSize: 13, fontWeight: 500 }}>
                      {item.volume.toLocaleString()}
                    </span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            size="small"
            style={darkCardStyle}
            styles={{ header: { color: '#00d4ff', borderBottom: '1px solid rgba(0, 212, 255, 0.2)', background: 'transparent' }, body: { color: '#fff' } }}
            title={
              <span style={{ color: '#00d4ff' }}>
                <WarningOutlined style={{ marginRight: 6 }} />
                实时告警
                <Badge count={alertData.filter((a) => a.severity === '紧急').length} style={{ marginLeft: 8 }} />
              </span>
            }
          >
            <List
              size="small"
              dataSource={alertData}
              renderItem={(item) => (
                <List.Item style={{ borderBlockEnd: '1px solid rgba(0, 212, 255, 0.08)', padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 8 }}>
                    <Tag
                      color={severityColorMap[item.severity]}
                      style={{ margin: 0, minWidth: 44, textAlign: 'center', fontSize: 11 }}
                    >
                      {item.severity}
                    </Tag>
                    <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                      {item.message}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, flexShrink: 0 }}>
                      {item.time}
                    </span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            size="small"
            style={darkCardStyle}
            styles={{ header: { color: '#00d4ff', borderBottom: '1px solid rgba(0, 212, 255, 0.2)', background: 'transparent' }, body: { color: '#fff' } }}
            title={
              <span style={{ color: '#00d4ff' }}>
                <ApiOutlined style={{ marginRight: 6 }} />
                接口调用Top10
              </span>
            }
          >
            <Table
              size="small"
              dataSource={apiCallData}
              columns={apiColumns}
              pagination={false}
              style={{ background: 'transparent' }}
              className="monitor-api-table"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card
            size="small"
            style={darkCardStyle}
            styles={{ header: { color: '#00d4ff', borderBottom: '1px solid rgba(0, 212, 255, 0.2)', background: 'transparent' }, body: { color: '#fff' } }}
            title={
              <span style={{ color: '#00d4ff' }}>
                <DashboardOutlined style={{ marginRight: 6 }} />
                系统运行状态
              </span>
            }
          >
            <Row gutter={24}>
              <Col span={6}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.65)' }}>CPU使用率</span>}
                  value={67}
                  suffix="%"
                  valueStyle={{ color: '#00d4ff', fontSize: 28 }}
                />
                <Progress
                  percent={67}
                  showInfo={false}
                  strokeColor={{ from: '#00d4ff', to: '#7b2ff7' }}
                  trailColor="rgba(255,255,255,0.06)"
                  size="small"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.65)' }}>内存使用</span>}
                  value={72}
                  suffix="%"
                  valueStyle={{ color: '#00d4ff', fontSize: 28 }}
                />
                <Progress
                  percent={72}
                  showInfo={false}
                  strokeColor={{ from: '#00d4ff', to: '#7b2ff7' }}
                  trailColor="rgba(255,255,255,0.06)"
                  size="small"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.65)' }}>网络带宽</span>}
                  value={45}
                  suffix="%"
                  valueStyle={{ color: '#00d4ff', fontSize: 28 }}
                />
                <Progress
                  percent={45}
                  showInfo={false}
                  strokeColor={{ from: '#52c41a', to: '#00d4ff' }}
                  trailColor="rgba(255,255,255,0.06)"
                  size="small"
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.65)' }}>数据库连接</span>}
                  value={156}
                  suffix="/500"
                  valueStyle={{ color: '#00d4ff', fontSize: 28 }}
                />
                <Progress
                  percent={31}
                  showInfo={false}
                  strokeColor={{ from: '#52c41a', to: '#00d4ff' }}
                  trailColor="rgba(255,255,255,0.06)"
                  size="small"
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            size="small"
            style={darkCardStyle}
            styles={{ header: { color: '#00d4ff', borderBottom: '1px solid rgba(0, 212, 255, 0.2)', background: 'transparent' }, body: { color: '#fff' } }}
            title={
              <span style={{ color: '#00d4ff' }}>
                <CheckCircleOutlined style={{ marginRight: 6 }} />
                合规检查状态
              </span>
            }
          >
            <Row gutter={24}>
              <Col span={6}>
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <Tooltip title="等保三级测评">
                    <Badge status="success" />
                    <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} />
                  </Tooltip>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>等保三级</Text>
                  <Tag color="green" style={{ margin: 0 }}>通过</Tag>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <Tooltip title="商用密码应用安全性评估">
                    <Badge status="success" />
                    <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} />
                  </Tooltip>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>商密评估</Text>
                  <Tag color="green" style={{ margin: 0 }}>通过</Tag>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <Tooltip title="审计日志完整性检查">
                    <Badge status="success" />
                    <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} />
                  </Tooltip>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>审计日志</Text>
                  <Tag color="green" style={{ margin: 0 }}>正常</Tag>
                </Space>
              </Col>
              <Col span={6}>
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <Tooltip title="数据备份恢复验证">
                    <Badge status="success" />
                    <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} />
                  </Tooltip>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>数据备份</Text>
                  <Tag color="green" style={{ margin: 0 }}>正常</Tag>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <style>{`
        .monitor-dashboard .ant-card {
          background: transparent;
        }
        .monitor-dashboard .ant-card-head {
          border-bottom: 1px solid rgba(0, 212, 255, 0.2);
        }
        .monitor-dashboard .ant-table {
          background: transparent;
          color: rgba(255, 255, 255, 0.85);
        }
        .monitor-dashboard .ant-table-thead > tr > th {
          background: rgba(0, 212, 255, 0.08);
          color: rgba(255, 255, 255, 0.7);
          border-bottom: 1px solid rgba(0, 212, 255, 0.15);
          font-size: 12px;
        }
        .monitor-dashboard .ant-table-tbody > tr > td {
          border-bottom: 1px solid rgba(0, 212, 255, 0.08);
          color: rgba(255, 255, 255, 0.85);
          font-size: 13px;
        }
        .monitor-dashboard .ant-table-tbody > tr:hover > td {
          background: rgba(0, 212, 255, 0.08);
        }
        .monitor-dashboard .ant-list-item {
          border-block-end-color: rgba(0, 212, 255, 0.08) !important;
        }
        .monitor-dashboard .ant-statistic-title {
          color: rgba(255, 255, 255, 0.65);
        }
        .monitor-dashboard .ant-progress-bg {
          box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
        }
      `}</style>
    </div>
  )
}
