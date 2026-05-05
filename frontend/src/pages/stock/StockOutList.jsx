import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm, Tag, InputNumber, Descriptions, Divider } from 'antd'
import { PlusOutlined, EditOutlined, ReloadOutlined, SearchOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'
import { stockOutApi, productApi } from '../../services/api'

const { Search } = Input

const StockOutList = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
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
      const result = await stockOutApi.getStockOutList({ 
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
      console.error('Fetch stock-out failed:', error)
    } finally {
      setLoading(false)
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
      message.warning('只能编辑草稿状态的出库单')
      return
    }
    setEditingItem(record)
    form.setFieldsValue({
      receiver: record.receiver,
      phone: record.phone,
      address: record.address,
      remark: record.remark
    })
    setModalVisible(true)
  }

  const handleView = (record) => {
    setSelectedRecord(record)
    setDetailVisible(true)
  }

  const handleComplete = async (id) => {
    try {
      await stockOutApi.completeStockOut(id)
      message.success('出库单已完成')
      fetchData(pagination.current, pagination.pageSize, searchKeyword)
    } catch (error) {
      console.error('Complete stock-out failed:', error)
    }
  }

  const handleCancel = async (id) => {
    try {
      await stockOutApi.cancelStockOut(id)
      message.success('出库单已取消')
      fetchData(pagination.current, pagination.pageSize, searchKeyword)
    } catch (error) {
      console.error('Cancel stock-out failed:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setModalLoading(true)

      if (editingItem) {
        await stockOutApi.updateStockOut(editingItem.id, values)
        message.success('更新成功')
      } else {
        await stockOutApi.createStockOut(values)
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
      title: '出库单号',
      dataIndex: 'out_no',
      key: 'out_no'
    },
    {
      title: '收货人',
      dataIndex: 'receiver',
      key: 'receiver'
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone'
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
                title="确定要取消该出库单吗？"
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
        <div className="page-title">出库管理</div>
        <div className="page-description">管理商品出库操作</div>
      </div>

      <div className="table-toolbar">
        <div className="search-form">
          <Search
            placeholder="搜索出库单号"
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
            新增出库
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
        title={editingItem ? '编辑出库单' : '新增出库单'}
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
            label="收货人"
            name="receiver"
            rules={[{ required: true, message: '请输入收货人' }]}
          >
            <Input placeholder="请输入收货人" />
          </Form.Item>
          <Form.Item
            label="联系电话"
            name="phone"
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item
            label="收货地址"
            name="address"
          >
            <Input.TextArea placeholder="请输入收货地址" rows={2} />
          </Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                <Divider orientation="left">出库商品</Divider>
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
        title="出库单详情"
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
              <Descriptions.Item label="出库单号">{selectedRecord.out_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedRecord.status]?.color}>
                  {statusMap[selectedRecord.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="收货人">{selectedRecord.receiver}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedRecord.phone}</Descriptions.Item>
              <Descriptions.Item label="总数量">{selectedRecord.total_quantity}</Descriptions.Item>
              <Descriptions.Item label="总金额">¥{selectedRecord.total_amount}</Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{selectedRecord.address || '-'}</Descriptions.Item>
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

export default StockOutList