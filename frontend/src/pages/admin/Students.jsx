import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, message, Space, Upload, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, UploadOutlined, SyncOutlined } from '@ant-design/icons'
import { studentAPI } from '../../utils/api.js'

function AdminStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [modalVisible, setModalVisible] = useState(false)
  const [syncModalVisible, setSyncModalVisible] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [form] = Form.useForm()
  const [isEdit, setIsEdit] = useState(false)

  const departments = ['计算机学院', '电子工程学院', '机械工程学院', '经济管理学院', '外国语学院']

  useEffect(() => {
    loadStudents()
  }, [pagination.current, pagination.pageSize])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const response = await studentAPI.getStudents({
        page: pagination.current,
        pageSize: pagination.pageSize,
      })
      setStudents(response.data.students)
      setPagination(p => ({ ...p, total: response.data.total }))
    } catch (error) {
      message.error('加载学生列表失败')
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
    setSelectedStudent(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async (values) => {
    try {
      if (isEdit) {
        await studentAPI.updateStudent(selectedStudent.student_id, values)
        message.success('更新成功')
      } else {
        await studentAPI.createStudent(values)
        message.success('创建学生账户成功')
      }
      setModalVisible(false)
      loadStudents()
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const handleSyncAcademic = async (values) => {
    try {
      await studentAPI.syncAcademic(values)
      message.success('同步成功')
      setSyncModalVisible(false)
      loadStudents()
    } catch (error) {
      message.error('同步失败')
    }
  }

  const columns = [
    {
      title: '学号',
      dataIndex: 'student_id',
      key: 'student_id',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '学院',
      dataIndex: 'department',
      key: 'department',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (text) => `¥${text?.toFixed(2) || '0.00'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          active: 'success',
          inactive: 'default',
          graduated: 'orange',
        }
        const textMap = {
          active: '正常',
          inactive: '停用',
          graduated: '已毕业',
        }
        return <Tag color={colorMap[status]}>{textMap[status] || status}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>学生管理</h2>
        <div>
          <Button icon={<SyncOutlined />} onClick={() => setSyncModalVisible(true)} style={{ marginRight: 8 }}>
            教务同步
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加学生
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={students}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize })),
        }}
      />

      <Modal
        title={isEdit ? '编辑学生' : '添加学生'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="student_id"
                label="学号"
                rules={[{ required: true, message: '请输入学号' }]}
              >
                <Input placeholder="请输入学号" disabled={isEdit} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="department"
            label="学院"
            rules={[{ required: true, message: '请选择学院' }]}
          >
            <Select>
              {departments.map(d => (
                <Select.Option key={d} value={d}>{d}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="bluetooth_address"
                label="蓝牙地址"
              >
                <Input placeholder="AA:BB:CC:DD:EE:FF" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nfc_card_id"
                label="NFC卡号"
              >
                <Input placeholder="NFC卡号" />
              </Form.Item>
            </Col>
          </Row>
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

      <Modal
        title="教务系统同步"
        open={syncModalVisible}
        onCancel={() => setSyncModalVisible(false)}
        footer={null}
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          <p>支持导入新生名单和毕业离校名单，批量更新学生账户。</p>
        </div>
        <Form
          layout="vertical"
          onFinish={handleSyncAcademic}
        >
          <Form.Item label="上传新生名单">
            <Upload
              beforeUpload={() => false}
              accept=".xlsx,.xls,.csv"
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="上传毕业离校名单">
            <Upload
              beforeUpload={() => false}
              accept=".xlsx,.xls,.csv"
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => setSyncModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              同步
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminStudents
