import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Space, Modal, Form, Input, Select, message } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { ruleAPI } from '../utils/api'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

function RuleConfig({ user }) {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    setLoading(true)
    try {
      const response = await ruleAPI.list()
      setRules(response.data)
    } catch (error) {
      message.error('加载规则配置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values) => {
    try {
      await ruleAPI.create({
        ...values,
        content: JSON.parse(values.content)
      })
      message.success('规则创建成功')
      setModalVisible(false)
      form.resetFields()
      loadRules()
    } catch (error) {
      message.error('创建失败，请检查JSON格式')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '规则类型',
      dataIndex: 'rule_type',
      key: 'rule_type',
      width: 120
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (active) => active ? <Tag color="success">启用中</Tag> : <Tag color="default">已停用</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: () => (
        <Space>
          <Button size="small" icon={<EyeOutlined />}>查看</Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>规则配置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建规则
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新建规则"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="rule_type" label="规则类型" rules={[{ required: true }]}>
            <Select>
              <Option value="task_flow">任务流程</Option>
              <Option value="permission">权限配置</Option>
              <Option value="qa">问答配置</Option>
            </Select>
          </Form.Item>
          <Form.Item name="version" label="版本号" rules={[{ required: true }]}>
            <Input placeholder="例如: 1.0" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input placeholder="规则描述" />
          </Form.Item>
          <Form.Item name="content" label="规则内容 (JSON)" rules={[{ required: true }]}>
            <TextArea rows={8} placeholder='{"key": "value"}' />
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

export default RuleConfig
