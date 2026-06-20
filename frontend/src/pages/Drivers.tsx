import React, { useState, useEffect } from 'react'
import { Table, Card, Button, Space, Tag, Input, Select, Modal, Form, message } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { getDrivers, createDriver, type Driver, type DriverListParams } from '@/api'

interface TableDriver extends Driver {
  key: string
}

const Drivers: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TableDriver[]>([])
  const [total, setTotal] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
      dataIndex: 'vehicleNo',
      key: 'vehicleNo',
      width: 110
    },
    {
      title: '车型',
      dataIndex: 'vehicleType',
      key: 'vehicleType',
      width: 80
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          active: { color: 'success', text: '在线' },
          offline: { color: 'default', text: '离线' },
          inactive: { color: 'error', text: '停用' }
        }
        const info = statusMap[status] || { color: 'default', text: status }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '信用分',
      dataIndex: 'creditScore',
      key: 'creditScore',
      width: 80,
      render: (score: number) => (
        <span style={{ color: score >= 90 ? '#52c41a' : score >= 80 ? '#faad14' : '#ff4d4f' }}>
          {score}
        </span>
      )
    },
    {
      title: '完成订单',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      width: 100
    },
    {
      title: '入职日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => date.split('T')[0]
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: () => (
        <Space size="middle">
          <a>查看</a>
          <a>编辑</a>
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
            <Select.Option value="active">在线</Select.Option>
            <Select.Option value="offline">离线</Select.Option>
            <Select.Option value="inactive">停用</Select.Option>
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
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="idCard" label="身份证号" rules={[{ required: true, message: '请输入身份证号' }]}>
            <Input placeholder="请输入身份证号" />
          </Form.Item>
          <Form.Item name="vehicleNo" label="车牌号" rules={[{ required: true, message: '请输入车牌号' }]}>
            <Input placeholder="请输入车牌号" />
          </Form.Item>
          <Form.Item name="vehicleType" label="车型" rules={[{ required: true, message: '请选择车型' }]}>
            <Select placeholder="请选择车型">
              <Select.Option value="金杯">金杯</Select.Option>
              <Select.Option value="依维柯">依维柯</Select.Option>
              <Select.Option value="厢货">厢货</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认添加</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default Drivers
