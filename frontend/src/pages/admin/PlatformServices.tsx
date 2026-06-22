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
  Input,
  Modal,
  message,
  Statistic,
  Avatar,
  Drawer,
  Descriptions,
  Tooltip,
  Badge,
  Tabs,
  DatePicker,
  Upload,
  Progress,
  Divider,
  InputNumber,
  Alert,
  List,
  Empty,
} from 'antd'
import {
  SafetyCertificateOutlined,
  FileTextOutlined,
  CalendarOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  SendOutlined,
  SyncOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  PrinterOutlined,
  PlusOutlined,
  BankOutlined,
  ApartmentOutlined,
  MailOutlined,
  TeamOutlined,
  AuditOutlined,
  FieldTimeOutlined,
  BarChartOutlined,
  CloudOutlined,
  FileDoneOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  PaperClipOutlined,
  HomeOutlined,
  DollarOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import type { PaginationResult } from '../../types'
import type {
  LicenseApplication,
  Invoice,
  AttendanceReportItem,
  ApproveLicenseParams,
  ApplyInvoiceParams,
  OfflineSyncItem,
} from '../../api/admin'
import adminApi from '../../api/admin'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
const { TextArea } = Input

const licenseStatusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已通过' },
  rejected: { color: 'red', text: '已驳回' },
}

const invoiceStatusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待开票' },
  issued: { color: 'green', text: '已开票' },
  failed: { color: 'red', text: '开票失败' },
  cancelled: { color: 'default', text: '已作废' },
}

const invoiceTypeMap: Record<string, { color: string; text: string }> = {
  special: { color: 'blue', text: '增值税专票' },
  normal: { color: 'green', text: '增值税普票' },
  electronic: { color: 'purple', text: '电子发票' },
}

const attendanceStatusColor: Record<string, string> = {
  normal: 'green',
  late: 'orange',
  early_leave: 'gold',
  absent: 'red',
  leave: 'blue',
}

const attendanceStatusText: Record<string, string> = {
  normal: '正常',
  late: '迟到',
  early_leave: '早退',
  absent: '缺勤',
  leave: '请假',
}

