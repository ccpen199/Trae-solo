import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Switch, message, Space, Card, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { pricingAPI } from '../../utils/api.js'

function AdminPricing() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedRule, setSelectedRule] = useState(null)
  const [form] = Form.useForm()
  const [isEdit, setIsEdit] = useState(false)

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    setLoading(true)
    try {
      const response = await pricingAPI.getPricingRules()
      setRules(response.data)
    } catch (error) {
      message.error('加载资费规则失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setIsEdit(false)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setIsEdit(true)
    setSelectedRule(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该资费规则吗？',
      onOk: async () => {
        try {
          await pricingAPI.deletePricing(id)
          message.success('删除成功')
          loadRules()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleSubmit = async (values) => {
    try {
      if (isEdit) {
        await pricingAPI.updatePricing(selectedRule.id, values)
        message.success('更新成功')
      } else {
        await pricingAPI.createPricing(values)
        message.success('创建规则成功')
      }
      setModalVisible(false)
      loadRules()
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span>
          {text}
          {record.is_active && <Tag color="green" style={{ marginLeft: 8 }}>当前生效</Tag>}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const textMap = {
          standard: '标准计费',
          tiered: '阶梯水价',
        }
        return <Tag color="blue">{textMap[type] || type}</Tag>
      },
    },
    {
      title: '基础水价',
      dataIndex: 'base_price',
      key: 'base_price',
      render: (text) => `¥${text}/L`,
    },
    {
      title: '夜间优惠',
      key: 'night',
      render: (_, record) => (
        <span>{record.night_start_hour}:00 - {record.night_end_hour}:00 {(record.night_discount * 100).toFixed(0)}%</span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {!record.is_active && (
            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>资费配置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建规则
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={rules}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={isEdit ? '编辑资费规则' : '新建资费规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'tiered',
            base_price: 0.05,
            night_start_hour: 22,
            night_end_hour: 6,
            night_discount: 0.7,
            tier1_limit: 50,
            tier1_price: 0.05,
            tier2_limit: 100,
            tier2_price: 0.08,
            tier3_price: 0.12,
            is_active: true,
          }}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="规则名称"
                rules={[{ required: true, message: '请输入规则名称' }]}
              >
                <Input placeholder="例如：2024年春季资费" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="type"
                label="计费类型"
              >
                <Select>
                  <Select.Option value="standard">标准计费</Select.Option>
                  <Select.Option value="tiered">阶梯水价</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Card title="基础配置" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="base_price"
                  label="基础水价(元/L)"
                  rules={[{ required: true, message: '请输入基础水价' }]}
                >
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="阶梯水价配置" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="tier1_limit"
                  label="第一档上限(L)"
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="tier1_price"
                  label="第一档价格(元/L)"
                >
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="tier2_limit"
                  label="第二档上限(L)"
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="tier2_price"
                  label="第二档价格(元/L)"
                >
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="tier3_price"
                  label="第三档价格(元/L)"
                >
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="夜间优惠" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="night_start_hour"
                  label="优惠开始(时)"
                >
                  <InputNumber min={0} max={23} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="night_end_hour"
                  label="优惠结束(时)"
                >
                  <InputNumber min={0} max={23} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="night_discount"
                  label="折扣(%)"
                >
                  <InputNumber min={0} max={100} formatter={v => `${v * 100}`} parser={v => v / 100} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item
            name="is_active"
            label="设为当前生效规则"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminPricing
