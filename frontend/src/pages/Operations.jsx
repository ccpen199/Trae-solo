import { useEffect, useState, useCallback } from 'react'
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  DatePicker,
  Space,
  Tag,
  Popconfirm,
  Card,
  message,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import request from '../utils/request'

const { RangePicker } = DatePicker

function rateColor(val) {
  if (val == null) return 'default'
  if (val > 5) return 'red'
  if (val > 2) return 'orange'
  return 'green'
}

function alertColor(val) {
  if (val == null) return 'default'
  if (val > 5) return 'red'
  if (val > 3) return 'orange'
  return 'green'
}

function DataQualityTab() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addForm] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (dateRange && dateRange[0]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      const res = await request.get('/operations/data-quality', { params })
      setData(res.data.list || res.data)
    } catch {
      message.error('获取数据质量指标失败')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddOpen = () => {
    addForm.resetFields()
    setAddOpen(true)
  }

  const handleAddOk = async () => {
    try {
      const values = await addForm.validateFields()
      setAddLoading(true)
      await request.post('/operations/data-quality', values)
      message.success('新增指标成功')
      setAddOpen(false)
      addForm.resetFields()
      fetchData()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '新增指标失败')
      }
    } finally {
      setAddLoading(false)
    }
  }

  const columns = [
    {
      title: '指标日期',
      dataIndex: 'metric_date',
      key: 'metric_date',
    },
    {
      title: '缺失率(%)',
      dataIndex: 'missing_rate',
      key: 'missing_rate',
      render: (val) => <Tag color={rateColor(val)}>{val != null ? val : '-'}</Tag>,
    },
    {
      title: '延迟率(%)',
      dataIndex: 'latency_rate',
      key: 'latency_rate',
      render: (val) => <Tag color={rateColor(val)}>{val != null ? val : '-'}</Tag>,
    },
    {
      title: '告警数',
      dataIndex: 'alert_count',
      key: 'alert_count',
      render: (val) => <Tag color={alertColor(val)}>{val != null ? val : '-'}</Tag>,
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates)}
          placeholder={['开始日期', '结束日期']}
        />
        <Button type="primary" onClick={() => fetchData()}>
          查询
        </Button>
        <Button
          onClick={() => {
            setDateRange(null)
          }}
        >
          重置
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddOpen}>
          新增指标
        </Button>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} />

      <Modal
        title="新增数据质量指标"
        open={addOpen}
        onOk={handleAddOk}
        onCancel={() => {
          setAddOpen(false)
          addForm.resetFields()
        }}
        confirmLoading={addLoading}
        width={520}
      >
        <Form form={addForm} layout="vertical" preserve={false}>
          <Form.Item
            name="metric_date"
            label="指标日期"
            rules={[{ required: true, message: '请选择指标日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="missing_rate" label="缺失率(%)">
            <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="latency_rate" label="延迟率(%)">
            <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="alert_count" label="告警数">
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="details" label="详情">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function BlacklistTab() {
  const [blacklist, setBlacklist] = useState([])
  const [blacklistLoading, setBlacklistLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addForm] = Form.useForm()

  const [configs, setConfigs] = useState([])
  const [configsLoading, setConfigsLoading] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)
  const [configForm] = Form.useForm()
  const [editingConfig, setEditingConfig] = useState(null)

  const fetchBlacklist = useCallback(async () => {
    setBlacklistLoading(true)
    try {
      const res = await request.get('/operations/blacklist')
      setBlacklist(res.data.list || res.data)
    } catch {
      message.error('获取黑名单失败')
    } finally {
      setBlacklistLoading(false)
    }
  }, [])

  const fetchConfigs = useCallback(async () => {
    setConfigsLoading(true)
    try {
      const res = await request.get('/operations/blacklist-configs')
      setConfigs(res.data.list || res.data)
    } catch {
      message.error('获取黑名单配置失败')
    } finally {
      setConfigsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBlacklist()
    fetchConfigs()
  }, [fetchBlacklist, fetchConfigs])

  const handleAddOpen = () => {
    addForm.resetFields()
    setAddOpen(true)
  }

  const handleAddOk = async () => {
    try {
      const values = await addForm.validateFields()
      setAddLoading(true)
      await request.post('/operations/blacklist', values)
      message.success('添加黑名单成功')
      setAddOpen(false)
      addForm.resetFields()
      fetchBlacklist()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '添加黑名单失败')
      }
    } finally {
      setAddLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await request.delete(`/operations/blacklist/${id}`)
      message.success('删除成功')
      fetchBlacklist()
    } catch (err) {
      message.error(err.response?.data?.message || '删除失败')
    }
  }

  const handleConfigAdd = () => {
    setEditingConfig(null)
    configForm.resetFields()
    setConfigOpen(true)
  }

  const handleConfigEdit = (record) => {
    setEditingConfig(record)
    configForm.setFieldsValue({
      name: record.name,
      strategy_type: record.strategy_type,
      conditions: record.conditions
        ? typeof record.conditions === 'string'
          ? record.conditions
          : JSON.stringify(record.conditions, null, 2)
        : '',
      is_active: !!record.is_active,
    })
    setConfigOpen(true)
  }

  const handleConfigOk = async () => {
    try {
      const values = await configForm.validateFields()
      setConfigLoading(true)
      const payload = {
        ...values,
        conditions: values.conditions
          ? typeof values.conditions === 'string'
            ? JSON.parse(values.conditions)
            : values.conditions
          : undefined,
      }
      if (editingConfig) {
        await request.put(`/operations/blacklist-configs/${editingConfig.id}`, payload)
        message.success('更新配置成功')
      } else {
        await request.post('/operations/blacklist-configs', payload)
        message.success('新增配置成功')
      }
      setConfigOpen(false)
      configForm.resetFields()
      setEditingConfig(null)
      fetchConfigs()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '操作失败')
      }
    } finally {
      setConfigLoading(false)
    }
  }

  const blacklistColumns = [
    {
      title: '车牌号',
      dataIndex: 'vehicle_plate',
      key: 'vehicle_plate',
      render: (val) => val && <Tag color="blue">{val}</Tag>,
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="确认删除该黑名单记录？"
          onConfirm={() => handleDelete(record.id)}
          okText="确认"
          cancelText="取消"
        >
          <Button type="link" danger size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const configColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '策略类型',
      dataIndex: 'strategy_type',
      key: 'strategy_type',
    },
    {
      title: '条件',
      dataIndex: 'conditions',
      key: 'conditions',
      ellipsis: true,
      render: (val) =>
        val ? (typeof val === 'string' ? val : JSON.stringify(val)) : '-',
    },
    {
      title: '启用状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (val) => (val ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleConfigEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddOpen}>
          添加黑名单
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={blacklistColumns}
        dataSource={blacklist}
        loading={blacklistLoading}
        style={{ marginBottom: 24 }}
      />

      <Card title="黑名单策略配置" extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleConfigAdd}>新增配置</Button>}>
        <Table
          rowKey="id"
          columns={configColumns}
          dataSource={configs}
          loading={configsLoading}
          size="small"
        />
      </Card>

      <Modal
        title="添加黑名单"
        open={addOpen}
        onOk={handleAddOk}
        onCancel={() => {
          setAddOpen(false)
          addForm.resetFields()
        }}
        confirmLoading={addLoading}
        width={520}
      >
        <Form form={addForm} layout="vertical" preserve={false}>
          <Form.Item
            name="vehicle_plate"
            label="车牌号"
            rules={[{ required: true, message: '请输入车牌号' }]}
          >
            <Input placeholder="请输入车牌号" />
          </Form.Item>
          <Form.Item name="reason" label="原因">
            <Input.TextArea rows={4} placeholder="请输入加入黑名单原因" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingConfig ? '编辑策略配置' : '新增策略配置'}
        open={configOpen}
        onOk={handleConfigOk}
        onCancel={() => {
          setConfigOpen(false)
          configForm.resetFields()
          setEditingConfig(null)
        }}
        confirmLoading={configLoading}
        width={560}
      >
        <Form form={configForm} layout="vertical" preserve={false}>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入策略名称" />
          </Form.Item>
          <Form.Item
            name="strategy_type"
            label="策略类型"
            rules={[{ required: true, message: '请选择策略类型' }]}
          >
            <Select
              placeholder="请选择策略类型"
              options={[
                { value: 'frequency', label: '频率策略' },
                { value: 'threshold', label: '阈值策略' },
                { value: 'composite', label: '组合策略' },
              ]}
            />
          </Form.Item>
          <Form.Item name="conditions" label="条件(JSON)">
            <Input.TextArea rows={6} placeholder='请输入JSON格式条件，如: {"key": "value"}' />
          </Form.Item>
          <Form.Item name="is_active" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

