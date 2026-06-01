import { useEffect, useState } from 'react'
import {
  Tabs,
  Descriptions,
  Table,
  Tag,
  Card,
  Row,
  Col,
  Empty,
  Spin,
  Typography,
} from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined } from '@ant-design/icons'
import * as workloadsApi from '../api/workloads'
import { formatDate, getStatusColor } from '../utils/helpers'
import type {
  Workload,
  Pod,
  K8sService,
  Ingress,
  ConfigMap,
  K8sSecret,
  K8sEvent,
  ReleaseRecord,
} from '../types'

export default function WorkloadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [workload, setWorkload] = useState<Workload | null>(null)
  const [pods, setPods] = useState<Pod[]>([])
  const [services, setServices] = useState<K8sService[]>([])
  const [ingresses, setIngresses] = useState<Ingress[]>([])
  const [configMaps, setConfigMaps] = useState<ConfigMap[]>([])
  const [secrets, setSecrets] = useState<K8sSecret[]>([])
  const [events, setEvents] = useState<K8sEvent[]>([])
  const [rollouts, setRollouts] = useState<ReleaseRecord[]>([])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      workloadsApi.getWorkload(id),
      workloadsApi.getWorkloadPods(id),
      workloadsApi.getWorkloadServices(id),
      workloadsApi.getWorkloadIngresses(id),
      workloadsApi.getWorkloadConfigMaps(id),
      workloadsApi.getWorkloadSecrets(id),
      workloadsApi.getWorkloadEvents(id),
      workloadsApi.getWorkloadRollouts(id),
    ])
      .then(([w, pod, svc, ing, cm, sec, evt, rol]) => {
        setWorkload(w)
        setPods(pod)
        setServices(svc)
        setIngresses(ing)
        setConfigMaps(cm)
        setSecrets(sec)
        setEvents(evt)
        setRollouts(rol)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const podColumns = [
    { title: 'Pod 名称', dataIndex: 'name', key: 'name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag>,
    },
    { title: '重启次数', dataIndex: 'restart_count', key: 'restart_count', width: 100 },
    { title: '节点', dataIndex: 'node_name', key: 'node_name', width: 160 },
    {
      title: '存活时间',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 160,
      render: (v: string) => formatDate(v),
    },
  ]

  const serviceColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: 'Cluster IP', dataIndex: 'cluster_ip', key: 'cluster_ip', width: 140 },
    { title: '端口', dataIndex: 'ports', key: 'ports' },
  ]

  const ingressColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 120 },
    { title: '主机', dataIndex: 'host', key: 'host' },
    { title: '路径', dataIndex: 'paths', key: 'paths' },
  ]

  const configMapColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 120 },
    { title: '数据条数', dataIndex: 'data_count', key: 'data_count', width: 100 },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => formatDate(v),
    },
  ]

  const secretColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 120 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 160 },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => formatDate(v),
    },
  ]

  const eventColumns = [
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '原因', dataIndex: 'reason', key: 'reason', width: 140 },
    { title: '消息', dataIndex: 'message', key: 'message' },
    { title: '次数', dataIndex: 'count', key: 'count', width: 80 },
    {
      title: '最后出现',
      dataIndex: 'last_seen',
      key: 'last_seen',
      width: 160,
      render: (v: string) => formatDate(v),
    },
  ]

  const rolloutColumns = [
    { title: '镜像', dataIndex: 'new_image', key: 'new_image' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag>,
    },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 120 },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => formatDate(v),
    },
  ]

  return (
    <Spin spinning={loading}>
      <Typography.Link
        onClick={() => navigate('/workloads')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}
      >
        <ArrowLeftOutlined />
        返回工作负载列表
      </Typography.Link>

      {workload && (
        <>
          <Descriptions
            title="概览"
            column={2}
            bordered
            size="small"
            style={{ marginBottom: 16 }}
            items={[
              { key: 'name', label: '名称', children: workload.name },
              { key: 'namespace', label: '命名空间', children: workload.namespace },
              { key: 'type', label: '类型', children: workload.type },
              {
                key: 'replicas',
                label: '副本数',
                children: `${workload.ready_replicas}/${workload.replicas}`,
              },
              { key: 'image', label: '镜像', children: workload.image, span: 2 },
              {
                key: 'cpu_request',
                label: 'CPU 请求',
                children: workload.cpu_request || '-',
              },
              {
                key: 'memory_request',
                label: '内存请求',
                children: workload.memory_request || '-',
              },
              {
                key: 'cpu_limit',
                label: 'CPU 限制',
                children: workload.cpu_limit || '-',
              },
              {
                key: 'memory_limit',
                label: '内存限制',
                children: workload.memory_limit || '-',
              },
            ]}
          />

          <Card>
            <Tabs
              defaultActiveKey="pods"
              items={[
                {
                  key: 'pods',
                  label: 'Pods',
                  children: (
                    <Table<Pod>
                      rowKey="id"
                      dataSource={pods}
                      columns={podColumns}
                      pagination={false}
                      locale={{ emptyText: '暂无 Pods' }}
                    />
                  ),
                },
                {
                  key: 'services',
                  label: 'Services',
                  children: (
                    <Table<K8sService>
                      rowKey="id"
                      dataSource={services}
                      columns={serviceColumns}
                      pagination={false}
                      locale={{ emptyText: '暂无 Services' }}
                    />
                  ),
                },
                {
                  key: 'ingresses',
                  label: 'Ingresses',
                  children: (
                    <Table<Ingress>
                      rowKey="id"
                      dataSource={ingresses}
                      columns={ingressColumns}
                      pagination={false}
                      locale={{ emptyText: '暂无 Ingresses' }}
                    />
                  ),
                },
                {
                  key: 'configmaps',
                  label: 'ConfigMaps',
                  children: (
                    <Table<ConfigMap>
                      rowKey="id"
                      dataSource={configMaps}
                      columns={configMapColumns}
                      pagination={false}
                      locale={{ emptyText: '暂无 ConfigMaps' }}
                    />
                  ),
                },
                {
                  key: 'secrets',
                  label: 'Secrets',
                  children: (
                    <Table<K8sSecret>
                      rowKey="id"
                      dataSource={secrets}
                      columns={secretColumns}
                      pagination={false}
                      locale={{ emptyText: '暂无 Secrets' }}
                    />
                  ),
                },
                {
                  key: 'events',
                  label: 'Events',
                  children: (
                    <Table<K8sEvent>
                      rowKey="id"
                      dataSource={events}
                      columns={eventColumns}
                      pagination={false}
                      locale={{ emptyText: '暂无 Events' }}
                    />
                  ),
                },
                {
                  key: 'rollouts',
                  label: '发布历史',
                  children: (
                    <Table<ReleaseRecord>
                      rowKey="id"
                      dataSource={rollouts}
                      columns={rolloutColumns}
                      pagination={false}
                      locale={{ emptyText: '暂无发布历史' }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}
    </Spin>
  )
}
