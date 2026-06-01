import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, message, Typography, Tag, Card } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { orderAPI } from '../api'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

function OrderReview() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await orderAPI.getAll()
      setOrders(data)
    } catch (error) {
      message.error('加载医嘱列表失败')
    }
    setLoading(false)
  }

  const handleReview = (order, status) => {
    setSelectedOrder(order)
    form.setFieldsValue({ approval_status: status })
    setModalVisible(true)
  }

  const handleSubmitReview = async (values) => {
    try {
      await orderAPI.review(selectedOrder.id, values)
      message.success('审核完成')
      setModalVisible(false)
      form.resetFields()
      loadOrders()
    } catch (error) {
      message.error('审核失败')
    }
  }

  const columns = [
    { title: '患者', dataIndex: 'patient_name', key: 'patient_name' },
    { title: '路径', dataIndex: 'pathway_name', key: 'pathway_name' },
    { title: '药品', dataIndex: 'drug_name', key: 'drug_name' },
    { title: '剂量', dataIndex: 'dosage', key: 'dosage' },
    { title: '频次', dataIndex: 'frequency', key: 'frequency' },
    {
      title: '超路径',
      dataIndex: 'is_off_pathway',
      key: 'is_off_pathway',
      render: (v) => v ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'approval_status',
      key: 'approval_status',
      render: (s) => {
        const colorMap = { pending: 'orange', approved: 'green', rejected: 'red' }
        const textMap = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
        return <Tag color={colorMap[s]}>{textMap[s]}</Tag>
      },
    },
    { title: '医生', dataIndex: 'doctor_name', key: 'doctor_name' },
    { title: '医生备注', dataIndex: 'doctor_note', key: 'doctor_note', ellipsis: true },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.approval_status === 'pending' && (
            <>
              <Button type="link" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }} onClick={() => handleReview(record, 'approved')}>
                通过
              </Button>
              <Button type="link" icon={<CloseCircleOutlined />} style={{ color: '#ff4d4f' }} onClick={() => handleReview(record, 'rejected')}>
                拒绝
              </Button>
            </>
          )}
          {record.approval_status !== 'pending' && (
            <Button type="link" icon={<EyeOutlined />} onClick={() => { setSelectedOrder(record); setModalVisible(true); }}>
              查看
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} className="page-header">医嘱审核</Title>

      <Card className="card-shadow">
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={selectedOrder?.approval_status === 'pending' ? '医嘱审核' : '审核详情'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedOrder && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>患者：</strong>{selectedOrder.patient_name}</p>
            <p><strong>药品：</strong>{selectedOrder.drug_name}</p>
            <p><strong>剂量：</strong>{selectedOrder.dosage} {selectedOrder.frequency}</p>
            <p><strong>超路径：</strong>{selectedOrder.is_off_pathway ? '是' : '否'}</p>
            <p><strong>医生：</strong>{selectedOrder.doctor_name}</p>
            {selectedOrder.doctor_note && <p><strong>医生备注：</strong>{selectedOrder.doctor_note}</p>}
          </div>
        )}
        {selectedOrder?.approval_status === 'pending' ? (
          <Form form={form} layout="vertical" onFinish={handleSubmitReview}>
            <Form.Item name="approval_status" label="审核结果" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="pharmacist_comment" label="药师意见" rules={[{ required: true }]}>
              <TextArea rows={4} placeholder="请输入审核意见" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">提交</Button>
                <Button onClick={() => setModalVisible(false)}>取消</Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <div>
            <p><strong>审核结果：</strong></p>
            <Tag color={selectedOrder?.approval_status === 'approved' ? 'green' : 'red'}>
              {selectedOrder?.approval_status === 'approved' ? '已通过' : '已拒绝'}
            </Tag>
            <p style={{ marginTop: 12 }}><strong>药师意见：</strong>{selectedOrder?.pharmacist_comment}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OrderReview
