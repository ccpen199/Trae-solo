import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm, Tag, Space, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { spaceApi } from '../api'

const { TextArea } = Input

function SpacePage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await spaceApi.list({ page: pagination.current, pageSize: pagination.pageSize })
      setData(res.data?.data || [])
      setPagination(prev => ({ ...prev, total: res.data?.pagination?.total || 0 }))
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        etd: values.etd?.format('YYYY-MM-DD'),
        eta: values.eta?.format('YYYY-MM-DD'),
        cut_off_time: values.cut_off_time?.format('YYYY-MM-DD HH:mm'),
        port_cut_off_time: values.port_cut_off_time?.format('YYYY-MM-DD HH:mm'),
      }
      if (editingItem) {
        await spaceApi.update(editingItem.id, data)
        message.success('更新成功')
      } else {
        await spaceApi.create(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleConfirm = async (id: number) => {
    try {
      await spaceApi.confirm(id, { confirmed_by: 'system' })
      message.success('确认成功')
      loadData()
    } catch (error) {
      message.error('确认失败')
    }
  }

  const handleCancel = async (id: number) => {
    try {
      await spaceApi.cancel(id)
      message.success('已取消')
      loadData()
    } catch (error) {
      message.error('取消失败')
    }
  }

  const handleEdit = (record: any) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      etd: record.etd ? dayjs(record.etd) : null,
      eta: record.eta ? dayjs(record.eta) : null,
      cut_off_time: record.cut_off_time ? dayjs(record.cut_off_time) : null,
      port_cut_off_time: record.port_cut_off_time ? dayjs(record.port_cut_off_time) : null,
    })
    setModalVisible(true)
  }

  const columns = [
    { title: '舱位确认号', dataIndex: 'confirmation_no', key: 'confirmation_no' },
    { title: '船名', dataIndex: 'vessel', key: 'vessel' },
    { title: '航次', dataIndex: 'voyage', key: 'voyage' },
    { title: 'ETD', dataIndex: 'etd', key: 'etd' },
    { title: 'ETA', dataIndex: 'eta', key: 'eta' },
    { title: '截单时间', dataIndex: 'cut_off_time', key: 'cut_off_time' },
    { title: '截港时间', dataIndex: 'port_cut_off_time', key: 'port_cut_off_time' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'orange',
          confirmed: 'green',
          cancelled: 'red',
        }
        return <Tag color={colorMap[status]}>{status}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === 'pending' && (
            <>
              <Button type="link" icon={<CheckOutlined />} onClick={() => handleConfirm(record.id)}>确认</Button>
              <Button type="link" danger icon={<CloseOutlined />} onClick={() => handleCancel(record.id)}>取消</Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>舱位确认</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.resetFields(); setModalVisible(true); }}>
          新增舱位
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
      />
      <Modal
        title={editingItem ? '编辑舱位' : '新增舱位'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="vessel" label="船名">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="voyage" label="航次">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="etd" label="预计开船日期(ETD)">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="eta" label="预计到港日期(ETA)">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cut_off_time" label="截单时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="port_cut_off_time" label="截港时间">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="quotation_id" label="关联报价单ID">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Select.Option value="pending">待确认</Select.Option>
                  <Select.Option value="confirmed">已确认</Select.Option>
                  <Select.Option value="cancelled">已取消</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remarks" label="备注">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SpacePage
