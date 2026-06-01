import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Popconfirm, Row, Col, Upload, Switch, Divider } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Option } = Select

function Records() {
  const [records, setRecords] = useState([])
  const [students, setStudents] = useState([])
  const [dimensions, setDimensions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [recordsRes, studentsRes, dimensionsRes] = await Promise.all([
        api.get('/records'),
        api.get('/students'),
        api.get('/dimensions'),
      ])
      setRecords(recordsRes.data)
      setStudents(studentsRes.data)
      setDimensions(dimensionsRes.data)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/records/${id}`)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        await api.put(`/records/${editingRecord.id}`, values)
        message.success('更新成功')
      } else {
        await api.post('/records', { ...values, created_by: 1, semester: '2024-2025-1' })
        message.success('添加成功')
      }
      setModalVisible(false)
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    { title: '学生', dataIndex: 'student_name', key: 'student_name' },
    { title: '学号', dataIndex: 'student_no', key: 'student_no' },
    { title: '评价维度', dataIndex: 'dimension_name', key: 'dimension_name' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'bonus' ? 'green' : 'red'}>
          {type === 'bonus' ? '加分' : '扣分'}
        </Tag>
      ),
    },
    {
      title: '分值',
      dataIndex: 'score',
      key: 'score',
      render: (score, record) => (
        <strong style={{ color: record.type === 'bonus' ? '#52c41a' : '#ff4d4f' }}>
          {record.type === 'bonus' ? '+' : '-'}{score}
        </strong>
      ),
    },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    { title: '评语', dataIndex: 'comment', key: 'comment', ellipsis: true },
    {
      title: '敏感记录',
      dataIndex: 'is_sensitive',
      key: 'is_sensitive',
      render: (v) => v ? <Tag color="orange">是</Tag> : '否',
    },
    { title: '创建人', dataIndex: 'creator_name', key: 'creator_name' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
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
        <h2>评价记录管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加记录
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingRecord ? '编辑评价记录' : '添加评价记录'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="student_id" label="学生" rules={[{ required: true }]}>
                <Select placeholder="选择学生" showSearch optionFilterProp="children">
                  {students.map((s) => (
                    <Option key={s.id} value={s.id}>{s.name} - {s.student_no}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dimension_id" label="评价维度" rules={[{ required: true }]}>
                <Select placeholder="选择维度">
                  {dimensions.map((d) => (
                    <Option key={d.id} value={d.id}>{d.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="记录类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="bonus">加分</Option>
                  <Option value="penalty">扣分</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="score" label="分值" rules={[{ required: true }]}>
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reason" label="原因" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="请输入加减分的原因" />
          </Form.Item>
          <Form.Item name="comment" label="评语">
            <Input.TextArea rows={3} placeholder="请输入详细评语" />
          </Form.Item>
          <Form.Item name="activity_proof" label="活动证明/补充材料">
            <Input.TextArea rows={2} placeholder="请输入活动相关证明或补充说明" />
          </Form.Item>
          <Form.Item name="is_sensitive" label="敏感记录" valuePropName="checked">
            <Switch />
            <span style={{ marginLeft: 8, color: '#999' }}>开启后仅授权角色可查看此记录</span>
          </Form.Item>
          <Divider orientation="left">附件上传</Divider>
          <Form.Item label="相关附件">
            <Upload
              multiple
              beforeUpload={() => false}
              listType="text"
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Records
