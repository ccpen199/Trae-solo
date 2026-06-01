import { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker, 
  Tag, 
  Card,
  App,
  Descriptions,
  Row,
  Col,
  Divider,
  Alert,
  message as antdMessage
} from 'antd'
import { PlusOutlined, EyeOutlined, CheckOutlined, StopOutlined, DeleteOutlined, MinusCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { orderApi, creditApi, farmerApi, commonApi } from '../services/api'
import type { Order, OrderItem, Farmer, Store, Product } from '../types'

const { Option } = Select

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [availableCredits, setAvailableCredits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [selectedFarmer, setSelectedFarmer] = useState<number | null>(null)
  const [form] = Form.useForm()
  const { message, confirm } = App.useApp()

  useEffect(() => {
    loadData()
    loadFarmers()
    loadStores()
    loadProducts()
  }, [page, pageSize, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (statusFilter) params.status = statusFilter
      const res = await orderApi.list(params)
      if (res.data.success) {
        setOrders(res.data.data)
        setTotal(res.data.total || 0)
      }
    } catch (error) {
      message.error('加载订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  const loadFarmers = async () => {
    try {
      const res = await farmerApi.list({ pageSize: 1000 })
      if (res.data.success) {
        setFarmers(res.data.data)
      }
    } catch (error) {}
  }

  const loadStores = async () => {
    try {
      const res = await commonApi.getStores()
      if (res.data.success) {
        setStores(res.data.data)
      }
    } catch (error) {}
  }

  const loadProducts = async () => {
    try {
      const res = await commonApi.getProducts({ pageSize: 1000 } as any)
      if (res.data.success) {
        setProducts(res.data.data)
      }
    } catch (error) {}
  }

  const handleFarmerChange = async (farmerId: number) => {
    setSelectedFarmer(farmerId)
    try {
      const res = await creditApi.getAvailable(farmerId)
      if (res.data.success) {
        setAvailableCredits(res.data.data)
      }
    } catch (error) {}
  }

  const handleAdd = () => {
    setCurrentOrder(null)
    setAvailableCredits([])
    setSelectedFarmer(null)
    form.resetFields()
    form.setFieldsValue({ items: [{ product_id: null, product_name: '', quantity: 0, unit_price: 0, subtotal: 0 }] })
    setModalVisible(true)
  }

  const handleView = (order: Order) => {
    setCurrentOrder(order)
    setDetailVisible(true)
  }

  const handleSign = (order: Order) => {
    confirm({
      title: '确认签收',
      content: `确定农户已签收订单「${order.order_no}」吗？`,
      onOk: async () => {
        try {
          const res = await orderApi.sign(order.id!)
          if (res.data.success) {
            message.success('签收成功')
            loadData()
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '签收失败')
        }
      }
    })
  }

  const handleCancel = (order: Order) => {
    confirm({
      title: '确认取消',
      content: `确定要取消订单「${order.order_no}」吗？取消后额度将被释放。`,
      okText: '确认取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res = await orderApi.cancel(order.id!)
          if (res.data.success) {
            message.success('取消成功')
            loadData()
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '取消失败')
        }
      }
    })
  }

  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }

  const handleProductChange = (index: number, productId: number) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      const items = form.getFieldValue('items')
      items[index].product_name = product.name
      items[index].unit_price = product.price
      items[index].subtotal = (items[index].quantity || 0) * product.price
      form.setFieldsValue({ items })
    }
  }

  const handleQuantityChange = (index: number, quantity: number) => {
    const items = form.getFieldValue('items')
    items[index].quantity = quantity
    items[index].subtotal = quantity * (items[index].unit_price || 0)
    form.setFieldsValue({ items })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const items = values.items.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      }))
      
      const totalAmount = calculateTotal(items)
      const dueDate = values.due_date?.format('YYYY-MM-DD')
      const accountPeriodDays = dayjs(dueDate).diff(dayjs(), 'days')
      
      const data = {
        farmer_id: values.farmer_id,
        store_id: values.store_id,
        credit_approval_id: values.credit_approval_id,
        items,
        total_amount: totalAmount,
        account_period_days: accountPeriodDays,
        due_date: dueDate,
        notes: values.notes || ''
      }
      
      const res = await orderApi.create(data)
      if (res.data.success) {
        message.success('创建订单成功')
        setModalVisible(false)
        loadData()
      }
    } catch (error: any) {
      if (error.errorFields) return
      message.error(error.response?.data?.message || '创建订单失败')
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'active': return <Tag color="blue">进行中</Tag>
      case 'completed': return <Tag color="green">已完成</Tag>
      case 'cancelled': return <Tag color="red">已取消</Tag>
      default: return <Tag>{status}</Tag>
    }
  }

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '农户', dataIndex: 'farmer_name', key: 'farmer_name', width: 100 },
    { title: '门店', dataIndex: 'store_name', key: 'store_name', width: 120 },
    { 
      title: '订单金额', 
      dataIndex: 'total_amount', 
      key: 'total_amount',
      width: 120,
      render: (v: number) => `¥${v.toFixed(2)}`
    },
    { title: '账期(天)', dataIndex: 'account_period_days', key: 'account_period_days', width: 100 },
    { title: '到期日', dataIndex: 'due_date', key: 'due_date', width: 120 },
    { 
      title: '签收状态', 
      dataIndex: 'signed_by_farmer', 
      key: 'signed',
      width: 100,
      render: (v: number) => v ? <Tag color="green">已签收</Tag> : <Tag color="orange">未签收</Tag>
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: getStatusTag },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Order) => (
        <Space>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>详情</Button>
          {!record.signed_by_farmer && record.status === 'active' && (
            <Button size="small" type="link" icon={<CheckOutlined />} onClick={() => handleSign(record)}>签收</Button>
          )}
          {record.status === 'active' && (
            <Button size="small" type="link" danger icon={<StopOutlined />} onClick={() => handleCancel(record)}>取消</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card 
        title="赊销订单" 
        size="small"
        extra={
          <Space>
            <Select
              placeholder="状态筛选"
              style={{ width: 140 }}
              allowClear
              value={statusFilter || undefined}
              onChange={(value) => { setStatusFilter(value); setPage(1) }}
            >
              <Option value="active">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增订单
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
        />
      </Card>

      <Modal
        title="新增赊销订单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="farmer_id" label="农户" rules={[{ required: true, message: '请选择农户' }]}>
                <Select 
                  placeholder="请选择农户" 
                  showSearch
                  optionFilterProp="children"
                  onChange={handleFarmerChange}
                >
                  {farmers.map(farmer => (
                    <Option key={farmer.id} value={farmer.id}>{farmer.name} - {farmer.id_card}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="store_id" label="门店" rules={[{ required: true, message: '请选择门店' }]}>
                <Select placeholder="请选择门店">
                  {stores.map(store => (
                    <Option key={store.id} value={store.id}>{store.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="credit_approval_id" label="授信额度" rules={[{ required: true, message: '请选择授信额度' }]}>
                <Select placeholder="请选择授信额度" disabled={!selectedFarmer}>
                  {availableCredits.map(credit => (
                    <Option key={credit.id} value={credit.id}>
                      {credit.crop_cycle} - 可用: ¥{credit.available_amount.toFixed(2)} (至 {credit.validity_end})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="due_date" label="到期日" rules={[{ required: true, message: '请选择到期日' }]}>
                <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().startOf('day')} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">订单商品</Divider>
          
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8} align="middle" style={{ marginBottom: 8 }}>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'product_id']}
                        rules={[{ required: true, message: '请选择商品' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select 
                          placeholder="选择商品" 
                          onChange={(value) => handleProductChange(name, value)}
                        >
                          {products.map(product => (
                            <Option key={product.id} value={product.id}>{product.name} (¥{product.price}/{product.unit})</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[{ required: true, message: '数量' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber 
                          min={0} 
                          placeholder="数量" 
                          style={{ width: '100%' }}
                          onChange={(value) => handleQuantityChange(name, value || 0)}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'unit_price']}
                        rules={[{ required: true, message: '单价' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={0} placeholder="单价" style={{ width: '100%' }} disabled />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'subtotal']}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={0} placeholder="小计" style={{ width: '100%' }} disabled />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      {fields.length > 1 && (
                        <Button 
                          type="text" 
                          danger 
                          icon={<MinusCircleOutlined />} 
                          onClick={() => remove(name)}
                        />
                      )}
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加商品
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentOrder && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentOrder.status)}</Descriptions.Item>
              <Descriptions.Item label="农户">{currentOrder.farmer_name}</Descriptions.Item>
              <Descriptions.Item label="门店">{currentOrder.store_name}</Descriptions.Item>
              <Descriptions.Item label="订单金额">¥{currentOrder.total_amount.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="账期">{currentOrder.account_period_days}天</Descriptions.Item>
              <Descriptions.Item label="到期日">{currentOrder.due_date}</Descriptions.Item>
              <Descriptions.Item label="签收状态">
                {currentOrder.signed_by_farmer ? '已签收' : '未签收'}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">商品明细</Divider>
            <Table
              size="small"
              dataSource={currentOrder.items || []}
              rowKey="id"
              pagination={false}
              columns={[
                { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
                { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
                { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 100, render: (v: number) => `¥${v.toFixed(2)}` },
                { title: '小计', dataIndex: 'subtotal', key: 'subtotal', width: 120, render: (v: number) => `¥${v.toFixed(2)}` }
              ]}
            />

            {currentOrder.repayment && (
              <>
                <Divider orientation="left">还款信息</Divider>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="还款状态">{currentOrder.repayment.status}</Descriptions.Item>
                  <Descriptions.Item label="已还金额">¥{currentOrder.repayment.paid_amount.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="剩余金额">¥{currentOrder.repayment.remaining_amount.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="是否逾期">
                    {currentOrder.repayment.is_overdue ? <Tag color="red">逾期{currentOrder.repayment.overdue_days}天</Tag> : '否'}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            {currentOrder.notes && (
              <>
                <Divider orientation="left">备注</Divider>
                <p>{currentOrder.notes}</p>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Orders