function ValueAddedTab() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [form] = Form.useForm()
  const [editing, setEditing] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await request.get('/operations/value-added')
      setData(res.data.list || res.data)
    } catch {
      message.error('获取增值服务失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAdd = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditing(record)
    form.setFieldsValue({
      service_name: record.service_name,
      service_type: record.service_type,
      api_endpoint: record.api_endpoint,
      status: record.status,
      config: record.config
        ? typeof record.config === 'string'
          ? record.config
          : JSON.stringify(record.config, null, 2)
        : '',
    })
    setModalOpen(true)
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setModalLoading(true)
      const payload = {
        ...values,
        config: values.config
          ? typeof values.config === 'string'
            ? JSON.parse(values.config)
            : values.config
          : undefined,
      }
      if (editing) {
        await request.put(`/operations/value-added/${editing.id}`, payload)
        message.success('更新增值服务成功')
      } else {
        await request.post('/operations/value-added', payload)
        message.success('新增增值服务成功')
      }
      setModalOpen(false)
      form.resetFields()
      setEditing(null)
      fetchData()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '操作失败')
      }
    } finally {
      setModalLoading(false)
    }
  }

  const columns = [
    {
      title: '服务名称',
      dataIndex: 'service_name',
      key: 'service_name',
    },
    {
      title: '服务类型',
      dataIndex: 'service_type',
      key: 'service_type',
    },
    {
      title: 'API端点',
      dataIndex: 'api_endpoint',
      key: 'api_endpoint',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val) =>
        val === 'active' ? (
          <Tag color="green">启用</Tag>
        ) : (
          <Tag>停用</Tag>
        ),
    },
    {
      title: '配置',
      dataIndex: 'config',
      key: 'config',
      ellipsis: true,
      render: (val) =>
        val ? (typeof val === 'string' ? val : JSON.stringify(val)) : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增增值服务
        </Button>
      </Space>

      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} />

      <Modal
        title={editing ? '编辑增值服务' : '新增增值服务'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
          setEditing(null)
        }}
        confirmLoading={modalLoading}
        width={560}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="service_name"
            label="服务名称"
            rules={[{ required: true, message: '请输入服务名称' }]}
          >
            <Input placeholder="请输入服务名称" />
          </Form.Item>
          <Form.Item
            name="service_type"
            label="服务类型"
            rules={[{ required: true, message: '请选择服务类型' }]}
          >
            <Select
              placeholder="请选择服务类型"
              options={[
                { value: 'insurance', label: '保险服务' },
                { value: 'finance', label: '金融服务' },
                { value: 'map', label: '地图服务' },
                { value: 'other', label: '其他' },
              ]}
            />
          </Form.Item>
          <Form.Item name="api_endpoint" label="API端点">
            <Input placeholder="请输入API端点地址" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              placeholder="请选择状态"
              options={[
                { value: 'active', label: '启用' },
                { value: 'inactive', label: '停用' },
              ]}
            />
          </Form.Item>
          <Form.Item name="config" label="配置(JSON)">
            <Input.TextArea rows={6} placeholder='请输入JSON格式配置，如: {"key": "value"}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

const tabItems = [
  { key: 'data-quality', label: '数据质量监控', children: <DataQualityTab /> },
  { key: 'blacklist', label: '黑名单管理', children: <BlacklistTab /> },
  { key: 'value-added', label: '增值服务管理', children: <ValueAddedTab /> },
]

export default function Operations({ initialTab }) {
  return (
    <div>
      <h2 style={{ marginBottom: 20, fontWeight: 600 }}>运营管理</h2>
      <Tabs items={tabItems} defaultActiveKey={initialTab || 'data-quality'} />
    </div>
  )
}
