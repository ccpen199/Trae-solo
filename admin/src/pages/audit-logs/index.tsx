import React, { useState } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Input,
  DatePicker,
  Tag,
  Descriptions,
  Alert,
  Tooltip,
  Badge,
  List,
  Tabs,
  Modal,
  Form,
  Select,
  Timeline,
  Progress,
  Switch,
  message
} from 'antd'
import {
  SearchOutlined,
  ExportOutlined,
  SafetyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DashboardOutlined,
  ReloadOutlined,
  AuditOutlined,
  CheckSquareOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  LockOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  MinusCircleOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import type { TabsProps } from 'antd'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

interface AuditLogRecord {
  key: string
  id: number
  time: string
  operator: string
  department: string
  module: string
  operateType: string
  description: string
  ip: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  status: 'success' | 'failed'
  requestParams: string
  responseResult: string
  userAgent: string
}

interface ReviewRecord {
  key: string
  id: number
  logId: number
  operationTime: string
  operator: string
  operateType: string
  description: string
  riskLevel: 'high' | 'critical'
  reviewer: string
  reviewTime: string
  reviewStatus: 'pending' | 'approved' | 'rejected'
  reviewComment: string
  createdAt: string
}

interface RiskDisposal {
  key: string
  id: number
  riskType: string
  riskLevel: 'high' | 'critical'
  description: string
  discoveryTime: string
  handler: string
  handleTime: string | null
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  measures: string[]
  impact: string
}

interface ComplianceItem {
  key: string
  id: number
  category: string
  item: string
  requirement: string
  status: 'compliant' | 'partially' | 'non-compliant' | 'not-applicable'
  checkDate: string
  nextCheckDate: string
  evidence: string
}

const mockData: AuditLogRecord[] = Array.from({ length: 50 }).map((_, i) => {
  const riskLevels: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical']
  const modules = ['认证授权', '事项管理', '证照库', '工单系统', '系统管理', '数据看板']
  const operateTypes = ['登录', '查询', '新增', '修改', '删除', '导出', '授权']
  const operators = ['admin', 'zhangsan', 'lisi', 'wangwu', 'zhaoliu', 'qianqi', 'sunba']
  const departments = ['信息中心', '市场监督管理局', '公安局', '住建局', '人社局', '医疗保障局']
  const statuses: Array<'success' | 'failed'> = ['success', 'failed']

  const day = Math.floor(Math.random() * 90)
  const hour = Math.floor(Math.random() * 24)
  const minute = Math.floor(Math.random() * 60)
  const date = new Date()
  date.setDate(date.getDate() - day)
  date.setHours(hour, minute, 0, 0)

  return {
    key: String(i + 1),
    id: i + 1,
    time: date.toLocaleString('zh-CN', { hour12: false }),
    operator: operators[Math.floor(Math.random() * operators.length)],
    department: departments[Math.floor(Math.random() * departments.length)],
    module: modules[Math.floor(Math.random() * modules.length)],
    operateType: operateTypes[Math.floor(Math.random() * operateTypes.length)],
    description: `执行${operateTypes[Math.floor(Math.random() * operateTypes.length)]}操作 - ${modules[Math.floor(Math.random() * modules.length)]}模块`,
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
    status: statuses[Math.floor(Math.random() * 4)],
    requestParams: JSON.stringify({ id: 1000 + i, page: 1, size: 10 }, null, 2),
    responseResult: JSON.stringify({ code: 0, message: 'success', data: { total: 100 } }, null, 2),
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
})

const reviewRecords: ReviewRecord[] = [
  {
    key: '1',
    id: 1,
    logId: 1024,
    operationTime: '2026-06-14 14:30:22',
    operator: 'zhangsan',
    operateType: '删除',
    description: '批量删除15条证照记录',
    riskLevel: 'critical',
    reviewer: '',
    reviewTime: '',
    reviewStatus: 'pending',
    reviewComment: '',
    createdAt: '2026-06-14 14:35:00'
  },
  {
    key: '2',
    id: 2,
    logId: 986,
    operationTime: '2026-06-14 10:15:33',
    operator: 'lisi',
    operateType: '授权',
    description: '授予用户admin超级管理员权限',
    riskLevel: 'critical',
    reviewer: 'admin',
    reviewTime: '2026-06-14 11:00:00',
    reviewStatus: 'approved',
    reviewComment: '经核实为正常运维操作，已备案登记',
    createdAt: '2026-06-14 10:20:00'
  },
  {
    key: '3',
    id: 3,
    logId: 965,
    operationTime: '2026-06-13 16:45:12',
    operator: 'wangwu',
    operateType: '导出',
    description: '导出全部用户数据（含敏感字段）',
    riskLevel: 'high',
    reviewer: 'admin',
    reviewTime: '2026-06-13 17:30:00',
    reviewStatus: 'rejected',
    reviewComment: '未获得数据导出审批，已撤销操作并记录',
    createdAt: '2026-06-13 16:50:00'
  },
  {
    key: '4',
    id: 4,
    logId: 912,
    operationTime: '2026-06-12 09:20:45',
    operator: 'zhaoliu',
    operateType: '修改',
    description: '修改系统安全配置-国密算法参数',
    riskLevel: 'high',
    reviewer: '',
    reviewTime: '',
    reviewStatus: 'pending',
    reviewComment: '',
    createdAt: '2026-06-12 09:25:00'
  },
  {
    key: '5',
    id: 5,
    logId: 876,
    operationTime: '2026-06-11 20:10:33',
    operator: 'qianqi',
    operateType: '删除',
    description: '删除工单分类配置项',
    riskLevel: 'high',
    reviewer: 'admin',
    reviewTime: '2026-06-12 08:30:00',
    reviewStatus: 'approved',
    reviewComment: '确认为系统优化调整操作，已登记',
    createdAt: '2026-06-11 20:15:00'
  }
]

const riskDisposals: RiskDisposal[] = [
  {
    key: '1',
    id: 1,
    riskType: '异常登录',
    riskLevel: 'critical',
    description: '检测到IP 192.168.1.250在24小时内尝试登录23次，其中18次失败',
    discoveryTime: '2026-06-14 08:30:00',
    handler: 'admin',
    handleTime: '2026-06-14 09:15:00',
    status: 'resolved',
    measures: ['封禁IP 24小时', '强制该账号下线', '发送告警短信给管理员'],
    impact: '无业务影响，已成功拦截'
  },
  {
    key: '2',
    id: 2,
    riskType: '敏感数据泄露风险',
    riskLevel: 'high',
    description: '发现某接口返回数据中包含未脱敏的身份证号',
    discoveryTime: '2026-06-13 15:20:00',
    handler: 'zhangsan',
    handleTime: '2026-06-13 16:45:00',
    status: 'resolved',
    measures: ['紧急修复接口脱敏逻辑', '回滚最近30天接口日志', '排查调用方是否泄露'],
    impact: '未发现数据泄露，已完成修复并通过安全测试'
  },
  {
    key: '3',
    id: 3,
    riskType: '权限越权操作',
    riskLevel: 'high',
    description: '普通用户尝试访问管理员专属接口',
    discoveryTime: '2026-06-12 11:30:00',
    handler: 'lisi',
    handleTime: null,
    status: 'processing',
    measures: ['分析调用日志确定攻击范围', '检查权限验证逻辑', '准备修复方案'],
    impact: '权限控制正常，未造成实际越权'
  },
  {
    key: '4',
    id: 4,
    riskType: '国密传输异常',
    riskLevel: 'critical',
    description: '某委办局接口调用未使用SM4加密传输',
    discoveryTime: '2026-06-11 10:00:00',
    handler: 'wangwu',
    handleTime: null,
    status: 'pending',
    measures: [],
    impact: '待处理'
  }
]

const complianceItems: ComplianceItem[] = [
  {
    key: '1',
    id: 1,
    category: '等保三级-物理安全',
    item: '机房物理访问控制',
    requirement: '机房出入需双人双锁控制，出入记录保存6个月以上',
    status: 'compliant',
    checkDate: '2026-05-15',
    nextCheckDate: '2026-08-15',
    evidence: '机房出入登记本、门禁系统日志'
  },
  {
    key: '2',
    id: 2,
    category: '等保三级-网络安全',
    item: '网络边界防护',
    requirement: '网络区域之间应进行有效隔离，部署防火墙和入侵检测系统',
    status: 'compliant',
    checkDate: '2026-05-15',
    nextCheckDate: '2026-08-15',
    evidence: '防火墙配置、IDS系统日志'
  },
  {
    key: '3',
    id: 3,
    category: '等保三级-主机安全',
    item: '身份鉴别',
    requirement: '登录用户应采用两种或两种以上组合的鉴别技术',
    status: 'compliant',
    checkDate: '2026-05-15',
    nextCheckDate: '2026-08-15',
    evidence: '双因素认证配置截图'
  },
  {
    key: '4',
    id: 4,
    category: '等保三级-应用安全',
    item: 'SQL注入防护',
    requirement: '应具备SQL注入、XSS等常见攻击防护能力',
    status: 'compliant',
    checkDate: '2026-05-15',
    nextCheckDate: '2026-08-15',
    evidence: 'WAF配置、渗透测试报告'
  },
  {
    key: '5',
    id: 5,
    category: '等保三级-数据安全',
    item: '数据传输加密',
    requirement: '敏感数据在传输过程中应采用加密技术保护',
    status: 'compliant',
    checkDate: '2026-05-15',
    nextCheckDate: '2026-08-15',
    evidence: 'HTTPS配置、接口抓包分析报告'
  },
  {
    key: '6',
    id: 6,
    category: '国密算法-传输加密',
    item: 'SM4传输加密',
    requirement: '委办局之间敏感数据传输应采用SM4国密算法加密',
    status: 'partially',
    checkDate: '2026-06-10',
    nextCheckDate: '2026-06-20',
    evidence: '接口加密配置检查，发现3个委办局接口未启用SM4'
  },
  {
    key: '7',
    id: 7,
    category: '国密算法-签名验签',
    item: 'SM3签名验证',
    requirement: '重要业务操作应使用SM3进行签名和验签',
    status: 'compliant',
    checkDate: '2026-06-10',
    nextCheckDate: '2026-09-10',
    evidence: '签名验签代码审计报告'
  },
  {
    key: '8',
    id: 8,
    category: '国密算法-身份认证',
    item: 'SM2身份认证',
    requirement: '支持SM2证书进行身份认证',
    status: 'compliant',
    checkDate: '2026-06-10',
    nextCheckDate: '2026-09-10',
    evidence: 'SM2证书配置、认证流程测试报告'
  },
  {
    key: '9',
    id: 9,
    category: '审计留存-日志管理',
    item: '审计日志留存期',
    requirement: '审计日志留存期应不少于90天',
    status: 'compliant',
    checkDate: '2026-06-01',
    nextCheckDate: '2026-07-01',
    evidence: '日志存储配置、90天日志查询验证'
  },
  {
    key: '10',
    id: 10,
    category: '审计留存-重要操作',
    item: '重要操作审计',
    requirement: '登录、授权、删除、导出等重要操作应全程留痕',
    status: 'compliant',
    checkDate: '2026-06-01',
    nextCheckDate: '2026-07-01',
    evidence: '审计中间件配置、重要操作抽样验证'
  },
  {
    key: '11',
    id: 11,
    category: '数据安全-个人信息保护',
    item: '敏感字段脱敏',
    requirement: '身份证号、手机号等个人敏感信息展示时应脱敏',
    status: 'compliant',
    checkDate: '2026-05-20',
    nextCheckDate: '2026-08-20',
    evidence: '脱敏规则配置、页面脱敏截图'
  },
  {
    key: '12',
    id: 12,
    category: '数据安全-数据授权',
    item: '数据调用授权',
    requirement: '跨部门数据调用应有明确的授权记录和审批流程',
    status: 'partially',
    checkDate: '2026-05-20',
    nextCheckDate: '2026-06-30',
    evidence: '授权记录系统检查，发现2笔记录缺少审批文件'
  }
]

const riskLevelConfig = {
  low: { label: '低', color: '#52c41a', bgColor: 'rgba(82, 196, 26, 0.1)' },
  medium: { label: '中', color: '#0958d9', bgColor: 'rgba(9, 88, 217, 0.1)' },
  high: { label: '高', color: '#faad14', bgColor: 'rgba(250, 173, 20, 0.1)' },
  critical: { label: '严重', color: '#ff4d4f', bgColor: 'rgba(255, 77, 79, 0.1)' }
}

const moduleOptions = ['认证授权', '事项管理', '证照库', '工单系统', '系统管理', '数据看板']
const operateTypeOptions = ['登录', '查询', '新增', '修改', '删除', '导出', '授权']
const riskLevelOptions = ['low', 'medium', 'high', 'critical']

const AuditLogs: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string[]>([])
  const [selectedOperateType, setSelectedOperateType] = useState<string[]>([])
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')
  const [ipSearch, setIpSearch] = useState('')
  const [keywordSearch, setKeywordSearch] = useState('')
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [currentReviewRecord, setCurrentReviewRecord] = useState<ReviewRecord | null>(null)
  const [reviewForm] = Form.useForm()

  const pieOption = {
    title: { text: '风险等级分布', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'horizontal', bottom: 0 },
    series: [{
      name: '风险等级', type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: [
        { value: 856, name: '低风险' },
        { value: 342, name: '中风险' },
        { value: 89, name: '高风险' },
        { value: 23, name: '严重风险' }
      ],
      color: ['#52c41a', '#0958d9', '#faad14', '#ff4d4f']
    }]
  }

  const trendOption = {
    title: { text: '近30天操作趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['总操作数', '风险操作'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '15%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: Array.from({ length: 30 }).map((_, i) => `${i + 1}日`) },
    yAxis: { type: 'value' },
    series: [
      {
        name: '总操作数', type: 'line', smooth: true,
        data: Array.from({ length: 30 }).map(() => Math.floor(Math.random() * 200) + 100),
        itemStyle: { color: '#0958d9' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(9, 88, 217, 0.35)' }, { offset: 1, color: 'rgba(9, 88, 217, 0.05)' }] } }
      },
      {
        name: '风险操作', type: 'line', smooth: true,
        data: Array.from({ length: 30 }).map(() => Math.floor(Math.random() * 20) + 2),
        itemStyle: { color: '#ff4d4f' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255, 77, 79, 0.3)' }, { offset: 1, color: 'rgba(255, 77, 79, 0.05)' }] } }
      }
    ]
  }

  const topRiskOperations = [
    { rank: 1, name: '删除用户', count: 45, module: '系统管理' },
    { rank: 2, name: '授权管理员角色', count: 38, module: '认证授权' },
    { rank: 3, name: '批量导出数据', count: 32, module: '事项管理' },
    { rank: 4, name: '删除服务事项', count: 28, module: '事项管理' },
    { rank: 5, name: '修改系统配置', count: 25, module: '系统管理' },
    { rank: 6, name: '重置用户密码', count: 22, module: '系统管理' },
    { rank: 7, name: '删除证照记录', count: 18, module: '证照库' },
    { rank: 8, name: '强制登出用户', count: 15, module: '认证授权' },
    { rank: 9, name: '批量导入数据', count: 12, module: '工单系统' },
    { rank: 10, name: '修改权限配置', count: 10, module: '认证授权' }
  ]

  const columns: ColumnsType<AuditLogRecord> = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 170, render: (text: string) => (
      <Space><ClockCircleOutlined style={{ color: '#8c8c8c', fontSize: 12 }} /><span style={{ fontSize: 12 }}>{text}</span></Space>
    )},
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '所属部门', dataIndex: 'department', key: 'department', width: 130 },
    { title: '操作模块', dataIndex: 'module', key: 'module', width: 100 },
    { title: '操作类型', dataIndex: 'operateType', key: 'operateType', width: 80, render: (text: string) => <Tag color="blue" style={{ margin: 0 }}>{text}</Tag> },
    { title: '操作描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 120, render: (text: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{text}</span> },
    { title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', width: 80, render: (level: keyof typeof riskLevelConfig) => {
      const config = riskLevelConfig[level]
      return <Tag color={config.color} style={{ margin: 0, backgroundColor: config.bgColor, border: 'none', color: config.color, fontWeight: 500 }}>{config.label}</Tag>
    }},
    { title: '状态', dataIndex: 'status', key: 'status', width: 70, render: (status: string) => (
      <Space size={4}><Badge status={status === 'success' ? 'success' : 'error'} text={status === 'success' ? '成功' : '失败'} /></Space>
    )}
  ]

  const reviewColumns: ColumnsType<ReviewRecord> = [
    { title: '操作时间', dataIndex: 'operationTime', key: 'operationTime', width: 170 },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '操作类型', dataIndex: 'operateType', key: 'operateType', width: 80, render: (t: string) => <Tag color="red">{t}</Tag> },
    { title: '操作描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', width: 80, render: (level: string) => {
      const config = riskLevelConfig[level as keyof typeof riskLevelConfig]
      return <Tag color={config.color}>{config.label}</Tag>
    }},
    { title: '复查状态', dataIndex: 'reviewStatus', key: 'reviewStatus', width: 100, render: (s: string) => {
      const map: Record<string, { color: string; text: string }> = {
        pending: { color: 'orange', text: '待复查' },
        approved: { color: 'green', text: '已通过' },
        rejected: { color: 'red', text: '已驳回' }
      }
      return <Tag color={map[s]?.color}>{map[s]?.text}</Tag>
    }},
    { title: '复查人', dataIndex: 'reviewer', key: 'reviewer', width: 100, render: (r: string) => r || '-' },
    { title: '复查时间', dataIndex: 'reviewTime', key: 'reviewTime', width: 170, render: (t: string) => t || '-' },
    { title: '操作', key: 'action', width: 100, render: (_, record) => record.reviewStatus === 'pending' && (
      <Button type="link" size="small" icon={<AuditOutlined />} onClick={() => handleOpenReview(record)}>
        复查
      </Button>
    )}
  ]

  const disposalColumns: ColumnsType<RiskDisposal> = [
    { title: '风险类型', dataIndex: 'riskType', key: 'riskType', width: 150, render: (t: string) => <Space><ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />{t}</Space> },
    { title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', width: 80, render: (level: string) => {
      const config = riskLevelConfig[level as keyof typeof riskLevelConfig]
      return <Tag color={config.color}>{config.label}</Tag>
    }},
    { title: '风险描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '发现时间', dataIndex: 'discoveryTime', key: 'discoveryTime', width: 170 },
    { title: '处理人', dataIndex: 'handler', key: 'handler', width: 100, render: (h: string) => h || '-' },
    { title: '处理状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => {
      const map: Record<string, { color: string; text: string }> = {
        pending: { color: 'orange', text: '待处理' },
        processing: { color: 'blue', text: '处理中' },
        resolved: { color: 'green', text: '已解决' },
        closed: { color: 'default', text: '已关闭' }
      }
      return <Tag color={map[s]?.color}>{map[s]?.text}</Tag>
    }},
    { title: '处置进度', key: 'progress', width: 120, render: (_, record) => {
      const progress = record.status === 'resolved' ? 100 : record.status === 'processing' ? 60 : record.status === 'pending' ? 0 : 100
      return <Progress percent={progress} size="small" />
    }}
  ]

  const complianceColumns: ColumnsType<ComplianceItem> = [
    { title: '检查大类', dataIndex: 'category', key: 'category', width: 200, render: (c: string) => {
      const iconMap: Record<string, React.ReactNode> = {
        '等保三级-物理安全': <SafetyOutlined style={{ color: '#0958d9', marginRight: 8 }} />,
        '等保三级-网络安全': <SafetyOutlined style={{ color: '#0958d9', marginRight: 8 }} />,
        '等保三级-主机安全': <SafetyCertificateOutlined style={{ color: '#0958d9', marginRight: 8 }} />,
        '等保三级-应用安全': <LockOutlined style={{ color: '#0958d9', marginRight: 8 }} />,
        '等保三级-数据安全': <KeyOutlined style={{ color: '#0958d9', marginRight: 8 }} />,
        '国密算法-传输加密': <SafetyOutlined style={{ color: '#52c41a', marginRight: 8 }} />,
        '国密算法-签名验签': <KeyOutlined style={{ color: '#52c41a', marginRight: 8 }} />,
        '国密算法-身份认证': <SafetyCertificateOutlined style={{ color: '#52c41a', marginRight: 8 }} />,
        '审计留存-日志管理': <FileTextOutlined style={{ color: '#722ed1', marginRight: 8 }} />,
        '审计留存-重要操作': <AuditOutlined style={{ color: '#722ed1', marginRight: 8 }} />,
        '数据安全-个人信息保护': <SafetyOutlined style={{ color: '#eb2f96', marginRight: 8 }} />,
        '数据安全-数据授权': <KeyOutlined style={{ color: '#eb2f96', marginRight: 8 }} />
      }
      return <Space>{iconMap[c]}{c}</Space>
    }},
    { title: '检查项', dataIndex: 'item', key: 'item', width: 200 },
    { title: '合规要求', dataIndex: 'requirement', key: 'requirement', ellipsis: true },
    { title: '检查结果', dataIndex: 'status', key: 'status', width: 120, render: (s: string) => {
      const map: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
        'compliant': { color: 'green', icon: <CheckCircleOutlined />, text: '合规' },
        'partially': { color: 'orange', icon: <WarningOutlined />, text: '部分合规' },
        'non-compliant': { color: 'red', icon: <StopOutlined />, text: '不合规' },
        'not-applicable': { color: 'default', icon: <MinusCircleOutlined />, text: '不适用' }
      }
      return <Tag color={map[s]?.color}><Space size={4}>{map[s]?.icon}{map[s]?.text}</Space></Tag>
    }},
    { title: '最近检查', dataIndex: 'checkDate', key: 'checkDate', width: 110 },
    { title: '下次检查', dataIndex: 'nextCheckDate', key: 'nextCheckDate', width: 110 },
    { title: '证据说明', dataIndex: 'evidence', key: 'evidence', ellipsis: true }
  ]

  const expandedRowRender = (record: AuditLogRecord) => (
    <Descriptions column={2} size="small" bordered>
      <Descriptions.Item label="请求参数" span={2}>
        <pre style={{ margin: 0, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4, fontSize: 12, maxHeight: 120, overflow: 'auto' }}>{record.requestParams}</pre>
      </Descriptions.Item>
      <Descriptions.Item label="响应结果" span={2}>
        <pre style={{ margin: 0, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4, fontSize: 12, maxHeight: 120, overflow: 'auto' }}>{record.responseResult}</pre>
      </Descriptions.Item>
      <Descriptions.Item label="User-Agent" span={2}>
        <span style={{ fontSize: 12, color: '#666' }}>{record.userAgent}</span>
      </Descriptions.Item>
    </Descriptions>
  )

  const handleOpenReview = (record: ReviewRecord) => {
    setCurrentReviewRecord(record)
    setReviewModalVisible(true)
    reviewForm.resetFields()
  }

  const handleReviewSubmit = async () => {
    try {
      const values = await reviewForm.validateFields()
      console.log('复查提交:', values)
      setReviewModalVisible(false)
      message.success('复查意见已提交')
    } catch (error) {
      console.error('验证失败:', error)
    }
  }

  const filterPanelStyle: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: 16, marginBottom: 16 }
  const filterTitleStyle: React.CSSProperties = { fontWeight: 500, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }

  const operationLogContent = (
    <div>
      <Alert
        message="合规提示"
        description="根据《网络安全法》和《数据安全法》要求，系统审计日志留存期为90天，重要操作日志永久保存。所有操作均会被记录，请规范使用。"
        type="info"
        showIcon
        icon={<FileTextOutlined />}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}><Card style={{ borderRadius: 8 }}><Statistic title="今日操作数" value={328} prefix={<DashboardOutlined style={{ color: '#0958d9' }} />} valueStyle={{ color: '#0958d9', fontSize: 24 }} /></Card></Col>
        <Col span={4}><Card style={{ borderRadius: 8 }}><Statistic title="风险操作数" value={23} prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />} valueStyle={{ color: '#ff4d4f', fontSize: 24 }} /></Card></Col>
        <Col span={4}><Card style={{ borderRadius: 8 }}><Statistic title="异常操作数" value={12} prefix={<WarningOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: '#faad14', fontSize: 24 }} /></Card></Col>
        <Col span={4}><Card style={{ borderRadius: 8 }}><Statistic title="操作成功率" value={96.8} precision={1} suffix="%" prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a', fontSize: 24 }} /></Card></Col>
        <Col span={4}><Card style={{ borderRadius: 8 }}><Statistic title="90天总操作数" value={12856} prefix={<FileTextOutlined style={{ color: '#722ed1' }} />} valueStyle={{ color: '#722ed1', fontSize: 24 }} /></Card></Col>
        <Col span={4}><Card style={{ borderRadius: 8 }}><Statistic title="日志留存天数" value={90} suffix="天" prefix={<ClockCircleOutlined style={{ color: '#13c2c2' }} />} valueStyle={{ color: '#13c2c2', fontSize: 24 }} /></Card></Col>
      </Row>
      <Row gutter={16}>
        <Col span={5}>
          <div style={filterPanelStyle}>
            <div style={filterTitleStyle}><DashboardOutlined style={{ color: '#0958d9' }} />操作模块</div>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {moduleOptions.map((item) => (
                <Tag.CheckableTag key={item} checked={selectedModule.includes(item)} onChange={(checked) => {
                  if (checked) setSelectedModule([...selectedModule, item])
                  else setSelectedModule(selectedModule.filter((m) => m !== item))
                }} style={{ padding: '4px 12px', borderRadius: 4, marginRight: 0, display: 'block', width: '100%' }}>{item}</Tag.CheckableTag>
              ))}
            </Space>
          </div>
          <div style={filterPanelStyle}>
            <div style={filterTitleStyle}><SafetyOutlined style={{ color: '#0958d9' }} />操作类型</div>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {operateTypeOptions.map((item) => (
                <Tag.CheckableTag key={item} checked={selectedOperateType.includes(item)} onChange={(checked) => {
                  if (checked) setSelectedOperateType([...selectedOperateType, item])
                  else setSelectedOperateType(selectedOperateType.filter((t) => t !== item))
                }} style={{ padding: '4px 12px', borderRadius: 4, marginRight: 0, display: 'block', width: '100%' }}>{item}</Tag.CheckableTag>
              ))}
            </Space>
          </div>
          <div style={filterPanelStyle}>
            <div style={filterTitleStyle}><WarningOutlined style={{ color: '#0958d9' }} />风险等级</div>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {riskLevelOptions.map((item) => {
                const config = riskLevelConfig[item as keyof typeof riskLevelConfig]
                return (
                  <Tag.CheckableTag key={item} checked={selectedRiskLevel.includes(item)} onChange={(checked) => {
                    if (checked) setSelectedRiskLevel([...selectedRiskLevel, item])
                    else setSelectedRiskLevel(selectedRiskLevel.filter((r) => r !== item))
                  }} style={{ padding: '4px 12px', borderRadius: 4, marginRight: 0, display: 'block', width: '100%', color: selectedRiskLevel.includes(item) ? config.color : undefined }}>
                    <Badge color={config.color} /> {config.label}风险
                  </Tag.CheckableTag>
                )
              })}
            </Space>
          </div>
          <div style={filterPanelStyle}>
            <div style={filterTitleStyle}><ClockCircleOutlined style={{ color: '#0958d9' }} />时间范围</div>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {['今天', '昨天', '近7天', '近30天', '近90天', '自定义'].map((item) => (
                <Tag.CheckableTag key={item} checked={item === '近90天'} style={{ padding: '4px 12px', borderRadius: 4, marginRight: 0, display: 'block', width: '100%' }}>{item}</Tag.CheckableTag>
              ))}
            </Space>
          </div>
        </Col>
        <Col span={19}>
          <Card style={{ borderRadius: 8, marginBottom: 16 }}>
            <Space style={{ marginBottom: 16, width: '100%' }} wrap>
              <Input placeholder="操作人" prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 160 }} allowClear />
              <Input placeholder="IP地址" prefix={<SearchOutlined />} value={ipSearch} onChange={(e) => setIpSearch(e.target.value)} style={{ width: 160 }} allowClear />
              <Input placeholder="关键词搜索" prefix={<SearchOutlined />} value={keywordSearch} onChange={(e) => setKeywordSearch(e.target.value)} style={{ width: 200 }} allowClear />
              <RangePicker style={{ width: 260 }} />
              <Button type="primary">查询</Button>
              <Button onClick={() => { setSearchText(''); setIpSearch(''); setKeywordSearch(''); setSelectedModule([]); setSelectedOperateType([]); setSelectedRiskLevel([]) }}>重置</Button>
            </Space>
            <Table columns={columns} dataSource={mockData} pagination={{ pageSize: 10, total: 12856, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条记录` }} expandable={{ expandedRowRender, expandRowByClick: true }} scroll={{ x: 1200 }} size="small" />
          </Card>
          <Row gutter={16}>
            <Col span={10}><Card style={{ borderRadius: 8 }}><ReactECharts option={pieOption} style={{ height: 280 }} /></Card></Col>
            <Col span={14}><Card style={{ borderRadius: 8 }}><ReactECharts option={trendOption} style={{ height: 280 }} /></Card></Col>
          </Row>
          <Card title={<Space><WarningOutlined style={{ color: '#ff4d4f' }} />高危操作 Top10 排行</Space>} style={{ borderRadius: 8, marginTop: 16 }} size="small">
            <List dataSource={topRiskOperations} renderItem={(item) => (
              <List.Item actions={[<Tag color="orange" key="count">{item.count}次</Tag>]}>
                <List.Item.Meta
                  avatar={<div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: item.rank <= 3 ? '#ff4d4f' : '#faad14', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{item.rank}</div>}
                  title={item.name}
                  description={item.module}
                />
              </List.Item>
            )} />
          </Card>
        </Col>
      </Row>
    </div>
  )

  const reviewRecordContent = (
    <div>
      <Alert
        message="关键操作复查机制"
        description="根据等保三级要求，删除、授权、导出等高风险操作需进行人工复核。复查记录永久保存，作为安全审计依据。"
        type="warning"
        showIcon
        icon={<AuditOutlined />}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card style={{ borderRadius: 8 }}><Statistic title="待复查操作" value={reviewRecords.filter(r => r.reviewStatus === 'pending').length} prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: '#faad14', fontSize: 24 }} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 8 }}><Statistic title="已复查通过" value={reviewRecords.filter(r => r.reviewStatus === 'approved').length} prefix={<CheckSquareOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a', fontSize: 24 }} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 8 }}><Statistic title="已复查驳回" value={reviewRecords.filter(r => r.reviewStatus === 'rejected').length} prefix={<StopOutlined style={{ color: '#ff4d4f' }} />} valueStyle={{ color: '#ff4d4f', fontSize: 24 }} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 8 }}><Statistic title="复查及时率" value={98.5} precision={1} suffix="%" prefix={<CheckCircleOutlined style={{ color: '#0958d9' }} />} valueStyle={{ color: '#0958d9', fontSize: 24 }} /></Card></Col>
      </Row>
      <Card style={{ borderRadius: 8 }}>
        <Table columns={reviewColumns} dataSource={reviewRecords} pagination={{ pageSize: 10 }} size="small" />
      </Card>
    </div>
  )

  const riskDisposalContent = (
    <div>
      <Alert
        message="风险处置流程"
        description="系统自动检测异常操作并生成风险处置工单，按照风险等级触发不同处置流程。所有处置措施均记录留痕，形成安全闭环。"
        type="error"
        showIcon
        icon={<ExclamationCircleOutlined />}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card style={{ borderRadius: 8 }}><Statistic title="待处置风险" value={riskDisposals.filter(r => r.status === 'pending').length} prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: '#faad14', fontSize: 24 }} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 8 }}><Statistic title="处理中风险" value={riskDisposals.filter(r => r.status === 'processing').length} prefix={<AuditOutlined style={{ color: '#0958d9' }} />} valueStyle={{ color: '#0958d9', fontSize: 24 }} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 8 }}><Statistic title="已解决风险" value={riskDisposals.filter(r => r.status === 'resolved').length} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a', fontSize: 24 }} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 8 }}><Statistic title="风险解决率" value={95.2} precision={1} suffix="%" prefix={<SafetyOutlined style={{ color: '#722ed1' }} />} valueStyle={{ color: '#722ed1', fontSize: 24 }} /></Card></Col>
      </Row>
      <Card style={{ borderRadius: 8, marginBottom: 16 }} title={<Space><ClockCircleOutlined />风险处置时间线</Space>}>
        <Timeline mode="alternate">
          <Timeline.Item color="red" label="2026-06-14 08:30">检测到异常登录攻击，自动封禁IP</Timeline.Item>
          <Timeline.Item color="green" label="2026-06-14 09:15">管理员admin完成处置，风险解除</Timeline.Item>
          <Timeline.Item color="orange" label="2026-06-13 15:20">发现接口脱敏漏洞，紧急修复中</Timeline.Item>
          <Timeline.Item color="green" label="2026-06-13 16:45">完成修复并通过安全测试</Timeline.Item>
          <Timeline.Item color="blue" label="2026-06-12 11:30">普通用户尝试越权访问，权限系统正常拦截</Timeline.Item>
        </Timeline>
      </Card>
      <Card style={{ borderRadius: 8 }}>
        <Table columns={disposalColumns} dataSource={riskDisposals} pagination={{ pageSize: 10 }} size="small" expandable={{
          expandedRowRender: (record) => (
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="处置措施" span={2}>
                <Space direction="vertical">
                  {record.measures.length > 0 ? record.measures.map((m, i) => (
                    <Tag key={i} color="blue">{i + 1}. {m}</Tag>
                  )) : <Text type="secondary">暂未采取处置措施</Text>}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="影响评估" span={2}>{record.impact}</Descriptions.Item>
              <Descriptions.Item label="处理完成时间">{record.handleTime || '-'}</Descriptions.Item>
            </Descriptions>
          )
        }} />
      </Card>
    </div>
  )

  const complianceContent = (
    <div>
      <Alert
        message="等保三级 & 国密算法合规验收"
        description="本系统按照网络安全等级保护三级标准建设，采用国密SM2/SM3/SM4算法进行身份认证、签名验签和传输加密。定期开展合规检查，确保持续满足监管要求。"
        type="success"
        showIcon
        icon={<SafetyCertificateOutlined />}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}><Card style={{ borderRadius: 8 }}><Statistic title="合规项" value={complianceItems.filter(c => c.status === 'compliant').length} suffix={`/ ${complianceItems.length}`} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a', fontSize: 24 }} /></Card></Col>
        <Col span={4}><Card style={{ borderRadius: 8 }}><Statistic title="部分合规" value={complianceItems.filter(c => c.status === 'partially').length} prefix={<WarningOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: '#faad14', fontSize: 24 }} /></Card></Col>
        <Col span={4}><Card style={{ borderRadius: 8 }}><Statistic title="不合规" value={complianceItems.filter(c => c.status === 'non-compliant').length} prefix={<StopOutlined style={{ color: '#ff4d4f' }} />} valueStyle={{ color: '#ff4d4f', fontSize: 24 }} /></Card></Col>
        <Col span={4}><Card style={{ borderRadius: 8 }}><Statistic title="综合合规率" value={91.7} precision={1} suffix="%" prefix={<SafetyOutlined style={{ color: '#0958d9' }} />} valueStyle={{ color: '#0958d9', fontSize: 24 }} /></Card></Col>
        <Col span={4}><Card style={{ borderRadius: 8 }}><Statistic title="国密算法支持" value={3} suffix="类" prefix={<KeyOutlined style={{ color: '#722ed1' }} />} valueStyle={{ color: '#722ed1', fontSize: 24 }} /></Card></Col>
        <Col span={4}><Card style={{ borderRadius: 8 }}><Statistic title="最近审计日期" value="2026-06-10" prefix={<AuditOutlined style={{ color: '#13c2c2' }} />} valueStyle={{ color: '#13c2c2', fontSize: 18 }} /></Card></Col>
      </Row>
      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Space wrap size="large">
          <Space direction="vertical" size="small">
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}><SafetyOutlined /> 等保三级认证</Tag>
            <Switch checked disabled /> <Text type="secondary">已通过</Text>
          </Space>
          <Space direction="vertical" size="small">
            <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}><SafetyOutlined /> 国密SM4传输加密</Tag>
            <Switch checked disabled /> <Text type="secondary">已启用</Text>
          </Space>
          <Space direction="vertical" size="small">
            <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}><KeyOutlined /> 国密SM3签名验签</Tag>
            <Switch checked disabled /> <Text type="secondary">已启用</Text>
          </Space>
          <Space direction="vertical" size="small">
            <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}><SafetyCertificateOutlined /> 国密SM2身份认证</Tag>
            <Switch checked disabled /> <Text type="secondary">已支持</Text>
          </Space>
          <Space direction="vertical" size="small">
            <Tag color="purple" style={{ fontSize: 14, padding: '4px 12px' }}><FileTextOutlined /> 90天审计留存</Tag>
            <Switch checked disabled /> <Text type="secondary">已配置</Text>
          </Space>
        </Space>
      </Card>
      <Card style={{ borderRadius: 8 }} title="合规检查清单">
        <Table columns={complianceColumns} dataSource={complianceItems} pagination={{ pageSize: 10 }} size="small" />
      </Card>
    </div>
  )

  const tabItems: TabsProps['items'] = [
    { key: 'operations', label: <Space><FileTextOutlined />操作记录</Space>, children: operationLogContent },
    { key: 'reviews', label: <Space><CheckSquareOutlined />复查记录 <Badge count={reviewRecords.filter(r => r.reviewStatus === 'pending').length} size="small" offset={[4, -2]} /></Space>, children: reviewRecordContent },
    { key: 'disposal', label: <Space><ExclamationCircleOutlined />风险处置 <Badge count={riskDisposals.filter(r => r.status === 'pending' || r.status === 'processing').length} size="small" offset={[4, -2]} /></Space>, children: riskDisposalContent },
    { key: 'compliance', label: <Space><SafetyCertificateOutlined />合规验收</Space>, children: complianceContent }
  ]

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}><SafetyOutlined style={{ color: '#0958d9', marginRight: 8 }} />90天关键操作审计与复查</Title>
          <div style={{ color: '#8c8c8c', fontSize: 13, marginTop: 4 }}>全量操作日志留存，满足合规审计要求</div>
        </div>
        <Space>
          <Tooltip title="刷新数据"><Button icon={<ReloadOutlined />} /></Tooltip>
          <Button type="primary" icon={<ExportOutlined />}>导出Excel</Button>
        </Space>
      </div>
      <Card style={{ borderRadius: 8 }} styles={{ body: { padding: 0 } }}>
        <Tabs defaultActiveKey="operations" items={tabItems} size="large" style={{ padding: '0 24px' }} />
      </Card>

      <Modal
        title="关键操作复查"
        open={reviewModalVisible}
        onOk={handleReviewSubmit}
        onCancel={() => setReviewModalVisible(false)}
        width={600}
        okText="提交复查意见"
      >
        {currentReviewRecord && (
          <div>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="操作时间">{currentReviewRecord.operationTime}</Descriptions.Item>
              <Descriptions.Item label="操作人">{currentReviewRecord.operator}</Descriptions.Item>
              <Descriptions.Item label="操作类型"><Tag color="red">{currentReviewRecord.operateType}</Tag></Descriptions.Item>
              <Descriptions.Item label="操作描述">{currentReviewRecord.description}</Descriptions.Item>
              <Descriptions.Item label="风险等级">
                <Tag color={riskLevelConfig[currentReviewRecord.riskLevel].color}>
                  {riskLevelConfig[currentReviewRecord.riskLevel].label}风险
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <Form form={reviewForm} layout="vertical">
              <Form.Item name="status" label="复查结论" rules={[{ required: true, message: '请选择复查结论' }]}>
                <Select placeholder="请选择复查结论">
                  <Option value="approved">通过 - 确认该操作为正常业务操作</Option>
                  <Option value="rejected">驳回 - 该操作存在风险，需撤销或整改</Option>
                </Select>
              </Form.Item>
              <Form.Item name="comment" label="复查意见" rules={[{ required: true, message: '请输入复查意见' }]}>
                <TextArea rows={4} placeholder="请详细说明复查意见和依据..." />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AuditLogs
