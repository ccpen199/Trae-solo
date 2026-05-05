import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Card, Tag, InputNumber, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { productApi } from '../../services/api'

const { Search } = Input

const ProductList = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [types, setTypes] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [modalVisible, setModalVisible] = useState(false)
  const [typeModalVisible, setTypeModalVisible] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const [typeForm] = Form.useForm()
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchData = async (page = 1, pageSize = 10, keyword = '') => {
    setLoading(true)
    try {
      const result = await productApi.getProducts({ 
        page, 
        page_size: pageSize,
        keyword: keyword || undefined
      })
      if (result.success) {
        setData(result.data.list)
        setPagination({
          current: result.data.pagination.page,
          pageSize: result.data.pagination.page_size,
          total: result.data.pagination.total
        })
      }
    } catch (error) {
      console.error('Fetch products failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTypes = async () => {
    try {
      const result = await productApi.getAllProductTypes()
      if (result.success) {
        setTypes(result.data)
      }
    } catch (error) {
      console.error('Fetch types failed:', error)
    }
  }

  useEffect(() => {
    fetchData()
    fetchTypes()
  }, [])

  const handleSearch = () => {
    fetchData(1, pagination.pageSize, searchKeyword)
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue({
      product_code: record.product_code,
      product_name: record.product_name,
      type_id: record.type_id,
      unit: record.unit,
      specification: record.specification,
      purchase_price: record.purchase_price,
      sale_price: record.sale_price,
      min_stock: record.min_stock,
      max_stock: record.max_stock,
      remark: record.remark
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await productApi.deleteProduct(id)
      message.success('删除成功')
      fetchData(pagination.current, pagination.pageSize, searchKeyword)
    } catch (error) {
      console.error('Delete product failed:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setModalLoading(true)

      if (editingItem) {
        await productApi.updateProduct(editingItem.id, values)
        message.success('更新成功')
      } else {
        await productApi.createProduct(values)
        message.success('创建成功')
      }

      setModalVisible(false)
      fetchData(pagination.current, pagination.pageSize, searchKeyword)
    } catch (error) {
      console.error('Submit failed:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const handleAddType = () => {
    typeForm.resetFields()
    setTypeModalVisible(true)
  }

  const handleSubmitType = async () => {
    try {
      const values = await typeForm.validateFields()
      setModalLoading(true)
      await productApi.createProductType(values)
      message.success('商品类型创建成功')
      setTypeModalVisible(false)
      fetchTypes()
    } catch (error) {
      console.error('Submit type failed:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const handleDeleteType = async (id) => {
    try {
      await productApi.deleteProductType(id)
      message.success('删除成功')
      fetchTypes()
    } catch (error) {
      console.error('Delete type failed:', error)
    }
  }

  const getTypeName = (typeId) => {
    const type = types.find(t => t.id === typeId)
    return type?.type_name || '-'
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '商品编码',
      dataIndex: 'product_code',
      key: 'product_code'
    },
    {
      title: '商品名称',
      dataIndex: 'product_name',
      key: 'product_name'
    },
    {
      title: '商品类型',
      dataIndex: 'type_id',
      key: 'type_id',
      render: (typeId) => getTypeName(typeId)
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit'
    },
    {
      title: '采购价',
      dataIndex: 'purchase_price',
      key: 'purchase_price',
      render: (price) => `¥${price}`
    },
    {
      title: '销售价',
      dataIndex: 'sale_price',
      key: 'sale_price',
      render: (price) => `¥${price}`
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该商品吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const typeColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '类型名称',
      dataIndex: 'type_name',
      key: 'type_name'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '创建人',
      dataIndex: 'created_by_name',
      key: 'created_by_name'
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Popconfirm
          title="确定要删除该商品类型吗？"
          onConfirm={() => handleDeleteType(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      )
    }
  ]

  const tabItems = [
    {
      key: 'products',
      label: '商品列表',
      children: (
        <>
          <div className="table-toolbar">
            <div className="search-form">
              <Search
                placeholder="搜索商品编码或名称"
                allowClear
                enterButton={<span><SearchOutlined /> 搜索</span>}
                style={{ width: 300 }}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onSearch={handleSearch}
              />
            </div>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
                刷新
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增商品
              </Button>
            </Space>
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={data}
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              ...pagination,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => fetchData(page, pageSize, searchKeyword)
            }}
          />
        </>
      )
    },
    {
      key: 'types',
      label: '商品类型',
      children: (
        <>
          <div className="table-toolbar">
            <div></div>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchTypes}>
                刷新
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddType}>
                新增类型
              </Button>
            </Space>
          </div>

          <Table
            rowKey="id"
            columns={typeColumns}
            dataSource={types}
            pagination={false}
          />
        </>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">商品管理</div>
        <div className="page-description">管理商品信息和商品类型</div>
      </div>

      <Tabs defaultActiveKey="products" items={tabItems} />

      <Modal
        title={editingItem ? '编辑商品' : '新增商品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={modalLoading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          className="modal-form"
        >
          <Form.Item
            label="商品编码"
            name="product_code"
            rules={[{ required: true, message: '请输入商品编码' }]}
          >
            <Input placeholder="请输入商品编码" />
          </Form.Item>
          <Form.Item
            label="商品名称"
            name="product_name"
            rules={[{ required: true, message: '请输入商品名称' }]}
          >
            <Input placeholder="请输入商品名称" />
          </Form.Item>
          <Form.Item
            label="商品类型"
            name="type_id"
            rules={[{ required: true, message: '请选择商品类型' }]}
          >
            <Select placeholder="请选择商品类型">
              {types.map(type => (
                <Select.Option key={type.id} value={type.id}>
                  {type.type_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="单位"
            name="unit"
          >
            <Input placeholder="如：件、个、箱、kg等" />
          </Form.Item>
          <Form.Item
            label="规格"
            name="specification"
          >
            <Input placeholder="请输入规格" />
          </Form.Item>
          <Form.Item
            label="采购价"
            name="purchase_price"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入采购价"
              min={0}
              precision={2}
              prefix="¥"
            />
          </Form.Item>
          <Form.Item
            label="销售价"
            name="sale_price"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入销售价"
              min={0}
              precision={2}
              prefix="¥"
            />
          </Form.Item>
          <Form.Item
            label="最低库存预警"
            name="min_stock"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入最低库存"
              min={0}
            />
          </Form.Item>
          <Form.Item
            label="最高库存预警"
            name="max_stock"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入最高库存"
              min={0}
            />
          </Form.Item>
          <Form.Item
            label="备注"
            name="remark"
          >
            <Input.TextArea placeholder="请输入备注" rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增商品类型"
        open={typeModalVisible}
        onOk={handleSubmitType}
        onCancel={() => setTypeModalVisible(false)}
        confirmLoading={modalLoading}
      >
        <Form
          form={typeForm}
          layout="vertical"
          className="modal-form"
        >
          <Form.Item
            label="类型名称"
            name="type_name"
            rules={[{ required: true, message: '请输入类型名称' }]}
          >
            <Input placeholder="请输入类型名称" />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea placeholder="请输入描述" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProductList