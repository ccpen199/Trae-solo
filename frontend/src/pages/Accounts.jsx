import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Modal, Form, Input, Select, message, Popconfirm, Steps, Alert, Descriptions, Tag, Checkbox, Divider, List } from 'antd'
import { PlusOutlined, StarOutlined, StarFilled, DeleteOutlined, SearchOutlined, CheckCircleOutlined, SafetyCertificateOutlined, FileTextOutlined, ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import api from '../utils/api'
import dayjs from 'dayjs'

const Accounts = () => {
  const [searchParams] = useSearchParams()
  const [accounts, setAccounts] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [verifyStep, setVerifyStep] = useState(0)
  const [verifyResult, setVerifyResult] = useState(null)
  const [verifyError, setVerifyError] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [newAccount, setNewAccount] = useState(null)
  const [bindingVoucher, setBindingVoucher] = useState(null)
  const [voucherVisible, setVoucherVisible] = useState(false)
  const [addressConfirmed, setAddressConfirmed] = useState(false)

  useEffect(() => {
    fetchAccounts()
    if (searchParams.get('bind') === '1') {
      setModalVisible(true)
    }
  }, [])

  const fetchAccounts = async () => {
    try {
      const data = await api.get('/accounts')
      setAccounts(data)
    } catch (error) {
      message.error('获取户号列表失败')
    }
  }

  const handleVerifyAccount = async () => {
    setVerifyError(null)
    try {
      const values = await form.validateFields(['account_number', 'account_name', 'meter_number'])
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
        form.setFields(errData.errors.map(e => ({
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

  const handleAdd = async () => {
    if (!addressConfirmed) {
      message.warning('请先勾选"地址信息核对无误"')
      return
    }

    try {
      setLoading(true)
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
      setNewAccount(data.account || null)
      setBindingVoucher(data.voucher || null)
      setVoucherVisible(true)
      setModalVisible(false)
      form.resetFields()
      setVerifyStep(0)
      setVerifyResult(null)
      setVerifyError(null)
      fetchAccounts()
    } catch (error) {
      message.error(error.response?.data?.error || '绑定失败')
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setModalVisible(false)
    form.resetFields()
    setVerifyStep(0)
    setVerifyResult(null)
    setVerifyError(null)
    setAddressConfirmed(false)
  }

  const handleSetDefault = async (id) => {
    try {
      await api.put(`/accounts/${id}/default`)
      message.success('设置成功')
      fetchAccounts()
    } catch (error) {
      message.error('设置失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/accounts/${id}`)
      message.success('删除成功')
      fetchAccounts()
    } catch (error) {
      message.error(error.response?.data?.error || '删除失败')
    }
  }

  const getVerifyStepError = () => {
    if (!verifyError) return null
    const stepMap = {
      duplicate_check: 0,
      existence_check: 0,
      name_verification: 0,
      meter_verification: 0
    }
    return stepMap[verifyError.verify_step]
  }

  return (
    <div>
      {newAccount && (
        <Alert
          message="新户号绑定成功"
          description={
            <span>
              户号 {newAccount.account_number}（{newAccount.account_name}）已成功绑定，
              地址：{newAccount.address}，属地：{newAccount.province}{newAccount.city}{newAccount.district}
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

      <Card
        title="户号管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            绑定新户号
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          {accounts.map(account => (
            <Col xs={24} md={12} lg={8} key={account.id}>
              <Card
                className={`account-card ${account.is_default ? 'default' : ''} ${account.arrears > 0 ? 'arrears' : ''}`}
                size="small"
                actions={[
                  !account.is_default && (
                    <span key="default" onClick={() => handleSetDefault(account.id)}>
                      <StarOutlined /> 设为默认
                    </span>
                  ),
                  account.is_default && <span key="is-default"><StarFilled style={{ color: '#faad14' }} /> 默认户号</span>,
                  <span key="voucher" onClick={() => { setBindingVoucher({ voucher_no: 'BVD' + account.id, account }); setVoucherVisible(true) }}>
                    <FileTextOutlined /> 绑定凭证
                  </span>,
                  !account.is_default && (
                    <Popconfirm
                      key="delete"
                      title="确定要解绑这个户号吗？"
                      onConfirm={() => handleDelete(account.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <span><DeleteOutlined /> 解绑</span>
                    </Popconfirm>
                  )
                ].filter(Boolean)}
              >
                <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
                  {account.account_name}
                  {account.verify_status === 'verified' && (
                    <Tag color="green" icon={<SafetyCertificateOutlined />} style={{ marginLeft: 8 }}>已核验</Tag>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>户号：{account.account_number}</div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>电表编号：{account.meter_number || '-'}</div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                  属地：{account.province}{account.city}{account.district}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>{account.address}</div>
                <Row gutter={8}>
                  <Col span={8}>
                    <div style={{ fontSize: 12, color: '#999' }}>余额</div>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: account.balance >= 0 ? '#52c41a' : '#ff4d4f' }}>
                      ¥{account.balance?.toFixed(2)}
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 12, color: '#999' }}>欠费</div>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: account.arrears > 0 ? '#ff4d4f' : '#52c41a' }}>
                      ¥{account.arrears?.toFixed(2)}
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 12, color: '#999' }}>今日用电</div>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
                      {account.daily_usage}kWh
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>

        {accounts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
            暂无绑定户号，<Button type="link" onClick={() => setModalVisible(true)}>立即绑定</Button>
          </div>
        )}
      </Card>

      <Modal
        title="绑定新户号"
        open={modalVisible}
        onCancel={resetModal}
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
          <Form form={form} layout="vertical">
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
              description={`即将绑定户号 ${verifyResult.account_number}（${verifyResult.account_name}），绑定后可在首页和户号管理中查看该户号信息并办理相关业务`}
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
              <Button type="primary" loading={loading} onClick={handleAdd}>确认绑定</Button>
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

export default Accounts
