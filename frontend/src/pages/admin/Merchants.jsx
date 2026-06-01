import React, { useState, useEffect } from 'react'
import { Card, List, Tag, Button, Select, Modal, Form, Input, message, Space } from 'antd'
import api from '../../utils/api'

const { Option } = Select

const statusMap = {
  pending: { text: '待审核', color: 'orange' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已拒绝', color: 'red' }
}

const AdminMerchants = () => {
  const [merchants, setMerchants] = useState([])
  const [status, setStatus] = useState('pending')
  const [auditModalVisible, setAuditModalVisible] = useState(false)
  const [currentMerchant, setCurrentMerchant] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadMerchants()
  }, [status])

  const loadMerchants = async () => {
    try {
      const res = await api.get('/merchants/admin/list', { params: { status } })
      setMerchants(res.data.list)
    } catch (error) {
      message.error('加载商户列表失败')
    }
  }

  const handleAudit = (merchant) => {
    setCurrentMerchant(merchant)
    setAuditModalVisible(true)
    form.resetFields()
  }

  const handleSubmitAudit = async (values) => {
    try {
      await api.post(`/merchants/admin/audit/${currentMerchant.id}`, values)
      message.success('审核完成')
      setAuditModalVisible(false)
      loadMerchants()
    } catch (error) {
      message.error('审核失败')
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>🏪 商户审核管理</h2>
      
      <Card style={{ marginBottom: '16px' }}>
        <Space>
          <Select
            value={status}
            onChange={setStatus}
            style={{ width: 150 }}
          >
            <Option value="pending">待审核</Option>
            <Option value="approved">已通过</Option>
            <Option value="rejected">已拒绝</Option>
          </Select>
        </Space>
      </Card>

      <List
        dataSource={merchants}
        renderItem={merchant => (
          <List.Item
            style={{ background: '#fff', marginBottom: '16px', padding: '16px', borderRadius: '8px' }}
            actions={[
              status === 'pending' && (
                <Button type="primary" onClick={() => handleAudit(merchant)}>
                  审核
                </Button>
              )
            ].filter(Boolean)}
          >
            <List.Item.Meta
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{merchant.name}</span>
                  <Tag color={statusMap[merchant.status]?.color}>
                    {statusMap[merchant.status]?.text}
                  </Tag>
                </div>
              }
              description={
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <span>业务域: {merchant.business_domain}</span>
                    <span style={{ marginLeft: '16px' }}>联系电话: {merchant.phone}</span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>地址: {merchant.address}</div>
                  {merchant.qualification && (
                    <div style={{ color: '#666' }}>资质信息: {merchant.qualification}</div>
                  )}
                  <div style={{ color: '#999', marginTop: '8px' }}>
                    申请时间: {merchant.created_at}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title="商户审核"
        open={auditModalVisible}
        onCancel={() => setAuditModalVisible(false)}
        footer={null}
      >
        {currentMerchant && (
          <div style={{ marginBottom: '16px' }}>
            <p><strong>商户名称:</strong> {currentMerchant.name}</p>
            <p><strong>业务域:</strong> {currentMerchant.business_domain}</p>
            <p><strong>资质信息:</strong> {currentMerchant.qualification || '无'}</p>
          </div>
        )}
        <Form form={form} onFinish={handleSubmitAudit} layout="vertical">
          <Form.Item name="status" label="审核结果" rules={[{ required: true }]}>
            <Select>
              <Option value="approved">通过</Option>
              <Option value="rejected">拒绝</Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="审核意见">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="ocr_result" label="OCR识别结果(模拟)">
            <Input.TextArea rows={2} placeholder='模拟OCR识别结果，如: {"business_license": "xxx"}' />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认审核</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminMerchants
