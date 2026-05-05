import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag, DatePicker, InputNumber, Card, Descriptions, Divider } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'
import { stockInApi, supplierApi, productApi } from '../../services/api'
import dayjs from 'dayjs'

const { Search } = Input
const { Option } = Select

const StockInList = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [form] = Form.useForm()
  const [searchKeyword, setSearchKeyword] = useState('')

  const statusMap = {
    draft: { label: '草稿', color: 'default' },
    completed: { label: '已完成', color: 'success' },
    cancelled: { label: '已取消', color: 'error' }
  }

  const fetchData = async (page = 1, pageSize = 10, keyword = '') => {
    setLoading(true)
    try {
      const result = await stockInApi.getStockInList({ 
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
      console.error('Fetch stock-in failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const result = await supplierApi.getSuppliers({ page: 1, page_size: 100 })
      if (result.success) {
        setSuppliers(result.data.list)
      }
    } catch (error) {
      console.error('Fetch suppliers failed:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const result = await productApi.getProducts({ page: 1, page_size: 100 })
      if (result.success) {
        setProducts(result.data.list)
      }
    } catch (error) {
      console.error('Fetch products failed:', error)
    }
  }

  useEffect(() => {
    fetchData()
    fetchSuppliers()
    fetchProducts()
  }, [])

  const handleSearch = () => {
    fetchData(1, pagination.pageSize, searchKeyword)
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({ items: [] })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    if (record.status !== 'draft') {
      message.warning('只能编辑草稿状态的入库单')
      return
    }
    setEditingItem(record)
    form.setFieldsValue({
      supplier_id: record.supplier_id,
      remark: record.remark
    })
    setModalVisible(true)
  }

  const handleView = async (record) => {
    setSelectedRecord(record)
    setDetailVisible(true)
  }

  const handleComplete = async (id) => {
    try {
      await stockInApi.completeStockIn(id)
      message.success('入库单已完成')
      fetchData(pagination.current, pagination.pageSize, searchKeyword)
    } catch (error) {
      console.error('Complete stock-in failed:', error)
    }
  }

  const handleCancel = async (id) => {
    try {
      await stockInApi.cancelStockIn(id)
      message.success('入库单已取消')
      fetchData(pagination.current, pagination.pageSize, searchKeyword)
    } catch (error) {
      console.error('Cancel stock-in failed:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setModalLoading(true)

      if (editingItem) {
        await stockInApi.updateStockIn(editingItem.id, values)
        message.success('更新成功')
      } else {
        await stockInApi.createStockIn(values)
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

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    return supplier?.supplier_name || '-'
  }

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId)
    return product?.product_name || '-'
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '入库单号',
      dataIndex: 'in_no',
      key: 'in_no'
    },
    {
      title: '供应商',
      dataIndex: 'supplier_id',
      key: 'supplier_id',
      render: (supplierId) => getSupplierName(supplierId)
    },
    {
      title: '总数量',
      dataIndex: 'total_quantity',
      key: 'total_quantity'
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `¥${amount}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const info = statusMap[status] || { label: status, color: 'default' }
        return <Tag color={info.color}>{info.label}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record)}
          >
            详情
          </Button>
          {record.status === 'draft' && (
            <>
              <Button 
                type="link" 
                icon={<EditOutlined />} 
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              <Button 
                type="link" 
                icon={<CheckOutlined />} 
                onClick={() => handleComplete(record.id)}
              >
                完成
              </Button>
              <Popconfirm
                title="确定要取消该入库单吗？"
                onConfirm={() => handleCancel(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger icon={<CloseOutlined />}>
                  取消
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">入库管理</div>
        <div className="page-description">管理商品入库操作</div>
      </div>

      <div className="table-toolbar">
        <div className="search-form">
          <Search
            placeholder="搜索入库单号"
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
            新增入库
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

      <Modal
        title={editingItem ? '编辑入库单' : '新增入库单'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={modalLoading}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          className="modal-form"
        >
          <Form.Item
            label="供应商"
            name="supplier_id"
          >
            <Select placeholder="请选择供应商">
              {suppliers.map(supplier => (
                <Select.Option key={supplier.id} value={supplier.id}>
                  {supplier.supplier_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                <Divider orientation="left">入库商品</Divider>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 16 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'product_id']}
                      rules={[{ required: true, message: '请选择商品' }]}
                      style={{ width: 200 }}
                    >
                      <Select placeholder="选择商品">
                        {products.map(product => (
                          <Select.Option key={product.id} value={product.id}>
                            {product.product_name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: '请输入数量' }]}
                      style={{ width: 120 }}
                    >
                      <InputNumber placeholder="数量" min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'unit_price']}
                      style={{ width: 120 }}
                    >
                      <InputNumber placeholder="单价" min={0} precision={2} prefix="¥" style={{ width: '100%' }} />
                    </Form.Item>
                    <Button type="dashed" onClick={() => remove(name)}>
                      删除
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加商品
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Form.Item
            label="备注"
            name="remark"
          >
            <Input.TextArea placeholder="请输入备注" rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="入库单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedRecord && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="入库单号">{selectedRecord.in_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedRecord.status]?.color}>
                  {statusMap[selectedRecord.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="供应商">{getSupplierName(selectedRecord.supplier_id)}</Descriptions.Item>
              <Descriptions.Item label="仓管员">{selectedRecord.warehouse_keeper_name}</Descriptions.Item>
              <Descriptions.Item label="总数量">{selectedRecord.total_quantity}</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{selectedRecord.total_amount}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{selectedRecord.remark || '-'}</Descriptions.Item>
            </Descriptions>
            <Divider>商品明细</Divider>
            <Table
              dataSource={selectedRecord.items || []}
              rowKey="id"
              pagination={false}
              size="small"
            >
              <Table.Column title="商品名称" dataIndex="product_id" render={(id) => getProductName(id)} />
              <Table.Column title="数量" dataIndex="quantity" />
              <Table.Column title="单价" dataIndex="unit_price" render={(price) => `¥${price}`} />
              <Table.Column title="金额" dataIndex="amount" render={(amount) => `¥${amount}`} />
            </Table>
          </>
        )}
      </Modal>
    </div>
  )
}

export default StockInList