import React, { useEffect, useState } from 'react'
import {
  Row, Col, Card, Statistic, Table, Tag, Progress, Space, Button,
  Typography, Empty, Alert, Spin, Result, Skeleton
} from 'antd'
import {
  TeamOutlined, FileSearchOutlined, FileTextOutlined, AuditOutlined,
  SafetyCertificateOutlined, BarChartOutlined, BulbOutlined, PlusOutlined,
  RightOutlined, ThunderboltOutlined, RiseOutlined, LikeOutlined,
  HomeOutlined, MessageOutlined, WarningOutlined, ReloadOutlined
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { getStats, getLawyers, getConsultations, getContracts, getDocuments } from '../api.js'
import dayjs from 'dayjs'

const { Title, Text } = Typography

const Dashboard = () => {
  const [stats, setStats] = useState({})
  const [lawyers, setLawyers] = useState([])
  const [consultations, setConsultations] = useState([])
  const [contracts, setContracts] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sRes, lRes, cRes, ctRes, dRes] = await Promise.all([
        getStats().catch(() => ({ data: { lawyers: 0, consultations: 0, contracts: 0, documents: 0 } })),
        getLawyers().catch(() => ({ data: [] })),
        getConsultations().catch(() => ({ data: [] })),
        getContracts().catch(() => ({ data: [] })),
        getDocuments().catch(() => ({ data: [] }))
      ])
      setStats(sRes.data || {})
      setLawyers(lRes.data || [])
      setConsultations(cRes.data || [])
      setContracts(ctRes.data || [])
      setDocuments(dRes.data || [])
    } catch (e) {
      console.error('Dashboard load error:', e)
      setError('数据加载失败，请检查后端服务是否正常运行')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const businessEntries = [
    {
      title: '律师库',
      icon: <TeamOutlined style={{ fontSize: 32 }} />,
      color: '#1890ff',
      bg: '#e6f7ff',
      desc: '执业证OCR核验 · 专精领域权重 · 胜诉率统计 · 客户评价情感分析',
      path: '/lawyers',
      count: stats.lawyers || 0,
      unit: '位律师',
      action: '管理律师档案'
    },
    {
      title: '法律咨询请求',
      icon: <FileSearchOutlined style={{ fontSize: 32 }} />,
      color: '#52c41a',
      bg: '#f6ffed',
      desc: '案件智能分诊 · 案由分类编码 · 证据材料哈希值 · 紧急程度标识',
      path: '/consultations',
      count: stats.consultations || 0,
      unit: '件咨询',
      action: '查看咨询列表'
    },
    {
      title: '发起法律咨询',
      icon: <MessageOutlined style={{ fontSize: 32 }} />,
      color: '#fa8c16',
      bg: '#fff7e6',
      desc: '证据SHA256哈希存证 · 实时关键要素提取 · 案由编码确认 · 智能分诊',
      path: '/consultations/new',
      count: '',
      unit: '',
      action: '立即发起咨询',
      primary: true
    },
    {
      title: '服务合约',
      icon: <SafetyCertificateOutlined style={{ fontSize: 32 }} />,
      color: '#eb2f96',
      bg: '#fff0f6',
      desc: '小时费率 · 委托范围界定 · 电子签章链 · 合约状态追踪',
      path: '/contracts',
      count: stats.contracts || 0,
      unit: '份合约',
      action: '管理服务合约'
    },
    {
      title: '法律文书库',
      icon: <FileTextOutlined style={{ fontSize: 32 }} />,
      color: '#722ed1',
      bg: '#f9f0ff',
      desc: '模板版本控制 · 地域适配标记 · 引用条款溯源 · 格式规范校验',
      path: '/documents',
      count: stats.documents || 0,
      unit: '份文书',
      action: '生成法律文书'
    },
    {
      title: '质量评估',
      icon: <BarChartOutlined style={{ fontSize: 32 }} />,
      color: '#13c2c2',
      bg: '#e6fffb',
      desc: '响应时效分析 · 解决闭环率 · 客户复购率 · 接案质量排行',
      path: '/quality',
      count: '',
      unit: '',
      action: '查看质量评估'
    },
    {
      title: '知识图谱',
      icon: <BulbOutlined style={{ fontSize: 32 }} />,
      color: '#faad14',
      bg: '#fffbe6',
      desc: '高频法律问题图谱 · 节点关联分析 · 知识检索 · 可视化展示',
      path: '/knowledge',
      count: '',
      unit: '',
      action: '浏览知识图谱'
    },
    {
      title: '合规审计追溯',
      icon: <AuditOutlined style={{ fontSize: 32 }} />,
      color: '#f5222d',
      bg: '#fff1f0',
      desc: '操作审计日志 · 个人信息保护法合规 · 全操作可复查追溯',
      path: '/audit',
      count: '',
      unit: '',
      action: '查看审计日志'
    }
  ]

  const recentCols = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    {
      title: '咨询标题', dataIndex: 'title',
      render: (t, r) => <Link to={`/chat/${r.id}`} style={{ color: '#1890ff' }}>{t}</Link>
    },
    { title: '案由编码', dataIndex: 'case_code', width: 100, render: v => v && <Tag color="geekblue">{v}</Tag> },
    { title: '分类', dataIndex: 'case_category', width: 100, render: v => v && <Tag color="blue">{v}</Tag> },
    {
      title: '紧急程度', dataIndex: 'urgency', width: 80,
      render: v => {
        const colors = { high: 'red', normal: 'blue', low: 'green' }
        const labels = { high: '紧急', normal: '普通', low: '一般' }
        return <Tag color={colors[v]}>{labels[v]}</Tag>
      }
    },
    {
      title: '证据', dataIndex: 'evidence_hashes', width: 80,
      render: v => v ? <Tag color="purple">已存证</Tag> : <Tag>无</Tag>
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: v => {
        const map = { pending: '待匹配', matched: '已匹配', contracted: '已签约', closed: '已关闭' }
        const colors = { pending: 'orange', matched: 'blue', contracted: 'green', closed: 'gray' }
        return <Tag color={colors[v]}>{map[v]}</Tag>
      }
    },
    { title: '创建时间', dataIndex: 'created_at', width: 110, render: v => dayjs(v).format('MM-DD HH:mm') }
  ]

  const lawyerRankCols = [
    { title: '排名', width: 50, render: (_, __, i) => (
      <b style={{ color: i === 0 ? '#faad14' : i === 1 ? '#a0d911' : i === 2 ? '#1890ff' : '#999' }}>#{i + 1}</b>
    )},
    {
      title: '律师', dataIndex: 'name',
      render: (t) => <Link to="/lawyers" style={{ color: '#1890ff' }}>{t}</Link>
    },
    { title: '执业年限', dataIndex: 'practice_years', width: 80, render: v => `${v}年` },
    { title: '胜诉率', dataIndex: 'win_rate', width: 120, render: v => <Progress percent={Math.round(v * 100)} size="small" /> },
    { title: '客户评价', dataIndex: 'sentiment_score', width: 120, render: v => <Progress percent={Math.round(v * 100)} size="small" status="active" strokeColor="#52c41a" /> }
  ]

  if (error) {
    return (
      <Result
        status="warning"
        icon={<WarningOutlined />}
        title="数据加载异常"
        subTitle={error}
        extra={[
          <Button type="primary" icon={<ReloadOutlined />} onClick={load}>重新加载</Button>,
          <Button onClick={() => window.location.reload()}>刷新页面</Button>
        ]}
      />
    )
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 8 }} />
        <div style={{ marginTop: 24 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </div>
    )
  }

  const hasData = lawyers.length > 0 || consultations.length > 0

  return (
    <div>
      <Card
        style={{ marginBottom: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}
        bodyStyle={{ padding: '32px 24px' }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size="small">
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                <HomeOutlined style={{ marginRight: 8 }} />
                法律业务工作台
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                专业法律服务撮合与知识管理平台 · 所有操作均符合《个人信息保护法》合规要求
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Link to="/consultations/new">
                <Button type="primary" size="large" icon={<PlusOutlined />}>
                  发起法律咨询
                </Button>
              </Link>
              <Link to="/documents">
                <Button size="large" icon={<FileTextOutlined />} style={{ background: 'white', border: 0 }}>
                  生成法律文书
                </Button>
              </Link>
            </Space>
          </Col>
        </Row>
      </Card>

      {!hasData && (
        <Alert
          message="📌 平台初始化完成，暂无业务数据"
          description="请从右侧快捷操作发起法律咨询，或在下方业务入口中开始工作。所有操作将自动进入合规审计日志。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 16 }}>📊 业务数据概览</Title>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card className="stat-card">
              <Statistic title={<><TeamOutlined /> 注册律师</>} value={stats.lawyers || 0} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card">
              <Statistic title={<><FileSearchOutlined /> 咨询请求</>} value={stats.consultations || 0} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card">
              <Statistic title={<><SafetyCertificateOutlined /> 服务合约</>} value={stats.contracts || 0} valueStyle={{ color: '#fa8c16' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card">
              <Statistic title={<><FileTextOutlined /> 生成文书</>} value={stats.documents || 0} valueStyle={{ color: '#eb2f96' }} />
            </Card>
          </Col>
        </Row>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 16 }}>🔗 业务入口（共8个模块）</Title>
        <Row gutter={[16, 16]}>
          {businessEntries.map((entry) => (
            <Col xs={24} sm={12} lg={6} key={entry.path}>
              <Card
                hoverable
                style={{
                  borderLeft: `4px solid ${entry.color}`,
                  height: '100%',
                  boxShadow: entry.primary ? '0 2px 8px rgba(250,140,22,0.15)' : 'none'
                }}
                onClick={() => navigate(entry.path)}
                bodyStyle={{ padding: 20 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{
                    background: entry.bg,
                    borderRadius: 12,
                    width: 56,
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: entry.color,
                    flexShrink: 0
                  }}>
                    {entry.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text strong style={{ fontSize: 15 }}>
                        {entry.title}
                        {entry.primary && <Tag color="orange" style={{ marginLeft: 8, fontSize: 10 }}>热门</Tag>}
                      </Text>
                      {entry.count !== '' && (
                        <Text style={{ color: entry.color, fontSize: 13, fontWeight: 'bold' }}>
                          {entry.count} {entry.unit}
                        </Text>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8, lineHeight: 1.5 }}>
                      {entry.desc}
                    </Text>
                    <Button type="link" size="small" style={{ padding: 0, color: entry.color, fontSize: 12 }}>
                      {entry.action} <RightOutlined />
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        <Col lg={14}>
          <Card
            title={<Space><FileSearchOutlined style={{ color: '#52c41a' }} /> 最近咨询请求</Space>}
            loading={loading}
            extra={<Link to="/consultations" style={{ fontSize: 13 }}>查看全部 →</Link>}
          >
            {consultations.length === 0 ? (
              <Empty
                description={
                  <span>
                    暂无咨询记录<br />
                    <Link to="/consultations/new">
                      <Button type="primary" size="small" style={{ marginTop: 12 }} icon={<PlusOutlined />}>
                        发起第一条咨询
                      </Button>
                    </Link>
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                size="small"
                columns={recentCols}
                dataSource={consultations.slice(0, 6)}
                rowKey="id"
                pagination={false}
              />
            )}
          </Card>
        </Col>
        <Col lg={10}>
          <Card
            title={<Space><RiseOutlined style={{ color: '#faad14' }} /> 律师质量排行 TOP6</Space>}
            loading={loading}
            extra={<Link to="/quality" style={{ fontSize: 13 }}>完整评估 →</Link>}
          >
            {lawyers.length === 0 ? (
              <Empty description="暂无律师数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                size="small"
                columns={lawyerRankCols}
                dataSource={lawyers.slice(0, 6)}
                rowKey="id"
                pagination={false}
              />
            )}
          </Card>
          <Card
            title={<Space><BarChartOutlined style={{ color: '#722ed1' }} /> 运营关键指标</Space>}
            size="small"
            style={{ marginTop: 16 }}
          >
            {lawyers.length === 0 ? (
              <Empty description="数据加载中" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="平均胜诉率"
                    value={Math.round(lawyers.reduce((s, l) => s + l.win_rate, 0) / Math.max(1, lawyers.length) * 100)}
                    suffix="%"
                    prefix={<RiseOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: 16 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="平均响应"
                    value={Math.round(lawyers.reduce((s, l) => s + l.avg_response_time, 0) / Math.max(1, lawyers.length))}
                    suffix="分钟"
                    prefix={<ThunderboltOutlined />}
                    valueStyle={{ color: '#722ed1', fontSize: 16 }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="客户满意度"
                    value={Math.round(lawyers.reduce((s, l) => s + l.sentiment_score, 0) / Math.max(1, lawyers.length) * 100)}
                    suffix="%"
                    prefix={<LikeOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: 16 }}
                  />
                </Col>
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      <Card size="small" style={{ marginTop: 16, background: '#fafafa' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <b>💡 使用提示：</b>
            1. 点击「发起法律咨询」开始业务流程 → 2. 系统自动智能分诊并匹配TOP3律师 → 3. 进入加密沟通室 → 4. 签署服务合约 → 5. 生成法律文书 → 6. 结案后质量评估
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <b>🔒 合规说明：</b>
            所有操作均记录审计日志，符合《个人信息保护法》最小必要原则。证据材料仅计算SHA-256哈希存证，原文不上传服务器。
          </Text>
        </Space>
      </Card>
    </div>
  )
}

export default Dashboard
