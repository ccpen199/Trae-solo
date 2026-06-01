import { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Form,
  Select,
  Input,
  InputNumber,
  Switch,
  Slider,
  Button,
  Table,
  Tag,
  Space,
  message,
  Typography,
  Modal,
} from 'antd'
import {
  CheckCircleOutlined,
  PlayCircleOutlined,
  RollbackOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../store'
import * as publishApi from '../api/publish'
import * as workloadsApi from '../api/workloads'
import { formatDate } from '../utils/helpers'
import ConfirmDialog from '../components/ConfirmDialog'
import type { ReleaseRecord, Workload } from '../types'

const { confirm } = Modal

const statusColorMap: Record<string, string> = {
  pending: 'gold',
  approved: 'blue',
  executing: 'cyan',
  completed: 'green',
  failed: 'red',
  rolled_back: 'orange',
}

const statusLabelMap: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  executing: '执行中',
  completed: '已完成',
  failed: '失败',
  rolled_back: '已回滚',
}

export default function Publish() {
  const currentCluster = useAppStore((s) => s.currentCluster)
  const user = useAppStore((s) => s.user)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [releases, setReleases] = useState<ReleaseRecord[]>([])
  const [workloads, setWorkloads] = useState<Workload[]>([])
  const [selectedWorkload, setSelectedWorkload] = useState<Workload | null>(null)

  const [confirmType, setConfirmType] = useState<'approve' | 'execute' | 'rollback' | 'delete' | null>(null)
  const [confirmRelease, setConfirmRelease] = useState<ReleaseRecord | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const fetchData = () => {
    if (!currentCluster) return
    setLoading(true)
    Promise.all([
      publishApi.listReleases(currentCluster.id),
      workloadsApi.listWorkloads(currentCluster.id),
    ])
      .then(([rel, wl]) => {
        setReleases(rel)
        setWorkloads(wl)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [currentCluster])

  useEffect(() => {
    if (selectedWorkload) {
      form.setFieldsValue({
        old_image: selectedWorkload.image,
        cpu_limit: selectedWorkload.cpu_limit || '500m',
        memory_limit: selectedWorkload.memory_limit || '256Mi',
        namespace: selectedWorkload.namespace,
      })
    }
  }, [selectedWorkload, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (!currentCluster) {
        message.error('请先选择集群')
        return
      }
      if (!selectedWorkload) {
        message.error('请选择工作负载')
        return
      }
      setSubmitting(true)
      await publishApi.createRelease({
        cluster_id: currentCluster.id,
        namespace: selectedWorkload.namespace,
        workload_name: selectedWorkload.name,
        old_image: values.old_image,
        new_image: values.new_image,
        cpu_limit: values.cpu_limit,
        memory_limit: values.memory_limit,
        health_check: values.health_check ? 1 : 0,
        gray_ratio: values.gray_ratio,
        rollback_point: values.rollback_point,
        change_reason: values.change_reason,
        on_duty: values.on_duty,
      })
      message.success('发布单创建成功，待审批')
      form.resetFields()
      setSelectedWorkload(null)
      fetchData()
    } catch (err) {
      if ((err as Error).message) {
        message.error((err as Error).message || '创建失败')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveConfirm = async () => {
    if (!confirmRelease) return
    try {
      await publishApi.approveRelease(confirmRelease.id)
      message.success('审批通过')
      fetchData()
    } catch (err) {
      message.error((err as Error).message || '审批失败')
    } finally {
      setConfirmOpen(false)
      setConfirmRelease(null)
      setConfirmType(null)
    }
  }

  const handleExecuteConfirm = async () => {
    if (!confirmRelease) return
    try {
      await publishApi.executeRelease(confirmRelease.id)
      message.success('发布已执行')
      fetchData()
    } catch (err) {
      message.error((err as Error).message || '执行失败')
    } finally {
      setConfirmOpen(false)
      setConfirmRelease(null)
      setConfirmType(null)
    }
  }

  const handleRollbackConfirm = async () => {
    if (!confirmRelease) return
    try {
      await publishApi.rollbackRelease(confirmRelease.id)
      message.success('回滚成功')
      fetchData()
    } catch (err) {
      message.error((err as Error).message || '回滚失败')
    } finally {
      setConfirmOpen(false)
      setConfirmRelease(null)
      setConfirmType(null)
    }
  }

  const handleDelete = (record: ReleaseRecord) => {
    confirm({
      title: '确定删除此发布单？',
      icon: <ExclamationCircleOutlined />,
      content: `发布单：${record.workload_name} ${record.old_image} → ${record.new_image}`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          message.success('删除成功')
          fetchData()
        } catch (err) {
          message.error((err as Error).message || '删除失败')
        }
      },
    })
  }

  const openConfirm = (type: 'approve' | 'execute' | 'rollback', record: ReleaseRecord) => {
    setConfirmType(type)
    setConfirmRelease(record)
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    if (confirmType === 'approve') handleApproveConfirm()
    else if (confirmType === 'execute') handleExecuteConfirm()
    else if (confirmType === 'rollback') handleRollbackConfirm()
  }

  const columns = [
    { title: '工作负载', dataIndex: 'workload_name', key: 'workload_name' },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 120 },
    {
      title: '镜像变更',
      key: 'image',
      width: 280,
      render: (_: unknown, record: ReleaseRecord) => (
        <div>
          <Typography.Text type="secondary">{record.old_image}</Typography.Text>
          <div>→</div>
          <Typography.Text strong>{record.new_image}</Typography.Text>
        </div>
      ),
    },
    {
      title: '资源限制',
      key: 'resources',
      width: 140,
      render: (_: unknown, record: ReleaseRecord) => (
        <div>
          <div>CPU: {record.cpu_limit || '-'}</div>
          <div>内存: {record.memory_limit || '-'}</div>
        </div>
      ),
    },
    { title: '灰度', dataIndex: 'gray_ratio', key: 'gray_ratio', width: 70, render: (v: number) => `${v}%` },
    { title: '回滚点', dataIndex: 'rollback_point', key: 'rollback_point', width: 100 },
    { title: '值班人', dataIndex: 'on_duty', key: 'on_duty', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusColorMap[status] || 'default'}>
          {statusLabelMap[status] || status}
        </Tag>
      ),
    },
    { title: '审批人', dataIndex: 'approver', key: 'approver', width: 100 },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => formatDate(v),
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      render: (_: unknown, record: ReleaseRecord) => (
        <Space>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => openConfirm('approve', record)}
            >
              批准
            </Button>
          )}
          {record.status === 'approved' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => openConfirm('execute', record)}
            >
              执行
            </Button>
          )}
          {(record.status === 'completed' || record.status === 'failed') && (
            <Button
              type="link"
              size="small"
              danger
              icon={<RollbackOutlined />}
              onClick={() => openConfirm('rollback', record)}
            >
              回滚
            </Button>
          )}
          {record.status !== 'executing' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const confirmTitle = () => {
    if (confirmType === 'approve') return `确认批准发布：${confirmRelease?.workload_name}`
    if (confirmType === 'execute') return `确认执行发布：${confirmRelease?.workload_name}`
    if (confirmType === 'rollback') return `确认回滚发布：${confirmRelease?.workload_name}`
    return '确认操作'
  }

  const confirmDesc = () => {
    if (confirmType === 'approve') return `批准后发布单进入可执行状态，由运维人员执行变更。`
    if (confirmType === 'execute') return `执行后将应用新镜像 ${confirmRelease?.new_image}，灰度比例 ${confirmRelease?.gray_ratio}%。`
    if (confirmType === 'rollback') return `回滚将恢复到原镜像 ${confirmRelease?.old_image}，请确认业务影响。`
    return ''
  }

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card title="创建发布">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ gray_ratio: 0, health_check: true, on_duty: user?.username || '' }}
          >
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="选择工作负载"
                  name="workload_id"
                  rules={[{ required: true, message: '请选择工作负载' }]}
                >
                  <Select
                    showSearch
                    placeholder="搜索并选择工作负载"
                    optionFilterProp="label"
                    onChange={(id) => {
                      const wl = workloads.find((w) => w.id === id)
                      setSelectedWorkload(wl || null)
                    }}
                    options={workloads.map((w) => ({
                      label: `${w.namespace} / ${w.name} (${w.status})`,
                      value: w.id,
                    }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="当前镜像"
                  name="old_image"
                  rules={[{ required: true, message: '请确认当前镜像' }]}
                >
                  <Input placeholder="自动填充" disabled />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="新镜像"
                  name="new_image"
                  rules={[{ required: true, message: '请输入新镜像' }]}
                >
                  <Input placeholder="例如：nginx:1.25.0" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  label="CPU 限制"
                  name="cpu_limit"
                  rules={[{ required: true, message: '请输入 CPU 限制' }]}
                >
                  <Input placeholder="例如：500m" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  label="内存限制"
                  name="memory_limit"
                  rules={[{ required: true, message: '请输入内存限制' }]}
                >
                  <Input placeholder="例如：256Mi" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="健康检查" name="health_check" valuePropName="checked">
                  <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  label="灰度比例 (%)"
                  name="gray_ratio"
                  rules={[{ required: true, message: '请设置灰度比例' }]}
                >
                  <Slider min={0} max={100} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="回滚点标记"
                  name="rollback_point"
                  rules={[{ required: true, message: '请输入回滚点标记' }]}
                >
                  <Input placeholder="例如：stable-v20260526" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="值班人"
                  name="on_duty"
                  rules={[{ required: true, message: '请输入值班人' }]}
                >
                  <Input placeholder="当前值班 SRE" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="审批人"
                  name="approver"
                >
                  <Input placeholder="默认为 admin" disabled />
                </Form.Item>
              </Col>
              <Col xs={24} md={24}>
                <Form.Item
                  label="变更原因"
                  name="change_reason"
                  rules={[{ required: true, message: '请说明变更原因' }]}
                >
                  <Input.TextArea rows={2} placeholder="简述本次变更的原因和预期效果..." />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" loading={submitting}>
                创建发布单（待审批）
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="发布记录">
          <Table<ReleaseRecord>
            rowKey="id"
            loading={loading}
            dataSource={releases}
            columns={columns}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            scroll={{ x: 1600 }}
          />
        </Card>
      </Col>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle()}
        description={confirmDesc()}
        confirmText="确认"
        onCancel={() => {
          setConfirmOpen(false)
          setConfirmRelease(null)
          setConfirmType(null)
        }}
        onConfirm={handleConfirm}
      />
    </Row>
  )
}
