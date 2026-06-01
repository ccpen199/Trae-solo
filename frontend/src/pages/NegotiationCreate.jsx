import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
  message,
  Divider,
  List,
  Tag
} from 'antd'
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE = '/api'

const NegotiationCreate = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [users, setUsers] = useState([])
  const [priceHistory, setPriceHistory] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [details, setDetails] = useState([])

  useEffect(() => {
    loadOptions()
  }, [])

  useEffect(() => {
    if (selectedCategory && selectedSupplier) {
      loadPriceHistory()
    }
  }, [selectedCategory, selectedSupplier])

  const loadOptions = async () => {
    try {
      const [catRes, supRes, userRes] = await Promise.all([
        axios.get(`${API_BASE}/categories`),
        axios.get(`${API_BASE}/suppliers`),
        axios.get(`${API_BASE}/users`)
      ])
      setCategories(catRes.data.data || [])
      setSuppliers(supRes.data.data || [])
      setUsers(userRes.data.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const loadPriceHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/price-history`, {
        params: { category_id: selectedCategory, supplier_id: selectedSupplier }
      })
      setPriceHistory(res.data.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const addDetail = () => {
    const newDetail = {
      key: Date.now().toString(),
      item_name: '',
      spec: '',
      unit: '台',
      quantity: 1,
      quoted_price: 0,
      target_price: 0
    }
    setDetails([...details, newDetail])
  }

  const removeDetail = (key) => {
    setDetails(details.filter(d => d.key !== key))
  }

  const updateDetail = (key, field, value) => {
    setDetails(details.map(d => {
      if (d.key === key) {
        const updated = { ...d, [field]: value }
        if (field === 'quantity' || field === 'quoted_price') {
          updated.quoted_amount = updated.quantity * updated.quoted_price
        }
        return updated
      }
      return d
    }))
  }

  const handleSubmit = async (values) => {
    if (details.length === 0) {
      message.warning('请至少添加一条明细')
      return
    }

    const emptyItems = details.filter(d => !d.item_name.trim())
    if (emptyItems.length > 0) {
      message.warning('请填写所有明细的品名')
      return
    }

    try {
      const supplier = suppliers.find(s => s.id === values.supplier_id)
      const totalAmount = details.reduce((sum, d) => sum + (d.quantity * d.quoted_price), 0)
      const avgTargetPrice = details.length > 0
        ? details.reduce((sum, d) => sum + (d.target_price || d.quoted_price * 0.95), 0) / details.length
        : values.target_price

      const res = await axios.post(`${API_BASE}/negotiations`, {
        ...values,
        supplier_name: supplier?.name,
        expected_amount: totalAmount,
        target_price: avgTargetPrice,
        created_by: 'user_004',
        creator_name: '张三',
        details: details.map(d => ({
          item_name: d.item_name,
          spec: d.spec,
          unit: d.unit,
          quantity: d.quantity,
          quoted_price: d.quoted_price,
          quoted_amount: d.quantity * d.quoted_price,
          target_price: d.target_price
        }))
      })

      message.success('创建成功')
      navigate(`/negotiation/${res.data.data.id}`)
    } catch (e) {
      message.error('创建失败: ' + (e.response?.data?.error || e.message))
    }
  }

  const totalAmount = details.reduce((sum, d) => sum + (d.quantity * d.quoted_price), 0)

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/negotiations')}>
            返回列表
          </Button>
          <h1 className="page-title">新建谈判项目</h1>
        </Space>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ priority: 'medium', owner_id: 'user_004' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="title" label="标题" rules={[{ required: true }]}>
                <Input placeholder="请输入谈判项目标题" size="large" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="category_id" label="采购品类" rules={[{ required: true }]}>
                <Select
                  placeholder="选择品类"
                  showSearch
                  optionFilterProp="children"
                  onChange={setSelectedCategory}
                  options={categories.map(c => ({ value: c.id, label: c.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="supplier_id" label="供应商" rules={[{ required: true }]}>
                <Select
                  placeholder="选择供应商"
                  showSearch
                  optionFilterProp="children"
                  onChange={setSelectedSupplier}
                  options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="priority" label="优先级">
                <Select
                  options={[
                    { value: 'high', label: <Tag color="red">高</Tag> },
                    { value: 'medium', label: <Tag color="orange">中</Tag> },
                    { value: 'low', label: <Tag color="green">低</Tag> }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="owner_id" label="负责人">
                <Select
                  options={users.map(u => ({ value: u.id, label: u.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="target_price" label="目标单价参考">
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="可选，明细中可单独设置"
                  formatter={v => v ? `¥${v}` : ''}
                  parser={v => v?.replace(/\¥/g, '')}
                />
              </Form.Item>
            </Col>
          </Row>

          {priceHistory.length > 0 && (
            <Card
              type="inner"
              title="历史价格参考"
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Row gutter={16}>
                {priceHistory.slice(0, 4).map(item => (
                  <Col span={6} key={item.id}>
                    <div style={{ padding: '12px', background: '#fafafa', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{item.item_name}</div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{item.spec}</div>
                      <div style={{ color: '#1890ff', fontSize: 18, fontWeight: 'bold' }}>¥{item.price.toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{item.effective_date}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          <Divider orientation="left">谈判明细</Divider>

          <div style={{ marginBottom: 16 }}>
            <Button type="dashed" icon={<PlusOutlined />} onClick={addDetail} block>
              添加明细
            </Button>
          </div>

          <List
            dataSource={details}
            locale={{ emptyText: '暂无明细，点击上方按钮添加' }}
            renderItem={item => (
              <Card
                size="small"
                style={{ marginBottom: 12 }}
                extra={
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeDetail(item.key)}
                  />
                }
              >
                <Row gutter={16} align="middle">
                  <Col span={5}>
                    <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>品名</div>
                    <Input
                      placeholder="输入品名"
                      value={item.item_name}
                      onChange={e => updateDetail(item.key, 'item_name', e.target.value)}
                    />
                  </Col>
                  <Col span={5}>
                    <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>规格</div>
                    <Input
                      placeholder="输入规格"
                      value={item.spec}
                      onChange={e => updateDetail(item.key, 'spec', e.target.value)}
                    />
                  </Col>
                  <Col span={3}>
                    <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>单位</div>
                    <Select
                      value={item.unit}
                      onChange={v => updateDetail(item.key, 'unit', v)}
                      options={[
                        { value: '台', label: '台' },
                        { value: '套', label: '套' },
                        { value: '个', label: '个' },
                        { value: '月', label: '月' },
                        { value: '年', label: '年' }
                      ]}
                    />
                  </Col>
                  <Col span={3}>
                    <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>数量</div>
                    <InputNumber
                      min={1}
                      value={item.quantity}
                      onChange={v => updateDetail(item.key, 'quantity', v || 1)}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={4}>
                    <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>报价单价</div>
                    <InputNumber
                      min={0}
                      value={item.quoted_price}
                      onChange={v => updateDetail(item.key, 'quoted_price', v || 0)}
                      style={{ width: '100%' }}
                      formatter={v => `¥${v}`}
                      parser={v => v.replace(/\¥/g, '')}
                    />
                  </Col>
                  <Col span={4}>
                    <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>目标价</div>
                    <InputNumber
                      min={0}
                      value={item.target_price}
                      onChange={v => updateDetail(item.key, 'target_price', v || 0)}
                      style={{ width: '100%' }}
                      formatter={v => `¥${v}`}
                      parser={v => v.replace(/\¥/g, '')}
                    />
                  </Col>
                  <Col span={3}>
                    <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>小计</div>
                    <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1890ff' }}>
                      ¥{(item.quantity * item.quoted_price).toLocaleString()}
                    </div>
                  </Col>
                </Row>
              </Card>
            )}
          />

          {details.length > 0 && (
            <div style={{ textAlign: 'right', margin: '24px 0', padding: '16px', background: '#f6ffed', borderRadius: '8px' }}>
              <span style={{ fontSize: 16 }}>总金额: </span>
              <span style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                ¥{totalAmount.toLocaleString()}
              </span>
            </div>
          )}

          <div className="form-footer">
            <Space>
              <Button onClick={() => navigate('/negotiations')}>取消</Button>
              <Button type="primary" htmlType="submit" size="large">
                创建并保存
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default NegotiationCreate
