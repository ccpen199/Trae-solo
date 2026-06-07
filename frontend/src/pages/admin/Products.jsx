import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, message, Button, Modal, Form, Input, InputNumber, Select } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import api from '../../utils/api'

const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const data = await api.get('/mall/products')
      setProducts(data.products)
    } catch (error) {
      message.error('获取商品列表失败')
    }
  }

  const handleAdd = async (values) => {
    setLoading(true)
    try {
      await api.post('/admin/products', values, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
      })
      message.success('添加成功')
      setModalVisible(false)
      form.resetFields()
      fetchProducts()
    } catch (error) {
      message.error('添加失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (v) => {
        const names = { phone_card: '话费', membership: '会员', electricity: '电费', shopping: '购物', catering: '餐饮' }
        return <Tag>{names[v] || v}</Tag>
      }
    },
    { title: '积分', dataIndex: 'points', key: 'points', render: (v) => <Tag color="orange">{v}</Tag> },
    { title: '库存', dataIndex: 'stock', key: 'stock' },
    { title: '每日限兑', dataIndex: 'daily_limit', key: 'daily_limit' },
    { title: '等级限制', dataIndex: 'user_level_limit', key: 'user_level_limit' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '上架' : '下架'}</Tag>
    }
  ]

  return (
    <Card
      title="商品管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          添加商品
        </Button>
      }
    >
      <Table columns={columns} dataSource={products} rowKey="id" />

      <Modal
        title="添加商品"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="商品描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="phone_card">话费充值</Select.Option>
              <Select.Option value="membership">视频会员</Select.Option>
              <Select.Option value="electricity">电费红包</Select.Option>
              <Select.Option value="shopping">购物卡券</Select.Option>
              <Select.Option value="catering">餐饮美食</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="points" label="所需积分" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="stock" label="库存数量" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="daily_limit" label="每日限兑" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="user_level_limit" label="等级限制" initialValue={1}>
            <Select>
              <Select.Option value={1}>等级1</Select.Option>
              <Select.Option value={2}>等级2</Select.Option>
              <Select.Option value={3}>等级3</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default Products
