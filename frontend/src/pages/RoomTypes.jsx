import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  message, 
  Popconfirm,
  Card,
  Row,
  Col
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { roomTypesAPI } from '../api'

const { TextArea } = Input

function RoomTypes() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await roomTypesAPI.getAll()
      setData(result.data || [])
    } catch (error) {
      console.error('获取客房类型失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAdd = () => {
    setEditMode(false)
    setCurrentItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditMode(true)
    setCurrentItem(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      base_price: parseFloat(record.base_price),
      max_occupancy: record.max_occupancy,
      area: record.area,
      amenities: record.amenities
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await roomTypesAPI.delete(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (editMode && currentItem) {
        await roomTypesAPI.update(currentItem.id, values)
        message.success('更新成功')
      } else {
        await roomTypesAPI.create(values)
        message.success('创建成功')
      }
      
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  const handleSearch = (values) => {
    if (values.searchKeyword) {
      const filtered = data.filter(item => 
        item.name.includes(values.searchKeyword) || 
        (item.description && item.description.includes(values.searchKeyword))
      )
      setData(filtered)
    } else {
      fetchData()
    }
  }

  const handleReset = () => {
    searchForm.resetFields()
    fetchData()
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '房型名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '基础价格',
      dataIndex: 'base_price',
      key: 'base_price',
      width: 120,
      render: (price) => `¥${price}`,
    },
    {
      title: '最大入住人数',
      dataIndex: 'max_occupancy',
      key: 'max_occupancy',
      width: 120,
      render: (count) => `${count}人`,
    },
    {
      title: '面积(㎡)',
      dataIndex: 'area',
      key: 'area',
      width: 100,
      render: (area) => area ? `${area}㎡` : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个客房类型吗？此操作不可恢复。"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
            okType="danger"
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card title="客房类型管理" style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="searchKeyword" label="关键词">
            <Input placeholder="请输入房型名称或描述" style={{ width: 250 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Row justify="end" style={{ marginBottom: 16 }}>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增客房类型
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          bordered
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          rowClassName={(record, index) => 
            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
          }
          onRow={(record) => ({
            style: { cursor: 'pointer' },
            onMouseEnter: (e) => {
              e.currentTarget.style.backgroundColor = '#e6f7ff'
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.backgroundColor = ''
            },
          })}
        />
      </Card>

      <Modal
        title={editMode ? '编辑客房类型' : '新增客房类型'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="确认"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="房型名称"
                rules={[{ required: true, message: '请输入房型名称' }]}
              >
                <Input placeholder="请输入房型名称，如：标准间、大床房" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="base_price"
                label="基础价格(元)"
                rules={[{ required: true, message: '请输入基础价格' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  placeholder="请输入基础价格"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="max_occupancy"
                label="最大入住人数"
                rules={[{ required: true, message: '请输入最大入住人数' }]}
              >
                <InputNumber
                  min={1}
                  max={20}
                  placeholder="请输入最大入住人数"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="area"
                label="面积(㎡)"
              >
                <InputNumber
                  min={0}
                  placeholder="请输入面积"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea
              rows={3}
              placeholder="请输入房型描述"
            />
          </Form.Item>

          <Form.Item
            name="amenities"
            label="设施配置"
          >
            <TextArea
              rows={2}
              placeholder="请输入设施配置，如：免费WiFi、空调、电视"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RoomTypes
