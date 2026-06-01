import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Switch,
  message,
  Row,
  Col
} from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'

const API_BASE = '/api'

const Configurations = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()
  const [categories, setCategories] = useState([])
  const [filterType, setFilterType] = useState('')

  const configTypes = {
    category_rule: { text: '分类规则', color: 'blue' },
    owner: { text: '责任人', color: 'green' },
    permission: { text: '权限配置', color: 'purple' },
    valid_period: { text: '有效期', color: 'orange' },
    status: { text: '状态管理', color: 'red' }
  }

  useEffect(() => {
    loadData()
    loadCategories()
  }, [filterType])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/configurations`, { params: { config_type: filterType || undefined } })
      setData(res.data.data || [])
    } catch (e) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/categories`)
      setCategories(res.data.data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = {
        ...values,
        valid_from: values.valid_period?.[0]?.format('YYYY-MM-DD'),
        valid_to: values.valid_period?.[1]?.format('YYYY-MM-DD'),
        is_enabled: values.is_enabled ? 1 : 0,
        created_by: 'user_001',
        updated_by: 'user_001'
      }

      if (editingId) {
        await axios.put(`${API_BASE}/configurations/${editingId}`, payload)
        message.success('更新成功')
      } else {
        await axios.post(`${API_BASE}/configurations`, payload)
        message.success('创建成功')
      }

      setModalVisible(false)
      setEditingId(null)
      loadData()
    } catch (e) {
      message.error(e.response?.data?.error || '操作失败')
    }
  }

  const toggleStatus = async (record) => {
    try {
      await axios.put(`${API_BASE}/configurations/${record.id}`, {
        config_value: record.config_value,
        is_enabled: !record.is_enabled,
        updated_by: 'user_001'
      })
      message.success('状态更新成功')
      loadData()
    } catch (e) {
      message.error(e.response?.data?.error || '操作失败')
    }
  }

  const columns = [
    { title: '配置键', dataIndex: 'config_key', width: 200 },
    { title: '配置值', dataIndex: 'config_value' },
    {
      title: '类型',
      dataIndex: 'config_type',
      width: 120,
      render: t => <Tag color={configTypes[t]?.color}>{configTypes[t]?.text}</Tag>
    },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '有效期',
      width: 200,
      render: (_, r) => r.valid_from ? `${r.valid_from} ~ ${r.valid_to || '永久'}` : '-'
    },
    {
      title: '状态',
      width: 100,
      render: (_, r) => (
        <Switch
          checked={!!r.is_enabled}
          onChange={() => toggleStatus(r)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    {
      title: '操作',
      width: 100,
      render: (_, r) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => {
            setEditingId(r.id)
            form.setFieldsValue({
              ...r,
              valid_period: r.valid_from ? [dayjs(r.valid_from), dayjs(r.valid_to)] : undefined
            })
            setModalVisible(true)
          }}
        >
          编辑
        </Button>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">系统配置</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingId(null)
            form.resetFields()
            setModalVisible(true)
          }}
        >
          新增配置
        </Button>
      </div>

      <Card>
        <Row style={{ marginBottom: 16 }}>
          <Space>
            <span>类型筛选：</span>
            <Select
              style={{ width: 150 }}
              allowClear
              placeholder="全部类型"
              value={filterType || undefined}
              onChange={setFilterType}
              options={Object.entries(configTypes).map(([k, v]) => ({ value: k, label: v.text }))}
            />
          </Space>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑配置' : '新增配置'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="config_key"
            label="配置键"
            rules={[{ required: true, message: '请输入配置键' }]}
          >
            <Input placeholder="例如: price_deviation_threshold" disabled={!!editingId} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="config_type"
                label="配置类型"
                rules={[{ required: true }]}
              >
                <Select
                  options={Object.entries(configTypes).map(([k, v]) => ({ value: k, label: v.text }))}
                  disabled={!!editingId}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="is_enabled"
                label="是否启用"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="config_value"
            label="配置值"
            rules={[{ required: true, message: '请输入配置值' }]}
          >
            <Input.TextArea rows={3} placeholder="配置值内容" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="配置说明" />
          </Form.Item>

          <Form.Item name="category_id" label="关联品类">
            <Select
              allowClear
              options={categories.map(c => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>

          <Form.Item name="valid_period" label="有效期">
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Configurations
