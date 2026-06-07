import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Switch, InputNumber } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { adminAPI } from '../../utils/api'
import MoviePoster from '../../components/MoviePoster'

function Movies() {
  const [list, setList] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await adminAPI.movies()
      setList(data || [])
    } catch (e) {
      message.error('加载失败')
    }
  }

  const handleSubmit = async values => {
    try {
      if (editingItem) {
        await adminAPI.updateMovie(editingItem.id, values)
      } else {
        await adminAPI.createMovie(values)
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
    {
      title: '海报',
      dataIndex: 'poster',
      key: 'poster',
      width: 80,
      render: (_, record) => <MoviePoster movie={record} height={68} compact style={{ width: 50, borderRadius: 4 }} />
    },
    { title: '片名', dataIndex: 'title', key: 'title' },
    { title: '评分', dataIndex: 'rating', key: 'rating' },
    { title: '时长', dataIndex: 'duration', key: 'duration', render: v => `${v}分钟` },
    { title: '国家', dataIndex: 'country', key: 'country' },
    { title: '版本', dataIndex: 'versions', key: 'versions' },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => v === 1 ? '上映中' : '下映' },
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
        <h2>影片管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingItem(null)
          form.resetFields()
          setModalVisible(true)
        }}>新增影片</Button>
      </div>
      <Table columns={columns} dataSource={list} rowKey="id" />
      <Modal
        title={editingItem ? '编辑影片' : '新增影片'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="片名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="original_title" label="原名">
            <Input />
          </Form.Item>
          <Form.Item name="poster" label="海报URL">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="简介">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="duration" label="时长（分钟）" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="release_date" label="上映日期">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="country" label="国家/地区">
            <Input />
          </Form.Item>
          <Form.Item name="language" label="语言">
            <Input />
          </Form.Item>
          <Form.Item name="versions" label="版本（逗号分隔）">
            <Input placeholder="如：2D,3D,IMAX" />
          </Form.Item>
          <Form.Item name="rating" label="评分">
            <InputNumber step={0.1} min={0} max={10} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="trailer_url" label="预告片URL">
            <Input />
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

export default Movies
