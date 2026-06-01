import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, message, Modal, Form, Input, InputNumber, Select, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import request from '../../utils/request'
import { RISK_LEVEL_LABELS, RISK_LEVEL_COLORS, SERVICE_CATEGORIES } from '../../utils/constants'

const { Option } = Select

const ServiceManage = () => {
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const data = await request.get('/services')
      setServices(data.list || data || [])
    } catch (error) {
      message.error('获取服务列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingService(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingService(record)
    form.setFieldsValue({
      ...record,
      qualification_required: record.required_qualifications
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await request.delete(`/services/${id}`)
      message.success('删除成功')
      fetchServices()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const postData = {
        ...values,
        required_qualifications: values.qualification_required
      }
      if (editingService) {
        await request.put(`/services/${editingService.id}`, postData)
        message.success('更新成功')
      } else {
        await request.post('/services', postData)
        message.success('添加成功')
      }
      setModalVisible(false)
      fetchServices()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '服务名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => {
        const category = SERVICE_CATEGORIES.find(c => c.value === cat)
        return category ? category.label : cat
      }
    },
    {
      title: '风险级别',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (level) => (
        <Tag color={RISK_LEVEL_COLORS[level]}>
          {RISK_LEVEL_LABELS[level]}
        </Tag>
      )
    },
    {
      title: '时长(分钟)',
      dataIndex: 'duration',
      key: 'duration'
    },
    {
      title: '价格(元)',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `¥${price}`
    },
    {
      title: '资质要求',
      dataIndex: 'required_qualifications',
      key: 'qualification_required',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 1 || status === 'active' ? 'green' : 'default'}>
          {status === 1 || status === 'active' ? '启用' : '停用'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space className="table-actions">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该服务？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
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
        <h2>服务项目管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增服务
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={services}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingService ? '编辑服务' : '新增服务'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="服务名称" rules={[{ required: true, message: '请输入服务名称' }]}>
            <Input placeholder="请输入服务名称" />
          </Form.Item>
          <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="请选择分类">
              {SERVICE_CATEGORIES.map(cat => (
                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="risk_level" label="风险级别" rules={[{ required: true, message: '请选择风险级别' }]}>
            <Select placeholder="请选择风险级别">
              {Object.entries(RISK_LEVEL_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="duration" label="服务时长(分钟)" rules={[{ required: true, message: '请输入服务时长' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入服务时长" />
          </Form.Item>
          <Form.Item name="price" label="价格(元)" rules={[{ required: true, message: '请输入价格' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入价格" />
          </Form.Item>
          <Form.Item name="indications" label="适应症">
            <Input.TextArea rows={2} placeholder="请输入适应症，多个用逗号分隔" />
          </Form.Item>
          <Form.Item name="contraindications" label="禁忌症">
            <Input.TextArea rows={2} placeholder="请输入禁忌症，多个用逗号分隔" />
          </Form.Item>
          <Form.Item name="supplies" label="所需耗材">
            <Input.TextArea rows={2} placeholder="请输入所需耗材，多个用逗号分隔" />
          </Form.Item>
          <Form.Item name="qualification_required" label="资质要求">
            <Input placeholder="请输入资质要求" />
          </Form.Item>
          <Form.Item name="description" label="服务描述">
            <Input.TextArea rows={3} placeholder="请输入服务描述" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue={1}>
            <Select>
              <Option value={1}>启用</Option>
              <Option value={0}>停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ServiceManage
