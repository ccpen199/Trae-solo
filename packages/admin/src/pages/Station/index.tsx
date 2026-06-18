import { useState } from 'react'
import { Table, Card, Button, Space, Input, Select, Tag, Modal, Form, message } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Station } from '@/types'
import { formatDateTime } from '@/utils'

const statusMap: Record<string, { color: string; text: string }> = {
  online: { color: 'green', text: '运营中' },
  offline: { color: 'default', text: '停运' },
  maintenance: { color: 'orange', text: '维护中' }
}

const mockData: Station[] = [
  { id: '1', name: '浦东充电站', address: '上海市浦东新区张江路100号', pileCount: 20, status: 'online', operator: '国网电动', createTime: '2024-01-15 10:00:00' },
  { id: '2', name: '虹桥充电站', address: '上海市闵行区虹桥路200号', pileCount: 30, status: 'online', operator: '特来电', createTime: '2024-02-20 14:30:00' },
  { id: '3', name: '徐汇充电站', address: '上海市徐汇区漕溪北路300号', pileCount: 15, status: 'maintenance', operator: '星星充电', createTime: '2024-03-10 09:00:00' },
  { id: '4', name: '静安充电站', address: '上海市静安区南京西路400号', pileCount: 25, status: 'online', operator: '国网电动', createTime: '2024-04-05 16:00:00' },
  { id: '5', name: '杨浦充电站', address: '上海市杨浦区五角场500号', pileCount: 18, status: 'offline', operator: '特来电', createTime: '2024-05-12 11:00:00' }
]

function Station() {
  const [data, setData] = useState<Station[]>(mockData)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<Station | null>(null)
  const [form] = Form.useForm()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<string | undefined>()

  const columns: ColumnsType<Station> = [
    { title: '站点名称', dataIndex: 'name', key: 'name' },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '充电桩数', dataIndex: 'pileCount', key: 'pileCount' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status]
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    { title: '运营商', dataIndex: 'operator', key: 'operator' },
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
        filtered = filtered.filter((item) => item.name.includes(keyword) || item.address.includes(keyword))
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

  const handleEdit = (record: Station) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = (record: Station) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除充电站"${record.name}"吗？`,
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
        const newItem: Station = {
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

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索站点名称/地址"
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
              { value: 'online', label: '运营中' },
              { value: 'offline', label: '停运' },
              { value: 'maintenance', label: '维护中' }
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增充电站
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
        title={editingRecord ? '编辑充电站' : '新增充电站'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="站点名称" rules={[{ required: true, message: '请输入站点名称' }]}>
            <Input placeholder="请输入站点名称" />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true, message: '请输入地址' }]}>
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="pileCount" label="充电桩数量" rules={[{ required: true, message: '请输入充电桩数量' }]}>
            <Input type="number" placeholder="请输入充电桩数量" />
          </Form.Item>
          <Form.Item name="operator" label="运营商" rules={[{ required: true, message: '请选择运营商' }]}>
            <Select
              placeholder="请选择运营商"
              options={[
                { value: '国网电动', label: '国网电动' },
                { value: '特来电', label: '特来电' },
                { value: '星星充电', label: '星星充电' }
              ]}
            />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              placeholder="请选择状态"
              options={[
                { value: 'online', label: '运营中' },
                { value: 'offline', label: '停运' },
                { value: 'maintenance', label: '维护中' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Station
