import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Select, InputNumber, DatePicker } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { adminAPI } from '../../utils/api'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

function Sessions() {
  const [list, setList] = useState([])
  const [cinemas, setCinemas] = useState([])
  const [movies, setMovies] = useState([])
  const [halls, setHalls] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const [selectedCinema, setSelectedCinema] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedCinema) {
      loadHalls(selectedCinema)
    }
  }, [selectedCinema])

  const loadData = async () => {
    try {
      const [s, c, m] = await Promise.all([
        adminAPI.sessions(),
        adminAPI.cinemas(),
        adminAPI.movies()
      ])
      setList(s || [])
      setCinemas(c || [])
      setMovies(m || [])
    } catch (e) {
      message.error('加载失败')
    }
  }

  const loadHalls = async cinemaId => {
    try {
      const data = await adminAPI.halls({ cinema_id: cinemaId })
      setHalls(data || [])
    } catch (e) {}
  }

  const handleSubmit = async values => {
    try {
      const data = {
        ...values,
        start_time: values.time[0].toISOString(),
        end_time: values.time[1].toISOString()
      }
      if (editingItem) {
        await adminAPI.updateSession(editingItem.id, data)
      } else {
        await adminAPI.createSession(data)
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
    { title: '影片', dataIndex: 'title', key: 'title' },
    { title: '影院', dataIndex: 'cinema_name', key: 'cinema_name' },
    { title: '影厅', dataIndex: 'hall_name', key: 'hall_name' },
    { title: '开始时间', dataIndex: 'start_time', key: 'start_time', render: v => dayjs(v).format('MM-DD HH:mm') },
    { title: '结束时间', dataIndex: 'end_time', key: 'end_time', render: v => dayjs(v).format('HH:mm') },
    { title: '版本', dataIndex: 'version', key: 'version' },
    { title: '价格', dataIndex: 'base_price', key: 'base_price', render: v => `¥${v}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: v => v === 1 ? '正常' : '取消' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => {
          setEditingItem(record)
          setSelectedCinema(record.cinema_id)
          form.setFieldsValue({
            ...record,
            time: [dayjs(record.start_time), dayjs(record.end_time)]
          })
          setModalVisible(true)
        }}>编辑</Button>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>场次管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingItem(null)
          setSelectedCinema(null)
          form.resetFields()
          setModalVisible(true)
        }}>新增场次</Button>
      </div>
      <Table columns={columns} dataSource={list} rowKey="id" />
      <Modal
        title={editingItem ? '编辑场次' : '新增场次'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="movie_id" label="影片" rules={[{ required: true }]}>
            <Select>
              {movies.map(m => <Option key={m.id} value={m.id}>{m.title}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="cinema_id" label="影院" rules={[{ required: true }]}>
            <Select onChange={setSelectedCinema}>
              {cinemas.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="hall_id" label="影厅" rules={[{ required: true }]}>
            <Select>
              {halls.map(h => <Option key={h.id} value={h.id}>{h.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="time" label="放映时间" rules={[{ required: true }]}>
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="version" label="版本">
            <Select>
              <Option value="2D">2D</Option>
              <Option value="3D">3D</Option>
              <Option value="IMAX">IMAX</Option>
              <Option value="IMAX 3D">IMAX 3D</Option>
            </Select>
          </Form.Item>
          <Form.Item name="language" label="语言">
            <Input />
          </Form.Item>
          <Form.Item name="base_price" label="基础票价" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select defaultValue={1}>
              <Option value={1}>正常</Option>
              <Option value={0}>取消</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Sessions
