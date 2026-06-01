import React, { useState, useEffect } from 'react'
import { Table, Button, Space, message, Modal, Form, Input, InputNumber, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, InboxOutlined, ImportOutlined, ExportOutlined } from '@ant-design/icons'
import request from '../../utils/request'

const Inventory = () => {
  const [loading, setLoading] = useState(false)
  const [inventory, setInventory] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [stockModalVisible, setStockModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [stockType, setStockType] = useState('in')
  const [selectedItem, setSelectedItem] = useState(null)
  const [form] = Form.useForm()
  const [stockForm] = Form.useForm()

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const data = await request.get('/inventory')
      setInventory(data.list || data || [])
    } catch (error) {
      message.error('获取库存列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleStockIn = (record) => {
    setSelectedItem(record)
    setStockType('in')
    stockForm.resetFields()
    setStockModalVisible(true)
  }

  const handleStockOut = (record) => {
    setSelectedItem(record)
    setStockType('out')
    stockForm.resetFields()
    setStockModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await request.delete(`/inventory/${id}`)
      message.success('删除成功')
      fetchInventory()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingItem) {
        await request.put(`/inventory/${editingItem.id}`, values)
        message.success('更新成功')
      } else {
        await request.post('/inventory', values)
        message.success('添加成功')
      }
      setModalVisible(false)
      fetchInventory()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleStockSubmit = async () => {
    try {
      const values = await stockForm.validateFields()
      if (stockType === 'in') {
        await request.post(`/inventory/${selectedItem.id}/stock-in`, values)
      } else {
        await request.post(`/inventory/${selectedItem.id}/stock-out`, values)
      }
      message.success(stockType === 'in' ? '入库成功' : '出库成功')
      setStockModalVisible(false)
      fetchInventory()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '物品名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '规格',
      dataIndex: 'specification',
      key: 'specification'
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit'
    },
    {
      title: '库存数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty, record) => (
        <span style={{ color: qty < (record.min_stock || 10) ? '#ff4d4f' : 'inherit' }}>
          {qty}
        </span>
      )
    },
    {
      title: '单价(元)',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price) => `¥${price}`
    },
    {
      title: '金额(元)',
      key: 'total_amount',
      render: (_, record) => `¥${(record.quantity * record.unit_price).toFixed(2)}`
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space className="table-actions">
          <Button type="link" size="small" icon={<ImportOutlined />} onClick={() => handleStockIn(record)}>
            入库
          </Button>
          <Button type="link" size="small" icon={<ExportOutlined />} onClick={() => handleStockOut(record)}>
            出库
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该物品？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2>库存管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增物品
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={inventory}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingItem ? '编辑物品' : '新增物品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="物品名称" rules={[{ required: true, message: '请输入物品名称' }]}>
            <Input placeholder="请输入物品名称" />
          </Form.Item>
          <Form.Item name="specification" label="规格">
            <Input placeholder="请输入规格" />
          </Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true, message: '请输入单位' }]}>
            <Input placeholder="请输入单位" />
          </Form.Item>
          <Form.Item name="unit_price" label="单价(元)" rules={[{ required: true, message: '请输入单价' }]}>
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="请输入单价" />
          </Form.Item>
          <Form.Item name="quantity" label="初始数量" rules={[{ required: true, message: '请输入初始数量' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入初始数量" />
          </Form.Item>
          <Form.Item name="min_stock" label="最低库存预警">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="低于该数量时预警" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={stockType === 'in' ? '入库登记' : '出库登记'}
        open={stockModalVisible}
        onOk={handleStockSubmit}
        onCancel={() => setStockModalVisible(false)}
        width={400}
      >
        <p style={{ marginBottom: 16 }}>
          <strong>物品：</strong>{selectedItem?.name}
        </p>
        <Form form={stockForm} layout="vertical">
          <Form.Item name="quantity" label="数量" rules={[{ required: true, message: '请输入数量' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入数量" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Inventory
