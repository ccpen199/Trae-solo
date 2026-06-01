import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Tag, Row, Col, Collapse, InputNumber } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Option } = Select
const { Panel } = Collapse

function Dimensions() {
  const [dimensions, setDimensions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingDimension, setEditingDimension] = useState(null)
  const [indicatorModalVisible, setIndicatorModalVisible] = useState(false)
  const [editingIndicator, setEditingIndicator] = useState(null)
  const [currentDimensionId, setCurrentDimensionId] = useState(null)
  const [form] = Form.useForm()
  const [indicatorForm] = Form.useForm()

  useEffect(() => {
    loadDimensions()
  }, [])

  const loadDimensions = async () => {
    setLoading(true)
    try {
      const response = await api.get('/dimensions')
      setDimensions(response.data)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDimension = () => {
    setEditingDimension(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEditDimension = (dimension) => {
    setEditingDimension(dimension)
    form.setFieldsValue(dimension)
    setModalVisible(true)
  }

  const handleDeleteDimension = async (id) => {
    try {
      await api.delete(`/dimensions/${id}`)
      message.success('删除成功')
      loadDimensions()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmitDimension = async () => {
    try {
      const values = await form.validateFields()
      if (editingDimension) {
        await api.put(`/dimensions/${editingDimension.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/dimensions', { ...values, created_by: 1 })
        message.success('添加成功')
      }
      setModalVisible(false)
      loadDimensions()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleAddIndicator = (dimensionId) => {
    setCurrentDimensionId(dimensionId)
    setEditingIndicator(null)
    indicatorForm.resetFields()
    setIndicatorModalVisible(true)
  }

  const handleEditIndicator = (indicator) => {
    setEditingIndicator(indicator)
    indicatorForm.setFieldsValue(indicator)
    setIndicatorModalVisible(true)
  }

  const handleDeleteIndicator = async (id) => {
    try {
      await api.delete(`/dimensions/indicators/${id}`)
      message.success('删除成功')
      loadDimensions()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmitIndicator = async () => {
    try {
      const values = await indicatorForm.validateFields()
      if (editingIndicator) {
        await api.put(`/dimensions/indicators/${editingIndicator.id}`, values)
        message.success('更新成功')
      } else {
        await api.post(`/dimensions/${currentDimensionId}/indicators`, { ...values, created_by: 1 })
        message.success('添加成功')
      }
      setIndicatorModalVisible(false)
      loadDimensions()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const indicatorColumns = [
    { title: '指标名称', dataIndex: 'name', key: 'name' },
    { title: '指标代码', dataIndex: 'code', key: 'code' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '最大分值', dataIndex: 'max_score', key: 'max_score' },
    { title: '权重', dataIndex: 'weight', key: 'weight' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditIndicator(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDeleteIndicator(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>评价维度配置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDimension}>
          添加维度
        </Button>
      </div>

      <Collapse defaultActiveKey={['1']} accordion>
        {dimensions.map((dimension) => (
          <Panel
            header={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>
                  <Tag color="blue">{dimension.code}</Tag>
                  <strong>{dimension.name}</strong>
                  <span style={{ marginLeft: 16, color: '#999' }}>
                    权重: {dimension.weight} | 适用年级: {dimension.applicable_grades}
                  </span>
                </span>
                <Space>
                  <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => handleAddIndicator(dimension.id)}>
                    添加指标
                  </Button>
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditDimension(dimension)}>
                    编辑维度
                  </Button>
                  <Popconfirm title="确定删除此维度?" onConfirm={() => handleDeleteDimension(dimension.id)}>
                    <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              </div>
            }
            key={dimension.id}
          >
            <Table
              columns={indicatorColumns}
              dataSource={dimension.indicators || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Panel>
        ))}
      </Collapse>

      <Modal
        title={editingDimension ? '编辑评价维度' : '添加评价维度'}
        open={modalVisible}
        onOk={handleSubmitDimension}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="维度名称" rules={[{ required: true }]}>
            <Input placeholder="例如：品德发展、学业水平、身心健康等" />
          </Form.Item>
          <Form.Item name="code" label="维度代码" rules={[{ required: true }]}>
            <Input placeholder="例如：morality, academic, physical" />
          </Form.Item>
          <Form.Item name="description" label="维度描述">
            <Input.TextArea rows={2} placeholder="描述此评价维度的具体内容" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="weight" label="权重" initialValue={1}>
                <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="applicable_grades" label="适用年级" initialValue="7,8,9">
                <Select mode="tags" placeholder="选择适用年级">
                  <Option value="7">初一</Option>
                  <Option value="8">初二</Option>
                  <Option value="9">初三</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={editingIndicator ? '编辑评价指标' : '添加评价指标'}
        open={indicatorModalVisible}
        onOk={handleSubmitIndicator}
        onCancel={() => setIndicatorModalVisible(false)}
      >
        <Form form={indicatorForm} layout="vertical">
          <Form.Item name="name" label="指标名称" rules={[{ required: true }]}>
            <Input placeholder="例如：课堂表现、作业完成、考试成绩等" />
          </Form.Item>
          <Form.Item name="code" label="指标代码" rules={[{ required: true }]}>
            <Input placeholder="例如：class_performance, homework" />
          </Form.Item>
          <Form.Item name="description" label="指标描述">
            <Input.TextArea rows={2} placeholder="描述此评价指标的具体内容" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="max_score" label="最大分值" initialValue={10}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="weight" label="权重" initialValue={1}>
                <InputNumber min={0} max={10} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default Dimensions
