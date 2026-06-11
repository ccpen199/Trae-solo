import { useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  Input,
  InputNumber,
  Select,
  Space,
  Row,
  Col,
  Switch,
  Form,
  Checkbox,
  Badge,
  Statistic,
  message,
} from 'antd'
import { PlusOutlined, EditOutlined, ShopOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { servicePackages, serviceProviders } from '@/mock/data'
import type { ServicePackage } from '@/types'

const categoryOptions = [
  { label: '月嫂', value: '月嫂' },
  { label: '育儿嫂', value: '育儿嫂' },
  { label: '保洁', value: '保洁' },
  { label: '养老护理', value: '养老护理' },
  { label: '钟点工', value: '钟点工' },
  { label: '家电清洗', value: '家电清洗' },
]

const includesOptions = [
  { label: '日常保洁', value: '日常保洁' },
  { label: '深度清洁', value: '深度清洁' },
  { label: '做饭', value: '做饭' },
  { label: '洗衣', value: '洗衣' },
  { label: '照顾老人', value: '照顾老人' },
  { label: '照顾婴儿', value: '照顾婴儿' },
]

const categoryColorMap: Record<string, string> = {
  '月嫂': 'magenta',
  '育儿嫂': 'purple',
  '保洁': 'cyan',
  '养老护理': 'green',
  '钟点工': 'blue',
  '家电清洗': 'orange',
}

const allCities = Array.from(new Set(servicePackages.map((p) => p.city)))

const ServicePackages: React.FC = () => {
  const [data, setData] = useState<ServicePackage[]>(servicePackages)
  const [cityFilter, setCityFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ServicePackage | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<ServicePackage | null>(null)
  const [form] = Form.useForm()

  const filteredData = data.filter((item) => {
    if (cityFilter && item.city !== cityFilter) return false
    if (categoryFilter && item.category !== categoryFilter) return false
    if (activeOnly && !item.isActive) return false
    return true
  })

  const activeCount = data.filter((p) => p.isActive).length
  const inactiveCount = data.filter((p) => !p.isActive).length
  const cityCount = new Set(data.map((p) => p.city)).size

  const openAddModal = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEditModal = (record: ServicePackage) => {
    setEditingRecord(record)
    form.setFieldsValue({
      name: record.name,
      providerId: record.providerId,
      city: record.city,
      category: record.category,
      price: record.price,
      duration: record.duration,
      includes: record.includes,
      description: record.description,
    })
    setModalOpen(true)
  }

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const provider = serviceProviders.find((p) => p.id === values.providerId)
      if (editingRecord) {
        setData((prev) =>
          prev.map((item) =>
            item.id === editingRecord.id
              ? { ...item, ...values, providerName: provider?.name ?? item.providerName }
              : item
          )
        )
        message.success('服务包已更新')
      } else {
        const newPackage: ServicePackage = {
          id: `SP${String(data.length + 1).padStart(3, '0')}`,
          name: values.name,
          providerId: values.providerId,
          providerName: provider?.name ?? '',
          city: values.city,
          category: values.category,
          description: values.description,
          price: values.price,
          duration: values.duration,
          includes: values.includes,
          isActive: true,
          createdAt: new Date().toISOString(),
        }
        setData((prev) => [...prev, newPackage])
        message.success('服务包已创建')
      }
      setModalOpen(false)
      form.resetFields()
    })
  }

  const toggleActive = (id: string) => {
    setData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isActive: !item.isActive } : item))
    )
  }

  const viewDetail = (record: ServicePackage) => {
    setDetailRecord(record)
    setDetailOpen(true)
  }

  const columns = [
    { title: '服务包ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '服务商', dataIndex: 'providerName', key: 'providerName', width: 120 },
    { title: '城市', dataIndex: 'city', key: 'city', width: 80 },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string) => (
        <Tag color={categoryColorMap[category] ?? 'default'}>{category}</Tag>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => `¥${price.toLocaleString()}`,
    },
    {
      title: '时长',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration: number) => `${duration}小时`,
    },
    {
      title: '包含服务',
      dataIndex: 'includes',
      key: 'includes',
      width: 240,
      render: (includes: string[]) => (
        <Space wrap size={[4, 4]}>
          {includes.slice(0, 3).map((item) => (
            <Tag key={item} color="processing">{item}</Tag>
          ))}
          {includes.length > 3 && <Tag>+{includes.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean, record: ServicePackage) => (
        <Switch checked={isActive} onChange={() => toggleActive(record.id)} size="small" />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: ServicePackage) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="已上架服务包"
              value={activeCount}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已下架服务包"
              value={inactiveCount}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="覆盖城市"
              value={cityCount}
              valueStyle={{ color: '#1677ff' }}
              prefix={<EnvironmentOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ fontWeight: 500 }}>筛选</span>
          </Col>
          <Col>
            <Select
              placeholder="城市"
              value={cityFilter || undefined}
              onChange={(val) => setCityFilter(val ?? '')}
              allowClear
              style={{ width: 120 }}
              options={[{ label: '全部', value: '' }, ...allCities.map((c) => ({ label: c, value: c }))]}
            />
          </Col>
          <Col>
            <Select
              placeholder="类目"
              value={categoryFilter || undefined}
              onChange={(val) => setCategoryFilter(val ?? '')}
              allowClear
              style={{ width: 120 }}
              options={[{ label: '全部', value: '' }, ...categoryOptions]}
            />
          </Col>
          <Col>
            <Space>
              <span>只看已上架</span>
              <Switch checked={activeOnly} onChange={setActiveOnly} size="small" />
            </Space>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
              新增服务包
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({ onDoubleClick: () => viewDetail(record) })}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑服务包' : '新增服务包'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={() => setModalOpen(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="请输入服务包名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="providerId" label="服务商" rules={[{ required: true, message: '请选择服务商' }]}>
                <Select
                  placeholder="请选择服务商"
                  options={serviceProviders.map((p) => ({ label: p.name, value: p.id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="city" label="城市" rules={[{ required: true, message: '请选择城市' }]}>
                <Select placeholder="请选择城市" options={allCities.map((c) => ({ label: c, value: c }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="类别" rules={[{ required: true, message: '请选择类别' }]}>
                <Select placeholder="请选择类别" options={categoryOptions} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="price" label="价格 (¥)" rules={[{ required: true, message: '请输入价格' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="duration" label="时长 (小时)" rules={[{ required: true, message: '请输入时长' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="includes" label="包含服务" rules={[{ required: true, message: '请选择包含服务' }]}>
            <Checkbox.Group options={includesOptions} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入服务包描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="服务包详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={640}
      >
        {detailRecord && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="服务包ID">{detailRecord.id}</Descriptions.Item>
            <Descriptions.Item label="名称">{detailRecord.name}</Descriptions.Item>
            <Descriptions.Item label="服务商">{detailRecord.providerName}</Descriptions.Item>
            <Descriptions.Item label="城市">{detailRecord.city}</Descriptions.Item>
            <Descriptions.Item label="类别">
              <Tag color={categoryColorMap[detailRecord.category]}>{detailRecord.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="价格">¥{detailRecord.price.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="时长">{detailRecord.duration}小时</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge status={detailRecord.isActive ? 'success' : 'default'} text={detailRecord.isActive ? '已上架' : '已下架'} />
            </Descriptions.Item>
            <Descriptions.Item label="包含服务" span={2}>
              <Space wrap>
                {detailRecord.includes.map((item) => (
                  <Tag key={item} color="processing">{item}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>{detailRecord.description}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default ServicePackages
