import React, { useState, useEffect } from 'react'
import { Card, Tabs, Form, Input, Button, Select, List, Tag, message, Modal, Spin, Descriptions, Alert } from 'antd'
import { QrcodeOutlined, UserSwitchOutlined, ShopOutlined, SafetyCertificateOutlined, ReloadOutlined } from '@ant-design/icons'
import { generatePickupCode, transferToStation, authorizePickup, getPickupStatus, biometricAuth } from '../../api/pickup'
import { getStations } from '../../api/community'
import { getMyParcels } from '../../api/parcels'
import dayjs from 'dayjs'

const { Option } = Select

function Pickup() {
  const [activeTab, setActiveTab] = useState('code')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [pickupCode, setPickupCode] = useState(null)
  const [pendingParcels, setPendingParcels] = useState([])
  const [stations, setStations] = useState([])
  const [transferModal, setTransferModal] = useState(false)
  const [authorizeModal, setAuthorizeModal] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState(null)
  const [biometricModal, setBiometricModal] = useState(false)

  useEffect(() => {
    fetchPendingParcels()
    fetchStations()
  }, [])

  const fetchPendingParcels = async () => {
    try {
      setLoading(true)
      const result = await getMyParcels({ status: 'pickup' })
      setPendingParcels(Array.isArray(result) ? result : result?.list || [])
    } catch (error) {
      console.error('Fetch pending parcels error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStations = async () => {
    try {
      const result = await getStations()
      setStations(Array.isArray(result) ? result : result?.list || [])
    } catch (error) {
      console.error('Fetch stations error:', error)
    }
  }

  const handleGenerateCode = async (values) => {
    if (!values.trackingNo) {
      message.warning('请选择运单号')
      return
    }
    
    setGenerating(true)
    try {
      const result = await generatePickupCode(values.trackingNo)
      setPickupCode(result)
      message.success('取件码生成成功')
    } catch (error) {
      message.error('生成取件码失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleBiometricAuth = async () => {
    if (!selectedParcel) return
    
    try {
      const result = await biometricAuth(selectedParcel.tracking_no, { type: 'fingerprint' })
      if (result?.success) {
        message.success('生物特征验证通过，取件成功！')
        setBiometricModal(false)
        fetchPendingParcels()
      } else {
        message.error('验证失败，请重试')
      }
    } catch (error) {
      message.error('验证失败')
    }
  }

  const handleTransfer = async (values) => {
    if (!selectedParcel || !values.stationId) {
      message.warning('请选择驿站')
      return
    }
    
    try {
      await transferToStation(selectedParcel.tracking_no, values.stationId)
      message.success('已申请转驿站，请注意查收通知')
      setTransferModal(false)
      fetchPendingParcels()
    } catch (error) {
      message.error('转驿站申请失败')
    }
  }

  const handleAuthorize = async (values) => {
    if (!selectedParcel || !values.authorizedUser) {
      message.warning('请输入被授权人信息')
      return
    }
    
    try {
      await authorizePickup(selectedParcel.tracking_no, values.authorizedUser)
      message.success('已成功授权他人代取')
      setAuthorizeModal(false)
    } catch (error) {
      message.error('授权失败')
    }
  }

  const showTransferModal = (parcel) => {
    setSelectedParcel(parcel)
    setTransferModal(true)
  }

  const showAuthorizeModal = (parcel) => {
    setSelectedParcel(parcel)
    setAuthorizeModal(true)
  }

  const showBiometricModal = (parcel) => {
    setSelectedParcel(parcel)
    setBiometricModal(true)
  }

  const codeForm = (
    <Card>
      <Form layout="vertical" onFinish={handleGenerateCode}>
        <Form.Item
          name="trackingNo"
          label="选择待取包裹"
          rules={[{ required: true, message: '请选择运单号' }]}
        >
          <Select placeholder="请选择待取包裹的运单号">
            {pendingParcels.map(parcel => (
              <Option key={parcel.tracking_no} value={parcel.tracking_no}>
                {parcel.tracking_no} - {parcel.description || '快递包裹'}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={generating}
            icon={<QrcodeOutlined />}
            block
            size="large"
          >
            生成取件码
          </Button>
        </Form.Item>
      </Form>

      {pickupCode && (
        <div style={{ marginTop: 24 }}>
          <Alert
            message="取件码有效期为30分钟"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <div className="pickup-code">
            {pickupCode.code || '123456'}
          </div>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="运单号">
              {pickupCode.tracking_no || selectedParcel?.tracking_no}
            </Descriptions.Item>
            <Descriptions.Item label="生成时间">
              {dayjs(pickupCode.created_at || new Date()).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="有效期至">
              {dayjs(pickupCode.expires_at || new Date(Date.now() + 30 * 60 * 1000)).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </div>
      )}
    </Card>
  )

  const biometricForm = (
    <Card>
      <Alert
        message="安全便捷的取件方式"
        description="使用指纹或面容识别快速取件，无需记忆取件码"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <List
        dataSource={pendingParcels}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                key="verify"
                type="primary"
                icon={<SafetyCertificateOutlined />}
                onClick={() => showBiometricModal(item)}
              >
                刷脸取件
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.tracking_no}
              description={item.description || '快递包裹'}
            />
            <Tag color="purple">待取件</Tag>
          </List.Item>
        )}
        locale={{ emptyText: '暂无待取包裹' }}
      />
    </Card>
  )

  const authorizeForm = (
    <Card>
      <Alert
        message="授权他人代取"
        description="将取件权限授权给亲友，方便他人代您取件"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <List
        dataSource={pendingParcels}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                key="authorize"
                icon={<UserSwitchOutlined />}
                onClick={() => showAuthorizeModal(item)}
              >
                授权代取
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.tracking_no}
              description={item.description || '快递包裹'}
            />
            <Tag color="purple">待取件</Tag>
          </List.Item>
        )}
        locale={{ emptyText: '暂无待取包裹' }}
      />
    </Card>
  )

  const transferForm = (
    <Card>
      <Alert
        message="超时转驿站"
        description="包裹存放超过24小时未取件，可申请转至附近驿站暂存"
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <List
        dataSource={pendingParcels}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button
                key="transfer"
                icon={<ShopOutlined />}
                onClick={() => showTransferModal(item)}
              >
                转驿站
              </Button>
            ]}
          >
            <List.Item.Meta
              title={item.tracking_no}
              description={
                <span>
                  {item.description || '快递包裹'}
                  <br />
                  <span style={{ color: '#faad14' }}>
                    已存放 {item.stored_hours || 26} 小时
                  </span>
                </span>
              }
            />
            <Tag color="orange">超时风险</Tag>
          </List.Item>
        )}
        locale={{ emptyText: '暂无待取包裹' }}
      />
    </Card>
  )

  const tabItems = [
    { key: 'code', label: (<span><QrcodeOutlined /> 取件码</span>), children: codeForm },
    { key: 'biometric', label: (<span><SafetyCertificateOutlined /> 生物特征</span>), children: biometricForm },
    { key: 'authorize', label: (<span><UserSwitchOutlined /> 授权代取</span>), children: authorizeForm },
    { key: 'transfer', label: (<span><ShopOutlined /> 转驿站</span>), children: transferForm },
  ]

  return (
    <div className="page-container">
      <h2 className="page-title">取件服务</h2>

      <Spin spinning={loading}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Spin>

      <Modal
        title="生物特征取件"
        open={biometricModal}
        onCancel={() => setBiometricModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setBiometricModal(false)}>取消</Button>,
          <Button key="confirm" type="primary" onClick={handleBiometricAuth}>
            <SafetyCertificateOutlined /> 开始验证
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <SafetyCertificateOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
          <p>请将手指放在指纹识别区或面向摄像头</p>
          <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
            运单号：{selectedParcel?.tracking_no}
          </p>
        </div>
      </Modal>

      <Modal
        title="授权他人代取"
        open={authorizeModal}
        onCancel={() => setAuthorizeModal(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleAuthorize}>
          <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="运单号">
              {selectedParcel?.tracking_no}
            </Descriptions.Item>
            <Descriptions.Item label="包裹信息">
              {selectedParcel?.description || '快递包裹'}
            </Descriptions.Item>
          </Descriptions>
          
          <Form.Item
            name="authorizedUser"
            label="被授权人手机号"
            rules={[{ required: true, message: '请输入被授权人手机号' }]}
          >
            <Input placeholder="请输入被授权人手机号" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认授权
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="转驿站申请"
        open={transferModal}
        onCancel={() => setTransferModal(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleTransfer}>
          <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="运单号">
              {selectedParcel?.tracking_no}
            </Descriptions.Item>
            <Descriptions.Item label="已存放时长">
              {selectedParcel?.stored_hours || 26} 小时
            </Descriptions.Item>
          </Descriptions>
          
          <Form.Item
            name="stationId"
            label="选择目标驿站"
            rules={[{ required: true, message: '请选择驿站' }]}
          >
            <Select placeholder="请选择要转入的驿站">
              {stations.map(station => (
                <Option key={station.id} value={station.id}>
                  {station.name} - {station.address}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交申请
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Pickup