function PlatformServices() {
  const [activeTab, setActiveTab] = useState<string>('licenses')

  const [licenseLoading, setLicenseLoading] = useState(false)
  const [licenseList, setLicenseList] = useState<PaginationResult<LicenseApplication> | null>(null)
  const [licensePagination, setLicensePagination] = useState({ page: 1, pageSize: 10 })
  const [licenseFilterForm] = Form.useForm()
  const [licenseDrawerOpen, setLicenseDrawerOpen] = useState(false)
  const [currentLicense, setCurrentLicense] = useState<LicenseApplication | null>(null)
  const [licenseApproveOpen, setLicenseApproveOpen] = useState(false)
  const [licenseApproveForm] = Form.useForm()
  const [licenseApproveLoading, setLicenseApproveLoading] = useState(false)

  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [invoiceList, setInvoiceList] = useState<PaginationResult<Invoice> | null>(null)
  const [invoicePagination, setInvoicePagination] = useState({ page: 1, pageSize: 10 })
  const [invoiceFilterForm] = Form.useForm()
  const [invoiceApplyOpen, setInvoiceApplyOpen] = useState(false)
  const [invoiceApplyForm] = Form.useForm()
  const [invoiceApplyLoading, setInvoiceApplyLoading] = useState(false)
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)

  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceReport, setAttendanceReport] = useState<PaginationResult<AttendanceReportItem> | null>(null)
  const [attendancePagination, setAttendancePagination] = useState({ page: 1, pageSize: 10 })
  const [attendanceFilterForm] = Form.useForm()
  const [offlineSyncOpen, setOfflineSyncOpen] = useState(false)
  const [offlineSyncLoading, setOfflineSyncLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'licenses') {
      void loadLicenseList()
    } else if (activeTab === 'invoices') {
      void loadInvoiceList()
    } else {
      void loadAttendanceReport()
    }
  }, [activeTab, licensePagination, invoicePagination, attendancePagination])

  const loadLicenseList = async () => {
    setLicenseLoading(true)
    try {
      const values = licenseFilterForm.getFieldsValue()
      const res = await adminApi.getLicenses({
        page: licensePagination.page,
        pageSize: licensePagination.pageSize,
        keyword: values.keyword,
        status: values.status,
        license_type: values.license_type,
      })
      if (res.code === 0 && res.data) {
        setLicenseList(res.data)
      }
    } finally {
      setLicenseLoading(false)
    }
  }

  const loadInvoiceList = async () => {
    setInvoiceLoading(true)
    try {
      const values = invoiceFilterForm.getFieldsValue()
      const res = await adminApi.getInvoices({
        page: invoicePagination.page,
        pageSize: invoicePagination.pageSize,
        keyword: values.keyword,
        status: values.status,
        invoice_type: values.invoice_type,
        start_date: values.date_range?.[0]?.format('YYYY-MM-DD'),
        end_date: values.date_range?.[1]?.format('YYYY-MM-DD'),
      })
      if (res.code === 0 && res.data) {
        setInvoiceList(res.data)
      }
    } finally {
      setInvoiceLoading(false)
    }
  }

  const loadAttendanceReport = async () => {
    const values = attendanceFilterForm.getFieldsValue()
    if (!values.start_date || !values.end_date) return
    setAttendanceLoading(true)
    try {
      const res = await adminApi.getAttendanceReport({
        page: attendancePagination.page,
        pageSize: attendancePagination.pageSize,
        keyword: values.keyword,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
        enterprise_id: values.enterprise_id,
        job_post_id: values.job_post_id,
        worker_id: values.worker_id,
      })
      if (res.code === 0 && res.data) {
        setAttendanceReport(res.data)
      }
    } finally {
      setAttendanceLoading(false)
    }
  }

  const openLicenseDetail = (record: LicenseApplication) => {
    setCurrentLicense(record)
    setLicenseDrawerOpen(true)
  }

  const openLicenseApprove = (record: LicenseApplication) => {
    setCurrentLicense(record)
    licenseApproveForm.resetFields()
    licenseApproveForm.setFieldsValue({
      valid_from: dayjs(),
      valid_to: dayjs().add(1, 'year'),
    })
    setLicenseApproveOpen(true)
  }

  const submitLicenseApprove = async (approved: boolean) => {
    if (!currentLicense) return
    try {
      const values = await licenseApproveForm.getFieldsValue()
      if (!approved && !values.reject_reason) {
        message.warning('请填写驳回原因')
        return
      }
      setLicenseApproveLoading(true)
      const params: ApproveLicenseParams = {
        approved,
        ...(approved ? {
          license_no: values.license_no,
          valid_from: values.valid_from?.format('YYYY-MM-DD'),
          valid_to: values.valid_to?.format('YYYY-MM-DD'),
        } : {
          reject_reason: values.reject_reason,
        }),
      }
      const res = await adminApi.approveLicense(currentLicense.id, params)
      if (res.code === 0) {
        message.success(approved ? '审核通过' : '已驳回')
        setLicenseApproveOpen(false)
        await loadLicenseList()
      }
    } catch {
    } finally {
      setLicenseApproveLoading(false)
    }
  }

  const openInvoiceApply = () => {
    invoiceApplyForm.resetFields()
    setInvoiceApplyOpen(true)
  }

  const submitInvoiceApply = async () => {
    try {
      const values = await invoiceApplyForm.validateFields()
      setInvoiceApplyLoading(true)
      const params: ApplyInvoiceParams = {
        invoice_type: values.invoice_type,
        title: values.title,
        tax_id: values.tax_id,
        content: Array.isArray(values.content) ? values.content.join(',') : values.content,
        amount: Number(values.amount),
        related_ids: values.related_ids || [],
        address: values.address,
        phone: values.phone,
        bank_name: values.bank_name,
        bank_account: values.bank_account,
      }
      const res = await adminApi.applyInvoice(params)
      if (res.code === 0) {
        message.success('发票申请已提交')
        setInvoiceApplyOpen(false)
        await loadInvoiceList()
      }
    } catch {
    } finally {
      setInvoiceApplyLoading(false)
    }
  }

  const openInvoiceDetail = (record: Invoice) => {
    setCurrentInvoice(record)
    setInvoiceDrawerOpen(true)
  }

  const submitOfflineSync = async () => {
    setOfflineSyncLoading(true)
    try {
      const records: OfflineSyncItem[] = []
      const res = await adminApi.offlineSyncAttendance(records)
      if (res.code === 0 && res.data) {
        const r = res.data as { synced: number; failed: number }
        if (r.failed > 0) {
          message.warning(`同步完成：成功 ${r.synced} 条，失败 ${r.failed} 条`)
        } else {
          message.success('离线打卡数据同步成功')
        }
        setOfflineSyncOpen(false)
        await loadAttendanceReport()
      }
    } finally {
      setOfflineSyncLoading(false)
    }
  }

  const licenseStats = {
    total: licenseList?.total ?? 0,
    pending: licenseList?.list.filter((i) => i.status === 'pending').length ?? 0,
  }

  const invoiceStats = {
    total: invoiceList?.total ?? 0,
    pending: invoiceList?.list.filter((i) => i.status === 'pending').length ?? 0,
    total_amount: invoiceList?.list.reduce((sum, i) => sum + i.amount, 0) ?? 0,
  }

  const licenseColumns: ColumnsType<LicenseApplication> = [
    {
      title: '申请ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (val: number) => <Text code>LN{String(val).padStart(6, '0')}</Text>,
    },
    {
      title: '申请人',
      key: 'applicant',
      width: 160,
      render: (_, record) => (
        <Space>
          <Avatar size={32} style={{ backgroundColor: '#faad14' }} icon={<UserOutlined />} />
          <div>
            <Text strong>{record.worker_name}</Text>
            <div style={{ fontSize: 11, color: '#8c8c8c' }}>
              <PhoneOutlined /> {record.worker_phone?.replace(/^(\d{3})(\d{4})(\d{4})$/, '$1****$3')}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '执照类型',
      dataIndex: 'license_type',
      key: 'license_type',
      width: 130,
      render: (val: string) => (
        <Tag color="purple" icon={<SafetyCertificateOutlined />}>{val}</Tag>
      ),
    },
    {
      title: '执照编号',
      dataIndex: 'license_no',
      key: 'license_no',
      width: 160,
      render: (val: string | undefined) => val ? <Text code>{val}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: '有效期',
      key: 'valid_period',
      width: 210,
      render: (_, record) => record.valid_from && record.valid_to ? (
        <Space direction="vertical" size={0}>
          <span style={{ fontSize: 12 }}>
            <CalendarOutlined style={{ color: '#52c41a' }} /> {dayjs(record.valid_from).format('YYYY-MM-DD')}
          </span>
          <span style={{ fontSize: 12 }}>
            <CalendarOutlined style={{ color: '#f5222d' }} /> {dayjs(record.valid_to).format('YYYY-MM-DD')}
          </span>
          {dayjs(record.valid_to).isBefore(dayjs()) && (
            <Tag color="red" icon={<WarningOutlined />} style={{ width: 'fit-content' }}>已过期</Tag>
          )}
        </Space>
      ) : <Text type="secondary">-</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => {
        const s = licenseStatusMap[val] || { color: 'default', text: val }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openLicenseDetail(record)}>详情</Button>
          {record.status === 'pending' ? (
            <Button type="link" size="small" icon={<AuditOutlined />} onClick={() => openLicenseApprove(record)}>
              审核
            </Button>
          ) : null}
        </Space>
      ),
    },
  ]

  const invoiceColumns: ColumnsType<Invoice> = [
    {
      title: '发票ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (val: number) => <Text code>INV{String(val).padStart(6, '0')}</Text>,
    },
    {
      title: '发票号',
      dataIndex: 'invoice_no',
      key: 'invoice_no',
      width: 140,
      render: (val: string | undefined) => val ? (
        <Tag color="geekblue" icon={<FileDoneOutlined />}>{val}</Tag>
      ) : <Tag color="orange" icon={<ClockCircleOutlined />}>待开具</Tag>,
    },
    {
      title: '企业',
      dataIndex: 'enterprise_name',
      key: 'enterprise_name',
      width: 160,
      ellipsis: true,
      render: (val: string) => (
        <Tooltip title={val}>
          <Space>
            <Avatar size={24} style={{ backgroundColor: '#1890ff', borderRadius: 4 }} icon={<ApartmentOutlined />} />
            <span>{val}</span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '类型',
      dataIndex: 'invoice_type',
      key: 'invoice_type',
      width: 110,
      render: (val: string) => {
        const s = invoiceTypeMap[val] || { color: 'default', text: val }
        return <Tag color={s.color}>{s.text}</Tag>
      },
    },
    {
      title: '发票抬头',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      ellipsis: true,
      render: (val: string) => <Tooltip title={val}>{val}</Tooltip>,
    },
    {
      title: '税号',
      dataIndex: 'tax_id',
      key: 'tax_id',
      width: 170,
      render: (val: string) => <Text code>{val}</Text>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 110,
      align: 'right',
      sorter: (a, b) => a.amount - b.amount,
      render: (val: number, record) => (
        <Space direction="vertical" size={0} align="end">
          <Text strong style={{ color: '#fa8c16' }}>¥{val.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            税 ¥{record.tax_amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) => {
        const s = invoiceStatusMap[val] || { color: 'default', text: val }
        return (
          <Tag
            color={s.color}
            icon={val === 'issued' ? <CheckCircleOutlined /> : val === 'failed' ? <CloseCircleOutlined /> : <ClockCircleOutlined />}
          >
            {s.text}
          </Tag>
        )
      },
    },
    {
      title: '开票日期',
      dataIndex: 'issued_at',
      key: 'issued_at',
      width: 120,
      render: (val: string | undefined) => val ? dayjs(val).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openInvoiceDetail(record)}>详情</Button>
          {record.status === 'issued' && (
            <Button type="link" size="small" icon={<DownloadOutlined />}>下载</Button>
          )}
        </Space>
      ),
    },
  ]

  const attendanceColumns: ColumnsType<AttendanceReportItem> = [
    {
      title: '工人',
      key: 'worker',
      width: 150,
      render: (_, record) => (
        <Space>
          <Avatar size={32} style={{ backgroundColor: '#faad14' }} icon={<UserOutlined />} />
          <div>
            <Text strong>{record.worker_name}</Text>
            <div style={{ fontSize: 11, color: '#8c8c8c' }}>ID: {record.worker_id}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '所属项目',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 160,
      ellipsis: true,
      render: (val: string) => <Tooltip title={val}>{val || '-'}</Tooltip>,
    },
    {
      title: '出勤概况',
      key: 'overview',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.total_days} 天</Text>
          <Progress
            percent={record.total_days > 0 ? Math.round((record.normal_days / record.total_days) * 100) : 0}
            showInfo={false}
            size="small"
          />
        </Space>
      ),
    },
    {
      title: '正常',
      dataIndex: 'normal_days',
      key: 'normal_days',
      width: 80,
      align: 'center',
      render: (val: number) => <Tag color="green">{val}天</Tag>,
    },
    {
      title: '迟到',
      dataIndex: 'late_days',
      key: 'late_days',
      width: 80,
      align: 'center',
      render: (val: number) => val > 0 ? <Tag color="orange">{val}天</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: '早退',
      dataIndex: 'early_leave_days',
      key: 'early_leave_days',
      width: 80,
      align: 'center',
      render: (val: number) => val > 0 ? <Tag color="gold">{val}天</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: '缺勤',
      dataIndex: 'absent_days',
      key: 'absent_days',
      width: 80,
      align: 'center',
      render: (val: number) => val > 0 ? <Tag color="red">{val}天</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: '请假',
      dataIndex: 'leave_days',
      key: 'leave_days',
      width: 80,
      align: 'center',
      render: (val: number) => val > 0 ? <Tag color="blue">{val}天</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: '总工时',
      dataIndex: 'total_hours',
      key: 'total_hours',
      width: 100,
      align: 'right',
      sorter: (a, b) => a.total_hours - b.total_hours,
      render: (val: number) => (
        <Space>
          <FieldTimeOutlined style={{ color: '#1890ff' }} />
          <Text strong>{val.toFixed(1)}h</Text>
        </Space>
      ),
    },
    {
      title: '离线打卡',
      dataIndex: 'offline_count',
      key: 'offline_count',
      width: 100,
      align: 'center',
      render: (val: number) => val > 0 ? (
        <Tooltip title="存在离线打卡记录，建议核实">
          <Tag color="purple" icon={<CloudOutlined />}>{val}次</Tag>
        </Tooltip>
      ) : <Text type="secondary">-</Text>,
    },
  ]

  const licenseTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['申请数', '通过数'], bottom: 0 },
    grid: { left: 40, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value' },
    series: [
      { name: '申请数', type: 'bar', itemStyle: { color: '#1890ff' }, data: [42, 58, 66, 72, 89, 95] },
      { name: '通过数', type: 'bar', itemStyle: { color: '#52c41a' }, data: [38, 52, 60, 68, 82, 88] },
    ],
  }

  const attendanceChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: Object.values(attendanceStatusText), bottom: 0 },
    grid: { left: 40, right: 20, top: 20, bottom: 40 },
    xAxis: { type: 'category', data: Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD')) },
    yAxis: { type: 'value' },
    series: Object.keys(attendanceStatusText).map((key) => ({
      name: attendanceStatusText[key],
      type: 'bar',
      stack: 'total',
      itemStyle: { color: attendanceStatusColor[key] },
      emphasis: { focus: 'series' },
      data: [10, 15, 12, 18, 22, 20, 16],
    })),
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={8} sm={4}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #722ed1' }} styles={{ body: { padding: 14 } }}>
            <Statistic
              title={<><SafetyCertificateOutlined style={{ color: '#722ed1' }} /> 执照待审</>}
              value={licenseStats.pending}
              valueStyle={{ color: '#722ed1', fontWeight: 600, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={8} sm={4}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #1890ff' }} styles={{ body: { padding: 14 } }}>
            <Statistic
              title={<><FileTextOutlined style={{ color: '#1890ff' }} /> 发票待开</>}
              value={invoiceStats.pending}
              valueStyle={{ color: '#1890ff', fontWeight: 600, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={8} sm={4}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #fa8c16' }} styles={{ body: { padding: 14 } }}>
            <Statistic
              title={<><DollarOutlined style={{ color: '#fa8c16' }} /> 开票总额</>}
              value={invoiceStats.total_amount}
              precision={0}
              prefix="¥"
              valueStyle={{ color: '#fa8c16', fontWeight: 600, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={8} sm={4}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #52c41a' }} styles={{ body: { padding: 14 } }}>
            <Statistic
              title={<><CalendarOutlined style={{ color: '#52c41a' }} /> 本月考勤</>}
              value={attendanceReport?.total ?? 0}
              suffix="人次"
              valueStyle={{ color: '#52c41a', fontWeight: 600, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={8} sm={4}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #13c2c2' }} styles={{ body: { padding: 14 } }}>
            <Statistic
              title={<><SafetyCertificateOutlined style={{ color: '#13c2c2' }} /> 累计执照</>}
              value={licenseStats.total}
              suffix="份"
              valueStyle={{ color: '#13c2c2', fontWeight: 600, fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={8} sm={4}>
          <Card style={{ borderRadius: 8, borderLeft: '4px solid #f5222d' }} styles={{ body: { padding: 14 } }}>
            <Statistic
              title={<><WarningOutlined style={{ color: '#f5222d' }} /> 离线打卡</>}
              value={attendanceReport?.list.reduce((sum, i) => sum + i.offline_count, 0) ?? 0}
              suffix="次"
              valueStyle={{ color: '#f5222d', fontWeight: 600, fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 8 }} styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          style={{ padding: '0 24px' }}
          items={[
            {
              key: 'licenses',
              label: (
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#722ed1' }} />
                  个体户执照代办
                  <Badge count={licenseStats.pending} showZero style={{ backgroundColor: '#722ed1' }} />
                </Space>
              ),
            },
            {
              key: 'invoices',
              label: (
                <Space>
                  <FileTextOutlined style={{ color: '#1890ff' }} />
                  劳务发票代开
                  {invoiceStats.pending > 0 && <Badge count={invoiceStats.pending} />}
                </Space>
              ),
            },
            {
              key: 'attendance',
              label: (
                <Space>
                  <CalendarOutlined style={{ color: '#52c41a' }} />
                  考勤SaaS
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {activeTab === 'licenses' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={18}>
              <Card style={{ borderRadius: 8 }} styles={{ body: { paddingBottom: 0 } }}>
                <Form
                  form={licenseFilterForm}
                  layout="inline"
                  onFinish={() => {
                    setLicensePagination({ ...licensePagination, page: 1 })
                    void loadLicenseList()
                  }}
                  style={{ rowGap: 12, marginBottom: 16 }}
                >
                  <Form.Item name="keyword">
                    <Input prefix={<SearchOutlined />} placeholder="申请人/手机号" style={{ width: 180 }} allowClear />
                  </Form.Item>
                  <Form.Item name="status" label="状态">
                    <Select allowClear placeholder="全部" style={{ width: 120 }}>
                      {Object.entries(licenseStatusMap).map(([val, s]) => (
                        <Option key={val} value={val}>{s.text}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="license_type" label="类型">
                    <Select allowClear placeholder="全部" style={{ width: 150 }}>
                      <Option value="个体工商户">个体工商户</Option>
                      <Option value="个人独资企业">个人独资企业</Option>
                      <Option value="劳务公司">劳务公司</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit">筛选</Button>
                      <Button onClick={() => { licenseFilterForm.resetFields(); void loadLicenseList() }}>重置</Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card title={<Title level={5} style={{ margin: 0 }}>办理趋势</Title>} style={{ borderRadius: 8 }}>
                <ReactECharts option={licenseTrendOption} style={{ height: 140 }} />
              </Card>
            </Col>
          </Row>

          <Card style={{ borderRadius: 8 }} styles={{ body: { padding: 0 } }}>
            <Table<LicenseApplication>
              rowKey="id"
              size="middle"
              loading={licenseLoading}
              columns={licenseColumns}
              dataSource={licenseList?.list ?? []}
              scroll={{ x: 1200 }}
              pagination={{
                current: licenseList?.page ?? licensePagination.page,
                pageSize: licenseList?.pageSize ?? licensePagination.pageSize,
                total: licenseList?.total ?? 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条申请`,
                onChange: (page, pageSize) => setLicensePagination({ page, pageSize }),
              }}
            />
          </Card>
        </>
      )}

      {activeTab === 'invoices' && (
        <>
          <Card style={{ borderRadius: 8 }} styles={{ body: { paddingBottom: 0 } }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} lg={18}>
                <Form
                  form={invoiceFilterForm}
                  layout="inline"
                  onFinish={() => {
                    setInvoicePagination({ ...invoicePagination, page: 1 })
                    void loadInvoiceList()
                  }}
                  style={{ rowGap: 12 }}
                >
                  <Form.Item name="keyword">
                    <Input prefix={<SearchOutlined />} placeholder="企业/发票号/抬头" style={{ width: 200 }} allowClear />
                  </Form.Item>
                  <Form.Item name="status" label="状态">
                    <Select allowClear placeholder="全部" style={{ width: 120 }}>
                      {Object.entries(invoiceStatusMap).map(([val, s]) => (
                        <Option key={val} value={val}>{s.text}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="invoice_type" label="类型">
                    <Select allowClear placeholder="全部" style={{ width: 130 }}>
                      {Object.entries(invoiceTypeMap).map(([val, s]) => (
                        <Option key={val} value={val}>{s.text}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="date_range" label="开票日期">
                    <RangePicker style={{ width: 240 }} />
                  </Form.Item>
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit">筛选</Button>
                      <Button onClick={() => { invoiceFilterForm.resetFields(); void loadInvoiceList() }}>重置</Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Col>
              <Col xs={24} lg={6} style={{ textAlign: 'right' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={openInvoiceApply}>
                  代开发票
                </Button>
              </Col>
            </Row>
          </Card>

          <Card style={{ borderRadius: 8 }} styles={{ body: { padding: 0 } }}>
            <Table<Invoice>
              rowKey="id"
              size="middle"
              loading={invoiceLoading}
              columns={invoiceColumns}
              dataSource={invoiceList?.list ?? []}
              scroll={{ x: 1350 }}
              pagination={{
                current: invoiceList?.page ?? invoicePagination.page,
                pageSize: invoiceList?.pageSize ?? invoicePagination.pageSize,
                total: invoiceList?.total ?? 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 张发票`,
                onChange: (page, pageSize) => setInvoicePagination({ page, pageSize }),
              }}
            />
          </Card>
        </>
      )}

      {activeTab === 'attendance' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Card style={{ borderRadius: 8 }} styles={{ body: { paddingBottom: 0 } }}>
                <Form
                  form={attendanceFilterForm}
                  layout="inline"
                  onFinish={() => {
                    setAttendancePagination({ ...attendancePagination, page: 1 })
                    void loadAttendanceReport()
                  }}
                  style={{ rowGap: 12, marginBottom: 16 }}
                  initialValues={{
                    start_date: dayjs().subtract(30, 'day'),
                    end_date: dayjs(),
                  }}
                >
                  <Form.Item name="start_date" label="开始" rules={[{ required: true, message: '请选择开始日期' }]}>
                    <DatePicker style={{ width: 140 }} />
                  </Form.Item>
                  <Form.Item name="end_date" label="结束" rules={[{ required: true, message: '请选择结束日期' }]}>
                    <DatePicker style={{ width: 140 }} />
                  </Form.Item>
                  <Form.Item name="keyword">
                    <Input prefix={<SearchOutlined />} placeholder="工人姓名" style={{ width: 140 }} allowClear />
                  </Form.Item>
                  <Form.Item name="enterprise_id" label="企业">
                    <Select allowClear placeholder="全部" style={{ width: 150 }} showSearch>
                      <Option value={1}>某某建筑工程公司</Option>
                      <Option value={2}>某某装饰装修公司</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Space wrap>
                      <Button type="primary" htmlType="submit">生成报表</Button>
                      <Button onClick={() => void loadAttendanceReport()} icon={<SyncOutlined />}>刷新</Button>
                      <Button icon={<CloudUploadOutlined />} onClick={() => setOfflineSyncOpen(true)}>离线同步</Button>
                      <Button icon={<DownloadOutlined />}>导出Excel</Button>
                    </Space>
                  </Form.Item>
                </Form>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                title={
                  <Space>
                    <BarChartOutlined style={{ color: '#52c41a' }} />
                    <Title level={5} style={{ margin: 0 }}>近7天考勤概览</Title>
                  </Space>
                }
                style={{ borderRadius: 8 }}
              >
                <ReactECharts option={attendanceChartOption} style={{ height: 160 }} />
              </Card>
            </Col>
          </Row>

          <Card
            style={{ borderRadius: 8 }}
            styles={{ body: { padding: 0 } }}
            title={
              <Space>
                <FieldTimeOutlined style={{ color: '#1890ff' }} />
                <Title level={5} style={{ margin: 0 }}>考勤明细报表</Title>
              </Space>
            }
          >
            <Table<AttendanceReportItem>
              rowKey={(r) => `${r.worker_id}-${r.project_name}`}
              size="middle"
              loading={attendanceLoading}
              columns={attendanceColumns}
              dataSource={attendanceReport?.list ?? []}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: (
                  <Empty description="请选择日期范围后点击【生成报表】" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ),
              }}
              pagination={{
                current: attendanceReport?.page ?? attendancePagination.page,
                pageSize: attendanceReport?.pageSize ?? attendancePagination.pageSize,
                total: attendanceReport?.total ?? 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条考勤记录`,
                onChange: (page, pageSize) => setAttendancePagination({ page, pageSize }),
              }}
              summary={(pageData) => {
                if (pageData.length === 0) return null
                let normal = 0, late = 0, early = 0, absent = 0, leave = 0, hours = 0, days = 0, offline = 0
                pageData.forEach((i) => {
                  days += i.total_days; normal += i.normal_days; late += i.late_days
                  early += i.early_leave_days; absent += i.absent_days; leave += i.leave_days
                  hours += i.total_hours; offline += i.offline_count
                })
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 600 }}>
                      <Table.Summary.Cell index={0} colSpan={2}>本页合计</Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>{days}天</Table.Summary.Cell>
                      <Table.Summary.Cell index={3} style={{ color: '#52c41a' }}>{normal}天</Table.Summary.Cell>
                      <Table.Summary.Cell index={4} style={{ color: '#fa8c16' }}>{late}天</Table.Summary.Cell>
                      <Table.Summary.Cell index={5} style={{ color: '#faad14' }}>{early}天</Table.Summary.Cell>
                      <Table.Summary.Cell index={6} style={{ color: '#f5222d' }}>{absent}天</Table.Summary.Cell>
                      <Table.Summary.Cell index={7} style={{ color: '#1890ff' }}>{leave}天</Table.Summary.Cell>
                      <Table.Summary.Cell index={8}>{hours.toFixed(1)}h</Table.Summary.Cell>
                      <Table.Summary.Cell index={9}>{offline}次</Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )
              }}
            />
          </Card>
        </>
      )}

      <Drawer
        title={
          currentLicense ? (
            <Space>
              <SafetyCertificateOutlined style={{ color: '#722ed1', fontSize: 24 }} />
              <div>
                <Text strong style={{ fontSize: 16 }}>执照申请详情</Text>
                <div>
                  <Tag color={licenseStatusMap[currentLicense.status]?.color}>
                    {licenseStatusMap[currentLicense.status]?.text}
                  </Tag>
                  <Text code>LN{String(currentLicense.id).padStart(6, '0')}</Text>
                </div>
              </div>
            </Space>
          ) : null
        }
        open={licenseDrawerOpen}
        onClose={() => { setLicenseDrawerOpen(false); setCurrentLicense(null) }}
        width={520}
        extra={
          currentLicense?.status === 'pending' ? (
            <Button type="primary" size="small" icon={<AuditOutlined />} onClick={() => openLicenseApprove(currentLicense)}>
              立即审核
            </Button>
          ) : null
        }
      >
        {currentLicense && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={1} bordered size="small" title={<Space><UserOutlined /> 申请人信息</Space>}>
              <Descriptions.Item label="工人ID">#{currentLicense.worker_id}</Descriptions.Item>
              <Descriptions.Item label="姓名">{currentLicense.worker_name}</Descriptions.Item>
              <Descriptions.Item label="手机号">{currentLicense.worker_phone}</Descriptions.Item>
            </Descriptions>
            <Descriptions column={1} bordered size="small" title={<Space><SafetyCertificateOutlined /> 执照信息</Space>}>
              <Descriptions.Item label="执照类型"><Tag color="purple">{currentLicense.license_type}</Tag></Descriptions.Item>
              <Descriptions.Item label="执照编号">{currentLicense.license_no ? <Text code>{currentLicense.license_no}</Text> : '-'}</Descriptions.Item>
              <Descriptions.Item label="有效期">
                {currentLicense.valid_from && currentLicense.valid_to
                  ? `${dayjs(currentLicense.valid_from).format('YYYY-MM-DD')} 至 ${dayjs(currentLicense.valid_to).format('YYYY-MM-DD')}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="申请资料">
                {currentLicense.application_data ? (
                  <Text type="secondary"><PaperClipOutlined /> {currentLicense.application_data}</Text>
                ) : '-'}
              </Descriptions.Item>
            </Descriptions>
            <Descriptions column={1} bordered size="small" title={<Space><AuditOutlined /> 审核记录</Space>}>
              <Descriptions.Item label="申请时间">{dayjs(currentLicense.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="审核状态">
                <Tag color={licenseStatusMap[currentLicense.status]?.color}>
                  {licenseStatusMap[currentLicense.status]?.text}
                </Tag>
              </Descriptions.Item>
              {currentLicense.reviewed_by && <Descriptions.Item label="审核人">管理员 #{currentLicense.reviewed_by}</Descriptions.Item>}
              {currentLicense.reviewed_at && (
                <Descriptions.Item label="审核时间">{dayjs(currentLicense.reviewed_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              )}
              {currentLicense.reject_reason && (
                <Descriptions.Item label="驳回原因" contentStyle={{ color: '#f5222d' }}>
                  {currentLicense.reject_reason}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Space>
        )}
      </Drawer>

      <Modal
        title={
          <Space>
            <AuditOutlined style={{ color: '#722ed1', fontSize: 24 }} />
            <div>
              <Text strong style={{ fontSize: 16 }}>审核执照申请</Text>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                {currentLicense?.worker_name} - {currentLicense?.license_type}
              </div>
            </div>
          </Space>
        }
        open={licenseApproveOpen}
        onCancel={() => { setLicenseApproveOpen(false); setCurrentLicense(null) }}
        footer={
          <Space>
            <Button onClick={() => setLicenseApproveOpen(false)}>取消</Button>
            <Button danger onClick={() => void submitLicenseApprove(false)} loading={licenseApproveLoading} icon={<CloseCircleOutlined />}>
              驳回
            </Button>
            <Button type="primary" onClick={() => void submitLicenseApprove(true)} loading={licenseApproveLoading} icon={<CheckCircleOutlined />}>
              通过
            </Button>
          </Space>
        }
        width={520}
      >
        <Alert type="info" showIcon message="审核须知" description="通过时需填写执照编号和有效期" style={{ marginBottom: 16 }} />
        <Form form={licenseApproveForm} layout="vertical">
          <Form.Item name="license_no" label="执照编号">
            <Input placeholder="统一社会信用代码/执照编号" prefix={<IdcardOutlined />} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="valid_from" label="有效期起">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valid_to" label="有效期止">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reject_reason" label="驳回原因（驳回时必填）">
            <TextArea rows={3} placeholder="如驳回，请填写驳回原因..." maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <SendOutlined style={{ color: '#1890ff', fontSize: 24 }} />
            <div>
              <Text strong style={{ fontSize: 16 }}>代开发票申请</Text>
            </div>
          </Space>
        }
        open={invoiceApplyOpen}
        onOk={submitInvoiceApply}
        onCancel={() => setInvoiceApplyOpen(false)}
        confirmLoading={invoiceApplyLoading}
        okText="提交申请"
        cancelText="取消"
        width={560}
      >
        <Form form={invoiceApplyForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="invoice_type" label="发票类型" rules={[{ required: true, message: '请选择发票类型' }]}>
                <Select placeholder="请选择">
                  <Option value="special">增值税专用发票</Option>
                  <Option value="normal">增值税普通发票</Option>
                  <Option value="electronic">电子发票</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="开票金额（元）" rules={[{ required: true, message: '请输入金额' }]}>
                <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" prefix="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="发票抬头" rules={[{ required: true, message: '请输入发票抬头' }]}>
            <Input placeholder="公司全称" prefix={<ApartmentOutlined />} />
          </Form.Item>
          <Form.Item name="tax_id" label="纳税人识别号" rules={[{ required: true, message: '请输入税号' }]}>
            <Input placeholder="15-20位税号" />
          </Form.Item>
          <Form.Item name="content" label="开票内容" rules={[{ required: true, message: '请输入开票内容' }]}>
            <Select mode="tags" placeholder="选择或输入" style={{ width: '100%' }}>
              <Option value="*建筑服务*劳务费">*建筑服务*劳务费</Option>
              <Option value="*劳务*人工服务费">*劳务*人工服务费</Option>
              <Option value="*人力资源*劳务派遣费">*人力资源*劳务派遣费</Option>
            </Select>
          </Form.Item>
          <Divider orientation="left" plain style={{ borderColor: '#e8e8e8', margin: '4px 0' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>专票补充信息（普票/电子票可选）</Text>
          </Divider>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="address" label="注册地址">
                <Input placeholder="营业执照注册地址" prefix={<HomeOutlined />} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="phone" label="注册电话">
                <Input placeholder="企业联系电话" prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="bank_name" label="开户银行">
                <Input placeholder="开户行全称" prefix={<BankOutlined />} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="bank_account" label="银行账号">
                <Input placeholder="银行账号" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Drawer
        title={
          currentInvoice ? (
            <Space>
              <FileTextOutlined style={{ color: '#1890ff', fontSize: 24 }} />
              <div>
                <Text strong style={{ fontSize: 16 }}>发票详情</Text>
                <div>
                  {currentInvoice.invoice_no ? (
                    <Tag color="geekblue" icon={<FileDoneOutlined />}>{currentInvoice.invoice_no}</Tag>
                  ) : (
                    <Tag color={invoiceStatusMap[currentInvoice.status]?.color}>
                      {invoiceStatusMap[currentInvoice.status]?.text}
                    </Tag>
                  )}
                  <Text code>INV{String(currentInvoice.id).padStart(6, '0')}</Text>
                </div>
              </div>
            </Space>
          ) : null
        }
        open={invoiceDrawerOpen}
        onClose={() => { setInvoiceDrawerOpen(false); setCurrentInvoice(null) }}
        width={520}
        extra={
          currentInvoice?.status === 'issued' ? (
            <Space>
              <Button size="small" icon={<PrinterOutlined />}>打印</Button>
              <Button type="primary" size="small" icon={<DownloadOutlined />}>下载</Button>
            </Space>
          ) : null
        }
      >
        {currentInvoice && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card
              style={{
                background: currentInvoice.status === 'issued' ? 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)' : '#fafafa',
                border: `1px dashed ${currentInvoice.status === 'issued' ? '#91d5ff' : '#d9d9d9'}`,
              }}
            >
              <Row align="middle">
                <Col flex="auto">
                  <Text type="secondary" style={{ fontSize: 12 }}>价税合计</Text>
                  <Title level={2} style={{ margin: 0, color: '#fa8c16' }}>
                    ¥{currentInvoice.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </Title>
                </Col>
                <Col>
                  <Tag color={invoiceTypeMap[currentInvoice.invoice_type]?.color}>
                    {invoiceTypeMap[currentInvoice.invoice_type]?.text}
                  </Tag>
                </Col>
              </Row>
            </Card>
            <Descriptions column={1} bordered size="small" title={<Space><ApartmentOutlined /> 发票信息</Space>}>
              <Descriptions.Item label="企业">{currentInvoice.enterprise_name}</Descriptions.Item>
              <Descriptions.Item label="发票抬头"><Text strong>{currentInvoice.title}</Text></Descriptions.Item>
              <Descriptions.Item label="税号"><Text code>{currentInvoice.tax_id}</Text></Descriptions.Item>
              <Descriptions.Item label="开票内容">{currentInvoice.content}</Descriptions.Item>
              <Descriptions.Item label="不含税金额">
                ¥{(currentInvoice.amount - currentInvoice.tax_amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </Descriptions.Item>
              <Descriptions.Item label="税额">¥{currentInvoice.tax_amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</Descriptions.Item>
              <Descriptions.Item label="价税合计">
                <Text strong style={{ color: '#f5222d' }}>
                  ¥{currentInvoice.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </Text>
              </Descriptions.Item>
            </Descriptions>
            <Descriptions column={1} bordered size="small" title={<Space><CalendarOutlined /> 开具信息</Space>}>
              <Descriptions.Item label="状态">
                <Tag
                  color={invoiceStatusMap[currentInvoice.status]?.color}
                  icon={currentInvoice.status === 'issued' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                >
                  {invoiceStatusMap[currentInvoice.status]?.text}
                </Tag>
              </Descriptions.Item>
              {currentInvoice.invoice_no && (
                <Descriptions.Item label="发票号码"><Text code strong>{currentInvoice.invoice_no}</Text></Descriptions.Item>
              )}
              {currentInvoice.issued_at && (
                <Descriptions.Item label="开票日期">{dayjs(currentInvoice.issued_at).format('YYYY年MM月DD日')}</Descriptions.Item>
              )}
              <Descriptions.Item label="申请时间">{dayjs(currentInvoice.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              {currentInvoice.fail_reason && (
                <Descriptions.Item label="失败原因" contentStyle={{ color: '#f5222d' }}>
                  {currentInvoice.fail_reason}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Space>
        )}
      </Drawer>

      <Modal
        title={
          <Space>
            <CloudUploadOutlined style={{ color: '#52c41a', fontSize: 24 }} />
            <div>
              <Text strong style={{ fontSize: 16 }}>离线打卡数据同步</Text>
            </div>
          </Space>
        }
        open={offlineSyncOpen}
        onOk={submitOfflineSync}
        onCancel={() => setOfflineSyncOpen(false)}
        confirmLoading={offlineSyncLoading}
        okText="执行同步"
        cancelText="取消"
        width={620}
      >
        <Alert
          type="warning"
          showIcon
          message="请谨慎同步离线打卡数据"
          description="系统将自动校验数据的地理位置、打卡时间范围等，异常数据将被标记"
          style={{ marginBottom: 16 }}
        />
        <Card size="small" title={<Space><CloudOutlined /> 上传离线打卡文件</Space>} style={{ marginBottom: 12 }}>
          <Upload.Dragger
            multiple
            beforeUpload={() => false}
            accept=".json,.csv,.xlsx"
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
            <p className="ant-upload-hint">支持 JSON / CSV / Excel 格式</p>
          </Upload.Dragger>
        </Card>
        <Divider orientation="left" plain style={{ margin: '4px 0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>示例数据预览</Text>
        </Divider>
        <List
          size="small"
          bordered
          dataSource={[
            { name: '张三', project: 'A区1号楼', date: '2024-06-18', time: '07:55~18:05' },
            { name: '李四', project: 'A区1号楼', date: '2024-06-18', time: '08:12~17:50' },
            { name: '王五', project: 'B区地下室', date: '2024-06-18', time: '07:48~18:30' },
          ]}
          renderItem={(item) => (
            <List.Item>
              <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <Avatar size={26} style={{ backgroundColor: '#faad14' }}>{item.name.charAt(0)}</Avatar>
                  <div>
                    <Text strong>{item.name}</Text>
                    <div style={{ fontSize: 11, color: '#8c8c8c' }}>{item.project}</div>
                  </div>
                </Space>
                <div style={{ textAlign: 'right' }}>
                  <div>{item.date}</div>
                  <div style={{ fontSize: 11, color: '#52c41a' }}>{item.time}</div>
                </div>
              </Space>
            </List.Item>
          )}
        />
      </Modal>
    </Space>
  )
}

export default PlatformServices
