import React, { useState, useEffect } from 'react'
import { Table, Button, Card, Modal, Form, Input, InputNumber, message, Space } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { studentAPI } from '../services/api'

const Students = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const res = await studentAPI.getAll()
      setStudents(res.data)
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || '加载学生列表失败，请稍后重试'
      message.error(errorMsg, 5)
      console.error('加载学生列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    form.setFieldsValue(student)
    setEditModalVisible(true)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      await studentAPI.update(editingStudent.id, values)
      message.success('更新成功')
      setEditModalVisible(false)
      loadStudents()
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || '更新失败，请稍后重试'
      message.error(errorMsg, 5)
      console.error('更新学生档案失败:', error)
    }
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'GPA',
      dataIndex: 'gpa',
      key: 'gpa',
    },
    {
      title: '托福',
      dataIndex: 'toefl',
      key: 'toefl',
    },
    {
      title: '雅思',
      dataIndex: 'ielts',
      key: 'ielts',
    },
    {
      title: '目标国家',
      dataIndex: 'target_countries',
      key: 'target_countries',
    },
    {
      title: '申请季',
      dataIndex: 'application_season',
      key: 'application_season',
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

  return (
    <div>
      <div className="page-header">
        <h2>学生管理</h2>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={students}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="编辑学生档案"
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => setEditModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="gpa" label="GPA">
            <InputNumber step={0.01} min={0} max={4} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="toefl" label="托福">
            <InputNumber min={0} max={120} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="ielts" label="雅思">
            <InputNumber step={0.5} min={0} max={9} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="gre" label="GRE">
            <InputNumber min={0} max={340} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="gmat" label="GMAT">
            <InputNumber min={0} max={800} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="target_countries" label="目标国家">
            <Input placeholder="如：美国,英国" />
          </Form.Item>
          <Form.Item name="application_season" label="申请季">
            <Input placeholder="如：2025 Fall" />
          </Form.Item>
          <Form.Item name="background_activities" label="背景活动">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="budget" label="预算">
            <InputNumber min={0} style={{ width: '100%' }} addonAfter="RMB" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Students
