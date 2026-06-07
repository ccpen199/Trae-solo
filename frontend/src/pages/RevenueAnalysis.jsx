import { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Tag, 
  Progress, 
  Button, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  message,
  Tabs
} from 'antd'
import { 
  DollarOutlined, 
  TrophyOutlined, 
  WalletOutlined, 
  ArrowUpOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { dashboardApi, revenueApi, withdrawalApi } from '../api'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'

const { TabPane } = Tabs

export default function RevenueAnalysis() {
  const [revenueData, setRevenueData] = useState({})
  const [revenueRecords, setRevenueRecords] = useState([])
  const [withdrawalRecords, setWithdrawalRecords] = useState([])
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false)
  const [form] = Form.useForm()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadRevenueData()
    loadRevenueRecords()
    loadWithdrawalRecords()
  }, [])

  const loadRevenueData = async () => {
    try {
      const response = await dashboardApi.getRevenue({ courierId: user.id })
      setRevenueData(response.data)
    } catch (error) {
      console.error('加载收益数据失败', error)
    }
  }

  const loadRevenueRecords = async () => {
    try {
      const response = await revenueApi.getRecords({ courierId: user.id, pageSize: 20 })
      setRevenueRecords(response.data.list || [])
    } catch (error) {
      console.error('加载收益记录失败', error)
    }
  }

  const loadWithdrawalRecords = async () => {
    try {
      const response = await withdrawalApi.getRecords({ courierId: user.id, pageSize: 20 })
      setWithdrawalRecords(response.data.list || [])
    } catch (error) {
      console.error('加载提现记录失败', error)
    }
  }

  const handleWithdraw = async (values) => {
    try {
      await withdrawalApi.create(values)
      message.success('提现申请已提交')
      setWithdrawModalVisible(false)
      form.resetFields()
      loadWithdrawalRecords()
    } catch (error) {
      message.error('提现申请失败')
    }
  }

  const revenueChart = {
    title: { text: '近7日收益趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
    yAxis: { type: 'value' },
    series: [{
      data: [128, 156, 98, 188, 145, 210, 86],
      type: 'bar',
      itemStyle: { color: '#ff6b35' },
      barWidth: 30
    }]
  }

  const revenueColumns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const typeMap = {
          delivery: { text: '派件收入', color: 'success' },
          subsidy: { text: '补贴', color: 'blue' },
          bonus: { text: '奖励', color: 'orange' },
          other: { text: '其他', color: 'default' }
        }
        const info = typeMap[type] || { text: type, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>+¥{amount}</span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => status === 'completed' ? (
        <Tag color="success">已到账</Tag>
      ) : (
        <Tag color="warning">处理中</Tag>
      )
    }
  ]

  const withdrawalColumns = [
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => (
        <span style={{ color: '#ff4d4f', fontWeight: 500 }}>-¥{amount}</span>
      )
    },
    {
      title: '账户信息',
      dataIndex: 'account_info',
      key: 'account_info',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          pending: { text: '审核中', color: 'warning' },
          completed: { text: '已完成', color: 'success' },
          rejected: { text: '已拒绝', color: 'error' }
        }
        const info = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    }
  ]

  const mockRevenueRecords = [
    { id: 1, created_at: new Date().toISOString(), type: 'delivery', description: '派件收入 x 25', amount: '50.00', status: 'completed' },
    { id: 2, created_at: new Date(Date.now() - 3600000).toISOString(), type: 'subsidy', description: '高峰时段补贴', amount: '30.00', status: 'completed' },
    { id: 3, created_at: new Date(Date.now() - 86400000).toISOString(), type: 'bonus', description: '绩效达标奖励', amount: '100.00', status: 'completed' },
    { id: 4, created_at: new Date(Date.now() - 172800000).toISOString(), type: 'delivery', description: '派件收入 x 32', amount: '64.00', status: 'completed' },
  ]

  const mockWithdrawalRecords = [
    { id: 1, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), amount: '500.00', account_info: '支付宝 138****8001', status: 'completed' },
    { id: 2, created_at: new Date(Date.now() - 86400000).toISOString(), amount: '300.00', account_info: '微信 138****8001', status: 'pending' },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="累计收益"
              value={revenueData.totalRevenue || 2856.80}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总派件数"
              value={revenueData.totalDeliveries || 248}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="单均毛利"
              value={revenueData.avgMargin || 8.5}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#722ed1' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="可提现余额"
              value={revenueData.pendingWithdrawal || 1250.50}
              prefix={<WalletOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              precision={2}
            />
            <Button 
              type="primary" 
              size="small" 
              block 
              style={{ marginTop: 8 }}
              icon={<PlusOutlined />}
              onClick={() => setWithdrawModalVisible(true)}
            >
              申请提现
            </Button>
          </Card>
        </Col>
      </Row>

      <Card title="补贴领取进度" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <div style={{ marginBottom: 8 }}>月度派件补贴</div>
            <Progress percent={revenueData.subsidyProgress || 75.5} strokeColor="#52c41a" />
            <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              已完成 {189} / 250 单 · 可获得 ¥200
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <div style={{ marginBottom: 8 }}>准时率补贴</div>
            <Progress percent={92} strokeColor="#1890ff" />
            <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              准时率 92% · 可获得 ¥100
            </div>
          </Col>
          <Col xs={24} lg={8}>
            <div style={{ marginBottom: 8 }}>好评率补贴</div>
            <Progress percent={88} strokeColor="#722ed1" />
            <div style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
              好评率 88% · 可获得 ¥100
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={revenueChart} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="收益构成">
            <div style={{ padding: '20px 0' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>派件收入</span>
                  <span>¥1,860.00 (65%)</span>
                </div>
                <Progress percent={65} strokeColor="#ff6b35" showInfo={false} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>补贴收入</span>
                  <span>¥680.00 (24%)</span>
                </div>
                <Progress percent={24} strokeColor="#1890ff" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>奖励收入</span>
                  <span>¥316.80 (11%)</span>
                </div>
                <Progress percent={11} strokeColor="#52c41a" showInfo={false} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="revenue">
          <TabPane tab="收益明细" key="revenue">
            <Table
              rowKey="id"
              columns={revenueColumns}
              dataSource={revenueRecords.length ? revenueRecords : mockRevenueRecords}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>
          <TabPane tab="提现记录" key="withdrawal">
            <Table
              rowKey="id"
              columns={withdrawalColumns}
              dataSource={withdrawalRecords.length ? withdrawalRecords : mockWithdrawalRecords}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="申请提现"
        open={withdrawModalVisible}
        onCancel={() => { setWithdrawModalVisible(false); form.resetFields() }}
        footer={null}
        width={450}
      >
        <Form form={form} layout="vertical" onFinish={handleWithdraw}>
          <Form.Item
            name="amount"
            label="提现金额"
            rules={[{ required: true, message: '请输入提现金额' }]}
          >
            <InputNumber
              min={10}
              max={revenueData.pendingWithdrawal || 1250.50}
              style={{ width: '100%' }}
              placeholder={`可提现金额: ¥${revenueData.pendingWithdrawal || 1250.50}`}
              precision={2}
              addonAfter="元"
            />
          </Form.Item>
          <Form.Item
            name="accountInfo"
            label="收款账户"
            rules={[{ required: true, message: '请输入收款账户信息' }]}
          >
            <Input placeholder="支付宝/微信/银行卡号" />
          </Form.Item>
          <div style={{ padding: '12px', background: '#fff7e6', borderRadius: 4, marginBottom: 16 }}>
            <div style={{ color: '#fa8c16', fontSize: 12 }}>
              提现规则：
              <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                <li>最低提现金额：¥10</li>
                <li>提现到账时间：1-3个工作日</li>
                <li>免收手续费</li>
              </ul>
            </div>
          </div>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认提现</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
