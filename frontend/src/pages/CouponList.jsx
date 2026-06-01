import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, message, Tabs, Tag, Space, Modal, Form, Input, Select, InputNumber } from 'antd'
import { PlusOutlined, GiftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const { TabPane } = Tabs
const { Option } = Select

const CouponList = () => {
  const navigate = useNavigate()
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [myCoupons, setMyCoupons] = useState([])
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [form] = Form.useForm()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadAvailableCoupons()
    if (localStorage.getItem('token')) {
      loadMyCoupons()
    } else {
      setMyCoupons([])
    }
  }, [])

  const loadAvailableCoupons = async () => {
    try {
      const res = await api.get('/coupons')
      setAvailableCoupons(res.data)
    } catch (error) {
      console.error('加载优惠券失败', error)
    }
  }

  const loadMyCoupons = async () => {
    try {
      const res = await api.get('/coupons/my')
      setMyCoupons(res.data)
    } catch (error) {
      console.error('加载我的优惠券失败', error)
    }
  }

  const handleReceive = async (couponId) => {
    if (!localStorage.getItem('token')) {
      message.warning('请先登录后领取优惠券')
      navigate('/login')
      return
    }

    try {
      await api.post(`/coupons/${couponId}/receive`)
      message.success('领取成功')
      loadAvailableCoupons()
      loadMyCoupons()
    } catch (error) {
      message.error(error.response?.data?.error || '领取失败')
    }
  }

  const handleCreateCoupon = async (values) => {
    try {
      await api.post('/coupons', values)
      message.success('创建成功')
      setCreateModalVisible(false)
      form.resetFields()
      loadAvailableCoupons()
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败')
    }
  }

  const CouponCard = ({ coupon, showReceive = false, received = false }) => (
    <Card
      style={{
        background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7a45 100%)',
        color: '#fff',
        borderRadius: '8px'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
            {coupon.type === 'fixed' ? `¥${coupon.value}` : `${coupon.value}折`}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>{coupon.name}</div>
          {coupon.min_amount > 0 && (
            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
              满{coupon.min_amount}元可用
            </div>
          )}
        </div>
        {showReceive && !received && (
          <Button type="primary" size="small" onClick={() => handleReceive(coupon.id)}>
            领取
          </Button>
        )}
        {received && <Tag color="green">已领取</Tag>}
      </div>
      <div style={{ marginTop: '12px', fontSize: '12px', opacity: 0.7 }}>
        {coupon.business_domain && (
          <Tag color="blue" style={{ marginRight: '8px' }}>
            {coupon.business_domain === 'takeout' ? '外卖' :
             coupon.business_domain === 'instore' ? '到店' :
             coupon.business_domain === 'travel' ? '出行' : '旅游'}
          </Tag>
        )}
        {coupon.total_count > 0 && `剩余 ${coupon.total_count - coupon.used_count} 张`}
      </div>
    </Card>
  )

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>
            <GiftOutlined style={{ marginRight: '8px' }} />
            优惠券中心
          </h2>
          {user.role === 'admin' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
              创建优惠券
            </Button>
          )}
        </Space>
      </Card>

      <Tabs defaultActiveKey="available">
        <TabPane tab="可领取优惠券" key="available">
          {availableCoupons.length > 0 ? (
            <Row gutter={[16, 16]}>
              {availableCoupons.map(coupon => (
                <Col span={6} key={coupon.id}>
                  <CouponCard coupon={coupon} showReceive />
                </Col>
              ))}
            </Row>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无可领取的优惠券
              </div>
            </Card>
          )}
        </TabPane>
        <TabPane tab="我的优惠券" key="my">
          {myCoupons.length > 0 ? (
            <Row gutter={[16, 16]}>
              {myCoupons.map(uc => (
                <Col span={6} key={uc.id}>
                  <CouponCard coupon={uc} received />
                </Col>
              ))}
            </Row>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                暂无优惠券
              </div>
            </Card>
          )}
        </TabPane>
      </Tabs>

      <Modal
        title="创建优惠券"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={handleCreateCoupon} layout="vertical">
          <Form.Item name="name" label="优惠券名称" rules={[{ required: true }]}>
            <Input placeholder="例如: 新用户专享券" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select>
              <Option value="fixed">满减券</Option>
              <Option value="percent">折扣券</Option>
            </Select>
          </Form.Item>
          <Form.Item name="value" label="面值" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="满减券填金额，折扣券填折扣数(如8.5)" />
          </Form.Item>
          <Form.Item name="min_amount" label="最低消费金额">
            <InputNumber style={{ width: '100%' }} min={0} defaultValue={0} />
          </Form.Item>
          <Form.Item name="business_domain" label="适用业务域">
            <Select allowClear>
              <Option value="takeout">外卖</Option>
              <Option value="instore">到店</Option>
              <Option value="travel">出行</Option>
              <Option value="tourism">旅游</Option>
            </Select>
          </Form.Item>
          <Form.Item name="total_count" label="发放数量">
            <InputNumber style={{ width: '100%' }} min={0} defaultValue={0} placeholder="0表示不限制" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CouponList
