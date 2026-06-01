import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Row, Col, Descriptions } from 'antd'
import { EyeOutlined, CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Option } = Select

function Appeals() {
  const [appeals, setAppeals] = useState([])
  const [students, setStudents] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [handleModalVisible, setHandleModalVisible] = useState(false)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [currentAppeal, setCurrentAppeal] = useState(null)
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [appealsRes, studentsRes, recordsRes] = await Promise.all([
        api.get('/appeals'),
        api.get('/students'),
        api.get('/records'),
      ])
      setAppeals(appealsRes.data)
      setStudents(studentsRes.data)
      setRecords(recordsRes.data)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (appeal) => {
    setCurrentAppeal(appeal)
    setDetailModalVisible(true)
  }

  const handleProcess = (appeal) => {
    setCurrentAppeal(appeal)
    form.resetFields()
    setHandleModalVisible(true)
  }

  const handleSubmitProcess = async () => {
    try {
      const values = await form.validateFields()
      await api.put(`/appeals/${currentAppeal.id}/handle`, {
        ...values,
        handled_by: 1,
      })
      message.success('处理成功')
      setHandleModalVisible(false)
      loadData()
    } catch (error) {
      message.error('处理失败')
    }
  }

  const handleAddAppeal = () => {
    addForm.resetFields()
    setAddModalVisible(true)
  }

  const handleSubmitAppeal = async () => {
    try {
      const values = await addForm.validateFields()
      await api.post('/appeals', {
        ...values,
        appellant_id: 5,
      })
      message.success('申诉提交成功')
      setAddModalVisible(false)
      loadData()
    } catch (error) {
      message.error('提交失败')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'orange'
      case 'approved': return 'green'
      case 'rejected': return 'red'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待处理'
      case 'approved': return '已通过'
      case 'rejected': return '已驳回'
      default: return status
    }
  }

  const columns = [
    { title: '学生', dataIndex: 'student_name', key: 'student_name' },
    { title: '申诉人', dataIndex: 'appellant_name', key: 'appellant_name' },
    {
      title: '申诉记录',
      dataIndex: 'record_id',
      key: 'record_id',
      render: (id) => {
        const record = records.find(r => r.id === id)
        return record ? `${record.type === 'bonus' ? '+' : '-'}${record.score} - ${record.reason}` : id
      },
    },
    { title: '申诉原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
    },
    { title: '处理人', dataIndex: 'handler_name', key: 'handler_name' },
    { title: '处理时间', dataIndex: 'handled_at', key: 'handled_at' },
    { title: '提交时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button type="link" icon={<CheckOutlined />} onClick={() => handleProcess(record)}>
                处理
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>申诉管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAppeal}>
          提交申诉
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={appeals}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="申诉详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
        width={700}
      >
        {currentAppeal && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="学生">{currentAppeal.student_name}</Descriptions.Item>
            <Descriptions.Item label="申诉人">{currentAppeal.appellant_name}</Descriptions.Item>
            <Descriptions.Item label="申诉记录">
              {(() => {
                const record = records.find(r => r.id === currentAppeal.record_id)
                return record ? `${record.type === 'bonus' ? '加分' : '扣分'} ${record.score}分 - ${record.reason}` : '-'
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="申诉原因">{currentAppeal.reason}</Descriptions.Item>
            <Descriptions.Item label="补充材料">{currentAppeal.supplementary_materials || '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(currentAppeal.status)}>{getStatusText(currentAppeal.status)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="处理结论">{currentAppeal.conclusion || '-'}</Descriptions.Item>
            <Descriptions.Item label="处理人">{currentAppeal.handler_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="处理时间">{currentAppeal.handled_at || '-'}</Descriptions.Item>
            <Descriptions.Item label="提交时间">{currentAppeal.created_at}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="处理申诉"
        open={handleModalVisible}
        onOk={handleSubmitProcess}
        onCancel={() => setHandleModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="处理结果" rules={[{ required: true }]}>
            <Select>
              <Option value="approved">通过申诉</Option>
              <Option value="rejected">驳回申诉</Option>
            </Select>
          </Form.Item>
          <Form.Item name="conclusion" label="处理结论" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请详细说明处理结论" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交申诉"
        open={addModalVisible}
        onOk={handleSubmitAppeal}
        onCancel={() => setAddModalVisible(false)}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item name="student_id" label="选择学生" rules={[{ required: true }]}>
            <Select placeholder="选择要申诉的学生" showSearch>
              {students.map((s) => (
                <Option key={s.id} value={s.id}>{s.name} - {s.student_no}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="record_id" label="选择记录" rules={[{ required: true }]}>
            <Select placeholder="选择要申诉的评价记录" showSearch>
              {records.map((r) => (
                <Option key={r.id} value={r.id}>
                  [{r.student_name}] {r.type === 'bonus' ? '+' : '-'}{r.score} - {r.reason}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="申诉原因" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="请详细说明申诉的原因" />
          </Form.Item>
          <Form.Item name="supplementary_materials" label="补充材料">
            <Input.TextArea rows={2} placeholder="如有相关证明材料，请在此说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Appeals
