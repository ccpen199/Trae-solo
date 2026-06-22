import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  Form,
  Select,
  DatePicker,
  Input,
  Modal,
  message,
  Statistic,
  Avatar,
  Drawer,
  Descriptions,
  Tooltip,
} from 'antd'
import {
  ScanOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  FileSearchOutlined,
  SafetyOutlined,
  FileProtectOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  AlertOutlined,
  BellOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import type { RiskAlert, AlertType, AlertSeverity, AlertStatus, PaginationResult } from '../../types'
import type { RiskStatistics, ScanResult, MonitorResult, HandleRiskAlertParams } from '../../api/admin'
import adminApi from '../../api/admin'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker
const { TextArea } = Input
const { Option } = Select

const alertTypeText: Record<AlertType, string> = {
  contract_breach: '合同违约',
  wage_delay: '工资拖欠',
  attendance_abnormal: '考勤异常',
  quality_issue: '质量问题',
  credit_risk: '信用风险',
}

const alertTypeColors: Record<AlertType, string> = {
  contract_breach: 'purple',
  wage_delay: 'red',
  attendance_abnormal: 'orange',
  quality_issue: 'gold',
  credit_risk: 'blue',
}

const alertSeverityColors: Record<AlertSeverity, string> = {
  critical: '#f5222d',
  high: '#fa8c16',
  medium: '#faad14',
  low: '#1890ff',
}

const alertSeverityBg: Record<AlertSeverity, string> = {
  critical: '#fff1f0',
  high: '#fff7e6',
  medium: '#fffbe6',
  low: '#e6f7ff',
}

const alertSeverityText: Record<AlertSeverity, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
}

const alertStatusText: Record<AlertStatus, string> = {
  active: '待处理',
  acknowledged: '已确认',
  resolved: '已解决',
  ignored: '已忽略',
}

const alertStatusColors: Record<AlertStatus, string> = {
  active: 'red',
  acknowledged: 'orange',
  resolved: 'green',
  ignored: 'default',
}

const alertTypeList: AlertType[] = ['contract_breach', 'wage_delay', 'attendance_abnormal', 'quality_issue', 'credit_risk']
const alertSeverityList: AlertSeverity[] = ['critical', 'high', 'medium', 'low']
const alertStatusList: AlertStatus[] = ['active', 'acknowledged', 'resolved', 'ignored']

