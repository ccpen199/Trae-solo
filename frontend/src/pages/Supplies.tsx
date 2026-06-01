import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Typography, InputNumber, Alert } from 'antd'
import { PlusOutlined, EditOutlined, InboxOutlined, ImportOutlined } from '@ant-design/icons'
import { supplyAPI } from '../api'

const { Title } = Typography
const { Option } = Select

const Supplies: React.FC = () => {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [stockVisible, setStockVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [form] = Form.useForm()
  const [stockForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [lowStockOnly])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await supplyAPI.list({ low_stock: lowStockOnly })
      setList(res.data)
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setCurrentItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setCurrentItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleStockIn = (record: any) => {
    setCurrentItem(record)
    stockForm.setFieldsValue({ quantity: 0 })
    setStockVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      if (currentItem) {
        await supplyAPI.update(currentItem.id, values)
        message.success('更新成功')
      } else {
        await supplyAPI.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const submitStockIn = async (values: any) => {
    try {
      await supplyAPI.updateStock(currentItem.id, values.quantity)
      message.success('入库成功')
      setStockVisible(false)
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const isLowStock = (item: any) => item.quantity <= item.min_quantity

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: '库存',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (v: number, record: any) => (
        <Space>
          <span style={{ color: isLowStock(record) ? '#ff4d4f' : undefined }}>{v}</span>
          {isLowStock(record) && <Tag color="red">库存不足</Tag>}
        </Space>
      ),
    },
    { title: '最低库存', dataIndex: 'min_quantity', key: 'min_quantity', width: 100 },
    { title: '单价', dataIndex: 'price', key: 'price', render: (v: number) => `¥${v}` },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button size="small" type="link" icon={<ImportOutlined />} onClick={() => handleStockIn(record)}>入库</Button>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>耗材库存</Title>
        <Space>
          <Button onClick={() => setLowStockOnly(!lowStockOnly)} type={lowStockOnly ? 'primary' : 'default'}>
            {lowStockOnly ? '显示全部' : '仅看库存不足'}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增耗材
          </Button>
        </Space>
      </div>

      {lowStockOnly && list.some(isLowStock) && (
        <Alert
          message="库存预警"
          description={`有 ${list.filter(isLowStock).length} 种耗材库存不足，请及时补货`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        loading={loading}
        dataSource={list}
        columns={columns}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title={currentItem ? '编辑耗材' : '新增耗材'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="编码">
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select>
              <Option value="耗材">耗材</Option>
              <Option value="材料">材料</Option>
              <Option value="药品">药品</Option>
              <Option value="工具">工具</Option>
            </Select>
          </Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
            <Input placeholder="如：个、支、副" />
          </Form.Item>
          <Form.Item name="quantity" label="初始库存">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="min_quantity" label="最低库存预警">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="price" label="单价" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="耗材入库"
        open={stockVisible}
        onCancel={() => setStockVisible(false)}
        footer={null}
      >
        <p>当前耗材：<strong>{currentItem?.name}</strong></p>
        <p>当前库存：<strong>{currentItem?.quantity} {currentItem?.unit}</strong></p>
        <Form form={stockForm} layout="vertical" onFinish={submitStockIn}>
          <Form.Item name="quantity" label="入库数量" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setStockVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认入库</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Supplies
