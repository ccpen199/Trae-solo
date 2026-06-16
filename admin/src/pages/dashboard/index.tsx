import React, { useMemo, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  List,
  Avatar,
  Button,
  Space,
  Badge,
  Table,
  Drawer,
  Modal,
  Tabs,
  Form,
  Input,
  Descriptions,
  Timeline,
  Divider,
  Steps,
  Radio,
  Checkbox,
  Select,
  DatePicker
} from 'antd'
import {
  AppstoreOutlined,
  FileTextOutlined,
  CustomerServiceOutlined,
  AuditOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FallOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileDoneOutlined,
  FundOutlined,
  ReadOutlined,
  StarOutlined,
  DatabaseOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  DesktopOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  RedoOutlined,
  SendOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/user'
import './style.css'

const { Title, Text } = Typography

const Dashboard: React.FC = () => {
  const { userInfo } = useUserStore()
  const navigate = useNavigate()

  const [quickServiceVisible, setQuickServiceVisible] = useState(false)
  const [messageCenterVisible, setMessageCenterVisible] = useState(false)
  const [todoDetailVisible, setTodoDetailVisible] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState<any>(null)
  const [applyModalVisible, setApplyModalVisible] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [applyForm] = Form.useForm()
  const [applyStep, setApplyStep] = useState(0)
  const [selectedServiceItem, setSelectedServiceItem] = useState<any>(null)
  const [guideAnswers, setGuideAnswers] = useState<Record<number, string>>({})
  const [exportAuditModalVisible, setExportAuditModalVisible] = useState(false)
  const [reviewScopeChecked, setReviewScopeChecked] = useState<string[]>(['login', 'approval', 'data', 'config'])

  const today = dayjs().format('YYYY年MM月DD日 dddd')
  const greeting = useMemo(() => {
    const hour = dayjs().hour()
    if (hour < 6) return '凌晨好'
    if (hour < 12) return '早上好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  }, [])

  const currentRole = useMemo(() => {
    const roles = userInfo?.roles || []
    if (roles.includes('超级管理员')) return 'admin'
    if (roles.includes('委办局管理员')) return 'dept_admin'
    if (roles.includes('窗口办事员')) return 'clerk'
    if (roles.includes('审计员')) return 'auditor'
    return 'default'
  }, [userInfo?.roles])

  const roleConfig: Record<string, { title: string; tagColor: string; tagText: string; desc: string }> = {
    admin: { title: '管理总控台', tagColor: 'blue', tagText: '超级管理员', desc: '全局管理 · 系统配置 · 数据总览' },
    dept_admin: { title: '部门工作台', tagColor: 'green', tagText: '委办局管理员', desc: '本部门待办 · 事项审批 · 数据查看' },
    clerk: { title: '窗口服务台', tagColor: 'orange', tagText: '窗口办事员', desc: '办件处理 · 证照核验 · 工单受理' },
    auditor: { title: '合规审计台', tagColor: 'purple', tagText: '审计员', desc: '审计告警 · 操作追溯 · 合规验收' },
    default: { title: '工作台', tagColor: 'default', tagText: '普通用户', desc: '服务查看 · 信息查询' }
  }

  const currentRoleConfig = roleConfig[currentRole]

  const roleQuickEntries: Record<string, { key: string; icon: React.ReactNode; title: string; desc: string; color: string }[]> = {
    admin: [
      { key: 'services', icon: <AppstoreOutlined />, title: '事项管理', desc: '政务服务事项配置', color: '#0958d9' },
      { key: 'certificates', icon: <SafetyCertificateOutlined />, title: '证照库', desc: '电子证照管理', color: '#52c41a' },
      { key: 'tickets', icon: <CustomerServiceOutlined />, title: '工单处理', desc: '12345工单办理', color: '#faad14' },
      { key: 'audit-logs', icon: <AuditOutlined />, title: '审计查询', desc: '操作审计追溯', color: '#722ed1' },
      { key: 'departments', icon: <BankOutlined />, title: '委办局接入', desc: '部门系统对接', color: '#13c2c2' }
    ],
    dept_admin: [
      { key: 'services', icon: <AppstoreOutlined />, title: '本部门事项', desc: '部门事项管理', color: '#0958d9' },
      { key: 'tickets', icon: <CustomerServiceOutlined />, title: '工单处理', desc: '部门工单办理', color: '#faad14' },
      { key: 'certificates', icon: <SafetyCertificateOutlined />, title: '证照审核', desc: '电子证照核验', color: '#52c41a' },
      { key: 'audit-logs', icon: <AuditOutlined />, title: '操作记录', desc: '本部门操作日志', color: '#722ed1' }
    ],
    clerk: [
      { key: 'ticket-handle', icon: <FileTextOutlined />, title: '办件处理', desc: '当前窗口办件', color: '#faad14' },
      { key: 'certificate-verify', icon: <SafetyCertificateOutlined />, title: '证照核验', desc: '电子证照核验', color: '#52c41a' },
      { key: 'ticket-create', icon: <CustomerServiceOutlined />, title: '工单受理', desc: '12345工单受理', color: '#0958d9' }
    ],
    auditor: [
      { key: 'audit-logs', icon: <AuditOutlined />, title: '审计日志', desc: '全量操作审计', color: '#722ed1' },
      { key: 'compliance', icon: <SafetyOutlined />, title: '合规验收', desc: '合规性检查', color: '#0958d9' },
      { key: 'alert-center', icon: <WarningOutlined />, title: '告警中心', desc: '异常操作告警', color: '#ff4d4f' },
      { key: 'data-export', icon: <ExportOutlined />, title: '审计导出', desc: '审计数据导出', color: '#52c41a' }
    ],
    default: [
      { key: 'services', icon: <AppstoreOutlined />, title: '服务查询', desc: '政务服务查询', color: '#0958d9' },
      { key: 'certificates', icon: <SafetyCertificateOutlined />, title: '证照查询', desc: '电子证照查看', color: '#52c41a' }
    ]
  }

  const auditTrailData = [
    { key: '1', time: '2024-12-15 14:32:18', operator: '自治区管理员', type: '登录', content: '账号密码登录系统', ip: '192.168.1.100' },
    { key: '2', time: '2024-12-15 14:15:06', operator: '部门管理员', type: '审批', content: '审批通过社保缴费证明开具事项', ip: '10.0.5.23' },
    { key: '3', time: '2024-12-15 13:48:22', operator: '窗口办事员', type: '数据导出', content: '导出本日办件统计报表', ip: '172.16.8.45' },
    { key: '4', time: '2024-12-15 11:20:35', operator: '自治区管理员', type: '配置修改', content: '修改身份证办理事项审批流程', ip: '192.168.1.100' },
    { key: '5', time: '2024-12-15 10:55:42', operator: '审计专员', type: '登录', content: '宁夏政务SSO登录系统', ip: '10.0.5.88' },
    { key: '6', time: '2024-12-15 09:30:11', operator: '自治区管理员', type: '权限变更', content: '调整人力资源社会保障厅数据查看权限', ip: '192.168.1.100' },
    { key: '7', time: '2024-12-14 17:45:29', operator: '部门管理员', type: '删除', content: '删除过期临时文件3份', ip: '172.16.8.12' },
    { key: '8', time: '2024-12-14 16:22:07', operator: '窗口办事员', type: '审批', content: '审批通过营业执照变更申请', ip: '192.168.10.56' },
    { key: '9', time: '2024-12-14 15:08:33', operator: '审计专员', type: '数据导出', content: '导出90天审计日志报告', ip: '10.0.5.88' },
    { key: '10', time: '2024-12-14 14:01:18', operator: '自治区管理员', type: '配置修改', content: '更新系统安全策略配置', ip: '192.168.1.100' }
  ]

  const auditTrailColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 180 },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 120 },
    {
      title: '操作类型', dataIndex: 'type', key: 'type', width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          '登录': 'blue', '数据导出': 'cyan', '权限变更': 'orange',
          '审批': 'green', '删除': 'red', '配置修改': 'purple'
        }
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>
      }
    },
    { title: '操作内容', dataIndex: 'content', key: 'content' },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 140 }
  ]

  const routeMap: Record<string, string> = {
    'services': '/services',
    'certificates': '/certificates',
    'tickets': '/tickets',
    'audit-logs': '/audit-logs',
    'departments': '/departments',
    'ticket-handle': '/tickets',
    'certificate-verify': '/certificates',
    'ticket-create': '/tickets',
    'compliance': '/audit-logs',
    'alert-center': '/audit-logs',
    'data-export': '/audit-logs'
  }

  const hotServices = [
    { id: 1, title: '身份证办理', desc: '补办、换领、首次申领', timeLimit: '7个工作日', fee: '20元', count: 12580, hot: true },
    { id: 2, title: '社保查询', desc: '养老保险、医疗保险查询', timeLimit: '即办', fee: '免费', count: 9860, hot: true },
    { id: 3, title: '公积金提取', desc: '购房、租房、退休提取', timeLimit: '3个工作日', fee: '免费', count: 7650, hot: false },
    { id: 4, title: '营业执照办理', desc: '个体工商户、公司注册', timeLimit: '5个工作日', fee: '免费', count: 5420, hot: false },
    { id: 5, title: '医保报销', desc: '门诊、住院费用报销', timeLimit: '15个工作日', fee: '免费', count: 4890, hot: false },
    { id: 6, title: '不动产登记', desc: '房产证办理、抵押登记', timeLimit: '5个工作日', fee: '80元', count: 3560, hot: false }
  ]

  const systemMessages = [
    { key: '1', title: '关于2024年政务服务能力提升培训的通知', content: '各委办局：为提升政务服务能力，定于2024年1月20日举办政务服务能力提升培训班，请各单位派人参训。', time: '今天 09:30', type: '通知', read: false },
    { key: '2', title: '系统升级维护公告（本周五晚）', content: '为优化系统性能，定于2024年1月19日22:00-次日06:00进行系统升级维护，期间部分功能将暂停使用。', time: '昨天 16:45', type: '公告', read: false },
    { key: '3', title: '一季度政务服务质量考核结果通报', content: '现将2024年一季度政务服务质量考核结果通报如下，请各单位针对问题进行整改。', time: '3天前', type: '通报', read: true },
    { key: '4', title: '新版电子证照系统上线试运行通知', content: '新版电子证照系统将于2024年1月25日上线试运行，请各单位组织学习新系统操作。', time: '5天前', type: '通知', read: true },
    { key: '5', title: '关于加强数据安全管理的通知', content: '根据等保三级要求，各单位需加强数据安全管理，落实数据访问审批制度。', time: '7天前', type: '通知', read: true }
  ]

  const ticketReminders = [
    { key: '1', title: '身份证办理审核通过', content: '您申请的身份证补办已审核通过，预计7个工作日内完成制证。', time: '2小时前', type: '审核通过', status: 'success' },
    { key: '2', title: '营业执照变更需补正材料', content: '您提交的营业执照变更申请缺少公司章程，请于3个工作日内补正。', time: '4小时前', type: '材料补正', status: 'warning' },
    { key: '3', title: '社保缴费证明即将到期', content: '您开具的社保缴费证明将于2024年1月25日到期，请及时使用或重新开具。', time: '1天前', type: '即将到期', status: 'warning' }
  ]

  const auditAlerts = [
    { key: '1', title: '异常登录告警', content: '检测到账号admin在IP 10.0.5.88的非信任设备登录，请确认是否为本人操作。', time: '今天 08:15', type: '异常登录', level: 'high' },
    { key: '2', title: '批量数据导出告警', content: '账号clerk于今日07:30批量导出数据1258条，请核查导出用途。', time: '今天 07:35', type: '数据导出', level: 'medium' },
    { key: '3', title: '权限变更告警', content: '账号admin为dept_admin用户添加了"系统配置"权限，请复核权限变更的必要性。', time: '昨天 15:20', type: '权限变更', level: 'medium' }
  ]

  const handleNavigateTo = (key: string) => {
    const route = routeMap[key]
    if (route) {
      navigate(route)
    } else {
      navigate('/dashboard')
    }
  }

  const handleOpenTodoDetail = (item: any) => {
    setSelectedTodo(item)
    setTodoDetailVisible(true)
  }

  const handleApplyService = (service: any) => {
    setSelectedService(service)
    setApplyModalVisible(true)
  }

  const handleSubmitApply = () => {
    applyForm.validateFields().then(() => {
      Modal.success({
        title: '申请提交成功',
        content: `您已成功提交「${selectedService?.title}」申请，申请编号：${'NX' + Date.now().toString().slice(-8)}`,
        onOk: () => {
          setApplyModalVisible(false)
          applyForm.resetFields()
        }
      })
    })
  }

  const handleTodoAction = (action: string) => {
    Modal.confirm({
      title: `确认${action}？`,
      content: `您确定要${action}「${selectedTodo?.title}」吗？`,
      onOk: () => {
        setTodoDetailVisible(false)
      }
    })
  }

  const lineChartOption = {
    title: {
      text: '近7天办件量趋势',
      left: 'left',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#1f1f1f' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f1f1f' }
    },
    legend: {
      data: ['受理量', '办结量', '在办量'],
      right: 0,
      top: 0,
      icon: 'circle'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280' }
    },
    series: [
      {
        name: '受理量',
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 90, 230, 210],
        itemStyle: { color: '#0958d9' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(9, 88, 217, 0.25)' },
              { offset: 1, color: 'rgba(9, 88, 217, 0.02)' }
            ]
          }
        }
      },
      {
        name: '办结量',
        type: 'line',
        smooth: true,
        data: [100, 120, 90, 120, 80, 200, 190],
        itemStyle: { color: '#52c41a' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82, 196, 26, 0.25)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.02)' }
            ]
          }
        }
      },
      {
        name: '在办量',
        type: 'line',
        smooth: true,
        data: [20, 12, 11, 14, 10, 30, 20],
        itemStyle: { color: '#faad14' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(250, 173, 20, 0.25)' },
              { offset: 1, color: 'rgba(250, 173, 20, 0.02)' }
            ]
          }
        }
      }
    ]
  }

  const barChartOption = {
    title: {
      text: '委办局办件量排名 Top10',
      left: 'left',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#1f1f1f' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f1f1f' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280' }
    },
    yAxis: {
      type: 'category',
      data: [
        '自然资源厅',
        '市场监管厅',
        '公安厅',
        '住房城乡建设厅',
        '人力资源社会保障厅',
        '卫生健康委',
        '教育厅',
        '税务局',
        '民政厅',
        '交通运输厅'
      ].reverse(),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 12 }
    },
    series: [
      {
        name: '办件量',
        type: 'bar',
        data: [320, 450, 580, 620, 680, 720, 780, 850, 920, 1048].reverse(),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#0958d9' },
              { offset: 1, color: '#4096ff' }
            ]
          },
          borderRadius: [0, 4, 4, 0]
        },
        barWidth: 16
      }
    ]
  }

  const pieChartOption = {
    title: {
      text: '12345工单类型分布',
      left: 'left',
      textStyle: { fontSize: 15, fontWeight: 600, color: '#1f1f1f' }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f1f1f' }
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      icon: 'circle'
    },
    series: [
      {
        name: '工单数量',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold',
            formatter: '{b}\n{c}件'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 450, name: '投诉', itemStyle: { color: '#ff4d4f' } },
          { value: 320, name: '建议', itemStyle: { color: '#1890ff' } },
          { value: 580, name: '咨询', itemStyle: { color: '#52c41a' } },
          { value: 260, name: '求助', itemStyle: { color: '#faad14' } },
          { value: 120, name: '表扬', itemStyle: { color: '#722ed1' } }
        ]
      }
    ]
  }

  const todoList = [
    { id: 1, title: '关于优化营商环境的提案', type: '投诉工单', time: '10分钟前', priority: 'high' },
    { id: 2, title: '身份证办理进度查询', type: '咨询工单', time: '30分钟前', priority: 'medium' },
    { id: 3, title: '营业执照变更申请', type: '办件事项', time: '1小时前', priority: 'normal' },
    { id: 4, title: '社保缴费证明打印', type: '办件事项', time: '2小时前', priority: 'normal' },
    { id: 5, title: '社区便民服务中心建设建议', type: '建议工单', time: '3小时前', priority: 'low' }
  ]

  const noticeList = [
    { id: 1, title: '关于2024年政务服务能力提升培训的通知', time: '今天 09:30', type: '通知' },
    { id: 2, title: '系统升级维护公告（本周五晚）', time: '昨天 16:45', type: '公告' },
    { id: 3, title: '一季度政务服务质量考核结果通报', time: '3天前', type: '通报' },
    { id: 4, title: '新版电子证照系统上线试运行通知', time: '5天前', type: '通知' }
  ]

  const dataAssets = [
    { name: '社保', icon: <FundOutlined />, count: '1,258万', color: '#0958d9' },
    { name: '公积金', icon: <BankOutlined />, count: '896万', color: '#52c41a' },
    { name: '医保', icon: <SafetyCertificateOutlined />, count: '1,432万', color: '#eb2f96' },
    { name: '税务', icon: <FileTextOutlined />, count: '768万', color: '#fa8c16' },
    { name: '证照', icon: <FileDoneOutlined />, count: '3,256万', color: '#722ed1' },
    { name: '教育', icon: <ReadOutlined />, count: '520万', color: '#13c2c2' },
    { name: '交通', icon: <ThunderboltOutlined />, count: '680万', color: '#1890ff' }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red'
      case 'medium':
        return 'orange'
      case 'low':
        return 'green'
      default:
        return 'default'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '紧急'
      case 'medium':
        return '重要'
      case 'low':
        return '普通'
      default:
        return '一般'
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="welcome-section">
          <div className="welcome-text">
            <Title level={3} className="welcome-title">
              {greeting}，{userInfo?.name || '管理员'}
              <Tag color={currentRoleConfig.tagColor} className="role-tag">
                {currentRoleConfig.tagText}
              </Tag>
            </Title>
            <Text type="secondary" className="welcome-date">
              <ClockCircleOutlined /> {today} · {currentRoleConfig.title} · {currentRoleConfig.desc}
            </Text>
          </div>
        </div>
        <div className="quick-actions">
          <Space size="small">
            <Button icon={<BellOutlined />} onClick={() => setMessageCenterVisible(true)}>
              消息中心 <Badge count={5} size="small" style={{ marginLeft: 4 }} />
            </Button>
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => setQuickServiceVisible(true)}>
              快速办件
            </Button>
          </Space>
        </div>
      </div>

      {currentRole === 'dept_admin' && (
        <Card bordered={false} style={{ marginBottom: 16, background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ marginBottom: 4 }}>
                <BankOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                本部门待办 · 人力资源社会保障厅
              </Title>
              <Text type="secondary">本部门当前共有 <Text strong style={{ color: '#faad14' }}>12</Text> 条待办事项需要处理</Text>
            </div>
            <Space>
              <Tag color="orange">待审批 5</Tag>
              <Tag color="blue">待审核 4</Tag>
              <Tag color="green">已办结 3</Tag>
            </Space>
          </div>
        </Card>
      )}

      {currentRole === 'clerk' && (
        <Card bordered={false} style={{ marginBottom: 16, background: 'linear-gradient(135deg, #fff7e6 0%, #fff1f0 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ marginBottom: 4 }}>
                <FileTextOutlined style={{ color: '#faad14', marginRight: 8 }} />
                办件处理 · 窗口3号
              </Title>
              <Text type="secondary">当前窗口等待办理 <Text strong style={{ color: '#ff4d4f' }}>8</Text> 件，请及时处理</Text>
            </div>
            <Space>
              <Tag color="red">紧急 2</Tag>
              <Tag color="orange">一般 4</Tag>
              <Tag color="green">低优 2</Tag>
            </Space>
          </div>
        </Card>
      )}

      {currentRole === 'auditor' && (
        <Card bordered={false} style={{ marginBottom: 16, background: 'linear-gradient(135deg, #f9f0ff 0%, #e6f7ff 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ marginBottom: 4 }}>
                <WarningOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                审计告警 · 近7天
              </Title>
              <Text type="secondary">发现 <Text strong style={{ color: '#ff4d4f' }}>3</Text> 条高风险操作需要审核，<Text strong style={{ color: '#faad14' }}>7</Text> 条中风险待确认</Text>
            </div>
            <Space>
              <Tag color="red">高风险 3</Tag>
              <Tag color="orange">中风险 7</Tag>
              <Tag color="green">低风险 13</Tag>
            </Space>
          </div>
        </Card>
      )}

      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-1" bordered={false}>
            <div className="stat-card-header">
              <div className="stat-info">
                <Text type="secondary" className="stat-title">
                  今日办件量
                </Text>
                <div className="stat-value">
                  <span className="stat-number">128</span>
                  <span className="stat-unit">件</span>
                </div>
              </div>
              <div className="stat-icon">
                <AppstoreOutlined />
              </div>
            </div>
            <div className="stat-detail">
              <div className="detail-item">
                <Text type="secondary">受理</Text>
                <Text strong className="detail-value">
                  156
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">办结</Text>
                <Text strong className="detail-value success">
                  105
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">在办</Text>
                <Text strong className="detail-value warning">
                  23
                </Text>
              </div>
            </div>
            <div className="stat-trend">
              <span className="trend-up">
                <RiseOutlined /> 较昨日 +12.5%
              </span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-2" bordered={false}>
            <div className="stat-card-header">
              <div className="stat-info">
                <Text type="secondary" className="stat-title">
                  电子证照调用量
                </Text>
                <div className="stat-value">
                  <span className="stat-number">3,846</span>
                  <span className="stat-unit">次</span>
                </div>
              </div>
              <div className="stat-icon">
                <SafetyCertificateOutlined />
              </div>
            </div>
            <div className="stat-detail">
              <div className="detail-item">
                <Text type="secondary">今日</Text>
                <Text strong className="detail-value">
                  3,846
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">累计</Text>
                <Text strong className="detail-value">
                  125.8万
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">证照类</Text>
                <Text strong className="detail-value info">
                  32类
                </Text>
              </div>
            </div>
            <div className="stat-trend">
              <span className="trend-up">
                <RiseOutlined /> 较上周 +8.3%
              </span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-3" bordered={false}>
            <div className="stat-card-header">
              <div className="stat-info">
                <Text type="secondary" className="stat-title">
                  12345工单满意度
                </Text>
                <div className="stat-value">
                  <span className="stat-number">98.6</span>
                  <span className="stat-unit">%</span>
                </div>
              </div>
              <div className="stat-icon">
                <CustomerServiceOutlined />
              </div>
            </div>
            <div className="stat-detail">
              <div className="detail-item">
                <Text type="secondary">待办工单</Text>
                <Text strong className="detail-value warning">
                  47
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">已办工单</Text>
                <Text strong className="detail-value success">
                  1,256
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">按时办结率</Text>
                <Text strong className="detail-value info">
                  99.2%
                </Text>
              </div>
            </div>
            <div className="stat-trend">
              <span className="trend-up">
                <RiseOutlined /> 较上月 +1.2%
              </span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-4" bordered={false}>
            <div className="stat-card-header">
              <div className="stat-info">
                <Text type="secondary" className="stat-title">
                  90天审计告警
                </Text>
                <div className="stat-value">
                  <span className="stat-number">23</span>
                  <span className="stat-unit">条</span>
                </div>
              </div>
              <div className="stat-icon">
                <AuditOutlined />
              </div>
            </div>
            <div className="stat-detail">
              <div className="detail-item">
                <Text type="secondary">异常操作</Text>
                <Text strong className="detail-value danger">
                  23
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">总操作数</Text>
                <Text strong className="detail-value">
                  45,860
                </Text>
              </div>
              <div className="detail-item">
                <Text type="secondary">风险等级</Text>
                <Tag color="green" className="risk-tag">
                  低风险
                </Tag>
              </div>
            </div>
            <div className="stat-trend">
              <span className="trend-down">
                <FallOutlined /> 较上周期 -15.3%
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="quick-entry-card" bordered={false} style={{ marginBottom: 16 }}>
        <div className="card-header">
          <Title level={5} className="card-title">
            <ThunderboltOutlined className="title-icon" /> 快捷入口
          </Title>
          <a className="more-link">
            更多 <ArrowRightOutlined />
          </a>
        </div>
        <div className="quick-entry-grid">
          {(roleQuickEntries[currentRole] || roleQuickEntries.default).map((item) => (
            <div key={item.key} className="quick-entry-item" onClick={() => handleNavigateTo(item.key)} style={{ cursor: 'pointer' }}>
              <div className="entry-icon" style={{ background: `${item.color}15`, color: item.color }}>
                {item.icon}
              </div>
              <div className="entry-info">
                <Text strong className="entry-title">
                  {item.title}
                </Text>
                <Text type="secondary" className="entry-desc">
                  {item.desc}
                </Text>
              </div>
              <ArrowRightOutlined style={{ color: '#bfbfbf' }} />
            </div>
          ))}
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card className="chart-card" bordered={false} style={{ marginBottom: 16 }}>
            <ReactECharts option={lineChartOption} style={{ height: 320 }} />
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card className="chart-card" bordered={false}>
                <ReactECharts option={barChartOption} style={{ height: 320 }} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card className="chart-card" bordered={false}>
                <ReactECharts option={pieChartOption} style={{ height: 320 }} />
              </Card>
            </Col>
          </Row>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="side-card" bordered={false} style={{ marginBottom: 16 }}>
            <div className="card-header">
              <Title level={5} className="card-title">
                <ClockCircleOutlined className="title-icon" /> 我的待办
                <Badge count={5} size="small" style={{ marginLeft: 8 }} />
              </Title>
              <a className="more-link" onClick={() => navigate('/tickets')} style={{ cursor: 'pointer' }}>
                全部 <ArrowRightOutlined />
              </a>
            </div>
            <List
              dataSource={todoList}
              renderItem={(item) => (
                <List.Item className="todo-item" onClick={() => handleOpenTodoDetail(item)} style={{ cursor: 'pointer' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={
                          item.priority === 'high' ? (
                            <WarningOutlined />
                          ) : (
                            <FileTextOutlined />
                          )
                        }
                        style={{
                          backgroundColor:
                            item.priority === 'high' ? '#fff1f0' : '#e6f7ff',
                          color: item.priority === 'high' ? '#ff4d4f' : '#1890ff'
                        }}
                      />
                    }
                    title={
                      <div className="todo-title">
                        <span className="todo-text">{item.title}</span>
                        <Tag color={getPriorityColor(item.priority)} className="todo-priority">
                          {getPriorityText(item.priority)}
                        </Tag>
                      </div>
                    }
                    description={
                      <div className="todo-meta">
                        <Text type="secondary">{item.type}</Text>
                        <Text type="secondary">{item.time}</Text>
                      </div>
                    }
                  />
                  <ArrowRightOutlined style={{ color: '#bfbfbf' }} />
                </List.Item>
              )}
            />
          </Card>

          <Card className="side-card" bordered={false} style={{ marginBottom: 16 }}>
            <div className="card-header">
              <Title level={5} className="card-title">
                <BellOutlined className="title-icon" /> 最新公告
              </Title>
              <a className="more-link">
                更多 <ArrowRightOutlined />
              </a>
            </div>
            <List
              dataSource={noticeList}
              renderItem={(item) => (
                <List.Item className="notice-item">
                  <List.Item.Meta
                    title={
                      <div className="notice-title">
                        <Tag color={item.type === '公告' ? 'red' : item.type === '通报' ? 'orange' : 'blue'}>
                          {item.type}
                        </Tag>
                        <span className="notice-text">{item.title}</span>
                      </div>
                    }
                    description={<Text type="secondary">{item.time}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card className="side-card" bordered={false} style={{ marginBottom: 16 }}>
            <div className="card-header">
              <Title level={5} className="card-title">
                <StarOutlined className="title-icon" /> 热门服务推荐
              </Title>
              <Button type="link" onClick={() => navigate('/city-data-secretary')}>数据推荐依据 <ArrowRightOutlined /></Button>
            </div>
            <div className="recommend-grid">
              {hotServices.map((item) => (
                <div key={item.id} className="recommend-item" onClick={() => handleApplyService(item)} style={{ cursor: 'pointer' }}>
                  <div className="recommend-icon">
                    <AppstoreOutlined />
                  </div>
                  <div className="recommend-info">
                    <Text className="recommend-title">
                      {item.title}
                      {item.hot && <span className="hot-tag">HOT</span>}
                    </Text>
                    <Text type="secondary" className="recommend-count">
                      {item.count}人已办
                    </Text>
                  </div>
                  <ArrowRightOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="data-assets-card" bordered={false}>
        <div className="card-header">
          <Title level={5} className="card-title">
            <DatabaseOutlined className="title-icon" /> 数据资产概览
          </Title>
          <Button type="link" onClick={() => navigate('/city-data-secretary')}>进入城市数据秘书 <ArrowRightOutlined /></Button>
        </div>
        <div className="data-assets-grid">
          {dataAssets.map((asset, index) => (
            <div key={index} className="data-asset-item" onClick={() => navigate('/city-data-secretary')} style={{ cursor: 'pointer' }}>
              <div className="asset-icon" style={{ background: `${asset.color}15`, color: asset.color }}>
                {asset.icon}
              </div>
              <div className="asset-info">
                <Text strong className="asset-name">
                  {asset.name}
                </Text>
                <Text className="asset-count" style={{ color: asset.color }}>
                  {asset.count}
                </Text>
              </div>
            </div>
          ))}
        </div>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 12 }}>点击查看个人授权、推荐来源、共享状态、调用留痕</Text>
      </Card>

      <Card bordered={false} style={{ marginTop: 16 }}>
        <div className="card-header">
          <Title level={5} className="card-title">
            <AuditOutlined className="title-icon" /> 关键操作留痕
          </Title>
          <Tag color="green" style={{ marginRight: 8 }}>
            <CheckCircleOutlined /> 所有关键操作均已记录，90天可追溯
          </Tag>
        </div>
        <Table
          dataSource={auditTrailData}
          columns={auditTrailColumns}
          pagination={false}
          size="small"
          bordered
        />
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary">
            <DesktopOutlined /> 登录设备：{userInfo?.loginDevice || '未知'} · 登录IP：{userInfo?.loginIp || '未知'} · 登录方式：{userInfo?.loginMethod || '未知'} · 登录时间：{userInfo?.loginTime || '未知'}
          </Text>
          <Button type="link" icon={<ExportOutlined />} onClick={() => setExportAuditModalVisible(true)}>
            导出审计日志
          </Button>
        </div>
      </Card>

      <Drawer
        title={<Space><ThunderboltOutlined style={{ color: '#0958d9' }} />快速办件 · 一网通办</Space>}
        placement="right"
        width={800}
        open={quickServiceVisible}
        onClose={() => { setQuickServiceVisible(false); setApplyStep(0); setSelectedServiceItem(null); setGuideAnswers({}) }}
      >
        <Steps current={applyStep} size="small" style={{ marginBottom: 24 }}>
          <Steps.Step title="选择事项" />
          <Steps.Step title="情形引导" />
          <Steps.Step title="证照调取" />
          <Steps.Step title="受理确认" />
          <Steps.Step title="办结反馈" />
        </Steps>

        {applyStep === 0 && (
          <div>
            <Input.Search placeholder="搜索服务事项..." style={{ marginBottom: 16 }} size="large" />
            <Title level={5}>热门服务</Title>
            <Row gutter={[12, 12]}>
              {hotServices.map((item) => (
                <Col xs={12} key={item.id}>
                  <Card hoverable onClick={() => { setSelectedServiceItem(item); setApplyStep(1) }} style={{ cursor: 'pointer', borderRadius: 8 }}>
                    <Space>
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: `${item.hot ? '#fff1f0' : '#e6f7ff'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AppstoreOutlined style={{ fontSize: 20, color: item.hot ? '#ff4d4f' : '#1890ff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>
                          {item.title}
                          {item.hot && <Tag color="red" style={{ marginLeft: 8 }}>HOT</Tag>}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color="blue">{item.timeLimit}</Tag>
                          <Tag color={item.fee === '免费' ? 'green' : 'orange'}>{item.fee}</Tag>
                        </div>
                      </div>
                      <ArrowRightOutlined style={{ color: '#bfbfbf' }} />
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {applyStep === 1 && selectedServiceItem && (
          <div>
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
              <Space>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AppstoreOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>{selectedServiceItem.title}</div>
                  <Text type="secondary">{selectedServiceItem.desc}</Text>
                </div>
              </Space>
            </Card>
            <Title level={5}>情形引导</Title>
            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>1. 您的办理类型？</Text>
                <Radio.Group value={guideAnswers[0]} onChange={(e) => setGuideAnswers({ ...guideAnswers, 0: e.target.value })}>
                  <Space direction="vertical">
                    <Radio value="首次申领">首次申领</Radio>
                    <Radio value="换领">换领</Radio>
                    <Radio value="补领">补领</Radio>
                  </Space>
                </Radio.Group>
              </div>
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>2. 您的户籍所在地？</Text>
                <Radio.Group value={guideAnswers[1]} onChange={(e) => setGuideAnswers({ ...guideAnswers, 1: e.target.value })}>
                  <Space direction="vertical">
                    <Radio value="宁夏本地">宁夏本地</Radio>
                    <Radio value="外省迁入">外省迁入</Radio>
                  </Space>
                </Radio.Group>
              </div>
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>3. 是否代办？</Text>
                <Radio.Group value={guideAnswers[2]} onChange={(e) => setGuideAnswers({ ...guideAnswers, 2: e.target.value })}>
                  <Space direction="vertical">
                    <Radio value="本人办理">本人办理</Radio>
                    <Radio value="委托代办">委托代办</Radio>
                  </Space>
                </Radio.Group>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={() => setApplyStep(0)}>上一步</Button>
              <Button type="primary" disabled={!guideAnswers[0] || !guideAnswers[1] || !guideAnswers[2]} onClick={() => setApplyStep(2)}>下一步</Button>
            </div>
          </div>
        )}

        {applyStep === 2 && (
          <div>
            <Title level={5}>证照调取</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>请选择需要调取的电子证照，已关联的证照可直接调取</Text>
            <Checkbox.Group defaultValue={['身份证电子证照', '户口本电子证照']} style={{ width: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Card size="small" style={{ borderRadius: 8 }}>
                  <Checkbox value="身份证电子证照">
                    <Space>
                      <SafetyCertificateOutlined style={{ color: '#0958d9' }} />
                      <span>身份证电子证照</span>
                      <Tag color="green">已关联</Tag>
                    </Space>
                  </Checkbox>
                </Card>
                <Card size="small" style={{ borderRadius: 8 }}>
                  <Checkbox value="户口本电子证照">
                    <Space>
                      <FileTextOutlined style={{ color: '#52c41a' }} />
                      <span>户口本电子证照</span>
                      <Tag color="green">已关联</Tag>
                    </Space>
                  </Checkbox>
                </Card>
                <Card size="small" style={{ borderRadius: 8 }}>
                  <Checkbox value="居住证电子证照">
                    <Space>
                      <FileDoneOutlined style={{ color: '#faad14' }} />
                      <span>居住证电子证照</span>
                      <Tag color="orange">未关联-需上传</Tag>
                    </Space>
                  </Checkbox>
                </Card>
              </Space>
            </Checkbox.Group>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <Button onClick={() => setApplyStep(1)}>上一步</Button>
              <Button type="primary" onClick={() => setApplyStep(3)}>下一步</Button>
            </div>
          </div>
        )}

        {applyStep === 3 && selectedServiceItem && (
          <div>
            <Title level={5}>受理确认</Title>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="事项名称">{selectedServiceItem.title}</Descriptions.Item>
              <Descriptions.Item label="办理类型">{guideAnswers[0] || '-'}</Descriptions.Item>
              <Descriptions.Item label="户籍">{guideAnswers[1] || '-'}</Descriptions.Item>
              <Descriptions.Item label="证照调取情况">身份证、户口本</Descriptions.Item>
              <Descriptions.Item label="承诺时限">{selectedServiceItem.timeLimit}</Descriptions.Item>
              <Descriptions.Item label="收费标准">{selectedServiceItem.fee}</Descriptions.Item>
            </Descriptions>
            <Title level={5}>申请人信息</Title>
            <Form layout="vertical">
              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item label="姓名" required>
                    <Input placeholder="请输入姓名" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="身份证号" required>
                    <Input placeholder="请输入身份证号" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="联系电话" required>
                    <Input placeholder="请输入联系电话" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <Button onClick={() => setApplyStep(2)}>上一步</Button>
              <Button type="primary" onClick={() => setApplyStep(4)} icon={<CheckOutlined />}>确认提交</Button>
            </div>
          </div>
        )}

        {applyStep === 4 && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
            <Title level={4} style={{ color: '#52c41a', marginBottom: 24 }}>申请已受理</Title>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 24, textAlign: 'left' }}>
              <Descriptions.Item label="受理编号">NX20240115001258</Descriptions.Item>
              <Descriptions.Item label="受理时间">{dayjs().format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="预计办结">{dayjs().add(7, 'day').format('YYYY-MM-DD')}</Descriptions.Item>
            </Descriptions>
            <Title level={5} style={{ textAlign: 'left' }}>办理进度</Title>
            <Timeline style={{ textAlign: 'left', marginBottom: 24 }}>
              <Timeline.Item color="green" dot={<CheckCircleOutlined style={{ fontSize: 16 }} />}>已受理 · {dayjs().format('YYYY-MM-DD HH:mm')}</Timeline.Item>
              <Timeline.Item color="blue" dot={<ClockCircleOutlined style={{ fontSize: 16 }} />}>审核中</Timeline.Item>
              <Timeline.Item>制证中</Timeline.Item>
              <Timeline.Item>待领取</Timeline.Item>
            </Timeline>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <Button type="primary" onClick={() => navigate('/tickets')}>查看办件详情</Button>
              <Button onClick={() => { setApplyStep(0); setSelectedServiceItem(null); setGuideAnswers({}) }}>继续办理</Button>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        title={<Space><BellOutlined style={{ color: '#faad14' }} />消息中心 <Badge count={5} size="small" /></Space>}
        placement="right"
        width={640}
        open={messageCenterVisible}
        onClose={() => setMessageCenterVisible(false)}
      >
        <Tabs
          items={[
            {
              key: 'system',
              label: <Space><FileTextOutlined />系统通知 <Badge count={2} size="small" /></Space>,
              children: (
                <List
                  dataSource={systemMessages}
                  renderItem={(item) => (
                    <List.Item
                      style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                      actions={[<Button type="link" size="small"><EyeOutlined />查看详情</Button>]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Tag color={item.type === '通知' ? 'blue' : item.type === '公告' ? 'red' : 'orange'}>{item.type}</Tag>
                            <span style={{ fontWeight: 500 }}>{item.title}</span>
                            {!item.read && <Badge color="red" />}
                          </Space>
                        }
                        description={
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                            <div style={{ marginTop: 8, fontSize: 13 }}>{item.content}</div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )
            },
            {
              key: 'ticket',
              label: <Space><CustomerServiceOutlined />办件提醒 <Badge count={3} size="small" /></Space>,
              children: (
                <List
                  dataSource={ticketReminders}
                  renderItem={(item) => (
                    <List.Item
                      style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                      actions={[<Button type="link" size="small" icon={<EyeOutlined />}>查看办件</Button>]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={item.status === 'success' ? <CheckCircleOutlined /> : <WarningOutlined />}
                            style={{ backgroundColor: item.status === 'success' ? '#f6ffed' : '#fffbe6', color: item.status === 'success' ? '#52c41a' : '#faad14' }}
                          />
                        }
                        title={
                          <Space>
                            <span style={{ fontWeight: 500 }}>{item.title}</span>
                            <Tag color={item.status === 'success' ? 'green' : 'orange'}>{item.type}</Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                            <div style={{ marginTop: 8, fontSize: 13 }}>{item.content}</div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )
            },
            {
              key: 'audit',
              label: <Space><WarningOutlined />审计告警 <Badge count={3} size="small" /></Space>,
              children: (
                <List
                  dataSource={auditAlerts}
                  renderItem={(item) => (
                    <List.Item
                      style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                      actions={[
                        <Button type="link" size="small" icon={<CheckOutlined />} style={{ color: '#52c41a' }}>确认</Button>,
                        <Button type="link" size="small" icon={<RedoOutlined />}>复核</Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={<WarningOutlined />}
                            style={{ backgroundColor: item.level === 'high' ? '#fff1f0' : '#fffbe6', color: item.level === 'high' ? '#ff4d4f' : '#faad14' }}
                          />
                        }
                        title={
                          <Space>
                            <span style={{ fontWeight: 500 }}>{item.title}</span>
                            <Tag color={item.level === 'high' ? 'red' : 'orange'}>{item.type}</Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                            <div style={{ marginTop: 8, fontSize: 13 }}>{item.content}</div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )
            }
          ]}
        />
      </Drawer>

      <Drawer
        title={<Space><FileTextOutlined />待办详情</Space>}
        placement="right"
        width={560}
        open={todoDetailVisible}
        onClose={() => setTodoDetailVisible(false)}
      >
        {selectedTodo && (
          <div>
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="待办标题">{selectedTodo.title}</Descriptions.Item>
              <Descriptions.Item label="待办类型">{selectedTodo.type}</Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={getPriorityColor(selectedTodo.priority)}>{getPriorityText(selectedTodo.priority)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedTodo.time}</Descriptions.Item>
            </Descriptions>

            {selectedTodo.type === '办件事项' && (
              <Card title="办件信息" size="small" style={{ marginBottom: 16 }}>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="申报人">张三</Descriptions.Item>
                  <Descriptions.Item label="身份证号">6401**********0012</Descriptions.Item>
                  <Descriptions.Item label="申报时间">2024-01-15 10:30:00</Descriptions.Item>
                  <Descriptions.Item label="办件编号">NX20240115001258</Descriptions.Item>
                </Descriptions>
                <Divider style={{ margin: '12px 0' }} />
                <Title level={5}>材料清单</Title>
                <List
                  size="small"
                  dataSource={['身份证复印件', '户口本复印件', '申请表', '承诺书']}
                  renderItem={(m) => (
                    <List.Item>
                      <Space>
                        <FileTextOutlined style={{ color: '#0958d9' }} />
                        <span>{m}</span>
                        <Tag color="green">已提交</Tag>
                      </Space>
                    </List.Item>
                  )}
                />
                <Divider style={{ margin: '12px 0' }} />
                <Title level={5}>办理进度</Title>
                <Timeline>
                  <Timeline.Item color="green">提交申请 · 2024-01-15 10:30</Timeline.Item>
                  <Timeline.Item color="green">材料核验通过 · 2024-01-15 11:00</Timeline.Item>
                  <Timeline.Item color="blue">待审核 <Badge status="processing" text="当前节点" /></Timeline.Item>
                  <Timeline.Item>领导审批</Timeline.Item>
                  <Timeline.Item>办结出证</Timeline.Item>
                </Timeline>
              </Card>
            )}

            {selectedTodo.type.includes('工单') && (
              <Card title="工单信息" size="small" style={{ marginBottom: 16 }}>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="工单编号">12345NX202401150008</Descriptions.Item>
                  <Descriptions.Item label="工单来源">12345热线</Descriptions.Item>
                  <Descriptions.Item label="诉求人">李四</Descriptions.Item>
                  <Descriptions.Item label="联系电话">138****5678</Descriptions.Item>
                </Descriptions>
                <Divider style={{ margin: '12px 0' }} />
                <Title level={5}>诉求内容</Title>
                <p style={{ fontSize: 13, lineHeight: 1.6 }}>反映小区门口道路破损严重，影响居民出行，希望相关部门尽快修复。</p>
              </Card>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              {selectedTodo.type === '办件事项' ? (
                <>
                  <Button onClick={() => handleTodoAction('退回补正')} icon={<CloseOutlined />}>退回补正</Button>
                  <Button type="primary" onClick={() => handleTodoAction('审核通过')} icon={<CheckOutlined />}>审核通过</Button>
                </>
              ) : (
                <>
                  <Button onClick={() => handleTodoAction('退回')} icon={<CloseOutlined />}>退回</Button>
                  <Button onClick={() => handleTodoAction('转派')} icon={<RedoOutlined />}>转派</Button>
                  <Button type="primary" onClick={() => handleTodoAction('受理')} icon={<SendOutlined />}>受理</Button>
                </>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title={<Space><ThunderboltOutlined style={{ color: '#0958d9' }} />办理申请</Space>}
        open={applyModalVisible}
        onCancel={() => setApplyModalVisible(false)}
        footer={null}
        width={560}
      >
        {selectedService && (
          <div>
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
              <Space>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AppstoreOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>{selectedService.title}</div>
                  <Text type="secondary">{selectedService.desc}</Text>
                </div>
              </Space>
              <Row style={{ marginTop: 12 }}>
                <Col span={12}><Text type="secondary">承诺时限：</Text><Text strong>{selectedService.timeLimit}</Text></Col>
                <Col span={12}><Text type="secondary">办理费用：</Text><Text strong>{selectedService.fee}</Text></Col>
              </Row>
            </Card>
            <Form form={applyForm} layout="vertical">
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="请输入姓名" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="idCard" label="身份证号" rules={[{ required: true, message: '请输入身份证号' }]}>
                    <Input placeholder="请输入身份证号" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
                    <Input placeholder="请输入联系电话" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="address" label="居住地址">
                <Input placeholder="请输入居住地址" />
              </Form.Item>
              <Form.Item name="applyReason" label="申请说明">
                <Input.TextArea rows={3} placeholder="请简要说明申请原因" />
              </Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <Button onClick={() => setApplyModalVisible(false)}>取消</Button>
                <Button type="primary" onClick={handleSubmitApply} icon={<SendOutlined />}>提交申请</Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title={<Space><ExportOutlined style={{ color: '#0958d9' }} />导出审计日志</Space>}
        open={exportAuditModalVisible}
        onCancel={() => setExportAuditModalVisible(false)}
        width={640}
        footer={[
          <Button key="cancel" onClick={() => setExportAuditModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" icon={<ExportOutlined />} onClick={() => {
            Modal.success({
              title: '导出成功',
              content: (
                <div>
                  <p>导出记录数：1,258 条</p>
                  <p>文件编号：AUDIT-EXP-{dayjs().format('YYYYMMDD')}-{Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
                </div>
              )
            })
            setExportAuditModalVisible(false)
          }}>确认导出</Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>导出范围</Text>
          <div style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>日期范围</Text>
              <DatePicker.RangePicker style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>操作类型</Text>
              <Select mode="multiple" style={{ width: '100%' }} placeholder="请选择操作类型" options={[
                { label: '登录', value: '登录' },
                { label: '审批', value: '审批' },
                { label: '数据导出', value: '数据导出' },
                { label: '权限变更', value: '权限变更' },
                { label: '删除', value: '删除' },
                { label: '配置修改', value: '配置修改' }
              ]} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>复查人</Text>
              <Input placeholder="请输入复查人姓名" />
            </div>
            <div>
              <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>风险等级筛选</Text>
              <Select style={{ width: '100%' }} placeholder="请选择风险等级" options={[
                { label: '全部', value: 'all' },
                { label: '高风险', value: 'high' },
                { label: '中风险', value: 'medium' },
                { label: '低风险', value: 'low' }
              ]} />
            </div>
          </div>
        </div>
        <Divider style={{ margin: '16px 0' }} />
        <div style={{ marginBottom: 16 }}>
          <Text strong>关键操作复查范围</Text>
          <div style={{ marginTop: 8 }}>
            <Checkbox.Group
              value={reviewScopeChecked}
              onChange={(checkedValues) => setReviewScopeChecked(checkedValues as string[])}
              style={{ width: '100%' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Checkbox value="login">登录类操作（异地登录/非工作时间登录/异常设备登录）</Checkbox>
                <Checkbox value="approval">审批类操作（事项审批/权限审批/证照审批）</Checkbox>
                <Checkbox value="data">数据类操作（批量导出/跨部门共享/敏感数据访问）</Checkbox>
                <Checkbox value="config">配置类操作（系统配置/安全策略/角色权限）</Checkbox>
              </div>
            </Checkbox.Group>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">已选择 {reviewScopeChecked.length} 项</Text>
            </div>
          </div>
        </div>
        <Divider style={{ margin: '16px 0' }} />
        <div style={{ marginBottom: 16 }}>
          <Text strong>风险处置状态</Text>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff1f0', borderRadius: 4 }}>
              <span>待处置风险事件</span>
              <Tag color="red">2项</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff7e6', borderRadius: 4 }}>
              <span>处置中风险事件</span>
              <Tag color="orange">3项</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f6ffed', borderRadius: 4 }}>
              <span>已闭环风险事件</span>
              <Tag color="green">15项</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#e6f7ff', borderRadius: 4 }}>
              <span>本月处置完成率</span>
              <Tag color="blue">88.2%</Tag>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>导出范围内所有风险事件均关联处置责任人</Text>
          </div>
        </div>
        <Divider style={{ margin: '16px 0' }} />
        <div style={{ marginBottom: 16 }}>
          <div style={{ padding: 12, background: '#fafafa', borderRadius: 4, border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">追溯周期：</Text>
                <Text>2026-03-18 至 2026-06-16（共90天）</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">操作记录总数：</Text>
                <Text>45,860 条</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">关键操作记录数：</Text>
                <Text>2,158 条</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">复查覆盖率：</Text>
                <Text>100%</Text>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Text strong>90天追溯校验</Text>
          <Text type="secondary" style={{ display: 'block', margin: '8px 0 12px' }}>根据等保三级要求，系统已对近90天内所有关键操作进行追溯校验</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f6ffed', borderRadius: 4 }}>
              <span>审计日志完整性校验</span>
              <Tag color="green">已通过</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f6ffed', borderRadius: 4 }}>
              <span>操作记录关联性校验</span>
              <Tag color="green">已通过</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f6ffed', borderRadius: 4 }}>
              <span>90天留存期合规校验</span>
              <Tag color="green">已通过</Tag>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Dashboard
