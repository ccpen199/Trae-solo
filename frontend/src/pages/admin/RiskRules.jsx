import React, { useState, useEffect } from 'react'
import { Card, List, Tag, Button, Switch, Modal, Form, Input, Select, message, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import api from '../../utils/api'

const { Option } = Select

const AdminRiskRules = () => {
  const [rules, setRules] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    try {
      const res = await api.get('/admin/risk-rules')
      setRules(res.data)
    } catch (error) {
      message.error('加载风控规则失败')
    }
  }

  const handleToggleStatus = async (rule, checked) => {
    try {
      await api.post(`/admin/risk-rules/${rule.id}/status`, {
        status: checked ? 'active' : 'inactive'
      })
      message.success('状态更新成功')
      loadRules()
    } catch (error) {
      message.error('更新失败')
    }
  }

  const handleCreateRule = async (values) => {
    try {
      await api.post('/admin/risk-rules', values)
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      loadRules()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const typeMap = {
    order: '订单风控',
    user: '用户风控',
    merchant: '商户风控',
    payment: '支付风控'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>⚙️ 风控规则配置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建规则
        </Button>
      </div>
      
      <List
        dataSource={rules}
        renderItem={rule => (
          <List.Item
            style={{ background: '#fff', marginBottom: '16px', padding: '16px', borderRadius: '8px' }}
            actions={[
              <Switch
                checked={rule.status === 'active'}
                onChange={(checked) => handleToggleStatus(rule, checked)}
              />
            ]}
          >
            <List.Item.Meta
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{rule.name}</span>
                  <Tag color={rule.status === 'active' ? 'green' : 'default'}>
                    {rule.status === 'active' ? '已启用' : '已停用'}
                  </Tag>
                </div>
              }
              description={
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <Tag color="blue">{typeMap[rule.rule_type] || rule.rule_type}</Tag>
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>触发条件:</strong> {rule.condition}
                  </div>
                  <div>
                    <strong>执行动作:</strong> {rule.action}
                  </div>
                  <div style={{ color: '#999', marginTop: '8px' }}>
                    创建时间: {rule.created_at}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />

      {rules.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <p>暂无风控规则</p>
            <Button type="primary" style={{ marginTop: '16px' }} onClick={() => setModalVisible(true)}>
              创建第一条规则
            </Button>
          </div>
        </Card>
      )}

      <Modal
        title="新建风控规则"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleCreateRule} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
            <Input placeholder="例如: 大额订单风险检测" />
          </Form.Item>
          <Form.Item name="rule_type" label="规则类型" rules={[{ required: true }]}>
            <Select>
              <Option value="order">订单风控</Option>
              <Option value="user">用户风控</Option>
              <Option value="merchant">商户风控</Option>
              <Option value="payment">支付风控</Option>
            </Select>
          </Form.Item>
          <Form.Item name="condition" label="触发条件" rules={[{ required: true }]}>
            <Input.TextArea 
              rows={3} 
              placeholder="例如: 订单金额超过10000元且用户信用分低于600分" 
            />
          </Form.Item>
          <Form.Item name="action" label="执行动作" rules={[{ required: true }]}>
            <Input.TextArea 
              rows={2} 
              placeholder="例如: 自动标记为可疑订单并进入人工审核流程" 
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建规则</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminRiskRules
