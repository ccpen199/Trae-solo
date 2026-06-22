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
  Checkbox,
  Empty,
  Divider,
} from 'antd'
import {
  GoldOutlined,
  DollarOutlined,
  PayCircleOutlined,
  LockOutlined,
  FileTextOutlined,
  SearchOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  SendOutlined,
  EyeOutlined,
  CalendarOutlined,
  FileDoneOutlined,
  BankOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import type { WageRelease, WageReleaseStatus, PaginationResult } from '../../types'
import type { WageStatistics, Payslip } from '../../api/admin'
import adminApi from '../../api/admin'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const WageReleaseStatusText: Record<WageReleaseStatus, string> = {
  pending: '待释放',
  processing: '处理中',
  released: '已释放',
  failed: '失败',
  held: '暂停',
}

const WageReleaseStatusColor: Record<WageReleaseStatus, string> = {
  pending: 'orange',
  processing: 'blue',
  released: 'green',
  failed: 'red',
  held: 'default',
}

const WageReleaseStatusIcon: Record<WageReleaseStatus, React.ReactNode> = {
  pending: <ClockCircleOutlined />,
  processing: <SyncOutlined spin />,
  released: <CheckCircleOutlined />,
  failed: <CloseCircleOutlined />,
  held: <PauseCircleOutlined />,
}

interface WageReleaseItem extends WageRelease {
  worker_name: string
  project_name: string
  enterprise_name: string
}

function WageSupervision() {
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<WageStatistics | null>(null)
  const [releases, setReleases] = useState<PaginationResult<WageReleaseItem> | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })
  const [filterForm] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [batchProcessLoading, setBatchProcessLoading] = useState(false)
  const [holdLoading, setHoldLoading] = useState<number | null>(null)
  const [payslipDrawerOpen, setPayslipDrawerOpen] = useState(false)
  const [currentPayslip, setCurrentPayslip] = useState<Payslip | null>(null)
  const [payslipLoading, setPayslipLoading] = useState(false)
  const [batchPayrollOpen, setBatchPayrollOpen] = useState(false)
  const [batchPayrollForm] = Form.useForm()
  const [batchPayrollLoading, setBatchPayrollLoading] = useState(false)

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
        status: values.status as WageReleaseStatus | undefined,
        start_date: values.date_range?.[0]?.format('YYYY-MM-DD'),
        end_date: values.date_range?.[1]?.format('YYYY-MM-DD'),
      }
      const res = await adminApi.getWageReleases(params)
      if (res.code === 0 && res.data) {
        setReleases(res.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const res = await adminApi.getWageStatistics()
      if (res.code === 0 && res.data) {
        setStatistics(res.data)
      }
    } catch {
    }
  }

  const handleBatchProcess = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要处理的工资释放记录')
      return
    }
    Modal.confirm({
      title: `确认批量处理 ${selectedRowKeys.length} 条工资释放？`,
      content: '将对所有选中的待释放记录执行 T+1 到期释放操作',
      okText: '确认释放',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        setBatchProcessLoading(true)
        try {
          const res = await adminApi.processWageReleases({
            release_ids: selectedRowKeys.map(Number),
          })
          if (res.code === 0 && res.data) {
            const result = res.data as { processed: number; failed: number }
            if (result.failed > 0) {
              message.warning(`处理完成：成功 ${result.processed} 条，失败 ${result.failed} 条`)
            } else {
              message.success(`成功释放 ${result.processed} 条工资`)
            }
            setSelectedRowKeys([])
            await loadData()
            await loadStatistics()
          }
        } finally {
          setBatchProcessLoading(false)
        }
      },
    })
  }

  const handleHoldToggle = async (record: WageReleaseItem) => {
    setHoldLoading(record.id)
    try {
      const hold = record.status !== 'held'
      const res = await adminApi.holdWageRelease(record.id, hold)
      if (res.code === 0) {
        message.success(hold ? '已暂停发放' : '已恢复发放')
        await loadData()
      }
    } finally {
      setHoldLoading(null)
    }
  }

  const openPayslip = async (record: WageReleaseItem) => {
    setPayslipLoading(true)
    setPayslipDrawerOpen(true)
    try {
      const res = await adminApi.getPayslip(record.id)
      if (res.code === 0 && res.data) {
        setCurrentPayslip(res.data)
      }
    } finally {
      setPayslipLoading(false)
    }
  }

  const submitBatchPayroll = async () => {
    try {
      const values = await batchPayrollForm.validateFields()
      setBatchPayrollLoading(true)
      const res = await adminApi.processPayroll({
        guarantee_id: values.guarantee_id,
        worker_ids: values.worker_ids || [],
      })
      if (res.code === 0 && res.data) {
        const result = res.data as { created: number; failed: number }
        if (result.failed > 0) {
          message.warning(`代发完成：成功 ${result.created} 条，失败 ${result.failed} 条`)
        } else {
          message.success(`成功生成 ${result.created} 条工资发放记录`)
        }
        setBatchPayrollOpen(false)
        batchPayrollForm.resetFields()
        await loadData()
        await loadStatistics()
      }
    } catch {
    } finally {
      setBatchPayrollLoading(false)
    }
  }

  const releaseTrendOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: { data: ['发放金额', '发放笔数'], bottom: 0 },
    grid: { left: 60, right: 50, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: statistics?.release_trend.map((i) => i.date),
      axisLabel: { rotate: 30 },
    },
    yAxis: [
      {
        type: 'value',
        name: '金额(元)',
        axisLabel: {
          formatter: (val: number) => (val >= 10000 ? `${(val / 10000).toFixed(0)}万` : val),
        },
      },
      {
        type: 'value',
        name: '笔数',
      },
    ],
    series: [
      {
        name: '发放金额',
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#faad14' },
              { offset: 1, color: '#ffc53d' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        data: statistics?.release_trend.map((i) => i.amount),
      },
      {
        name: '发放笔数',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        itemStyle: { color: '#52c41a' },
        lineStyle: { width: 2 },
        data: statistics?.release_trend.map((i) => i.count),
      },
    ],
  }

  const pendingCount = releases?.list.filter((r) => r.status === 'pending' && dayjs(r.scheduled_release_date).isBefore(dayjs())).length ?? 0

  const columns: ColumnsType<WageReleaseItem> = [
    {
      title: '释放单号',
      dataIndex: 'release_no',
      key: 'release_no',
      width: 140,
      render: (val: string) => <Text code>{val}</Text>,
    },
    {
      title: '工人',
      dataIndex: 'worker_name',
      key: 'worker_name',
      width: 110,
      render: (val: string, record) => (
        <Space>
          <Avatar size={28} style={{ backgroundColor: '#faad14' }}>
            {val?.charAt(0)}
          </Avatar>
          <div>
            <div>{val || '-'}</div>
            <Text type="secondary" style={{ fontSize: 11 }}>ID: {record.worker_id}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '项目',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 160,
      ellipsis: true,
      render: (val: string) => <Tooltip title={val}>{val || '-'}</Tooltip>,
    },
    {
      title: '企业',
      dataIndex: 'enterprise_name',
      key: 'enterprise_name',
      width: 140,
      ellipsis: true,
      render: (val: string) => <Tooltip title={val}>{val || '-'}</Tooltip>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      sorter: (a, b) => a.amount - b.amount,
      render: (val: number) => (
        <Text strong style={{ color: '#fa8c16' }}>¥{val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</Text>
      ),
    },
    {
      title: '预计释放日',
      dataIndex: 'scheduled_release_date',
      key: 'scheduled_release_date',
      width: 120,
      render: (val: string) => {
        const isOverdue = dayjs(val).isBefore(dayjs(), 'day')
        return (
          <Space>
            <CalendarOutlined style={{ color: isOverdue ? '#f5222d' : undefined }} />
            <span style={{ color: isOverdue ? '#f5222d' : undefined }}>
              {dayjs(val).format('YYYY-MM-DD')}
            </span>
            {isOverdue && <Tag color="red" icon={<WarningOutlined />}>已逾期</Tag>}
          </Space>
        )
      },
    },
    {
      title: '实际释放日',
      dataIndex: 'actual_release_date',
      key: 'actual_release_date',
      width: 120,
      render: (val: string | undefined) => val ? dayjs(val).format('YYYY-MM-DD') : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      filters: Object.entries(WageReleaseStatusText).map(([value, text]) => ({ text, value })),
      onFilter: (value, record) => record.status === value,
      render: (val: WageReleaseStatus) => (
        <Tag icon={WageReleaseStatusIcon[val]} color={WageReleaseStatusColor[val]}>
          {WageReleaseStatusText[val]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => void openPayslip(record)}
          >
            工资条
          </Button>
          {(record.status === 'pending' || record.status === 'processing') ? (
            <Button
              type="link"
              size="small"
              danger={record.status === 'held'}
              loading={holdLoading === record.id}
              icon={record.status === 'held' ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
              onClick={() => void handleHoldToggle(record)}
            >
              {record.status === 'held' ? '恢复' : '暂停'}
            </Button>
          ) : null}
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #faad14' }} styles={{ body: { padding: 16 } }}>
            <Statistic
              title={
                <Space size={6}>
                  <GoldOutlined style={{ color: '#faad14' }} />
                  <Text type="secondary">保证金总额</Text>
                </Space>
              }
              value={statistics?.total_deposit ?? 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#faad14', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #52c41a' }} styles={{ body: { padding: 16 } }}>
            <Statistic
              title={
                <Space size={6}>
                  <DollarOutlined style={{ color: '#52c41a' }} />
                  <Text type="secondary">已释放金额</Text>
                </Space>
              }
              value={statistics?.total_released ?? 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #1890ff' }} styles={{ body: { padding: 16 } }}>
            <Statistic
              title={
                <Space size={6}>
                  <PayCircleOutlined style={{ color: '#1890ff' }} />
                  <Text type="secondary">待释放金额</Text>
                </Space>
              }
              value={statistics?.pending_release ?? 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #f5222d' }} styles={{ body: { padding: 16 } }}>
            <Statistic
              title={
                <Space size={6}>
                  <LockOutlined style={{ color: '#f5222d' }} />
                  <Text type="secondary">冻结金额</Text>
                </Space>
              }
              value={statistics?.frozen_amount ?? 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#f5222d', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Card title={<Title level={5} style={{ margin: 0 }}>工资发放记录统计趋势</Title>} style={{ borderRadius: 8 }}>
        <ReactECharts option={releaseTrendOption} style={{ height: 300 }} />
      </Card>

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
              <Form.Item name="status" label="状态">
                <Select allowClear placeholder="全部状态" style={{ width: 140 }}>
                  {Object.entries(WageReleaseStatusText).map(([value, text]) => (
                    <Option key={value} value={value}>{text}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="date_range" label="时间范围">
                <RangePicker style={{ width: 260 }} />
              </Form.Item>
              <Form.Item name="keyword" label={<><SearchOutlined /> 关键字</>} labelCol={{ flex: '100px' }}>
                <Input allowClear placeholder="单号/工人/项目" style={{ width: 180 }} />
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
              <Tooltip title={pendingCount > 0 ? `有 ${pendingCount} 条已逾期待释放` : undefined}>
                <Button
                  type="primary"
                  icon={<SyncOutlined />}
                  loading={batchProcessLoading}
                  disabled={selectedRowKeys.length === 0}
                  onClick={() => void handleBatchProcess()}
                >
                  批量处理{selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
                </Button>
              </Tooltip>
              <Button icon={<SendOutlined />} onClick={() => setBatchPayrollOpen(true)}>
                批量代发
              </Button>
            </Space>
          </Col>
        </Row>

        {selectedRowKeys.length > 0 && (
          <div
            style={{
              margin: '0 -24px 16px',
              padding: '12px 24px',
              background: '#e6f7ff',
              borderTop: '1px solid #91d5ff',
              borderBottom: '1px solid #91d5ff',
            }}
          >
            <Space>
              <Checkbox
                checked={selectedRowKeys.length === releases?.list.length && releases?.list.length !== 0}
                indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < (releases?.list.length ?? 0)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRowKeys(releases?.list.map((r) => r.id) ?? [])
                  } else {
                    setSelectedRowKeys([])
                  }
                }}
              />
              <Text>已选择 <Text strong type="success">{selectedRowKeys.length}</Text> 条记录</Text>
              <Button type="link" onClick={() => setSelectedRowKeys([])}>取消选择</Button>
            </Space>
          </div>
        )}
      </Card>

      <Card style={{ borderRadius: 8 }} styles={{ body: { padding: 0 } }}>
        <Table<WageReleaseItem>
          rowKey="id"
          size="middle"
          loading={loading}
          columns={columns}
          dataSource={releases?.list ?? []}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.status !== 'pending' || !dayjs(record.scheduled_release_date).isBefore(dayjs()),
            }),
          }}
          scroll={{ x: 1200 }}
          pagination={{
            current: releases?.page ?? pagination.page,
            pageSize: releases?.pageSize ?? pagination.pageSize,
            total: releases?.total ?? 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ page, pageSize }),
          }}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <FileDoneOutlined style={{ color: '#faad14' }} />
            <Text strong>电子工资条</Text>
          </Space>
        }
        open={payslipDrawerOpen}
        onClose={() => {
          setPayslipDrawerOpen(false)
          setCurrentPayslip(null)
        }}
        width={560}
        extra={
          currentPayslip && (
            <Space>
              <Button size="small" icon={<FileTextOutlined />}>下载PDF</Button>
            </Space>
          )
        }
      >
        <Spin spinning={payslipLoading}>
          {currentPayslip ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card
                style={{
                  background: 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)',
                  border: '1px solid #ffe58f',
                }}
              >
                <Row align="middle">
                  <Col flex="auto">
                    <Title level={4} style={{ margin: 0, color: '#faad14' }}>
                      {currentPayslip.enterprise_name}
                    </Title>
                    <Text type="secondary">工资发放凭证</Text>
                  </Col>
                  <Col>
                    <Avatar size={64} style={{ backgroundColor: '#faad14' }} icon={<SafetyCertificateOutlined />} />
                  </Col>
                </Row>
              </Card>

              <Descriptions column={1} bordered size="small" title={<Space><IdcardOutlined /> 员工信息</Space>}>
                <Descriptions.Item label="姓名">{currentPayslip.worker_name}</Descriptions.Item>
                <Descriptions.Item label="身份证号">
                  {currentPayslip.worker_id_card.replace(/^(.{6})(.+)(.{4})$/, '$1********$3')}
                </Descriptions.Item>
                <Descriptions.Item label="所属项目">{currentPayslip.project_name}</Descriptions.Item>
                <Descriptions.Item label="发放单号">
                  <Text code>{currentPayslip.release_no}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="保证金编号">
                  <Text code>{currentPayslip.guarantee_no}</Text>
                </Descriptions.Item>
              </Descriptions>

              <Descriptions column={2} bordered size="small" title={<Space><CalendarOutlined /> 考勤与工资明细</Space>}>
                <Descriptions.Item label="出勤天数">{currentPayslip.work_days} 天</Descriptions.Item>
                <Descriptions.Item label="日薪标准">¥{currentPayslip.daily_wage}</Descriptions.Item>
                <Descriptions.Item label="基本工资">¥{currentPayslip.base_amount.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="加班天数">{currentPayslip.overtime_days} 天</Descriptions.Item>
                <Descriptions.Item label="加班费">¥{currentPayslip.overtime_amount.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="奖金/补贴">¥{currentPayslip.bonus.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="扣款（社保+税）" span={2}>
                  {currentPayslip.deduction_detail}
                </Descriptions.Item>
                <Descriptions.Item label="社保代扣">¥{currentPayslip.insurance_deduction.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="个税代扣">¥{currentPayslip.tax_deduction.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="其他扣款">¥{currentPayslip.deduction.toLocaleString()}</Descriptions.Item>
              </Descriptions>

              <Card
                style={{
                  background: 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)',
                  border: '1px solid #b7eb8f',
                }}
              >
                <Row align="middle">
                  <Col flex="auto">
                    <Text type="secondary">实发金额</Text>
                    <div>
                      <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                        ¥{currentPayslip.final_amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </Title>
                    </div>
                  </Col>
                  <Col>
                    <div style={{ textAlign: 'right' }}>
                      <Space>
                        <BankOutlined style={{ color: '#1890ff', fontSize: 24 }} />
                        <div style={{ textAlign: 'left' }}>
                          <div><Text strong>{currentPayslip.bank_name}</Text></div>
                          <Text type="secondary">尾号 ****{currentPayslip.bank_account_tail}</Text>
                        </div>
                      </Space>
                    </div>
                  </Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <Row>
                  <Col span={12}>
                    <Text type="secondary">发放日期：</Text>
                    <Text strong>{dayjs(currentPayslip.release_date).format('YYYY年MM月DD日')}</Text>
                  </Col>
                  <Col span={12} style={{ textAlign: 'right' }}>
                    <Tag color="green" icon={<CheckCircleOutlined />}>已发放</Tag>
                  </Col>
                </Row>
              </Card>

              <Paragraph style={{ color: '#8c8c8c', fontSize: 12, textAlign: 'center', margin: 0 }}>
                本工资条由匠信工易平台自动生成，具有同等法律效力
              </Paragraph>
            </Space>
          ) : payslipLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Empty />
          )}
        </Spin>
      </Drawer>

      <Modal
        title={
          <Space>
            <Avatar size={32} style={{ backgroundColor: '#faad14' }} icon={<SendOutlined />} />
            <Text strong style={{ fontSize: 16 }}>批量代发工资</Text>
          </Space>
        }
        open={batchPayrollOpen}
        onOk={submitBatchPayroll}
        onCancel={() => {
          setBatchPayrollOpen(false)
          batchPayrollForm.resetFields()
        }}
        confirmLoading={batchPayrollLoading}
        okText="确认生成"
        cancelText="取消"
        width={520}
      >
        <Form form={batchPayrollForm} layout="vertical">
          <Form.Item
            name="guarantee_id"
            label="保证金账户"
            rules={[{ required: true, message: '请选择保证金账户' }]}
          >
            <Select placeholder="请选择要操作的保证金账户" showSearch optionFilterProp="label">
              <Option value={1} label="GZ2024001 - 某某建筑公司 - ¥500,000">GZ2024001 - ¥500,000</Option>
              <Option value={2} label="GZ2024002 - 某某装饰公司 - ¥300,000">GZ2024002 - ¥300,000</Option>
              <Option value={3} label="GZ2024003 - 某某市政公司 - ¥800,000">GZ2024003 - ¥800,000</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="worker_ids"
            label="工人列表"
            rules={[{ required: true, message: '请选择要发放的工人' }]}
            help="勾选需要进行工资代发的工人"
          >
            <Select
              mode="multiple"
              placeholder="请选择工人"
              maxTagCount="3"
              style={{ width: '100%' }}
              options={[
                { value: 1, label: '张三 - 泥瓦工 - 日薪350' },
                { value: 2, label: '李四 - 电工 - 日薪400' },
                { value: 3, label: '王五 - 木工 - 日薪380' },
                { value: 4, label: '赵六 - 钢筋工 - 日薪360' },
                { value: 5, label: '孙七 - 油漆工 - 日薪340' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="release_date"
            label="释放日期"
            rules={[{ required: true, message: '请选择释放日期' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isBefore(dayjs().subtract(1, 'day'))} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}

export default WageSupervision
