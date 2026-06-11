import { useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Rate,
  Progress,
  Modal,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Tooltip,
} from 'antd'
import {
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { evaluations } from '@/mock/data'
import type { ThreePartyEvaluation } from '@/types'

const { Title } = Typography

const avgEmployerRating = +(evaluations.reduce((sum, e) => sum + e.employerRating, 0) / evaluations.length).toFixed(1)
const avgWorkerRating = +(evaluations.reduce((sum, e) => sum + e.workerRating, 0) / evaluations.length).toFixed(1)
const avgPlatformRating = +(evaluations.reduce((sum, e) => sum + e.platformRating, 0) / evaluations.length).toFixed(1)

const getRatingIcon = (rating: number) => {
  if (rating >= 4) return <SmileOutlined style={{ color: '#52c41a', fontSize: 20 }} />
  if (rating >= 3) return <MehOutlined style={{ color: '#faad14', fontSize: 20 }} />
  return <FrownOutlined style={{ color: '#f5222d', fontSize: 20 }} />
}

const truncateText = (text: string, maxLen = 12) => {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

const Evaluation: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [currentEval, setCurrentEval] = useState<ThreePartyEvaluation | null>(null)

  const openDetail = (record: ThreePartyEvaluation) => {
    setCurrentEval(record)
    setModalOpen(true)
  }

  const columns = [
    { title: '评价ID', dataIndex: 'id', key: 'id' },
    { title: '工单号', dataIndex: 'orderId', key: 'orderId' },
    { title: '会话号', dataIndex: 'sessionId', key: 'sessionId' },
    {
      title: '雇主评分',
      dataIndex: 'employerRating',
      key: 'employerRating',
      render: (v: number) => <Rate disabled value={v} allowHalf />,
    },
    {
      title: '劳动者评分',
      dataIndex: 'workerRating',
      key: 'workerRating',
      render: (v: number) => <Rate disabled value={v} allowHalf />,
    },
    {
      title: '平台评分',
      dataIndex: 'platformRating',
      key: 'platformRating',
      render: (v: number) => <Rate disabled value={v} allowHalf />,
    },
    {
      title: '雇主评价',
      dataIndex: 'employerComment',
      key: 'employerComment',
      render: (v: string) => (
        <Tooltip title={v}>
          <span>{truncateText(v)}</span>
        </Tooltip>
      ),
    },
    {
      title: '劳动者评价',
      dataIndex: 'workerComment',
      key: 'workerComment',
      render: (v: string) => (
        <Tooltip title={v}>
          <span>{truncateText(v)}</span>
        </Tooltip>
      ),
    },
    {
      title: '评价时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (v: string) => new Date(v).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ThreePartyEvaluation) => (
        <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => openDetail(record)}>
          详情
        </Tag>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Title level={4} style={{ marginTop: 0, marginBottom: 24 }}>
        三方评价管理
      </Title>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均雇主评分"
              value={avgEmployerRating}
              prefix={<StarOutlined style={{ color: '#1890ff' }} />}
              suffix="/ 5"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均劳动者评分"
              value={avgWorkerRating}
              prefix={<StarOutlined style={{ color: '#52c41a' }} />}
              suffix="/ 5"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均平台评分"
              value={avgPlatformRating}
              prefix={<StarOutlined style={{ color: '#fa8c16' }} />}
              suffix="/ 5"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table columns={columns} dataSource={evaluations} rowKey="id" />
      </Card>

      <Modal
        title={`评价详情 - ${currentEval?.id ?? ''}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={800}
      >
        {currentEval && (() => {
          const overallAvg = +(
            (currentEval.employerRating + currentEval.workerRating + currentEval.platformRating) /
            3
          ).toFixed(1)

          return (
            <>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <Card size="small" title="雇主评价" style={{ textAlign: 'center' }}>
                    <Space direction="vertical" align="center">
                      {getRatingIcon(currentEval.employerRating)}
                      <Rate disabled value={currentEval.employerRating} allowHalf />
                      <div style={{ color: '#666', fontSize: 13 }}>{currentEval.employerComment}</div>
                    </Space>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="劳动者评价" style={{ textAlign: 'center' }}>
                    <Space direction="vertical" align="center">
                      {getRatingIcon(currentEval.workerRating)}
                      <Rate disabled value={currentEval.workerRating} allowHalf />
                      <div style={{ color: '#666', fontSize: 13 }}>{currentEval.workerComment}</div>
                    </Space>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" title="平台评价" style={{ textAlign: 'center' }}>
                    <Space direction="vertical" align="center">
                      {getRatingIcon(currentEval.platformRating)}
                      <Rate disabled value={currentEval.platformRating} allowHalf />
                      <div style={{ color: '#666', fontSize: 13 }}>{currentEval.platformComment}</div>
                    </Space>
                  </Card>
                </Col>
              </Row>

              <Card size="small" title="综合满意度">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>综合评分</span>
                    <span style={{ fontWeight: 600 }}>{overallAvg} / 5</span>
                  </div>
                  <Progress
                    percent={(overallAvg / 5) * 100}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </Space>
              </Card>
            </>
          )
        })()}
      </Modal>
    </div>
  )
}

export default Evaluation
