import React, { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  Descriptions,
  Progress,
  Timeline,
  Alert,
  Badge,
  Avatar
} from 'antd'
import {
  DatabaseOutlined,
  RiseOutlined,
  ApiOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  SafetyOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  AuditOutlined,
  ReadOutlined,
  CarOutlined,
  KeyOutlined,
  HistoryOutlined,
  ShareAltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  EyeOutlined,
  PlusOutlined,
  SyncOutlined,
  BankOutlined,
  TeamOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import type { TabsProps } from 'antd'

const { Option } = Select
const { TextArea } = Input

interface AssetAuthorization {
  key: string
  id: number
  assetType: string
  assetName: string
  authorizedDept: string
  authorizedUser: string
  authPurpose: string
  authScope: string
  authStatus: 'active' | 'expired' | 'revoked' | 'pending'
  grantTime: string
  expireTime: string
  callCount: number
  createdBy: string
}

interface CallTrace {
  key: string
  id: number
  assetType: string
  assetName: string
  callerType: 'user' | 'system' | 'dept'
  caller: string
  callDept: string
  callTime: string
  callPurpose: string
  callResult: 'success' | 'failed'
  responseTime: number
  dataSize: string
  requestId: string
  ipAddress: string
}

interface CrossDeptShare {
  key: string
  id: number
  sourceDept: string
  targetDept: string
  assetType: string
  assetName: string
  sharePurpose: string
  shareStatus: 'active' | 'suspended' | 'terminated'
  dataVolume: string
  syncFrequency: string
  lastSyncTime: string
  nextSyncTime: string
  successRate: number
  authorizedBy: string
  authorizationDoc: string
}

interface RecommendationSource {
  key: string
  id: number
  serviceName: string
  recommendReason: string
  recommendSource: string
  matchTags: string[]
  confidence: number
  userAction: 'used' | 'ignored' | 'viewed'
  recommendTime: string
}

const assetAuthorizations: AssetAuthorization[] = [
  {
    key: '1', id: 1, assetType: '证照类', assetName: '居民身份证电子证照',
    authorizedDept: '市场监督管理局', authorizedUser: '工商窗口-张三',
    authPurpose: '企业开办身份核验', authScope: '只读,有效期内',
    authStatus: 'active', grantTime: '2026-06-01 09:30:00', expireTime: '2026-12-31 23:59:59',
    callCount: 1256, createdBy: 'admin'
  },
  {
    key: '2', id: 2, assetType: '社会保障类', assetName: '社保缴费记录查询',
    authorizedDept: '住房和城乡建设厅', authorizedUser: '公积金中心-李四',
    authPurpose: '公积金贷款资格审核', authScope: '近24个月缴费记录',
    authStatus: 'active', grantTime: '2026-05-15 14:20:00', expireTime: '2026-11-15 23:59:59',
    callCount: 892, createdBy: 'admin'
  },
  {
    key: '3', id: 3, assetType: '医疗保障类', assetName: '医保参保状态查询',
    authorizedDept: '教育厅', authorizedUser: '学生资助中心-王五',
    authPurpose: '贫困学生资助资格审核', authScope: '参保状态,报销记录',
    authStatus: 'pending', grantTime: '2026-06-14 10:15:00', expireTime: '2026-09-14 23:59:59',
    callCount: 0, createdBy: 'wangwu'
  },
  {
    key: '4', id: 4, assetType: '税务类', assetName: '个人纳税记录查询',
    authorizedDept: '自然资源厅', authorizedUser: '不动产登记中心-赵六',
    authPurpose: '购房资格审核', authScope: '近12个月纳税记录',
    authStatus: 'expired', grantTime: '2026-01-01 00:00:00', expireTime: '2026-06-01 23:59:59',
    callCount: 3241, createdBy: 'admin'
  },
  {
    key: '5', id: 5, assetType: '住房公积金类', assetName: '公积金缴存余额查询',
    authorizedDept: '民政厅', authorizedUser: '低保审核中心-钱七',
    authPurpose: '低保家庭收入核实', authScope: '月缴存额,缴存状态',
    authStatus: 'revoked', grantTime: '2026-03-01 08:00:00', expireTime: '2026-09-01 23:59:59',
    callCount: 156, createdBy: 'admin'
  },
  {
    key: '6', id: 6, assetType: '教育类', assetName: '学历证书查询',
    authorizedDept: '人力资源和社会保障厅', authorizedUser: '人才服务中心-孙八',
    authPurpose: '事业单位招聘资格审核', authScope: '最高学历,毕业院校',
    authStatus: 'active', grantTime: '2026-04-10 09:00:00', expireTime: '2026-10-10 23:59:59',
    callCount: 2341, createdBy: 'admin'
  }
]

const callTraces: CallTrace[] = Array.from({ length: 20 }).map((_, i) => {
  const assetTypes = ['证照类', '社会保障类', '住房公积金类', '医疗保障类', '税务类', '教育类', '交通出行类']
  const assetNames = ['身份证电子证照', '社保缴费记录', '公积金缴存信息', '医保账户信息', '个人纳税记录', '学历证书', '驾驶证信息']
  const callers = ['工商窗口-张三', '公积金中心-李四', '不动产登记-赵六', '人才服务-孙八', '政务服务网', '我的宁夏APP', '12345热线系统']
  const depts = ['市场监督管理局', '住房和城乡建设厅', '自然资源厅', '人力资源和社会保障厅', '政务服务中心']
  const purposes = ['身份核验', '资格审核', '信息查询', '材料预填', '业务办理']
  const results: Array<'success' | 'failed'> = ['success', 'success', 'success', 'success', 'failed']

  const hour = Math.floor(Math.random() * 24)
  const minute = Math.floor(Math.random() * 60)
  const date = new Date()
  date.setHours(hour, minute, 0, 0)

  return {
    key: String(i + 1),
    id: i + 1,
    assetType: assetTypes[i % assetTypes.length],
    assetName: assetNames[i % assetNames.length],
    callerType: i % 3 === 0 ? 'system' : i % 3 === 1 ? 'user' : 'dept',
    caller: callers[i % callers.length],
    callDept: depts[i % depts.length],
    callTime: date.toLocaleString('zh-CN', { hour12: false }),
    callPurpose: purposes[i % purposes.length],
    callResult: results[i % results.length],
    responseTime: Math.floor(Math.random() * 200) + 20,
    dataSize: (Math.random() * 2 + 0.1).toFixed(2) + 'KB',
    requestId: 'REQ-' + Date.now() + '-' + (1000 + i),
    ipAddress: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
  }
})

const crossDeptShares: CrossDeptShare[] = [
  {
    key: '1', id: 1, sourceDept: '公安厅', targetDept: '市场监督管理局',
    assetType: '证照类', assetName: '户籍人口基本信息',
    sharePurpose: '企业开办身份核验、个体户工商登记',
    shareStatus: 'active', dataVolume: '680万条', syncFrequency: '实时同步',
    lastSyncTime: '2026-06-15 10:23:45', nextSyncTime: '2026-06-15 10:24:45',
    successRate: 99.8, authorizedBy: 'admin', authorizationDoc: '宁数共〔2025〕001号'
  },
  {
    key: '2', id: 2, sourceDept: '人力资源和社会保障厅', targetDept: '医疗保障局',
    assetType: '社会保障类', assetName: '参保人员基本信息',
    sharePurpose: '医保参保登记、待遇享受资格核验',
    shareStatus: 'active', dataVolume: '520万条', syncFrequency: '每小时同步',
    lastSyncTime: '2026-06-15 10:00:00', nextSyncTime: '2026-06-15 11:00:00',
    successRate: 99.5, authorizedBy: 'admin', authorizationDoc: '宁数共〔2025〕002号'
  },
  {
    key: '3', id: 3, sourceDept: '自然资源厅', targetDept: '住房和城乡建设厅',
    assetType: '住房公积金类', assetName: '不动产登记信息',
    sharePurpose: '公积金贷款抵押物核验、房产交易登记',
    shareStatus: 'active', dataVolume: '320万条', syncFrequency: '每日同步',
    lastSyncTime: '2026-06-15 02:00:00', nextSyncTime: '2026-06-16 02:00:00',
    successRate: 98.9, authorizedBy: 'admin', authorizationDoc: '宁数共〔2025〕003号'
  },
  {
    key: '4', id: 4, sourceDept: '教育厅', targetDept: '民政厅',
    assetType: '教育类', assetName: '学生学籍信息',
    sharePurpose: '教育救助、低保家庭学生认定',
    shareStatus: 'suspended', dataVolume: '180万条', syncFrequency: '每周同步',
    lastSyncTime: '2026-06-10 03:00:00', nextSyncTime: '-',
    successRate: 95.2, authorizedBy: 'admin', authorizationDoc: '宁数共〔2025〕004号'
  },
  {
    key: '5', id: 5, sourceDept: '卫生健康委员会', targetDept: '医疗保障局',
    assetType: '医疗保障类', assetName: '医疗机构诊疗信息',
    sharePurpose: '医保智能审核、医疗费用结算',
    shareStatus: 'active', dataVolume: '1200万条', syncFrequency: '实时同步',
    lastSyncTime: '2026-06-15 10:25:30', nextSyncTime: '2026-06-15 10:26:30',
    successRate: 99.9, authorizedBy: 'admin', authorizationDoc: '宁数共〔2025〕005号'
  },
  {
    key: '6', id: 6, sourceDept: '税务局', targetDept: '自然资源厅',
    assetType: '税务类', assetName: '个人完税信息',
    sharePurpose: '购房资格审核、不动产交易计税',
    shareStatus: 'active', dataVolume: '450万条', syncFrequency: '每小时同步',
    lastSyncTime: '2026-06-15 10:00:00', nextSyncTime: '2026-06-15 11:00:00',
    successRate: 99.7, authorizedBy: 'admin', authorizationDoc: '宁数共〔2025〕006号'
  }
]

const recommendationSources: RecommendationSource[] = [
  {
    key: '1', id: 1, serviceName: '社保待遇资格认证',
    recommendReason: '根据用户近期社保查询行为和退休人员标签',
    recommendSource: '城市数据秘书-推荐引擎',
    matchTags: ['社保查询', '退休人员', '年龄>60岁'],
    confidence: 95, userAction: 'used', recommendTime: '2026-06-15 09:30:00'
  },
  {
    key: '2', id: 2, serviceName: '公积金提取申请',
    recommendReason: '根据用户公积金缴存记录和近期购房行为分析',
    recommendSource: '事项关联规则 + 用户画像',
    matchTags: ['公积金缴存', '购房记录', '有房'],
    confidence: 88, userAction: 'viewed', recommendTime: '2026-06-15 08:15:00'
  },
  {
    key: '3', id: 3, serviceName: '居住证办理',
    recommendReason: '根据用户流动人口登记和社保缴纳满6个月',
    recommendSource: '政策规则匹配引擎',
    matchTags: ['流动人口登记', '社保缴纳>6个月', '非本地户籍'],
    confidence: 92, userAction: 'used', recommendTime: '2026-06-14 16:20:00'
  },
  {
    key: '4', id: 4, serviceName: '医保异地就医备案',
    recommendReason: '根据用户近期异地就医记录和医保参保状态',
    recommendSource: '行为序列分析',
    matchTags: ['异地就医', '医保参保', '常住外地'],
    confidence: 85, userAction: 'ignored', recommendTime: '2026-06-14 14:10:00'
  },
  {
    key: '5', id: 5, serviceName: '子女教育补贴申请',
    recommendReason: '根据用户子女学籍信息和低收入家庭标签',
    recommendSource: '用户画像 + 政策匹配',
    matchTags: ['有子女上学', '低收入', '教育补贴政策'],
    confidence: 90, userAction: 'viewed', recommendTime: '2026-06-14 10:30:00'
  }
]

const DataAssetsOverview: React.FC = () => {
  const [authModalVisible, setAuthModalVisible] = useState(false)
  const [selectedAuth, setSelectedAuth] = useState<AssetAuthorization | null>(null)

  const statsCards = [
    { title: '累计数据资产数', value: 128560, suffix: '项', prefix: <DatabaseOutlined />, color: '#0958d9' },
    { title: '今日新增资产', value: 328, suffix: '项', prefix: <RiseOutlined />, color: '#52c41a' },
    { title: '已授权资产调用次数', value: 89650, suffix: '次', prefix: <ApiOutlined />, color: '#faad14' },
    { title: '资产类型数', value: 7, suffix: '大类', prefix: <AppstoreOutlined />, color: '#722ed1' }
  ]

  const assetCategories = [
    { name: '证照类', icon: <FileTextOutlined style={{ fontSize: 32, color: '#0958d9' }} />, count: '12,580', unit: '本', callCount: '45,620次', desc: '身份证、户口簿、结婚证等', bgColor: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)' },
    { name: '社会保障类', icon: <SafetyOutlined style={{ fontSize: 32, color: '#52c41a' }} />, count: '28,960', unit: '条', callCount: '32,180次', desc: '社保、养老、失业', bgColor: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)' },
    { name: '住房公积金类', icon: <HomeOutlined style={{ fontSize: 32, color: '#faad14' }} />, count: '15,420', unit: '户', callCount: '28,950次', desc: '缴存余额、提取次数', bgColor: 'linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)' },
    { name: '医疗保障类', icon: <MedicineBoxOutlined style={{ fontSize: 32, color: '#eb2f96' }} />, count: '35,680', unit: '条', callCount: '52,340次', desc: '医保账户、就医记录', bgColor: 'linear-gradient(135deg, #fff0f6 0%, #ffadd2 100%)' },
    { name: '税务类', icon: <AuditOutlined style={{ fontSize: 32, color: '#13c2c2' }} />, count: '8,920', unit: '条', callCount: '12,560次', desc: '纳税记录', bgColor: 'linear-gradient(135deg, #e6fffb 0%, #87e8de 100%)' },
    { name: '教育类', icon: <ReadOutlined style={{ fontSize: 32, color: '#722ed1' }} />, count: '12,360', unit: '条', callCount: '18,920次', desc: '学历、证书', bgColor: 'linear-gradient(135deg, #f9f0ff 0%, #d3adf7 100%)' },
    { name: '交通出行类', icon: <CarOutlined style={{ fontSize: 32, color: '#fa541c' }} />, count: '14,720', unit: '条', callCount: '24,680次', desc: '驾照、车辆', bgColor: 'linear-gradient(135deg, #fff2e8 0%, #ffbb96 100%)' }
  ]

  const growthTrendOption = {
    title: { text: '数据资产增长趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['累计资产数', '新增资产数'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '15%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: ['7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月', '6月'] },
    yAxis: { type: 'value' },
    series: [
      { name: '累计资产数', type: 'line', smooth: true, data: [45200, 52800, 61200, 68500, 75200, 82600, 89800, 95600, 102300, 108900, 115600, 128560],
        itemStyle: { color: '#0958d9' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(9, 88, 217, 0.3)' }, { offset: 1, color: 'rgba(9, 88, 217, 0.05)' }] } }
      },
      { name: '新增资产数', type: 'line', smooth: true, data: [2800, 3200, 3600, 2800, 3100, 3500, 3800, 2900, 3300, 3600, 3200, 328],
        itemStyle: { color: '#52c41a' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(82, 196, 26, 0.3)' }, { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }] } }
      }
    ]
  }

  const pieOption = {
    title: { text: '资产类型分布', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'item' },
    legend: { orient: 'horizontal', bottom: 0, type: 'scroll' },
    series: [{
      name: '资产数量', type: 'pie', radius: ['40%', '60%'], center: ['50%', '45%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false }, emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: [
        { value: 12580, name: '证照类' }, { value: 28960, name: '社会保障类' },
        { value: 15420, name: '住房公积金类' }, { value: 35680, name: '医疗保障类' },
        { value: 8920, name: '税务类' }, { value: 12360, name: '教育类' }, { value: 14720, name: '交通出行类' }
      ],
      color: ['#0958d9', '#52c41a', '#faad14', '#eb2f96', '#13c2c2', '#722ed1', '#fa541c']
    }]
  }

  const deptRankingOption = {
    title: { text: '各委办局数据提供量排行', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: ['卫健委', '人社局', '医保局', '住建局', '教育局', '公安局', '交通局', '税务局', '民政局', '市场监管局'], inverse: true },
    series: [{
      name: '数据量', type: 'bar', data: [25680, 22890, 18320, 15980, 12560, 11210, 9890, 8450, 7100, 5890],
      itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#0958d9' }, { offset: 1, color: '#69b1ff' }] }, borderRadius: [0, 4, 4, 0] },
      barWidth: '60%'
    }]
  }

  const authorizationColumns: ColumnsType<AssetAuthorization> = [
    { title: '资产类型', dataIndex: 'assetType', key: 'assetType', width: 100, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '资产名称', dataIndex: 'assetName', key: 'assetName', width: 160 },
    { title: '授权部门', dataIndex: 'authorizedDept', key: 'authorizedDept', width: 160 },
    { title: '授权用户', dataIndex: 'authorizedUser', key: 'authorizedUser', width: 140 },
    { title: '授权用途', dataIndex: 'authPurpose', key: 'authPurpose', ellipsis: true },
    { title: '调用次数', dataIndex: 'callCount', key: 'callCount', width: 100, render: (c: number) => c.toLocaleString() },
    { title: '授权状态', dataIndex: 'authStatus', key: 'authStatus', width: 100, render: (s: string) => {
      const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
        active: { color: 'green', text: '生效中', icon: <UnlockOutlined /> },
        expired: { color: 'orange', text: '已过期', icon: <ClockCircleOutlined /> },
        revoked: { color: 'red', text: '已撤销', icon: <LockOutlined /> },
        pending: { color: 'blue', text: '待审批', icon: <ClockCircleOutlined /> }
      }
      return <Tag color={map[s]?.color}><Space size={4}>{map[s]?.icon}{map[s]?.text}</Space></Tag>
    }},
    { title: '授权时间', dataIndex: 'grantTime', key: 'grantTime', width: 170 },
    { title: '操作', key: 'action', width: 120, render: (_, record) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedAuth(record); setAuthModalVisible(true); }}>详情</Button>
        {record.authStatus === 'active' && <Button type="link" size="small" danger>撤销</Button>}
      </Space>
    )}
  ]

  const callTraceColumns: ColumnsType<CallTrace> = [
    { title: '调用时间', dataIndex: 'callTime', key: 'callTime', width: 170 },
    { title: '资产类型', dataIndex: 'assetType', key: 'assetType', width: 100, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '资产名称', dataIndex: 'assetName', key: 'assetName', width: 140 },
    { title: '调用方类型', dataIndex: 'callerType', key: 'callerType', width: 100, render: (t: string) => {
      const map: Record<string, { color: string; text: string }> = {
        user: { color: 'blue', text: '用户' }, system: { color: 'purple', text: '系统' }, dept: { color: 'green', text: '部门' }
      }
      return <Tag color={map[t]?.color}>{map[t]?.text}</Tag>
    }},
    { title: '调用方', dataIndex: 'caller', key: 'caller', width: 130 },
    { title: '所属部门', dataIndex: 'callDept', key: 'callDept', width: 140 },
    { title: '调用用途', dataIndex: 'callPurpose', key: 'callPurpose', width: 100 },
    { title: '调用结果', dataIndex: 'callResult', key: 'callResult', width: 80, render: (r: string) => (
      <Badge status={r === 'success' ? 'success' : 'error'} text={r === 'success' ? '成功' : '失败'} />
    )},
    { title: '响应时间', dataIndex: 'responseTime', key: 'responseTime', width: 100, render: (t: number) => `${t}ms` },
    { title: '数据量', dataIndex: 'dataSize', key: 'dataSize', width: 90 }
  ]

  const crossDeptShareColumns: ColumnsType<CrossDeptShare> = [
    { title: '源部门', dataIndex: 'sourceDept', key: 'sourceDept', width: 130, render: (d: string) => (
      <Space><Avatar size="small" style={{ backgroundColor: '#0958d9' }} icon={<BankOutlined />} />{d}</Space>
    )},
    { title: '目标部门', dataIndex: 'targetDept', key: 'targetDept', width: 130, render: (d: string) => (
      <Space><Avatar size="small" style={{ backgroundColor: '#52c41a' }} icon={<TeamOutlined />} />{d}</Space>
    )},
    { title: '资产类型', dataIndex: 'assetType', key: 'assetType', width: 100, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '资产名称', dataIndex: 'assetName', key: 'assetName', width: 160 },
    { title: '共享用途', dataIndex: 'sharePurpose', key: 'sharePurpose', ellipsis: true },
    { title: '数据量', dataIndex: 'dataVolume', key: 'dataVolume', width: 100 },
    { title: '同步频率', dataIndex: 'syncFrequency', key: 'syncFrequency', width: 100 },
    { title: '成功率', dataIndex: 'successRate', key: 'successRate', width: 100, render: (r: number) => (
      <Progress percent={r} size="small" format={(p) => `${p}%`} />
    )},
    { title: '共享状态', dataIndex: 'shareStatus', key: 'shareStatus', width: 100, render: (s: string) => {
      const map: Record<string, { color: string; text: string }> = {
        active: { color: 'green', text: '正常' },
        suspended: { color: 'orange', text: '暂停' },
        terminated: { color: 'red', text: '终止' }
      }
      return <Tag color={map[s]?.color}>{map[s]?.text}</Tag>
    }}
  ]

  const recommendationColumns: ColumnsType<RecommendationSource> = [
    { title: '服务名称', dataIndex: 'serviceName', key: 'serviceName', width: 180 },
    { title: '推荐原因', dataIndex: 'recommendReason', key: 'recommendReason', ellipsis: true },
    { title: '推荐来源', dataIndex: 'recommendSource', key: 'recommendSource', width: 180 },
    { title: '匹配标签', dataIndex: 'matchTags', key: 'matchTags', render: (tags: string[]) => (
      <Space wrap>{tags.map((tag, i) => <Tag key={i} color="blue">{tag}</Tag>)}</Space>
    )},
    { title: '置信度', dataIndex: 'confidence', key: 'confidence', width: 120, render: (c: number) => (
      <Progress percent={c} size="small" strokeColor={c >= 90 ? '#52c41a' : c >= 80 ? '#faad14' : '#ff4d4f'} />
    )},
    { title: '用户行为', dataIndex: 'userAction', key: 'userAction', width: 100, render: (a: string) => {
      const map: Record<string, { color: string; text: string }> = {
        used: { color: 'green', text: '已使用' },
        viewed: { color: 'blue', text: '已查看' },
        ignored: { color: 'default', text: '已忽略' },
        pending: { color: 'orange', text: '待处理' }
      }
      return <Tag color={map[a]?.color}>{map[a]?.text}</Tag>
    }},
    { title: '推荐时间', dataIndex: 'recommendTime', key: 'recommendTime', width: 170 }
  ]

  const getAuthStatusColor = (status: string) => {
    const map: Record<string, string> = { active: '#52c41a', expired: '#faad14', revoked: '#ff4d4f', pending: '#0958d9' }
    return map[status] || '#bfbfbf'
  }

  const overviewContent = (
    <div>
      <Alert
        message="数据资产授权说明"
        description="所有个人数据资产的调用均需获得用户明确授权，授权记录全程留痕，支持审计追溯。根据《个人信息保护法》要求，用户可随时撤销授权。"
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statsCards.map((item, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card>
              <Statistic
                title={item.title} value={item.value} suffix={item.suffix}
                prefix={React.cloneElement(item.prefix, { style: { color: item.color } })}
                valueStyle={{ color: item.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Card title="7大数据资产类型" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          {assetCategories.map((item, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <div style={{ padding: 20, borderRadius: 8, background: item.bgColor, height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  {item.icon}
                  <span style={{ marginLeft: 12, fontSize: 16, fontWeight: 500, color: '#333' }}>{item.name}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
                  {item.count}<span style={{ fontSize: 14, fontWeight: 'normal', marginLeft: 4 }}>{item.unit}</span>
                </div>
                <div style={{ fontSize: 12, color: '#666' }}>调用次数：{item.callCount}</div>
                {item.desc && <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{item.desc}</div>}
              </div>
            </Col>
          ))}
        </Row>
      </Card>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}><Card><ReactECharts option={growthTrendOption} style={{ height: 320 }} /></Card></Col>
        <Col xs={24} lg={8}><Card><ReactECharts option={pieOption} style={{ height: 320 }} /></Card></Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} lg={16}><Card><ReactECharts option={deptRankingOption} style={{ height: 350 }} /></Card></Col>
        <Col xs={24} lg={8}>
          <Card title={<Space><Timeline />数据资产更新时间线</Space>}>
            <Timeline>
              <Timeline.Item color="green">2026-06-15 10:25 - 公安厅新增身份证电子证照125本</Timeline.Item>
              <Timeline.Item color="blue">2026-06-15 10:00 - 人社局更新社保缴费记录3280条</Timeline.Item>
              <Timeline.Item color="orange">2026-06-15 09:30 - 医保局同步医保账户信息5680条</Timeline.Item>
              <Timeline.Item color="purple">2026-06-15 08:00 - 自然资源局更新不动产权证书85本</Timeline.Item>
              <Timeline.Item color="green">2026-06-15 02:00 - 每日全量数据同步完成</Timeline.Item>
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  )

  const authorizationContent = (
    <div>
      <Alert
        message="个人数据资产授权管理"
        description="对个人数据资产的访问必须获得明确授权。管理员可查看授权记录、审批授权申请、撤销过期或违规授权。所有授权操作均记录审计日志。"
        type="warning"
        showIcon
        icon={<KeyOutlined />}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}><Card><Statistic title="生效中授权" value={assetAuthorizations.filter(a => a.authStatus === 'active').length} prefix={<UnlockOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="待审批授权" value={assetAuthorizations.filter(a => a.authStatus === 'pending').length} prefix={<ClockCircleOutlined style={{ color: '#0958d9' }} />} valueStyle={{ color: '#0958d9' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="已过期授权" value={assetAuthorizations.filter(a => a.authStatus === 'expired').length} prefix={<WarningOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="已撤销授权" value={assetAuthorizations.filter(a => a.authStatus === 'revoked').length} prefix={<LockOutlined style={{ color: '#ff4d4f' }} />} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="累计授权次数" value={12856} precision={0} prefix={<ApiOutlined style={{ color: '#722ed1' }} />} valueStyle={{ color: '#722ed1' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="授权合规率" value={98.6} precision={1} suffix="%" prefix={<SafetyOutlined style={{ color: '#13c2c2' }} />} valueStyle={{ color: '#13c2c2' }} /></Card></Col>
      </Row>
      <Card style={{ borderRadius: 8 }} title={
        <Space>
          <Button type="primary" icon={<PlusOutlined />}>新增授权</Button>
          <Button icon={<SyncOutlined />}>刷新</Button>
          <Select placeholder="资产类型" style={{ width: 120 }} allowClear>
            <Option value="证照类">证照类</Option>
            <Option value="社会保障类">社会保障类</Option>
            <Option value="医疗保障类">医疗保障类</Option>
          </Select>
          <Select placeholder="授权状态" style={{ width: 120 }} allowClear>
            <Option value="active">生效中</Option>
            <Option value="pending">待审批</Option>
            <Option value="expired">已过期</Option>
          </Select>
          <Input placeholder="搜索授权部门或用户" style={{ width: 200 }} allowClear />
        </Space>
      }>
        <Table columns={authorizationColumns} dataSource={assetAuthorizations} pagination={{ pageSize: 10 }} size="small"
          expandable={{
            expandedRowRender: (record) => (
              <Descriptions column={3} size="small" bordered>
                <Descriptions.Item label="授权范围">{record.authScope}</Descriptions.Item>
                <Descriptions.Item label="到期时间">{record.expireTime}</Descriptions.Item>
                <Descriptions.Item label="创建人">{record.createdBy}</Descriptions.Item>
              </Descriptions>
            )
          }} />
      </Card>
    </div>
  )

  const callTraceContent = (
    <div>
      <Alert
        message="数据调用留痕与审计"
        description="每一次数据资产的调用均会被完整记录，包括调用方、调用时间、调用用途、调用结果等信息。日志留存90天，满足审计追溯要求。"
        type="info"
        showIcon
        icon={<HistoryOutlined />}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}><Card><Statistic title="今日调用次数" value={12568} prefix={<ApiOutlined style={{ color: '#0958d9' }} />} valueStyle={{ color: '#0958d9' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="成功调用" value={12486} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="调用失败" value={82} prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="成功率" value={99.3} precision={1} suffix="%" prefix={<SafetyOutlined style={{ color: '#13c2c2' }} />} valueStyle={{ color: '#13c2c2' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="平均响应时间" value={85} suffix="ms" prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="累计调用量" value={89650} precision={0} prefix={<DatabaseOutlined style={{ color: '#722ed1' }} />} valueStyle={{ color: '#722ed1' }} /></Card></Col>
      </Row>
      <Card style={{ borderRadius: 8 }} title={
        <Space>
          <Select placeholder="调用方类型" style={{ width: 120 }} allowClear>
            <Option value="user">用户</Option>
            <Option value="system">系统</Option>
            <Option value="dept">部门</Option>
          </Select>
          <Select placeholder="调用结果" style={{ width: 120 }} allowClear>
            <Option value="success">成功</Option>
            <Option value="failed">失败</Option>
          </Select>
          <DatePicker.RangePicker style={{ width: 260 }} />
          <Input placeholder="搜索Request ID或IP" style={{ width: 220 }} allowClear />
          <Button type="primary">查询</Button>
          <Button icon={<SyncOutlined />}>刷新</Button>
        </Space>
      }>
        <Table columns={callTraceColumns} dataSource={callTraces} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条调用记录` }} size="small"
          expandable={{
            expandedRowRender: (record) => (
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="Request ID"><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{record.requestId}</span></Descriptions.Item>
                <Descriptions.Item label="IP地址"><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{record.ipAddress}</span></Descriptions.Item>
              </Descriptions>
            )
          }} />
      </Card>
    </div>
  )

  const crossDeptShareContent = (
    <div>
      <Alert
        message="跨部门数据共享"
        description="按照《数据安全法》和《宁夏回族自治区数据共享交换管理办法》，各部门之间的数据共享需签订共享协议，明确共享目的、范围和安全责任。"
        type="success"
        showIcon
        icon={<ShareAltOutlined />}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}><Card><Statistic title="正常共享通道" value={crossDeptShares.filter(s => s.shareStatus === 'active').length} prefix={<ShareAltOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="暂停共享" value={crossDeptShares.filter(s => s.shareStatus === 'suspended').length} prefix={<WarningOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="已终止共享" value={crossDeptShares.filter(s => s.shareStatus === 'terminated').length} prefix={<LockOutlined style={{ color: '#ff4d4f' }} />} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="今日同步数据量" value="12.5" suffix="万条" prefix={<RiseOutlined style={{ color: '#0958d9' }} />} valueStyle={{ color: '#0958d9' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="参与部门数" value={28} suffix="个" prefix={<TeamOutlined style={{ color: '#722ed1' }} />} valueStyle={{ color: '#722ed1' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="共享合规率" value={98.2} precision={1} suffix="%" prefix={<SafetyOutlined style={{ color: '#13c2c2' }} />} valueStyle={{ color: '#13c2c2' }} /></Card></Col>
      </Row>
      <Card style={{ borderRadius: 8 }}>
        <Table columns={crossDeptShareColumns} dataSource={crossDeptShares} pagination={{ pageSize: 10 }} size="small"
          expandable={{
            expandedRowRender: (record) => (
              <Descriptions column={3} size="small" bordered>
                <Descriptions.Item label="上次同步时间">{record.lastSyncTime}</Descriptions.Item>
                <Descriptions.Item label="下次同步时间">{record.nextSyncTime}</Descriptions.Item>
                <Descriptions.Item label="授权文号">{record.authorizationDoc}</Descriptions.Item>
                <Descriptions.Item label="授权人">{record.authorizedBy}</Descriptions.Item>
              </Descriptions>
            )
          }} />
      </Card>
    </div>
  )

  const recommendationSourceContent = (
    <div>
      <Alert
        message="服务推荐来源可解释性"
        description="城市数据秘书的每一条服务推荐均提供可解释的推荐来源和匹配依据，确保推荐过程透明可追溯，保障用户知情权。"
        type="info"
        showIcon
        icon={<AppstoreOutlined />}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}><Card><Statistic title="今日推荐服务" value={128} prefix={<AppstoreOutlined style={{ color: '#0958d9' }} />} valueStyle={{ color: '#0958d9' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="用户已使用" value={56} prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="用户已查看" value={38} prefix={<EyeOutlined style={{ color: '#1890ff' }} />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="用户已忽略" value={34} prefix={<WarningOutlined style={{ color: '#bfbfbf' }} />} valueStyle={{ color: '#bfbfbf' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="推荐采纳率" value={43.8} precision={1} suffix="%" prefix={<RiseOutlined style={{ color: '#faad14' }} />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="平均置信度" value={90.2} precision={1} suffix="%" prefix={<SafetyOutlined style={{ color: '#722ed1' }} />} valueStyle={{ color: '#722ed1' }} /></Card></Col>
      </Row>
      <Card style={{ borderRadius: 8 }}>
        <Table columns={recommendationColumns} dataSource={recommendationSources} pagination={{ pageSize: 10 }} size="small" />
      </Card>
    </div>
  )

  const tabItems: TabsProps['items'] = [
    { key: 'overview', label: <Space><DatabaseOutlined />资产总览</Space>, children: overviewContent },
    { key: 'authorization', label: <Space><KeyOutlined />授权管理 <Badge count={assetAuthorizations.filter(a => a.authStatus === 'pending').length} size="small" offset={[4, -2]} /></Space>, children: authorizationContent },
    { key: 'trace', label: <Space><HistoryOutlined />调用留痕</Space>, children: callTraceContent },
    { key: 'share', label: <Space><ShareAltOutlined />跨部门共享</Space>, children: crossDeptShareContent },
    { key: 'recommend', label: <Space><AppstoreOutlined />推荐来源</Space>, children: recommendationSourceContent }
  ]

  return (
    <div>
      <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: 0 }}>
        <Tabs defaultActiveKey="overview" items={tabItems} size="large" style={{ padding: '0 24px' }} />
      </Card>

      <Modal
        title="数据资产授权详情"
        open={authModalVisible}
        onCancel={() => setAuthModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAuthModalVisible(false)}>关闭</Button>,
          selectedAuth?.authStatus === 'pending' && <Button key="approve" type="primary">审批通过</Button>,
          selectedAuth?.authStatus === 'pending' && <Button key="reject" danger>审批驳回</Button>,
          selectedAuth?.authStatus === 'active' && <Button key="revoke" danger>撤销授权</Button>
        ]}
        width={700}
      >
        {selectedAuth && (
          <div>
            <Descriptions title="基本信息" bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="资产类型"><Tag color="blue">{selectedAuth.assetType}</Tag></Descriptions.Item>
              <Descriptions.Item label="资产名称">{selectedAuth.assetName}</Descriptions.Item>
              <Descriptions.Item label="授权部门">{selectedAuth.authorizedDept}</Descriptions.Item>
              <Descriptions.Item label="授权用户">{selectedAuth.authorizedUser}</Descriptions.Item>
              <Descriptions.Item label="授权状态">
                <Tag color={getAuthStatusColor(selectedAuth.authStatus)}>
                  {selectedAuth.authStatus === 'active' ? '生效中' : selectedAuth.authStatus === 'expired' ? '已过期' : selectedAuth.authStatus === 'revoked' ? '已撤销' : '待审批'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="调用次数">{selectedAuth.callCount.toLocaleString()} 次</Descriptions.Item>
            </Descriptions>
            <Descriptions title="授权信息" bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="授权用途">{selectedAuth.authPurpose}</Descriptions.Item>
              <Descriptions.Item label="授权范围">{selectedAuth.authScope}</Descriptions.Item>
              <Descriptions.Item label="授权时间">{selectedAuth.grantTime}</Descriptions.Item>
              <Descriptions.Item label="到期时间">{selectedAuth.expireTime}</Descriptions.Item>
              <Descriptions.Item label="创建人">{selectedAuth.createdBy}</Descriptions.Item>
            </Descriptions>
            {selectedAuth.authStatus === 'pending' && (
              <Form layout="vertical">
                <Form.Item label="审批意见" required>
                  <TextArea rows={3} placeholder="请输入审批意见..." />
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DataAssetsOverview
