import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Card, 
  Button, 
  Spin, 
  Result,
  message,
  Typography,
  Statistic,
  Row,
  Col,
  Space,
  InputNumber,
  Modal
} from 'antd'
import { 
  ArrowLeftOutlined,
  WalletOutlined
} from '@ant-design/icons'
import request from '../utils/request'
import useUserStore from '../store/user'

const { Title, Text } = Typography

const Deposit = () => {
  const navigate = useNavigate()
  const { user, updateUser } = useUserStore()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [depositInfo, setDepositInfo] = useState({ balance: 0, frozen_deposit: 0 })
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState(100)
  const [recharging, setRecharging] = useState(false)

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000]

  const loadData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await request.get('/user/deposit')
      setDepositInfo(res.data || { balance: 0, frozen_deposit: 0 })
    } catch (err) {
      console.error('Load deposit error:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRecharge = async () => {
    if (rechargeAmount <= 0) {
      message.warning('请输入充值金额')
      return
    }

    setRecharging(true)
    try {
      const res = await request.post('/user/deposit/recharge', {
        amount: rechargeAmount
      })
      if (res.data) {
        updateUser({ ...user, balance: res.data.balance })
        setDepositInfo(prev => ({ ...prev, balance: res.data.balance }))
      }
      message.success(`充值成功，已充值 ¥${rechargeAmount}`)
      setRechargeModalVisible(false)
    } catch (err) {
      console.error('Recharge error:', err)
    } finally {
      setRecharging(false)
    }
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle="押金信息加载失败，请点击重试"
        extra={
          <Button type="primary" onClick={loadData}>
            重新加载
          </Button>
        }
      />
    )
  }

  if (loading) {
    return (
      <div className="page-loading">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        style={{ marginBottom: 16 }}
        onClick={() => navigate('/settings')}
      >
        返回
      </Button>

      <Card style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 24 }}>
          <WalletOutlined style={{ marginRight: 8 }} />
          押金管理
        </Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Card size="small" style={{ background: '#e6f7ff' }}>
              <Statistic 
                title="账户余额" 
                value={depositInfo.balance || 0} 
                prefix="¥"
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card size="small" style={{ background: '#fff7e6' }}>
              <Statistic 
                title="冻结押金" 
                value={depositInfo.frozen_deposit || 0} 
                prefix="¥"
                precision={2}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card title="操作">
        <Space wrap>
          <Button 
            type="primary" 
            size="large"
            onClick={() => setRechargeModalVisible(true)}
          >
            充值余额
          </Button>
          <Button 
            size="large"
            onClick={() => message.info('提现功能开发中...')}
          >
            提现
          </Button>
        </Space>

        <div style={{ marginTop: 24, padding: 16, background: '#fafafa', borderRadius: 8 }}>
          <Title level={5} style={{ marginBottom: 8 }}>说明</Title>
          <ul style={{ paddingLeft: 20, color: '#666' }}>
            <li>账户余额可用于支付租金和押金</li>
            <li>租借完成后，押金将在退租时原路退还</li>
            <li>提前退租可能产生违约金，从押金中扣除</li>
          </ul>
        </div>
      </Card>

      <Modal
        title="充值余额"
        open={rechargeModalVisible}
        onOk={handleRecharge}
        onCancel={() => setRechargeModalVisible(false)}
        confirmLoading={recharging}
        okText="确认充值"
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            选择充值金额
          </Text>
          <Space wrap>
            {quickAmounts.map(amount => (
              <Button
                key={amount}
                type={rechargeAmount === amount ? 'primary' : 'default'}
                onClick={() => setRechargeAmount(amount)}
              >
                ¥{amount}
              </Button>
            ))}
          </Space>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            或输入自定义金额
          </Text>
          <InputNumber
            min={1}
            max={100000}
            value={rechargeAmount}
            onChange={setRechargeAmount}
            style={{ width: '100%' }}
            size="large"
            addonBefore="¥"
            placeholder="请输入金额"
          />
        </div>

        <Card size="small" style={{ background: '#fafafa' }}>
          <div style={{ textAlign: 'right' }}>
            <Text type="secondary">充值金额: </Text>
            <Text type="danger" strong style={{ fontSize: 20 }}>
              ¥{rechargeAmount?.toFixed(2) || '0.00'}
            </Text>
          </div>
        </Card>
      </Modal>
    </div>
  )
}

export default Deposit
