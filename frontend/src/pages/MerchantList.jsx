import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Select, Input, Space, Pagination, message, Modal, Form } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../utils/api'

const { Option } = Select
const { Search } = Input

const MerchantList = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [merchants, setMerchants] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    business_domain: searchParams.get('business_domain') || '',
    keyword: searchParams.get('keyword') || ''
  })
  const [registerModalVisible, setRegisterModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadMerchants()
  }, [pagination.current, filters])

  const loadMerchants = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      }
      if (!params.business_domain) delete params.business_domain
      if (!params.keyword) delete params.keyword

      const res = await api.get('/merchants', { params })
      setMerchants(res.data.list)
      setPagination(prev => ({ ...prev, total: res.data.total }))
    } catch (error) {
      message.error('加载商户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }))
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleDomainChange = (value) => {
    setFilters(prev => ({ ...prev, business_domain: value }))
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleRegisterMerchant = async (values) => {
    try {
      await api.post('/merchants', values)
      message.success('商户入驻申请已提交，等待审核')
      setRegisterModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error(error.response?.data?.error || '提交失败')
    }
  }

  return (
    <div>
      <Card style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Select
            placeholder="选择业务域"
            style={{ width: 150 }}
            value={filters.business_domain || undefined}
            onChange={handleDomainChange}
            allowClear
          >
            <Option value="takeout">美食外卖</Option>
            <Option value="instore">到店消费</Option>
            <Option value="travel">出行服务</Option>
            <Option value="tourism">旅游酒店</Option>
          </Select>
          <Search
            placeholder="搜索商户名称"
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
            defaultValue={filters.keyword}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setRegisterModalVisible(true)}>
            商户入驻
          </Button>
        </Space>
      </Card>

      {merchants.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            {merchants.map(merchant => (
              <Col span={6} key={merchant.id}>
                <Card
                  hoverable
                  loading={loading}
                  cover={
                    <div style={{ height: 150, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                      🏪
                    </div>
                  }
                  actions={[
                    <Button type="link" onClick={() => navigate(`/merchants/${merchant.id}`)}>
                      进入店铺
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={merchant.name}
                    description={
                      <div>
                        <div>{merchant.business_domain === 'takeout' ? '🍔 外卖' : 
                              merchant.business_domain === 'instore' ? '🏬 到店' :
                              merchant.business_domain === 'travel' ? '🚗 出行' : '🏨 旅游'}</div>
                        <div style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                          {merchant.address || '地址待更新'}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
            />
          </div>
        </>
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <p>暂无商户</p>
            <Button type="primary" style={{ marginTop: '16px' }} onClick={() => setRegisterModalVisible(true)}>
              立即申请入驻
            </Button>
          </div>
        </Card>
      )}

      <Modal
        title="商户入驻申请"
        open={registerModalVisible}
        onCancel={() => setRegisterModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleRegisterMerchant} layout="vertical">
          <Form.Item name="name" label="商户名称" rules={[{ required: true }]}>
            <Input placeholder="请输入商户名称" />
          </Form.Item>
          <Form.Item name="business_domain" label="业务域" rules={[{ required: true }]}>
            <Select>
              <Option value="takeout">美食外卖</Option>
              <Option value="instore">到店消费</Option>
              <Option value="travel">出行服务</Option>
              <Option value="tourism">旅游酒店</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="商户描述">
            <Input.TextArea rows={3} placeholder="请输入商户描述" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入商户地址" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="qualification" label="资质材料">
            <Input.TextArea rows={2} placeholder="请输入营业执照等资质信息" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>提交申请</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MerchantList
