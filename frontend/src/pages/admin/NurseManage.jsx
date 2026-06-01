import React, { useState, useEffect } from 'react'
import { Table, Button, Tag, Space, message, Modal, Form, Input, InputNumber, Select, Popconfirm, Rate, Descriptions } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons'
import request from '../../utils/request'

const { Option } = Select

const NurseManage = () => {
  const [loading, setLoading] = useState(false)
  const [nurses, setNurses] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editingNurse, setEditingNurse] = useState(null)
  const [selectedNurse, setSelectedNurse] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchNurses()
  }, [])

  const fetchNurses = async () => {
    setLoading(true)
    try {
      const data = await request.get('/users/nurses')
      setNurses(data.list || data || [])
    } catch (error) {
      message.error('获取护士列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingNurse(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingNurse(record)
    form.setFieldsValue({
      ...record,
      qualification: record.qualification || record.qualifications
    })
    setModalVisible(true)
  }

  const handleViewDetail = (record) => {
    setSelectedNurse(record)
    setDetailVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await request.delete(`/users/${id}`)
      message.success('删除成功')
      fetchNurses()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSchedule = (record) => {
    message.info('跳转到排班页面')
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingNurse) {
        await request.put(`/users/nurses/${editingNurse.id}`, values)
        message.success('更新成功')
      } else {
        await request.post('/users/nurses', values)
        message.success('添加成功')
      }
      setModalVisible(false)
      fetchNurses()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '执业证号',
      dataIndex: 'license_no',
      key: 'license_no'
    },
    {
      title: '资质',
      dataIndex: 'qualification',
      key: 'qualification'
    },
    {
      title: '经验年数',
      dataIndex: 'experience_years',
      key: 'experience_years',
      render: (years) => `${years || 0}年`
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => <Rate disabled value={rating || 0} allowHalf />
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'available' || status === 'active' ? 'green' : 'default'}>
          {status === 'available' || status === 'active' ? '在职' : '离线'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space className="table-actions">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看资质
          </Button>
          <Button type="link" size="small" icon={<CalendarOutlined />} onClick={() => handleSchedule(record)}>
            排班
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该护士？"
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
        <h2>护士管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增护士
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={nurses}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingNurse ? '编辑护士' : '新增护士'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          {!editingNurse && (
            <>
              <Form.Item name="username" label="登录账号" rules={[{ required: true, message: '请输入登录账号' }]}>
                <Input placeholder="请输入登录账号" />
              </Form.Item>
              <Form.Item name="password" label="登录密码" rules={[{ required: true, message: '请输入登录密码' }]}>
                <Input.Password placeholder="请输入登录密码" />
              </Form.Item>
            </>
          )}
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="phone" label="电话" rules={[{ required: true, message: '请输入电话' }]}>
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item name="license_no" label="执业证号" rules={[{ required: true, message: '请输入执业证号' }]}>
            <Input placeholder="请输入执业证号" />
          </Form.Item>
          <Form.Item name="qualification" label="资质" rules={[{ required: true, message: '请输入资质' }]}>
            <Select placeholder="请选择资质">
              <Option value="初级护士">初级护士</Option>
              <Option value="中级护士">中级护士</Option>
              <Option value="高级护士">高级护士</Option>
              <Option value="主管护师">主管护师</Option>
            </Select>
          </Form.Item>
          <Form.Item name="experience_years" label="经验年数" rules={[{ required: true, message: '请输入经验年数' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入经验年数" />
          </Form.Item>
          <Form.Item name="skills" label="专业技能">
            <Input.TextArea rows={3} placeholder="请输入专业技能" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Option value="active">在职</Option>
              <Option value="inactive">离职</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="护士资质详情"
        open={detailVisible}
        footer={null}
        onCancel={() => setDetailVisible(false)}
        width={600}
      >
        {selectedNurse && (
          <Descriptions column={1}>
            <Descriptions.Item label="姓名">{selectedNurse.name}</Descriptions.Item>
            <Descriptions.Item label="执业证号">{selectedNurse.license_no}</Descriptions.Item>
            <Descriptions.Item label="资质">{selectedNurse.qualification || selectedNurse.qualifications || '暂无'}</Descriptions.Item>
            <Descriptions.Item label="经验年数">{selectedNurse.experience_years || selectedNurse.years_of_experience || 0}年</Descriptions.Item>
            <Descriptions.Item label="专业技能">{selectedNurse.skills || '暂无'}</Descriptions.Item>
            <Descriptions.Item label="评分">
              <Rate disabled value={selectedNurse.rating || 0} allowHalf />
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default NurseManage
