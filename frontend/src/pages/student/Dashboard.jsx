import React, { useEffect, useState, useCallback } from 'react'
import { Row, Col, Card, Statistic, List, Tag, Button, Modal, message, Progress, Space, Descriptions } from 'antd'
import {
  WalletOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
  AlipayOutlined,
  ReloadOutlined,
  QrcodeOutlined,
  PhoneOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import StudentLayout from '../../components/StudentLayout.jsx'
import { studentAPI, deviceAPI, transactionAPI, messageAPI, pricingAPI, alertAPI } from '../../utils/api.js'

function StudentDashboard() {
  const [profile, setProfile] = useState(null)
  const [devices, setDevices] = useState([])
  const [realtimeData, setRealtimeData] = useState({})
  const [recentTransactions, setRecentTransactions] = useState([])
  const [activeTransaction, setActiveTransaction] = useState(null)
  const [unreadMessages, setUnreadMessages] = useState([])
  const [alerts, setAlerts] = useState([])
  const [pricing, setPricing] = useState(null)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [authModal, setAuthModal] = useState(false)
  const [balanceModal, setBalanceModal] = useState(false)
  const [phoneVerifyModal, setPhoneVerifyModal] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState('')
  const [alertsModal, setAlertsModal] = useState(false)
  const [monthlyStats, setMonthlyStats] = useState({ water: 0, amount: 0 })
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadData()
    const interval = setInterval(() => {
      if (activeTransaction) {
        updateTransactionData()
      } else {
        loadRealtimeData()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [activeTransaction])

  useEffect(() => {
    if (devices.length > 0 && !activeTransaction) {
      loadRealtimeData()
    }
  }, [devices])

  const loadRealtimeData = async () => {
    try {
      const data = {}
      for (const device of devices) {
        if (device.status === 'online' || device.status === 'running') {
          try {
            const res = await deviceAPI.getRealtimeData(device.id)
            data[device.id] = res.data
          } catch (e) {}
        }
      }
      setRealtimeData(data)
    } catch (error) {}
  }

  const loadData = useCallback(async () => {
    try {
      setInitialLoading(true)
      const [profileRes, devicesRes, alertRes, statsRes] = await Promise.all([
        studentAPI.getProfile(),
        deviceAPI.getDevices({ pageSize: 50 }),
        alertAPI.getAlerts({ status: 'unread', pageSize: 20 }),
        transactionAPI.getMonthlyStats(),
      ])
      
      setProfile(profileRes.data)
      setDevices(devicesRes.data.devices)
      setAlerts(alertRes.data.alerts || [])
      setMonthlyStats({
        water: statsRes.data.monthly.total_water || 0,
        amount: statsRes.data.monthly.total_amount || 0,
      })
      
      const [recentTxRes, messagesRes, pricingRes] = await Promise.all([
        transactionAPI.getTransactions({ pageSize: 5, _t: Date.now() }),
        messageAPI.getMessages({ is_read: 'false', pageSize: 10, _t: Date.now() }),
        pricingAPI.getActivePricing(),
      ])
      
      setRecentTransactions(recentTxRes.data.transactions || [])
      setUnreadMessages(messagesRes.data.messages || [])
      setPricing(pricingRes.data)
    } catch (error) {
      console.error('加载数据失败', error)
      message.error('加载数据失败，请刷新重试')
    } finally {
      setInitialLoading(false)
    }
  }, [])

  const updateTransactionData = async () => {
    if (!selectedDevice || !activeTransaction) return
    
    try {
      const temp = 40 + Math.random() * 10
      const flow = 5 + Math.random() * 3
      const volume = (activeTransaction.volume || 0) + flow * 0.05
      
      await deviceAPI.postRealtimeData(selectedDevice.id, {
        temperature: temp,
        flow_rate: flow,
        cumulative_volume: volume,
        is_running: true,
      })
      
      setActiveTransaction({
        ...activeTransaction,
        temp,
        flow,
        volume,
      })
    } catch (error) {
      console.error('更新实时数据失败')
    }
  }

  const showAlertsModal = () => {
    setAlertsModal(true)
  }

  const handleStartUse = async (device) => {
    if (profile && profile.balance <= 0) {
      setBalanceModal(true)
      return
    }
    setSelectedDevice(device)
    setAuthModal(true)
  }

  const handleScanUse = () => {
    const firstOnlineDevice = devices.find(device => device.status === 'online') || devices[0]
    if (firstOnlineDevice) {
      handleStartUse(firstOnlineDevice)
      return
    }
    message.warning('暂无可用设备，请刷新后重试')
  }

  const confirmStart = async () => {
    setPhoneVerifyModal(true)
    setAuthModal(false)
  }

  const handlePhoneVerify = async () => {
    if (verifyCode.length !== 6) {
      message.error('请输入6位验证码')
      return
    }
    
    setLoading(true)
    try {
      const response = await transactionAPI.startTransaction({
        device_id: selectedDevice.id,
        verify_code: verifyCode,
      })
      setActiveTransaction({
        id: response.data.transactionId,
        startTime: response.data.startTime,
        volume: 0,
        temp: 40,
        flow: 5,
      })
      setPhoneVerifyModal(false)
      setVerifyCode('')
      message.success('身份验证通过，开始用水')
    } catch (error) {
      message.error(error.response?.data?.error || '开始失败')
      if (error.response?.data?.needRecharge) {
        setPhoneVerifyModal(false)
        setBalanceModal(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStopUse = async () => {
    if (!activeTransaction) return
    
    setLoading(true)
    try {
      await transactionAPI.endTransaction(activeTransaction.id, {
        water_used: activeTransaction.volume || 30,
        avg_temp: activeTransaction.temp || 42,
        avg_flow: activeTransaction.flow || 6,
      })
      setActiveTransaction(null)
      setSelectedDevice(null)
      message.success('用水结束，账单已生成')
      loadData()
    } catch (error) {
      message.error('结束失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'success'
      case 'offline': return 'default'
      case 'running': return 'processing'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return '在线'
      case 'offline': return '离线'
      case 'running': return '使用中'
      default: return status
    }
  }

  const getPaymentMethodText = (method) => {
    const methods = {
      alipay: '支付宝',
      wechat: '微信',
      balance: '余额',
      card: '校园卡',
    }
    return methods[method] || method
  }

  return (
    <StudentLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0 }}>欢迎回来，{user?.name || user?.username}</h2>
            <Tag color="green" style={{ marginTop: 8 }}>已登录学生首页</Tag>
          </div>
          <Space>
            <Button icon={<QrcodeOutlined />} onClick={handleScanUse}>扫码取水</Button>
            <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
          </Space>
        </div>
        
        {profile && profile.balance < 10 && profile.balance > 0 && (
          <Card style={{ marginBottom: 24, background: '#fff7e6', borderColor: '#ffd591' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ExclamationCircleOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 16 }}>余额提醒</div>
                  <div style={{ color: '#666' }}>您的账户余额较低，当前余额：¥{profile.balance.toFixed(2)}</div>
                </div>
              </div>
              <Space>
                <Button type="primary" size="large" icon={<AlipayOutlined />} onClick={() => navigate('/student/recharge')}>
                  支付宝充值
                </Button>
              </Space>
            </div>
          </Card>
        )}

        <Card title="身份核验状态" style={{ marginBottom: 16 }} size="small" loading={initialLoading}>
          <Row gutter={[16, 8]}>
            <Col xs={12} sm={6}>
              <Space>
                <Tag color={profile?.bluetooth_address ? 'success' : 'default'} icon={profile?.bluetooth_address ? <CheckCircleOutlined /> : null}>
                  蓝牙 {profile?.bluetooth_address ? '已绑定' : '未绑定'}
                </Tag>
              </Space>
            </Col>
            <Col xs={12} sm={6}>
              <Space>
                <Tag color={profile?.nfc_card_id ? 'success' : 'default'} icon={profile?.nfc_card_id ? <CheckCircleOutlined /> : null}>
                  NFC {profile?.nfc_card_id ? '已绑定' : '未绑定'}
                </Tag>
              </Space>
            </Col>
            <Col xs={12} sm={6}>
              <Space>
                <Tag color={profile?.phone ? 'success' : 'default'} icon={profile?.phone ? <CheckCircleOutlined /> : null}>
                  手机号 {profile?.phone ? '已绑定' : '未绑定'}
                </Tag>
              </Space>
            </Col>
            <Col xs={12} sm={6}>
              <Space>
                <Tag color={profile?.alipay_user_id ? 'success' : 'default'} icon={profile?.alipay_user_id ? <CheckCircleOutlined /> : null}>
                  支付宝 {profile?.alipay_user_id ? '已绑定' : '未绑定'}
                </Tag>
              </Space>
            </Col>
          </Row>
          <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
            {profile?.bluetooth_address && profile?.phone && profile?.alipay_user_id 
              ? '✓ 身份核验资质完整，可正常使用取水服务' 
              : '⚠ 部分核验方式未绑定，可能影响取水资格，请前往个人信息完善'}
            <Button type="link" size="small" onClick={() => navigate('/student/profile')}>去完善</Button>
          </div>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/student/recharge')}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>账户余额</span>}
                value={profile?.balance?.toFixed(2) || 0}
                prefix={<WalletOutlined style={{ marginRight: 8 }} />}
                suffix="元"
                valueStyle={{ color: 'white', fontSize: 28 }}
              />
              <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: 12 }}>点击前往充值</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card green">
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>本月用水</span>}
                value={monthlyStats.water.toFixed(1)}
                suffix="L"
                valueStyle={{ color: 'white', fontSize: 28 }}
              />
              <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: 12 }}>累计用量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card orange">
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>本月消费</span>}
                value={monthlyStats.amount.toFixed(2)}
                prefix="¥"
                valueStyle={{ color: 'white', fontSize: 28 }}
              />
              <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: 12 }}>累计消费</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card blue" style={{ cursor: 'pointer' }} onClick={() => navigate('/student/messages')}>
              <Statistic
                title={<span style={{ color: 'rgba(255,255,255,0.8)' }}>未读消息</span>}
                value={unreadMessages.length}
                valueStyle={{ color: 'white', fontSize: 28 }}
              />
              <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8, fontSize: 12 }}>点击查看详情</div>
            </Card>
          </Col>
        </Row>

        {activeTransaction && (
          <Card style={{ marginBottom: 24, border: '2px solid #1890ff', background: '#e6f7ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#1890ff' }}>
                  <PlayCircleOutlined style={{ marginRight: 8 }} />
                  正在使用中 - {selectedDevice?.name}
                </h3>
                <p style={{ margin: '8px 0 0 0', color: '#666' }}>
                  设备ID: {selectedDevice?.id} | 位置: {selectedDevice?.location} | 开始时间: {new Date(activeTransaction.startTime).toLocaleString()}
                </p>
              </div>
              <Button type="primary" danger size="large" icon={<StopOutlined />} loading={loading} onClick={handleStopUse}>
                结束用水
              </Button>
            </div>
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="当前水温"
                    value={activeTransaction.temp?.toFixed(1) || 40}
                    suffix="°C"
                    valueStyle={{ color: '#1890ff' }}
                  />
                  <Progress percent={Math.min(100, ((activeTransaction.temp || 40) - 20) * 2)} status="active" />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="水流速度"
                    value={activeTransaction.flow?.toFixed(1) || 5}
                    suffix="L/min"
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Progress percent={Math.min(100, (activeTransaction.flow || 5) * 10)} status="active" strokeColor="#52c41a" />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="累计用量"
                    value={activeTransaction.volume?.toFixed(1) || 0}
                    suffix="L"
                    valueStyle={{ color: '#722ed1' }}
                  />
                  <Progress percent={Math.min(100, (activeTransaction.volume || 0) / 2)} strokeColor="#722ed1" />
                </Card>
              </Col>
            </Row>
          </Card>
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card 
              title="智能水控终端" 
              extra={
                <Space>
                  <Tag color="green">在线 {devices.filter(d => d.status === 'online').length}</Tag>
                  <Tag color="default">离线 {devices.filter(d => d.status === 'offline').length}</Tag>
                  {alerts.length > 0 && (
                    <Tag 
                      color="red" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => showAlertsModal()}
                    >
                      <WarningOutlined /> 告警 {alerts.length} (点击复查)
                    </Tag>
                  )}
                  <Button type="link" onClick={() => navigate('/student/devices')}>查看全部设备</Button>
                </Space>
              }
              loading={initialLoading}
            >
              <Row gutter={[16, 16]}>
                {devices.map(device => {
                  const data = realtimeData[device.id] || {}
                  const hasAlert = alerts.some(a => a.device_id === device.id && a.status !== 'resolved')
                  const isFullFlow = data?.is_full_flow
                  
                  return (
                    <Col xs={24} sm={12} md={8} key={device.id}>
                      <Card
                        size="small"
                        className="device-card"
                        style={{ 
                          borderColor: hasAlert || isFullFlow ? '#ff4d4f' :
                                      device.status === 'running' ? '#1890ff' : 
                                      device.status === 'online' ? '#52c41a' : '#d9d9d9',
                          boxShadow: hasAlert || isFullFlow ? '0 2px 8px rgba(255,77,79,0.2)' : 'none'
                        }}
                        actions={[
                          device.status === 'online' && !activeTransaction ? (
                            <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStartUse(device)}>
                              开始使用
                            </Button>
                          ) : device.status === 'running' ? (
                            <Tag color="processing">使用中</Tag>
                          ) : (
                            <Tag color="default">离线</Tag>
                          )
                        ]}
                      >
                        <Card.Meta
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {device.name}
                                {(hasAlert || isFullFlow) && <WarningOutlined style={{ color: '#ff4d4f', fontSize: 14 }} />}
                              </span>
                              <Tag color={getStatusColor(device.status)}>{getStatusText(device.status)}</Tag>
                            </div>
                          }
                          description={
                            <>
                              <Descriptions column={1} size="small" style={{ marginTop: 8 }}>
                                <Descriptions.Item label="设备ID">{device.id}</Descriptions.Item>
                                <Descriptions.Item label="位置">{device.building} {device.location}</Descriptions.Item>
                              </Descriptions>
                              {device.status === 'offline' ? (
                                <div style={{ marginTop: 8, padding: 8, background: '#fff2f0', borderRadius: 4, fontSize: 12 }}>
                                  {device.fault_code && (
                                    <div style={{ marginBottom: 4 }}>
                                      <span style={{ color: '#666' }}>故障码</span>
                                      <Tag color="red" style={{ marginLeft: 8 }}>{device.fault_code}</Tag>
                                    </div>
                                  )}
                                  {device.last_online && (
                                    <div style={{ color: '#999' }}>
                                      离线时长: {Math.floor((Date.now() - new Date(device.last_online).getTime()) / 3600000)}小时
                                    </div>
                                  )}
                                  <div style={{ color: '#ff4d4f', marginTop: 4 }}>⚠ 设备离线，无法使用，已提交运维处置</div>
                                </div>
                              ) : (
                                <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4, fontSize: 12 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ color: '#666' }}>水温</span>
                                    <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
                                      {data?.temperature ? `${data.temperature.toFixed(1)}°C` : <span style={{ color: '#bfbfbf' }}>加载中...</span>}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ color: '#666' }}>流速</span>
                                    <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                                      {data?.flow_rate ? `${data.flow_rate.toFixed(1)}L/min` : <span style={{ color: '#bfbfbf' }}>加载中...</span>}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#666' }}>累计</span>
                                    <span style={{ color: '#722ed1', fontWeight: 'bold' }}>
                                      {data?.cumulative_volume ? `${data.cumulative_volume.toFixed(0)}L` : <span style={{ color: '#bfbfbf' }}>加载中...</span>}
                                    </span>
                                  </div>
                                  {isFullFlow && (
                                    <div style={{ marginTop: 6, padding: 4, background: '#fff1f0', borderRadius: 4, textAlign: 'center' }}>
                                      <span style={{ color: '#ff4d4f', fontSize: 11 }}>⚠️ 连续满流运行中</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          }
                        />
                      </Card>
                    </Col>
                  )
                })}
              </Row>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card 
              title="最近消费记录" 
              style={{ marginBottom: 16 }}
              loading={initialLoading}
              extra={<Button type="link" onClick={() => navigate('/student/transactions')}>查看全部</Button>}
            >
              {recentTransactions && recentTransactions.length > 0 ? (
                <List
                  dataSource={recentTransactions}
                  renderItem={item => (
                    <List.Item key={item.id}>
                      <List.Item.Meta
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{item.device_name || item.device_id}</span>
                            <span style={{ fontWeight: 'bold', color: item.status === 'completed' ? '#52c41a' : '#faad14' }}>
                              {item.status === 'completed' ? `¥${item.amount?.toFixed(2)}` : '进行中'}
                            </span>
                          </div>
                        }
                        description={
                          <div style={{ fontSize: 12, color: '#666' }}>
                            <div>时间: {new Date(item.start_time).toLocaleString()}</div>
                            <div>用量: {item.water_used?.toFixed(1) || 0}L | 水温: {item.avg_temp?.toFixed(1) || 0}°C</div>
                            <div>支付方式: {getPaymentMethodText(item.payment_method)}</div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                  暂无消费记录
                </div>
              )}
            </Card>
            {pricing && (
              <Card title="资费标准">
                <div style={{ fontSize: 14, color: '#666' }}>
                  <p><strong>基础水价：</strong>¥{pricing.base_price}/L</p>
                  <p><strong>阶梯水价：</strong></p>
                  <ul style={{ paddingLeft: 20, margin: '4px 0' }}>
                    <li>0-{pricing.tier1_limit}L: ¥{pricing.tier1_price}/L</li>
                    <li>{pricing.tier1_limit}-{pricing.tier2_limit}L: ¥{pricing.tier2_price}/L</li>
                    <li>{pricing.tier2_limit}L+: ¥{pricing.tier3_price}/L</li>
                  </ul>
                  <p><strong>夜间优惠：</strong>{pricing.night_start_hour}:00-{pricing.night_end_hour}:00 {(pricing.night_discount * 100).toFixed(0)}%</p>
                </div>
              </Card>
            )}
          </Col>
        </Row>

        <Modal
          title="身份验证"
          open={authModal}
          onOk={confirmStart}
          onCancel={() => setAuthModal(false)}
          okText="下一步"
          width={480}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <QrcodeOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
            <h3>蓝牙/NFC近场识别</h3>
            <p style={{ color: '#666', marginBottom: 16 }}>请将手机靠近设备进行身份识别</p>
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
              <p style={{ margin: 0 }}><strong>设备：</strong>{selectedDevice?.name}</p>
              <p style={{ margin: '8px 0 0 0' }}><strong>位置：</strong>{selectedDevice?.location}</p>
            </div>
          </div>
        </Modal>

        <Modal
          title="手机号二次确认"
          open={phoneVerifyModal}
          onOk={handlePhoneVerify}
          onCancel={() => setPhoneVerifyModal(false)}
          confirmLoading={loading}
          okText="确认验证"
        >
          <div style={{ padding: '10px 0' }}>
            <p>为确保安全，请完成手机号二次验证</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <PhoneOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <span style={{ fontSize: 16 }}>{profile?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '未绑定'}</span>
              <Button type="link">更换</Button>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                maxLength={6}
                placeholder="请输入6位验证码"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                style={{ flex: 1, padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 16 }}
              />
              <Button>发送验证码</Button>
            </div>
          </div>
        </Modal>

        <Modal
          title="余额不足提醒"
          open={balanceModal}
          onOk={() => navigate('/student/recharge')}
          onCancel={() => setBalanceModal(false)}
          okText="立即充值"
          cancelText="稍后再说"
          width={480}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <ExclamationCircleOutlined style={{ fontSize: 64, color: '#faad14', marginBottom: 16 }} />
            <h3>账户余额不足</h3>
            <p style={{ color: '#666', marginBottom: 24 }}>
              您的当前余额为 <strong style={{ color: '#f5222d', fontSize: 20 }}>¥{profile?.balance?.toFixed(2) || '0.00'}</strong>
            </p>
            <p style={{ color: '#888' }}>请充值后再使用热水服务</p>
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
              <Button type="primary" size="large" icon={<AlipayOutlined />} onClick={() => { setBalanceModal(false); navigate('/student/recharge'); }}>
                支付宝充值
              </Button>
              <Button size="large" icon={<WalletOutlined />} onClick={() => { setBalanceModal(false); navigate('/student/recharge'); }}>
                微信充值
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          title="异常用水告警复查"
          open={alertsModal}
          onCancel={() => setAlertsModal(false)}
          footer={[
            <Button key="close" onClick={() => setAlertsModal(false)}>关闭</Button>
          ]}
          width={700}
        >
          {alerts.length > 0 ? (
            <List
              dataSource={alerts}
              renderItem={(alert) => (
                <List.Item
                  key={alert.id}
                  actions={[
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={() => navigate('/student/devices')}
                    >
                      查看设备
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <WarningOutlined 
                        style={{ 
                          fontSize: 24, 
                          color: alert.severity === 'critical' ? '#ff4d4f' : 
                                 alert.severity === 'warning' ? '#faad14' : '#1890ff' 
                        }} 
                      />
                    }
                    title={
                      <Space>
                        <Tag color={alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'orange' : 'blue'}>
                          {alert.type === 'full_flow' ? '连续满流' : alert.type}
                        </Tag>
                        <strong>{alert.device_id}</strong>
                        <Tag color={alert.status === 'resolved' ? 'success' : 'warning'}>
                          {alert.status === 'resolved' ? '已处理' : '待处理'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ color: '#333', marginBottom: 4 }}>{alert.message}</div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          <div>发现时间: {new Date(alert.created_at).toLocaleString('zh-CN')}</div>
                          {alert.status === 'resolved' ? (
                            <div style={{ marginTop: 4 }}>
                              <Tag color="green" style={{ fontSize: 11 }}>处理结论: 
                                {alert.resolved_by ? alert.resolved_by.split('|')[1] || '已确认处理' : '已确认处理'}
                              </Tag>
                              <span style={{ marginLeft: 8 }}>责任人: {alert.resolved_by ? alert.resolved_by.split('|')[0] : '系统'}</span>
                              <span style={{ marginLeft: 8 }}>处理时间: {alert.resolved_at ? new Date(alert.resolved_at).toLocaleString('zh-CN') : '-'}</span>
                            </div>
                          ) : (
                            <div style={{ marginTop: 4, color: '#faad14' }}>
                              ⏳ 待运维人员处理 | 持续时间: {Math.floor((Date.now() - new Date(alert.created_at).getTime()) / 60000)}分钟
                            </div>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            暂无告警信息
          </div>
        )}
      </Modal>
      </div>
    </StudentLayout>
  )
}

export default StudentDashboard
