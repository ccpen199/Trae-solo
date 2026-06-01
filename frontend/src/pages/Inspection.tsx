import { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Button,
  Table,
  Tag,
  Space,
  message,
  Spin,
  Typography,
} from 'antd'
import {
  ReloadOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  PullRequestOutlined,
  ExperimentOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useAppStore } from '../store'
import * as operationsApi from '../api/operations'
import { formatDate } from '../utils/helpers'
import type { InspectionReport } from '../types'

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: number
  color: string
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  return (
    <Card hoverable>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            fontSize: 28,
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            background: `${color}15`,
            color,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <Typography.Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
            {title}
          </Typography.Text>
          <Typography.Title level={4} style={{ margin: '2px 0 0', color }}>
            {value}
          </Typography.Title>
        </div>
      </div>
    </Card>
  )
}

export default function Inspection() {
  const currentCluster = useAppStore((s) => s.currentCluster)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [reports, setReports] = useState<InspectionReport[]>([])

  const fetchData = () => {
    if (!currentCluster) return
    setLoading(true)
    operationsApi
      .getInspectionReports(currentCluster.id)
      .then((res) => setReports(res))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [currentCluster])

  const latest = reports[0]

  const handleGenerate = async () => {
    if (!currentCluster) {
      message.error('请先选择集群')
      return
    }
    try {
      setGenerating(true)
      await operationsApi.generateInspectionReport(currentCluster.id)
      message.success('巡检报告生成成功')
      fetchData()
    } catch (err) {
      message.error((err as Error).message || '生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const statData = latest
    ? [
        { label: '重启次数', value: latest.restart_count, color: '#ff4d4f', icon: <ReloadOutlined /> },
        { label: '待处理 Pods', value: latest.pending_pods, color: '#faad14', icon: <ClockCircleOutlined /> },
        { label: '资源超售', value: latest.oversold_resources, color: '#fa541c', icon: <ShoppingCartOutlined /> },
        { label: '镜像拉取失败', value: latest.image_pull_failures, color: '#eb2f96', icon: <WarningOutlined /> },
        { label: '高风险变更', value: latest.high_risk_changes, color: '#722ed1', icon: <PullRequestOutlined /> },
      ]
    : [
        { label: '重启次数', value: 0, color: '#ff4d4f', icon: <ReloadOutlined /> },
        { label: '待处理 Pods', value: 0, color: '#faad14', icon: <ClockCircleOutlined /> },
        { label: '资源超售', value: 0, color: '#fa541c', icon: <ShoppingCartOutlined /> },
        { label: '镜像拉取失败', value: 0, color: '#eb2f96', icon: <WarningOutlined /> },
        { label: '高风险变更', value: 0, color: '#722ed1', icon: <PullRequestOutlined /> },
      ]

  const barOption = latest
    ? {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: statData.map((s) => s.label) },
        yAxis: { type: 'value' },
        series: [
          {
            name: '数值',
            type: 'bar',
            data: statData.map((s) => ({
              value: s.value,
              itemStyle: { color: s.color },
            })),
            label: { show: true, position: 'top' },
          },
        ],
      }
    : null

  const reportColumns = [
    {
      title: '日期',
      dataIndex: 'report_date',
      key: 'report_date',
      width: 160,
      render: (v: string) => formatDate(v, 'YYYY-MM-DD'),
    },
    {
      title: '评分',
      dataIndex: 'total_score',
      key: 'total_score',
      width: 80,
      render: (score: number) => (
        <Tag color={score >= 80 ? 'green' : score >= 60 ? 'orange' : 'red'}>
          {score}
        </Tag>
      ),
    },
    { title: '重启次数', dataIndex: 'restart_count', key: 'restart_count', width: 100 },
    { title: '待处理 Pods', dataIndex: 'pending_pods', key: 'pending_pods', width: 120 },
    { title: '问题数', dataIndex: 'issues', key: 'issues', width: 100 },
    { title: '生成人', dataIndex: 'created_by', key: 'created_by', width: 120 },
  ]

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <ExperimentOutlined />
                <span>巡检统计</span>
              </Space>
            }
            extra={
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                loading={generating}
                onClick={handleGenerate}
              >
                生成巡检报告
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              {statData.map((s) => (
                <Col xs={24} sm={12} md={8} lg={4} key={s.label}>
                  <StatCard
                    icon={s.icon}
                    title={s.label}
                    value={s.value}
                    color={s.color}
                  />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {latest && barOption && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={24}>
            <Card title="指标分布">
              <ReactECharts option={barOption} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="巡检报告列表">
            <Table<InspectionReport>
              rowKey="id"
              dataSource={reports}
              columns={reportColumns}
              pagination={{ pageSize: 10, showSizeChanger: false }}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  )
}
