import React, { useState, useEffect } from 'react'
import { Card, Button, Tag, Row, Col, Spin, message, Input, Select } from 'antd'
import { ShoppingCartOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import request from '../../utils/request'
import { RISK_LEVEL_LABELS, RISK_LEVEL_COLORS, SERVICE_CATEGORIES } from '../../utils/constants'

const { Search } = Input
const { Option } = Select

const ServiceList = () => {
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState([])
  const [filteredServices, setFilteredServices] = useState([])
  const [searchText, setSearchText] = useState('')
  const [category, setCategory] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    let filtered = services
    if (searchText) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchText.toLowerCase()) ||
        s.description.toLowerCase().includes(searchText.toLowerCase())
      )
    }
    if (category) {
      filtered = filtered.filter(s => s.category === category)
    }
    setFilteredServices(filtered)
  }, [searchText, category, services])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const data = await request.get('/services')
      setServices(data.list || data || [])
      setFilteredServices(data.list || data || [])
    } catch (error) {
      message.error('获取服务列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOrder = (service) => {
    navigate('/order/create', { state: { service } })
  }

  return (
    <div>
      <div className="page-header">
        <h2>服务项目</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select placeholder="选择分类" style={{ width: 150 }} allowClear onChange={setCategory}>
            {SERVICE_CATEGORIES.map(cat => (
              <Option key={cat.value} value={cat.value}>{cat.label}</Option>
            ))}
          </Select>
          <Search placeholder="搜索服务" allowClear style={{ width: 250 }} prefix={<SearchOutlined />} onSearch={setSearchText} onChange={(e) => setSearchText(e.target.value)} />
        </div>
      </div>
      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          {filteredServices.map((service) => (
            <Col xs={24} sm={12} lg={8} key={service.id}>
              <Card
                hoverable
                cover={<div style={{ height: 160, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 48 }}>{service.name?.charAt(0) || '服'}</div>}
                actions={[
                  <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => handleOrder(service)} block>立即下单</Button>
                ]}
              >
                <Card.Meta
                  title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{service.name}</span><Tag color={RISK_LEVEL_COLORS[service.risk_level]}>{RISK_LEVEL_LABELS[service.risk_level]}</Tag></div>}
                  description={<div><p style={{ color: '#666', marginBottom: 8 }}>{service.description}</p><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#666' }}>时长: {service.duration}分钟</span><span style={{ color: '#f5222d', fontWeight: 'bold', fontSize: 18 }}>¥{service.price}</span></div></div>}
                />
              </Card>
            </Col>
          ))}
        </Row>
        {!loading && filteredServices.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>暂无服务项目</div>
        )}
      </Spin>
    </div>
  )
}

export default ServiceList
