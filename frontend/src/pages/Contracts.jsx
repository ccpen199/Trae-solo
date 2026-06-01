import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, InputNumber, DatePicker, Space, Tag, message, Row, Col } from 'antd'
import { PlusOutlined, RedoOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../utils/api'

const { Option } = Select
const { TextArea } = Input

export default function Contracts() {
  const [contracts, setContracts] = useState([])
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [renewModal, setRenewModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)
  const [form] = Form.useForm()
  const [renewForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [contractsData, companiesData] = await Promise.all([
        api.contracts(),
        api.companies()
      ])
      setContracts(contractsData)
      setCompanies(companiesData)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values) => {
    try {
      await api.createContract({
        ...values,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD')
      })
      message.success('合同创建成功')
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const handleRenew = async (values) => {
    try {
      await api.renewContract(selectedContract.id, {
        end_date: values.end_date.format('YYYY-MM-DD'),
        monthly_rent: values.monthly_rent
      })
      message.success('合同续约成功')
      setRenewModal(false)
      renewForm.resetFields()
      loadData()
    } catch (e) {
      let errorMsg = '操作失败'
      if (e.response?.data?.error) {
        errorMsg = e.response.data.error
      } else if (e.response?.data) {
        errorMsg = typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data)
      } else if (e.message) {
        errorMsg = e.message
      }
      message.error(errorMsg)
    }
  }

  const openRenewModal = (record) => {
    setSelectedContract(record)
    renewForm.setFieldsValue({
      monthly_rent: record.monthly_rent
    })
    setRenewModal(true)
  }

  const statusColors = { active: 'green', expired: 'red', terminated: 'gray', pending_renewal: 'orange' }
  const statusLabels = { active: '有效', expired: '已到期', terminated: '已终止', pending_renewal: '待续约' }

  const columns = [
    { title: '企业名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '套餐类型', dataIndex: 'package_type', key: 'package_type' },
    { title: '人数', dataIndex: 'member_count', key: 'member_count' },
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date' },
    { title: '到期日期', dataIndex: 'end_date', key: 'end_date', 
      render: (t, record) => record.expiring_soon ? <Tag color="orange">{t}</Tag> : t
    },
    { title: '月租金', dataIndex: 'monthly_rent', key: 'monthly_rent', render: v => `¥${v}` },
    { title: '押金', dataIndex: 'deposit', key: 'deposit', render: v => `¥${v}` },
    { title: '状态', dataIndex: 'status', key: 'status', 
      render: (s, record) => (
        <Space>
          <Tag color={statusColors[s]}>{statusLabels[s]}</Tag>
          {record.expiring_soon && <Tag color="warning">即将到期</Tag>}
        </Space>
      )
    },
    { title: '操作', key: 'action', render: (_, record) => (
      record.status === 'active' && (
        <Button type="link" icon={<RedoOutlined />} onClick={() => openRenewModal(record)}>续约</Button>
      )
    )}
  ]

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col><h2>合同管理</h2></Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新建合同</Button>
        </Col>
      </Row>

      <Table
        dataSource={contracts}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal title="新建合同" open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="company_id" label="企业" rules={[{ required: true }]}>
            <Select>
              {companies.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="package_type" label="套餐类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="灵活套餐">灵活套餐</Option>
                  <Option value="企业套餐">企业套餐</Option>
                  <Option value="VIP套餐">VIP套餐</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="member_count" label="会员人数" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_date" label="开始日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label="结束日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="monthly_rent" label="月租金" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} addonBefore="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deposit" label="押金">
                <InputNumber min={0} style={{ width: '100%' }} addonBefore="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="benefits" label="权益">
            <Input placeholder="如: 24小时门禁,免费咖啡,打印折扣" />
          </Form.Item>
          <Form.Item name="invoice_info" label="发票信息">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="合同续约" open={renewModal} onCancel={() => setRenewModal(false)} footer={null}>
        <Form form={renewForm} layout="vertical" onFinish={handleRenew}>
          <Form.Item label="当前到期日期">
            <Input disabled value={selectedContract?.end_date} />
          </Form.Item>
          <Form.Item
            name="end_date"
            label="新到期日期"
            rules={[
              { required: true, message: '请选择新到期日期' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || !selectedContract) {
                    return Promise.resolve()
                  }
                  if (value.isAfter(dayjs(selectedContract.end_date), 'day')) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('新到期日期必须晚于当前到期日期'))
                }
              })
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) => current && current <= dayjs(selectedContract?.end_date).endOf('day')}
            />
          </Form.Item>
          <Form.Item name="monthly_rent" label="月租金" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} addonBefore="¥" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认续约</Button>
              <Button onClick={() => setRenewModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
