import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Typography, Tag, Card, DatePicker } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { adverseEventAPI } from '../api'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

function AdverseEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const data = await adverseEventAPI.getAll()
      setEvents(data)
    } catch (error) {
      message.error('加载不良反应列表失败')
    }
    setLoading(false)
  }

  const handleSubmit = async (values) => {
    try {
      await adverseEventAPI.create({
        ...values,
        onset_date: values.onset_date ? values.onset_date.format('YYYY-MM-DD') : null
      })
      message.success('上报成功')
      setModalVisible(false)
      form.resetFields()
      loadEvents()
    } catch (error) {
      message.error('上报失败')
    }
  }

  const columns = [
    { title: '患者', dataIndex: 'patient_name', key: 'patient_name' },
    { title: '路径', dataIndex: 'pathway_name', key: 'pathway_name' },
    { title: '事件类型', dataIndex: 'event_type', key: 'event_type' },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (s) => {
        const colorMap = { mild: 'green', moderate: 'orange', severe: 'red' }
        const textMap = { mild: '轻度', moderate: '中度', severe: '重度' }
        return <Tag color={colorMap[s]}>{textMap[s]}</Tag>
      },
    },
    { title: '关联药品', dataIndex: 'drug_name', key: 'drug_name' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '结局', dataIndex: 'outcome', key: 'outcome' },
    { title: '上报人', dataIndex: 'reporter', key: 'reporter' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at' },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>不良反应管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          上报不良反应
        </Button>
      </div>

      <Card className="card-shadow">
        <Table
          columns={columns}
          dataSource={events}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="上报不良反应"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="patient_pathway_id" label="患者路径ID" rules={[{ required: true }]}>
            <Input type="number" placeholder="请输入患者路径ID" />
          </Form.Item>
          <Form.Item name="event_type" label="事件类型" rules={[{ required: true }]}>
            <Select placeholder="请选择">
              <Option value="过敏反应">过敏反应</Option>
              <Option value="胃肠道反应">胃肠道反应</Option>
              <Option value="肝肾功能异常">肝肾功能异常</Option>
              <Option value="血液系统异常">血液系统异常</Option>
              <Option value="神经系统反应">神经系统反应</Option>
              <Option value="心血管反应">心血管反应</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="severity" label="严重程度" rules={[{ required: true }]}>
            <Select placeholder="请选择">
              <Option value="mild">轻度</Option>
              <Option value="moderate">中度</Option>
              <Option value="severe">重度</Option>
            </Select>
          </Form.Item>
          <Form.Item name="drug_name" label="关联药品">
            <Input placeholder="请输入关联药品" />
          </Form.Item>
          <Form.Item name="onset_date" label="发生日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="事件描述" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请详细描述不良反应" />
          </Form.Item>
          <Form.Item name="outcome" label="结局">
            <Select placeholder="请选择">
              <Option value="好转">好转</Option>
              <Option value="痊愈">痊愈</Option>
              <Option value="未愈">未愈</Option>
              <Option value="死亡">死亡</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reporter" label="上报人">
            <Input placeholder="请输入上报人" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdverseEvents
