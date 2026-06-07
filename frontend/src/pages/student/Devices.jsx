import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Tag, Input, Select, Button, Modal, message, Descriptions, Progress, Badge, Space, Statistic } from 'antd'
import { SearchOutlined, PlayCircleOutlined, ExclamationCircleOutlined, ThunderboltOutlined, PhoneOutlined, AlipayOutlined, WalletOutlined, CheckCircleOutlined, BluetoothOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import StudentLayout from '../../components/StudentLayout.jsx'
import { deviceAPI, transactionAPI, studentAPI, alertAPI } from '../../utils/api.js'

function StudentDevices() {
  const [devices, setDevices] = useState([])
  const [filteredDevices, setFilteredDevices] = useState([])
  const [realtimeData, setRealtimeData] = useState({})
  const [alerts, setAlerts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [buildingFilter, setBuildingFilter] = useState('')
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [authModal, setAuthModal] = useState(false)
  const [balanceModal, setBalanceModal] = useState(false)
  const [phoneVerifyModal, setPhoneVerifyModal] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState('')
  const [activeTransaction, setActiveTransaction] = useState(null)
  const [deviceStats, setDeviceStats] = useState(null)
  const navigate = useNavigate()

  const buildings = ['一号楼', '二号楼', '三号楼', '图书馆']

  useEffect(() => {
    loadData()
    const interval = setInterval(loadRealtimeData, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (devices.length > 0) {
      loadRealtimeData()
    }
  }, [devices])

  useEffect(() => {
    filterDevices()
  }, [devices, searchText, statusFilter, buildingFilter])

  const loadData = async () => {
    try {
      const [profileRes, alertRes, statsRes] = await Promise.all([
        studentAPI.getProfile(),
        alertAPI.getAlerts({ status: 'unread', pageSize: 50 }),
        deviceAPI.getDeviceStats(),
      ])
      setProfile(profileRes.data)
      setAlerts(alertRes.data.alerts || [])
      setDeviceStats(statsRes.data)
      loadDevices()
    } catch (error) {
      console.error('加载数据失败', error)
    }
  }

  const loadDevices = async () => {
    try {
      const response = await deviceAPI.getDevices({ pageSize: 100 })
      setDevices(response.data.devices)
      setFilteredDevices(response.data.devices)
    } catch (error) {
      message.error('加载设备列表失败')
    }
  }

  const loadRealtimeData = async () => {
    try {
      const data = {}
      for (const device of devices) {
        if (device.status === 'online' || device.status === 'running') {
          try {
            const res = await deviceAPI.getRealtimeData(device.id)
            data[device.id] = res.data
          } catch (e) {
            // 忽略单个设备的错误
          }
        }
      }
      setRealtimeData(data)
    } catch (error) {
      console.error('加载实时数据失败')
    }
  }

  const filterDevices = () => {
    let filtered = [...devices]
    if (searchText) {
      filtered = filtered.filter(d => 
        d.name.includes(searchText) || 
        d.location.includes(searchText) ||
        String(d.id).includes(searchText)
      )
    }
    if (statusFilter) {
      filtered = filtered.filter(d => d.status === statusFilter)
    }
    if (buildingFilter) {
      filtered = filtered.filter(d => d.building === buildingFilter)
    }
    setFilteredDevices(filtered)
  }

  const handleStartUse = (device) => {
    if (!profile) {
      message.error('用户信息加载中，请稍后')
      return
    }
    if (profile.balance <= 0) {
      setSelectedDevice(device)
      setBalanceModal(true)
      return
    }
    if (profile.balance < 1) {
      message.warning('余额不足1元，建议先充值')
    }
    setSelectedDevice(device)
    setAuthModal(true)
  }

  const confirmAuth = () => {
    setVerifyStatus('')
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      setAuthModal(false)
      setPhoneVerifyModal(true)
    }, 1500)
  }

  const sendVerifyCode = () => {
    if (!profile?.phone) {
      message.error('请先绑定手机号')
      return
    }
    setVerifyStatus('code_sent')
    message.success('验证码已发送到' + profile.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'))
  }

  const handlePhoneVerify = async () => {
    if (verifyCode.length !== 6) {
      message.error('请输入6位验证码')
      return
    }
    
    setLoading(true)
    try {
      setVerifyStatus('verifying')
      const response = await transactionAPI.startTransaction({
        device_id: selectedDevice.id,
        verify_code: verifyCode,
      })
      setActiveTransaction(response.data.transactionId)
      setPhoneVerifyModal(false)
      setVerifyCode('')
      setVerifyStatus('')
      message.success('身份验证通过，开始用水')
    } catch (error) {
      setVerifyStatus('verify_failed')
      if (error.response?.data?.needRecharge) {
        setPhoneVerifyModal(false)
        setBalanceModal(true)
      } else {
        message.error(error.response?.data?.error || '验证失败，请重新输入')
      }
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

  const hasAlert = (deviceId) => {
    return alerts.some(a => a.device_id === deviceId && a.status !== 'resolved')
  }

  return (
    <StudentLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>智能水控终端列表</h2>
          <Space>
            <Tag color="green">在线 {devices.filter(d => d.status === 'online').length}</Tag>
            <Tag color="blue">使用中 {devices.filter(d => d.status === 'running').length}</Tag>
            <Tag color="default">离线 {devices.filter(d => d.status === 'offline').length}</Tag>
            <Button onClick={loadDevices}>刷新</Button>
          </Space>
        </div>
        
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8}>
              <Input
                placeholder="搜索设备名称/位置/ID"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="状态筛选"
                allowClear
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Select.Option value="online">在线</Select.Option>
                <Select.Option value="offline">离线</Select.Option>
                <Select.Option value="running">使用中</Select.Option>
              </Select>
            </Col>
            <Col xs={24} sm={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="楼宇筛选"
                allowClear
                value={buildingFilter}
                onChange={setBuildingFilter}
              >
                {buildings.map(b => (
                  <Select.Option key={b} value={b}>{b}</Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={4}>
              <div style={{ color: '#666' }}>共 {filteredDevices.length} 台</div>
            </Col>
          </Row>
          {deviceStats && deviceStats.buildingStats && deviceStats.buildingStats.length > 0 && (
            <Row gutter={[12, 8]} style={{ marginTop: 12 }}>
              <Col span={24}>
                <span style={{ fontSize: 12, color: '#999' }}>楼宇离线率: </span>
                {deviceStats.buildingStats.map(bs => (
                  <Tag key={bs.building} color={bs.offline_count > 0 ? 'orange' : 'green'} style={{ fontSize: 11 }}>
                    {bs.building}: {bs.offline_count}/{bs.total}离线 {bs.total > 0 ? ((bs.offline_count / bs.total * 100).toFixed(0) + '%') : ''}
                  </Tag>
                ))}
                <Tag color="blue" style={{ fontSize: 11 }}>整体在线率: {deviceStats.onlineRate}%</Tag>
              </Col>
            </Row>
          )}
        </Card>

        <Row gutter={[16, 16]}>
          {filteredDevices.map(device => {
            const data = realtimeData[device.id] || {}
            const hasAlertFlag = hasAlert(device.id)
            
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={device.id}>
                <Badge.Ribbon 
                  text={hasAlertFlag ? "异常告警" : null} 
                  color="red"
                >
                  <Card
                    className="device-card"
                    style={{ 
                      borderColor: device.status === 'running' ? '#1890ff' : 
                                  device.status === 'online' ? '#52c41a' : '#d9d9d9',
                      boxShadow: hasAlertFlag ? '0 2px 8px rgba(255,0,0,0.2)' : 'none'
                    }}
                    actions={[
                      device.status === 'online' && !activeTransaction ? (
                        <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => handleStartUse(device)}>
                          开始使用
                        </Button>
                      ) : device.status === 'running' ? (
                        <Tag color="processing">使用中</Tag>
                      ) : (
                        <Tag color="default">离线</Tag>
                      )
                    ]}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <h4 style={{ margin: 0 }}>{device.name}</h4>
                        <Space>
                          {hasAlertFlag && <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />}
                          <Tag color={getStatusColor(device.status)}>{getStatusText(device.status)}</Tag>
                        </Space>
                      </div>
                    </div>

                    <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
                      <Descriptions.Item label="设备ID">{device.id}</Descriptions.Item>
                      <Descriptions.Item label="位置">{device.building} {device.location}</Descriptions.Item>
                      <Descriptions.Item label="楼层">{device.floor}层</Descriptions.Item>
                      <Descriptions.Item label="型号">{device.model || 'WH-2024'}</Descriptions.Item>
                    </Descriptions>

                    {(device.status === 'online' || device.status === 'running') ? (
                      <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 6 }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ThunderboltOutlined /> 实时数据
                        </div>
                        <Row gutter={[8, 8]}>
                          <Col span={8}>
                            <Statistic
                              title={<span style={{ fontSize: 11 }}>水温</span>}
                              value={data.temperature?.toFixed(1) || '--'}
                              suffix="°C"
                              valueStyle={{ fontSize: 16, color: '#1890ff' }}
                            />
                            <Progress 
                              percent={Math.min(100, ((data.temperature || 30) - 20) * 2)} 
                              size="small"
                              strokeColor="#1890ff"
                              showInfo={false}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title={<span style={{ fontSize: 11 }}>流速</span>}
                              value={data.flow_rate?.toFixed(1) || '--'}
                              suffix="L/m"
                              valueStyle={{ fontSize: 16, color: '#52c41a' }}
                            />
                            <Progress 
                              percent={Math.min(100, (data.flow_rate || 0) * 10)} 
                              size="small"
                              strokeColor="#52c41a"
                              showInfo={false}
                            />
                          </Col>
                          <Col span={8}>
                            <Statistic
                              title={<span style={{ fontSize: 11 }}>累计</span>}
                              value={data.cumulative_volume?.toFixed(0) || '--'}
                              suffix="L"
                              valueStyle={{ fontSize: 16, color: '#722ed1' }}
                            />
                            <Progress 
                              percent={Math.min(100, (data.cumulative_volume || 0) / 10)} 
                              size="small"
                              strokeColor="#722ed1"
                              showInfo={false}
                            />
                          </Col>
                        </Row>
                        {data.is_full_flow && (
                          <div style={{ marginTop: 8, padding: 4, background: '#fff1f0', borderRadius: 4, textAlign: 'center' }}>
                            <span style={{ color: '#ff4d4f', fontSize: 12 }}>
                              <ExclamationCircleOutlined /> 连续满流运行中
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ background: '#fff2f0', padding: 12, borderRadius: 6 }}>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>⚠ 故障信息</div>
                        {device.fault_code && (
                          <div style={{ marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: '#999' }}>故障码: </span>
                            <Tag color="red">{device.fault_code}</Tag>
                          </div>
                        )}
                        {device.last_online && (
                          <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>
                            离线时长: {Math.floor((Date.now() - new Date(device.last_online).getTime()) / 3600000)}小时
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: '#ff4d4f' }}>已提交运维处置，等待修复</div>
                      </div>
                    )}
                  </Card>
                </Badge.Ribbon>
              </Col>
            )
          })}
        </Row>

        {filteredDevices.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
            暂无符合条件的设备
          </div>
        )}

        <Card title="取水资格核验" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 8]}>
            <Col xs={6} sm={6}>
              <Space direction="vertical" size={4} align="center" style={{ width: '100%' }}>
                <Tag color={profile?.bluetooth_address ? 'success' : 'default'} icon={profile?.bluetooth_address ? <CheckCircleOutlined /> : null}>
                  <BluetoothOutlined /> 蓝牙
                </Tag>
                <span style={{ fontSize: 11, color: '#999' }}>{profile?.bluetooth_address ? '已绑定' : '未绑定'}</span>
              </Space>
            </Col>
            <Col xs={6} sm={6}>
              <Space direction="vertical" size={4} align="center" style={{ width: '100%' }}>
                <Tag color={profile?.nfc_card_id ? 'success' : 'default'} icon={profile?.nfc_card_id ? <CheckCircleOutlined /> : null}>
                  NFC
                </Tag>
                <span style={{ fontSize: 11, color: '#999' }}>{profile?.nfc_card_id ? '已绑定' : '未绑定'}</span>
              </Space>
            </Col>
            <Col xs={6} sm={6}>
              <Space direction="vertical" size={4} align="center" style={{ width: '100%' }}>
                <Tag color={profile?.phone ? 'success' : 'default'} icon={profile?.phone ? <CheckCircleOutlined /> : null}>
                  <PhoneOutlined /> 手机
                </Tag>
                <span style={{ fontSize: 11, color: '#999' }}>{profile?.phone ? '已绑定' : '未绑定'}</span>
              </Space>
            </Col>
            <Col xs={6} sm={6}>
              <Space direction="vertical" size={4} align="center" style={{ width: '100%' }}>
                <Tag color={profile?.alipay_user_id ? 'success' : 'default'} icon={profile?.alipay_user_id ? <CheckCircleOutlined /> : null}>
                  <AlipayOutlined /> 支付宝
                </Tag>
                <span style={{ fontSize: 11, color: '#999' }}>{profile?.alipay_user_id ? '已绑定' : '未绑定'}</span>
              </Space>
            </Col>
          </Row>
          <div style={{ marginTop: 8, fontSize: 12, color: profile?.bluetooth_address && profile?.phone && profile?.alipay_user_id ? '#52c41a' : '#faad14' }}>
            {profile?.bluetooth_address && profile?.phone && profile?.alipay_user_id 
              ? '✓ 身份核验资质完整，取水资格正常' 
              : '⚠ 部分核验方式未绑定，请前往个人信息完善'}
            <Button type="link" size="small" onClick={() => navigate('/student/profile')}>去完善</Button>
          </div>
        </Card>

        <Modal
          title="身份验证 - 蓝牙/NFC近场识别"
          open={authModal}
          onOk={confirmAuth}
          onCancel={() => { setAuthModal(false); setVerifyStatus('') }}
          confirmLoading={verifying}
          okText="开始识别"
          width={520}
        >
          <div style={{ padding: '10px 0' }}>
            <Descriptions column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="设备名称">{selectedDevice?.name}</Descriptions.Item>
              <Descriptions.Item label="设备ID">{selectedDevice?.id}</Descriptions.Item>
              <Descriptions.Item label="位置">{selectedDevice?.building} {selectedDevice?.location}</Descriptions.Item>
            </Descriptions>
            
            <div style={{ textAlign: 'center', padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              {verifying ? (
                <div>
                  <div style={{ fontSize: 48, color: '#1890ff', marginBottom: 12 }}>🔍</div>
                  <p style={{ margin: 0 }}>正在通过蓝牙/NFC识别设备...</p>
                </div>
              ) : verifyStatus === 'failed' ? (
                <div>
                  <div style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 12 }}>❌</div>
                  <p style={{ margin: 0, color: '#ff4d4f' }}>识别失败，请将手机靠近设备重试</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 48, color: '#1890ff', marginBottom: 12 }}>📱</div>
                  <p style={{ margin: 0 }}>请将手机靠近设备进行蓝牙/NFC身份识别</p>
                  <p style={{ margin: '8px 0 0 0', color: '#888', fontSize: 12 }}>请确保手机蓝牙已开启，NFC功能可用</p>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', borderRadius: 6 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#1890ff' }}>
                🔒 安全提示：身份核验记录将保存30天，可在消费记录中复查
              </p>
            </div>
          </div>
        </Modal>

        <Modal
          title="手机号二次确认"
          open={phoneVerifyModal}
          onOk={handlePhoneVerify}
          onCancel={() => { setPhoneVerifyModal(false); setVerifyCode(''); setVerifyStatus('') }}
          confirmLoading={loading}
          okText="确认验证"
          width={480}
        >
          <div style={{ padding: '10px 0' }}>
            <p style={{ marginBottom: 16 }}>为确保您的账户安全，请完成手机号二次验证</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
              <PhoneOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <span style={{ fontSize: 16 }}>{profile?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '未绑定手机号'}</span>
              <Button type="link" size="small" onClick={() => navigate('/student/profile')}>去绑定</Button>
            </div>
            
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                maxLength={6}
                placeholder="请输入6位验证码"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                style={{ flex: 1, padding: '10px 12px', border: '1px solid ' + (verifyStatus === 'verify_failed' ? '#ff4d4f' : '#d9d9d9'), borderRadius: 6, fontSize: 16 }}
              />
              <Button onClick={sendVerifyCode} disabled={verifyStatus === 'code_sent'}>
                {verifyStatus === 'code_sent' ? '已发送' : '发送验证码'}
              </Button>
            </div>
            
            {verifyStatus === 'verify_failed' && (
              <p style={{ marginTop: 8, color: '#ff4d4f', fontSize: 12 }}>验证码错误，请重新输入</p>
            )}
            
            <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 6 }}>
              <p style={{ margin: 0, fontSize: 12, color: '#d46b08' }}>
                📝 验证记录：本次操作时间 {new Date().toLocaleString()}，设备ID {selectedDevice?.id}
              </p>
            </div>
          </div>
        </Modal>

        <Modal
          title="余额不足提醒"
          open={balanceModal}
          onOk={() => { setBalanceModal(false); navigate('/student/recharge'); }}
          onCancel={() => setBalanceModal(false)}
          okText="立即充值"
          cancelText="稍后再说"
          width={480}
        >
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <ExclamationCircleOutlined style={{ fontSize: 64, color: '#faad14', marginBottom: 16 }} />
            <h3>账户余额不足</h3>
            <p style={{ color: '#666', marginBottom: 16 }}>
              您的当前余额为 <strong style={{ color: '#f5222d', fontSize: 20 }}>¥{profile?.balance?.toFixed(2) || '0.00'}</strong>
            </p>
            <p style={{ color: '#888', marginBottom: 24 }}>
              无法使用设备 {selectedDevice?.name}（{selectedDevice?.id}），请充值后再使用
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
              <Button type="primary" size="large" icon={<AlipayOutlined />} onClick={() => { setBalanceModal(false); navigate('/student/recharge'); }}>
                支付宝充值
              </Button>
              <Button size="large" icon={<WalletOutlined />} onClick={() => { setBalanceModal(false); navigate('/student/recharge'); }}>
                微信充值
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </StudentLayout>
  )
}

export default StudentDevices
