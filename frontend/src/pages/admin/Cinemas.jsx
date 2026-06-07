import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Switch, Select } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { adminAPI } from '../../utils/api'

const { Option } = Select

function Cinemas() {
  const [list, setList] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await adminAPI.cinemas()
      setList(data || [])
    } catch (e) {
      message.error('加载失败')
    }
  }

  const handleSubmit = async values => {
    try {
      if (editingItem) {
        await adminAPI.updateCinema(editingItem.id, values)
      } else {
        await adminAPI.createCinema(values)
      }
      message.success('保存成功')
      setModalVisible(false)
      loadData()
    } catch (e) {
      message.error('保存失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '影院名称', dataIndex: 'name', key: 'name' },
    { title: '城市', dataIndex: 'city', key: 'city' },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
    { title: '厅数', dataIndex: 'hall_count', key: 'hall_count' },
    { title: '设备类型', dataIndex: 'equipment_types', key: 'equipment_types' },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => v === 1 ? '启用' : '禁用' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => {
          setEditingItem(record)
          form.setFieldsValue(record)
          setModalVisible(true)
        }}>编辑</Button>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>影院管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingItem(null)
          form.resetFields()
          setModalVisible(true)
        }}>新增影院</Button>
      </div>
      <Table columns={columns} dataSource={list} rowKey="id" />
      <Modal
        title={editingItem ? '编辑影院' : '新增影院'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="影院名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="city" label="城市" rules={[{ required: true }]}>
            <Select>
              <Option value="北京">北京</Option>
              <Option value="上海">上海</Option>
              <Option value="广州">广州</Option>
              <Option value="深圳">深圳</Option>
              <Option value="杭州">杭州</Option>
            </Select>
          </Form.Item>
          <Form.Item name="province" label="省份" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="latitude" label="纬度">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="longitude" label="经度">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="hall_count" label="影厅数量">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="equipment_types" label="设备类型（逗号分隔）">
            <Input placeholder="如：IMAX,DOLBY,3D" />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Cinemas
