import { useEffect, useState } from 'react'
import { Row, Col, Card, Table, Tag, Empty, Spin, Typography } from 'antd'
import {
  ClusterOutlined,
  DeploymentUnitOutlined,
  AppstoreOutlined,
  ContainerOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useAppStore } from '../store'
import ResourceCard from '../components/ResourceCard'
import * as clustersApi from '../api/clusters'
import { formatDate, getStatusColor } from '../utils/helpers'
import type { ClusterDashboard, K8sEvent, Certificate } from '../types'

export default function Dashboard() {
  const currentCluster = useAppStore((s) => s.currentCluster)
  const [data, setData] = useState<ClusterDashboard | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentCluster) return
    setLoading(true)
    clustersApi
      .getClusterDashboard(currentCluster.id)
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentCluster])

  const runningPods =
    data?.workloads.reduce((sum, w) => sum + (w.ready_replicas || 0), 0) ?? 0

  const abnormalEvents = (data?.events || []).filter(
    (e) => e.type === 'Warning' || e.type === 'Critical',
  )

  const certProblems = (data?.certificates || []).filter(
    (c) => c.status === 'expired' || c.status === 'expiring_soon',
  )

  const cpuUsage =
    data?.nodes.reduce((sum, n) => sum + (n.cpu_used || 0), 0) ?? 0
  const cpuCapacity =
    data?.nodes.reduce((sum, n) => sum + (n.cpu_capacity || 0), 0) ?? 1
  const memUsage =
    data?.nodes.reduce((sum, n) => sum + (n.memory_used || 0), 0) ?? 0
  const memCapacity =
    data?.nodes.reduce((sum, n) => sum + (n.memory_capacity || 0), 0) ?? 1

  const eventTypeMap = new Map<string, number>()
  data?.events.forEach((e) => {
    eventTypeMap.set(e.type, (eventTypeMap.get(e.type) || 0) + 1)
  })

  const resourceOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['CPU 使用率', '内存使用率'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', max: 100 },
    yAxis: {
      type: 'category',
      data: ['CPU', '内存'],
    },
    series: [
      {
        name: 'CPU 使用率',
        type: 'bar',
        data: [Math.round((cpuUsage / cpuCapacity) * 100)],
        itemStyle: { color: '#1677ff' },
        label: { show: true, position: 'right', formatter: '{c}%' },
      },
      {
        name: '内存使用率',
        type: 'bar',
        data: [Math.round((memUsage / memCapacity) * 100)],
        itemStyle: { color: '#52c41a' },
        label: { show: true, position: 'right', formatter: '{c}%' },
      },
    ],
  }

  const eventPieOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '事件类型',
        type: 'pie',
        radius: ['40%', '70%'],
        data: Array.from(eventTypeMap.entries()).map(([name, value]) => ({
          name,
          value,
        })),
      },
    ],
  }

  const eventColumns = [
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '原因', dataIndex: 'reason', key: 'reason', width: 140 },
    { title: '消息', dataIndex: 'message', key: 'message' },
    { title: '次数', dataIndex: 'count', key: 'count', width: 80 },
    { title: '最后出现', dataIndex: 'last_seen', key: 'last_seen', width: 160, render: (v: string) => formatDate(v) },
  ]

  const certColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 120 },
    { title: '到期时间', dataIndex: 'not_after', key: 'not_after', width: 160, render: (v: string) => formatDate(v) },
    { title: '剩余天数', dataIndex: 'days_remaining', key: 'days_remaining', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
  ]

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <ResourceCard
            icon={<ClusterOutlined />}
            title="节点总数"
            value={data?.nodes.length ?? 0}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <ResourceCard
            icon={<DeploymentUnitOutlined />}
            title="命名空间数"
            value={data?.namespaces.length ?? 0}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <ResourceCard
            icon={<AppstoreOutlined />}
            title="工作负载总数"
            value={data?.workloads.length ?? 0}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <ResourceCard
            icon={<ContainerOutlined />}
            title="运行中 Pod"
            value={runningPods}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card title="资源使用率">
            {data ? (
              <ReactECharts option={resourceOption} style={{ height: 200 }} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="事件统计">
            {data && eventTypeMap.size > 0 ? (
              <ReactECharts option={eventPieOption} style={{ height: 200 }} />
            ) : (
              <Empty description="暂无数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card title="异常事件">
            <Table<K8sEvent>
              rowKey="id"
              dataSource={abnormalEvents}
              columns={eventColumns}
              pagination={false}
              locale={{ emptyText: '暂无异常事件' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="证书状态">
            <Table<Certificate>
              rowKey="id"
              dataSource={certProblems}
              columns={certColumns}
              pagination={false}
              locale={{ emptyText: '暂无证书问题' }}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  )
}
