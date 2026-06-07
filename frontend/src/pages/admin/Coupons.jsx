import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Select, InputNumber, DatePicker } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { adminAPI } from '../../utils/api'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

function Coupons() {
  const [list, setList] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await adminAPI.coupons()
      setList(data || [])
    } catch (e) {
      message.error('加载失败')
    }
  }

  const handleSubmit = async values => {
    try {
      const data = {
        ...values,
        valid_from: values.valid_time?.[0]?.toISOString(),
        valid_to: values.valid_time?.[1]?.toISOString()
      }
      await adminAPI.createCoupon(data)
      message.success('创建成功')
      setModalVisible(false)
      loadData()
    } catch (e) {
      message.error('创建失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: v => v === 'fixed' ? '满减' : '折扣' },
    { title: '面值', dataIndex: 'value', key: 'value', render: v => `¥${v}` },
    { title: '门槛', dataIndex: 'min_amount', key: 'min_amount', render: v => `满¥${v}` },
    { title: '总数', dataIndex: 'total_count', key: 'total_count' },
    { title: '已使用', dataIndex: 'used_count', key: 'used_count' },
    { title: '有效期', key: 'valid', render: (_, r) => `${dayjs(r.valid_from).format('MM-DD')} ~ ${dayjs(r.valid_to).format('MM-DD')}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => v === 1 ? '启用' : '禁用' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>优惠券管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          form.resetFields()
          setModalVisible(true)
        }}>新增优惠券</Button>
      </div>
      <Table columns={columns} dataSource={list} rowKey="id" />
      <Modal
        title="新增优惠券"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="如：新用户立减券" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select>
              <Option value="fixed">满减</Option>
              <Option value="percent">折扣</Option>
            </Select>
          </Form.Item>
          <Form.Item name="value" label="面值" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="min_amount" label="使用门槛" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="total_count" label="发放数量" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="valid_time" label="有效期" rules={[{ required: true }]}>
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Coupons
