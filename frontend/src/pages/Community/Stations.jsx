import React, { useState, useEffect } from 'react'
import { Card, List, Button, Tag, Input, Select, Modal, Form, message, Spin, Rate, Avatar, Descriptions } from 'antd'
import { ShopOutlined, EnvironmentOutlined, PhoneOutlined, ClockCircleOutlined, StarOutlined, PlusOutlined } from '@ant-design/icons'
import { getStations, applyStation } from '../../api/community'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

function Stations() {
  const [loading, setLoading] = useState(false)
  const [stations, setStations] = useState([])
  const [applyModal, setApplyModal] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [selectedStation, setSelectedStation] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [form] = Form.useForm()

  useEffect(() => {
    fetchStations()
  }, [])

  const fetchStations = async () => {
    setLoading(true)
    try {
      const result = await getStations()
      setStations(Array.isArray(result) ? result : result?.list || [])
    } catch (error) {
      message.error('获取驿站列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (values) => {
    try {
      await applyStation(values)
      message.success('入驻申请提交成功，请等待审核')
      setApplyModal(false)
      form.resetFields()
    } catch (error) {
      message.error('申请提交失败')
    }
  }

  const showDetail = (station) => {
    setSelectedStation(station)
    setDetailModal(true)
  }

  const filteredStations = stations.filter(station => {
    const matchType = filterType === 'all' || station.type === filterType
    const matchSearch = !searchText || 
      station.name?.includes(searchText) || 
      station.address?.includes(searchText)
    return matchType && matchSearch
  })

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>驿站列表</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setApplyModal(true)}>
          申请入驻
        </Button>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Select
            defaultValue="all"
            style={{ width: 150 }}
            onChange={setFilterType}
          >
            <Option value="all">全部类型</Option>
            <Option value="community">社区驿站</Option>
            <Option value="campus">校园驿站</Option>
            <Option value="business">商务驿站</Option>
            <Option value="smart">智能柜</Option>
          </Select>
          <Input.Search
            placeholder="搜索驿站名称或地址"
            allowClear
            style={{ width: 300 }}
            onSearch={(value) => setSearchText(value)}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </Card>

      <Spin spinning={loading}>
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, lg: 3 }}
          dataSource={filteredStations.length > 0 ? filteredStations : [
            {
              id: 1,
              name: '阳光社区驿站',
              address: '北京市朝阳区阳光路123号',
              phone: '010-12345678',
              hours: '08:00-22:00',
              type: 'community',
              rating: 4.8,
              capacity: 200,
              available: 156,
              services: ['代收', '代寄', '暂存'],
            },
            {
              id: 2,
              name: '清华校园驿站',
              address: '北京市海淀区清华大学校内',
              phone: '010-87654321',
              hours: '09:00-21:00',
              type: 'campus',
              rating: 4.6,
              capacity: 500,
              available: 320,
              services: ['代收', '代寄', '冷链'],
            },
            {
              id: 3,
              name: 'CBD商务驿站',
              address: '北京市朝阳区建国路88号',
              phone: '010-55667788',
              hours: '07:30-20:30',
              type: 'business',
              rating: 4.9,
              capacity: 300,
              available: 89,
              services: ['代收', '代寄', '加急', '国际'],
            },
          ]}
          renderItem={(item) => (
            <List.Item>
              <Card
                hoverable
                className="station-card"
                onClick={() => showDetail(item)}
                actions={[
                  <span key="rating">
                    <StarOutlined style={{ color: '#faad14' }} /> {item.rating}
                  </span>
                ]}
              >
                <Card.Meta
                  avatar={<Avatar icon={<ShopOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{item.name}</span>
                      <Tag color={item.type === 'community' ? 'green' : item.type === 'campus' ? 'blue' : item.type === 'business' ? 'purple' : 'orange'}>
                        {item.type === 'community' ? '社区' : item.type === 'campus' ? '校园' : item.type === 'business' ? '商务' : '智能柜'}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <EnvironmentOutlined style={{ color: '#ff4d4f' }} />
                        <span style={{ fontSize: 12 }}>{item.address}</span>
                      </p>
                      <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <PhoneOutlined style={{ color: '#1890ff' }} />
                        <span style={{ fontSize: 12 }}>{item.phone}</span>
                      </p>
                      <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ClockCircleOutlined style={{ color: '#52c41a' }} />
                        <span style={{ fontSize: 12 }}>{item.hours}</span>
                      </p>
                      <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {item.services?.map((svc, idx) => (
                          <Tag key={idx} color="blue" style={{ fontSize: 11, margin: 0 }}>
                            {svc}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      </Spin>

      <Modal
        title="驿站详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>关闭</Button>,
          <Button key="navigate" type="primary">导航前往</Button>,
        ]}
        width={600}
      >
        {selectedStation && (
          <>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="驿站名称" span={2}>
                {selectedStation.name}
              </Descriptions.Item>
              <Descriptions.Item label="驿站类型">
                <Tag color={selectedStation.type === 'community' ? 'green' : selectedStation.type === 'campus' ? 'blue' : 'purple'}>
                  {selectedStation.type === 'community' ? '社区驿站' : selectedStation.type === 'campus' ? '校园驿站' : '商务驿站'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="评分">
                <Rate disabled defaultValue={selectedStation.rating} /> {selectedStation.rating}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话" span={2}>
                {selectedStation.phone}
              </Descriptions.Item>
              <Descriptions.Item label="详细地址" span={2}>
                {selectedStation.address}
              </Descriptions.Item>
              <Descriptions.Item label="营业时间">
                {selectedStation.hours}
              </Descriptions.Item>
              <Descriptions.Item label="柜机容量">
                {selectedStation.available} / {selectedStation.capacity} 格口可用
              </Descriptions.Item>
            </Descriptions>

            <Card title="提供服务" size="small">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedStation.services?.map((svc, idx) => (
                  <Tag key={idx} color="blue" style={{ padding: '4px 12px' }}>
                    {svc}
                  </Tag>
                ))}
              </div>
            </Card>
          </>
        )}
      </Modal>

      <Modal
        title="驿站入驻申请"
        open={applyModal}
        onCancel={() => setApplyModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleApply}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="驿站名称"
                rules={[{ required: true, message: '请输入驿站名称' }]}
              >
                <Input placeholder="请输入驿站名称" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="type"
                label="驿站类型"
                rules={[{ required: true, message: '请选择驿站类型' }]}
              >
                <Select placeholder="请选择驿站类型">
                  <Option value="community">社区驿站</Option>
                  <Option value="campus">校园驿站</Option>
                  <Option value="business">商务驿站</Option>
                  <Option value="smart">智能柜</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="详细地址"
            rules={[{ required: true, message: '请输入详细地址' }]}
          >
            <TextArea rows={2} placeholder="请输入详细地址" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="contactName"
                label="联系人姓名"
                rules={[{ required: true, message: '请输入联系人姓名' }]}
              >
                <Input placeholder="请输入联系人姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="contactPhone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="hours"
                label="营业时间"
                rules={[{ required: true, message: '请输入营业时间' }]}
              >
                <Input placeholder="如：08:00-22:00" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="capacity"
                label="柜机容量"
                rules={[{ required: true, message: '请输入柜机容量' }]}
              >
                <Input type="number" placeholder="请输入柜机容量" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="services"
            label="提供服务"
            rules={[{ required: true, message: '请选择提供的服务' }]}
          >
            <Select mode="multiple" placeholder="请选择提供的服务">
              <Option value="代收">代收包裹</Option>
              <Option value="代寄">代寄包裹</Option>
              <Option value="暂存">暂存服务</Option>
              <Option value="冷链">冷链服务</Option>
              <Option value="加急">加急服务</Option>
              <Option value="international">国际件</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="驿站简介"
          >
            <TextArea rows={3} placeholder="请简要介绍驿站情况" />
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

export default Stations
