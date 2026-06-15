import React from 'react'
import { Card, Col, Progress, Row, Space, Statistic, Table, Tag, Timeline, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'

interface Metric {
  label: string;
  value: string | number;
  suffix?: string;
}

interface RowItem {
  key: string;
  name: string;
  owner: string;
  status: string;
  updatedAt: string;
}

interface PageScaffoldProps {
  title: string;
  subtitle: string;
  metrics: Metric[];
  rows: RowItem[];
  timeline: string[];
}

const statusColor: Record<string, string> = {
  运行中: 'processing',
  待处理: 'warning',
  已完成: 'success',
  已发布: 'success',
  审核中: 'blue',
  预警: 'error'
}

const columns: ColumnsType<RowItem> = [
  {
    title: '业务对象',
    dataIndex: 'name'
  },
  {
    title: '责任部门',
    dataIndex: 'owner'
  },
  {
    title: '状态',
    dataIndex: 'status',
    render: (value: string) => <Tag color={statusColor[value] || 'default'}>{value}</Tag>
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt'
  }
]

const PageScaffold: React.FC<PageScaffoldProps> = ({ title, subtitle, metrics, rows, timeline }) => {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          {title}
        </Typography.Title>
        <Typography.Text type="secondary">{subtitle}</Typography.Text>
      </div>
      <Row gutter={[16, 16]}>
        {metrics.map((metric) => (
          <Col xs={24} sm={12} lg={6} key={metric.label}>
            <Card>
              <Statistic title={metric.label} value={metric.value} suffix={metric.suffix} />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="业务清单">
            <Table columns={columns} dataSource={rows} pagination={false} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="运行态势">
            <Progress percent={88} status="active" />
            <Timeline
              style={{ marginTop: 24 }}
              items={timeline.map((item) => ({
                children: item
              }))}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}

export default PageScaffold
