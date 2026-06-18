import { useState } from 'react'
import { Table, Card, Button, Space, Input, Select, Tag, Modal, Form, message, Row, Col, Statistic } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Pile } from '@/types'
import { formatDateTime } from '@/utils'

const statusMap: Record<string, { color: string; text: string }> = {
  idle: { color: 'green', text: '空闲' },
  charging: { color: 'blue', text: '充电中' },
  offline: { color: 'default', text: '离线' },
  fault: { color: 'red', text: '故障' }
}

const typeMap: Record<string, { color: string; text: string }> = {
  dc: { color: 'blue', text: '直流桩' },
  ac: { color: 'green', text: '交流桩' }
}

const mockData: Pile[] = [
  { id: '1', name: 'A001', stationId: '1', stationName: '浦东充电站', power: 120, type: 'dc', status: 'charging', createTime: '2024-01-15 10:00:00' },
  { id: '2', name: 'A002', stationId: '1', stationName: '浦东充电站', power: 120, type: 'dc', status: 'idle', createTime: '2024-01-15 10:00:00' },
  { id: '3', name: 'B001', stationId: '2', stationName: '虹桥充电站', power: 7, type: 'ac', status: 'fault', createTime: '2024-02-20 14:30:00' },
  { id: '4', name: 'B002', stationId: '2', stationName: '虹桥充电站', power: 120, type: 'dc', status: 'charging', createTime: '2024-02-20 14:30:00' },
  { id: '5', name: 'C001', stationId: '3', stationName: '徐汇充电站', power: 7, type: 'ac', status: 'offline', createTime: '2024-03-10 09:00:00' },
  { id: '6', name: 'C002', stationId: '3', stationName: '徐汇充电站', power: 60, type: 'dc', status: 'idle', createTime: '2024-03-10 09:00:00' }
]

function Pile() {
  const [data, setData] = useState<Pile[]>(mockData)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Pile | null>(null)
  const [form] = Form.useForm()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [stationId, setStationId] = useState<string | undefined>()

  const columns: ColumnsType<Pile> = [
    { title: '桩编号', dataIndex: 'name', key: 'name' },
    { title: '所属场站', dataIndex: 'stationName', key: 'stationName' },
    { title: '功率(kW)', dataIndex: 'power', key: 'power' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const info = typeMap[type]
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status]
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', render: (t) => formatDateTime(t) },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      )
    }
  ]

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => {
      let filtered = mockData
      if (keyword) {
        filtered = filtered.filter((item) => item.name.includes(keyword))
      }
      if (status) {
        filtered = filtered.filter((item) => item.status === status)
      }
      if (stationId) {
        filtered = filtered.filter((item) => item.stationId === stationId)
      }
      setData(filtered)
      setLoading(false)
    }, 300)
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Pile) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = (record: Pile) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除充电桩"${record.name}"吗？`,
      onOk: () => {
        setData(data.filter((item) => item.id !== record.id))
        message.success('删除成功')
      }
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        setData(data.map((item) => (item.id === editingRecord.id ? { ...item, ...values } : item)))
        message.success('更新成功')
      } else {
        const newItem: Pile = {
          ...values,
          id: String(Date.now()),
          createTime: new Date().toISOString()
        }
        setData([newItem, ...data])
        message.success('创建成功')
      }
      setModalVisible(false)
    } catch {
      //
    }
  }

  const statistics = {
    total: data.length,
    online: data.filter((item) => item.status !== 'offline').length,
    charging: data.filter((item) => item.status === 'charging').length,
    fault: data.filter((item) => item.status === 'fault').length
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="充电桩总数" value={statistics.total} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="在线桩数" value={statistics.online} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="充电中" value={statistics.charging} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="故障桩" value={statistics.fault} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索桩编号"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="选择场站"
            style={{ width: 180 }}
            allowClear
            value={stationId}
            onChange={setStationId}
            options={[
              { value: '1', label: '浦东充电站' },
              { value: '2', label: '虹桥充电站' },
              { value: '3', label: '徐汇充电站' }
            ]}
          />
          <Select
            placeholder="选择状态"
            style={{ width: 150 }}
            allowClear
            value={status}
            onChange={setStatus}
            options={[
              { value: 'idle', label: '空闲' },
              { value: 'charging', label: '充电中' },
              { value: 'offline', label: '离线' },
              { value: 'fault', label: '故障' }
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增充电桩
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            total: data.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑充电桩' : '新增充电桩'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="桩编号" rules={[{ required: true, message: '请输入桩编号' }]}>
            <Input placeholder="请输入桩编号" />
          </Form.Item>
          <Form.Item name="stationId" label="所属场站" rules={[{ required: true, message: '请选择场站' }]}>
            <Select
              placeholder="请选择场站"
              options={[
                { value: '1', label: '浦东充电站' },
                { value: '2', label: '虹桥充电站' },
                { value: '3', label: '徐汇充电站' }
              ]}
            />
          </Form.Item>
          <Form.Item name="power" label="功率(kW)" rules={[{ required: true, message: '请输入功率' }]}>
            <Input type="number" placeholder="请输入功率" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select
              placeholder="请选择类型"
              options={[
                { value: 'dc', label: '直流桩' },
                { value: 'ac', label: '交流桩' }
              ]}
            />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              placeholder="请选择状态"
              options={[
                { value: 'idle', label: '空闲' },
                { value: 'charging', label: '充电中' },
                { value: 'offline', label: '离线' },
                { value: 'fault', label: '故障' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Pile
