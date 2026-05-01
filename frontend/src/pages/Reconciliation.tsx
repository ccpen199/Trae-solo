import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Tag,
  Typography,
  Button,
  Space,
  message,
  Spin,
  Modal,
  Row,
  Col,
  Statistic,
  Descriptions,
  Alert,
  Empty,
} from 'antd'
import {
  ReloadOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  CalculatorOutlined,
} from '@ant-design/icons'
import { useUserStore } from '../stores/userStore'
import { reconciliationApi } from '../services/api'
import dayjs from 'dayjs'
import type { TablePaginationConfig } from 'antd/es/table'

const { Title } = Typography

interface Reconciliation {
  id: string
  reconciliationNo: string
  date: string
  status: string
  openingBalance: number
  closingBalance: number
  totalIssued: number
  totalConsumed: number
  totalExpired: number
  totalAdjusted: number
  totalRollbacked: number
  expectedBalance: number
  actualBalance: number
  difference: number
  hasWarning: boolean
  hasError: boolean
  warnings: any[]
  errors: any[]
  details: any
  createdAt: string
  startedAt: string
  completedAt: string
}

const Reconciliation: React.FC = () => {
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [data, setData] = useState<Reconciliation[]>([])
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedReconciliation, setSelectedReconciliation] = useState<Reconciliation | null>(null)

  useEffect(() => {
    fetchReconciliations()
  }, [pagination.current, pagination.pageSize])

  const fetchReconciliations = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      }

      const response = await reconciliationApi.getReconciliations(params)
      const result = response.data.data
      setData(result?.items || [])
      setPagination((prev) => ({
        ...prev,
        total: result?.total || 0,
      }))
    } catch (error: any) {
      message.error(error.message || '获取对账单列表失败')
    } finally {
      setLoading(false)
    }
  }

  const executeReconciliation = async () => {
    Modal.confirm({
      title: '确认执行日结对账',
      content: '执行日结对账将计算今日积分变动并进行一致性检查，是否继续？',
      onOk: async () => {
        setExecuting(true)
        try {
          const response = await reconciliationApi.executeReconciliation()
          message.success('日结对账执行完成')
          fetchReconciliations()
        } catch (error: any) {
          message.error(error.message || '执行失败')
        } finally {
          setExecuting(false)
        }
      },
    })
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '待处理',
      in_progress: '处理中',
      success: '成功',
      failed: '失败',
      warning: '警告',
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'processing',
      in_progress: 'processing',
      success: 'success',
      failed: 'error',
      warning: 'warning',
    }
    return colorMap[status] || 'default'
  }

  const columns = [
    {
      title: '对账单号',
      dataIndex: 'reconciliationNo',
      key: 'reconciliationNo',
      width: 200,
    },
    {
      title: '对账日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: Reconciliation) => {
        let icon = null
        if (status === 'success') {
          icon = <CheckCircleOutlined style={{ color: '#52c41a' }} />
        } else if (status === 'warning') {
          icon = <WarningOutlined style={{ color: '#faad14' }} />
        } else if (status === 'failed') {
          icon = <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        }

        return (
          <Space>
            {icon}
            <Tag color={getStatusColor(status)}>
              {getStatusText(status)}
            </Tag>
          </Space>
        )
      },
    },
    {
      title: '期初余额',
      dataIndex: 'openingBalance',
      key: 'openingBalance',
      width: 120,
    },
    {
      title: '期末余额',
      dataIndex: 'closingBalance',
      key: 'closingBalance',
      width: 120,
    },
    {
      title: '发行量',
      dataIndex: 'totalIssued',
      key: 'totalIssued',
      width: 100,
      render: (val: number) => <span style={{ color: '#52c41a' }}>+{val}</span>,
    },
    {
      title: '消耗量',
      dataIndex: 'totalConsumed',
      key: 'totalConsumed',
      width: 100,
      render: (val: number) => <span style={{ color: '#ff4d4f' }}>-{val}</span>,
    },
    {
      title: '过期量',
      dataIndex: 'totalExpired',
      key: 'totalExpired',
      width: 100,
    },
    {
      title: '差异',
      dataIndex: 'difference',
      key: 'difference',
      width: 100,
      render: (val: number) => {
        if (Math.abs(val) > 0.01) {
          return <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{val}</span>
        }
        return <span style={{ color: '#52c41a' }}>{val}</span>
      },
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_: any, record: Reconciliation) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedReconciliation(record)
            setDetailVisible(true)
          }}
        >
          详情
        </Button>
      ),
    },
  ]

  const handleTableChange = (pag: TablePaginationConfig) => {
    setPagination((prev) => ({
      ...prev,
      current: pag.current,
      pageSize: pag.pageSize,
    }))
  }

  return (
    <Spin spinning={loading}>
      <Title level={4} style={{ marginBottom: 24 }}>
        日结对账
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card
            hoverable
            onClick={executeReconciliation}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Statistic
              title="执行今日对账"
              value="立即执行"
              prefix={<CalculatorOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button
            icon={<PlayCircleOutlined />}
            type="primary"
            loading={executing}
            onClick={executeReconciliation}
          >
            执行今日对账
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchReconciliations}
          >
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="对账单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {selectedReconciliation && (
          <>
            {(selectedReconciliation.hasError || selectedReconciliation.hasWarning) && (
              <Alert
                message={selectedReconciliation.hasError ? '对账发现异常' : '对账存在警告'}
                description={
                  selectedReconciliation.hasError
                    ? '存在一致性差异，请检查详情'
                    : '存在部分异常情况，请查看警告详情'
                }
                type={selectedReconciliation.hasError ? 'error' : 'warning'}
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card size="small">
                  <Statistic title="期初余额" value={selectedReconciliation.openingBalance} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="发行量"
                    value={selectedReconciliation.totalIssued}
                    valueStyle={{ color: '#52c41a' }}
                    prefix="+"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="消耗量"
                    value={selectedReconciliation.totalConsumed}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix="-"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic title="期末余额" value={selectedReconciliation.closingBalance} />
                </Card>
              </Col>
            </Row>

            <Descriptions bordered column={2}>
              <Descriptions.Item label="对账单号" span={2}>
                {selectedReconciliation.reconciliationNo}
              </Descriptions.Item>
              <Descriptions.Item label="对账日期">
                {dayjs(selectedReconciliation.date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(selectedReconciliation.status)}>
                  {getStatusText(selectedReconciliation.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="过期量">
                {selectedReconciliation.totalExpired}
              </Descriptions.Item>
              <Descriptions.Item label="调整量">
                {selectedReconciliation.totalAdjusted}
              </Descriptions.Item>
              <Descriptions.Item label="回滚量">
                {selectedReconciliation.totalRollbacked}
              </Descriptions.Item>
              <Descriptions.Item label="预期余额">
                {selectedReconciliation.expectedBalance}
              </Descriptions.Item>
              <Descriptions.Item label="实际余额">
                {selectedReconciliation.actualBalance}
              </Descriptions.Item>
              <Descriptions.Item label="差异">
                <span style={{ color: Math.abs(selectedReconciliation.difference) > 0.01 ? '#ff4d4f' : '#52c41a' }}>
                  {selectedReconciliation.difference}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {selectedReconciliation.completedAt
                  ? dayjs(selectedReconciliation.completedAt).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedReconciliation.errors && selectedReconciliation.errors.length > 0 && (
              <Card title="错误详情" style={{ marginTop: 16 }} type="inner">
                <Table
                  dataSource={selectedReconciliation.errors}
                  rowKey="type"
                  pagination={false}
                  size="small"
                >
                  <Table.Column title="类型" dataIndex="type" />
                  <Table.Column title="描述" dataIndex="message" />
                </Table>
              </Card>
            )}

            {selectedReconciliation.warnings && selectedReconciliation.warnings.length > 0 && (
              <Card title="警告详情" style={{ marginTop: 16 }} type="inner">
                <Table
                  dataSource={selectedReconciliation.warnings}
                  rowKey="type"
                  pagination={false}
                  size="small"
                >
                  <Table.Column title="类型" dataIndex="type" />
                  <Table.Column title="描述" dataIndex="message" />
                </Table>
              </Card>
            )}
          </>
        )}
      </Modal>
    </Spin>
  )
}

export default Reconciliation
