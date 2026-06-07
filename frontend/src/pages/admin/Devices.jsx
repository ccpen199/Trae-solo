import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Modal, Form, Input, Select, message, Space, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { deviceAPI } from '../../utils/api.js'

function AdminDevices() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [modalVisible, setModalVisible] = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [realtimeData, setRealtimeData] = useState([])
  const [form] = Form.useForm()
  const [isEdit, setIsEdit] = useState(false)

  const buildings = ['一号楼', '二号楼', '三号楼', '图书馆']

  useEffect(() => {
    loadDevices()
  }, [pagination.current, pagination.pageSize])

  const loadDevices = async () => {
    setLoading(true)
    try {
      const response = await deviceAPI.getDevices({
        page: pagination.current,
        pageSize: pagination.pageSize,
      })
      setDevices(response.data.devices)
      setPagination(p => ({ ...p, total: response.data.total }))
    } catch (error) {
      message.error('加载设备列表失败')
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
    setSelectedDevice(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该设备吗？',
      onOk: async () => {
        try {
          await deviceAPI.deleteDevice(id)
          message.success('删除成功')
          loadDevices()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleViewDetail = async (record) => {
    setSelectedDevice(record)
    try {
      const response = await deviceAPI.getRealtimeData(record.id)
      setRealtimeData(response.data)
    } catch (error) {
      console.error('加载实时数据失败')
    }
    setDetailModal(true)
  }

  const handleSubmit = async (values) => {
    try {
      if (isEdit) {
        await deviceAPI.updateDevice(selectedDevice.id, values)
        message.success('更新成功')
      } else {
        await deviceAPI.createDevice(values)
        message.success('创建设备成功')
      }
      setModalVisible(false)
      loadDevices()
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const columns = [
    {
      title: '设备ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '楼宇',
      dataIndex: 'building',
      key: 'building',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '楼层',
      dataIndex: 'floor',
      key: 'floor',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          online: 'success',
          offline: 'default',
          running: 'processing',
        }
        const textMap = {
          online: '在线',
          offline: '离线',
          running: '使用中',
        }
        return <Tag color={colorMap[status]}>{textMap[status] || status}</Tag>
      },
    },
    {
      title: '最后在线',
      dataIndex: 'last_online',
      key: 'last_online',
      render: (text) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>设备管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加设备
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={devices}
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
        title={isEdit ? '编辑设备' : '添加设备'}
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
                name="id"
                label="设备ID"
                rules={[{ required: true, message: '请输入设备ID' }]}
              >
                <Input placeholder="例如：DEV0001" disabled={isEdit} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="设备名称"
                rules={[{ required: true, message: '请输入设备名称' }]}
              >
                <Input placeholder="例如：水控终端-001" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="building"
                label="所属楼宇"
                rules={[{ required: true, message: '请选择楼宇' }]}
              >
                <Select>
                  {buildings.map(b => (
                    <Select.Option key={b} value={b}>{b}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="floor"
                label="楼层"
                rules={[{ required: true, message: '请输入楼层' }]}
              >
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="location"
            label="具体位置"
            rules={[{ required: true, message: '请输入具体位置' }]}
          >
            <Input placeholder="例如：1层浴室" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="bluetooth_mac"
                label="蓝牙MAC地址"
              >
                <Input placeholder="AA:BB:CC:DD:EE:FF" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nfc_id"
                label="NFC ID"
              >
                <Input placeholder="NFC设备ID" />
              </Form.Item>
            </Col>
          </Row>
          {isEdit && (
            <Form.Item
              name="status"
              label="设备状态"
            >
              <Select>
                <Select.Option value="online">在线</Select.Option>
                <Select.Option value="offline">离线</Select.Option>
              </Select>
            </Form.Item>
          )}
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
        title="设备详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>关闭</Button>,
        ]}
        width={800}
      >
        {selectedDevice && (
          <div>
            <p><strong>设备ID：</strong>{selectedDevice.id}</p>
            <p><strong>设备名称：</strong>{selectedDevice.name}</p>
            <p><strong>位置：</strong>{selectedDevice.location}</p>
            <p><strong>状态：</strong>{selectedDevice.status}</p>
            <p><strong>蓝牙MAC：</strong>{selectedDevice.bluetooth_mac || '-'}</p>
            <p><strong>NFC ID：</strong>{selectedDevice.nfc_id || '-'}</p>
            
            <h4 style={{ marginTop: 16 }}>最近实时数据</h4>
            <Table
              size="small"
              dataSource={realtimeData.slice(0, 10)}
              rowKey="id"
              columns={[
                { title: '时间', dataIndex: 'timestamp', render: t => new Date(t).toLocaleTimeString() },
                { title: '水温(°C)', dataIndex: 'temperature' },
                { title: '流速(L/min)', dataIndex: 'flow_rate' },
                { title: '累计量(L)', dataIndex: 'cumulative_volume' },
              ]}
              pagination={false}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminDevices
