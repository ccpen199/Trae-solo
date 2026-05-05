import React, { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  message, 
  Popconfirm,
  Card,
  Row,
  Col,
  Tag
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  ReloadOutlined,
} from '@ant-design/icons'
import { roomsAPI, roomTypesAPI } from '../api'

const { TextArea } = Input
const { Option } = Select

const statusMap = {
  available: { text: '可用', color: 'success' },
  occupied: { text: '已入住', color: 'error' },
  maintenance: { text: '维修中', color: 'warning' }
}

function Rooms() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const fetchRoomTypes = async () => {
    try {
      const result = await roomTypesAPI.getAll()
      setRoomTypes(result.data || [])
    } catch (error) {
      console.error('获取客房类型失败:', error)
    }
  }

  const fetchData = async (page = 1, pageSize = 10, searchParams = {}) => {
    setLoading(true)
    try {
      const params = {
        page,
        pageSize,
        ...searchParams
      }
      const result = await roomsAPI.getAll(params)
      setData(result.data.list || [])
      setPagination({
        current: result.data.pagination.page,
        pageSize: result.data.pagination.pageSize,
        total: result.data.pagination.total
      })
    } catch (error) {
      console.error('获取客房列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoomTypes()
    fetchData()
  }, [])

  const handleTableChange = (pagination) => {
    const searchParams = searchForm.getFieldsValue()
    fetchData(pagination.current, pagination.pageSize, searchParams)
  }

  const handleAdd = () => {
    setEditMode(false)
    setCurrentItem(null)
    form.resetFields()
    form.setFieldsValue({
      status: 'available'
    })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditMode(true)
    setCurrentItem(record)
    form.setFieldsValue({
      room_number: record.room_number,
      room_type_id: record.room_type_id,
      floor: record.floor,
      status: record.status,
      description: record.description
    })
    setModalVisible(true)
  }

  const handleView = (record) => {
    setCurrentItem(record)
    setDetailModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await roomsAPI.delete(id)
      message.success('删除成功')
      fetchData(pagination.current, pagination.pageSize)
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (editMode && currentItem) {
        await roomsAPI.update(currentItem.id, values)
        message.success('更新成功')
      } else {
        await roomsAPI.create(values)
        message.success('创建成功')
      }
      
      setModalVisible(false)
      fetchData(pagination.current, pagination.pageSize)
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  const handleSearch = (values) => {
    const searchParams = {}
    if (values.roomNumber) {
      searchParams.roomNumber = values.roomNumber
    }
    if (values.roomTypeId) {
      searchParams.roomTypeId = values.roomTypeId
    }
    if (values.status) {
      searchParams.status = values.status
    }
    fetchData(1, pagination.pageSize, searchParams)
  }

  const handleReset = () => {
    searchForm.resetFields()
    fetchData(1, pagination.pageSize)
  }

  const getRoomTypeName = (roomTypeId) => {
    const roomType = roomTypes.find(rt => rt.id === roomTypeId)
    return roomType ? roomType.name : '-'
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '房号',
      dataIndex: 'room_number',
      key: 'room_number',
      width: 120,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '房型',
      dataIndex: 'room_type_name',
      key: 'room_type_name',
      width: 120,
      render: (text, record) => text || getRoomTypeName(record.room_type_id),
    },
    {
      title: '楼层',
      dataIndex: 'floor',
      key: 'floor',
      width: 100,
      render: (floor) => floor ? `${floor}楼` : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusInfo = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
      },
    },
    {
      title: '基础价格',
      dataIndex: 'base_price',
      key: 'base_price',
      width: 120,
      render: (price) => price ? `¥${price}` : '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => handleView(record)}
          >
            详情
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个客房吗？此操作不可恢复。"
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
      <Card title="客房信息管理" style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <Form.Item name="roomNumber" label="房号">
            <Input placeholder="请输入房号" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="roomTypeId" label="房型">
            <Select
              placeholder="请选择房型"
              style={{ width: 150 }}
              allowClear
            >
              {roomTypes.map(rt => (
                <Option key={rt.id} value={rt.id}>{rt.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              placeholder="请选择状态"
              style={{ width: 120 }}
              allowClear
            >
              <Option value="available">可用</Option>
              <Option value="occupied">已入住</Option>
              <Option value="maintenance">维修中</Option>
            </Select>
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
              新增客房
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          bordered
          scroll={{ x: 1200 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          onChange={handleTableChange}
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
        title={editMode ? '编辑客房' : '新增客房'}
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
                name="room_number"
                label="房号"
                rules={[{ required: true, message: '请输入房号' }]}
              >
                <Input placeholder="请输入房号，如：101、201" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="room_type_id"
                label="房型"
                rules={[{ required: true, message: '请选择房型' }]}
              >
                <Select
                  placeholder="请选择房型"
                  showSearch
                  optionFilterProp="children"
                >
                  {roomTypes.map(rt => (
                    <Option key={rt.id} value={rt.id}>
                      {rt.name} (¥{rt.base_price})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="floor"
                label="楼层"
              >
                <InputNumber
                  min={0}
                  placeholder="请输入楼层"
                  style={{ width: '100%' }}
                  addonAfter="楼"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="available">可用</Option>
                  <Option value="occupied">已入住</Option>
                  <Option value="maintenance">维修中</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea
              rows={3}
              placeholder="请输入客房描述"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="客房详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button key="edit" type="primary" onClick={() => {
            setDetailModalVisible(false)
            handleEdit(currentItem)
          }}>
            编辑
          </Button>
        ]}
        width={600}
      >
        {currentItem && (
          <div style={{ padding: '16px 0' }}>
            <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>房号：</strong>{currentItem.room_number}</p>
                  <p><strong>房型：</strong>{currentItem.room_type_name || getRoomTypeName(currentItem.room_type_id)}</p>
                  <p><strong>楼层：</strong>{currentItem.floor ? `${currentItem.floor}楼` : '-'}</p>
                </Col>
                <Col span={12}>
                  <p><strong>状态：</strong>
                    {(() => {
                      const statusInfo = statusMap[currentItem.status] || { text: currentItem.status, color: 'default' }
                      return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                    })()}
                  </p>
                  <p><strong>基础价格：</strong>{currentItem.base_price ? `¥${currentItem.base_price}` : '-'}</p>
                </Col>
              </Row>
            </Card>

            {currentItem.description && (
              <Card size="small" title="描述">
                <p>{currentItem.description}</p>
              </Card>
            )}

            {currentItem.room_type_description && (
              <Card size="small" title="房型描述" style={{ marginTop: 16 }}>
                <p>{currentItem.room_type_description}</p>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Rooms
