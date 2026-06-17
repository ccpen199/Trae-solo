import React, { useState, useMemo } from 'react'
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
  Avatar,
  List,
  Steps,
  Switch,
  Typography,
  message
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
  UnlockOutlined,
  StopOutlined,
  FrownOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import type { TabsProps } from 'antd'
import { useUserStore } from '@/store/user'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

interface DataAssetsOverviewProps {
  userView?: 'default' | 'auth' | 'recommend' | 'trace'
}

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
  useScene: string
  authChain: string[]
  relatedAssets: { name: string; dept: string; type: string }[]
  successRate: number
  useCount30d: number
  satisfaction: number
  expectedSaveTime: string
  requiredMaterials: { name: string; status: 'auto' | 'upload' }[]
  complianceStatement: string
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
    recommendSource: '与您具有相同标签（退休人员/年龄63岁/银川市户籍）的8,520位用户中，92%完成了该事项认证',
    matchTags: ['社保查询', '退休人员', '年龄>60岁'],
    confidence: 95, userAction: 'used', recommendTime: '2026-06-15 09:30:00',
    useScene: '退休人员养老待遇领取资格年度认证',
    authChain: ['用户授权', '社保缴费记录查询', '退休人员身份核验', '待遇资格认证接口调用', '认证结果返回'],
    relatedAssets: [
      { name: '社保缴费记录查询', dept: '人力资源和社会保障厅', type: '社会保障类' },
      { name: '退休人员身份信息', dept: '人力资源和社会保障厅', type: '社会保障类' },
      { name: '居民身份证电子证照', dept: '公安厅', type: '证照类' }
    ],
    successRate: 96.8,
    useCount30d: 12580,
    satisfaction: 4.8,
    expectedSaveTime: '预计为您节省2个工作日的线下跑动，无需前往社保经办大厅',
    requiredMaterials: [
      { name: '居民身份证电子证照', status: 'auto' },
      { name: '退休人员身份核验', status: 'auto' },
      { name: '人脸识别活体检测', status: 'auto' }
    ],
    complianceStatement: '该推荐符合《个人信息保护法》第24条自动化决策规定，您有权拒绝或关闭推荐'
  },
  {
    key: '2', id: 2, serviceName: '公积金提取申请',
    recommendReason: '根据用户公积金缴存记录和近期购房行为分析',
    recommendSource: '根据《宁夏一网通办事项关联规则v2.3》第15条，办理购房贷款后推荐公积金提取',
    matchTags: ['公积金缴存', '购房记录', '有房'],
    confidence: 88, userAction: 'viewed', recommendTime: '2026-06-15 08:15:00',
    useScene: '购房贷款办理后提取公积金用于偿还贷款本息',
    authChain: ['用户授权', '公积金缴存明细查询', '不动产登记信息核验', '购房贷款信息校验', '提取申请提交'],
    relatedAssets: [
      { name: '公积金缴存余额查询', dept: '住房和城乡建设厅', type: '住房公积金类' },
      { name: '不动产登记信息', dept: '自然资源厅', type: '住房公积金类' },
      { name: '个人纳税记录查询', dept: '税务局', type: '税务类' }
    ],
    successRate: 92.5,
    useCount30d: 8920,
    satisfaction: 4.6,
    expectedSaveTime: '预计为您节省3个工作日的线下跑动，无需前往公积金中心和银行',
    requiredMaterials: [
      { name: '居民身份证电子证照', status: 'auto' },
      { name: '购房合同备案证明', status: 'auto' },
      { name: '贷款还款明细', status: 'upload' },
      { name: '本人银行卡信息', status: 'auto' }
    ],
    complianceStatement: '该推荐符合《个人信息保护法》第24条自动化决策规定，您有权拒绝或关闭推荐'
  },
  {
    key: '3', id: 3, serviceName: '居住证办理',
    recommendReason: '根据用户流动人口登记和社保缴纳满6个月',
    recommendSource: '根据公安厅-住建厅-人社厅数据共享协议(宁数共享〔2026〕第008号)，符合条件流动人口推荐办理居住证',
    matchTags: ['流动人口登记', '社保缴纳>6个月', '非本地户籍'],
    confidence: 92, userAction: 'used', recommendTime: '2026-06-14 16:20:00',
    useScene: '外来务工人员子女入学报名前办理居住证',
    authChain: ['用户授权', '流动人口登记信息查询', '社保缴费记录核验', '居住地址确认', '居住证申请受理'],
    relatedAssets: [
      { name: '流动人口登记信息', dept: '公安厅', type: '证照类' },
      { name: '社保缴费记录查询', dept: '人力资源和社会保障厅', type: '社会保障类' },
      { name: '房屋租赁备案信息', dept: '住房和城乡建设厅', type: '证照类' }
    ],
    successRate: 89.3,
    useCount30d: 5680,
    satisfaction: 4.5,
    expectedSaveTime: '预计为您节省5个工作日的线下跑动，无需前往派出所排队办理',
    requiredMaterials: [
      { name: '居民身份证电子证照', status: 'auto' },
      { name: '流动人口登记凭证', status: 'auto' },
      { name: '房屋租赁合同', status: 'upload' },
      { name: '近期免冠照片', status: 'upload' }
    ],
    complianceStatement: '该推荐符合《个人信息保护法》第24条自动化决策规定，您有权拒绝或关闭推荐'
  },
  {
    key: '4', id: 4, serviceName: '医保异地就医备案',
    recommendReason: '根据用户近期异地就医记录和医保参保状态',
    recommendSource: '您近7天搜索了"异地就医"相关内容5次，查看了医保异地结算页面3次，符合服务推荐触发条件',
    matchTags: ['异地就医', '医保参保', '常住外地'],
    confidence: 85, userAction: 'ignored', recommendTime: '2026-06-14 14:10:00',
    useScene: '退休人员随子女异地居住期间医保就医备案',
    authChain: ['用户授权', '医保参保状态查询', '异地居住信息确认', '备案规则校验', '备案结果生效'],
    relatedAssets: [
      { name: '医保参保状态查询', dept: '医疗保障局', type: '医疗保障类' },
      { name: '医保报销记录查询', dept: '医疗保障局', type: '医疗保障类' },
      { name: '常住地居住信息', dept: '公安厅', type: '证照类' }
    ],
    successRate: 94.2,
    useCount30d: 6840,
    satisfaction: 4.7,
    expectedSaveTime: '预计为您节省4个工作日的线下跑动，无需返回参保地办理备案手续',
    requiredMaterials: [
      { name: '居民身份证电子证照', status: 'auto' },
      { name: '医保电子凭证', status: 'auto' },
      { name: '异地居住证明', status: 'upload' }
    ],
    complianceStatement: '该推荐符合《个人信息保护法》第24条自动化决策规定，您有权拒绝或关闭推荐'
  },
  {
    key: '5', id: 5, serviceName: '子女教育补贴申请',
    recommendReason: '根据用户子女学籍信息和低收入家庭标签',
    recommendSource: '6月为学期末教育补贴申报高峰期，根据教育厅-民政厅-人社厅就业服务专项活动推荐',
    matchTags: ['有子女上学', '低收入', '教育补贴政策'],
    confidence: 90, userAction: 'viewed', recommendTime: '2026-06-14 10:30:00',
    useScene: '义务教育阶段低收入家庭子女教育补贴申请',
    authChain: ['用户授权', '子女学籍信息查询', '低收入家庭身份核验', '补贴资格匹配', '申请提交受理'],
    relatedAssets: [
      { name: '学生学籍信息查询', dept: '教育厅', type: '教育类' },
      { name: '低保家庭信息核验', dept: '民政厅', type: '社会保障类' },
      { name: '社保缴费记录查询', dept: '人力资源和社会保障厅', type: '社会保障类' }
    ],
    successRate: 87.6,
    useCount30d: 3560,
    satisfaction: 4.9,
    expectedSaveTime: '预计为您节省7个工作日的线下跑动，无需往返学校、社区、教育局等多个部门',
    requiredMaterials: [
      { name: '居民身份证电子证照', status: 'auto' },
      { name: '户口簿电子证照', status: 'auto' },
      { name: '子女学籍证明', status: 'auto' },
      { name: '低收入家庭证明', status: 'upload' },
      { name: '家庭收入证明', status: 'upload' }
    ],
    complianceStatement: '该推荐符合《个人信息保护法》第24条自动化决策规定，您有权拒绝或关闭推荐'
  }
]

