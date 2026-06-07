import { useEffect, useState, useCallback } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  Tooltip,
  Progress,
  Drawer,
  Descriptions,
  Alert,
  Divider,
} from 'antd'
import {
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import request from '../utils/request'

const statusMap = {
  inactive: { text: '未激活', color: 'orange' },
  active: { text: '已激活', color: 'green' },
  faulty: { text: '故障', color: 'red' },
  deactivated: { text: '已停用', color: 'default' },
  suspended: { text: '已停用', color: 'default' },
}

const lifecycleMap = {
  '待审核': { color: 'gold', icon: '⏳' },
  '已拒绝': { color: 'red', icon: '❌' },
  '待激活': { color: 'orange', icon: '📦' },
  '已激活': { color: 'green', icon: '✅' },
  '已停用': { color: 'default', icon: '⏸️' },
  '已注销': { color: 'default', icon: '♻️' },
}

const upgradeStatusMap = {
  none: { text: '未升级', color: 'default' },
  success: { text: '升级成功', color: 'green' },
  failed: { text: '升级失败', color: 'red' },
  upgrading: { text: '升级中', color: 'orange' },
}

const applyStatusMap = {
  pending: { text: '待审核', color: 'gold' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已驳回', color: 'red' },
}

const statusOptions = Object.entries(statusMap).map(([value, { text }]) => ({
  value,
  label: text,
}))

const demoDeviceDefaults = () => {
  const suffix = Date.now().toString().slice(-6)
  return {
    device_sn: `OBU-DEMO-${suffix}`,
    model: 'JL-3000',
    firmware_version: 'v3.0.1',
    batch_no: `BATCH-DEMO-${suffix}`,
    owner_name: '演示车主',
    owner_phone: `139${suffix.padStart(8, '0').slice(0, 8)}`,
    vehicle_plate: `京A${suffix.slice(-5)}`,
    reason: '本地演示申领',
  }
}

export default function OBU() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [modelFilter, setModelFilter] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [form] = Form.useForm()

  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeRecord, setUpgradeRecord] = useState(null)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeForm] = Form.useForm()

  const [applyOpen, setApplyOpen] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const [applyForm] = Form.useForm()

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState(null)

  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewRecord, setReviewRecord] = useState(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewForm] = Form.useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, pageSize }
      if (statusFilter) params.status = statusFilter
      if (modelFilter) params.model = modelFilter
      const res = await request.get('/obu', { params })
      setData(res.data.list)
      setTotal(res.data.total)
    } catch {
      message.error('获取OBU列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, modelFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue(demoDeviceDefaults())
    setModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue({
      model: record.model,
      firmware_version: record.firmware_version,
      activation_status: record.activation_status,
      user_id: record.user_id,
      batch_no: record.batch_no,
    })
    setModalOpen(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      setConfirmLoading(true)
      if (editingRecord) {
        await request.put(`/obu/${editingRecord.id}`, values)
        message.success('编辑OBU成功，已记录审计日志')
      } else {
        await request.post('/obu', values)
        message.success('添加OBU成功，已记录审计日志')
      }
      setModalOpen(false)
      form.resetFields()
      setEditingRecord(null)
      fetchData()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '操作失败')
      }
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleModalCancel = () => {
    setModalOpen(false)
    form.resetFields()
    setEditingRecord(null)
  }

  const handleBatchActivate = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择设备')
      return
    }
    try {
      const res = await request.post('/obu/batch-activate', { device_ids: selectedRowKeys })
      const { activated, ineligible_count, total, progress, ineligible_devices } = res.data
      const ineligibleInfo = ineligible_devices?.length > 0
        ? `\n跳过设备：${ineligible_devices.map(d => `${d.device_sn}(${statusMap[d.activation_status]?.text || d.activation_status})`).join('、')}`
        : ''
      message.success(`批量激活完成：成功 ${activated}/${total} 台，跳过 ${ineligible_count} 台，进度 ${progress}${ineligibleInfo}`)
      setSelectedRowKeys([])
      fetchData()
    } catch (err) {
      message.error(err.response?.data?.message || '批量激活失败')
    }
  }

  const handleUpgradeOpen = (record) => {
    if (record.activation_status !== 'active') {
      message.warning('设备未激活，无法升级')
      return
    }
    setUpgradeRecord(record)
    upgradeForm.resetFields()
    upgradeForm.setFieldsValue({ firmware_version: 'v3.2.0' })
    setUpgradeOpen(true)
  }

  const handleUpgradeOk = async () => {
    try {
      const values = await upgradeForm.validateFields()
      if (upgradeRecord.firmware_version === values.firmware_version) {
        message.warning('设备已是目标版本，无需升级')
        return
      }
      setUpgradeLoading(true)
      const res = await request.post(`/obu/${upgradeRecord.id}/upgrade`, values)
      const { status, old_version, new_version } = res.data
      if (status === 'success') {
        message.success(`✅ 固件升级成功：${old_version} → ${new_version}`)
      } else {
        message.error(`❌ 固件升级失败：${old_version} 保持不变`)
      }
      setUpgradeOpen(false)
      upgradeForm.resetFields()
      setUpgradeRecord(null)
      fetchData()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '固件升级失败')
      }
    } finally {
      setUpgradeLoading(false)
    }
  }

  const handleApplyOpen = () => {
    applyForm.resetFields()
    applyForm.setFieldsValue(demoDeviceDefaults())
    setApplyOpen(true)
  }

  const handleApplyOk = async () => {
    try {
      const values = await applyForm.validateFields()
      setApplyLoading(true)
      const res = await request.post('/obu/apply', values)
      message.success(`OBU申领已提交，状态：${applyStatusMap[res.data.status]?.text}，已记录审计日志`)
      setApplyOpen(false)
      applyForm.resetFields()
      fetchData()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || 'OBU申领失败')
      }
    } finally {
      setApplyLoading(false)
    }
  }

  const handleDetailOpen = (record) => {
    setDetailRecord(record)
    setDetailOpen(true)
  }

  const handleReviewOpen = (record) => {
    setReviewRecord(record)
    reviewForm.resetFields()
    setReviewOpen(true)
  }

  const handleReviewOk = async (status) => {
    try {
      let rejectReason = ''
      if (status === 'rejected') {
        const values = await reviewForm.validateFields()
        rejectReason = values.reject_reason
      }
      setReviewLoading(true)
      const res = await request.post(`/obu/${reviewRecord.id}/review-apply`, { status, reject_reason: rejectReason })
      message.success(`${res.data.message}，已记录审计日志`)
      setReviewOpen(false)
      reviewForm.resetFields()
      setReviewRecord(null)
      fetchData()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '审核失败')
      }
    } finally {
      setReviewLoading(false)
    }
  }

  const handleTableChange = (pagination) => {
    setPage(pagination.current)
    setPageSize(pagination.pageSize)
  }

  const handleStatusFilter = (value) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handleModelSearch = (value) => {
    setModelFilter(value)
    setPage(1)
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '设备序列号',
      dataIndex: 'device_sn',
      key: 'device_sn',
      render: (text, record) => (
        <Button type="link" onClick={() => handleDetailOpen(record)}>{text}</Button>
      ),
    },
    {
      title: '持有人',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (text, record) => text || record.user_username || '未绑定',
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '固件版本',
      dataIndex: 'firmware_version',
      key: 'firmware_version',
    },
    {
      title: '升级状态',
      dataIndex: 'upgrade_status',
      key: 'upgrade_status',
      render: (status, record) => {
        const cfg = upgradeStatusMap[status] || { text: status, color: 'default' }
        return (
          <Tooltip title={record.last_upgrade_result || '暂无升级记录'}>
            <Tag color={cfg.color}>
              {status === 'success' && <CheckCircleOutlined />}
              {status === 'failed' && <CloseCircleOutlined />}
              {cfg.text}
            </Tag>
          </Tooltip>
        )
      },
    },
    {
      title: '升级时间',
      dataIndex: 'last_upgrade_at',
      key: 'last_upgrade_at',
      render: (text) => text || '-',
    },
    {
      title: '激活进度',
      dataIndex: 'batch_activate_progress',
      key: 'batch_activate_progress',
      render: (progress, record) => {
        if (record.activation_status === 'active') {
          return <Progress percent={100} size="small" status="success" />
        }
        if (progress) {
          const pct = parseInt(progress) || 0
          return <Progress percent={pct} size="small" />
        }
        return <Progress percent={0} size="small" />
      },
    },
    {
      title: '申领状态',
      dataIndex: 'apply_status',
      key: 'apply_status',
      render: (status, record) => {
        const cfg = applyStatusMap[status] || { text: status, color: 'default' }
        const reason = record.reject_reason || record.apply_reason
        return (
          <Tooltip title={reason || ''}>
            <Tag color={cfg.color}>{cfg.text}</Tag>
          </Tooltip>
        )
      },
    },
    {
      title: '生命周期',
      dataIndex: 'lifecycle_status',
      key: 'lifecycle_status',
      render: (status) => {
        const cfg = lifecycleMap[status] || { color: 'default', icon: '' }
        return (
          <Tag color={cfg.color}>
            {cfg.icon} {status}
          </Tag>
        )
      },
    },
    {
      title: '激活状态',
      dataIndex: 'activation_status',
      key: 'activation_status',
      render: (status) => {
        const cfg = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={cfg.color}>{cfg.text}</Tag>
      },
    },
    {
      title: '批次号',
      dataIndex: 'batch_no',
      key: 'batch_no',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space wrap>
          <Button type="link" size="small" onClick={() => handleDetailOpen(record)}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => handleUpgradeOpen(record)}>
            升级固件
          </Button>
          {record.apply_status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                onClick={() => handleReviewOpen(record)}
              >
                审核
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 20, fontWeight: 600 }}>OBU设备管理</h2>

      <Alert
        message="设备生命周期说明"
        description={
          <Space wrap>
            <Tag color="gold">⏳ 待审核：用户申领后等待运营审核</Tag>
            <Tag color="red">❌ 已拒绝：申领审核未通过</Tag>
            <Tag color="orange">📦 待激活：设备未激活，可批量激活</Tag>
            <Tag color="green">✅ 已激活：设备正常使用中</Tag>
            <Tag color="default">⏸️ 已停用：设备暂停使用</Tag>
            <Tag color="default">♻️ 已注销：设备生命周期结束</Tag>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="激活状态筛选"
          allowClear
          value={statusFilter}
          onChange={handleStatusFilter}
          options={statusOptions}
          style={{ width: 160 }}
        />
        <Input.Search
          placeholder="按型号搜索"
          allowClear
          onSearch={handleModelSearch}
          style={{ width: 200 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加设备
        </Button>
        <Popconfirm
          title="确认批量激活选中的设备？"
          description={'仅激活状态为“待激活”的设备'}
          onConfirm={handleBatchActivate}
          okText="确认"
          cancelText="取消"
        >
          <Button disabled={selectedRowKeys.length === 0}>批量激活</Button>
        </Popconfirm>
        <Button onClick={handleApplyOpen}>申领OBU</Button>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
        }}
        onChange={handleTableChange}
      />

      <Modal
        title={editingRecord ? '编辑OBU' : '添加OBU'}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={confirmLoading}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {!editingRecord && (
            <>
              <Form.Item
                name="device_sn"
                label="设备序列号"
                rules={[{ required: true, message: '请输入设备序列号' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="model"
                label="型号"
                rules={[{ required: true, message: '请输入型号' }]}
              >
                <Input />
              </Form.Item>
            </>
          )}
          {!editingRecord && (
            <Form.Item name="firmware_version" label="固件版本">
              <Input />
            </Form.Item>
          )}
          {!editingRecord && (
            <Form.Item name="batch_no" label="批次号">
              <Input />
            </Form.Item>
          )}
          {editingRecord && (
            <>
              <Form.Item name="model" label="型号">
                <Input />
              </Form.Item>
              <Form.Item name="firmware_version" label="固件版本">
                <Input />
              </Form.Item>
              <Form.Item name="activation_status" label="激活状态">
                <Select options={statusOptions} placeholder="请选择激活状态" />
              </Form.Item>
              <Form.Item name="user_id" label="绑定用户ID">
                <Input type="number" />
              </Form.Item>
              <Form.Item name="batch_no" label="批次号">
                <Input />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title="升级固件"
        open={upgradeOpen}
        onOk={handleUpgradeOk}
        onCancel={() => {
          setUpgradeOpen(false)
          upgradeForm.resetFields()
          setUpgradeRecord(null)
        }}
        confirmLoading={upgradeLoading}
      >
        {upgradeRecord && (
          <Alert
            message={`当前版本：${upgradeRecord.firmware_version}`}
            description={upgradeRecord.activation_status !== 'active' ? '⚠️ 设备未激活，无法升级' : '升级成功后版本将更新，失败则保持原版本'}
            type={upgradeRecord.activation_status === 'active' ? 'info' : 'warning'}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={upgradeForm} layout="vertical" preserve={false}>
          <Form.Item
            name="firmware_version"
            label="目标固件版本"
            rules={[{ required: true, message: '请输入固件版本' }]}
          >
            <Input placeholder="请输入目标固件版本，如 v3.2.0" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申领OBU"
        open={applyOpen}
        onOk={handleApplyOk}
        onCancel={() => {
          setApplyOpen(false)
          applyForm.resetFields()
        }}
        confirmLoading={applyLoading}
      >
        <Alert
          message="申领说明"
          description="申领提交后需运营审核，审核通过后设备将自动激活。请填写真实信息以便审核。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={applyForm} layout="vertical" preserve={false}>
          <Form.Item
            name="device_sn"
            label="设备序列号"
            rules={[{ required: true, message: '请输入设备序列号' }]}
          >
            <Input placeholder="OBU设备背面的SN码" />
          </Form.Item>
          <Form.Item
            name="model"
            label="设备型号"
            rules={[{ required: true, message: '请输入型号' }]}
          >
            <Input placeholder="如 JL-3000" />
          </Form.Item>
          <Form.Item
            name="owner_name"
            label="车主姓名"
            rules={[{ required: true, message: '请输入车主姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item
            name="owner_phone"
            label="联系手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="请输入11位手机号" />
          </Form.Item>
          <Form.Item
            name="vehicle_plate"
            label="车牌号"
            rules={[{ required: true, message: '请输入车牌号' }]}
          >
            <Input placeholder="如 京A12345" />
          </Form.Item>
          <Form.Item
            name="reason"
            label="申领原因"
          >
            <Input.TextArea rows={3} placeholder="请简要说明申领用途" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申领审核"
        open={reviewOpen}
        onCancel={() => {
          setReviewOpen(false)
          reviewForm.resetFields()
          setReviewRecord(null)
        }}
        footer={[
          <Button key="back" onClick={() => {
            setReviewOpen(false)
            reviewForm.resetFields()
            setReviewRecord(null)
          }}>
            取消
          </Button>,
          <Button
            key="reject"
            danger
            loading={reviewLoading}
            onClick={() => handleReviewOk('rejected')}
            icon={<CloseCircleOutlined />}
          >
            驳回申领
          </Button>,
          <Button
            key="approve"
            type="primary"
            loading={reviewLoading}
            onClick={() => handleReviewOk('approved')}
            icon={<CheckCircleOutlined />}
          >
            通过审核
          </Button>,
        ]}
      >
        {reviewRecord && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="设备序列号">{reviewRecord.device_sn}</Descriptions.Item>
              <Descriptions.Item label="型号">{reviewRecord.model}</Descriptions.Item>
              <Descriptions.Item label="申领原因">{reviewRecord.apply_reason || '-'}</Descriptions.Item>
              <Descriptions.Item label="申领时间">{reviewRecord.apply_at || '-'}</Descriptions.Item>
            </Descriptions>
            <Alert
              message="审核须知"
              description="通过审核后设备将自动激活并绑定用户；驳回需填写驳回原因告知用户。"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={reviewForm} layout="vertical" preserve={false}>
              <Form.Item
                name="reject_reason"
                label="驳回原因（仅驳回时填写）"
              >
                <Input.TextArea rows={3} placeholder="请填写驳回原因，将告知申领用户" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      <Drawer
        title="设备详情"
        placement="right"
        width={500}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {detailRecord && (
          <>
            <Descriptions title="基础信息" column={1} bordered size="small">
              <Descriptions.Item label="设备ID">{detailRecord.id}</Descriptions.Item>
              <Descriptions.Item label="设备序列号">{detailRecord.device_sn}</Descriptions.Item>
              <Descriptions.Item label="型号">{detailRecord.model}</Descriptions.Item>
              <Descriptions.Item label="批次号">{detailRecord.batch_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="持有人">{detailRecord.user_name || detailRecord.user_username || '未绑定'}</Descriptions.Item>
              <Descriptions.Item label="绑定用户ID">{detailRecord.user_id || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="生命周期" column={1} bordered size="small">
              <Descriptions.Item label="当前状态">
                <Tag color={lifecycleMap[detailRecord.lifecycle_status]?.color || 'default'}>
                  {lifecycleMap[detailRecord.lifecycle_status]?.icon} {detailRecord.lifecycle_status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="激活状态">
                <Tag color={statusMap[detailRecord.activation_status]?.color || 'default'}>
                  {statusMap[detailRecord.activation_status]?.text || detailRecord.activation_status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申领状态">
                <Tag color={applyStatusMap[detailRecord.apply_status]?.color || 'default'}>
                  {applyStatusMap[detailRecord.apply_status]?.text || detailRecord.apply_status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="激活进度">
                <Progress percent={detailRecord.activation_status === 'active' ? 100 : (parseInt(detailRecord.batch_activate_progress) || 0)} size="small" />
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="固件信息" column={1} bordered size="small">
              <Descriptions.Item label="当前版本">{detailRecord.firmware_version || '-'}</Descriptions.Item>
              <Descriptions.Item label="升级状态">
                <Tag color={upgradeStatusMap[detailRecord.upgrade_status]?.color || 'default'}>
                  {upgradeStatusMap[detailRecord.upgrade_status]?.text || detailRecord.upgrade_status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="升级结果">
                <Tooltip title={detailRecord.last_upgrade_result || '暂无'}>
                  <span style={{ cursor: 'help' }}>
                    <InfoCircleOutlined /> {detailRecord.last_upgrade_result || '暂无升级记录'}
                  </span>
                </Tooltip>
              </Descriptions.Item>
              <Descriptions.Item label="上次升级时间">{detailRecord.last_upgrade_at || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="时间线" column={1} bordered size="small">
              <Descriptions.Item label="创建时间">{detailRecord.created_at || '-'}</Descriptions.Item>
              <Descriptions.Item label="激活时间">{detailRecord.activated_at || '-'}</Descriptions.Item>
              <Descriptions.Item label="申领时间">{detailRecord.apply_at || '-'}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{detailRecord.updated_at || '-'}</Descriptions.Item>
            </Descriptions>

            {detailRecord.reject_reason && (
              <>
                <Divider />
                <Alert
                  message="驳回原因"
                  description={detailRecord.reject_reason}
                  type="error"
                  showIcon
                />
              </>
            )}
          </>
        )}
      </Drawer>
    </div>
  )
}
