import { useState, useMemo } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Statistic,
  Drawer,
  Descriptions,
  Badge,
  Upload,
  message,
  Divider,
  Tooltip,
  Avatar,
  DatePicker,
  theme,
  Alert,
  Timeline,
  Popconfirm
} from 'antd'
import {
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  UserOutlined,
  DeviceTabletOutlined,
  CameraOutlined,
  ExclamationCircleOutlined,
  BulbOutlined,
  FireOutlined,
  EnvironmentOutlined,
  FilterOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { UploadFile } from 'antd/es/upload/interface'
import dayjs from 'dayjs'
import WorkOrderStatusFlow from '@/components/WorkOrderStatusFlow'

const { Title, Text } = Typography
const { TextArea } = Input
const { useToken } = theme

interface WorkOrder {
  id: string
  code: string
  title: string
  type: 'repair' | 'maintenance' | 'inspection' | 'other'
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deviceId: string
  deviceName: string
  handler: string
  creator: string
  createTime: string
  updateTime: string
  expectedTime?: string
  completedTime?: string
  description: string
  location: string
  images?: string[]
  records: WorkOrderRecord[]
}

interface WorkOrderRecord {
  id: string
  action: string
  status: WorkOrder['status']
  operator: string
  time: string
  remark?: string
  images?: string[]
}

const statusConfig: Record<WorkOrder['status'], { label: string; color: string; icon: any }> = {
  pending: { label: '待分配', color: '#faad14', icon: ClockCircleOutlined },
  assigned: { label: '已分配', color: '#1890ff', icon: UserOutlined },
  in_progress: { label: '进行中', color: '#1677ff', icon: PlayCircleOutlined },
  completed: { label: '已完成', color: '#52c41a', icon: CheckCircleOutlined },
  cancelled: { label: '已取消', color: '#bfbfbf', icon: CloseCircleOutlined }
}

const typeConfig: Record<WorkOrder['type'], { label: string; color: string }> = {
  repair: { label: '故障维修', color: 'red' },
  maintenance: { label: '保养维护', color: 'blue' },
  inspection: { label: '巡检', color: 'green' },
  other: { label: '其他', color: 'default' }
}

const priorityConfig: Record<WorkOrder['priority'], { label: string; color: string; icon: any }> = {
  low: { label: '低', color: 'default', icon: BulbOutlined },
  medium: { label: '中', color: 'blue', icon: ExclamationCircleOutlined },
  high: { label: '高', color: 'orange', icon: ExclamationCircleOutlined },
  urgent: { label: '紧急', color: 'red', icon: FireOutlined }
}

const handlerOptions = [
  { label: '张运维', value: '张运维' },
  { label: '李工程师', value: '李工程师' },
  { label: '王技术员', value: '王技术员' },
  { label: '赵师傅', value: '赵师傅' },
  { label: '刘工', value: '刘工' }
]

const deviceOptions = Array.from({ length: 20 }).map((_, i) => ({
  label: `RO-${String.fromCharCode(65 + (i % 3))}${String(i + 1).padStart(3, '0')} - ${['阳光花园', '幸福里小区', '翠湖花园', '明月苑'][i % 4]}${Math.floor(i / 4) + 1}号机组`,
  value: `RO-${String.fromCharCode(65 + (i % 3))}${String(i + 1).padStart(3, '0')}`
}))

const mockWorkOrders: WorkOrder[] = [
  {
    id: 'WO001', code: 'WO20260619001', title: 'RO-A001设备离线故障排查',
    type: 'repair', status: 'pending', priority: 'urgent',
    deviceId: 'RO-A001', deviceName: '阳光花园1号楼 RO-A001',
    handler: '', creator: '系统自动',
    createTime: '2026-06-19 08:23:00', updateTime: '2026-06-19 08:23:00',
    expectedTime: '2026-06-19 12:00:00',
    description: '设备已离线超过30分钟，心跳停止。疑似网络故障或电源断开。',
    location: '阳光花园1号楼1单元门口',
    records: [
      { id: 'R1', action: '创建工单', status: 'pending', operator: '系统自动', time: '2026-06-19 08:23:00', remark: '离线告警自动触发工单' }
    ]
  },
  {
    id: 'WO002', code: 'WO20260619002', title: 'RO-B012滤芯更换（季度保养）',
    type: 'maintenance', status: 'assigned', priority: 'medium',
    deviceId: 'RO-B012', deviceName: '翠湖花园5号 RO-B012',
    handler: '张运维', creator: '王主管',
    createTime: '2026-06-19 09:15:00', updateTime: '2026-06-19 09:30:00',
    expectedTime: '2026-06-20 18:00:00',
    description: 'PP滤芯和CTO滤芯使用时长已达建议更换周期（90天），需要尽快安排更换。',
    location: '翠湖花园5号楼2单元门口',
    images: ['filter-alert-1.jpg'],
    records: [
      { id: 'R1', action: '创建工单', status: 'pending', operator: '王主管', time: '2026-06-19 09:15:00', remark: '滤芯到期提醒' },
      { id: 'R2', action: '分配工单', status: 'assigned', operator: '王主管', time: '2026-06-19 09:30:00', remark: '请张运维今天或明天处理' }
    ]
  },
  {
    id: 'WO003', code: 'WO20260619003', title: '阳光花园小区月度巡检',
    type: 'inspection', status: 'in_progress', priority: 'low',
    deviceId: 'RO-A001~A010', deviceName: '阳光花园 RO-A001~A010',
    handler: '李工程师', creator: '王主管',
    createTime: '2026-06-19 10:00:00', updateTime: '2026-06-19 11:05:00',
    expectedTime: '2026-06-19 18:00:00',
    description: '月度例行巡检：设备外观清洁、TDS水质检测、滤芯检查、UV灯运行时长检查、电压电流检测。',
    location: '阳光花园小区内10台设备',
    records: [
      { id: 'R1', action: '创建工单', status: 'pending', operator: '王主管', time: '2026-06-19 10:00:00', remark: '月度巡检计划' },
      { id: 'R2', action: '分配工单', status: 'assigned', operator: '王主管', time: '2026-06-19 10:15:00', remark: '分配给李工' },
      { id: 'R3', action: '开始处理', status: 'in_progress', operator: '李工程师', time: '2026-06-19 11:05:00', remark: '到达现场，开始巡检' }
    ]
  },
  {
    id: 'WO004', code: 'WO20260619004', title: 'RO-D005水温异常告警',
    type: 'repair', status: 'in_progress', priority: 'high',
    deviceId: 'RO-D005', deviceName: '幸福里小区3栋 RO-D005',
    handler: '王技术员', creator: '系统自动',
    createTime: '2026-06-19 10:32:00', updateTime: '2026-06-19 11:45:00',
    expectedTime: '2026-06-19 14:00:00',
    description: '设备水温持续偏高，最高达到48°C，超过阈值45°C。疑似散热系统故障或环境温度过高。',
    location: '幸福里小区3栋架空层',
    images: ['temp-alert-1.jpg', 'temp-alert-2.jpg'],
    records: [
      { id: 'R1', action: '创建工单', status: 'pending', operator: '系统自动', time: '2026-06-19 10:32:00', remark: '温度告警自动创建' },
      { id: 'R2', action: '分配工单', status: 'assigned', operator: '王主管', time: '2026-06-19 10:40:00' },
      { id: 'R3', action: '开始处理', status: 'in_progress', operator: '王技术员', time: '2026-06-19 11:45:00', remark: '已到达现场，正在拆机检查散热风扇' }
    ]
  },
  {
    id: 'WO005', code: 'WO20260619005', title: 'RO-A008UV灯运行超时处理',
    type: 'repair', status: 'completed', priority: 'medium',
    deviceId: 'RO-A008', deviceName: '阳光花园3号楼 RO-A008',
    handler: '赵师傅', creator: '系统自动',
    createTime: '2026-06-19 07:08:00', updateTime: '2026-06-19 10:20:00',
    completedTime: '2026-06-19 10:20:00',
    description: 'UV杀菌灯连续运行超过建议时长（8小时），需要人工复位并检查原因。',
    location: '阳光花园3号楼3单元',
    images: ['uv-1.jpg', 'uv-2.jpg', 'uv-3.jpg'],
    records: [
      { id: 'R1', action: '创建工单', status: 'pending', operator: '系统自动', time: '2026-06-19 07:08:00', remark: 'UV灯运行超时告警' },
      { id: 'R2', action: '分配工单', status: 'assigned', operator: '王主管', time: '2026-06-19 07:30:00' },
      { id: 'R3', action: '开始处理', status: 'in_progress', operator: '赵师傅', time: '2026-06-19 08:45:00', remark: '到达现场' },
      { id: 'R4', action: '完成工单', status: 'completed', operator: '赵师傅', time: '2026-06-19 10:20:00', remark: '已重置UV灯控制器，检查发现为定时器程序异常，已升级固件修复。设备运行正常。', images: ['uv-1.jpg', 'uv-2.jpg', 'uv-3.jpg'] }
    ]
  },
  {
    id: 'WO006', code: 'WO20260618015', title: 'RO-C003电磁阀更换',
    type: 'repair', status: 'completed', priority: 'high',
    deviceId: 'RO-C003', deviceName: '明月苑二期 RO-C003',
    handler: '张运维', creator: '李工程师',
    createTime: '2026-06-18 14:30:00', updateTime: '2026-06-18 18:10:00',
    completedTime: '2026-06-18 18:10:00',
    description: '进水电磁阀无法正常闭合，导致废水长流。已申请备件。',
    location: '明月苑二期B栋',
    records: [
      { id: 'R1', action: '创建工单', status: 'pending', operator: '李工程师', time: '2026-06-18 14:30:00' },
      { id: 'R2', action: '分配工单', status: 'assigned', operator: '王主管', time: '2026-06-18 14:45:00' },
      { id: 'R3', action: '开始处理', status: 'in_progress', operator: '张运维', time: '2026-06-18 15:30:00', remark: '开始拆机' },
      { id: 'R4', action: '完成工单', status: 'completed', operator: '张运维', time: '2026-06-18 18:10:00', remark: '已更换电磁阀，测试正常' }
    ]
  }
]

function WorkOrders() {
  const { token } = useToken()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<WorkOrder | null>(null)
  const [createForm] = Form.useForm()
  const [commentForm] = Form.useForm()
  const [filterForm] = Form.useForm()
  const [commentLoading, setCommentLoading] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])

  const stats = useMemo(() => ({
    total: workOrders.length,
    pending: workOrders.filter(w => w.status === 'pending').length,
    inProgress: workOrders.filter(w => ['assigned', 'in_progress'].includes(w.status)).length,
    completed: workOrders.filter(w => w.status === 'completed').length,
    urgent: workOrders.filter(w => w.priority === 'urgent' && !['completed', 'cancelled'].includes(w.status)).length
  }), [workOrders])

  const filteredOrders = useMemo(() => {
    const values = filterForm.getFieldsValue()
    return workOrders.filter(w => {
      if (values.status && w.status !== values.status) return false
      if (values.priority && w.priority !== values.priority) return false
      if (values.type && w.type !== values.type) return false
      if (values.handler && w.handler !== values.handler) return false
      if (values.keyword) {
        const kw = values.keyword.toLowerCase()
        return w.code.toLowerCase().includes(kw) || w.title.toLowerCase().includes(kw) || w.deviceId.toLowerCase().includes(kw)
      }
      return true
    })
  }, [workOrders, filterForm])

  const handleViewDetail = (order: WorkOrder) => {
    setCurrentOrder(order)
    setDetailOpen(true)
    commentForm.resetFields()
    setUploadFiles([])
  }

  const handleCreateOrder = () => {
    createForm.resetFields()
    setCreateOpen(true)
  }

  const handleConfirmCreate = () => {
    createForm.validateFields().then(values => {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const code = `WO${dayjs().format('YYYYMMDD')}${String(workOrders.length + 100).padStart(3, '0')}`
      const newOrder: WorkOrder = {
        id: `WO${Date.now()}`,
        code,
        title: values.title,
        type: values.type,
        status: values.handler ? 'assigned' : 'pending',
        priority: values.priority,
        deviceId: values.deviceId || '-',
        deviceName: values.deviceId ? deviceOptions.find(d => d.value === values.deviceId)?.label || values.deviceId : '-',
        handler: values.handler || '',
        creator: '张运维',
        createTime: now,
        updateTime: now,
        expectedTime: values.expectedTime ? values.expectedTime.format('YYYY-MM-DD HH:mm:ss') : undefined,
        description: values.description || '',
        location: values.location || '',
        records: [{
          id: `R${Date.now()}`,
          action: '创建工单',
          status: values.handler ? 'assigned' : 'pending',
          operator: '张运维',
          time: now,
          remark: values.handler ? `创建并分配给 ${values.handler}` : '创建待分配'
        }]
      }
      setWorkOrders(prev => [newOrder, ...prev])
      setCreateOpen(false)
      message.success(`工单创建成功：${code}`)
    })
  }

  const handleStatusChange = (orderId: string, newStatus: WorkOrder['status'], remark?: string, handler?: string) => {
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const actionMap: Record<string, string> = {
      assigned: '分配工单',
      in_progress: '开始处理',
      completed: '完成工单',
      cancelled: '取消工单'
    }
    setWorkOrders(prev => prev.map(w => {
      if (w.id !== orderId) return w
      return {
        ...w,
        status: newStatus,
        handler: handler || w.handler,
        updateTime: now,
        completedTime: newStatus === 'completed' ? now : w.completedTime,
        records: [...w.records, {
          id: `R${Date.now()}`,
          action: actionMap[newStatus] || '状态变更',
          status: newStatus,
          operator: '张运维',
          time: now,
          remark: handler ? `${remark || ''} 分配给 ${handler}`.trim() : remark
        }]
      }
    }))
    if (currentOrder && currentOrder.id === orderId) {
      const updated = workOrders.find(w => w.id === orderId) || currentOrder
      setCurrentOrder({
        ...updated,
        status: newStatus,
        handler: handler || updated.handler,
        updateTime: now,
        completedTime: newStatus === 'completed' ? now : updated.completedTime,
        records: [...updated.records, {
          id: `R${Date.now()}`,
          action: actionMap[newStatus] || '状态变更',
          status: newStatus,
          operator: '张运维',
          time: now,
          remark: handler ? `${remark || ''} 分配给 ${handler}`.trim() : remark
        }]
      })
    }
    message.success(`工单状态已更新为：${statusConfig[newStatus].label}`)
  }

  const handleAddComment = () => {
    commentForm.validateFields().then(values => {
      if (!currentOrder) return
      setCommentLoading(true)
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const newRecord: WorkOrderRecord = {
        id: `R${Date.now()}`,
        action: '添加备注',
        status: currentOrder.status,
        operator: '张运维',
        time: now,
        remark: values.comment,
        images: uploadFiles.length > 0 ? uploadFiles.map(f => f.name) : undefined
      }
      setTimeout(() => {
        setCurrentOrder(prev => prev ? {
          ...prev,
          updateTime: now,
          records: [...prev.records, newRecord]
        } : prev)
        setWorkOrders(prev => prev.map(w => w.id === currentOrder.id ? {
          ...w, updateTime: now, records: [...w.records, newRecord]
        } : w))
        commentForm.resetFields()
        setUploadFiles([])
        setCommentLoading(false)
        message.success('处理记录已添加')
      }, 500)
    })
  }

  const columns: ColumnsType<WorkOrder> = [
    {
      title: '工单编号',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      fixed: 'left' as const,
      render: (t, r) => (
        <a onClick={() => handleViewDetail(r)} style={{ fontWeight: 500 }}>
          <Text code>{t}</Text>
        </a>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 240,
      ellipsis: true,
      render: (t, r) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            {r.priority === 'urgent' && <Badge color="#cf1322" text={<Text type="danger" style={{ fontSize: 11 }}>紧急</Text>} />}
            <Text strong>{t}</Text>
          </Space>
          {r.images && r.images.length > 0 && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              <CameraOutlined /> {r.images.length}张图片
            </Text>
          )}
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (t: WorkOrder['type']) => <Tag color={typeConfig[t].color}>{typeConfig[t].label}</Tag>
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (p: WorkOrder['priority']) => {
        const cfg = priorityConfig[p]
        return <Tag color={cfg.color} icon={<cfg.icon />}>{cfg.label}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: WorkOrder['status']) => {
        const cfg = statusConfig[s]
        return <Tag color={s === 'pending' ? 'warning' : s === 'completed' ? 'success' : s === 'cancelled' ? 'default' : 'processing'} icon={<cfg.icon />}>{cfg.label}</Tag>
      }
    },
    {
      title: '关联设备',
      dataIndex: 'deviceId',
      key: 'deviceId',
      width: 120,
      render: (t, r) => (
        <Tooltip title={r.deviceName}>
          <Tag icon={<DeviceTabletOutlined />} style={{ marginInlineEnd: 0 }}>{t}</Tag>
        </Tooltip>
      )
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 100,
      render: (t) => t
        ? <Space size={4}>
            <Avatar size={20} icon={<UserOutlined />} style={{ width: 20, height: 20, fontSize: 10 }} />
            <Text>{t}</Text>
          </Space>
        : <Text type="secondary" style={{ fontSize: 12 }}>待分配</Text>
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
      sorter: (a, b) => a.createTime.localeCompare(b.createTime),
      render: (t) => <Text type="secondary" style={{ fontSize: 12 }}>{t}</Text>
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_, r) => (
        <Space size={2}>
          <Button type="link" size="small" onClick={() => handleViewDetail(r)}>详情</Button>
          {r.status === 'pending' && (
            <Button type="link" size="small" onClick={() => handleStatusChange(r.id, 'assigned', '快速分配', '张运维')}>分配</Button>
          )}
          {(r.status === 'pending' || r.status === 'assigned') && (
            <Button type="link" size="small" onClick={() => handleStatusChange(r.id, 'in_progress')}>开始</Button>
          )}
          {r.status === 'in_progress' && (
            <Button type="link" size="small" style={{ color: '#52c41a' }} onClick={() => {
              Modal.confirm({
                title: '确认完成工单？',
                content: '完成后将无法修改，请确认所有处理工作已完成。',
                okText: '确认完成',
                onOk: () => handleStatusChange(r.id, 'completed')
              })
            }}>完成</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { label: '全部工单', value: stats.total, color: '#1890ff', icon: <FileTextOutlined /> },
          { label: '待分配', value: stats.pending, color: '#faad14', icon: <ClockCircleOutlined /> },
          { label: '进行中', value: stats.inProgress, color: '#1677ff', icon: <PlayCircleOutlined /> },
          { label: '已完成', value: stats.completed, color: '#52c41a', icon: <CheckCircleOutlined /> },
          { label: '紧急待处理', value: stats.urgent, color: '#cf1322', icon: <FireOutlined /> }
        ].map((s, i) => (
          <Col xs={12} sm={12} md={24/5} key={i}>
            <Card bordered={false} style={{ borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${s.color}15`, color: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18
                }}>
                  {s.icon}
                </div>
                <div>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>}
                    value={s.value}
                    valueStyle={{ color: s.color, fontSize: 20, fontWeight: 600 }}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Form form={filterForm} layout="inline" style={{ flexWrap: 'wrap' }}>
            <Space wrap size={[8, 8]}>
              <Form.Item name="keyword" style={{ marginBottom: 0 }}>
                <Input placeholder="编号/标题/设备号" prefix={<SearchOutlined />} allowClear style={{ width: 200 }} />
              </Form.Item>
              <Form.Item name="status" style={{ marginBottom: 0 }}>
                <Select placeholder="状态" allowClear style={{ width: 120 }} options={Object.entries(statusConfig).map(([k, v]) => ({ label: v.label, value: k }))} />
              </Form.Item>
              <Form.Item name="priority" style={{ marginBottom: 0 }}>
                <Select placeholder="优先级" allowClear style={{ width: 100 }} options={Object.entries(priorityConfig).map(([k, v]) => ({ label: v.label, value: k }))} />
              </Form.Item>
              <Form.Item name="type" style={{ marginBottom: 0 }}>
                <Select placeholder="类型" allowClear style={{ width: 110 }} options={Object.entries(typeConfig).map(([k, v]) => ({ label: v.label, value: k }))} />
              </Form.Item>
              <Form.Item name="handler" style={{ marginBottom: 0 }}>
                <Select placeholder="处理人" allowClear style={{ width: 110 }} options={handlerOptions} />
              </Form.Item>
              <Space>
                <Button icon={<FilterOutlined />}>筛选</Button>
                <Button onClick={() => filterForm.resetFields()}>重置</Button>
              </Space>
            </Space>
          </Form>
          <Space>
            <Button icon={<ReloadOutlined />}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateOrder}>创建工单</Button>
          </Space>
        </div>

        <Table<WorkOrder>
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          size="middle"
          scroll={{ x: 1400 }}
          pagination={{ showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条工单`, defaultPageSize: 10 }}
        />
      </Card>

      <Modal
        title={<Space><PlusOutlined style={{ color: '#52c41a' }} />创建工单</Space>}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleConfirmCreate}
        okText="创建"
        cancelText="取消"
        width={640}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical">
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="title" label="工单标题" rules={[{ required: true, message: '请输入工单标题' }]}>
                <Input placeholder="请输入工单标题，简明描述问题" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="type" label="工单类型" rules={[{ required: true, message: '请选择类型' }]} initialValue="repair">
                <Select options={Object.entries(typeConfig).map(([k, v]) => ({ label: v.label, value: k }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]} initialValue="medium">
                <Select options={Object.entries(priorityConfig).map(([k, v]) => ({ label: v.label, value: k }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deviceId" label="关联设备">
                <Select placeholder="请选择设备" allowClear showSearch optionFilterProp="label" options={deviceOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="handler" label="处理人">
                <Select placeholder="留空则为待分配" allowClear options={handlerOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedTime" label="期望完成时间">
                <DatePicker showTime style={{ width: '100%' }} placeholder="选择期望完成时间" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="location" label="位置">
            <Input prefix={<EnvironmentOutlined />} placeholder="请输入设备位置或安装地点" />
          </Form.Item>
          <Form.Item name="description" label="问题描述" rules={[{ required: true, message: '请描述问题' }]}>
            <TextArea rows={4} placeholder="请详细描述问题现象、已采取的措施等信息..." showCount maxLength={500} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={
          currentOrder && (
            <Space direction="vertical" size={2} style={{ lineHeight: 1.2 }}>
              <Space>
                <Text code>{currentOrder.code}</Text>
                <Tag color={typeConfig[currentOrder.type].color}>{typeConfig[currentOrder.type].label}</Tag>
                {(() => {
                  const cfg = priorityConfig[currentOrder.priority]
                  return <Tag color={cfg.color} icon={<cfg.icon />}>{cfg.label}</Tag>
                })()}
              </Space>
              <Text strong style={{ fontSize: 14 }}>{currentOrder.title}</Text>
            </Space>
          )
        }
        placement="right"
        width={680}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          currentOrder && (
            <WorkOrderStatusFlow
              status={currentOrder.status}
              handler={currentOrder.handler}
              onStatusChange={(ns, h) => {
                if (ns === 'completed') {
                  Modal.confirm({
                    title: '确认完成工单？',
                    content: '完成后将无法修改，请确认所有处理工作已完成。',
                    okText: '确认完成',
                    onOk: () => handleStatusChange(currentOrder.id, ns, undefined, h)
                  })
                } else {
                  handleStatusChange(currentOrder.id, ns, undefined, h)
                }
              }}
            />
          )
        }
      >
        {currentOrder && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" bordered={false} style={{ borderRadius: 10, background: `${statusConfig[currentOrder.status].color}10`, border: `1px solid ${statusConfig[currentOrder.status].color}30` }}>
              <Descriptions column={2} size="small" labelStyle={{ width: 90 }}>
                <Descriptions.Item label="工单状态">
                  {(() => {
                    const cfg = statusConfig[currentOrder.status]
                    return <Tag color={currentOrder.status === 'pending' ? 'warning' : currentOrder.status === 'completed' ? 'success' : 'processing'} icon={<cfg.icon />} style={{ fontSize: 13 }}>{cfg.label}</Tag>
                  })()}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  <Text type="secondary" style={{ fontSize: 12 }}>{currentOrder.createTime}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="处理人">
                  {currentOrder.handler
                    ? <Space size={4}><Avatar size={18} icon={<UserOutlined />} style={{ width: 18, height: 18, fontSize: 9 }} /><Text>{currentOrder.handler}</Text></Space>
                    : <Text type="secondary" style={{ fontSize: 12 }}>待分配</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  <Text type="secondary" style={{ fontSize: 12 }}>{currentOrder.updateTime}</Text>
                </Descriptions.Item>
                {currentOrder.expectedTime && (
                  <Descriptions.Item label="期望完成">
                    <Text type="secondary" style={{ fontSize: 12 }}>{currentOrder.expectedTime}</Text>
                  </Descriptions.Item>
                )}
                {currentOrder.completedTime && (
                  <Descriptions.Item label="实际完成">
                    <Text type="secondary" style={{ fontSize: 12, color: '#52c41a' }}>{currentOrder.completedTime}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            <Descriptions title="基本信息" column={1} bordered size="small" labelStyle={{ width: 100, background: '#fafafa' }}>
              <Descriptions.Item label="工单编号">{currentOrder.code}</Descriptions.Item>
              <Descriptions.Item label="创建人">{currentOrder.creator}</Descriptions.Item>
              <Descriptions.Item label="关联设备">
                <Space><DeviceTabletOutlined style={{ color: token.colorTextSecondary }} />{currentOrder.deviceName}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="位置">
                <Space><EnvironmentOutlined style={{ color: token.colorTextSecondary }} />{currentOrder.location}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="问题描述">
                <Text style={{ whiteSpace: 'pre-wrap' }}>{currentOrder.description}</Text>
              </Descriptions.Item>
              {currentOrder.images && currentOrder.images.length > 0 && (
                <Descriptions.Item label="现场图片">
                  <Space wrap>
                    {currentOrder.images.map((img, i) => (
                      <div key={i} style={{
                        width: 80, height: 80, borderRadius: 6,
                        background: `linear-gradient(135deg, ${token.colorPrimary}20, ${token.colorPrimary}05)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px dashed ${token.colorBorderSecondary}`,
                        color: token.colorTextSecondary,
                        fontSize: 12
                      }}>
                        <CameraOutlined />
                      </div>
                    ))}
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left" orientationMargin={0} plain style={{ marginTop: 0 }}>
              <Space><ClockCircleOutlined />处理时间线</Space>
            </Divider>

            <Card size="small" bordered={false} style={{ background: '#fafafa', borderRadius: 10 }} bodyStyle={{ paddingTop: 4, paddingBottom: 4 }}>
              <Timeline
                mode="left"
                items={currentOrder.records.slice().reverse().map(r => ({
                  color: statusConfig[r.status].color,
                  dot: React.createElement(statusConfig[r.status].icon),
                  label: <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{r.time}</Text>,
                  children: (
                    <Space direction="vertical" size={2} style={{ paddingBottom: 8 }}>
                      <Space>
                        <Text strong style={{ fontSize: 13 }}>{r.action}</Text>
                        <Tag color={r.status === 'pending' ? 'warning' : r.status === 'completed' ? 'success' : 'processing'} style={{ fontSize: 11, padding: '0 6px' }}>
                          {statusConfig[r.status].label}
                        </Tag>
                      </Space>
                      <Space size={4}>
                        <Avatar size={16} icon={<UserOutlined />} style={{ width: 16, height: 16, fontSize: 8 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>{r.operator}</Text>
                      </Space>
                      {r.remark && <Text style={{ fontSize: 13, lineHeight: 1.6 }}>{r.remark}</Text>}
                      {r.images && r.images.length > 0 && (
                        <Space wrap style={{ marginTop: 4 }}>
                          {r.images.map((img, i) => (
                            <div key={i} style={{
                              width: 60, height: 60, borderRadius: 4,
                              background: token.colorBgContainer,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: `1px solid ${token.colorBorderSecondary}`,
                              color: token.colorTextTertiary,
                              fontSize: 10
                            }}>
                              <CameraOutlined /><Text style={{ fontSize: 10, marginLeft: 2 }}>图{i + 1}</Text>
                            </div>
                          ))}
                        </Space>
                      )}
                    </Space>
                  )
                }))}
              />
            </Card>

            {!['completed', 'cancelled'].includes(currentOrder.status) && (
              <>
                <Divider orientation="left" orientationMargin={0} plain style={{ marginTop: 0 }}>
                  <Space><PlusOutlined />添加处理记录</Space>
                </Divider>
                <Card size="small" bordered={false} style={{ borderRadius: 10, border: `1px solid ${token.colorBorderSecondary}` }}>
                  <Form form={commentForm} layout="vertical">
                    <Form.Item name="comment" rules={[{ required: true, message: '请输入处理内容' }]} style={{ marginBottom: 12 }}>
                      <TextArea rows={3} placeholder="记录本次处理内容、检查结果、下一步计划等..." showCount maxLength={300} />
                    </Form.Item>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <Upload
                        fileList={uploadFiles}
                        onChange={({ fileList }) => setUploadFiles(fileList)}
                        beforeUpload={() => false}
                        multiple
                        listType="picture-card"
                        maxCount={9}
                        style={{ display: 'inline-block' }}
                      >
                        <div>
                          <CameraOutlined />
                          <div style={{ marginTop: 4, fontSize: 12 }}>上传图片</div>
                        </div>
                      </Upload>
                      <Button type="primary" icon={<PlusOutlined />} loading={commentLoading} onClick={handleAddComment}>
                        提交记录
                      </Button>
                    </div>
                  </Form>
                </Card>
              </>
            )}
          </Space>
        )}
      </Drawer>
    </div>
  )
}

export default WorkOrders
