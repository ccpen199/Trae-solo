import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Popconfirm, Typography } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { patientAPI } from '../api'

const { Title } = Typography
const { Option } = Select

const Patients: React.FC = () => {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentPatient, setCurrentPatient] = useState<any>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [form] = Form.useForm()

  useEffect(() => {
    loadList()
  }, [page, pageSize, keyword])

  const loadList = async () => {
    setLoading(true)
    try {
      const res = await patientAPI.list({ page, pageSize, keyword })
      setList(res.data.list)
      setTotal(res.data.total)
    } catch (error: any) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setCurrentPatient(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setCurrentPatient(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await patientAPI.delete(id)
      message.success('删除成功')
      loadList()
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      if (currentPatient) {
        await patientAPI.update(currentPatient.id, values)
        message.success('更新成功')
      } else {
        await patientAPI.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadList()
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const handleView = async (id: number) => {
    try {
      const res = await patientAPI.get(id)
      setCurrentPatient(res.data)
      setDetailVisible(true)
    } catch (error) {
      message.error('获取详情失败')
    }
  }

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '性别', dataIndex: 'gender', key: 'gender' },
    { title: '出生日期', dataIndex: 'birth_date', key: 'birth_date' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '身份证', dataIndex: 'id_card', key: 'id_card' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleView(record.id)}>详情</Button>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>患者管理</Title>
        <Space>
          <Input.Search
            placeholder="搜索患者姓名/电话"
            style={{ width: 250 }}
            onSearch={setKeyword}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增患者
          </Button>
        </Space>
      </div>

      <Table
        loading={loading}
        dataSource={list}
        columns={columns}
        rowKey="id"
        pagination={{
          total,
          current: page,
          pageSize,
          onChange: (p, ps) => { setPage(p); setPageSize(ps || 20) },
        }}
      />

      <Modal
        title={currentPatient ? '编辑患者' : '新增患者'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select>
              <Option value="男">男</Option>
              <Option value="女">女</Option>
            </Select>
          </Form.Item>
          <Form.Item name="birth_date" label="出生日期">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input />
          </Form.Item>
          <Form.Item name="id_card" label="身份证号">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input />
          </Form.Item>
          <Form.Item name="medical_history" label="口腔病史">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="allergies" label="过敏史">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="患者详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentPatient && (
          <div>
            <p><strong>姓名：</strong>{currentPatient.name}</p>
            <p><strong>性别：</strong>{currentPatient.gender}</p>
            <p><strong>电话：</strong>{currentPatient.phone}</p>
            <p><strong>身份证：</strong>{currentPatient.id_card}</p>
            <p><strong>口腔病史：</strong>{currentPatient.medical_history || '无'}</p>
            <p><strong>过敏史：</strong>{currentPatient.allergies || '无'}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Patients
