import React, { useState, useEffect } from 'react'
import { Table, Button, Card, Modal, Form, Input, Select, DatePicker, message, Space, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import { schemeAPI, studentAPI } from '../services/api'
import dayjs from 'dayjs'

const { Option } = Select

const Schemes = () => {
  const [schemes, setSchemes] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingScheme, setEditingScheme] = useState(null)
  const [form] = Form.useForm()

  const getUser = () => {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : { id: null, name: '', role: '' }
    } catch (e) {
      console.error('解析用户信息失败:', e)
      return { id: null, name: '', role: '' }
    }
  }
  
  const user = getUser()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [schemesRes, studentsRes] = await Promise.all([
        schemeAPI.getAll(),
        studentAPI.getAll()
      ])
      let filteredSchemes = schemesRes.data
      
      if (user.role === 'student') {
        const myProfile = studentsRes.data.find(p => p.user_id === user.id)
        if (myProfile) {
          filteredSchemes = schemesRes.data.filter(s => s.student_id === myProfile.id)
        }
      }
      
      setSchemes(filteredSchemes)
      setStudents(studentsRes.data)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingScheme(null)
    form.resetFields()
    
    if (user.role === 'student') {
      const myProfile = students.find(p => p.user_id === user.id)
      if (myProfile) {
        form.setFieldsValue({ student_id: myProfile.id })
      }
    }
    
    setModalVisible(true)
  }

  const handleEdit = (scheme) => {
    setEditingScheme(scheme)
    form.setFieldsValue({
      ...scheme,
      deadline: scheme.deadline ? dayjs(scheme.deadline) : null
    })
    setModalVisible(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      values.deadline = values.deadline ? values.deadline.format('YYYY-MM-DD') : null

      if (editingScheme) {
        await schemeAPI.update(editingScheme.id, values)
        message.success('更新成功')
      } else {
        await schemeAPI.create(values)
        message.success('创建成功')
      }

      setModalVisible(false)
      loadData()
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || '保存失败，请稍后重试'
      message.error(errorMsg, 5)
      console.error('保存选校方案失败:', error)
    }
  }

  const handleConfirm = async (id) => {
    try {
      await schemeAPI.confirm(id)
      message.success('已确认选校方案')
      loadData()
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || '确认失败，请稍后重试'
      message.error(errorMsg, 5)
      console.error('确认选校方案失败:', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await schemeAPI.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || '删除失败，请稍后重试'
      message.error(errorMsg, 5)
      console.error('删除选校方案失败:', error)
    }
  }

  const columns = [
    {
      title: '学校',
      dataIndex: 'school_name',
      key: 'school_name',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
    },
    {
      title: '申请轮次',
      dataIndex: 'application_round',
      key: 'application_round',
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
    },
    {
      title: '难度',
      dataIndex: 'difficulty_rating',
      key: 'difficulty_rating',
      render: (rating) => {
        const colorMap = {
          safety: 'green',
          target: 'blue',
          reach: 'orange'
        }
        const labelMap = {
          safety: '保底',
          target: '匹配',
          reach: '冲刺'
        }
        return <Tag color={colorMap[rating]}>{labelMap[rating]}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          draft: 'default',
          confirmed: 'green'
        }
        const labelMap = {
          draft: '草稿',
          confirmed: '已确认'
        }
        return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.status === 'draft' && (
            <Button type="link" icon={<CheckOutlined />} onClick={() => handleConfirm(record.id)}>
              确认
            </Button>
          )}
          {user.role !== 'student' && (
            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  if (user.role !== 'student') {
    columns.unshift({
      title: '学生',
      dataIndex: 'student_name',
      key: 'student_name',
    })
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>{user.role === 'student' ? '我的选校' : '选校方案'}</h2>
        {user.role !== 'student' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加选校
          </Button>
        )}
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={schemes}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingScheme ? "编辑选校方案" : "添加选校方案"}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          {user.role !== 'student' && (
            <Form.Item name="student_id" label="学生" rules={[{ required: true }]}>
              <Select placeholder="选择学生">
                {students.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="school_name" label="学校名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="major" label="专业" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="application_round" label="申请轮次">
            <Input placeholder="如：ED1, RD, EA" />
          </Form.Item>
          <Form.Item name="deadline" label="截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="difficulty_rating" label="难度评级">
            <Select>
              <Option value="safety">保底</Option>
              <Option value="target">匹配</Option>
              <Option value="reach">冲刺</Option>
            </Select>
          </Form.Item>
          <Form.Item name="consultant_suggestion" label="顾问建议">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Schemes