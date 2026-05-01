import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Typography,
  message,
  Spin,
  Empty,
} from 'antd'
import {
  TrophyOutlined,
  GiftOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useUserStore } from '../stores/userStore'
import { pointsApi, ruleApi, reconciliationApi } from '../services/api'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

const Dashboard: React.FC = () => {
  const { user } = useUserStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [pointsInfo, setPointsInfo] = useState<any>(null)
  const [rules, setRules] = useState<any[]>([])
  const [reconciliations, setReconciliations] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (user?.role === 'member') {
        const pointsResponse = await pointsApi.getPointsInfo()
        setPointsInfo(pointsResponse.data.data)
      }

      if (['manager', 'admin'].includes(user?.role || '')) {
        const rulesResponse = await ruleApi.getRules({ pageSize: 5 })
        setRules(rulesResponse.data.data?.items || [])
      }

      if (['finance', 'admin'].includes(user?.role || '')) {
        const recResponse = await reconciliationApi.getReconciliations({ pageSize: 5 })
        setReconciliations(recResponse.data.data?.items || [])
      }
    } catch (error: any) {
      message.error(error.message || '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    setCheckInLoading(true)
    try {
      const response = await pointsApi.checkIn()
      const data = response.data.data
      message.success(data?.message || '签到成功')
      fetchData()
    } catch (error: any) {
      message.error(error.message || '签到失败')
    } finally {
      setCheckInLoading(false)
    }
  }

  const renderMemberDashboard = () => (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总积分"
              value={pointsInfo?.totalBalance || 0}
              prefix={<TrophyOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="可用积分"
              value={pointsInfo?.availableBalance || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已获积分"
              value={pointsInfo?.totalEarned || 0}
              prefix={<GiftOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已过期积分"
              value={pointsInfo?.totalExpired || 0}
              prefix={<ClockCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="快捷操作" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Button
              type="primary"
              size="large"
              block
              icon={<TrophyOutlined />}
              loading={checkInLoading}
              onClick={handleCheckIn}
            >
              每日签到
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button
              size="large"
              block
              icon={<GiftOutlined />}
              onClick={() => navigate('/exchange')}
            >
              积分兑换
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button
              size="large"
              block
              icon={<HistoryOutlined />}
              onClick={() => navigate('/points/transactions')}
            >
              积分流水
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button
              size="large"
              block
              icon={<ClockCircleOutlined />}
              onClick={() => navigate('/points')}
            >
              积分详情
            </Button>
          </Col>
        </Row>
      </Card>
    </>
  )

  const renderManagerDashboard = () => (
    <>
      <Card title="规则概览" style={{ marginBottom: 24 }}>
        {rules.length > 0 ? (
          <Row gutter={[16, 16]}>
            {rules.map((rule) => (
              <Col xs={24} sm={12} lg={6} key={rule.id}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => navigate('/rules')}
                  style={{
                    borderLeft: `4px solid ${
                      rule.status === 'active' ? '#52c41a' : '#999'
                    }`,
                  }}
                >
                  <Text strong>{rule.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {rule.status === 'active' ? '已激活' : '未激活'}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    触发 {rule.triggerCount} 次
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="暂无规则" />
        )}
      </Card>

      <Card title="快捷操作">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Button
              type="primary"
              size="large"
              block
              icon={<SettingOutlined />}
              onClick={() => navigate('/rules')}
            >
              规则管理
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button
              size="large"
              block
              icon={<TrophyOutlined />}
              onClick={() => navigate('/points')}
            >
              积分管理
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button
              size="large"
              block
              icon={<ShoppingOutlined />}
              onClick={() => navigate('/exchange/orders')}
            >
              订单管理
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button
              size="large"
              block
              icon={<HistoryOutlined />}
              onClick={() => navigate('/points/transactions')}
            >
              积分流水
            </Button>
          </Col>
        </Row>
      </Card>
    </>
  )

  const renderFinanceDashboard = () => (
    <>
      <Card title="对账单概览" style={{ marginBottom: 24 }}>
        {reconciliations.length > 0 ? (
          <Row gutter={[16, 16]}>
            {reconciliations.map((rec) => (
              <Col xs={24} sm={12} lg={8} key={rec.id}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => navigate('/reconciliation')}
                  style={{
                    borderLeft: `4px solid ${
                      rec.status === 'success'
                        ? '#52c41a'
                        : rec.status === 'warning'
                        ? '#faad14'
                        : '#ff4d4f'
                    }`,
                  }}
                >
                  <Text strong>
                    {new Date(rec.date).toLocaleDateString()}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    状态: {
                      rec.status === 'success'
                        ? '成功'
                        : rec.status === 'warning'
                        ? '警告'
                        : '失败'
                    }
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    差异: {rec.difference || 0}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="暂无对账单" />
        )}
      </Card>

      <Card title="快捷操作">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Button
              type="primary"
              size="large"
              block
              icon={<CalculatorOutlined />}
              onClick={() => navigate('/reconciliation')}
            >
              执行日结
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button
              size="large"
              block
              icon={<FileTextOutlined />}
              onClick={() => navigate('/reconciliation')}
            >
              对账单列表
            </Button>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Button
              size="large"
              block
              icon={<HistoryOutlined />}
              onClick={() => navigate('/points/transactions')}
            >
              积分流水
            </Button>
          </Col>
        </Row>
      </Card>
    </>
  )

  return (
    <Spin spinning={loading}>
      <Title level={4} style={{ marginBottom: 24 }}>
        欢迎回来, {user?.name || user?.username}
      </Title>

      {user?.role === 'member' && renderMemberDashboard()}
      {['manager', 'employee', 'admin'].includes(user?.role || '') && renderManagerDashboard()}
      {['finance', 'admin'].includes(user?.role || '') && renderFinanceDashboard()}
    </Spin>
  )
}

export default Dashboard
