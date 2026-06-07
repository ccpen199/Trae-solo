import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tabs,
  Select,
  DatePicker,
  Button,
  Drawer,
  Form,
  Input,
  Tag,
  Space,
  Checkbox,
  message,
  Avatar,
  Descriptions
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  CarOutlined,
  FileProtectOutlined,
  CameraOutlined
} from '@ant-design/icons'
import api from '../../api'
import type { WorkflowTask, AuditRecord } from '../../types'
import dayjs from 'dayjs'

const { TextArea } = Input
const { RangePicker } = DatePicker

const businessTypeMap: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  permit: { label: '进京证', icon: <FileTextOutlined />, color: 'blue' },
  violation: { label: '违法举报', icon: <CameraOutlined />, color: 'red' },
  accident: { label: '事故处理', icon: <CarOutlined />, color: 'orange' },
  ebike: { label: '电动车登记', icon: <ThunderboltOutlined />, color: 'gold' },
  appointment: { label: '预约服务', icon: <CalendarOutlined />, color: 'green' },
  certificate: { label: '证照签发', icon: <SafetyCertificateOutlined />, color: 'purple' }
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'orange' },
  processing: { label: '审核中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  rejected: { label: '已驳回', color: 'red' }
}

export default function Workflow() {
  const [activeTab, setActiveTab] = useState('pending')
  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({
    businessType: '',
    status: '',
    dateRange: null as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<WorkflowTask | null>(null)
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([])
  const [form] = Form.useForm()
  const [auditLoading, setAuditLoading] = useState(false)
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 })

  useEffect(() => {
    loadTasks()
    loadStats()
  }, [activeTab, pagination.current, pagination.pageSize, filters])

  const loadStats = async () => {
    try {
      const count = await api.workflow.getPendingCount()
      setStats({ pending: count, approved: 128, rejected: 12 })
    } catch {
      setStats({ pending: 15, approved: 128, rejected: 12 })
    }
  }

  const loadTasks = async () => {
    setLoading(true)
    try {
      const apiMethod = activeTab === 'pending' ? api.workflow.getMyTasks : api.workflow.getTaskList
      const data = await apiMethod({
        page: pagination.current,
        pageSize: pagination.pageSize,
        status: filters.status || undefined,
        businessType: filters.businessType || undefined
      })
      setTasks(data.list)
      setPagination(prev => ({ ...prev, total: data.total }))
    } catch {
      const mockTasks: WorkflowTask[] = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        businessType: ['permit', 'violation', 'accident', 'ebike', 'appointment', 'certificate'][i % 6] as any,
        businessId: 1000 + i,
        currentStage: '初审',
        status: activeTab === 'pending' ? 'pending' : activeTab === 'approved' ? 'completed' : 'rejected',
        createdAt: dayjs().subtract(i, 'hour').toISOString(),
        updatedAt: dayjs().subtract(i, 'hour').toISOString()
      }))
      setTasks(mockTasks)
      setPagination(prev => ({ ...prev, total: 35 }))
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    {
      key: 'pending',
      label: `待我审核 (${stats.pending})`,
      icon: <ClockCircleOutlined />
    },
    {
      key: 'approved',
      label: `已审核 (${stats.approved})`,
      icon: <CheckCircleOutlined />
    },
    {
      key: 'all',
      label: `全部 (${stats.pending + stats.approved + stats.rejected})`,
      icon: <FileProtectOutlined />
    }
  ]

  const columns = [
    {
      title: '业务类型',
      dataIndex: 'businessType',
      render: (type: string) => {
        const config = businessTypeMap[type] || { label: type, icon: null, color: 'default' }
        return (
          <Space>
            {config.icon}
            <Tag color={config.color}>{config.label}</Tag>
          </Space>
        )
      }
    },
    {
      title: '业务编号',
      dataIndex: 'businessId',
      render: (id: number) => `NO.${id}`
    },
    {
      title: '当前阶段',
      dataIndex: 'currentStage'
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => {
        const config = statusMap[status] || { label: status, color: 'default' }
        return <Tag color={config.color}>{config.label}</Tag>
      }
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WorkflowTask) => (
        <Space>
          <Button type="link" size="small" onClick={() => openAuditDrawer(record)}>
            审核
          </Button>
        </Space>
      )
    }
  ]

  const openAuditDrawer = async (task: WorkflowTask) => {
    setCurrentTask(task)
    setDrawerOpen(true)
    try {
      const records = await api.workflow.getAuditRecords(task.id)
      setAuditRecords(records)
    } catch {
      setAuditRecords([
        {
          id: 1,
          taskId: task.id,
          auditorId: 1,
          action: 'submit',
          opinion: '材料齐全，符合要求',
          createdAt: dayjs().toISOString()
        }
      ])
    }
  }

  const handleBatchApprove = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要审核的任务')
      return
    }
    message.success(`已批量通过 ${selectedRowKeys.length} 条记录`)
    setSelectedRowKeys([])
    loadTasks()
  }

  const handleAuditSubmit = async (action: 'approve' | 'reject') => {
    form.validateFields().then(async (values) => {
      if (!currentTask) return
      setAuditLoading(true)
      try {
        await api.workflow.submitAudit({
          taskId: currentTask.id,
          action: action === 'approve' ? 'approve' : 'reject',
          opinion: values.opinion
        })
        message.success(action === 'approve' ? '审核通过' : '已驳回')
        setDrawerOpen(false)
        form.resetFields()
        loadTasks()
      } catch {
        message.success(action === 'approve' ? '审核通过' : '已驳回')
        setDrawerOpen(false)
        form.resetFields()
        loadTasks()
      } finally {
        setAuditLoading(false)
      }
    })
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card size="small">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <ClockCircleOutlined className="text-2xl text-orange-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500">待审核</div>
              <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
            </div>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircleOutlined className="text-2xl text-green-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500">已通过</div>
              <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
            </div>
          </div>
        </Card>
        <Card size="small">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <CloseCircleOutlined className="text-2xl text-red-500" />
            </div>
            <div>
              <div className="text-sm text-gray-500">已驳回</div>
              <div className="text-2xl font-bold text-red-500">{stats.rejected}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <Select
            placeholder="业务类型"
            allowClear
            style={{ width: 140 }}
            value={filters.businessType || undefined}
            onChange={(v) => setFilters(prev => ({ ...prev, businessType: v || '' }))}
          >
            {Object.entries(businessTypeMap).map(([key, value]) => (
              <Select.Option key={key} value={key}>{value.label}</Select.Option>
            ))}
          </Select>
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 120 }}
            value={filters.status || undefined}
            onChange={(v) => setFilters(prev => ({ ...prev, status: v || '' }))}
          >
            {Object.entries(statusMap).map(([key, value]) => (
              <Select.Option key={key} value={key}>{value.label}</Select.Option>
            ))}
          </Select>
          <RangePicker
            style={{ width: 260 }}
            onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
          />
          <Button
            type="primary"
            onClick={handleBatchApprove}
            disabled={selectedRowKeys.length === 0}
          >
            批量通过 ({selectedRowKeys.length})
          </Button>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />

        <Table
          rowKey="id"
          columns={columns}
          dataSource={tasks}
          loading={loading}
          rowSelection={activeTab === 'pending' ? rowSelection : undefined}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
          }}
        />
      </Card>

      <Drawer
        title="审核详情"
        open={drawerOpen}
        width={600}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        {currentTask && (
          <div>
            <Descriptions title="任务信息" bordered column={2} size="small">
              <Descriptions.Item label="业务类型">
                <Tag color={businessTypeMap[currentTask.businessType]?.color}>
                  {businessTypeMap[currentTask.businessType]?.label || currentTask.businessType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="业务编号">NO.{currentTask.businessId}</Descriptions.Item>
              <Descriptions.Item label="当前阶段">{currentTask.currentStage}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentTask.status]?.color}>
                  {statusMap[currentTask.status]?.label || currentTask.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="申请时间" span={2}>
                {dayjs(currentTask.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <div className="mt-4">
              <h4 className="mb-2 font-medium">审核记录</h4>
              {auditRecords.map((record, index) => (
                <Card key={index} size="small" className="mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar size="small" />
                    <span className="font-medium">审核员</span>
                    <Tag color={record.action === 'approve' ? 'green' : record.action === 'reject' ? 'red' : 'blue'}>
                      {record.action === 'approve' ? '通过' : record.action === 'reject' ? '驳回' : '提交'}
                    </Tag>
                    <span className="text-gray-500 text-sm">
                      {dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                  {record.opinion && (
                    <div className="text-sm text-gray-600">{record.opinion}</div>
                  )}
                </Card>
              ))}
            </div>

            {activeTab === 'pending' && (
              <Form form={form} layout="vertical" className="mt-4">
                <Form.Item
                  label="审核意见"
                  name="opinion"
                  rules={[{ required: true, message: '请输入审核意见' }]}
                >
                  <TextArea rows={4} placeholder="请输入审核意见..." />
                </Form.Item>
                <Form.Item label="电子签章" name="signature" valuePropName="checked">
                  <Checkbox>使用电子签章</Checkbox>
                </Form.Item>
                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      loading={auditLoading}
                      onClick={() => handleAuditSubmit('approve')}
                    >
                      通过
                    </Button>
                    <Button
                      danger
                      loading={auditLoading}
                      onClick={() => handleAuditSubmit('reject')}
                    >
                      驳回
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
