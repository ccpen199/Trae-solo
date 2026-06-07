import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag } from 'antd'
import { LoginOutlined, SafetyCertificateOutlined, AlipayCircleOutlined, MobileOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import api from '../../api'

const defaultLogs = [
  { id: 1, username: '张三', channel: '账号密码', ip: '192.168.1.101', time: '2024-01-15 10:30:00', status: '成功' },
  { id: 2, username: '李四', channel: 'CA证书', ip: '192.168.1.102', time: '2024-01-15 10:25:00', status: '成功' },
  { id: 3, username: '王五', channel: '支付宝', ip: '10.0.0.56', time: '2024-01-15 10:20:00', status: '成功' },
  { id: 4, username: '赵六', channel: '闽政通', ip: '10.0.0.78', time: '2024-01-15 10:15:00', status: '成功' },
  { id: 5, username: '钱七', channel: '账号密码', ip: '192.168.2.200', time: '2024-01-15 10:10:00', status: '失败' },
  { id: 6, username: '孙八', channel: 'CA证书', ip: '192.168.1.103', time: '2024-01-15 09:55:00', status: '成功' },
  { id: 7, username: '周九', channel: '支付宝', ip: '10.0.0.90', time: '2024-01-15 09:45:00', status: '成功' },
  { id: 8, username: '吴十', channel: '账号密码', ip: '192.168.3.50', time: '2024-01-15 09:30:00', status: '失败' },
  { id: 9, username: '郑十一', channel: '闽政通', ip: '10.0.0.110', time: '2024-01-15 09:20:00', status: '成功' },
  { id: 10, username: '冯十二', channel: 'CA证书', ip: '192.168.1.104', time: '2024-01-15 09:10:00', status: '成功' },
]

export default function AuthCenter() {
  const [stats, setStats] = useState({ total: 1234, caRatio: 35.2, alipayRatio: 28.5, mztratio: 25.1 })
  const [logs, setLogs] = useState(defaultLogs)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [statsRes, logsRes] = await Promise.all([
      api.get('/auth/stats'),
      api.get('/auth/logs'),
    ])
    if (statsRes.success && statsRes.data?.data) setStats(statsRes.data.data)
    if (logsRes.success && logsRes.data?.data) setLogs(logsRes.data.data)
  }

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: [
        { value: 35.2, name: 'CA证书', itemStyle: { color: '#1890ff' } },
        { value: 28.5, name: '支付宝', itemStyle: { color: '#52c41a' } },
        { value: 25.1, name: '闽政通', itemStyle: { color: '#faad14' } },
        { value: 11.2, name: '账号密码', itemStyle: { color: '#722ed1' } },
      ],
    }],
  }

  const columns = [
    { title: '用户', dataIndex: 'username', key: 'username', width: 100 },
    {
      title: '认证渠道', dataIndex: 'channel', key: 'channel', width: 120,
      render: (c) => {
        const colorMap = { '账号密码': 'default', 'CA证书': 'blue', '支付宝': 'green', '闽政通': 'orange' }
        return <Tag color={colorMap[c] || 'default'}>{c}</Tag>
      },
    },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 140 },
    { title: '时间', dataIndex: 'time', key: 'time', width: 180 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s) => <Tag color={s === '成功' ? 'success' : 'error'}>{s}</Tag>,
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="今日登录数" value={stats.total} prefix={<LoginOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="CA登录占比" value={stats.caRatio} suffix="%" prefix={<SafetyCertificateOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="支付宝登录占比" value={stats.alipayRatio} suffix="%" prefix={<AlipayCircleOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="闽政通登录占比" value={stats.mztratio} suffix="%" prefix={<MobileOutlined />} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="认证日志" style={{ borderRadius: 8 }}>
            <Table
              columns={columns}
              dataSource={logs}
              rowKey="id"
              size="middle"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: logs.length,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (page, size) => setPagination({ current: page, pageSize: size }),
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="登录渠道分布" style={{ borderRadius: 8 }}>
            <ReactECharts option={pieOption} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
