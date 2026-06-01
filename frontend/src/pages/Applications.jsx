import React, { useState, useEffect } from 'react'
import { Table, Button, Card, Modal, Form, Input, Select, DatePicker, InputNumber, message, Space, Tag } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { applicationAPI, schemeAPI, studentAPI } from '../services/api'
import dayjs from 'dayjs'

const { Option } = Select

const Applications = () => {
  const [applications, setApplications] = useState([])
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingApplication, setEditingApplication] = useState(null)
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
      const [appsRes, schemesRes, studentsRes] = await Promise.all([
        applicationAPI.getAll(),
        schemeAPI.getAll(),
        studentAPI.getAll()
      ])
      
      let filteredApps = appsRes.data
      let filteredSchemes = schemesRes.data
      
      if (user.role === 'student') {
        const myProfile = studentsRes.data.find(p => p.user_id === user.id)
        if (myProfile) {
          filteredSchemes = schemesRes.data.filter(s => s.student_id === myProfile.id)
          const mySchemeIds = filteredSchemes.map(s => s.id)
          filteredApps = appsRes.data.filter(a => mySchemeIds.includes(a.scheme_id))
        }
      }
      
      setApplications(filteredApps)
      setSchemes(filteredSchemes)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (app) => {
    setEditingApplication(app)
    form.setFieldsValue({
      ...app,
      submitted_at: app.submitted_at ? dayjs(app.submitted_at) : null,
      interview_date: app.interview_date ? dayjs(app.interview_date) : null
    })
    setModalVisible(true)
  }

  const handleAdd = () => {
    setEditingApplication(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      values.submitted_at = values.submitted_at ? values.submitted_at.format('YYYY-MM-DD') : null
      values.interview_date = values.interview_date ? values.interview_date.format('YYYY-MM-DD') : null

      if (editingApplication) {
        await applicationAPI.update(editingApplication.id, values)
        message.success('更新成功')
      } else {
        await applicationAPI.create(values)
        message.success('创建成功')
      }
      
      setModalVisible(false)
      loadData()
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || '保存失败，请稍后重试'
      message.error(errorMsg, 5)
      console.error('保存申请失败:', error)
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
      title: '申请账号',
      dataIndex: 'account',
      key: 'account',
    },
    {
      title: '提交日期',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
    },
    {
      title: '面试结果',
      dataIndex: 'interview_result',
      key: 'interview_result',
    },
    {
      title: '录取状态',
      dataIndex: 'admission_result',
      key: 'admission_result',
      render: (result) => {
        const colorMap = {
          pending: 'orange',
          admitted: 'green',
          rejected: 'red',
          waitlisted: 'blue',
          deferred: 'purple'
        }
        const labelMap = {
          pending: '待处理',
          admitted: '已录取',
          rejected: '已拒绝',
          waitlisted: '候补',
          deferred: '延期'
        }
        return <Tag color={colorMap[result]}>{labelMap[result]}</Tag>
      }
    },
    {
      title: '奖学金',
      dataIndex: 'scholarship_amount',
      key: 'scholarship_amount',
      render: (amount) => amount ? `$${amount}` : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
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
        <h2>{user.role === 'student' ? '我的申请' : '申请管理'}</h2>
        {schemes.length > 0 && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加申请
          </Button>
        )}
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={applications}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingApplication ? "编辑申请信息" : "添加申请"}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          {!editingApplication && (
            <Form.Item name="scheme_id" label="选校方案" rules={[{ required: true }]}>
              <Select placeholder="选择选校方案">
                {schemes.map(s => (
                  <Option key={s.id} value={s.id}>{s.school_name} - {s.major}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="account" label="申请账号">
            <Input />
          </Form.Item>
          <Form.Item name="submitted_at" label="提交日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="application_fee" label="申请费">
            <InputNumber style={{ width: '100%' }} addonAfter="USD" min={0} />
          </Form.Item>
          <Form.Item name="supplement_items" label="补充材料">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="interview_date" label="面试日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="interview_result" label="面试结果">
            <Input />
          </Form.Item>
          <Form.Item name="admission_result" label="录取结果">
            <Select>
              <Option value="pending">待处理</Option>
              <Option value="admitted">已录取</Option>
              <Option value="rejected">已拒绝</Option>
              <Option value="waitlisted">候补</Option>
              <Option value="deferred">延期</Option>
            </Select>
          </Form.Item>
          <Form.Item name="scholarship_amount" label="奖学金金额">
            <InputNumber style={{ width: '100%' }} addonAfter="USD" min={0} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Applications