import { useEffect, useState } from 'react'
import {
  Tabs,
  Table,
  Tag,
  Form,
  Select,
  Input,
  Button,
  Row,
  Col,
  Card,
  Space,
  message,
  Popconfirm,
} from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { useAppStore } from '../store'
import * as operationsApi from '../api/operations'
import { formatDate } from '../utils/helpers'
import type { OperationLog, Permission } from '../types'

const riskColorMap: Record<string, string> = {
  low: 'green',
  medium: 'orange',
  high: 'red',
}

const riskLabelMap: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const actionOptions = [
  { label: '查看', value: 'view' },
  { label: '编辑', value: 'edit' },
  { label: '删除', value: 'delete' },
  { label: '发布', value: 'publish' },
  { label: '所有权限', value: '*' },
]

export default function Operations() {
  const currentCluster = useAppStore((s) => s.currentCluster)
  const [logsLoading, setLogsLoading] = useState(false)
  const [permsLoading, setPermsLoading] = useState(false)
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [perms, setPerms] = useState<Permission[]>([])
  const [addingPerm, setAddingPerm] = useState(false)
  const [permForm] = Form.useForm()

  const fetchLogs = () => {
    setLogsLoading(true)
    operationsApi
      .getOperationLogs()
      .then((res) => setLogs(res))
      .catch(() => {})
      .finally(() => setLogsLoading(false))
  }

  const fetchPerms = () => {
    setPermsLoading(true)
    operationsApi
      .listPermissions()
      .then((res) => setPerms(res))
      .catch(() => {})
      .finally(() => setPermsLoading(false))
  }

  useEffect(() => {
    fetchLogs()
    fetchPerms()
  }, [])

  const handleAddPerm = async () => {
    try {
      const values = await permForm.validateFields()
      setAddingPerm(true)
      await operationsApi.createPermission({
        user_id: values.user_id,
        cluster_id: values.cluster_id,
        namespace: values.namespace,
        action: values.action,
      })
      message.success('权限添加成功')
      permForm.resetFields()
      fetchPerms()
    } catch (err) {
      if ((err as Error).message) {
        message.error((err as Error).message || '添加失败')
      }
    } finally {
      setAddingPerm(false)
    }
  }

  const handleDeletePerm = async (id: string) => {
    try {
      message.success('删除成功')
      fetchPerms()
    } catch (err) {
      message.error((err as Error).message || '删除失败')
    }
  }

  const logColumns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => formatDate(v),
    },
    { title: '用户', dataIndex: 'username', key: 'username', width: 120 },
    { title: '操作', dataIndex: 'action', key: 'action', width: 120 },
    { title: '资源类型', dataIndex: 'resource_type', key: 'resource_type', width: 120 },
    { title: '资源名称', dataIndex: 'resource_name', key: 'resource_name' },
    { title: '集群', dataIndex: 'cluster_id', key: 'cluster_id', width: 100 },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 120 },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 100,
      render: (level: string) => (
        <Tag color={riskColorMap[level] || 'default'}>
          {riskLabelMap[level] || level}
        </Tag>
      ),
    },
    { title: '详情', dataIndex: 'detail', key: 'detail' },
  ]

  const permColumns = [
    { title: '用户', dataIndex: 'user_id', key: 'user_id', width: 140 },
    { title: '集群', dataIndex: 'cluster_id', key: 'cluster_id', width: 120 },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 140 },
    { title: '操作权限', dataIndex: 'action', key: 'action', width: 120 },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: Permission) => (
        <Popconfirm
          title="确定删除此权限？"
          onConfirm={() => handleDeletePerm(record.id)}
          okText="确认"
          cancelText="取消"
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <Card>
      <Tabs
        defaultActiveKey="logs"
        items={[
          {
            key: 'logs',
            label: '操作日志',
            children: (
              <Table<OperationLog>
                rowKey="id"
                loading={logsLoading}
                dataSource={logs}
                columns={logColumns}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                scroll={{ x: 1200 }}
              />
            ),
          },
          {
            key: 'perms',
            label: '权限管理',
            children: (
              <>
                <Card
                  type="inner"
                  title="添加权限"
                  style={{ marginBottom: 16 }}
                >
                  <Form form={permForm} layout="inline" onFinish={handleAddPerm}>
                    <Row gutter={16} style={{ width: '100%' }}>
                      <Col xs={24} md={6}>
                        <Form.Item
                          label="用户"
                          name="user_id"
                          rules={[{ required: true, message: '请选择用户' }]}
                        >
                          <Input placeholder="用户 ID" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item label="集群" name="cluster_id">
                          <Select
                            placeholder="全部集群"
                            allowClear
                            options={[
                              {
                                label: currentCluster?.name || '当前集群',
                                value: currentCluster?.id,
                              },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item label="命名空间" name="namespace">
                          <Input placeholder="全部命名空间" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item
                          label="操作"
                          name="action"
                          rules={[{ required: true, message: '请选择操作' }]}
                        >
                          <Select options={actionOptions} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<PlusOutlined />}
                        loading={addingPerm}
                      >
                        添加
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
                <Table<Permission>
                  rowKey="id"
                  loading={permsLoading}
                  dataSource={perms}
                  columns={permColumns}
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                />
              </>
            ),
          },
        ]}
      />
    </Card>
  )
}
