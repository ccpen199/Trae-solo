import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Tree, Row, Col, Input, Button, Tag, Space, Modal, Form, Select, InputNumber, message } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import api from '../../api'

const categories = [
  {
    title: '全部事项',
    key: 'all',
    children: [
      { title: '户籍管理', key: 'huji' },
      { title: '社保服务', key: 'shebao' },
      { title: '公积金服务', key: 'gongjijin' },
      { title: '市场监管', key: 'shichang' },
      { title: '自然资源', key: 'ziran' },
      { title: '医疗卫生', key: 'yiliao' },
      { title: '教育服务', key: 'jiaoyu' },
      { title: '交通运输', key: 'jiaotong' },
    ],
  },
]

const defaultServices = [
  { id: 1, code: 'FJ-HJ-001', name: '居住证办理', department: '公安局', days: 15, status: '在线', category: 'huji' },
  { id: 2, code: 'FJ-HJ-002', name: '户籍迁移', department: '公安局', days: 20, status: '在线', category: 'huji' },
  { id: 3, code: 'FJ-SB-001', name: '社保缴费', department: '人社局', days: 5, status: '在线', category: 'shebao' },
  { id: 4, code: 'FJ-SB-002', name: '社保转移', department: '人社局', days: 30, status: '在线', category: 'shebao' },
  { id: 5, code: 'FJ-GJJ-001', name: '公积金提取', department: '公积金中心', days: 3, status: '在线', category: 'gongjijin' },
  { id: 6, code: 'FJ-GJJ-002', name: '公积金贷款', department: '公积金中心', days: 15, status: '在线', category: 'gongjijin' },
  { id: 7, code: 'FJ-SC-001', name: '营业执照办理', department: '市场监管局', days: 5, status: '在线', category: 'shichang' },
  { id: 8, code: 'FJ-SC-002', name: '食品经营许可', department: '市场监管局', days: 20, status: '在线', category: 'shichang' },
  { id: 9, code: 'FJ-ZR-001', name: '不动产登记', department: '自然资源局', days: 10, status: '在线', category: 'ziran' },
  { id: 10, code: 'FJ-YL-001', name: '医保报销', department: '医保局', days: 30, status: '在线', category: 'yiliao' },
  { id: 11, code: 'FJ-YL-002', name: '生育登记', department: '卫健委', days: 5, status: '在线', category: 'yiliao' },
  { id: 12, code: 'FJ-JY-001', name: '教师资格认定', department: '教育厅', days: 30, status: '在线', category: 'jiaoyu' },
  { id: 13, code: 'FJ-JT-001', name: '车辆年检', department: '交通运输厅', days: 1, status: '在线', category: 'jiaotong' },
  { id: 14, code: 'FJ-JT-002', name: '驾驶证换证', department: '交通运输厅', days: 3, status: '暂停', category: 'jiaotong' },
]

export default function ServiceList() {
  const navigate = useNavigate()
  const [services, setServices] = useState(defaultServices)
  const [filtered, setFiltered] = useState(defaultServices)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [form] = Form.useForm()

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    const res = await api.get('/services/items')
    if (res.success && res.data?.data) {
      setServices(res.data.data)
      setFiltered(res.data.data)
    }
  }

  useEffect(() => {
    let list = [...services]
    if (selectedCategory !== 'all') {
      list = list.filter((s) => s.category === selectedCategory)
    }
    if (searchText) {
      const kw = searchText.toLowerCase()
      list = list.filter(
        (s) => s.name.toLowerCase().includes(kw) || s.code.toLowerCase().includes(kw) || s.department.toLowerCase().includes(kw)
      )
    }
    setFiltered(list)
  }, [selectedCategory, searchText, services])

  const handleTreeSelect = (keys) => {
    setSelectedCategory(keys[0] || 'all')
  }

  const handleAdd = () => {
    setEditRecord(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditRecord(record)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (editRecord) {
        const res = await api.put(`/services/items/${editRecord.id}`, values)
        if (res.success) {
          message.success('编辑成功')
          setServices((prev) => prev.map((s) => (s.id === editRecord.id ? { ...s, ...values } : s)))
        }
      } else {
        const res = await api.post('/services/items', values)
        if (res.success) {
          message.success('新建成功')
          const newId = Math.max(...services.map((s) => s.id), 0) + 1
          setServices((prev) => [...prev, { id: newId, ...values, status: '在线' }])
        }
      }
      setModalOpen(false)
    } catch {}
  }

  const columns = [
    { title: '事项编码', dataIndex: 'code', key: 'code', width: 130 },
    { title: '事项名称', dataIndex: 'name', key: 'name', ellipsis: true },
    { title: '主管部门', dataIndex: 'department', key: 'department', width: 130 },
    { title: '承诺天数', dataIndex: 'days', key: 'days', width: 100, render: (d) => `${d}个工作日` },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s) => <Tag color={s === '在线' ? 'success' : 'error'}>{s}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 160,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/services/${record.id}`)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <Row gutter={16}>
      <Col xs={24} lg={6}>
        <Card title="事项分类" style={{ borderRadius: 8 }}>
          <Tree
            defaultExpandAll
            selectedKeys={[selectedCategory]}
            treeData={categories}
            onSelect={handleTreeSelect}
          />
        </Card>
      </Col>
      <Col xs={24} lg={18}>
        <Card
          title="事项列表"
          style={{ borderRadius: 8 }}
          extra={
            <Space>
              <Input
                placeholder="搜索事项"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新建事项
              </Button>
            </Space>
          }
        >
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            size="middle"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: filtered.length,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (page, size) => setPagination({ current: page, pageSize: size }),
            }}
          />
        </Card>
      </Col>

      <Modal
        title={editRecord ? '编辑事项' : '新建事项'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="事项编码" rules={[{ required: true, message: '请输入事项编码' }]}>
                <Input placeholder="如 FJ-XX-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="事项名称" rules={[{ required: true, message: '请输入事项名称' }]}>
                <Input placeholder="请输入事项名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label="主管部门" rules={[{ required: true, message: '请输入主管部门' }]}>
                <Input placeholder="请输入主管部门" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="days" label="承诺天数" rules={[{ required: true, message: '请输入承诺天数' }]}>
                <InputNumber min={1} placeholder="工作日" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="category" label="事项分类" rules={[{ required: true, message: '请选择事项分类' }]}>
            <Select placeholder="请选择分类">
              <Select.Option value="huji">户籍管理</Select.Option>
              <Select.Option value="shebao">社保服务</Select.Option>
              <Select.Option value="gongjijin">公积金服务</Select.Option>
              <Select.Option value="shichang">市场监管</Select.Option>
              <Select.Option value="ziran">自然资源</Select.Option>
              <Select.Option value="yiliao">医疗卫生</Select.Option>
              <Select.Option value="jiaoyu">教育服务</Select.Option>
              <Select.Option value="jiaotong">交通运输</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Row>
  )
}
