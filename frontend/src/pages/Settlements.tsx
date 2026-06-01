import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Tag, Space, Row, Col, Card, Statistic, List, Divider, DatePicker } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { settlementsApi } from '../api'

const { TextArea } = Input

function Settlements() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [itemModalVisible, setItemModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [selectedSettlementId, setSelectedSettlementId] = useState<number | null>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [form] = Form.useForm()
  const [itemForm] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  useEffect(() => {
    loadData()
    loadReport()
  }, [pagination.current, pagination.pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await settlementsApi.list({ page: pagination.current, pageSize: pagination.pageSize })
      setData(res.data?.data || [])
      setPagination(prev => ({ ...prev, total: res.data?.pagination?.total || 0 }))
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadReport = async () => {
    try {
      const res = await settlementsApi.profitReport()
      setReportData(res.data?.data)
    } catch (error) {
      console.error('加载报表失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (editingItem) {
        await settlementsApi.update(editingItem.id, values)
        message.success('更新成功')
      } else {
        await settlementsApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      form.resetFields()
      loadData()
      loadReport()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleAddItem = async (values: any) => {
    try {
      await settlementsApi.addItem(selectedSettlementId!, values)
      message.success('添加成功')
      setItemModalVisible(false)
      itemForm.resetFields()
      loadData()
      loadReport()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDeleteItem = async (id: number) => {
    try {
      await settlementsApi.deleteItem(selectedSettlementId!, id)
      message.success('删除成功')
      loadData()
      loadReport()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleEdit = (record: any) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const columns = [
    { title: '结算单号', dataIndex: 'settlement_no', key: 'settlement_no' },
    { title: '订舱单ID', dataIndex: 'booking_id', key: 'booking_id' },
    { title: '总收入', dataIndex: 'total_revenue', key: 'total_revenue', render: (v: number) => v?.toFixed(2) || '0.00' },
    { title: '总成本', dataIndex: 'total_cost', key: 'total_cost', render: (v: number) => v?.toFixed(2) || '0.00' },
    { title: '利润', dataIndex: 'profit', key: 'profit', render: (v: number) => (
      <span style={{ color: v >= 0 ? '#3f8600' : '#cf1322' }}>
        {v?.toFixed(2) || '0.00'}
      </span>
    )},
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'orange',
          invoiced: 'blue',
          paid: 'green',
        }
        return <Tag color={colorMap[status]}>{status}</Tag>
      },
    },
    { title: '开票日期', dataIndex: 'invoiced_at', key: 'invoiced_at' },
    { title: '付款日期', dataIndex: 'paid_at', key: 'paid_at' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" onClick={() => { setSelectedSettlementId(record.id); setItemModalVisible(true); }}>添加费用</Button>
        </Space>
      ),
    },
  ]

  const selectedSettlement = data.find((d: any) => d.id === selectedSettlementId)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>利润报表</h2>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="总收入"
                value={reportData?.summary?.total_revenue || 0}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="总成本"
                value={reportData?.summary?.total_cost || 0}
                precision={2}
                valueStyle={{ color: '#cf1322' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="总利润"
                value={reportData?.summary?.total_profit || 0}
                precision={2}
                valueStyle={{ color: (reportData?.summary?.total_profit || 0) >= 0 ? '#3f8600' : '#cf1322' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>费用结算</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setModalVisible(true); }}>
          新增结算
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
        }}
        expandedRowRender={(record) => (
          <Card size="small" title="费用明细">
            <List
              size="small"
              dataSource={record.items || []}
              renderItem={(item: any) => (
                <List.Item
                  actions={[
                    <Popconfirm key="delete" title="确认删除?" onConfirm={() => handleDeleteItem(item.id)}>
                      <Button type="link" danger size="small">删除</Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={item.is_revenue ? 'green' : 'red'}>
                          {item.is_revenue ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                          {item.item_type}
                        </Tag>
                        <span>{item.description}</span>
                      </Space>
                    }
                    description={`金额: ${item.amount?.toFixed(2)} ${item.currency}`}
                  />
                </List.Item>
              )}
            />
            {(!record.items || record.items.length === 0) && <p style={{ textAlign: 'center', padding: 20 }}>暂无费用明细</p>}
          </Card>
        )}
        onExpand={(expanded, record) => expanded && setSelectedSettlementId(record.id)}
      />

      <Modal
        title={editingItem ? '编辑结算单' : '新增结算单'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="booking_id" label="关联订舱单ID">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="invoiced">已开票</Select.Option>
              <Select.Option value="paid">已付款</Select.Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="invoiced_at" label="开票日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paid_at" label="付款日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remarks" label="备注">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加费用项"
        open={itemModalVisible}
        onCancel={() => setItemModalVisible(false)}
        onOk={() => itemForm.submit()}
        width={500}
      >
        <Form form={itemForm} layout="vertical" onFinish={handleAddItem}>
          <Form.Item name="item_type" label="费用类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="海运费">海运费</Select.Option>
              <Select.Option value="拖车费">拖车费</Select.Option>
              <Select.Option value="报关费">报关费</Select.Option>
              <Select.Option value="文件费">文件费</Select.Option>
              <Select.Option value="订舱费">订舱费</Select.Option>
              <Select.Option value="THC">THC</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="费用描述" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currency" label="币种" rules={[{ required: true }]} initialValue="USD">
                <Select>
                  <Select.Option value="USD">USD</Select.Option>
                  <Select.Option value="RMB">RMB</Select.Option>
                  <Select.Option value="EUR">EUR</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="is_revenue" label="类型" initialValue={1}>
            <Select>
              <Select.Option value={1}>收入</Select.Option>
              <Select.Option value={0}>成本</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Settlements
