import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Button, Space, Tag, message, Modal, Form, Input, Select, Steps, Alert, Descriptions, Checkbox, List, Divider } from 'antd'
import { WalletOutlined, ThunderboltOutlined, AlertOutlined, RiseOutlined, PlusOutlined, CheckCircleOutlined, SearchOutlined, SafetyCertificateOutlined, FileTextOutlined, ExclamationCircleOutlined, ClockCircleOutlined, DatabaseOutlined, TeamOutlined, LockOutlined, InfoCircleOutlined, ShoppingOutlined, HistoryOutlined, FireOutlined, CarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import api from '../utils/api'
import dayjs from 'dayjs'

const Home = () => {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [usageData, setUsageData] = useState([])
  const [user, setUser] = useState(null)
  const [bindModalVisible, setBindModalVisible] = useState(false)
  const [bindForm] = Form.useForm()
  const [bindLoading, setBindLoading] = useState(false)
  const [verifyStep, setVerifyStep] = useState(0)
  const [verifyResult, setVerifyResult] = useState(null)
  const [verifyError, setVerifyError] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [newAccount, setNewAccount] = useState(null)
  const [bindingVoucher, setBindingVoucher] = useState(null)
  const [voucherVisible, setVoucherVisible] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const data = await api.get('/accounts')
      setAccounts(data)
      if (data.length > 0) {
        fetchUsageData(data[0].id)
      }
    } catch (error) {
      message.error('获取户号信息失败')
    }
  }

  const fetchUsageData = async (accountId) => {
    try {
      const data = await api.get(`/services/analysis/usage-trend?account_id=${accountId}&days=7`)
      setUsageData(data.records || [])
    } catch (error) {
      console.error('获取用电数据失败', error)
    }
  }

  const handleVerifyAccount = async () => {
    setVerifyError(null)
    try {
      const values = await bindForm.validateFields(['account_number', 'account_name', 'meter_number'])
      setVerifying(true)
      const data = await api.post('/accounts/verify', values)
      setVerifyResult(data)
      setVerifyStep(1)
      setAddressConfirmed(false)
      message.success('户号档案核验通过')
    } catch (error) {
      const errData = error.response?.data
      setVerifyError(errData || { error: error.message })

      if (errData?.errors && errData.errors.length > 0) {
        bindForm.setFields(errData.errors.map(e => ({
          name: e.field,
          errors: [e.message]
        })))
      }

      if (errData?.error) {
        message.error(errData.error)
      }
    } finally {
      setVerifying(false)
    }
  }

  const handleBindAccount = async () => {
    if (!addressConfirmed) {
      message.warning('请先勾选"地址信息核对无误"')
      return
    }

    try {
      setBindLoading(true)
      const payload = {
        account_number: verifyResult.account_number,
        account_name: verifyResult.account_name,
        meter_number: verifyResult.meter_number,
        voltage_level: verifyResult.voltage_level,
        province: verifyResult.province,
        city: verifyResult.city,
        district: verifyResult.district,
        address: verifyResult.address,
        verify_code: verifyResult.verify_code
      }
      const data = await api.post('/accounts', payload)
      const newAccountData = data.account
      setNewAccount(newAccountData)
      setBindingVoucher(data.voucher || null)
      setVoucherVisible(true)
      setBindModalVisible(false)
      bindForm.resetFields()
      setVerifyStep(0)
      setVerifyResult(null)
      setVerifyError(null)
      setAddressConfirmed(false)
      fetchAccounts()
      if (newAccountData) {
        setAccounts(prev => [...prev, newAccountData])
      }
    } catch (error) {
      message.error(error.response?.data?.error || '绑定失败')
    } finally {
      setBindLoading(false)
    }
  }

  const resetBindModal = () => {
    setBindModalVisible(false)
    bindForm.resetFields()
    setVerifyStep(0)
    setVerifyResult(null)
    setVerifyError(null)
    setAddressConfirmed(false)
  }

  const getChartOption = () => {
    const sortedData = [...usageData].reverse()
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: sortedData.map(item => item.date?.slice(5) || '') },
      yAxis: { type: 'value', name: 'kWh' },
      series: [{
        name: '用电量', type: 'line', smooth: true,
        data: sortedData.map(item => item.kwh || 0),
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(24, 144, 255, 0.5)' }, { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }] } },
        lineStyle: { color: '#1890ff', width: 3 }
      }]
    }
  }

  const quickServices = [
    { icon: <ThunderboltOutlined style={{ fontSize: 32, color: '#1890ff' }} />, label: '立即缴费', path: '/payment' },
    { icon: <WalletOutlined style={{ fontSize: 32, color: '#52c41a' }} />, label: '户号管理', path: '/accounts' },
    { icon: <HistoryOutlined style={{ fontSize: 32, color: '#13c2c2' }} />, label: '交费记录', path: '/payment-records' },
    { icon: <ShoppingOutlined style={{ fontSize: 32, color: '#fa8c16' }} />, label: '积分商城', path: '/mall' },
    { icon: <RiseOutlined style={{ fontSize: 32, color: '#722ed1' }} />, label: '金融理财', path: '/finance' },
    { icon: <AlertOutlined style={{ fontSize: 32, color: '#eb2f96' }} />, label: '停电计划', path: '/services' },
    { icon: <FireOutlined style={{ fontSize: 32, color: '#fa541c' }} />, label: '煤改电补贴', path: '/services' },
    { icon: <CarOutlined style={{ fontSize: 32, color: '#2f54eb' }} />, label: '光伏并网', path: '/services' },
  ]

  return (
    <div>
      {newAccount && (
        <Alert
          message="新户号绑定成功"
          description={
            <span>
              户号 {newAccount.account_number}（{newAccount.account_name}）已成功绑定
              <Button type="link" size="small" onClick={() => setVoucherVisible(true)} style={{ marginLeft: 8 }}>
                查看绑定凭证
              </Button>
            </span>
          }
          type="success"
          showIcon
          closable
          onClose={() => setNewAccount(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title="我的户号"
            extra={<Button type="link" icon={<PlusOutlined />} onClick={() => setBindModalVisible(true)}>添加户号</Button>}
          >
            {accounts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无绑定户号，<Button type="link" onClick={() => setBindModalVisible(true)}>立即绑定</Button>
              </div>
            ) : (
              <>
              <Row gutter={[16, 16]}>
                {accounts.map(account => (
                  <Col xs={24} md={12} key={account.id}>
                    <Card
                      className={`account-card ${account.is_default ? 'default' : ''} ${account.arrears > 0 ? 'arrears' : ''} ${account.payment_due_days <= 7 ? 'due-soon' : ''}`}
                      onClick={() => navigate('/payment')}
                      size="small"
                      actions={[
                        <span key="voucher" onClick={(e) => { e.stopPropagation(); setBindingVoucher({ voucher_no: 'BVD' + account.id, account }); setVoucherVisible(true) }}>
                          <FileTextOutlined /> 绑定凭证
                        </span>,
                        <span key="detail" onClick={(e) => { e.stopPropagation(); navigate('/accounts') }}>
                          <InfoCircleOutlined /> 详情
                        </span>
                      ]}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
                            {account.account_name}
                            {account.is_default && <Tag color="blue" style={{ marginLeft: 8 }}>默认</Tag>}
                            {account.verify_status === 'verified' && (
                              <Tag color="green" icon={<SafetyCertificateOutlined />} style={{ marginLeft: 8 }}>已核验</Tag>
                            )}
                            {account.bind_permission === 'owner' ? (
                              <Tag color="purple" style={{ marginLeft: 8 }}><LockOutlined /> 户主</Tag>
                            ) : (
                              <Tag color="orange" style={{ marginLeft: 8 }}><TeamOutlined /> 授权</Tag>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#999' }}>{account.account_number}</div>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{account.address}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {account.arrears > 0 && <Tag color="red">欠费</Tag>}
                          {account.arrears <= 0 && account.payment_due_days <= 7 && (
                            <Tag color="orange"><ClockCircleOutlined /> {account.payment_due_days}天后到期</Tag>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Statistic title="余额" value={account.balance} prefix="¥" valueStyle={{ fontSize: 16, color: account.balance >= 0 ? '#52c41a' : '#ff4d4f' }} />
                        <Statistic title="今日用电" value={account.daily_usage} suffix="kWh" valueStyle={{ fontSize: 16, color: '#1890ff' }} />
                      </div>

                      <Divider style={{ margin: '12px 0' }} />

                      <div style={{ fontSize: 12 }}>
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#999' }}><DatabaseOutlined /> 档案来源：</span>
                            <span>{account.archive_source || '省级营销系统'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#999' }}><ClockCircleOutlined /> 缴费到期：</span>
                            <span style={{ color: account.payment_due_days <= 7 ? '#fa8c16' : '#666' }}>
                              {dayjs(account.payment_due_date).format('MM-DD')}
                              {account.payment_due_days <= 7 && ' (近7天)'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#999' }}><TeamOutlined /> 代缴关系：</span>
                            <span>
                              {account.agent_count > 0 ? (
                                <Tag color="purple" style={{ margin: 0 }}>{account.agent_count} 人代缴</Tag>
                              ) : (
                                <span style={{ color: '#999' }}>暂无</span>
                              )}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#999' }}><LockOutlined /> 绑定权限：</span>
                            <span>
                              <Tag color={account.bind_permission === 'owner' ? 'purple' : 'orange'} style={{ margin: 0 }}>
                                Lv.{account.bind_permission_level} {account.bind_permission === 'owner' ? '户主' : '授权'}
                              </Tag>
                            </span>
                          </div>
                        </Space>
                      </div>

                      {account.payment_due_days <= 7 && account.arrears <= 0 && (
                        <Alert
                          message={`缴费提醒：还有 ${account.payment_due_days} 天到期，请及时充值`}
                          type="warning"
                          showIcon
                          size="small"
                          style={{ marginTop: 12 }}
                        />
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>

              {accounts.length > 0 && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0f5ff', borderRadius: 6 }}>
                  <Space>
                    <span style={{ color: '#666' }}><LockOutlined /> 多绑权限边界：</span>
                    <Tag color="blue">已绑定 {accounts[0].current_bind_count || accounts.length} / {accounts[0].max_bind_accounts || 5} 户</Tag>
                    <span style={{ fontSize: 12, color: '#999' }}>户主可授权5个以内户号绑定，授权户号仅可缴费不可管理</span>
                  </Space>
                </div>
              )}
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="快捷服务">
            <Row gutter={[16, 16]}>
              {quickServices.map((service, index) => (
                <Col xs={12} key={index}>
                  <div className="service-grid-item" onClick={() => navigate(service.path)}>
                    {service.icon}
                    <div style={{ fontSize: 14, marginTop: 8 }}>{service.label}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
          <Card title="我的积分" style={{ marginTop: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 'bold', color: '#fa8c16' }}>{user?.points || 0}</div>
              <div style={{ color: '#999', marginTop: 4 }}>可用积分</div>
              <Space style={{ marginTop: 12 }}>
                <Button type="primary" onClick={() => navigate('/mall')}>去兑换</Button>
              </Space>
            </div>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#999' }}>兑换风控：</span>
                <Tag color="green" style={{ margin: 0 }}>正常</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#999' }}>今日限兑：</span>
                <span>0/3 次</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#999' }}>防转售追踪：</span>
                <Tag color="blue" style={{ margin: 0 }}>已启用</Tag>
              </div>
            </div>
          </Card>
          <Card title="个人资产" style={{ marginTop: 16 }} extra={<Button type="link" size="small" onClick={() => navigate('/finance')}>查看详情</Button>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#999' }}><SafetyCertificateOutlined /> 风险等级：</span>
                <Tag color={user?.risk_level === 3 ? 'red' : user?.risk_level === 2 ? 'orange' : 'green'}>
                  {user?.risk_level === 3 ? '进取型' : user?.risk_level === 2 ? '稳健型' : '保守型'}
                </Tag>
              </div>
              <Button type="default" block size="small" onClick={() => navigate('/finance')}>
                开始风险测评
              </Button>
            </Space>
          </Card>
          <Card title="后台状态" style={{ marginTop: 16 }} size="small">
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#666' }}><AlertOutlined /> 停电订阅：</span>
                <Tag color="orange" style={{ margin: 0 }}>未开启</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#666' }}><ExclamationCircleOutlined /> 异常预警：</span>
                <Tag color="green" style={{ margin: 0 }}>监测中</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#666' }}><FileTextOutlined /> 营商环境报送：</span>
                <Tag color="red" style={{ margin: 0 }}>2项待报</Tag>
              </div>
              <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate('/services')}>
                前往服务台 →
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="近7天用电趋势">
            <ReactECharts option={getChartOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="用电统计">
            {usageData.length > 0 && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Statistic title="累计用电量" value={usageData.reduce((sum, item) => sum + (item.kwh || 0), 0).toFixed(1)} suffix="kWh" />
                <Statistic title="累计电费" value={usageData.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)} prefix="¥" />
                <Statistic title="日均用电" value={(usageData.reduce((sum, item) => sum + (item.kwh || 0), 0) / usageData.length).toFixed(1)} suffix="kWh" />
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="绑定新户号"
        open={bindModalVisible}
        onCancel={resetBindModal}
        width={600}
        footer={null}
        destroyOnClose
      >
        <Steps
          current={verifyStep}
          size="small"
          style={{ marginBottom: 24 }}
          status={verifyError ? 'error' : 'process'}
          items={[
            { title: '输入户号信息' },
            { title: '档案核验' },
            { title: '确认绑定' }
          ]}
        />

        {verifyError && (
          <Alert
            message={verifyError.error || '核验失败'}
            description={
              <div>
                {verifyError.suggestion && <p>💡 建议：{verifyError.suggestion}</p>}
                {verifyError.expected_name && <p>📋 提示：{verifyError.expected_name}</p>}
                {verifyError.errors && verifyError.errors.map((e, i) => (
                  <p key={i} style={{ margin: 0 }}>• {e.message}</p>
                ))}
                <p style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                  错误码：{verifyError.verify_code || 'UNKNOWN'} | 核验步骤：{verifyError.verify_step || 'unknown'}
                </p>
              </div>
            }
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        {verifyStep === 0 && (
          <Form form={bindForm} layout="vertical">
            <Form.Item name="account_number" label="户号" rules={[{ required: true, message: '请输入16位户号' }, { len: 16, message: '户号必须为16位数字' }]}>
              <Input placeholder="请输入16位户号（可在电费账单中查看）" maxLength={16} />
            </Form.Item>
            <Form.Item name="account_name" label="户名" rules={[{ required: true, message: '请输入户名' }]}>
              <Input placeholder="请输入户名（须与电力系统档案一致）" />
            </Form.Item>
            <Form.Item name="meter_number" label="电表编号" rules={[{ required: true, message: '请输入电表编号' }]}>
              <Input placeholder="请输入电表编号（电表正面左下角10位编码，可含M前缀）" maxLength={12} />
            </Form.Item>
            <div style={{ background: '#f6ffed', padding: 12, borderRadius: 4, marginBottom: 16, fontSize: 12 }}>
              <p style={{ margin: 0, color: '#52c41a' }}><strong>💡 核验说明：</strong></p>
              <ul style={{ margin: '4px 0 0 16px', color: '#666', padding: 0 }}>
                <li>系统将对接省级营销系统核验户号档案真实性</li>
                <li>户名须与电力系统档案完全一致</li>
                <li>电表编号用于确认户号归属关系</li>
              </ul>
            </div>
            <Form.Item>
              <Button type="primary" icon={<SearchOutlined />} loading={verifying} onClick={handleVerifyAccount} style={{ width: '100%', height: 44, fontSize: 15 }}>
                核验户号档案
              </Button>
            </Form.Item>
          </Form>
        )}

        {verifyStep === 1 && verifyResult && (
          <div>
            <Alert
              message="户号档案核验通过"
              description="以下为省级营销系统返回的户号档案信息，请核对无误后勾选确认并继续"
              type="success"
              icon={<SafetyCertificateOutlined />}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="核验状态">
                <Tag color="green" icon={<CheckCircleOutlined />}>核验通过</Tag>
                <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>
                  数据源：{verifyResult.verification_source || '省级营销系统'} | 置信度：{verifyResult.address_match_confidence || 98}%
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="户号">{verifyResult.account_number}</Descriptions.Item>
              <Descriptions.Item label="户名">{verifyResult.account_name}</Descriptions.Item>
              <Descriptions.Item label="电表编号">{verifyResult.meter_number}</Descriptions.Item>
              <Descriptions.Item label="用电类别">
                {verifyResult.voltage_level === '380V' ? '商业用电（380V）' : '居民用电（220V）'}
              </Descriptions.Item>
              <Descriptions.Item label="所属省份">{verifyResult.province}</Descriptions.Item>
              <Descriptions.Item label="所属城市">{verifyResult.city}</Descriptions.Item>
              <Descriptions.Item label="所属区县">{verifyResult.district}</Descriptions.Item>
              <Descriptions.Item label="用电地址">
                <strong style={{ color: '#1890ff' }}>{verifyResult.address}</strong>
              </Descriptions.Item>
            </Descriptions>

            {verifyResult.binding_requirements && (
              <Card size="small" title="核验通过项" style={{ marginBottom: 16 }}>
                <List
                  size="small"
                  dataSource={verifyResult.binding_requirements}
                  renderItem={item => (
                    <List.Item><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />{item}</List.Item>
                  )}
                />
              </Card>
            )}

            {verifyResult.local_services && verifyResult.local_services.length > 0 && (
              <Card size="small" title="该属地可办理服务" style={{ marginBottom: 16 }}>
                {verifyResult.local_services.map((s, i) => (
                  <Tag key={i} color="blue" style={{ marginBottom: 4 }}>{s}</Tag>
                ))}
              </Card>
            )}

            <div style={{ marginBottom: 16 }}>
              <Checkbox checked={addressConfirmed} onChange={(e) => setAddressConfirmed(e.target.checked)}>
                我已核对上述用电地址与实际居住地址一致，户号归属关系正确无误
              </Checkbox>
            </div>

            <div style={{ textAlign: 'right' }}>
              <Button style={{ marginRight: 8 }} onClick={() => { setVerifyStep(0); setVerifyResult(null); setVerifyError(null) }}>返回修改</Button>
              <Button type="primary" icon={<CheckCircleOutlined />} disabled={!addressConfirmed} onClick={() => setVerifyStep(2)}>
                信息无误，去绑定
              </Button>
            </div>
          </div>
        )}

        {verifyStep === 2 && verifyResult && (
          <div>
            <Alert
              message="确认绑定此户号"
              description={`即将绑定户号 ${verifyResult.account_number}（${verifyResult.account_name}），绑定后可在首页和户号管理中查看该户号信息`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="户号">{verifyResult.account_number}</Descriptions.Item>
              <Descriptions.Item label="户名">{verifyResult.account_name}</Descriptions.Item>
              <Descriptions.Item label="用电地址">{verifyResult.address}</Descriptions.Item>
              <Descriptions.Item label="属地服务">
                {verifyResult.local_services?.map((s, i) => (
                  <Tag key={i} color="blue" style={{ marginBottom: 4 }}>{s}</Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ textAlign: 'right' }}>
              <Button style={{ marginRight: 8 }} onClick={() => setVerifyStep(1)}>上一步</Button>
              <Button type="primary" loading={bindLoading} onClick={handleBindAccount}>确认绑定</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={<span><FileTextOutlined /> 户号绑定凭证</span>}
        open={voucherVisible}
        onCancel={() => setVoucherVisible(false)}
        width={520}
        footer={[
          <Button key="close" type="primary" onClick={() => setVoucherVisible(false)}>关闭</Button>
        ]}
      >
        {bindingVoucher && (
          <div>
            <Alert
              message="绑定成功，凭证已留存"
              description="本凭证是户号所有权和使用权的法律依据，请妥善保管"
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="凭证编号">
                <span style={{ fontFamily: 'monospace' }}>{bindingVoucher.voucher_no}</span>
              </Descriptions.Item>
              <Descriptions.Item label="绑定状态">
                <Tag color="green">{bindingVoucher.binding_status === 'success' ? '绑定成功' : '处理中'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="核验状态">
                <Tag color="green" icon={<SafetyCertificateOutlined />}>已核验</Tag>
              </Descriptions.Item>
              {bindingVoucher.account && (
                <>
                  <Descriptions.Item label="户号">{bindingVoucher.account.account_number}</Descriptions.Item>
                  <Descriptions.Item label="户名">{bindingVoucher.account.account_name}</Descriptions.Item>
                  <Descriptions.Item label="电表编号">{bindingVoucher.account.meter_number}</Descriptions.Item>
                  <Descriptions.Item label="用电地址">{bindingVoucher.account.address}</Descriptions.Item>
                  <Descriptions.Item label="属地">{bindingVoucher.account.province}{bindingVoucher.account.city}{bindingVoucher.account.district}</Descriptions.Item>
                </>
              )}
              {bindingVoucher.binding_requirements && (
                <Descriptions.Item label="核验通过项">
                  {JSON.parse(bindingVoucher.binding_requirements).map((r, i) => (
                    <div key={i}><CheckCircleOutlined style={{ color: '#52c41a' }} /> {r}</div>
                  ))}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="地址确认">
                {bindingVoucher.address_confirmed ? (
                  <Tag color="green">已确认</Tag>
                ) : (
                  <Tag color="orange">待确认</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="绑定时间">
                {dayjs(bindingVoucher.binding_time || bindingVoucher.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '16px 0 8px' }} />
            <p style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
              本凭证由国家电网综合能源服务门户系统自动生成，对接省级营销系统核验后留存
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Home