function RiskAlerts() {
  const [loading, setLoading] = useState(false)
  const [scanLoading, setScanLoading] = useState(false)
  const [monitorLoading, setMonitorLoading] = useState(false)
  const [handleLoading, setHandleLoading] = useState(false)
  const [statistics, setStatistics] = useState<RiskStatistics | null>(null)
  const [alerts, setAlerts] = useState<PaginationResult<RiskAlert> | null>(null)
  const [filterForm] = Form.useForm()
  const [handleForm] = Form.useForm()
  const [handleModalOpen, setHandleModalOpen] = useState(false)
  const [currentAlert, setCurrentAlert] = useState<RiskAlert | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })

  useEffect(() => {
    void loadData()
    void loadStatistics()
  }, [pagination])

  const loadData = async () => {
    setLoading(true)
    try {
      const values = filterForm.getFieldsValue()
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        alert_type: values.alert_type as AlertType | undefined,
        severity: values.severity as AlertSeverity | undefined,
        status: values.status as AlertStatus | undefined,
        start_date: values.date_range?.[0]?.format('YYYY-MM-DD'),
        end_date: values.date_range?.[1]?.format('YYYY-MM-DD'),
      }
      const res = await adminApi.getRiskAlerts(params)
      if (res.code === 0 && res.data) {
        setAlerts(res.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const res = await adminApi.getRiskStatistics()
      if (res.code === 0 && res.data) {
        setStatistics(res.data)
      }
    } catch {
    }
  }

  const handleScan = async () => {
    setScanLoading(true)
    try {
      const res = await adminApi.scanRiskAlerts()
      if (res.code === 0 && res.data) {
        const result = res.data as ScanResult
        message.success(
          `扫描完成：检测 ${result.scanned_count} 条记录，新增 ${result.new_alerts} 条预警`
        )
        await loadData()
        await loadStatistics()
      }
    } finally {
      setScanLoading(false)
    }
  }

  const handleMonitor = async () => {
    setMonitorLoading(true)
    try {
      const res = await adminApi.monitorContracts()
      if (res.code === 0 && res.data) {
        const result = res.data as MonitorResult
        if (result.abnormal_count > 0) {
          message.warning(
            `监测完成：${result.monitored_contracts} 份合同，发现 ${result.abnormal_count} 份异常`
          )
        } else {
          message.success(
            `监测完成：${result.monitored_contracts} 份合同，全部正常`
          )
        }
      }
    } finally {
      setMonitorLoading(false)
    }
  }

  const openHandleModal = (record: RiskAlert) => {
    setCurrentAlert(record)
    handleForm.resetFields()
    setHandleModalOpen(true)
  }

  const submitHandle = async () => {
    if (!currentAlert) return
    try {
      const values = await handleForm.validateFields()
      setHandleLoading(true)
      const params: HandleRiskAlertParams = {
        status: values.status as AlertStatus,
        handling_notes: values.handling_notes,
      }
      const res = await adminApi.handleRiskAlert(currentAlert.id, params)
      if (res.code === 0) {
        message.success('处理成功')
        setHandleModalOpen(false)
        await loadData()
        await loadStatistics()
      } else {
        message.error(res.message || '处理失败')
      }
    } catch {
    } finally {
      setHandleLoading(false)
    }
  }

  const handleIgnore = async (record: RiskAlert) => {
    Modal.confirm({
      title: '确认忽略该预警？',
      content: '忽略后该预警将不再提醒',
      okText: '确认忽略',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await adminApi.handleRiskAlert(record.id, {
            status: 'ignored',
            handling_notes: '管理员忽略',
          })
          if (res.code === 0) {
            message.success('已忽略')
            await loadData()
            await loadStatistics()
          }
        } catch {
        }
      },
    })
  }

  const openDetail = (record: RiskAlert) => {
    setCurrentAlert(record)
    setDetailDrawerOpen(true)
  }

  const trendChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['预警数量', '已解决'], bottom: 0 },
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: statistics?.monthly_trend.map((i) => i.month),
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '预警数量',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#faad14' },
        data: statistics?.monthly_trend.map((i) => i.count),
      },
      {
        name: '已解决',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#52c41a' },
        data: statistics?.monthly_trend.map((i) => i.resolved),
      },
    ],
  }

  const columns: ColumnsType<RiskAlert> = [
    {
      title: '预警编号',
      dataIndex: 'id',
      key: 'id',
      width: 90,
      render: (val: number) => <Text code>RA{String(val).padStart(6, '0')}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'alert_type',
      key: 'alert_type',
      width: 110,
      filters: alertTypeList.map((t) => ({ text: alertTypeText[t], value: t })),
      onFilter: (value, record) => record.alert_type === value,
      render: (val: AlertType) => <Tag color={alertTypeColors[val]}>{alertTypeText[val]}</Tag>,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (val: AlertSeverity) => (
        <Tag
          color={alertSeverityColors[val]}
          style={{
            backgroundColor: alertSeverityBg[val],
            borderColor: alertSeverityColors[val],
          }}
        >
          {alertSeverityText[val]}
        </Tag>
      ),
      sorter: (a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 }
        return order[a.severity] - order[b.severity]
      },
    },
    {
      title: '关联对象',
      dataIndex: 'related_type',
      key: 'related_type',
      width: 120,
      render: (type: string | undefined, record: RiskAlert) => (
        <Space direction="vertical" size={0}>
          {type && <Text type="secondary">{type}</Text>}
          {record.related_id && <Text code>{record.related_id}</Text>}
        </Space>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200,
      render: (val: string | undefined) => val ? <Tooltip title={val}><Text type="secondary">{val}</Text></Tooltip> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      filters: alertStatusList.map((s) => ({ text: alertStatusText[s], value: s })),
      onFilter: (value, record) => record.status === value,
      render: (val: AlertStatus) => <Tag color={alertStatusColors[val]}>{alertStatusText[val]}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record)}>查看</Button>
          {record.status === 'active' || record.status === 'acknowledged' ? (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => openHandleModal(record)}>处理</Button>
          ) : null}
          {record.status !== 'ignored' && record.status !== 'resolved' ? (
            <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleIgnore(record)}>忽略</Button>
          ) : null}
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #f5222d' }} styles={{ body: { padding: 16 } }}>
            <Statistic
              title={
                <Space size={6}>
                  <AlertOutlined style={{ color: '#f5222d' }} />
                  <Text type="secondary">预警总数</Text>
                </Space>
              }
              value={statistics?.total_alerts ?? 0}
              valueStyle={{ color: '#f5222d', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #fa8c16' }} styles={{ body: { padding: 16 } }}>
            <Statistic
              title={
                <Space size={6}>
                  <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                  <Text type="secondary">严重/高危</Text>
                </Space>
              }
              value={
                (statistics?.by_severity.find((s) => s.severity === 'critical')?.count ?? 0) +
                (statistics?.by_severity.find((s) => s.severity === 'high')?.count ?? 0)
              }
              valueStyle={{ color: '#fa8c16', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #52c41a' }} styles={{ body: { padding: 16 } }}>
            <Statistic
              title={
                <Space size={6}>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <Text type="secondary">解决率</Text>
                </Space>
              }
              value={statistics?.resolution_rate ?? 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: '#52c41a', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #1890ff' }} styles={{ body: { padding: 16 } }}>
            <Statistic
              title={
                <Space size={6}>
                  <ClockCircleOutlined style={{ color: '#1890ff' }} />
                  <Text type="secondary">平均处理时长</Text>
                </Space>
              }
              value={statistics?.avg_resolution_time ?? 0}
              suffix="小时"
              precision={1}
              valueStyle={{ color: '#1890ff', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title={<Title level={5} style={{ margin: 0 }}>按类型分布</Title>} style={{ borderRadius: 8 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {statistics?.by_type.map((item) => (
                <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Tag color={alertTypeColors[item.type]} style={{ minWidth: 90, textAlign: 'center' }}>
                    {alertTypeText[item.type]}
                  </Tag>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text type="secondary">总数 {item.count}</Text>
                      <Text type="secondary">解决 {item.resolved}</Text>
                    </div>
                    <div style={{ height: 6, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${item.count > 0 ? (item.resolved / item.count) * 100 : 0}%`,
                          height: '100%',
                          background: '#52c41a',
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<Title level={5} style={{ margin: 0 }}>按严重程度</Title>} style={{ borderRadius: 8 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {statistics?.by_severity.map((item) => (
                <div key={item.severity} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Tag
                    color={alertSeverityColors[item.severity]}
                    style={{
                      minWidth: 60,
                      textAlign: 'center',
                      backgroundColor: alertSeverityBg[item.severity],
                    }}
                  >
                    {alertSeverityText[item.severity]}
                  </Tag>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text type="secondary">总数 {item.count}</Text>
                      <Text type="secondary">解决 {item.resolved}</Text>
                    </div>
                    <div style={{ height: 6, background: '#f5f5f5', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${item.count > 0 ? (item.resolved / item.count) * 100 : 0}%`,
                          height: '100%',
                          background: alertSeverityColors[item.severity],
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title={<Title level={5} style={{ margin: 0 }}>月度趋势</Title>} style={{ borderRadius: 8 }}>
            <ReactECharts option={trendChartOption} style={{ height: 180 }} />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ borderRadius: 8 }}
        styles={{ body: { paddingBottom: 0 } }}
      >
        <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
          <Col xs={24} lg={18}>
            <Form
              form={filterForm}
              layout="inline"
              onFinish={() => {
                setPagination({ ...pagination, page: 1 })
                void loadData()
              }}
              style={{ rowGap: 12 }}
            >
              <Form.Item name="alert_type" label="预警类型">
                <Select allowClear placeholder="请选择" style={{ width: 140 }}>
                  {alertTypeList.map((t) => (
                    <Option key={t} value={t}>{alertTypeText[t]}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="severity" label="严重程度">
                <Select allowClear placeholder="请选择" style={{ width: 120 }}>
                  {alertSeverityList.map((s) => (
                    <Option key={s} value={s}>{alertSeverityText[s]}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="status" label="状态">
                <Select allowClear placeholder="请选择" style={{ width: 120 }}>
                  {alertStatusList.map((s) => (
                    <Option key={s} value={s}>{alertStatusText[s]}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="date_range" label="时间范围">
                <RangePicker style={{ width: 260 }} />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">筛选</Button>
                  <Button onClick={() => { filterForm.resetFields(); void loadData() }}>重置</Button>
                </Space>
              </Form.Item>
            </Form>
          </Col>
          <Col xs={24} lg={6} style={{ textAlign: 'right' }}>
            <Space wrap>
              <Button
                type="primary"
                icon={<ScanOutlined />}
                loading={scanLoading}
                onClick={() => void handleScan()}
              >
                扫描异常
              </Button>
              <Button
                icon={<FileSearchOutlined />}
                loading={monitorLoading}
                onClick={() => void handleMonitor()}
              >
                合同监测
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 8 }} styles={{ body: { padding: 0 } }}>
        <Table<RiskAlert>
          rowKey="id"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={alerts?.list ?? []}
          scroll={{ x: 1300 }}
          pagination={{
            current: alerts?.page ?? pagination.page,
            pageSize: alerts?.pageSize ?? pagination.pageSize,
            total: alerts?.total ?? 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ page, pageSize }),
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <Avatar size={32} style={{ backgroundColor: alertSeverityColors[currentAlert?.severity ?? 'low'] }} icon={<WarningOutlined />} />
            <div>
              <Text strong style={{ fontSize: 16 }}>处理预警</Text>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>RA{String(currentAlert?.id ?? '').padStart(6, '0')}</div>
            </div>
          </Space>
        }
        open={handleModalOpen}
        onOk={submitHandle}
        onCancel={() => setHandleModalOpen(false)}
        confirmLoading={handleLoading}
        okText="提交处理"
        cancelText="取消"
        width={520}
      >
        {currentAlert && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 8 }}>
              <Descriptions.Item label="预警标题">{currentAlert.title}</Descriptions.Item>
              <Descriptions.Item label="类型/严重程度">
                <Tag color={alertTypeColors[currentAlert.alert_type]}>{alertTypeText[currentAlert.alert_type]}</Tag>
                <Tag color={alertSeverityColors[currentAlert.severity]}>{alertSeverityText[currentAlert.severity]}</Tag>
              </Descriptions.Item>
              {currentAlert.description && (
                <Descriptions.Item label="描述">
                  <Paragraph style={{ margin: 0 }}>{currentAlert.description}</Paragraph>
                </Descriptions.Item>
              )}
            </Descriptions>
            <Form form={handleForm} layout="vertical">
              <Form.Item
                name="status"
                label="处理状态"
                rules={[{ required: true, message: '请选择处理状态' }]}
              >
                <Select placeholder="请选择处理状态">
                  <Option value="acknowledged">已确认（处理中）</Option>
                  <Option value="resolved">已解决</Option>
                  <Option value="ignored">忽略</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="handling_notes"
                label="处理意见"
                rules={[{ required: true, message: '请填写处理意见' }]}
              >
                <TextArea rows={4} placeholder="请详细说明处理过程和结果..." maxLength={500} showCount />
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      <Drawer
        title={
          <Space>
            <BellOutlined style={{ color: '#faad14' }} />
            <Text strong>预警详情</Text>
          </Space>
        }
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        width={560}
        extra={
          currentAlert && (currentAlert.status === 'active' || currentAlert.status === 'acknowledged') ? (
            <Button type="primary" size="small" icon={<SafetyOutlined />} onClick={() => {
              setDetailDrawerOpen(false)
              openHandleModal(currentAlert)
            }}>立即处理</Button>
          ) : null
        }
      >
        {currentAlert && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" style={{ background: alertSeverityBg[currentAlert.severity], borderColor: alertSeverityColors[currentAlert.severity] }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>预警编号</Text>
                  <div><Text code strong>RA{String(currentAlert.id).padStart(6, '0')}</Text></div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>状态</Text>
                  <div><Tag color={alertStatusColors[currentAlert.status]}>{alertStatusText[currentAlert.status]}</Tag></div>
                </Col>
                <Col span={12} style={{ marginTop: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>类型</Text>
                  <div><Tag color={alertTypeColors[currentAlert.alert_type]}>{alertTypeText[currentAlert.alert_type]}</Tag></div>
                </Col>
                <Col span={12} style={{ marginTop: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>严重程度</Text>
                  <div>
                    <Tag
                      color={alertSeverityColors[currentAlert.severity]}
                      style={{ backgroundColor: '#fff' }}
                    >
                      {alertSeverityText[currentAlert.severity]}
                    </Tag>
                  </div>
                </Col>
              </Row>
            </Card>

            <Descriptions column={1} bordered size="small" title={<Space><FileProtectOutlined /> 基本信息</Space>}>
              <Descriptions.Item label="标题"><Text strong>{currentAlert.title}</Text></Descriptions.Item>
              {currentAlert.description && (
                <Descriptions.Item label="详细描述">
                  <Paragraph style={{ margin: 0 }}>{currentAlert.description}</Paragraph>
                </Descriptions.Item>
              )}
              {currentAlert.related_type && (
                <Descriptions.Item label="关联对象">
                  {currentAlert.related_type} #{currentAlert.related_id}
                </Descriptions.Item>
              )}
              {currentAlert.enterprise_id && (
                <Descriptions.Item label="关联企业">企业 #{currentAlert.enterprise_id}</Descriptions.Item>
              )}
              {currentAlert.worker_id && (
                <Descriptions.Item label="关联工人">工人 #{currentAlert.worker_id}</Descriptions.Item>
              )}
              <Descriptions.Item label="创建时间">{dayjs(currentAlert.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{dayjs(currentAlert.updated_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>

            {currentAlert.status !== 'active' && (
              <Descriptions column={1} bordered size="small" title={<Space><CheckCircleOutlined /> 处理记录</Space>}>
                {currentAlert.handled_by && (
                  <Descriptions.Item label="处理人">管理员 #{currentAlert.handled_by}</Descriptions.Item>
                )}
                {currentAlert.handled_at && (
                  <Descriptions.Item label="处理时间">{dayjs(currentAlert.handled_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                )}
                {currentAlert.handling_notes && (
                  <Descriptions.Item label="处理意见">{currentAlert.handling_notes}</Descriptions.Item>
                )}
              </Descriptions>
            )}
          </Space>
        )}
      </Drawer>
    </Space>
  )
}

export default RiskAlerts
