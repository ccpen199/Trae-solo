import { useState } from 'react'
import { Table, Card, Button, Space, Input, Select, Tag, Modal, Form, message, Drawer, Descriptions } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Operator } from '@/types'
import { formatDateTime } from '@/utils'

const statusMap: Record<string, { color: string; text: string }> = {
  active: { color: 'green', text: '运营中' },
  inactive: { color: 'default', text: '已停用' }
}

const mockData: Operator[] = [
  { id: '1', name: '国网电动', contact: '王经理', phone: '138****0001', stationCount: 15, status: 'active', createTime: '2023-01-15 10:00:00' },
  { id: '2', name: '特来电', contact: '李经理', phone: '139****0002', stationCount: 23, status: 'active', createTime: '2023-03-20 14:30:00' },
  { id: '3', name: '星星充电', contact: '张经理', phone: '137****0003', stationCount: 12, status: 'active', createTime: '2023-05-10 09:00:00' },
  { id: '4', name: '云快充', contact: '刘经理', phone: '136****0004', stationCount: 8, status: 'inactive', createTime: '2023-08-05 16:00:00' },
  { id: '5', name: '小桔充电', contact: '陈经理', phone: '135****0005', stationCount: 18, status: 'active', createTime: '2023-11-12 11:00:00' }
]

function Operator() {
  const [data, setData] = useState<Operator[]>(mockData)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Operator | null>(null)
  const [currentRecord, setCurrentRecord] = useState<Operator | null>(null)
  const [form] = Form.useForm()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string | undefined>()

  const columns: ColumnsType<Operator> = [
    { title: '运营商名称', dataIndex: 'name', key: 'name' },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: '联系电话', dataIndex: 'phone', key: 'phone' },
    { title: '充电站数', dataIndex: 'stationCount', key: 'stationCount' },
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
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            详情
          </Button>
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
        filtered = filtered.filter(
          (item) => item.name.includes(keyword) || item.contact.includes(keyword)
        )
      }
      if (status) {
        filtered = filtered.filter((item) => item.status === status)
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

  const handleEdit = (record: Operator) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleView = (record: Operator) => {
    setCurrentRecord(record)
    setDetailVisible(true)
  }

  const handleDelete = (record: Operator) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除运营商"${record.name}"吗？`,
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
        const newItem: Operator = {
          ...values,
          id: String(Date.now()),
          stationCount: 0,
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
    active: data.filter((item) => item.status === 'active').length,
    totalStations: data.reduce((sum, item) => sum + item.stationCount, 0)
  }

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索运营商名称/联系人"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="选择状态"
            style={{ width: 150 }}
            allowClear
            value={status}
            onChange={setStatus}
            options={[
              { value: 'active', label: '运营中' },
              { value: 'inactive', label: '已停用' }
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增运营商
          </Button>
        </Space>

        <Space style={{ marginBottom: 16 }}>
          <span>运营商总数: <b>{statistics.total}</b></span>
          <span>运营中: <b style={{ color: '#52c41a' }}>{statistics.active}</b></span>
          <span>充电站总数: <b style={{ color: '#1890ff' }}>{statistics.totalStations}</b></span>
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
        title={editingRecord ? '编辑运营商' : '新增运营商'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="运营商名称" rules={[{ required: true, message: '请输入运营商名称' }]}>
            <Input placeholder="请输入运营商名称" />
          </Form.Item>
          <Form.Item name="contact" label="联系人" rules={[{ required: true, message: '请输入联系人' }]}>
            <Input placeholder="请输入联系人" />
          </Form.Item>
          <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              placeholder="请选择状态"
              options={[
                { value: 'active', label: '运营中' },
                { value: 'inactive', label: '已停用' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="运营商详情"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="运营商名称">{currentRecord.name}</Descriptions.Item>
            <Descriptions.Item label="联系人">{currentRecord.contact}</Descriptions.Item>
            <Descriptions.Item label="联系电话">{currentRecord.phone}</Descriptions.Item>
            <Descriptions.Item label="充电站数">{currentRecord.stationCount} 个</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[currentRecord.status].color}>{statusMap[currentRecord.status].text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(currentRecord.createTime)}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  )
}

export default Operator
