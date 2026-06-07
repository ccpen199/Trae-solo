import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Button, List, Tag, InputNumber, Modal, message, Result, Statistic, Space } from 'antd'
import { AlipayOutlined, WechatOutlined, CheckCircleOutlined, WalletOutlined, BellOutlined } from '@ant-design/icons'
import StudentLayout from '../../components/StudentLayout.jsx'
import { studentAPI, transactionAPI, messageAPI } from '../../utils/api.js'

function StudentRecharge() {
  const [profile, setProfile] = useState(null)
  const [amount, setAmount] = useState(50)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [successModal, setSuccessModal] = useState(false)
  const [lastRecharge, setLastRecharge] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('alipay')

  const rechargeAmounts = [20, 50, 100, 200, 500]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [profileRes, historyRes] = await Promise.all([
        studentAPI.getProfile(),
        transactionAPI.getRechargeHistory(),
      ])
      setProfile(profileRes.data)
      setHistory(historyRes.data)
    } catch (error) {
      console.error('加载数据失败', error)
    }
  }

  const handleRecharge = async (method) => {
    if (amount <= 0) {
      message.error('请输入充值金额')
      return
    }
    setLoading(true)
    setPaymentMethod(method)
    try {
      const response = await transactionAPI.recharge({ amount, payment_method: method })
      setLastRecharge({
        amount,
        payment_method: method,
        tradeNo: response.data.tradeNo,
        newBalance: response.data.newBalance,
        time: new Date().toLocaleString(),
      })
      setModalVisible(false)
      setSuccessModal(true)
      
      if (profile && profile.balance < 10) {
        try {
          const msgs = await messageAPI.getMessages({ type: 'balance_warning', is_read: 'false', pageSize: 20 })
          const balanceWarnings = msgs.data.messages || []
          for (const msg of balanceWarnings) {
            await messageAPI.markAsRead(msg.id)
          }
          message.info(`已自动标记 ${balanceWarnings.length} 条余额提醒消息为已读`)
        } catch (e) {
          console.log('标记消息已读失败', e)
        }
      }
      
      loadData()
      message.success('充值成功')
    } catch (error) {
      setModalVisible(false)
      message.error('充值失败: ' + (error.response?.data?.error || error.message || '请重试'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <StudentLayout>
      <div>
        <h2 style={{ marginBottom: 24 }}>账户充值</h2>
        
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="账户信息" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ color: '#666', marginBottom: 8 }}>当前余额</div>
                  <div style={{ fontSize: 36, fontWeight: 'bold', color: '#1890ff' }}>
                    ¥{profile?.balance?.toFixed(2) || '0.00'}
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ color: '#666', marginBottom: 8 }}>学号</div>
                  <div style={{ fontSize: 18 }}>{profile?.student_id}</div>
                  <div style={{ color: '#666', marginTop: 16, marginBottom: 8 }}>姓名</div>
                  <div style={{ fontSize: 18 }}>{profile?.name}</div>
                </Col>
              </Row>
            </Card>

            <Card title="选择充值金额">
              <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
                {rechargeAmounts.map(amt => (
                  <Col xs={8} sm={6} key={amt}>
                    <Card
                      hoverable
                      style={{ 
                        textAlign: 'center', 
                        cursor: 'pointer',
                        border: amount === amt ? '2px solid #1890ff' : '1px solid #d9d9d9',
                        background: amount === amt ? '#e6f7ff' : '#fff'
                      }}
                      onClick={() => setAmount(amt)}
                    >
                      <div style={{ fontSize: 24, fontWeight: 'bold' }}>¥{amt}</div>
                      {amount === amt && <CheckCircleOutlined style={{ color: '#1890ff', marginTop: 8 }} />}
                    </Card>
                  </Col>
                ))}
                <Col xs={8} sm={6}>
                  <Card hoverable style={{ textAlign: 'center', padding: '12px 0' }}>
                    <div style={{ color: '#666', marginBottom: 8 }}>自定义</div>
                    <InputNumber
                      min={1}
                      max={10000}
                      value={amount}
                      onChange={setAmount}
                      style={{ width: '80%' }}
                      formatter={value => `¥${value}`}
                      parser={value => value.replace('¥', '')}
                    />
                  </Card>
                </Col>
              </Row>

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Button 
                  type="primary" 
                  size="large"
                  style={{ marginRight: 16 }}
                  icon={<AlipayOutlined />}
                  onClick={() => setModalVisible(true)}
                >
                  支付宝充值 ¥{amount}
                </Button>
                <Button 
                  size="large"
                  icon={<WechatOutlined />}
                  onClick={() => setModalVisible(true)}
                >
                  微信充值 ¥{amount}
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card title="充值记录">
              <List
                dataSource={history}
                locale={{ emptyText: '暂无充值记录' }}
                renderItem={item => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      title={
                        <Space>
                          {item.payment_method === 'alipay' ? (
                            <Tag color="blue">支付宝</Tag>
                          ) : (
                            <Tag color="green">微信</Tag>
                          )}
                          <span>账户充值</span>
                          {item.trade_no && <span style={{ color: '#999', fontSize: 12 }}>单号:{item.trade_no.slice(-8)}</span>}
                        </Space>
                      }
                      description={new Date(item.created_at || item.time).toLocaleString()}
                    />
                    <div style={{ color: '#52c41a', fontWeight: 'bold', fontSize: 16 }}>
                      +¥{Number(item.amount).toFixed(2)}
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        <Modal
          title="确认充值"
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setModalVisible(false)}>取消</Button>,
            <Button key="alipay" type="primary" icon={<AlipayOutlined />} loading={loading} onClick={() => handleRecharge('alipay')}>
              支付宝支付 ¥{amount}
            </Button>,
            <Button key="wechat" icon={<WechatOutlined />} loading={loading} onClick={() => handleRecharge('wechat')}>
              微信支付 ¥{amount}
            </Button>,
          ]}
        >
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ color: '#666', marginBottom: 8 }}>充值金额</div>
            <div style={{ fontSize: 48, fontWeight: 'bold', color: '#1890ff' }}>¥{amount}</div>
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 6, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#666' }}>充值账户</span>
                <span>{profile?.student_id} {profile?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>当前余额</span>
                <span style={{ color: profile?.balance < 10 ? '#ff4d4f' : '#52c41a' }}>¥{profile?.balance?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          title="充值成功"
          open={successModal}
          onCancel={() => setSuccessModal(false)}
          footer={[
            <Button key="ok" type="primary" onClick={() => setSuccessModal(false)}>
              完成
            </Button>,
          ]}
          width={480}
        >
          <Result
            status="success"
            title="充值成功"
            subTitle={
              <div style={{ textAlign: 'left' }}>
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col span={12}>
                    <Statistic
                      title="充值金额"
                      value={lastRecharge?.amount || 0}
                      prefix="+"
                      suffix="元"
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="账户余额"
                      value={lastRecharge?.newBalance || 0}
                      suffix="元"
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>
                <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 6, fontSize: 12 }}>
                  <div><BellOutlined style={{ color: '#52c41a', marginRight: 4 }} />余额提醒消息已自动标记为已读</div>
                  <div style={{ marginTop: 4, color: '#666' }}>交易单号: {lastRecharge?.tradeNo} | 时间: {lastRecharge?.time}</div>
                </div>
              </div>
            }
          />
        </Modal>
      </div>
    </StudentLayout>
  )
}

export default StudentRecharge