const DataAssetsOverview: React.FC<DataAssetsOverviewProps> = ({ userView }) => {
  const { userInfo } = useUserStore()
  const currentRole = useMemo(() => {
    const roles = userInfo?.roles || []
    if (roles.includes('超级管理员')) return 'admin'
    if (roles.includes('委办局管理员')) return 'dept_admin'
    if (roles.includes('审计员')) return 'auditor'
    return 'default'
  }, [userInfo?.roles])
  const isDefaultRole = currentRole === 'default'

  const [authModalVisible, setAuthModalVisible] = useState(false)
  const [selectedAuth, setSelectedAuth] = useState<AssetAuthorization | null>(null)
  const [closeRecommendModalVisible, setCloseRecommendModalVisible] = useState(false)
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false)
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationSource | null>(null)
  const [stopRecommendMap, setStopRecommendMap] = useState<Record<string, boolean>>({})

  const defaultActiveKey = useMemo(() => {
    if (isDefaultRole && userView) {
      const map: Record<string, string> = {
        default: 'overview',
        auth: 'authorization',
        recommend: 'recommend',
        trace: 'trace'
      }
      return map[userView] || 'overview'
    }
    return 'overview'
  }, [userView, isDefaultRole])

  const handleRevokeAuth = (record: AssetAuthorization) => {
    Modal.confirm({
      title: '确认撤销授权',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>您即将撤销以下授权：</p>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="资产名称">{record.assetName}</Descriptions.Item>
            <Descriptions.Item label="授权部门">{record.authorizedDept}</Descriptions.Item>
            <Descriptions.Item label="授权用户">{record.authorizedUser}</Descriptions.Item>
            <Descriptions.Item label="授权用途">{record.authPurpose}</Descriptions.Item>
            <Descriptions.Item label="历史调用次数">{record.callCount.toLocaleString()} 次</Descriptions.Item>
          </Descriptions>
          <p style={{ marginTop: 12, color: '#faad14' }}>
            <WarningOutlined /> 撤销后，该部门将无法继续访问您的数据。撤销操作即时生效，不可恢复。
          </p>
        </div>
      ),
      okText: '确认撤销',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        message.success('授权已撤销')
      }
    })
  }

  const handleFeedback = (record: RecommendationSource) => {
    setSelectedRecommendation(record)
    setFeedbackModalVisible(true)
  }

  const handleStopShare = (record: CrossDeptShare) => {
    Modal.confirm({
      title: '申请停止数据共享',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>您即将申请停止以下跨部门数据共享：</p>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="源部门">{record.sourceDept}</Descriptions.Item>
            <Descriptions.Item label="目标部门">{record.targetDept}</Descriptions.Item>
            <Descriptions.Item label="共享数据">{record.assetName}</Descriptions.Item>
            <Descriptions.Item label="共享用途">{record.sharePurpose}</Descriptions.Item>
          </Descriptions>
          <p style={{ marginTop: 12, color: '#666' }}>
            <InfoCircleOutlined /> 申请提交后，数据主管部门将在3个工作日内审核。审核通过后将停止该共享通道。
          </p>
        </div>
      ),
      okText: '提交申请',
      cancelText: '取消',
      onOk: () => {
        message.success('停止共享申请已提交，请等待审核')
      }
    })
  }

  const statsCards = [
    { title: '累计数据资产数', value: 128560, suffix: '项', prefix: <DatabaseOutlined />, color: '#0958d9' },
    { title: '今日新增资产', value: 328, suffix: '项', prefix: <RiseOutlined />, color: '#52c41a' },
    { title: '已授权资产调用次数', value: 89650, suffix: '次', prefix: <ApiOutlined />, color: '#faad14' },
    { title: '资产类型数', value: 7, suffix: '大类', prefix: <AppstoreOutlined />, color: '#722ed1' }
  ]

  const userStatsCards = [
    { title: '我的数据资产', value: 128, suffix: '项', prefix: <DatabaseOutlined />, color: '#0958d9' },
    { title: '已授权部门', value: 6, suffix: '个', prefix: <TeamOutlined />, color: '#52c41a' },
    { title: '近7天被调用', value: 89, suffix: '次', prefix: <ApiOutlined />, color: '#faad14' },
    { title: '待处理事项', value: 2, suffix: '项', prefix: <WarningOutlined />, color: '#ff4d4f' }
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

  const authorizationColumns: ColumnsType<AssetAuthorization> = isDefaultRole ? [
    { title: '资产类型', dataIndex: 'assetType', key: 'assetType', width: 100, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '资产名称', dataIndex: 'assetName', key: 'assetName', width: 180 },
    { title: '授权部门', dataIndex: 'authorizedDept', key: 'authorizedDept', width: 160, render: (d: string) => <Space><BankOutlined style={{ color: '#0958d9' }} />{d}</Space> },
    { title: '授权用途', dataIndex: 'authPurpose', key: 'authPurpose', ellipsis: true },
    { title: '调用次数', dataIndex: 'callCount', key: 'callCount', width: 100, render: (c: number) => <span style={{ fontWeight: 500, color: '#0958d9' }}>{c.toLocaleString()} 次</span> },
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
    { title: '操作', key: 'action', width: 220, fixed: 'right', render: (_, record) => (
      <Space size="small">
        <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedAuth(record); setAuthModalVisible(true); }}>查看授权详情</Button>
        {record.authStatus === 'active' && <Button type="primary" size="small" danger icon={<StopOutlined />} onClick={() => handleRevokeAuth(record)}>撤销授权</Button>}
      </Space>
    )}
  ] : [
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

  const callTraceColumns: ColumnsType<CallTrace> = isDefaultRole ? [
    { title: '调用时间', dataIndex: 'callTime', key: 'callTime', width: 170 },
    { title: '资产类型', dataIndex: 'assetType', key: 'assetType', width: 100, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '资产名称', dataIndex: 'assetName', key: 'assetName', width: 140 },
    { title: '调用方', dataIndex: 'caller', key: 'caller', width: 160, render: (c: string, record) => (
      <Space>
        <Avatar size="small" style={{ backgroundColor: record.callerType === 'system' ? '#722ed1' : record.callerType === 'dept' ? '#52c41a' : '#0958d9' }} icon={<ApiOutlined />} />
        <span style={{ fontWeight: 500 }}>{c}</span>
      </Space>
    )},
    { title: '所属部门', dataIndex: 'callDept', key: 'callDept', width: 160, render: (d: string) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{d}</span> },
    { title: '调用目的', dataIndex: 'callPurpose', key: 'callPurpose', width: 120, render: (p: string) => <Tag color="purple">{p}</Tag> },
    { title: '调用结果', dataIndex: 'callResult', key: 'callResult', width: 80, render: (r: string) => (
      <Badge status={r === 'success' ? 'success' : 'error'} text={r === 'success' ? '成功' : '失败'} />
    )},
    { title: '数据量', dataIndex: 'dataSize', key: 'dataSize', width: 90 }
  ] : [
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

  const crossDeptShareColumns: ColumnsType<CrossDeptShare> = isDefaultRole ? [
    { title: '共享部门', dataIndex: 'targetDept', key: 'targetDept', width: 160, render: (d: string) => (
      <Space><Avatar size="small" style={{ backgroundColor: '#52c41a' }} icon={<TeamOutlined />} /><span style={{ fontWeight: 500 }}>{d}</span></Space>
    )},
    { title: '数据来源', dataIndex: 'sourceDept', key: 'sourceDept', width: 160, render: (d: string) => (
      <Space><Avatar size="small" style={{ backgroundColor: '#0958d9' }} icon={<BankOutlined />} />{d}</Space>
    )},
    { title: '资产类型', dataIndex: 'assetType', key: 'assetType', width: 100, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '共享数据', dataIndex: 'assetName', key: 'assetName', width: 160 },
    { title: '共享用途', dataIndex: 'sharePurpose', key: 'sharePurpose', ellipsis: true },
    { title: '共享状态', dataIndex: 'shareStatus', key: 'shareStatus', width: 100, render: (s: string) => {
      const map: Record<string, { color: string; text: string }> = {
        active: { color: 'green', text: '正常共享' },
        suspended: { color: 'orange', text: '已暂停' },
        terminated: { color: 'red', text: '已终止' }
      }
      return <Tag color={map[s]?.color}>{map[s]?.text}</Tag>
    }},
    { title: '操作', key: 'action', width: 150, render: (_, record) => (
      record.shareStatus === 'active' && <Button type="primary" size="small" danger icon={<StopOutlined />} onClick={() => handleStopShare(record)}>申请停止共享</Button>
    )}
  ] : [
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

  const recommendationColumns: ColumnsType<RecommendationSource> = isDefaultRole ? [
    { title: '服务名称', dataIndex: 'serviceName', key: 'serviceName', width: 170, fixed: 'left', render: (s: string) => <span style={{ fontWeight: 500 }}>{s}</span> },
    { title: '使用场景', dataIndex: 'useScene', key: 'useScene', width: 200, ellipsis: true, render: (s: string) => (
      <Tag color="purple">{s}</Tag>
    )},
    { title: '推荐来源说明', dataIndex: 'recommendSource', key: 'recommendSource', width: 320, ellipsis: true },
    { title: '匹配标签', dataIndex: 'matchTags', key: 'matchTags', width: 200, render: (tags: string[]) => (
      <Space wrap>{tags.map((tag, i) => <Tag key={i} color="blue">{tag}</Tag>)}</Space>
    )},
    { title: '置信度', dataIndex: 'confidence', key: 'confidence', width: 120, render: (c: number) => (
      <Progress percent={c} size="small" strokeColor={c >= 90 ? '#52c41a' : c >= 80 ? '#faad14' : '#ff4d4f'} />
    )},
    { title: '推荐时间', dataIndex: 'recommendTime', key: 'recommendTime', width: 170 },
    { title: '操作', key: 'action', width: 280, fixed: 'right', render: (_, record) => (
      <Space size="small">
        <Button size="small" icon={<FrownOutlined />} onClick={() => handleFeedback(record)}>对此推荐不满意</Button>
        <Switch
          size="small"
          checked={stopRecommendMap[record.key] || false}
          onChange={(checked) => {
            setStopRecommendMap(prev => ({ ...prev, [record.key]: checked }))
            if (checked) {
              message.success(`已停止接收「${record.serviceName}」类推荐`)
            }
          }}
          checkedChildren="停止"
          unCheckedChildren="接收"
        />
      </Space>
    )}
  ] : [
    { title: '服务名称', dataIndex: 'serviceName', key: 'serviceName', width: 170, fixed: 'left' },
    { title: '使用场景', dataIndex: 'useScene', key: 'useScene', width: 200, ellipsis: true, render: (s: string) => (
      <Tag color="purple">{s}</Tag>
    )},
    { title: '推荐来源说明', dataIndex: 'recommendSource', key: 'recommendSource', width: 320, ellipsis: true },
    { title: '业务办理成功率', dataIndex: 'successRate', key: 'successRate', width: 150, render: (r: number) => (
      <Progress percent={r} size="small" strokeColor={r >= 95 ? '#52c41a' : r >= 85 ? '#faad14' : '#ff4d4f'} format={(p) => `${p}%`} />
    )},
    { title: '近30天使用', dataIndex: 'useCount30d', key: 'useCount30d', width: 120, render: (c: number) => (
      <span style={{ fontWeight: 500, color: '#0958d9' }}>{c.toLocaleString()} 次</span>
    )},
    { title: '满意度', dataIndex: 'satisfaction', key: 'satisfaction', width: 110, render: (s: number) => (
      <Space size={4}>
        <span style={{ color: '#faad14', fontWeight: 500 }}>{'★'.repeat(Math.floor(s))}</span>
        <span style={{ color: '#ccc' }}>{'★'.repeat(5 - Math.floor(s))}</span>
        <span style={{ fontSize: 12, color: '#666' }}>{s.toFixed(1)}</span>
      </Space>
    )},
    { title: '匹配标签', dataIndex: 'matchTags', key: 'matchTags', width: 200, render: (tags: string[]) => (
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

  const overviewContent = isDefaultRole ? (
    <div>
      <Alert
        message="我的数据资产"
        description="这里展示您名下的所有个人数据资产。所有数据均受《个人信息保护法》保护，您可以随时查看、授权或撤销授权。"
        type="success"
        showIcon
        icon={<SafetyOutlined />}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {userStatsCards.map((item, index) => (
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
      <Card title={<Space><DatabaseOutlined />我的数据资产清单</Space>} style={{ marginBottom: 16 }}>
        <List
          dataSource={[
            { name: '社会保障类', source: '人力资源社会保障厅', frequency: '实时同步', lastUpdate: '2026-06-16 08:30', status: '正常', icon: <SafetyOutlined style={{ fontSize: 24, color: '#52c41a' }} /> },
            { name: '住房公积金类', source: '住房和城乡建设厅', frequency: '每日同步', lastUpdate: '2026-06-16 02:00', status: '正常', icon: <HomeOutlined style={{ fontSize: 24, color: '#faad14' }} /> },
            { name: '医疗保障类', source: '医疗保障局', frequency: '实时同步', lastUpdate: '2026-06-16 08:15', status: '正常', icon: <MedicineBoxOutlined style={{ fontSize: 24, color: '#eb2f96' }} /> },
            { name: '税务类', source: '税务局', frequency: '每日同步', lastUpdate: '2026-06-15 23:30', status: '待更新', icon: <AuditOutlined style={{ fontSize: 24, color: '#13c2c2' }} /> },
            { name: '证照类', source: '公安厅', frequency: '实时同步', lastUpdate: '2026-06-16 07:45', status: '正常', icon: <FileTextOutlined style={{ fontSize: 24, color: '#0958d9' }} /> },
            { name: '教育类', source: '教育厅', frequency: '每周同步', lastUpdate: '2026-06-10 03:00', status: '正常', icon: <ReadOutlined style={{ fontSize: 24, color: '#722ed1' }} /> },
            { name: '交通出行类', source: '交通运输厅', frequency: '每小时同步', lastUpdate: '2026-06-16 08:00', status: '正常', icon: <CarOutlined style={{ fontSize: 24, color: '#fa541c' }} /> }
          ]}
          renderItem={(item) => (
            <List.Item key={item.name}>
              <List.Item.Meta
                avatar={item.icon}
                title={<Space size={12}><span style={{ fontWeight: 500, fontSize: 15 }}>{item.name}</span><Tag color={item.status === '正常' ? 'green' : 'orange'}>{item.status}</Tag></Space>}
                description={
                  <Space size={24} wrap style={{ marginTop: 4 }}>
                    <span style={{ color: '#666' }}><SafetyOutlined style={{ marginRight: 4, color: '#999' }} />数据来源机构：{item.source}</span>
                    <span style={{ color: '#666' }}><SyncOutlined style={{ marginRight: 4, color: '#999' }} />更新频率：{item.frequency}</span>
                    <span style={{ color: '#666' }}><ClockCircleOutlined style={{ marginRight: 4, color: '#999' }} />最近更新：{item.lastUpdate}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
      <Card title="我的数据资产类型" style={{ marginBottom: 16 }}>
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
      <Alert
        message="数据安全提示"
        description="您的数据安全是我们的首要责任。所有数据访问均需您的明确授权，访问记录全程留痕可追溯。如发现异常调用，请立即联系客服。"
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        style={{ borderRadius: 8 }}
      />
    </div>
  ) : (
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
      <Card title={<Space><DatabaseOutlined />个人数据资产全景</Space>} style={{ marginBottom: 16 }}>
        <List
          dataSource={[
            { name: '社会保障类', source: '人力资源社会保障厅', frequency: '实时同步', lastUpdate: '2026-06-16 08:30', status: '正常', icon: <SafetyOutlined style={{ fontSize: 24, color: '#52c41a' }} /> },
            { name: '住房公积金类', source: '住房和城乡建设厅', frequency: '每日同步', lastUpdate: '2026-06-16 02:00', status: '正常', icon: <HomeOutlined style={{ fontSize: 24, color: '#faad14' }} /> },
            { name: '医疗保障类', source: '医疗保障局', frequency: '实时同步', lastUpdate: '2026-06-16 08:15', status: '正常', icon: <MedicineBoxOutlined style={{ fontSize: 24, color: '#eb2f96' }} /> },
            { name: '税务类', source: '税务局', frequency: '每日同步', lastUpdate: '2026-06-15 23:30', status: '待更新', icon: <AuditOutlined style={{ fontSize: 24, color: '#13c2c2' }} /> },
            { name: '证照类', source: '公安厅', frequency: '实时同步', lastUpdate: '2026-06-16 07:45', status: '正常', icon: <FileTextOutlined style={{ fontSize: 24, color: '#722ed1' }} /> },
            { name: '教育类', source: '教育厅', frequency: '每周同步', lastUpdate: '2026-06-10 00:00', status: '正常', icon: <ReadOutlined style={{ fontSize: 24, color: '#1890ff' }} /> },
            { name: '交通类', source: '交通运输厅', frequency: '每日同步', lastUpdate: '2026-06-16 06:00', status: '正常', icon: <CarOutlined style={{ fontSize: 24, color: '#13c2c2' }} /> }
          ]}
          renderItem={(item: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={item.icon}
                title={item.name}
                description={
                  <Space wrap size="small">
                    <Text type="secondary" style={{ fontSize: 12 }}>来源：{item.source}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>频率：{item.frequency}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>更新：{item.lastUpdate}</Text>
                    <Tag color={item.status === '正常' ? 'green' : 'orange'} style={{ margin: 0 }}>{item.status}</Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )

  const tabItems: TabsProps['items'] = [
    {
      key: 'overview',
      label: <Space><DatabaseOutlined />资产总览</Space>,
      children: overviewContent
    },
    {
      key: 'authorization',
      label: <Space><KeyOutlined />授权链路</Space>,
      children: (
        <Card
          title={<Space><KeyOutlined />数据授权记录</Space>}
          extra={<Button type="primary" icon={<PlusOutlined />}>新增授权申请</Button>}
        >
          <Table
            rowKey="key"
            columns={authorizationColumns}
            dataSource={assetAuthorizations}
            pagination={{ pageSize: 6 }}
            scroll={{ x: 1100 }}
          />
        </Card>
      )
    },
    {
      key: 'trace',
      label: <Space><HistoryOutlined />调用足迹</Space>,
      children: (
        <Card title={<Space><HistoryOutlined />数据调用留痕</Space>}>
          <Table
            rowKey="key"
            columns={callTraceColumns}
            dataSource={callTraces}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 1100 }}
          />
        </Card>
      )
    },
    {
      key: 'share',
      label: <Space><ShareAltOutlined />跨部门共享</Space>,
      children: (
        <Card title={<Space><ShareAltOutlined />跨部门共享链路</Space>}>
          <Table
            rowKey="key"
            columns={crossDeptShareColumns}
            dataSource={crossDeptShares}
            pagination={{ pageSize: 6 }}
            scroll={{ x: 1100 }}
          />
        </Card>
      )
    },
    {
      key: 'recommend',
      label: <Space><RiseOutlined />服务推荐</Space>,
      children: (
        <Card title={<Space><RiseOutlined />推荐来源与效果追溯</Space>}>
          <Table
            rowKey="key"
            columns={recommendationColumns}
            dataSource={recommendationSources}
            pagination={{ pageSize: 6 }}
            scroll={{ x: 1300 }}
          />
        </Card>
      )
    }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={<Space><RiseOutlined />资产增长趋势</Space>}>
            <ReactECharts option={growthTrendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<Space><AppstoreOutlined />资产类型与部门排行</Space>}>
            <ReactECharts option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      {!isDefaultRole && (
        <Card title={<Space><BankOutlined />委办局数据提供量排行</Space>} style={{ marginBottom: 16 }}>
          <ReactECharts option={deptRankingOption} style={{ height: 320 }} />
        </Card>
      )}

      <Tabs defaultActiveKey={defaultActiveKey} items={tabItems} />

      <Modal
        title="授权详情"
        open={authModalVisible}
        onCancel={() => setAuthModalVisible(false)}
        footer={<Button onClick={() => setAuthModalVisible(false)}>关闭</Button>}
        width={760}
      >
        {selectedAuth && (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="资产名称">{selectedAuth.assetName}</Descriptions.Item>
            <Descriptions.Item label="资产类型">{selectedAuth.assetType}</Descriptions.Item>
            <Descriptions.Item label="授权部门">{selectedAuth.authorizedDept}</Descriptions.Item>
            <Descriptions.Item label="授权用户">{selectedAuth.authorizedUser}</Descriptions.Item>
            <Descriptions.Item label="授权用途">{selectedAuth.authPurpose}</Descriptions.Item>
            <Descriptions.Item label="授权范围">{selectedAuth.authScope}</Descriptions.Item>
            <Descriptions.Item label="授权状态">
              <Tag color={getAuthStatusColor(selectedAuth.authStatus)}>{selectedAuth.authStatus}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="有效期">{selectedAuth.grantTime} 至 {selectedAuth.expireTime}</Descriptions.Item>
            <Descriptions.Item label="调用次数">{selectedAuth.callCount.toLocaleString()} 次</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title="推荐反馈"
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        onOk={() => {
          message.success('推荐反馈已提交')
          setFeedbackModalVisible(false)
        }}
        okText="提交反馈"
        cancelText="取消"
      >
        {selectedRecommendation && (
          <Form layout="vertical">
            <Form.Item label="推荐服务">
              <Input value={selectedRecommendation.serviceName} readOnly />
            </Form.Item>
            <Form.Item label="不满意原因">
              <Select defaultValue="not_match">
                <Option value="not_match">与当前需求不匹配</Option>
                <Option value="already_done">事项已办理</Option>
                <Option value="privacy">不希望使用该类数据推荐</Option>
              </Select>
            </Form.Item>
            <Form.Item label="期望处理时间">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="补充说明">
              <TextArea rows={4} placeholder="请补充说明您的反馈意见" />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="关闭推荐确认"
        open={closeRecommendModalVisible}
        onCancel={() => setCloseRecommendModalVisible(false)}
        onOk={() => setCloseRecommendModalVisible(false)}
        okText="确认关闭"
        cancelText="取消"
      >
        <Alert
          type="warning"
          showIcon
          message="关闭后将停止接收同类推荐"
          description="您仍可在授权管理中重新开启相关数据资产的推荐服务。"
        />
      </Modal>

      <Card title={<Space><CheckCircleOutlined />数据治理流程</Space>} style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Steps
              direction="vertical"
              size="small"
              current={2}
              items={[
                { title: '用户授权', description: '明确授权范围、用途和有效期' },
                { title: '跨部门共享', description: '按授权链路调用数据资产' },
                { title: '推荐生成', description: '输出服务推荐和证照提醒' },
                { title: '留痕审计', description: '调用、反馈、撤销全流程可追溯' }
              ]}
            />
          </Col>
          <Col xs={24} lg={12}>
            <Timeline
              items={[
                { color: 'green', children: '09:20 推荐模型完成离线评估' },
                { color: 'blue', children: '09:05 用户标签批处理成功' },
                { color: 'orange', children: '08:39 证照提醒队列正常投递' }
              ]}
            />
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default DataAssetsOverview
