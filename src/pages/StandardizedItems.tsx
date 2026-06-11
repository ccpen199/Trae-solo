import { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Descriptions,
  Tabs,
  Badge,
  Tooltip,
  Row,
  Col,
  Steps,
  message,
  Dropdown,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  ImportOutlined,
  ExportOutlined,
  EyeOutlined,
  DownOutlined,
  MinusCircleOutlined,
  DiffOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../store/appStore'

const { Title } = Typography
const { Option } = Select

interface ItemRecord {
  key: string
  code: string
  name: string
  type: string
  org: string
  version: string
  status: '已发布' | '审核中' | '草稿'
}

interface MappingRecord {
  key: string
  national: string
  nationalCode: string
  relation: string
  province: string
  provinceCode: string
  status: '已映射' | '待映射' | '差异项'
}

interface VersionDiff {
  key: string
  field: string
  before: string
  after: string
  operator: string
  time: string
}

const itemData: ItemRecord[] = [
  { key: '1', code: 'GX-001-2026', name: '建筑工程施工许可证核发', type: '行政许可', org: '住房和城乡建设部', version: 'V3.2', status: '已发布' },
  { key: '2', code: 'GX-002-2026', name: '居民身份证换领', type: '行政确认', org: '公安部', version: 'V2.1', status: '已发布' },
  { key: '3', code: 'GX-003-2026', name: '企业登记注册', type: '行政许可', org: '国家市场监督管理总局', version: 'V2.8', status: '审核中' },
  { key: '4', code: 'GX-004-2026', name: '不动产权属登记', type: '行政确认', org: '自然资源部', version: 'V1.5', status: '已发布' },
  { key: '5', code: 'GX-005-2026', name: '医疗保障参保登记', type: '公共服务', org: '国家医疗保障局', version: 'V3.0', status: '审核中' },
  { key: '6', code: 'GX-006-2026', name: '道路运输经营许可', type: '行政许可', org: '交通运输部', version: 'V1.0', status: '草稿' },
  { key: '7', code: 'GX-007-2026', name: '食品经营许可证核发', type: '行政许可', org: '国家市场监督管理总局', version: 'V2.4', status: '已发布' },
  { key: '8', code: 'GX-008-2026', name: '住房公积金提取', type: '公共服务', org: '住房和城乡建设部', version: 'V1.8', status: '草稿' },
]

const mappingData: MappingRecord[] = [
  { key: '1', national: '建筑工程施工许可证核发', nationalCode: 'GX-001-2026', relation: '逐级细化', province: '建筑工程施工许可证核发（省级）', provinceCode: 'SJ-001-2026', status: '已映射' },
  { key: '2', national: '居民身份证换领', nationalCode: 'GX-002-2026', relation: '直接对应', province: '居民身份证换领（省级）', provinceCode: 'SJ-002-2026', status: '已映射' },
  { key: '3', national: '企业登记注册', nationalCode: 'GX-003-2026', relation: '逐级细化', province: '企业设立登记（省级）', provinceCode: 'SJ-003-2026', status: '差异项' },
  { key: '4', national: '道路运输经营许可', nationalCode: 'GX-006-2026', relation: '直接对应', province: '', provinceCode: '', status: '待映射' },
  { key: '5', national: '食品经营许可证核发', nationalCode: 'GX-007-2026', relation: '逐级细化', province: '食品经营许可证核发（省级）', provinceCode: 'SJ-007-2026', status: '已映射' },
]

const versionDiffs: VersionDiff[] = [
  { key: '1', field: '办理时限', before: '20个工作日', after: '15个工作日', operator: '陈丽', time: '2026-06-09 10:01:33' },
  { key: '2', field: '收费标准', before: '0元', after: '0元（免收费）', operator: '陈丽', time: '2026-06-09 10:01:33' },
  { key: '3', field: '申请材料', before: '5项', after: '4项（精简1项）', operator: '陈丽', time: '2026-06-09 10:01:33' },
  { key: '4', field: '实施主体', before: '住建部（单独）', after: '住建部+自然资源部', operator: '张伟', time: '2026-05-20 14:22:18' },
  { key: '5', field: '事项编码', before: 'GX-001-2025', after: 'GX-001-2026', operator: '李明', time: '2026-01-10 09:15:00' },
]

const statusColorMap: Record<string, string> = {
  '已发布': 'green',
  '审核中': 'blue',
  '草稿': 'default',
}

const mappingStatusColorMap: Record<string, string> = {
  '已映射': 'green',
  '待映射': 'orange',
  '差异项': 'red',
}

export default function StandardizedItems() {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<ItemRecord | null>(null)
  const [addForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const addAuditEntry = useAppStore((s) => s.addAuditEntry)

  const handleAdd = () => {
    setAddModalOpen(true)
    addAuditEntry({
      operator: '当前用户',
      module: '事项标准化管理',
      action: '打开新增事项',
      detail: '打开新增事项表单',
      result: 'success',
      ip: '10.0.1.100',
    })
  }

  const handleAddSubmit = () => {
    addForm.validateFields().then((values) => {
      addAuditEntry({
        operator: '当前用户',
        module: '事项标准化管理',
        action: '新增事项',
        detail: `新增事项：${values.name}（${values.code}）`,
        result: 'success',
        ip: '10.0.1.100',
      })
      message.success('事项新增成功')
      setAddModalOpen(false)
      addForm.resetFields()
    })
  }

  const handleView = (record: ItemRecord) => {
    setCurrentRecord(record)
    setViewModalOpen(true)
    addAuditEntry({
      operator: '当前用户',
      module: '事项标准化管理',
      action: '查看事项',
      detail: `查看事项：${record.name}（${record.code}）`,
      result: 'success',
      ip: '10.0.1.100',
    })
  }

  const handleEdit = (record: ItemRecord) => {
    setCurrentRecord(record)
    editForm.setFieldsValue(record)
    setEditModalOpen(true)
    addAuditEntry({
      operator: '当前用户',
      module: '事项标准化管理',
      action: '编辑事项',
      detail: `编辑事项：${record.name}（${record.code}）`,
      result: 'success',
      ip: '10.0.1.100',
    })
  }

  const handleEditSubmit = () => {
    editForm.validateFields().then((values) => {
      addAuditEntry({
        operator: '当前用户',
        module: '事项标准化管理',
        action: '保存事项编辑',
        detail: `保存事项编辑：${values.name}（${values.code}）`,
        result: 'success',
        ip: '10.0.1.100',
      })
      message.success('事项编辑保存成功')
      setEditModalOpen(false)
      editForm.resetFields()
    })
  }

  const handleDelete = (record: ItemRecord) => {
    addAuditEntry({
      operator: '当前用户',
      module: '事项标准化管理',
      action: '删除事项',
      detail: `删除事项：${record.name}（${record.code}）`,
      result: 'success',
      ip: '10.0.1.100',
    })
    message.success('事项已删除')
  }

  const handleHistory = (record: ItemRecord) => {
    setCurrentRecord(record)
    setHistoryModalOpen(true)
    addAuditEntry({
      operator: '当前用户',
      module: '事项标准化管理',
      action: '查看版本历史',
      detail: `查看事项版本历史：${record.name}（${record.version}）`,
      result: 'success',
      ip: '10.0.1.100',
    })
  }

  const handleImport = () => {
    addAuditEntry({
      operator: '当前用户',
      module: '事项标准化管理',
      action: '导入事项',
      detail: '打开事项导入功能',
      result: 'success',
      ip: '10.0.1.100',
    })
    message.info('导入功能已触发')
  }

  const handleExport = () => {
    addAuditEntry({
      operator: '当前用户',
      module: '事项标准化管理',
      action: '导出事项',
      detail: '导出事项清单数据',
      result: 'success',
      ip: '10.0.1.100',
    })
    message.success('事项清单导出成功')
  }

  const itemColumns = [
    { title: '事项编码', dataIndex: 'code', key: 'code', width: 160 },
    { title: '事项名称', dataIndex: 'name', key: 'name', width: 220 },
    {
      title: '事项类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const color = type === '行政许可' ? 'blue' : type === '行政确认' ? 'purple' : 'cyan'
        return <Tag color={color}>{type}</Tag>
      },
    },
    { title: '实施主体', dataIndex: 'org', key: 'org', width: 200 },
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (v: string) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColorMap[status]}>{status}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: unknown, record: ItemRecord) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
              查看
            </Button>
          </Tooltip>
          <Tooltip title="编辑事项">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          </Tooltip>
          <Tooltip title="版本历史">
            <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleHistory(record)}>
              版本历史
            </Button>
          </Tooltip>
          <Popconfirm
            title="确定删除该事项？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除事项">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const mappingColumns = [
    {
      title: '国家级事项',
      key: 'national',
      width: 200,
      render: (_: unknown, record: MappingRecord) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.national}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.nationalCode}</div>
        </div>
      ),
    },
    {
      title: '映射关系',
      dataIndex: 'relation',
      key: 'relation',
      width: 120,
      render: (relation: string) => (
        <Tag icon={<SwapOutlined />} color="processing">
          {relation}
        </Tag>
      ),
    },
    {
      title: '省级事项',
      key: 'province',
      width: 200,
      render: (_: unknown, record: MappingRecord) =>
        record.province ? (
          <div>
            <div style={{ fontWeight: 500 }}>{record.province}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.provinceCode}</div>
          </div>
        ) : (
          <span style={{ color: '#bbb' }}>—</span>
        ),
    },
    {
      title: '映射状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={mappingStatusColorMap[status]} icon={status === '已映射' ? <CheckCircleOutlined /> : status === '差异项' ? <ExclamationCircleOutlined /> : undefined}>
          {status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: MappingRecord) => (
        <Dropdown
          menu={{
            items: [
              { key: 'detail', label: '查看映射详情', icon: <EyeOutlined /> },
              { key: 'edit', label: '编辑映射', icon: <EditOutlined /> },
              ...(record.status !== '已映射' ? [{ key: 'map', label: '建立映射', icon: <SwapOutlined /> }] : []),
            ],
            onClick: ({ key }) => {
              addAuditEntry({
                operator: '当前用户',
                module: '事项标准化管理',
                action: key === 'map' ? '建立映射' : key === 'edit' ? '编辑映射' : '查看映射详情',
                detail: `映射操作：${record.national} → ${record.province || '未映射'}`,
                result: 'success',
                ip: '10.0.1.100',
              })
              message.info('操作已触发')
            },
          }}
        >
          <Button type="link" size="small">
            操作 <DownOutlined />
          </Button>
        </Dropdown>
      ),
    },
  ]

  const diffColumns = [
    { title: '变更字段', dataIndex: 'field', key: 'field', width: 140 },
    { title: '变更前', dataIndex: 'before', key: 'before', width: 200 },
    { title: '变更后', dataIndex: 'after', key: 'after', width: 200 },
    { title: '变更人', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '时间', dataIndex: 'time', key: 'time', width: 180 },
  ]

  const versionSteps = [
    { title: 'V1.0', description: '初始版本发布' },
    { title: 'V1.5', description: '新增实施主体' },
    { title: 'V2.0', description: '编码体系更新' },
    { title: 'V2.4', description: '申请材料调整' },
    { title: 'V3.0', description: '办理时限优化' },
    { title: 'V3.2', description: '当前版本' },
  ]

  const renderFormItemTable = () => (
    <Tabs
      defaultActiveKey="1"
      type="card"
      items={[
        {
          key: '1',
          label: '基本信息',
          children: (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="事项编码" name="code" rules={[{ required: true, message: '请输入事项编码' }]}>
                  <Input placeholder="如 GX-009-2026" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="事项名称" name="name" rules={[{ required: true, message: '请输入事项名称' }]}>
                  <Input placeholder="请输入事项名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="事项类型" name="type" rules={[{ required: true, message: '请选择事项类型' }]}>
                  <Select placeholder="请选择事项类型">
                    <Option value="行政许可">行政许可</Option>
                    <Option value="行政确认">行政确认</Option>
                    <Option value="公共服务">公共服务</Option>
                    <Option value="行政征收">行政征收</Option>
                    <Option value="行政给付">行政给付</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="实施主体" name="org" rules={[{ required: true, message: '请输入实施主体' }]}>
                  <Input placeholder="请输入实施主体" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="办理时限" name="deadline" rules={[{ required: true, message: '请输入办理时限' }]}>
                  <Input placeholder="如 15个工作日" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="收费标准" name="fee" rules={[{ required: true, message: '请输入收费标准' }]}>
                  <Input placeholder="如 0元（免收费）" />
                </Form.Item>
              </Col>
            </Row>
          ),
        },
        {
          key: '2',
          label: '事项要素元数据',
          children: (
            <Form.List name="metadata">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={16} align="middle" style={{ marginBottom: 8 }}>
                      <Col span={8}>
                        <Form.Item {...restField} name={[name, 'fieldName']} rules={[{ required: true, message: '请输入字段名' }]}>
                          <Input placeholder="字段名" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item {...restField} name={[name, 'fieldValue']} rules={[{ required: true, message: '请输入字段值' }]}>
                          <Input placeholder="字段值" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f', fontSize: 18 }} />
                      </Col>
                    </Row>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加元数据字段
                  </Button>
                </>
              )}
            </Form.List>
          ),
        },
      ]}
    />
  )

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            政务服务事项标准化管理系统
          </Title>
        </Col>
        <Col>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增事项
            </Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>
              导入
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#1890ff' }}>12,586</div>
              <div style={{ color: '#666', marginTop: 4 }}>事项总数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#722ed1' }}>1,203</div>
              <div style={{ color: '#666', marginTop: 4 }}>国家级事项</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#13c2c2' }}>8,942</div>
              <div style={{ color: '#666', marginTop: 4 }}>省级事项</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fa8c16' }}>2,441</div>
              <div style={{ color: '#666', marginTop: 4 }}>市级事项</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          defaultActiveKey="items"
          items={[
            {
              key: 'items',
              label: (
                <span>
                  <Badge count={itemData.length} size="small" offset={[6, -2]}>
                    事项清单管理
                  </Badge>
                </span>
              ),
              children: (
                <Table
                  columns={itemColumns}
                  dataSource={itemData}
                  pagination={{ pageSize: 10 }}
                  bordered
                  size="middle"
                />
              ),
            },
            {
              key: 'mapping',
              label: (
                <span>
                  <Badge count={mappingData.filter((m) => m.status === '待映射').length} size="small" offset={[6, -2]}>
                    跨层级目录映射
                  </Badge>
                </span>
              ),
              children: (
                <Table
                  columns={mappingColumns}
                  dataSource={mappingData}
                  pagination={false}
                  bordered
                  size="middle"
                />
              ),
            },
            {
              key: 'version',
              label: '版本控制',
              children: (
                <div>
                  <Card
                    title={
                      currentRecord
                        ? `${currentRecord.name} — 版本历史`
                        : '请从事项清单中选择事项查看版本历史'
                    }
                    style={{ marginBottom: 16 }}
                    extra={
                      currentRecord ? (
                        <Tag color="geekblue">{currentRecord.version}</Tag>
                      ) : null
                    }
                  >
                    <Steps
                      current={5}
                      items={versionSteps}
                      size="small"
                      style={{ marginBottom: 24 }}
                    />
                  </Card>
                  <Card title={<span><DiffOutlined /> 版本变更明细（V3.1 → V3.2）</span>}>
                    <Table
                      columns={diffColumns}
                      dataSource={versionDiffs}
                      pagination={false}
                      bordered
                      size="small"
                    />
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="新增事项"
        open={addModalOpen}
        onOk={handleAddSubmit}
        onCancel={() => {
          setAddModalOpen(false)
          addForm.resetFields()
        }}
        width={720}
        okText="提交"
        cancelText="取消"
      >
        <Form form={addForm} layout="vertical">
          {renderFormItemTable()}
        </Form>
      </Modal>

      <Modal
        title="查看事项详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={null}
        width={640}
      >
        {currentRecord && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="事项编码">{currentRecord.code}</Descriptions.Item>
            <Descriptions.Item label="事项名称">{currentRecord.name}</Descriptions.Item>
            <Descriptions.Item label="事项类型">{currentRecord.type}</Descriptions.Item>
            <Descriptions.Item label="实施主体">{currentRecord.org}</Descriptions.Item>
            <Descriptions.Item label="版本号">{currentRecord.version}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColorMap[currentRecord.status]}>{currentRecord.status}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="编辑事项"
        open={editModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalOpen(false)
          editForm.resetFields()
        }}
        width={640}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="事项编码" name="code">
            <Input disabled />
          </Form.Item>
          <Form.Item label="事项名称" name="name" rules={[{ required: true, message: '请输入事项名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="事项类型" name="type" rules={[{ required: true, message: '请选择事项类型' }]}>
            <Select>
              <Option value="行政许可">行政许可</Option>
              <Option value="行政确认">行政确认</Option>
              <Option value="公共服务">公共服务</Option>
              <Option value="行政征收">行政征收</Option>
              <Option value="行政给付">行政给付</Option>
            </Select>
          </Form.Item>
          <Form.Item label="实施主体" name="org" rules={[{ required: true, message: '请输入实施主体' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="版本历史"
        open={historyModalOpen}
        onCancel={() => setHistoryModalOpen(false)}
        footer={null}
        width={800}
      >
        {currentRecord && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="事项名称">{currentRecord.name}</Descriptions.Item>
              <Descriptions.Item label="当前版本">{currentRecord.version}</Descriptions.Item>
            </Descriptions>
            <Steps current={5} items={versionSteps} size="small" style={{ marginBottom: 16 }} />
            <Table
              columns={diffColumns}
              dataSource={versionDiffs}
              pagination={false}
              bordered
              size="small"
              title={() => '版本变更明细（V3.1 → V3.2）'}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}
