import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Space, Tag, Input, Select, Modal, Form, message, InputNumber, Descriptions } from 'antd'
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getDrivers, createDriver, type Driver, type DriverListParams } from '@/api'

interface TableDriver extends Driver {
  key: string
}

const driverStatusMap: Record<string, { color: string; text: string }> = {
  available: { color: 'success', text: '在线' },
  busy: { color: 'processing', text: '忙碌' },
  offline: { color: 'default', text: '离线' }
}

const vehicleInspectionMap: Record<string, { color: string; text: string }> = {
  valid: { color: 'success', text: '合格' },
  pending: { color: 'warning', text: '待检' },
  expired: { color: 'error', text: '过期' }
}

const Drivers: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TableDriver[]>([])
  const [total, setTotal] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<TableDriver | null>(null)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })

  const fetchDrivers = async (params?: DriverListParams) => {
    setLoading(true)
    try {
      const response = await getDrivers(params)
      if (response.code === 0) {
        const list = response.data.list.map(item => ({ ...item, key: item.id }))
        setData(list)
        setTotal(response.data.total)
      } else {
        message.error(response.message || '获取司机列表失败')
      }
    } catch (error) {
      message.error('获取司机列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers({ page: 1, pageSize: 10 })
  }, [])

  const handleSearch = (values: any) => {
    const params: DriverListParams = {
      page: 1,
      pageSize: pagination.pageSize,
      ...values
    }
    setPagination({ ...pagination, page: 1 })
    fetchDrivers(params)
  }

  const handleAdd = async (values: any) => {
    try {
      const response = await createDriver(values)
      if (response.code === 0) {
        message.success('司机添加成功')
        setIsModalOpen(false)
        form.resetFields()
        fetchDrivers({ page: pagination.page, pageSize: pagination.pageSize })
      } else {
        message.error(response.message || '添加司机失败')
      }
    } catch (error) {
      message.error('添加司机失败')
    }
  }

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
    const values = searchForm.getFieldsValue()
    fetchDrivers({ page, pageSize, ...values })
  }

  const openDetailModal = (record: TableDriver) => {
    setSelectedDriver(record)
    setDetailModalOpen(true)
  }

  const columns: ColumnsType<TableDriver> = [
    {
      title: '司机编号',
      dataIndex: 'id',
      key: 'id',
      width: 100
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130
    },
    {
      title: '车牌号',
      dataIndex: 'vehicle_plate',
      key: 'vehicle_plate',
      width: 110
    },
    {
      title: '车型',
      dataIndex: 'vehicle_type',
      key: 'vehicle_type',
      width: 80
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const info = driverStatusMap[status] || { color: 'default', text: status }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '信用分',
      dataIndex: 'credit_score',
      key: 'credit_score',
      width: 80,
      render: (score: number) => (
        <span style={{ color: score >= 90 ? '#52c41a' : score >= 80 ? '#faad14' : '#ff4d4f' }}>
          {score ?? '-'}
        </span>
      )
    },
    {
      title: '好评率',
      dataIndex: 'rating',
      key: 'rating',
      width: 80,
      render: (rating: number) => rating ? `${rating}` : '-'
    },
    {
      title: '入职日期',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => date ? date.split('T')[0] : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => openDetailModal(record)}><EyeOutlined /> 查看</a>
        </Space>
      )
    }
  ]

  return (
    <Card
      title="司机档案管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          添加司机
        </Button>
      }
    >
      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }} onFinish={handleSearch}>
        <Form.Item name="keyword">
          <Input placeholder="搜索姓名/手机号/车牌号" prefix={<SearchOutlined />} style={{ width: 240 }} />
        </Form.Item>
        <Form.Item name="status">
          <Select placeholder="选择状态" allowClear style={{ width: 120 }}>
            <Select.Option value="available">在线</Select.Option>
            <Select.Option value="busy">忙碌</Select.Option>
            <Select.Option value="offline">离线</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">查询</Button>
            <Button onClick={() => { searchForm.resetFields(); fetchDrivers({ page: 1, pageSize: 10 }) }}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: handleTableChange
        }}
      />

      <Modal
        title="添加司机"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="id_card" label="身份证号" rules={[{ required: true, message: '请输入身份证号' }]}>
            <Input placeholder="请输入身份证号" />
          </Form.Item>
          <Form.Item name="vehicle_plate" label="车牌号" rules={[{ required: true, message: '请输入车牌号' }]}>
            <Input placeholder="请输入车牌号" />
          </Form.Item>
          <Form.Item name="vehicle_type" label="车型" rules={[{ required: true, message: '请选择车型' }]}>
            <Select placeholder="请选择车型">
              <Select.Option value="厢式货车">厢式货车</Select.Option>
              <Select.Option value="平板货车">平板货车</Select.Option>
              <Select.Option value="冷藏车">冷藏车</Select.Option>
              <Select.Option value="小型货车">小型货车</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="driver_license" label="驾驶证类型">
            <Select placeholder="请选择驾驶证类型">
              <Select.Option value="A1">A1</Select.Option>
              <Select.Option value="A2">A2</Select.Option>
              <Select.Option value="B1">B1</Select.Option>
              <Select.Option value="B2">B2</Select.Option>
              <Select.Option value="C1">C1</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="vehicle_inspection_status" label="车辆年检状态">
            <Select placeholder="请选择车辆年检状态">
              <Select.Option value="valid">合格</Select.Option>
              <Select.Option value="pending">待检</Select.Option>
              <Select.Option value="expired">过期</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="rating" label="历史好评率">
            <InputNumber placeholder="0-5" style={{ width: '100%' }} min={0} max={5} step={0.1} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认添加</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="司机详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedDriver && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="司机编号">{selectedDriver.id}</Descriptions.Item>
            <Descriptions.Item label="姓名">{selectedDriver.name}</Descriptions.Item>
            <Descriptions.Item label="手机号">{selectedDriver.phone}</Descriptions.Item>
            <Descriptions.Item label="身份证号">{selectedDriver.id_card}</Descriptions.Item>
            <Descriptions.Item label="车牌号">{selectedDriver.vehicle_plate}</Descriptions.Item>
            <Descriptions.Item label="车型">{selectedDriver.vehicle_type}</Descriptions.Item>
            <Descriptions.Item label="驾驶证类型">{selectedDriver.driver_license || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={driverStatusMap[selectedDriver.status]?.color}>
                {driverStatusMap[selectedDriver.status]?.text || selectedDriver.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="车辆年检状态">
              {selectedDriver.vehicle_inspection_status ? (
                <Tag color={vehicleInspectionMap[selectedDriver.vehicle_inspection_status]?.color}>
                  {vehicleInspectionMap[selectedDriver.vehicle_inspection_status]?.text || selectedDriver.vehicle_inspection_status}
                </Tag>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="历史好评率">{selectedDriver.rating || '-'}</Descriptions.Item>
            <Descriptions.Item label="信用分">{selectedDriver.credit_score ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="入职日期">{selectedDriver.created_at ? selectedDriver.created_at.split('T')[0] : '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </Card>
  )
}

export default Drivers
