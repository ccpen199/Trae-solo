import { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Select,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  message,
  Popconfirm,
} from 'antd'
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import * as workloadsApi from '../api/workloads'
import { formatDate, getStatusColor } from '../utils/helpers'
import ConfirmDialog from '../components/ConfirmDialog'
import type { Workload } from '../types'

export default function WorkloadList() {
  const currentCluster = useAppStore((s) => s.currentCluster)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Workload[]>([])
  const [filteredData, setFilteredData] = useState<Workload[]>([])
  const [nsFilter, setNsFilter] = useState<string | undefined>()
  const [typeFilter, setTypeFilter] = useState<string | undefined>()
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Workload | null>(null)
  const navigate = useNavigate()

  const fetchData = () => {
    if (!currentCluster) return
    setLoading(true)
    workloadsApi
      .listWorkloads(currentCluster.id)
      .then((res) => {
        setData(res)
        setFilteredData(res)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [currentCluster])

  useEffect(() => {
    let result = data
    if (nsFilter) result = result.filter((w) => w.namespace === nsFilter)
    if (typeFilter) result = result.filter((w) => w.type === typeFilter)
    if (statusFilter) result = result.filter((w) => w.status === statusFilter)
    setFilteredData(result)
  }, [nsFilter, typeFilter, statusFilter, data])

  const namespaces = Array.from(new Set(data.map((w) => w.namespace)))
  const types = Array.from(new Set(data.map((w) => w.type)))
  const statuses = Array.from(new Set(data.map((w) => w.status)))

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await workloadsApi.deleteWorkload(deleteTarget.id)
      message.success('删除成功')
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      message.error((err as Error).message || '删除失败')
    }
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Workload) => (
        <Typography.Link onClick={() => navigate(`/workloads/${record.id}`)}>
          {name}
        </Typography.Link>
      ),
    },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 120 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '副本数', dataIndex: 'replicas', key: 'replicas', width: 80 },
    {
      title: '就绪',
      key: 'ready',
      width: 80,
      render: (_: unknown, r: Workload) => `${r.ready_replicas}/${r.replicas}`,
    },
    { title: '镜像', dataIndex: 'image', key: 'image' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: Workload) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/workloads/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => setDeleteTarget(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Select
            style={{ width: '100%' }}
            placeholder="命名空间"
            allowClear
            value={nsFilter}
            onChange={setNsFilter}
            options={namespaces.map((n) => ({ label: n, value: n }))}
          />
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Select
            style={{ width: '100%' }}
            placeholder="类型"
            allowClear
            value={typeFilter}
            onChange={setTypeFilter}
            options={types.map((t) => ({ label: t, value: t }))}
          />
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Select
            style={{ width: '100%' }}
            placeholder="状态"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            options={statuses.map((s) => ({ label: s, value: s }))}
          />
        </Col>
      </Row>

      <Table<Workload>
        rowKey="id"
        loading={loading}
        dataSource={filteredData}
        columns={columns}
        pagination={{ pageSize: 10, showSizeChanger: false }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除工作负载"
        description={`此操作不可撤销，确定删除工作负载 "${deleteTarget?.name}" 吗？`}
        confirmText="删除"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  )
}
