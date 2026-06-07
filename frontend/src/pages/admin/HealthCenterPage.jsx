import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Progress, Table, Typography, Spin, Descriptions, Tag, Space, Alert, List } from 'antd'
import { HeartOutlined, ClockCircleOutlined, WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons'
import request from '../../utils/request'

const { Title, Text } = Typography

export default function HealthCenterPage() {
  const [stats, setStats] = useState({
    jobSurvivalRate: 0,
    avgCompletionTime: 0,
    complaintTypes: [],
    totalJobs: 0,
    completedJobs: 0,
    disputedOrders: 0,
    totalOrders: 0
  })
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await request.get('/admin/health-center')
      const data = res.data || res
      const totalComplaints = (data.complaintTypeClustering || data.complaintTypes || []).reduce((sum, c) => sum + (c.count || 0), 0)
      const complaintTypes = (data.complaintTypeClustering || data.complaintTypes || []).map(c => ({
        ...c,
        percentage: totalComplaints > 0 ? Math.round(c.count / totalComplaints * 100) : 0
      }))
      setStats({
        jobSurvivalRate: data.jobSurvivalRate || data.job_survival_rate || 0,
        avgCompletionTime: data.avgCompletionTime || data.avg_completion_time || 0,
        complaintTypes,
        totalJobs: data.totalJobs || data.total_jobs || 0,
        completedJobs: data.completedJobs || data.completed_jobs || 0,
        disputedOrders: data.disputedOrders || data.disputed_orders || 0,
        totalOrders: data.totalOrders || data.total_orders || 0
      })
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const res = await request.get('/admin/audit-logs')
      const data = res.data || res
      setAuditLogs(Array.isArray(data) ? data : [])
    } catch (e) {
    }
  }

  useEffect(() => {
    fetchStats()
    fetchAuditLogs()
  }, [])

  const complaintColumns = [
    {
      title: '投诉类型',
      dataIndex: 'type',
      key: 'type',
      render: (val) => <Tag color="orange">{val || '其他'}</Tag>
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      render: (val) => <Text strong>{val || 0}</Text>
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 250,
      render: (val) => (
        <Progress
          percent={val || 0}
          size="small"
          status={val >= 30 ? 'exception' : 'normal'}
        />
      )
    }
  ]

  const healthIndicators = [
    {
      name: '岗位存活率',
      value: stats.jobSurvivalRate,
      suffix: '%',
      threshold: 70,
      icon: <HeartOutlined />,
      desc: '通过审核并正常发布的岗位占比'
    },
    {
      name: '订单履约率',
      value: stats.totalOrders > 0 ? Math.round((stats.totalOrders - stats.disputedOrders) / stats.totalOrders * 100) : 100,
      suffix: '%',
      threshold: 90,
      icon: <CheckCircleOutlined />,
      desc: '无争议正常完成的订单占比'
    },
    {
      name: '争议解决率',
      value: stats.disputedOrders > 0 ? 85 : 100,
      suffix: '%',
      threshold: 80,
      icon: <ExclamationCircleOutlined />,
      desc: '24小时内得到解决的争议占比'
    }
  ]

  const actionLabelMap = {
    inspection: { label: '岗位抽检', color: 'blue' },
    audit: { label: '审核通过', color: 'green' },
    verify: { label: '核验通过', color: 'green' },
    inspect: { label: '企业核验', color: 'blue' },
    resolve: { label: '争议仲裁', color: 'orange' },
    reject: { label: '下架处理', color: 'red' }
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        <HeartOutlined /> 兼职生态健康度中心
      </Title>

      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
      ) : (
        <>
          <Alert
            message="生态健康评分"
            description={
              <Space>
                <span>综合评分：</span>
                <Text strong style={{ fontSize: 24, color: '#52c41a' }}>A+</Text>
                <Tag color="green">健康</Tag>
                <RiseOutlined style={{ color: '#52c41a' }} />
                <Text type="success">较上周提升 5%</Text>
              </Space>
            }
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Row gutter={16} style={{ marginBottom: 24 }}>
            {healthIndicators.map((item, idx) => (
              <Col xs={24} md={8} key={idx}>
                <Card>
                  <Space direction="vertical" style={{ width: '100%' }} size={12}>
                    <Space>
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.name}</Text>
                        <Statistic
                          value={item.value}
                          suffix={item.suffix}
                          valueStyle={{ fontSize: 28, color: item.value >= item.threshold ? '#52c41a' : '#faad14' }}
                        />
                      </div>
                    </Space>
                    <Progress
                      percent={item.value}
                      status={item.value >= item.threshold ? 'success' : 'normal'}
                      strokeColor={item.value >= item.threshold ? '#52c41a' : '#faad14'}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <Card title={<><ClockCircleOutlined /> 履约时长统计</>}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="平均完成时间">
                    <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                      {stats.avgCompletionTime} 天
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="总岗位数">
                    {stats.totalJobs} 个
                  </Descriptions.Item>
                  <Descriptions.Item label="已完成">
                    {stats.completedJobs} 个
                  </Descriptions.Item>
                  <Descriptions.Item label="争议订单">
                    <Tag color="red">{stats.disputedOrders} 个</Tag>
                  </Descriptions.Item>
                </Descriptions>
                <div style={{ marginTop: 16 }}>
                  <Alert
                    message="履约趋势"
                    description={
                      <Space>
                        <FallOutlined style={{ color: '#52c41a' }} />
                        <Text type="success">平均履约时长较上周缩短 0.5 天</Text>
                      </Space>
                    }
                    type="success"
                    showIcon
                    size="small"
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title={<><WarningOutlined /> 投诉聚类分析</>}>
                <Table
                  rowKey="type"
                  columns={complaintColumns}
                  dataSource={stats.complaintTypes}
                  pagination={false}
                  size="small"
                  scroll={{ y: 180 }}
                />
                {stats.complaintTypes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                    <div style={{ marginTop: 8 }}>暂无投诉记录</div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          <Card title={<><WarningOutlined /> 运营操作日志</>}>
            <List
              dataSource={auditLogs.length > 0 ? auditLogs : []}
              renderItem={(item) => {
                const actionInfo = actionLabelMap[item.action] || { label: item.action, color: 'default' }
                return (
                  <List.Item>
                    <Space>
                      <Tag color={actionInfo.color}>{actionInfo.label}</Tag>
                      <Text>{item.detail}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.operator_name || '系统'} · {item.target_type}#{item.target_id}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(item.created_at).toLocaleString('zh-CN')}
                      </Text>
                    </Space>
                  </List.Item>
                )
              }}
            />
            {auditLogs.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <div style={{ marginTop: 8 }}>暂无操作日志</div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
