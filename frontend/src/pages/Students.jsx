import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Popconfirm, Row, Col, Card, Progress, Statistic } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, BarChartOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Option } = Select

function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [form] = Form.useForm()
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [evaluationSummary, setEvaluationSummary] = useState(null)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const response = await api.get('/students')
      setStudents(response.data)
    } catch (error) {
      message.error('加载学生数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadEvaluationSummary = async (studentId) => {
    try {
      const response = await api.get(`/students/${studentId}/evaluation-summary`)
      setEvaluationSummary(response.data)
    } catch (error) {
      message.error('加载评价数据失败')
    }
  }

  const handleAdd = () => {
    setEditingStudent(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    form.setFieldsValue(student)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/students/${id}`)
      message.success('删除成功')
      loadStudents()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingStudent) {
        await api.put(`/students/${editingStudent.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/students', values)
        message.success('添加成功')
      }
      setModalVisible(false)
      loadStudents()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleViewDetails = (student) => {
    setSelectedStudent(student)
    loadEvaluationSummary(student.id)
  }

  const columns = [
    { title: '学号', dataIndex: 'student_no', key: 'student_no' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '年级', dataIndex: 'grade', key: 'grade', render: (g) => `初${g}` },
    { title: '班级', dataIndex: 'class_name', key: 'class_name' },
    { title: '性别', dataIndex: 'gender', key: 'gender' },
    { title: '家长姓名', dataIndex: 'parent_name', key: 'parent_name' },
    { title: '家长电话', dataIndex: 'parent_phone', key: 'parent_phone' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<BarChartOutlined />} onClick={() => handleViewDetails(record)}>
            评价详情
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
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
        <h2>学生管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加学生
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={students}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingStudent ? '编辑学生' : '添加学生'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="student_no" label="学号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="grade" label="年级" rules={[{ required: true }]}>
            <Select>
              <Option value={7}>初一</Option>
              <Option value={8}>初二</Option>
              <Option value={9}>初三</Option>
            </Select>
          </Form.Item>
          <Form.Item name="class_name" label="班级" rules={[{ required: true }]}>
            <Select>
              <Option value="1班">1班</Option>
              <Option value="2班">2班</Option>
              <Option value="3班">3班</Option>
            </Select>
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select>
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Form.Item>
          <Form.Item name="parent_name" label="家长姓名">
            <Input />
          </Form.Item>
          <Form.Item name="parent_phone" label="家长电话">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${selectedStudent?.name} - 评价详情`}
        open={!!selectedStudent && !!evaluationSummary}
        onCancel={() => { setSelectedStudent(null); setEvaluationSummary(null) }}
        footer={[
          <Button key="close" onClick={() => { setSelectedStudent(null); setEvaluationSummary(null) }}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {evaluationSummary && (
          <div>
            <Card title="综合评价总分" style={{ marginBottom: 16 }}>
              <Statistic
                value={evaluationSummary.total_score}
                valueStyle={{ color: evaluationSummary.total_score >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 36 }}
                suffix="分"
              />
            </Card>
            <Card title="各维度得分">
              {evaluationSummary.dimensions?.map((dim, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <Row justify="space-between" align="middle">
                    <Col span={8}>{dim.dimension_name}</Col>
                    <Col span={16}>
                      <Progress
                        percent={Math.min(Math.max(((dim.bonus_score || 0) - (dim.penalty_score || 0)) * 10, 0), 100)}
                        format={() => `+${dim.bonus_score || 0} / -${dim.penalty_score || 0}`}
                        strokeColor={((dim.bonus_score || 0) - (dim.penalty_score || 0)) >= 0 ? '#52c41a' : '#ff4d4f'}
                      />
                    </Col>
                  </Row>
                </div>
              ))}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Students
